import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { benefits } from '@/lib/data';

export default function BeneficiosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl font-headline">
          Consulte os Benefícios
        </h1>
        <p className="text-muted-foreground">
          Informações detalhadas sobre todos os benefícios disponíveis no INSS.
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {benefits.map((benefit) => (
              <AccordionItem value={benefit.id} key={benefit.id}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  {benefit.title}
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-muted-foreground">{benefit.description}</p>
                  <div>
                    <h4 className="font-semibold mb-2">Requisitos:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {benefit.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
