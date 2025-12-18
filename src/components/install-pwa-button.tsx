"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

// This interface defines the shape of the event that the browser fires
// when the app is installable.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWAButton() {
  // We use state to hold the install prompt event.
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // This event is fired by the browser when the app is installable.
    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the browser's default install prompt.
      event.preventDefault();
      // Store the event so we can fire it later.
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    // Add the event listener.
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    // Clean up the event listener when the component unmounts.
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPromptEvent) {
      return;
    }

    // Show the browser's install prompt.
    installPromptEvent.prompt();

    // The userChoice property is a promise that resolves with the user's choice.
    installPromptEvent.userChoice.then((choice) => {
      // If the user accepted the prompt, we don't need to show the button anymore.
      if (choice.outcome === "accepted") {
        setInstallPromptEvent(null);
      }
    });
  };

  // If there's no install prompt event, it means the app can't be installed
  // (or is already installed), so we don't show the button.
  if (!installPromptEvent) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleInstallClick}
      className="w-full"
    >
      <Download className="mr-2 h-4 w-4" />
      Instalar Aplicativo
    </Button>
  );
}
