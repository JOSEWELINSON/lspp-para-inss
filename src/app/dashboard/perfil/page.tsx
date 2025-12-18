'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { type UserProfile } from '@/lib/data';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

function getUserCpf() {
    if (typeof window !== 'undefined') {
        return window.sessionStorage.getItem('userCpf');
    }
    return null;
}

export default function PerfilPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const userCpf = getUserCpf();

  const userDocRef = useMemoFirebase(() => userCpf ? doc(firestore, 'users', userCpf) : null, [userCpf, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
        setFormData({
            fullName: userProfile.fullName || '',
            cpf: userProfile.cpf || '',
            birthDate: userProfile.birthDate || '',
            phone: userProfile.phone || '',
            email: userProfile.email || '',
            address: userProfile.address || '',
        });
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  }

  const handleSave = async () => {
    if (!userDocRef) return;
    setIsSaving(true);
    try {
        // We shouldn't allow changing the name or CPF from the profile page
        // as they are used for login identification.
        const dataToUpdate: Partial<UserProfile> = {
            birthDate: formData.birthDate,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
        };
        await updateDoc(userDocRef, dataToUpdate);
        toast({
            title: "Perfil Atualizado!",
            description: "Suas informações foram salvas com sucesso."
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Não foi possível salvar suas informações."
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (isUserLoading || isProfileLoading) {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Mantenha seus dados atualizados para facilitar futuras solicitações.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" value={formData.fullName || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={formData.cpf || ''} disabled />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} type="date"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="(00) 00000-0000"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} placeholder="seu@email.com"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={formData.address || ''} onChange={handleInputChange} placeholder="Sua rua, número, bairro..."/>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
