
'use client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminRequestsTable } from './requests-table';
import { Button } from '@/components/ui/button';
import { LogOut, User, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { type UserRequest } from '@/lib/data';
import { useMemo } from 'react';

function AdminHeader() {
    return (
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-10">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <Logo />
                    <span className="sr-only">LSPP do INSS</span>
                </Link>
                <Link
                    href="/admin/dashboard"
                    className="text-foreground transition-colors hover:text-foreground"
                >
                    Painel do Servidor
                </Link>
            </nav>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="ml-auto flex-1 sm:flex-initial">
                    {/* can add search here */}
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Analista INSS</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                           <Link href="/">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                           </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

function StatCards({ requests }: { requests: UserRequest[] }) {
    const stats = useMemo(() => {
        const total = requests.length;
        const emAnalise = requests.filter(r => r.status === 'Em análise').length;
        const comExigencia = requests.filter(r => r.status === 'Exigência').length;
        const finalizados = requests.filter(r => r.status === 'Deferido' || r.status === 'Indeferido').length;
        return { total, emAnalise, comExigencia, finalizados };
    }, [requests]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">O número total de pedidos recebidos.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendentes de Análise</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.emAnalise}</div>
                    <p className="text-xs text-muted-foreground">Aguardando a primeira análise do servidor.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Com Exigência</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.comExigencia}</div>
                    <p className="text-xs text-muted-foreground">Aguardando resposta do segurado.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.finalizados}</div>
                    <p className="text-xs text-muted-foreground">Pedidos deferidos ou indeferidos.</p>
                </CardContent>
            </Card>
        </div>
    );
}


export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const requestsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'requests') : null, [firestore]);
  const { data: allRequests, isLoading } = useCollection<UserRequest>(requestsCollectionRef);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
            <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Painel do Analista</h1>
                <p className="text-muted-foreground">
                    Visualize e gerencie as solicitações de benefícios dos segurados.
                </p>
            </div>
            
            <StatCards requests={allRequests || []} />

            <AdminRequestsTable requests={allRequests || []} isLoading={isLoading} />
        </main>
    </div>
  );
}
