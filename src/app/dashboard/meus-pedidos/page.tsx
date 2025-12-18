
'use client';
import { useEffect, useState, Fragment, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, Send, User, ShieldCheck, FileText, Loader2, Link as LinkIcon, Paperclip } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type RequestStatus, type UserRequest, type Document } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useUser, useMemoFirebase, useStorage } from '@/firebase';
import { collection, doc, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { uploadFile } from '@/firebase/storage';
import { useToast } from '@/hooks/use-toast';

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

export default function MeusPedidosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const userCpf = getUserCpf();
    
    const requestsQuery = useMemoFirebase(() => userCpf ? query(collection(firestore, 'requests'), where('userId', '==', userCpf)) : null, [userCpf, firestore]);
    const { data: myRequests, isLoading } = useCollection<UserRequest>(requestsQuery);

    const [isExigenciaModalOpen, setIsExigenciaModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<UserRequest | null>(null);
    const [exigenciaResponseText, setExigenciaResponseText] = useState("");
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    
    const openDetailsModal = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsDetailsModalOpen(true);
    };

    const handleOpenExigencia = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsExigenciaModalOpen(true);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFilesToUpload(Array.from(e.target.files));
        }
    };

    const handleCumprirExigencia = async () => {
        if (!currentRequest || !userCpf) return;
        setIsUploading(true);

        try {
            let uploadedDocuments: Document[] = [];
            if (filesToUpload.length > 0) {
                const uploadPromises = filesToUpload.map(file => 
                    uploadFile(storage, file, `requests/${currentRequest.id}/${file.name}`)
                );
                uploadedDocuments = await Promise.all(uploadPromises);
            }

            const response = {
                text: exigenciaResponseText,
                files: uploadedDocuments,
                respondedAt: new Date().toISOString(),
            };
            
            const requestRef = doc(firestore, 'requests', currentRequest.id);
            const payload = {
                status: 'Em análise' as RequestStatus,
                exigencia: {
                    ...currentRequest.exigencia,
                    response: response,
                }
            };
            
            await updateDoc(requestRef, payload);
            
            toast({
                title: "Exigência Cumprida!",
                description: "Sua resposta foi enviada e o pedido está em reanálise."
            });
            
            setIsExigenciaModalOpen(false);
            setExigenciaResponseText("");
            setFilesToUpload([]);
            const updatedRequest = { ...currentRequest, ...payload };
            setCurrentRequest(updatedRequest);
            setIsDetailsModalOpen(true);

        } catch (error) {
            console.error("Failed to update exigencia", error);
            toast({
                variant: "destructive",
                title: "Falha no Envio",
                description: "Não foi possível enviar sua resposta. Tente novamente."
            });
        } finally {
            setIsUploading(false);
        }
    };
    
    const formatDate = (date: any) => {
        if (!date) return '';
        if (typeof date === 'string') return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        if (date.seconds) return format(date.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        return '';
    }

    const getPrazoExigencia = (createdAt: any) => {
        const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
        const prazo = addDays(date, 30);
        return format(prazo, "dd/MM/yyyy");
    };

  return (
    <Fragment>
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Meus Pedidos</h1>
                <p className="text-muted-foreground">Acompanhe o andamento de todas as suas solicitações.</p>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Benefício</TableHead>
                            <TableHead>Protocolo</TableHead>
                            <TableHead className="hidden md:table-cell">Data da Solicitação</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : myRequests && myRequests.length > 0 ? myRequests.map((request) => (
                            <TableRow key={request.id} onClick={() => openDetailsModal(request)} className={`cursor-pointer ${request.status === 'Exigência' ? 'bg-orange-100/50 dark:bg-orange-900/20' : ''}`}>
                                <TableCell className="font-medium">{request.benefitTitle}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{request.protocol}</Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {formatDate(request.requestDate)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    {request.status === 'Exigência' && !request.exigencia?.response && (
                                        <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation(); handleOpenExigencia(request)}}>
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Responder
                                        </Button>
                                    )}
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

        {/* Details Modal */}
        {currentRequest && (
            <AlertDialog open={isDetailsModalOpen} onOpenChange={(open) => !open && setCurrentRequest(null)}>
                <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <FileText />
                        Detalhes da Solicitação
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Protocolo: {currentRequest.protocol}
                    </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-6 -mr-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Benefício Solicitado</p>
                                <p className="text-muted-foreground">{currentRequest.benefitTitle}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Data</p>
                                <p className="text-muted-foreground">{formatDate(currentRequest.requestDate)}</p>
                            </div>
                            <div>
                                <div className="font-semibold">Status</div>
                                <Badge variant={statusVariant[currentRequest.status]}>{currentRequest.status}</Badge>
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2">
                                <AlertTriangle className="text-orange-500" />
                                Histórico de Exigências
                            </h3>
                            {currentRequest.exigencia ? (
                                <div className="space-y-4 border rounded-lg p-4 bg-background">
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

                                    {currentRequest.exigencia.response ? (
                                         <div className="flex gap-3">
                                            <div className="flex-1 space-y-1 text-right">
                                                <div className="bg-primary text-primary-foreground rounded-lg p-3 inline-block text-left">
                                                    <p className="text-sm">{currentRequest.exigencia.response.text}</p>
                                                    {currentRequest.exigencia.response.files && currentRequest.exigencia.response.files.length > 0 && (
                                                        <div className="mt-2 text-xs border-t border-primary-foreground/50 pt-2">
                                                            <p className="font-semibold">Arquivos enviados:</p>
                                                            <ul className="list-disc pl-4">
                                                                {currentRequest.exigencia.response.files.map((file, i) => (
                                                                    <li key={i}>
                                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300 flex items-center gap-1">
                                                                            <LinkIcon className="h-3 w-3" />
                                                                            {file.name}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Você em {formatDate(currentRequest.exigencia.response.respondedAt!)}</p>
                                            </div>
                                             <Avatar className="h-8 w-8">
                                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                            </Avatar>
                                        </div>
                                    ) : (
                                        <Card className="bg-orange-50 border-orange-200 mt-4 text-center">
                                            <CardContent className="p-3">
                                                <p className="text-sm text-orange-800">
                                                    Você tem uma exigência pendente. Clique em "Responder" na tela anterior para cumpri-la.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 border rounded-lg bg-background text-center">Nenhuma exigência para esta solicitação.</p>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDetailsModalOpen(false)}>Fechar</AlertDialogCancel>
                         {currentRequest.status === 'Exigência' && !currentRequest.exigencia?.response && (
                            <Button onClick={(e) => {
                                e.stopPropagation();
                                setIsDetailsModalOpen(false);
                                handleOpenExigencia(currentRequest);
                            }}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Responder Exigência
                            </Button>
                         )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}


        {/* Respond to Exigencia Modal */}
        {currentRequest?.exigencia && (
            <AlertDialog open={isExigenciaModalOpen} onOpenChange={setIsExigenciaModalOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" />
                            Cumprir Exigência
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Protocolo: {currentRequest.protocol}
                            {' | '}
                            Prazo: <strong>{getPrazoExigencia(currentRequest.exigencia.createdAt)}</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
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

                        {currentRequest.exigencia.response ? (
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-1 text-right">
                                    <div className="bg-primary text-primary-foreground rounded-lg p-3 inline-block text-left">
                                        <p className="text-sm">{currentRequest.exigencia.response.text}</p>
                                        {currentRequest.exigencia.response.files && currentRequest.exigencia.response.files.length > 0 && (
                                            <div className="mt-2 text-xs border-t border-primary-foreground/50 pt-2">
                                                <p className="font-semibold">Arquivos enviados:</p>
                                                <ul className="list-disc pl-4">
                                                    {currentRequest.exigencia.response.files.map((file, i) => (
                                                         <li key={i}>
                                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300 flex items-center gap-1">
                                                                <LinkIcon className="h-3 w-3" />
                                                                {file.name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Você em {formatDate(currentRequest.exigencia.response.respondedAt!)}</p>
                                </div>
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                </Avatar>
                            </div>
                        ) : (
                            <Fragment>
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <Label htmlFor="response-text" className="font-semibold">Sua Resposta</Label>
                                    <Textarea
                                        id="response-text"
                                        placeholder="Escreva uma resposta para o servidor do INSS..."
                                        value={exigenciaResponseText}
                                        onChange={(e) => setExigenciaResponseText(e.target.value)}
                                        rows={4}
                                        disabled={isUploading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="response-files" className="font-semibold">Anexar Documentos</Label>
                                    <div className="relative">
                                        <Input type="file" id="response-files" className="pl-12" multiple onChange={handleFileChange} disabled={isUploading} />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Upload className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <FormDescription>
                                        Máx: 20MB por arquivo.
                                    </FormDescription>
                                     {isUploading && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Carregando arquivos...</span>
                                        </div>
                                    )}
                                    {filesToUpload.length > 0 && (
                                        <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                            <p className="font-medium">Arquivos a serem enviados:</p>
                                            <ul className="list-disc pl-5">
                                                {filesToUpload.map((file, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <Paperclip className="h-3 w-3" />
                                                        {file.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </Fragment>
                        )}
                         {currentRequest.exigencia.response && (
                             <Card className="bg-green-50 border-green-200 mt-4">
                                <CardContent className="p-3">
                                    <p className="text-sm text-green-800">Você já respondeu a esta exigência. Sua solicitação está em reanálise.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setFilesToUpload([]); setExigenciaResponseText(""); }}>Fechar</AlertDialogCancel>
                         {!currentRequest.exigencia.response && (
                            <AlertDialogAction onClick={handleCumprirExigencia} disabled={!exigenciaResponseText.trim() || isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {isUploading ? 'Enviando...' : 'Enviar Resposta'}
                            </AlertDialogAction>
                         )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
    </Fragment>
  );
}
