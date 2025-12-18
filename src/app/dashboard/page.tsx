'use client';
import Link from 'next/link';
import {
  FileText,
  HeartHandshake,
  Paperclip,
  Loader2
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
import type { RequestStatus, UserRequest, UserProfile } from '@/lib/data';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { useMemo, useEffect, useState } from 'react';

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Em análise': 'secondary',
    'Exigência': 'outline',
    'Deferido': 'default',
    'Indeferido': 'destructive',
    'Compareça presencialmente': 'default'
};

function getUserCpf() {
    if (typeof window !== 'undefined') {
        return window.sessionStorage.getItem('userCpf');
    }
    return null;
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const userCpf = getUserCpf();

  const userDocRef = useMemoFirebase(() => userCpf ? doc(firestore, 'users', userCpf) : null, [userCpf, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
  
  const requestsQuery = useMemoFirebase(() => userCpf ? query(collection(firestore, 'requests'), where('userId', '==', userCpf)) : null, [userCpf, firestore]);
  const { data: allRequests, isLoading: areRequestsLoading } = useCollection<UserRequest>(requestsQuery);

  const myRequests = useMemo(() => {
    if (!allRequests) return [];
    return allRequests.filter(r => r.status !== 'Indeferido');
  }, [allRequests]);

  const recentRequests = myRequests.slice(0, 3);
  const name = userProfile ? userProfile.fullName.split(' ')[0] : '';
  
  const isLoading = isUserLoading || isProfileLoading || areRequestsLoading;

  if (isLoading) {
      return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">
                    Carregando...
                </h1>
                <p className="text-muted-foreground">
                    Buscando suas informações.
                </p>
            </div>
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
      </div>
      );
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
                                <TableCell>{request.requestDate ? new Date((request.requestDate as any).seconds * 1000).toLocaleDateString('pt-BR') : '-'}</TableCell>
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
