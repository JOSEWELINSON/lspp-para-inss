
'use client';
import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, Send, User, ShieldCheck, FileText } from 'lucide-react';
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

const statusVariant: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Em análise': 'secondary',
    'Exigência': 'outline',
    'Deferido': 'default',
    'Indeferido': 'destructive',
    'Compareça presencialmente': 'default'
};

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export default function MeusPedidosPage() {
    const router = useRouter();
    const [myRequests, setMyRequests] = useState<UserRequest[]>([]);
    const [isExigenciaModalOpen, setIsExigenciaModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<UserRequest | null>(null);
    const [exigenciaResponseText, setExigenciaResponseText] = useState("");
    const [exigenciaFiles, setExigenciaFiles] = useState<File[]>([]);
    
    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = () => {
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
    };
    
    const openDetailsModal = (request: UserRequest) => {
        // Try to get the full request from session storage, which might contain data URLs
        try {
            const sessionRequestRaw = sessionStorage.getItem(request.id);
            if (sessionRequestRaw) {
                setCurrentRequest(JSON.parse(sessionRequestRaw));
            } else {
                setCurrentRequest(request);
            }
        } catch {
             setCurrentRequest(request);
        }
        setIsDetailsModalOpen(true);
    };

    const handleOpenExigencia = (request: UserRequest) => {
        setCurrentRequest(request);
        setExigenciaResponseText(request.exigencia?.response?.text || "");
        setIsExigenciaModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setExigenciaFiles(Array.from(e.target.files));
        }
    };

    const handleCumprirExigencia = async () => {
        if (!currentRequest) return;

        try {
            const appDataRaw = localStorage.getItem('appData');
            if (!appDataRaw) return;

            const appData = JSON.parse(appDataRaw);
            
            const documents: Document[] = [];
            for (const file of exigenciaFiles) {
                const url = await fileToDataURL(file);
                documents.push({ name: file.name, url: url });
            }

            let fullRequestWithDataUrls = { ...currentRequest };

            const updatedRequests = appData.requests.map((req: UserRequest) => {
                if (req.id === currentRequest.id && req.exigencia) {
                    const response = {
                        text: exigenciaResponseText,
                        files: documents,
                        respondedAt: new Date().toISOString(),
                    };
                    
                    fullRequestWithDataUrls = {
                         ...req,
                        status: 'Em análise' as RequestStatus,
                        exigencia: {
                            ...req.exigencia,
                            response: response,
                        }
                    };
                    
                    // Return version for localStorage (without file content)
                    return {
                         ...req,
                        status: 'Em análise' as RequestStatus,
                        exigencia: {
                            ...req.exigencia,
                            response: {
                                ...response,
                                files: documents.map(({name}) => ({ name, url: ''}))
                            },
                        }
                    };
                }
                return req;
            });
            
            appData.requests = updatedRequests;
            localStorage.setItem('appData', JSON.stringify(appData));
            
            // Save the version with data URLs to session storage
            sessionStorage.setItem(currentRequest.id, JSON.stringify(fullRequestWithDataUrls));
            
            loadRequests();
            setIsExigenciaModalOpen(false);
            setExigenciaResponseText("");
            setExigenciaFiles([]);
            setCurrentRequest(fullRequestWithDataUrls);
            setIsDetailsModalOpen(true);

        } catch (error) {
            console.error("Failed to update exigencia", error);
        }
    };

    const getPrazoExigencia = (createdAt: string) => {
        const prazo = addDays(new Date(createdAt), 30);
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
                        {myRequests.length > 0 ? myRequests.map((request) => (
                            <TableRow key={request.id} onClick={() => openDetailsModal(request)} className={`cursor-pointer ${request.status === 'Exigência' ? 'bg-orange-100/50 dark:bg-orange-900/20' : ''}`}>
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
                                <TableCell>
                                    {request.status === 'Exigência' && (
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
                                <p className="text-muted-foreground">{format(new Date(currentRequest.requestDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Status</p>
                                <p><Badge variant={statusVariant[currentRequest.status]}>{currentRequest.status}</Badge></p>
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
                                            <p className="text-xs text-muted-foreground">INSS em {new Date(currentRequest.exigencia.createdAt).toLocaleDateString('pt-BR')}</p>
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
                                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                                                                            {file.name}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Você em {new Date(currentRequest.exigencia.response.respondedAt!).toLocaleDateString('pt-BR')}</p>
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
                                <p className="text-xs text-muted-foreground">INSS em {new Date(currentRequest.exigencia.createdAt).toLocaleDateString('pt-BR')}</p>
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
                                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                                                                {file.name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Você em {new Date(currentRequest.exigencia.response.respondedAt!).toLocaleDateString('pt-BR')}</p>
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
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="response-files" className="font-semibold">Anexar Documentos</Label>
                                    <div className="relative">
                                        <Input type="file" id="response-files" className="pl-12" multiple onChange={handleFileChange} />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Upload className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    {exigenciaFiles.length > 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            <p>Arquivos selecionados:</p>
                                            <ul className="list-disc pl-5">
                                                {exigenciaFiles.map(file => <li key={file.name}>{file.name}</li>)}
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
                        <AlertDialogCancel>Fechar</AlertDialogCancel>
                         {!currentRequest.exigencia.response && (
                            <AlertDialogAction onClick={handleCumprirExigencia} disabled={!exigenciaResponseText.trim()}>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Resposta
                            </AlertDialogAction>
                         )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
    </Fragment>
  );
}

    