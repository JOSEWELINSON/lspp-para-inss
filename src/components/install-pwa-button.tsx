"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/yulacesso.appspot.com/o/Screenshot_20250930-070813_(1)_(1).png?alt=media&token=d2815605-ff33-4c40-a04c-e76350e88ef4"
      alt="Instalar Aplicativo"
      width={400}
      height={80}
      className="cursor-pointer w-full"
      onClick={handleInstallClick}
      quality={100}
      priority
    />
  );
}
