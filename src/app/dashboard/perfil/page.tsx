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

type User = {
  fullName: string;
  cpf: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function PerfilPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
      fullName: '',
      cpf: '',
      birthDate: '',
      phone: '',
      email: '',
      address: ''
  });

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

      if (foundUser) {
        setUser(foundUser);
        setFormData({
            fullName: foundUser.fullName || '',
            cpf: foundUser.cpf || '',
            birthDate: foundUser.birthDate || '',
            phone: foundUser.phone || '',
            email: foundUser.email || '',
            address: foundUser.address || '',
        })
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error("Failed to load profile data", error);
      router.push('/');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  }

  const handleSave = () => {
    if (!user) return;

    try {
        const appDataRaw = localStorage.getItem('appData');
        const appData = appDataRaw ? JSON.parse(appDataRaw) : { users: [], requests: [] };

        const userIndex = appData.users.findIndex((u: User) => u.cpf === user.cpf);

        if (userIndex !== -1) {
            const updatedUser = {
                ...appData.users[userIndex],
                ...formData,
            };
            appData.users[userIndex] = updatedUser;
            localStorage.setItem('appData', JSON.stringify(appData));

            toast({
                title: "Perfil Atualizado!",
                description: "Suas informações foram salvas com sucesso."
            });
        } else {
             toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Usuário não encontrado. Faça o login novamente."
            });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Salvar",
            description: "Não foi possível salvar suas informações."
        });
    }
  };
  
  if (!user) {
    return null; // or a loading spinner
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
                <Input id="fullName" value={formData.fullName} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={formData.cpf} disabled />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" value={formData.birthDate} onChange={handleInputChange} type="date"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="seu@email.com"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={formData.address} onChange={handleInputChange} placeholder="Sua rua, número, bairro..."/>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
