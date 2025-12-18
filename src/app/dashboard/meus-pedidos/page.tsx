'use client';
import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, Send, User, ShieldCheck } from 'lucide-react';
import { format, addDays } from 'date-fns';

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
import { type RequestStatus, type UserRequest } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
    const [isExigenciaModalOpen, setIsExigenciaModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState<UserRequest | null>(null);
    const [exigenciaResponseText, setExigenciaResponseText] = useState("");
    const [exigenciaFiles, setExigenciaFiles] = useState<File[]>([]);
    
    useEffect(() => {
        loadRequests();
    }, [router]);

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

    const handleOpenExigencia = (request: UserRequest) => {
        setCurrentRequest(request);
        setIsExigenciaModalOpen(true);
        setExigenciaResponseText(request.exigencia?.response?.text || "");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setExigenciaFiles(Array.from(e.target.files));
        }
    };

    const handleCumprirExigencia = () => {
        if (!currentRequest) return;

        const updatedRequests = myRequests.map(req => {
            if (req.id === currentRequest.id && req.exigencia) {
                return {
                    ...req,
                    status: 'Em análise' as RequestStatus,
                    exigencia: {
                        ...req.exigencia,
                        response: {
                            text: exigenciaResponseText,
                            files: exigenciaFiles.map(f => f.name),
                            respondedAt: new Date().toISOString(),
                        }
                    }
                };
            }
            return req;
        });

        try {
            const appDataRaw = localStorage.getItem('appData');
            const appData = appDataRaw ? JSON.parse(appDataRaw) : { users: [], requests: [] };
            const currentUserCpf = localStorage.getItem('currentUserCpf');
            const otherUserRequests = appData.requests.filter((r: UserRequest) => r.user.cpf !== currentUserCpf);
            appData.requests = [...otherUserRequests, ...updatedRequests];
            localStorage.setItem('appData', JSON.stringify(appData));
            
            setMyRequests(updatedRequests);
            setIsExigenciaModalOpen(false);
            setExigenciaResponseText("");
            setExigenciaFiles([]);
            setCurrentRequest(null);
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
                            <TableRow key={request.id} className={request.status === 'Exigência' ? 'bg-orange-100/50' : ''}>
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
                                        <Button variant="outline" size="sm" onClick={() => handleOpenExigencia(request)}>
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Ver Exigência
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
                        {/* Server message */}
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
                             // User response - already sent
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-1 text-right">
                                    <div className="bg-primary text-primary-foreground rounded-lg p-3 inline-block text-left">
                                        <p className="text-sm">{currentRequest.exigencia.response.text}</p>
                                        {currentRequest.exigencia.response.files && currentRequest.exigencia.response.files.length > 0 && (
                                            <div className="mt-2 text-xs border-t border-primary-foreground/50 pt-2">
                                                <p className="font-semibold">Arquivos enviados:</p>
                                                <ul className="list-disc pl-4">
                                                    {currentRequest.exigencia.response.files.map((file, i) => <li key={i}>{file}</li>)}
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
                            // User response form
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
