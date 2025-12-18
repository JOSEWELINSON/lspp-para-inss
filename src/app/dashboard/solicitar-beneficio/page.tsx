import { SolicitarBeneficioForm } from "./solicitar-form";

export default function SolicitarBeneficioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">Solicitar Benefício</h1>
        <p className="text-muted-foreground">
          Inicie uma nova solicitação de benefício do INSS.
        </p>
      </div>
      <SolicitarBeneficioForm />
    </div>
  );
}
