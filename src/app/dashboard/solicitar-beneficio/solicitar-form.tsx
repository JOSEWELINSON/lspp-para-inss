
"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, Link as LinkIcon, Paperclip } from "lucide-react";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { benefits, type UserRequest, type Document, type UserProfile } from "@/lib/data";
import { useDoc, useFirestore, useUser, useMemoFirebase, useStorage } from "@/firebase";
import { uploadFile } from "@/firebase/storage";


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

export function SolicitarBeneficioForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const userCpf = getUserCpf();

  const userDocRef = useMemoFirebase(() => userCpf ? doc(firestore, 'users', userCpf) : null, [userCpf, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFilesToUpload(Array.from(e.target.files));
    }
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
        const requestId = `${userCpf}-${Date.now()}`;
        
        let uploadedDocuments: Document[] = [];
        if (filesToUpload.length > 0) {
            const uploadPromises = filesToUpload.map(file => 
                uploadFile(storage, file, `requests/${requestId}/${file.name}`)
            );
            uploadedDocuments = await Promise.all(uploadPromises);
        }
        
        const protocol = `2024${Date.now().toString().slice(-6)}`;
        const selectedBenefit = benefits.find(b => b.id === values.benefitId);
        
        const newRequest: Omit<UserRequest, 'id'> = {
            protocol,
            benefitId: values.benefitId,
            benefitTitle: selectedBenefit?.title || 'Benefício Desconhecido',
            requestDate: serverTimestamp(),
            status: 'Em análise',
            description: values.description,
            documents: uploadedDocuments,
            userId: userCpf, 
            user: {
                name: userProfile.fullName,
                cpf: userProfile.cpf,
            }
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
          description: error.message?.includes('storage/unauthorized') 
            ? "Você não tem permissão para enviar arquivos." 
            : error.message?.includes('storage/object-not-found') 
            ? "O arquivo não foi encontrado."
            : error.message?.includes('size-exceeded')
            ? "O arquivo excede o tamanho máximo de 20MB."
            : "Não foi possível registrar seu pedido. Tente novamente.",
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
            <FormItem>
              <FormLabel>Anexar Documentos</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type="file" className="pl-12" multiple onChange={handleFileChange} disabled={isLoading} />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Upload className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Anexe RG, CPF, comprovante de residência, laudos médicos, etc. (Máx: 20MB por arquivo).
              </FormDescription>
              {filesToUpload.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <p className="font-medium">Arquivos a serem enviados:</p>
                    <ul className="list-disc pl-5">
                        {filesToUpload.map((file, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <Paperclip className="h-3 w-3" />
                                {file.name}
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </FormItem>
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
