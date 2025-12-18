'use server';

/**
 * @fileOverview This file defines a Genkit flow for a virtual assistant that helps users choose the most suitable INSS benefit.
 *
 * The flow takes user input describing their situation and returns personalized benefit recommendations.
 * @interface BenefitSelectionAssistantInput - The input schema for the benefit selection assistant flow.
 * @interface BenefitSelectionAssistantOutput - The output schema for the benefit selection assistant flow.
 * @function benefitSelectionAssistant - The main function to initiate the benefit selection process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BenefitSelectionAssistantInputSchema = z.object({
  userDescription: z.string().describe('A detailed description of the user\u2019s current situation, including their work history, health conditions, and any other relevant factors.'),
});

export type BenefitSelectionAssistantInput = z.infer<
  typeof BenefitSelectionAssistantInputSchema
>;

const BenefitSelectionAssistantOutputSchema = z.object({
  recommendedBenefits: z
    .string()
    .describe(
      'A list of recommended INSS benefits based on the user\u2019s situation, along with a brief explanation of why each benefit is suitable.'
    ),
});

export type BenefitSelectionAssistantOutput = z.infer<
  typeof BenefitSelectionAssistantOutputSchema
>;

export async function benefitSelectionAssistant(
  input: BenefitSelectionAssistantInput
): Promise<BenefitSelectionAssistantOutput> {
  return benefitSelectionAssistantFlow(input);
}

const benefitSelectionAssistantPrompt = ai.definePrompt({
  name: 'benefitSelectionAssistantPrompt',
  input: {schema: BenefitSelectionAssistantInputSchema},
  output: {schema: BenefitSelectionAssistantOutputSchema},
  prompt: `You are a virtual assistant specializing in INSS benefits.
Your goal is to help users identify the most suitable benefits based on their individual circumstances.

Analyze the following user description and provide a list of recommended benefits, along with a brief explanation of why each benefit is suitable.

User Description: {{{userDescription}}}
`,
});

const benefitSelectionAssistantFlow = ai.defineFlow(
  {
    name: 'benefitSelectionAssistantFlow',
    inputSchema: BenefitSelectionAssistantInputSchema,
    outputSchema: BenefitSelectionAssistantOutputSchema,
  },
  async input => {
    const {output} = await benefitSelectionAssistantPrompt(input);
    return output!;
  }
);
