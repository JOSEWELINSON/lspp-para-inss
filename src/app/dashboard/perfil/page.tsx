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
import { mockUser as defaultUser } from '@/lib/data';

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
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
            fullName: parsedUser.fullName || '',
            cpf: parsedUser.cpf || '',
            birthDate: parsedUser.birthDate || defaultUser.birthDate,
            phone: parsedUser.phone || defaultUser.phone,
            email: parsedUser.email || defaultUser.email,
            address: parsedUser.address || defaultUser.address,
        })
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  }

  const handleSave = () => {
    try {
        const updatedUser = {
            ...user,
            ...formData,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
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
                <Input id="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={formData.address} onChange={handleInputChange} />
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
