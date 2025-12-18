"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";

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
import { benefits, type UserRequest, type Document } from "@/lib/data";

const formSchema = z.object({
  benefitId: z.string({ required_error: "Por favor, selecione um benefício." }),
  description: z.string().min(10, {
    message: "A descrição deve ter pelo menos 10 caracteres.",
  }),
  documents: z.any().optional(),
});

type User = {
    fullName: string;
    cpf: string;
}

export function SolicitarBeneficioForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });
  
  const fileRef = form.register("documents");

  useEffect(() => {
    try {
        const currentUserCpf = localStorage.getItem('currentUserCpf');
        if (!currentUserCpf) {
            router.push('/');
            return;
        }

        const appDataRaw = localStorage.getItem('appData');
        const appData = appDataRaw ? JSON.parse(appDataRaw) : { users: [] };
        const foundUser = appData.users.find((u: User) => u.cpf === currentUserCpf);

        if(foundUser) {
            setUser(foundUser);
        } else {
            router.push('/');
        }
    } catch(e) {
        console.error("Failed to get user for request form", e);
        router.push('/');
    }
  }, [router]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: 'destructive',
            title: "Erro de Autenticação",
            description: "Usuário não encontrado. Faça o login novamente.",
        });
        router.push('/');
        return;
    }

    setIsLoading(true);
    
    const protocol = `2024${Date.now().toString().slice(-6)}`;
    const selectedBenefit = benefits.find(b => b.id === values.benefitId);
    
    const documentFiles = values.documents as FileList | null;
    const documents: Document[] = [];

    if (documentFiles) {
        for (const file of Array.from(documentFiles)) {
             // We no longer convert to base64 to avoid storage quota errors.
             // We will just store the file name. The URL will be a placeholder.
            documents.push({ name: file.name, url: "" });
        }
    }

    const newRequest: UserRequest = {
        id: new Date().toISOString(),
        protocol,
        benefitTitle: selectedBenefit?.title || 'Benefício Desconhecido',
        requestDate: new Date().toISOString(),
        status: 'Em análise',
        description: values.description,
        documents: documents,
        user: {
            name: user.fullName,
            cpf: user.cpf,
        }
    };
    
    try {
        const appDataRaw = localStorage.getItem('appData');
        const appData = appDataRaw ? JSON.parse(appDataRaw) : { users: [], requests: [] };
        
        appData.requests.unshift(newRequest);
        localStorage.setItem('appData', JSON.stringify(appData));

        toast({
          title: "Solicitação Enviada com Sucesso!",
          description: `Seu pedido foi registrado e está em análise. Protocolo: ${protocol}`,
        });

        setIsLoading(false);
        router.push("/dashboard/meus-pedidos");

    } catch (error: any) {
        console.error("Failed to save request", error);
        
        const isQuotaError = error.name === 'QuotaExceededError';

        toast({
          variant: "destructive",
          title: isQuotaError ? "Erro de Armazenamento" : "Erro ao Salvar Solicitação",
          description: isQuotaError ? "O armazenamento local está cheio. Tente limpar o cache do navegador ou remover solicitações antigas." : "Não foi possível registrar seu pedido. Tente novamente.",
        });
        setIsLoading(false);
    }
  }

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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    />
                  </FormControl>
                  <FormDescription>
                    Esta informação ajudará na análise do seu pedido.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anexar Documentos (Opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="file" className="pl-12" multiple {...fileRef} />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Upload className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Anexe RG, CPF, comprovante de residência, laudos médicos, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitação
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
