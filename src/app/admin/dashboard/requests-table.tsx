"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { type RequestStatus, type UserRequest } from '@/lib/data';

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Em análise': 'secondary',
    'Exigência': 'outline',
    'Deferido': 'default',
    'Indeferido': 'destructive',
    'Compareça presencialmente': 'default'
};

const allStatuses: RequestStatus[] = ['Em análise', 'Exigência', 'Deferido', 'Indeferido', 'Compareça presencialmente'];

export function AdminRequestsTable() {
    const [requests, setRequests] = useState<UserRequest[]>([]);

    useEffect(() => {
        try {
            const allRequests = localStorage.getItem('myRequests');
            if (allRequests) {
                setRequests(JSON.parse(allRequests));
            }
        } catch (error) {
            console.error("Failed to load requests for admin", error);
        }
    }, []);

    const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
        const updatedRequests = requests.map(req => 
            req.id === requestId ? { ...req, status: newStatus } : req
        );
        setRequests(updatedRequests);
        try {
            localStorage.setItem('myRequests', JSON.stringify(updatedRequests));
        } catch (error) {
            console.error("Failed to save request status", error);
        }
    };

    return (
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Segurado</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Benefício Solicitado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead>
                <span className="sr-only">Ações</span>
                </TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {requests.map((request) => (
                <TableRow key={request.id}>
                <TableCell className="font-medium">{request.user.name}</TableCell>
                <TableCell>{request.user.cpf}</TableCell>
                <TableCell>{request.benefitTitle}</TableCell>
                <TableCell>{new Date(request.requestDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                    <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Despachar</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allStatuses.map(status => (
                            <DropdownMenuItem 
                                key={status}
                                onClick={() => handleStatusChange(request.id, status)}
                                disabled={request.status === status}
                            >
                                Marcar como "{status}"
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    );
}
