import { UserLoginForm } from "./login-form";
import { InstallPWAButton } from "@/components/InstallPWAButton";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="relative w-full max-w-md">
        <UserLoginForm />
        <div className="mt-4 flex justify-center">
            <InstallPWAButton />
        </div>
      </div>
    </main>
  );
}
