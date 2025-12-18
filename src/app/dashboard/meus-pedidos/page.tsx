'use client';
import { useEffect, useState, Fragment, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, Send, User, ShieldCheck, FileText, Loader2, Link as LinkIcon, Paperclip, X, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import imageCompression from 'browser-image-compression';

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
import { type RequestStatus, type UserRequest, type Documento } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, query, updateDoc, where } from 'firebase/firestore';
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

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const MAX_RAW_FILE_SIZE_MB = 0.5;
const MAX_DATA_URL_SIZE = 1048576 * 0.9;

export default function MeusPedidosPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const userCpf = getUserCpf();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const requestsQuery = useMemoFirebase(() => userCpf ? query(collection(firestore, 'requests'), where('userId', '==', userCpf)) : null, [userCpf, firestore]);
    const { data: myRequests, isLoading } = useCollection<UserRequest>(requestsQuery);

    const [isExigenciaModalOpen, setIsExigenciaModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<UserRequest | null>(null);
    const [exigenciaResponseText, setExigenciaResponseText] = useState("");
    const [filesToUpload, setFilesToUpload] = useState<Documento[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    
    const openDetailsModal = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsDetailsModalOpen(true);
    };
    
    const viewDocument = (doc: Documento) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('documentToView', JSON.stringify(doc));
            window.open('/view-document', '_blank');
        }
    };

    const handleOpenExigencia = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsDetailsModalOpen(false);
        setIsExigenciaModalOpen(true);
    };
    
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setIsUploading(true);

        const selectedFiles = Array.from(e.target.files);
        const processedDocuments: Documento[] = [];

        for (const file of selectedFiles) {
            try {
                let fileToProcess = file;
                if (file.type.startsWith('image/')) {
                    const options = {
                        maxSizeMB: MAX_RAW_FILE_SIZE_MB,
                        maxWidthOrHeight: 1024,
                        useWebWorker: true,
                    };
                    fileToProcess = await imageCompression(file, options);
                }

                const dataUrl = await fileToDataUrl(fileToProcess);

                if (dataUrl.length > MAX_DATA_URL_SIZE) {
                    toast({
                        variant: "destructive",
                        title: "Arquivo Muito Grande",
                        description: `O arquivo "${file.name}" é muito grande para ser enviado, mesmo após a compressão. Tente uma imagem menor ou um PDF com menos páginas.`,
                    });
                    continue; // Skip this file
                }
                
                processedDocuments.push({
                    name: fileToProcess.name,
                    type: fileToProcess.type,
                    dataUrl: dataUrl,
                });

            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Falha no Processamento",
                    description: `Não foi possível processar o arquivo "${file.name}".`,
                });
            }
        }
        
        setFilesToUpload(prevFiles => [...prevFiles, ...processedDocuments]);
        setIsUploading(false);
        if(e.target) e.target.value = '';
    };
    
    const removeFile = (index: number) => {
        setFilesToUpload(prevFiles => prevFiles.filter((_, i) => i !== index));
    };


    const handleCumprirExigencia = async () => {
        if (!currentRequest || !userCpf || !firestore) return;
        
        if (!exigenciaResponseText.trim() && filesToUpload.length === 0) {
            toast({
                variant: "destructive",
                title: "Resposta Vazia",
                description: "Você precisa escrever uma resposta ou anexar um documento."
            });
            return;
        }

        setIsUploading(true);

        try {
            const response = {
                text: exigenciaResponseText,
                respondedAt: new Date().toISOString(),
                documents: filesToUpload
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
            
            const updatedRequest = { ...currentRequest, ...payload };
            setIsExigenciaModalOpen(false);
            setCurrentRequest(updatedRequest); 
            setIsDetailsModalOpen(true); 
            setExigenciaResponseText("");
            setFilesToUpload([]);

        } catch (error: any) {
            console.error("Failed to update exigencia", error);
             toast({
                variant: "destructive",
                title: "Erro ao Enviar",
                description: error.message.includes('exceeds the maximum allowed size')
                    ? "Um dos arquivos é grande demais. Por favor, anexe arquivos menores."
                    : "Não foi possível enviar sua resposta. Tente novamente.",
            });
        } finally {
            setIsUploading(false);
        }
    };
    
    const formatDate = (date: any) => {
        if (!date) return '';
        if (typeof date === 'string') return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        if (date?.seconds) return format(date.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        return '';
    }

    const getPrazoExigencia = (createdAt: any) => {
        if (!createdAt) return null;
        const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
        const prazo = addDays(date, 30);
        return format(prazo, "dd/MM/yyyy");
    };

    const closeModalAndReset = () => {
        setIsExigenciaModalOpen(false);
        setIsDetailsModalOpen(false);
        setExigenciaResponseText("");
        setFilesToUpload([]);
        setTimeout(() => setCurrentRequest(null), 300);
    }

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
                            <TableRow key={request.id} onClick={() => openDetailsModal(request)} className={`cursor-pointer ${request.status === 'Exigência' && !request.exigencia?.response ? 'bg-orange-100/50 dark:bg-orange-900/20' : ''}`}>
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
            <AlertDialog open={isDetailsModalOpen} onOpenChange={(open) => !open && closeModalAndReset()}>
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
                                <p className="font-semibold">Status</p>
                                <div>
                                    <Badge variant={statusVariant[currentRequest.status]}>{currentRequest.status}</Badge>
                                </div>
                            </div>
                        </div>
                        
                        {currentRequest.status === 'Indeferido' && currentRequest.motivoIndeferimento && (
                           <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2 text-destructive">
                                    <Info />
                                    Motivo do Indeferimento
                                </h3>
                                <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-lg">
                                    <p className="text-sm text-destructive-foreground/90 italic">"{currentRequest.motivoIndeferimento}"</p>
                                </div>
                            </div>
                        )}


                        {currentRequest.documents && currentRequest.documents.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Paperclip />
                                    Documentos Iniciais
                                </h3>
                                <div className="space-y-2">
                                    {currentRequest.documents.map((doc, index) => (
                                        <button onClick={() => viewDocument(doc)} key={index} className="flex w-full text-left items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                                            <LinkIcon className="h-4 w-4" />
                                            <span className="text-sm font-medium text-primary underline">{doc.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
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
                                                </div>
                                                {currentRequest.exigencia.response.documents && currentRequest.exigencia.response.documents.length > 0 && (
                                                    <div className="text-left mt-2 grid gap-2">
                                                        {currentRequest.exigencia.response.documents.map((doc, index) => (
                                                            <button onClick={() => viewDocument(doc)} key={index} className="flex w-full text-left items-center gap-2 p-2 rounded-md bg-muted hover:bg-muted/80 transition-colors">
                                                                <LinkIcon className="h-4 w-4" />
                                                                <span className="text-sm font-medium text-primary underline">{doc.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
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
                                                    Você tem uma exigência pendente. Clique em "Responder" para cumpri-la.
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
            <AlertDialog open={isExigenciaModalOpen} onOpenChange={(open) => !open && closeModalAndReset()}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" />
                            Cumprir Exigência
                        </AlertDialogTitle>
                        {currentRequest.exigencia.createdAt && (
                            <AlertDialogDescription>
                                Protocolo: {currentRequest.protocol}
                                {' | '}
                                Prazo: <strong>{getPrazoExigencia(currentRequest.exigencia.createdAt)}</strong>
                            </AlertDialogDescription>
                        )}
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
                                <div className="space-y-2">
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
                                     <Label>Anexar Novos Documentos (PDF, Foto)</Label>
                                     <Button 
                                         type="button" 
                                         variant="outline" 
                                         onClick={() => fileInputRef.current?.click()} 
                                         disabled={isUploading}
                                         className="w-fit"
                                     >
                                         <Upload className="mr-2 h-4 w-4" />
                                         Selecionar Arquivos
                                     </Button>
                                     <Input 
                                         id="exigencia-file-upload"
                                         type="file" 
                                         className="hidden" 
                                         onChange={handleFileChange} 
                                         multiple 
                                         disabled={isUploading}
                                         ref={fileInputRef}
                                         accept="image/*,application/pdf"
                                     />
                                     <p className="text-sm text-muted-foreground">
                                         Imagens são comprimidas para ~0.5MB. Arquivos que excedam 1MB após processamento serão rejeitados.
                                     </p>
                                 </div>
                                {filesToUpload.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Arquivos selecionados:</h4>
                                        <div className="grid gap-2">
                                            {filesToUpload.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-sm text-foreground truncate" title={doc.name}>{doc.name}</span>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-6 w-6 flex-shrink-0">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                        <AlertDialogCancel onClick={closeModalAndReset} disabled={isUploading}>Fechar</AlertDialogCancel>
                         {!currentRequest.exigencia.response && (
                            <AlertDialogAction onClick={handleCumprirExigencia} disabled={(!exigenciaResponseText.trim() && filesToUpload.length === 0) || isUploading}>
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
