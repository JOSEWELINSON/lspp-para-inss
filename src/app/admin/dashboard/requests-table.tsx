
"use client";

import { useState, useMemo, Fragment } from 'react';
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
import { MoreHorizontal, AlertTriangle, User, ShieldCheck, FileText, Loader2, Link as LinkIcon, Paperclip } from 'lucide-react';
import { type RequestStatus, type UserRequest, type Documento } from '@/lib/data';
import {
  AlertDialog,
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
import { useCollection, useFirestore, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Em análise': 'secondary',
    'Exigência': 'outline',
    'Deferido': 'default',
    'Indeferido': 'destructive',
    'Compareça presencialmente': 'default'
};

const allStatuses: RequestStatus[] = ['Em análise', 'Exigência', 'Deferido', 'Indeferido', 'Compareça presencialmente'];
const activeStatuses: RequestStatus[] = ['Em análise', 'Exigência', 'Compareça presencialmente'];
const finishedStatuses: RequestStatus[] = ['Deferido', 'Indeferido'];

const formatDate = (date: any) => {
    if (!date) return '';
    if (typeof date === 'string') return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    if (date.seconds) return format(date.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    return '';
}

const viewDocument = (doc: Documento) => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('documentToView', JSON.stringify(doc));
        window.open('/view-document', '_blank');
    }
};

