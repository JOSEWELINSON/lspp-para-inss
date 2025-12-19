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

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        setDeferredPrompt(null);
    }

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
    return null; // Don't show the button if PWA installation is not available or already installed
  }

  return (
    <Button
      variant="default"
      size="lg"
      className="rounded-full h-16 w-16 shadow-lg"
      aria-label="Instalar Aplicativo"
      onClick={handleInstallClick}
    >
      <Download className="h-6 w-6" />
    </Button>
  );
}
