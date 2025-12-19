import { UserLoginForm } from "./login-form";
import { InstallPWAButton } from "@/components/InstallPWAButton";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <UserLoginForm />
      <div className="fixed bottom-6 right-6 z-50">
        <InstallPWAButton />
      </div>
    </main>
  );
}
