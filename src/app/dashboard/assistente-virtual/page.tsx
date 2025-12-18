import { AssistenteVirtualForm } from "./assistente-form";

export default function AssistenteVirtualPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Assistente Virtual</h1>
        <p className="text-muted-foreground">
          Não sabe qual benefício pedir? Deixe nossa inteligência artificial te ajudar.
        </p>
      </div>
      <AssistenteVirtualForm />
    </div>
  );
}
