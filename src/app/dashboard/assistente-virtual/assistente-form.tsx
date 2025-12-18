"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { benefitSelectionAssistant } from "@/ai/flows/benefit-selection-assistant";

const formSchema = z.object({
  userDescription: z.string().min(20, {
    message: "Por favor, descreva sua situação com pelo menos 20 caracteres.",
  }),
});

export function AssistenteVirtualForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userDescription: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendation("");
    try {
      const result = await benefitSelectionAssistant(values);
      setRecommendation(result.recommendedBenefits);
    } catch (error) {
      console.error(error);
      setRecommendation("Ocorreu um erro ao buscar a recomendação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
        <Card>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle>Descreva sua Situação</CardTitle>
                <CardDescription>Nossa IA irá analisar sua situação e sugerir o benefício mais adequado.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="userDescription"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Sua situação</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Ex: Tenho 55 anos, trabalhei por 20 anos com carteira assinada e estou com problemas de saúde que me impedem de trabalhar..."
                        className="resize-none"
                        rows={10}
                        {...field}
                        />
                    </FormControl>
                    <FormDescription>
                        Seja o mais detalhado possível para uma recomendação precisa.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                )}
                Obter Recomendação
                </Button>
            </CardFooter>
            </form>
        </Form>
        </Card>
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Recomendação da IA</CardTitle>
                <CardDescription>Com base na sua descrição, estes são os benefícios sugeridos.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {isLoading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                {!isLoading && !recommendation && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Sparkles className="h-12 w-12 mb-4" />
                        <p>Aguardando sua descrição para gerar uma recomendação.</p>
                    </div>
                )}
                {recommendation && (
                    <div className="space-y-4 text-sm">
                        <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-4" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-md font-semibold" {...props} />,
                                p: ({node, ...props}) => <p className="leading-relaxed text-muted-foreground" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="text-muted-foreground" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                            }}
                        >
                            {recommendation}
                        </ReactMarkdown>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
