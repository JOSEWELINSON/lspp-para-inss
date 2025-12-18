"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
import { useAuth, useFirestore } from "@/firebase";
import { type UserProfile } from "@/lib/data";

const formSchema = z.object({
  fullName: z.string().min(3, { message: "Nome completo é obrigatório." }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "CPF inválido. Use o formato 000.000.000-00." }),
});

export function UserLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

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
    
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Inicialização",
        description: "Serviços do Firebase não estão disponíveis. Tente novamente mais tarde.",
      });
      setIsLoading(false);
      return;
    }

    try {
        // Step 1: Sign in anonymously to get a secure session
        await signInAnonymously(auth);

        // Step 2: Use CPF as the document ID
        const userDocRef = doc(firestore, "users", values.cpf);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // User with this CPF exists
            const existingUserData = userDoc.data() as UserProfile;

            // Validate full name
            if (existingUserData.fullName.toLowerCase() !== values.fullName.toLowerCase()) {
                await auth.signOut(); // Sign out the anonymous user
                toast({
                    variant: "destructive",
                    title: "Acesso Negado",
                    description: "O nome não corresponde ao CPF cadastrado.",
                });
                setIsLoading(false);
                return;
            }
            
            // Name matches, proceed to dashboard
            toast({
                title: "Bem-vindo de volta!",
                description: "Acessando seu painel de benefícios.",
            });

        } else {
            // New user, create a profile using CPF as the ID
            const newUserProfile: UserProfile = {
                id: values.cpf, // Use CPF as the ID
                cpf: values.cpf,
                fullName: values.fullName,
                email: "",
                phone: "",
                address: "",
                birthDate: ""
            };
            await setDoc(userDocRef, newUserProfile);
            
            toast({
                title: "Cadastro realizado com sucesso!",
                description: "Redirecionando para o seu painel.",
            });
        }
        
        // Store CPF in session storage to be used by other pages
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('userCpf', values.cpf);
        }

        router.push("/dashboard");

    } catch (error: any) {
       console.error("Login/Signup Error: ", error);
       if (auth.currentUser) {
           try { await auth.signOut(); } catch(e) {}
       }
       toast({
        variant: "destructive",
        title: "Erro no Login",
        description: error.message || "Não foi possível processar seu acesso. Tente novamente.",
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
