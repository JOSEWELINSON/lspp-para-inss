'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type RequestStatus, type UserRequest } from '@/lib/data';

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Em análise': 'secondary',
    'Exigência': 'outline',
    'Deferido': 'default',
    'Indeferido': 'destructive',
    'Compareça presencialmente': 'default'
};

const statusColorClasses: Record<RequestStatus, string> = {
    'Em análise': 'bg-yellow-500',
    'Exigência': 'bg-orange-500',
    'Deferido': 'bg-green-500',
    'Indeferido': 'bg-red-500',
    'Compareça presencialmente': 'bg-blue-500'
};


export default function MeusPedidosPage() {
    const router = useRouter();
    const [myRequests, setMyRequests] = useState<UserRequest[]>([]);

    useEffect(() => {
        try {
            const currentUserCpf = localStorage.getItem('currentUserCpf');
            if (!currentUserCpf) {
                router.push('/');
                return;
            }

            const appDataRaw = localStorage.getItem('appData');
            if(appDataRaw){
                const appData = JSON.parse(appDataRaw);
                const userRequests = appData.requests.filter((r: UserRequest) => r.user.cpf === currentUserCpf);
                setMyRequests(userRequests);
            }
        } catch(error) {
            console.error("Failed to load requests from local storage", error);
        }
    }, [router]);

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Meus Pedidos</h1>
            <p className="text-muted-foreground">Acompanhe o andamento de todas as suas solicitações.</p>
        </div>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="hidden w-[100px] sm:table-cell">
                            <span className="sr-only">Status Icon</span>
                        </TableHead>
                        <TableHead>Benefício</TableHead>
                        <TableHead>Protocolo</TableHead>
                        <TableHead className="hidden md:table-cell">Data da Solicitação</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {myRequests.length > 0 ? myRequests.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell className="hidden sm:table-cell">
                                <div className={`w-3 h-3 rounded-full ${statusColorClasses[request.status]}`}></div>
                            </TableCell>
                            <TableCell className="font-medium">{request.benefitTitle}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{request.protocol}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                {new Date(request.requestDate).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Você ainda não fez nenhuma solicitação.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
