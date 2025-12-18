"use client";

import { useState, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, File as FileIcon, X } from "lucide-react";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import imageCompression from "browser-image-compression";
import jsPDF from 'jspdf';


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { benefits, type UserRequest, type UserProfile, type Documento } from "@/lib/data";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  benefitId: z.string({ required_error: "Por favor, selecione um benefício." }),
  description: z.string().min(10, {
    message: "A descrição deve ter pelo menos 10 caracteres.",
  }),
});

function getUserCpf() {
    if (typeof window !== 'undefined') {
        return window.sessionStorage.getItem('userCpf');
    }
    return null;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function SolicitarBeneficioForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const userCpf = getUserCpf();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const userDocRef = useMemoFirebase(() => userCpf ? doc(firestore, 'users', userCpf) : null, [userCpf, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsSubmitting(true);

    const selectedFiles = Array.from(e.target.files);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    const otherFiles = selectedFiles.filter(file => !file.type.startsWith('image/'));
    const processedFiles: File[] = [];

    // Process other files (PDFs, etc.)
    for (const file of otherFiles) {
        if (file.size > 1024 * 1024) { // 1MB limit for non-images
            toast({
                variant: "destructive",
                title: "Arquivo Muito Grande",
                description: `O arquivo "${file.name}" excede o limite de 1MB e não pode ser enviado.`,
            });
        } else {
            processedFiles.push(file);
        }
    }

    // Process image files into a single PDF
    if (imageFiles.length > 0) {
        try {
            const pdf = new jsPDF();
            let isFirstImage = true;

            for (const file of imageFiles) {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                const imgData = await fileToDataUrl(compressedFile);
                const img = new Image();
                img.src = imgData;
                await new Promise(resolve => { img.onload = resolve; });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (img.height * pdfWidth) / img.width;
                
                if (!isFirstImage) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                isFirstImage = false;
            }
            
            const pdfBlob = pdf.getBlob();
            const pdfFile = new File([pdfBlob], 'imagens-comprovantes.pdf', { type: 'application/pdf' });
            
            processedFiles.push(pdfFile);
            toast({
                title: "Imagens Convertidas",
                description: `${imageFiles.length} imagem(ns) foram comprimidas e agrupadas em um único PDF.`,
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Falha na Conversão de Imagem",
                description: "Não foi possível processar as imagens para PDF.",
            });
        }
    }
    
    setFilesToUpload(prevFiles => [...prevFiles, ...processedFiles]);
    setIsSubmitting(false);
    // Reset file input to allow selecting the same file again
    if(e.target) e.target.value = '';
  };


  const removeFile = (index: number) => {
    setFilesToUpload(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userCpf || !userProfile) {
        toast({
            variant: 'destructive',
            title: "Erro de Autenticação",
            description: "Usuário não encontrado. Faça o login novamente.",
        });
        router.push('/');
        return;
    }

    setIsSubmitting(true);
    
    try {
        const protocol = `2024${Date.now().toString().slice(-6)}`;
        const selectedBenefit = benefits.find(b => b.id === values.benefitId);
        
        const uploadedDocuments: Documento[] = [];
        for (const file of filesToUpload) {
            // Final check, although logic should prevent this
            if (file.size > 1024 * 1024 * 1.5) { // Adding a 1.5MB buffer just in case
                toast({
                    variant: "destructive",
                    title: "Arquivo Muito Grande",
                    description: `O arquivo "${file.name}" excede o limite de 1MB. Remova-o para continuar.`,
                });
                setIsSubmitting(false);
                return;
            }
            const dataUrl = await fileToDataUrl(file);
            uploadedDocuments.push({ name: file.name, type: file.type, dataUrl });
        }


        const newRequest: Omit<UserRequest, 'id'> = {
            protocol,
            benefitId: values.benefitId,
            benefitTitle: selectedBenefit?.title || 'Benefício Desconhecido',
            requestDate: serverTimestamp(),
            status: 'Em análise',
            description: values.description,
            userId: userCpf, 
            user: {
                name: userProfile.fullName,
                cpf: userProfile.cpf,
            },
            documents: uploadedDocuments
        };
    
        await addDoc(collection(firestore, 'requests'), newRequest);

        toast({
          title: "Solicitação Enviada com Sucesso!",
          description: `Seu pedido foi registrado e está em análise. Protocolo: ${protocol}`,
        });

        router.push("/dashboard/meus-pedidos");

    } catch (error: any) {
        console.error("Failed to save request:", error);
        toast({
          variant: "destructive",
          title: "Erro ao Enviar Solicitação",
          description: "Não foi possível registrar seu pedido. Tente novamente.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const isLoading = isUserLoading || isSubmitting;

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Formulário de Solicitação</CardTitle>
            <CardDescription>Preencha os dados abaixo para iniciar seu pedido de benefício.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="benefitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Benefício</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o benefício desejado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {benefits.map(benefit => (
                        <SelectItem key={benefit.id} value={benefit.id}>
                          {benefit.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Situação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva em detalhes sua situação, motivo do pedido, etc."
                      className="resize-none"
                      rows={6}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Esta informação ajudará na análise do seu pedido.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
                <FormLabel>Anexar Documentos (PDF, Foto)</FormLabel>
                <div className="flex flex-col gap-4">
                  <Input 
                      id="file-upload"
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                      multiple 
                      disabled={isLoading}
                      ref={fileInputRef}
                      accept="image/*,application/pdf"
                  />
                  <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isLoading}
                      className="w-fit"
                  >
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Arquivos
                  </Button>
                  <p className="text-sm text-muted-foreground">
                      Imagens serão agrupadas em um único PDF. Outros arquivos devem ser menores que 1MB.
                  </p>
                </div>
            </div>

            {filesToUpload.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Arquivos selecionados:</h4>
                    <div className="grid gap-2">
                        {filesToUpload.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm text-foreground truncate" title={file.name}>{file.name}</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-6 w-6 flex-shrink-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}


          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
