"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { mockUser } from "@/lib/data";

const formSchema = z.object({
  fullName: z.string().min(3, { message: "Nome completo é obrigatório." }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "CPF inválido. Use o formato 000.000.000-00." }),
});

export function UserLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      cpf: "",
    },
  });
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) {
      value = value.substring(0, 11);
    }
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    form.setValue("cpf", value);
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const appDataRaw = localStorage.getItem('appData');
      const appData = appDataRaw ? JSON.parse(appDataRaw) : { users: [], requests: [] };
      
      let user = appData.users.find((u: any) => u.cpf === values.cpf);

      if (user) {
        // User exists, just log in
        if(user.fullName.toLowerCase() !== values.fullName.toLowerCase()) {
            toast({
                variant: "destructive",
                title: "Acesso Negado",
                description: "O nome completo não corresponde ao CPF cadastrado.",
            });
            setIsLoading(false);
            return;
        }
        toast({
          title: "Bem-vindo de volta!",
          description: "Acessando seu painel de benefícios.",
        });
      } else {
        // New user, register and log in
        user = {
          cpf: values.cpf,
          fullName: values.fullName,
          birthDate: mockUser.birthDate,
          phone: mockUser.phone,
          email: mockUser.email,
          address: mockUser.address,
        };
        appData.users.push(user);
        localStorage.setItem('appData', JSON.stringify(appData));
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Redirecionando para o seu painel.",
        });
      }
      
      // Set current user for the session
      localStorage.setItem("currentUserCpf", values.cpf);

      router.push("/dashboard");

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro de Armazenamento",
        description: "Não foi possível acessar os dados no seu navegador. Verifique as permissões.",
      });
       setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center pb-4">
            <Logo />
        </div>
        <CardTitle className="text-2xl font-bold">Acesse sua Conta</CardTitle>
        <CardDescription>
          Entre com seu nome completo e CPF para gerenciar seus benefícios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} onChange={handleCpfChange} value={field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Entrar / Cadastrar <ArrowRight className="ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-center text-sm">
            <Link href="/admin/login" className="text-sm text-primary hover:underline">
                Acesso para profissionais do INSS
            </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