function RequestsList({ requests, onRowClick, isLoading }: { requests: UserRequest[], onRowClick: (request: UserRequest) => void, isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center text-muted-foreground h-48 flex justify-center items-center">
                Nenhuma solicitação encontrada nesta categoria.
            </div>
        );
    }
    
    return (
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
                {requests.map((request) => (
                    <TableRow key={request.id} onClick={() => onRowClick(request)} className="cursor-pointer">
                        <TableCell className="font-medium">{request.user.name}</TableCell>
                        <TableCell>{request.user.cpf}</TableCell>
                        <TableCell>{request.benefitTitle}</TableCell>
                        <TableCell>{request.protocol}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}


export function AdminRequestsTable() {
    const firestore = useFirestore();
    const requestsCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'requests') : null, [firestore]);
    const { data: allRequests, isLoading } = useCollection<UserRequest>(requestsCollectionRef);
    
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isExigenciaSubmitting, setIsExigenciaSubmitting] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<UserRequest | null>(null);
    const [exigenciaText, setExigenciaText] = useState("");
    
    const sortedRequests = useMemo(() => {
        if (!allRequests) return [];
        return [...allRequests].sort((a, b) => {
            const dateA = a.requestDate as any;
            const dateB = b.requestDate as any;
            return (dateB?.seconds ?? 0) - (dateA?.seconds ?? 0);
        });
    }, [allRequests]);

    const filteredRequests = useMemo(() => ({
        active: sortedRequests.filter(req => activeStatuses.includes(req.status)),
        finished: sortedRequests.filter(req => finishedStatuses.includes(req.status)),
        all: sortedRequests
    }), [sortedRequests]);

    
    const openDetailsModal = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsDetailsModalOpen(true);
    };

    const handleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
        if (!firestore || !currentRequest) return;

        const updatedRequestData = { ...currentRequest, status: newStatus };

        if (newStatus === 'Exigência') {
             // Close main modal and open exigencia modal without changing status yet
             setIsDetailsModalOpen(false);
             setIsExigenciaSubmitting(true);
        } else {
            const requestRef = doc(firestore, 'requests', requestId);
            const payload: Partial<UserRequest> = { status: newStatus };
            
            updateDoc(requestRef, payload)
              .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: requestRef.path, operation: 'update', requestResourceData: payload }));
              });
            // Optimistically update the local state
            setCurrentRequest(updatedRequestData);
        }
    };
    
    const handleExigenciaSubmit = async () => {
        if (!currentRequest || !exigenciaText || !firestore) return;

        const exigenciaData = {
            text: exigenciaText,
            createdAt: new Date().toISOString()
        };

        const requestRef = doc(firestore, 'requests', currentRequest.id);
        const payload = {
            status: 'Exigência' as RequestStatus,
            exigencia: exigenciaData
        };

        updateDoc(requestRef, payload)
          .catch(error => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: requestRef.path, operation: 'update', requestResourceData: payload }));
          });
        
        // Optimistically update the local state and close modals
        setCurrentRequest({ ...currentRequest, ...payload });
        setIsExigenciaSubmitting(false);
        setExigenciaText("");
        setIsDetailsModalOpen(true); // Re-open details modal
    };

    const closeModal = () => {
        setIsDetailsModalOpen(false);
        setIsExigenciaSubmitting(false);
        setExigenciaText("");
        setTimeout(() => setCurrentRequest(null), 300);
    }
    
    return (
        <Fragment>
            <Tabs defaultValue="active" className="w-full">
                <div className="px-4 pt-4">
                    <TabsList>
                        <TabsTrigger value="active">Ativas</TabsTrigger>
                        <TabsTrigger value="finished">Finalizadas</TabsTrigger>
                        <TabsTrigger value="all">Todas</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="active">
                    <RequestsList requests={filteredRequests.active} onRowClick={openDetailsModal} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="finished">
                    <RequestsList requests={filteredRequests.finished} onRowClick={openDetailsModal} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="all">
                    <RequestsList requests={filteredRequests.all} onRowClick={openDetailsModal} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
            
            {currentRequest && (
                <AlertDialog open={isDetailsModalOpen || isExigenciaSubmitting} onOpenChange={(open) => !open && closeModal()}>
                    {isExigenciaSubmitting ? (
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cadastrar Nova Exigência</AlertDialogTitle>
                                <AlertDialogDescription>Descreva a pendência que o segurado precisa resolver.</AlertDialogDescription>
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
                                <Button variant="ghost" onClick={() => { setIsExigenciaSubmitting(false); setIsDetailsModalOpen(true); }}>Cancelar</Button>
                                <Button onClick={handleExigenciaSubmit} disabled={!exigenciaText.trim()}>Enviar Exigência</Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    ) : (
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
                                        <p className="text-muted-foreground">{formatDate(currentRequest.requestDate)}</p>
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
                                        {currentRequest.documents && currentRequest.documents.length > 0 && (
                                            <div>
                                                <p className="font-semibold text-sm flex items-center gap-2 mb-2"><Paperclip /> Documentos Anexados:</p>
                                                <div className="grid gap-2">
                                                    {currentRequest.documents.map((doc, index) => (
                                                        <button onClick={() => viewDocument(doc)} key={index} className="flex w-full text-left items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                                                            <LinkIcon className="h-4 w-4" />
                                                            <span className="text-sm font-medium text-primary underline">{doc.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                {/* Exigencia Section */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <AlertTriangle className="text-orange-500" />
                                        Histórico de Exigências
                                    </h3>
                                    {currentRequest.exigencia ? (
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
                                                    <p className="text-xs text-muted-foreground">INSS em {formatDate(currentRequest.exigencia.createdAt)}</p>
                                                </div>
                                            </div>

                                            {currentRequest.exigencia.response && (
                                                <div className="flex gap-3">
                                                    <div className="flex-1 space-y-1 text-right">
                                                        <div className="bg-primary text-primary-foreground rounded-lg p-3 inline-block text-left">
                                                            <p className="text-sm">{currentRequest.exigencia.response.text}</p>
                                                        </div>
                                                        {currentRequest.exigencia.response.documents && currentRequest.exigencia.response.documents.length > 0 && (
                                                            <div className="text-left mt-2">
                                                                <p className="font-semibold text-sm flex items-center gap-2 mb-2 justify-end"><Paperclip /> Documentos da Resposta:</p>
                                                                <div className="grid gap-2">
                                                                    {currentRequest.exigencia.response.documents.map((doc, index) => (
                                                                        <button onClick={() => viewDocument(doc)} key={index} className="flex w-full justify-end text-right items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                                                                            <span className="text-sm font-medium text-primary underline">{doc.name}</span>
                                                                            <LinkIcon className="h-4 w-4" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">Segurado em {formatDate(currentRequest.exigencia.response.respondedAt!)}</p>
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

                            <AlertDialogFooter className="flex items-center justify-between w-full pt-4">
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
                    )}
                </AlertDialog>
            )}

        </Fragment>
    );
}

    