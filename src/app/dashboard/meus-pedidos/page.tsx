import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { myRequests, type RequestStatus } from '@/lib/data';

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
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Meus Pedidos</h1>
            <p className="text-muted-foreground">Acompanhe o andamento de todas as suas solicitações.</p>
        </div>
        <Card>
            <CardContent className="p-0">
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
                        {myRequests.map((request) => (
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
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
