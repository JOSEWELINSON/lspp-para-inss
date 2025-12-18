"use client";

import { useState, useEffect, Fragment } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
    const [isExigenciaModalOpen, setIsExigenciaModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<UserRequest | null>(null);
    const [exigenciaText, setExigenciaText] = useState("");


    useEffect(() => {
        try {
            const appDataRaw = localStorage.getItem('appData');
            if (appDataRaw) {
                const appData = JSON.parse(appDataRaw);
                setRequests(appData.requests || []);
            }
        } catch (error) {
            console.error("Failed to load requests for admin", error);
        }
    }, []);

    const updateRequestsInStorage = (updatedRequests: UserRequest[]) => {
        try {
            const appDataRaw = localStorage.getItem('appData');
            const appData = appDataRaw ? JSON.parse(appDataRaw) : { users: [], requests: [] };
            appData.requests = updatedRequests;
            localStorage.setItem('appData', JSON.stringify(appData));
        } catch (error) {
            console.error("Failed to save request status", error);
        }
    };

    const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
        if (newStatus === 'Exigência') {
            const requestToUpdate = requests.find(req => req.id === requestId);
            if(requestToUpdate){
                setCurrentRequest(requestToUpdate);
                setIsExigenciaModalOpen(true);
            }
        } else {
            const updatedRequests = requests.map(req => 
                req.id === requestId ? { ...req, status: newStatus, exigencia: newStatus === 'Exigência' ? req.exigencia : undefined } : req
            );
            setRequests(updatedRequests);
            updateRequestsInStorage(updatedRequests);
        }
    };
    
    const handleExigenciaSubmit = () => {
        if (!currentRequest || !exigenciaText) return;

        const updatedRequests = requests.map(req => 
            req.id === currentRequest.id 
            ? { 
                ...req, 
                status: 'Exigência' as RequestStatus,
                exigencia: {
                    text: exigenciaText,
                    createdAt: new Date().toISOString()
                }
              } 
            : req
        );

        setRequests(updatedRequests);
        updateRequestsInStorage(updatedRequests);

        // Reset and close modal
        setIsExigenciaModalOpen(false);
        setExigenciaText("");
        setCurrentRequest(null);
    };


    return (
        <Fragment>
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
            <AlertDialog open={isExigenciaModalOpen} onOpenChange={setIsExigenciaModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Criar Exigência para o Protocolo {currentRequest?.protocol}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Descreva abaixo o que o segurado precisa fornecer para cumprir a exigência. Ele terá 30 dias para responder.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="exigencia-text">Descrição da Exigência</Label>
                            <Textarea
                                id="exigencia-text"
                                placeholder="Ex: É necessário apresentar o RG original e um comprovante de residência atualizado..."
                                value={exigenciaText}
                                onChange={(e) => setExigenciaText(e.target.value)}
                                rows={5}
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setExigenciaText("")}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExigenciaSubmit} disabled={!exigenciaText.trim()}>Enviar Exigência</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Fragment>
    );
}