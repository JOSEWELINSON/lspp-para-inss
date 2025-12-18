"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowRight, Loader2, UserCog } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


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

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "welinson@inss.gov.br",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    // Hardcoded credentials check for prototype
    if (values.email !== "welinson@inss.gov.br" || values.password !== "INSS17WE") {
        toast({
            variant: "destructive",
            title: "Credenciais Inválidas",
            description: "Usuário ou senha incorretos para o acesso de administrador.",
        });
        setIsLoading(false);
        return;
    }
    
    try {
        // We sign in anonymously for the prototype to get a UID, then check for admin role.
        // In a real app, you would use Email/Password provider.
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password).catch(async (error) => {
          // If user does not exist, we can't check for admin role.
          // For this prototype, we'll just show an invalid credentials error.
          // In a real app, you might handle this differently (e.g. user not found).
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
               throw new Error("Credenciais Inválidas");
          }
          throw error;
      });

      const user = userCredential.user;

      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists() && adminDoc.data().isAdmin) {
         toast({
            title: "Login de administrador bem-sucedido!",
            description: "Redirecionando para o painel de controle.",
        });
        router.push("/admin/dashboard");
      } else {
        await auth.signOut();
        toast({
            variant: "destructive",
            title: "Acesso Negado",
            description: "Você não tem permissão de administrador.",
        });
      }
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: error.message || "Ocorreu um erro. Tente novamente.",
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center pb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <UserCog /> Acesso Profissional
          </CardTitle>
          <CardDescription>
            Área restrita para servidores do INSS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.gov.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha" {...field} />
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
                    Acessar Painel <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm">
                <Link href="/" className="text-sm text-primary hover:underline">
                    Voltar para o login de usuário
                </Link>
            </div>
        </CardFooter>
      </Card>
    </main>
  );
}
