import { ShieldCheck } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 font-headline text-xl font-bold text-primary">
      <ShieldCheck className="h-7 w-7" />
      <span className="font-semibold">LSPP do INSS</span>
    </div>
  );
}
