"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { signInAnonymously, type User } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, limit, writeBatch, getDoc } from "firebase/firestore";

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
        // Step 1: Query for existing user by CPF
        const usersRef = collection(firestore, "users");
        const q = query(usersRef, where("cpf", "==", values.cpf), limit(1));
        const querySnapshot = await getDocs(q);

        // Step 2: Sign in anonymously to get a stable, authenticated session UID for this login attempt.
        const userCredential = await signInAnonymously(auth);
        const authUser = userCredential.user;

        if (!querySnapshot.empty) {
            // User with this CPF exists
            const existingUserDoc = querySnapshot.docs[0];
            const existingUserData = existingUserDoc.data() as UserProfile;

            // Step 3a: Validate full name
            if (existingUserData.fullName.toLowerCase() !== values.fullName.toLowerCase()) {
                await authUser.delete(); // Clean up the newly created anonymous user
                toast({
                    variant: "destructive",
                    title: "Acesso Negado",
                    description: "O nome não corresponde ao CPF cadastrado.",
                });
                setIsLoading(false);
                return;
            }
            
            // Step 3b: User is validated. Now, ensure the current auth UID is linked to the profile.
            // If the current auth UID is different from the one stored, we "migrate" the profile.
            if (existingUserDoc.id !== authUser.uid) {
                const batch = writeBatch(firestore);
                
                const oldDocRef = doc(firestore, 'users', existingUserDoc.id);
                const newDocRef = doc(firestore, 'users', authUser.uid);
                
                const newProfileData: UserProfile = {
                    ...existingUserData, // copy all data from the old profile
                    id: authUser.uid,     // update the ID to the new auth UID
                };
                
                batch.set(newDocRef, newProfileData); // Create the new document with the new UID
                batch.delete(oldDocRef);             // Delete the old document
                
                await batch.commit();
            }
            
            toast({
                title: "Bem-vindo de volta!",
                description: "Acessando seu painel de benefícios.",
            });

        } else {
            // Step 4: New user, create a profile using the new anonymous user's UID as the document ID
            const newUserProfile: UserProfile = {
                id: authUser.uid,
                cpf: values.cpf,
                fullName: values.fullName,
                email: "",
                phone: "",
                address: "",
                birthDate: ""
            };
            const userRef = doc(firestore, "users", authUser.uid);
            await setDoc(userRef, newUserProfile);
            
            toast({
                title: "Cadastro realizado com sucesso!",
                description: "Redirecionando para o seu painel.",
            });
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
