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
import { MoreHorizontal, AlertTriangle, User, ShieldCheck } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
    
    const openExigenciaModal = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsExigenciaModalOpen(true);
    };

    const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
        if (newStatus === 'Exigência') {
            const requestToUpdate = requests.find(req => req.id === requestId);
            if(requestToUpdate){
                openExigenciaModal(requestToUpdate);
            }
        } else {
            const updatedRequests = requests.map(req => 
                req.id === requestId ? { ...req, status: newStatus } : req
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
                    <TableHead>Protocolo</TableHead>
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
                    <TableCell>{request.protocol}</TableCell>
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
                            {request.status === 'Exigência' && request.exigencia && (
                                <>
                                  <DropdownMenuItem onClick={() => openExigenciaModal(request)}>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Ver Exigência
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                            )}
                            {allStatuses.map(status => (
                                <DropdownMenuItem 
                                    key={status}
                                    onClick={() => handleStatusChange(request.id, status)}
                                    disabled={request.status === status && status !== 'Exigência'}
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
            
            {currentRequest && (
                <AlertDialog open={isExigenciaModalOpen} onOpenChange={setIsExigenciaModalOpen}>
                    <AlertDialogContent className="max-w-2xl">
                        <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" />
                            Exigência do Protocolo {currentRequest?.protocol}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Acompanhe ou crie a exigência para o segurado.
                        </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                            {!currentRequest.exigencia ? (
                                // Create new exigencia
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
                            ) : (
                                // View existing exigencia conversation
                                <div className="space-y-4">
                                     <div className="flex gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-primary">
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                <ShieldCheck className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="bg-muted rounded-lg p-3">
                                                <p className="text-sm text-foreground">{currentRequest.exigencia.text}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">INSS em {new Date(currentRequest.exigencia.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    {currentRequest.exigencia.response && (
                                         <div className="flex gap-3">
                                            <div className="flex-1 space-y-1 text-right">
                                                <div className="bg-blue-100 dark:bg-blue-900/50 text-foreground rounded-lg p-3 inline-block text-left">
                                                    <p className="text-sm">{currentRequest.exigencia.response.text}</p>
                                                    {currentRequest.exigencia.response.files && currentRequest.exigencia.response.files.length > 0 && (
                                                        <div className="mt-2 text-xs border-t border-blue-200 dark:border-blue-800 pt-2">
                                                            <p className="font-semibold">Arquivos enviados:</p>
                                                            <ul className="list-disc pl-4">
                                                                {currentRequest.exigencia.response.files.map((file, i) => <li key={i}>{file}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Segurado em {new Date(currentRequest.exigencia.response.respondedAt!).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                             <Avatar className="h-8 w-8">
                                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => { setExigenciaText(""); setCurrentRequest(null); }}>Fechar</AlertDialogCancel>
                            {!currentRequest.exigencia && (
                                <AlertDialogAction onClick={handleExigenciaSubmit} disabled={!exigenciaText.trim()}>Enviar Exigência</AlertDialogAction>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

        </Fragment>
    );
}
