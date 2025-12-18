
"use client";

import { useState, useEffect, Fragment, useMemo } from 'react';
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
import { MoreHorizontal, AlertTriangle, User, ShieldCheck, FileText } from 'lucide-react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Em análise': 'secondary',
    'Exigência': 'outline',
    'Deferido': 'default',
    'Indeferido': 'destructive',
    'Compareça presencialmente': 'default'
};

const allStatuses: RequestStatus[] = ['Em análise', 'Exigência', 'Deferido', 'Indeferido', 'Compareça presencialmente'];
const activeStatuses: RequestStatus[] = ['Em análise', 'Exigência', 'Compareça presencialmente'];


export function AdminRequestsTable() {
    const [allRequests, setAllRequests] = useState<UserRequest[]>([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isExigenciaSubmitting, setIsExigenciaSubmitting] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<UserRequest | null>(null);
    const [exigenciaText, setExigenciaText] = useState("");
    const [showAll, setShowAll] = useState(false);


    useEffect(() => {
        try {
            const appDataRaw = localStorage.getItem('appData');
            if (appDataRaw) {
                const appData = JSON.parse(appDataRaw);
                setAllRequests((appData.requests || []).sort((a:UserRequest, b:UserRequest) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
            }
        } catch (error) {
            console.error("Failed to load requests for admin", error);
        }
    }, []);

    const displayedRequests = useMemo(() => {
        if (showAll) {
            return allRequests;
        }
        return allRequests.filter(req => activeStatuses.includes(req.status));
    }, [allRequests, showAll]);


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
    
    const openDetailsModal = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsDetailsModalOpen(true);
    };

    const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
        if (newStatus === 'Exigência' && currentRequest) {
            setIsExigenciaSubmitting(true);
        } else {
            const updatedRequests = allRequests.map(req => 
                req.id === requestId ? { ...req, status: newStatus, exigencia: newStatus !== 'Exigência' ? req.exigencia : req.exigencia ? {...req.exigencia, response: undefined} : undefined } : req
            );
            setAllRequests(updatedRequests);
            updateRequestsInStorage(updatedRequests);
            const updatedCurrentRequest = updatedRequests.find(req => req.id === requestId) || null;
            setCurrentRequest(updatedCurrentRequest);
        }
    };
    
    const handleExigenciaSubmit = () => {
        if (!currentRequest || !exigenciaText) return;

        const updatedRequests = allRequests.map(req => 
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

        setAllRequests(updatedRequests);
        updateRequestsInStorage(updatedRequests);
        
        const updatedCurrentRequest = updatedRequests.find(req => req.id === currentRequest.id) || null;
        setCurrentRequest(updatedCurrentRequest);

        // Reset and close sub-modal
        setIsExigenciaSubmitting(false);
        setExigenciaText("");
    };

    const closeModal = () => {
        setIsDetailsModalOpen(false);
        setIsExigenciaSubmitting(false);
        setExigenciaText("");
        // A small delay to allow the modal to close before clearing the data
        setTimeout(() => setCurrentRequest(null), 300);
    }


    return (
        <Fragment>
            <div className="flex justify-end p-4">
                <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                    {showAll ? 'Ver Apenas Ativos' : 'Ver Todos'}
                </Button>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Segurado</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Benefício Solicitado</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Status Atual</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {displayedRequests.length > 0 ? displayedRequests.map((request) => (
                    <TableRow key={request.id} onClick={() => openDetailsModal(request)} className="cursor-pointer">
                        <TableCell className="font-medium">{request.user.name}</TableCell>
                        <TableCell>{request.user.cpf}</TableCell>
                        <TableCell>{request.benefitTitle}</TableCell>
                        <TableCell>{request.protocol}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                        </TableCell>
                    </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            {showAll ? "Nenhuma solicitação encontrada." : "Nenhuma solicitação ativa no momento."}
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            
            {currentRequest && (
                <AlertDialog open={isDetailsModalOpen} onOpenChange={(open) => !open && closeModal()}>
                    <AlertDialogContent className="max-w-3xl">
                        <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <FileText />
                            Detalhes da Solicitação
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Visualize e gerencie a solicitação de {currentRequest.user.name}.
                        </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-6 -mr-6">
                            {/* Request Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold">Segurado</p>
                                    <p className="text-muted-foreground">{currentRequest.user.name}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">CPF</p>
                                    <p className="text-muted-foreground">{currentRequest.user.cpf}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Protocolo</p>
                                    <p className="text-muted-foreground">{currentRequest.protocol}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Data</p>
                                    <p className="text-muted-foreground">{format(new Date(currentRequest.requestDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                </div>
                            </div>
                            
                            <Separator />

                            {/* Initial Request Details */}
                            <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FileText />
                                    Dados Iniciais da Solicitação
                                </h3>
                                <div className="space-y-4 border rounded-lg p-4 bg-background">
                                    <div>
                                        <p className="font-semibold text-sm">Descrição do usuário:</p>
                                        <p className="text-sm text-muted-foreground italic mt-1">"{currentRequest.description}"</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Documentos Anexados:</p>
                                        {(currentRequest.documents && currentRequest.documents.length > 0) ? (
                                            <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                                                {currentRequest.documents.map((doc, i) => (
                                                    <li key={i}>{doc.name}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic mt-1">Nenhum documento foi anexado na abertura do pedido.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Exigencia Section */}
                            <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <AlertTriangle className="text-orange-500" />
                                    Histórico de Exigências
                                </h3>
                                
                                {isExigenciaSubmitting ? (
                                    <div className="grid gap-4 py-4 border bg-muted p-4 rounded-lg">
                                        <div className="grid gap-2">
                                            <Label htmlFor="exigencia-text">Descrição da Nova Exigência</Label>
                                            <Textarea
                                                id="exigencia-text"
                                                placeholder="Ex: É necessário apresentar o RG original e um comprovante de residência atualizado..."
                                                value={exigenciaText}
                                                onChange={(e) => setExigenciaText(e.target.value)}
                                                rows={5}
                                            />
                                        </div>
                                         <div className="flex justify-end gap-2">
                                            <Button variant="ghost" onClick={() => setIsExigenciaSubmitting(false)}>Cancelar</Button>
                                            <Button onClick={handleExigenciaSubmit} disabled={!exigenciaText.trim()}>Enviar Exigência</Button>
                                        </div>
                                    </div>
                                ) : currentRequest.exigencia ? (
                                    <div className="space-y-4 border rounded-lg p-4">
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
                                                     <div className="bg-primary text-primary-foreground rounded-lg p-3 inline-block text-left">
                                                        <p className="text-sm">{currentRequest.exigencia.response.text}</p>
                                                        
                                                         <div className="mt-2 text-xs border-t border-primary-foreground/50 pt-2">
                                                            <p className="font-semibold">Arquivos enviados:</p>
                                                            {(currentRequest.exigencia.response.files && currentRequest.exigencia.response.files.length > 0) ? (
                                                                <ul className="list-disc pl-4">
                                                                    {currentRequest.exigencia.response.files.map((file, i) => (
                                                                        <li key={i}>{file.name}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="italic">O usuário não anexou documentos.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Segurado em {new Date(currentRequest.exigencia.response.respondedAt!).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                 <Avatar className="h-8 w-8">
                                                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                                </Avatar>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground p-4 border rounded-lg bg-background text-center">Nenhuma exigência para esta solicitação.</p>
                                )}
                            </div>
                        </div>

                        <AlertDialogFooter className="flex items-center justify-between w-full">
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-medium">Status:</span>
                             <Badge variant={statusVariant[currentRequest.status]}>{currentRequest.status}</Badge>
                           </div>
                           <div className="flex gap-2">
                                <AlertDialogCancel onClick={closeModal}>Fechar</AlertDialogCancel>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button>
                                            Despachar
                                            <MoreHorizontal className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {allStatuses.map(status => (
                                            <DropdownMenuItem 
                                                key={status}
                                                onClick={() => handleStatusChange(currentRequest!.id, status)}
                                                disabled={currentRequest!.status === status}
                                            >
                                                Marcar como "{status}"
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                           </div>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

        </Fragment>
    );
}
