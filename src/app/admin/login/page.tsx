
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowRight, Loader2, UserCog } from "lucide-react";
import { signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
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
      email: "welinsonsilva17@gmail.com",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    if (values.email !== "welinsonsilva17@gmail.com" || values.password !== "INSS17WE") {
        toast({
            variant: "destructive",
            title: "Credenciais Inválidas",
            description: "O e-mail ou a senha estão incorretos.",
        });
        setIsLoading(false);
        return;
    }
    
    try {
      // For the prototype, we sign in anonymously to get permissions to read the admin list.
      // In a real app, you'd use a custom claim set by a backend.
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);

      // This is a mock check. In a real app, the rules would enforce this.
      // Here, we just check if any admin is configured, as we can't set custom claims client-side.
      // The firestore.rules allow any authenticated user to read /admins.
      // We are just simulating the login check here.
      
      // Let's pretend the anonymous user is the admin for prototype purposes
      // A more robust check would involve a server-side function to grant custom claims.
      // Since we are validating email/password client-side, this is a reasonable
      // simplification for the prototype.
      
      const adminEmailDocRef = doc(firestore, 'admins', "welinsonsilva17@gmail.com");
      const adminEmailDoc = await getDoc(adminEmailDocRef);
      
      // A simplified check. In reality, you'd have a backend verify and set a custom claim.
      if (values.email === "welinsonsilva17@gmail.com") {
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
