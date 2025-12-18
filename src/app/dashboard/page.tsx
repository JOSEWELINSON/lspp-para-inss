'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  HeartHandshake,
  Paperclip,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RequestStatus, UserRequest } from '@/lib/data';

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Em análise': 'secondary',
    'Exigência': 'outline',
    'Deferido': 'default',
    'Indeferido': 'destructive',
    'Compareça presencialmente': 'default'
};

type User = {
  fullName: string;
  cpf: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myRequests, setMyRequests] = useState<UserRequest[]>([]);

  useEffect(() => {
    try {
        const currentUserCpf = localStorage.getItem('currentUserCpf');
        if (!currentUserCpf) {
            router.push('/');
            return;
        }

        const appDataRaw = localStorage.getItem('appData');
        const appData = appDataRaw ? JSON.parse(appDataRaw) : { users: [], requests: [] };

        const foundUser = appData.users.find((u: User) => u.cpf === currentUserCpf);
        if (foundUser) {
            setUser(foundUser);
            // Filter out 'Indeferido' requests from the main dashboard view
            const userRequests = appData.requests.filter((r: UserRequest) => r.user.cpf === currentUserCpf && r.status !== 'Indeferido');
            setMyRequests(userRequests);
        } else {
            router.push('/');
        }
    } catch(error) {
        console.error("Failed to load dashboard data", error);
        router.push('/');
    }
  }, [router]);

  const recentRequests = myRequests.slice(0, 3);
  const name = user ? user.fullName.split(' ')[0] : '';
  
  if (!user) {
      return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">
          Bem-vindo, {name}!
        </h1>
        <p className="text-muted-foreground">
          Aqui está um resumo de suas atividades e benefícios.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos em Análise
            </CardTitle>
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myRequests.filter((r) => r.status === 'Em análise').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando parecer do INSS.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Benefícios Deferidos
            </CardTitle>
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myRequests.filter((r) => r.status === 'Deferido').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Benefícios já concedidos.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
              <CardTitle>Nova Solicitação</CardTitle>
              <CardDescription>Inicie um novo pedido de benefício de forma rápida e fácil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/solicitar-beneficio">
                <FileText className="mr-2" />
                Solicitar Agora
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
            <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>Acompanhe o status das suas últimas solicitações.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Benefício</TableHead>
                        <TableHead>Protocolo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentRequests.length > 0 ? recentRequests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.benefitTitle}</TableCell>
                                <TableCell>{request.protocol}</TableCell>
                                <TableCell>{new Date(request.requestDate).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>
                                    <Badge variant={statusVariant[request.status] || 'secondary'}>{request.status}</Badge>
                                </TableCell>
                            </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">Nenhuma solicitação recente.</TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
