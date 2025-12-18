'use client';

import { useEffect, useState } from 'react';
import { Loader2, FileWarning } from 'lucide-react';
import { type Documento } from '@/lib/data';
import { Button } from '@/components/ui/button';

export default function ViewDocumentPage() {
    const [document, setDocument] = useState<Documento | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const docString = sessionStorage.getItem('documentToView');
            if (docString) {
                const doc = JSON.parse(docString);
                setDocument(doc);
            }
        } catch (error) {
            console.error("Failed to parse document from sessionStorage", error);
        } finally {
            setIsLoading(false);
        }

        return () => {
             sessionStorage.removeItem('documentToView');
        };
    }, []);

    useEffect(() => {
        if (document) {
            window.document.title = document.name || "Visualizar Documento";
        }
    }, [document]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-muted">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!document || !document.dataUrl) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-center">
                <FileWarning className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2">Documento não encontrado</h1>
                <p className="text-muted-foreground mb-6">Não foi possível carregar o documento. Por favor, volte e tente novamente.</p>
                <Button onClick={() => window.close()}>Fechar Aba</Button>
            </div>
        );
    }

    const isPdf = document.type === 'application/pdf';

    return (
        <div className="h-screen w-screen bg-muted">
            {isPdf ? (
                <embed src={document.dataUrl} type="application/pdf" width="100%" height="100%" />
            ) : (
                <div className="flex h-full w-full items-center justify-center p-4">
                    <img 
                        src={document.dataUrl} 
                        alt={document.name}
                        className="max-h-full max-w-full object-contain"
                    />
                </div>
            )}
        </div>
    );
}
