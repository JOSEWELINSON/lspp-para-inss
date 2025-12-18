import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminRequestsTable } from './requests-table';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
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
                <Button asChild variant="outline" size="sm">
                    <Link href="/">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 animate-in fade-in-50">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Solicitações de Benefícios</h1>
                <p className="text-muted-foreground">
                    Visualize e gerencie todas as solicitações pendentes e concluídas.
                </p>
            </div>
            <Card>
                <CardContent className="p-0">
                    <AdminRequestsTable />
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
