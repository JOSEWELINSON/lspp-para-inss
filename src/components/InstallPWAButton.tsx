"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the event type for TypeScript
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Aplicativo já instalado ou não suportado",
        description: "Você pode já ter o aplicativo instalado ou seu navegador não suporta esta funcionalidade.",
      });
      return;
    }
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({
        title: "Aplicativo Instalado!",
        description: "O aplicativo foi adicionado à sua tela inicial.",
      });
    }

    setDeferredPrompt(null);
  };

  if (!deferredPrompt) {
    return null; // Don't show the button if PWA installation is not available
  }

  return (
    <Button
      variant="outline"
      onClick={handleInstallClick}
    >
      <Download className="mr-2 h-4 w-4" />
      Instalar Aplicativo
    </Button>
  );
}
