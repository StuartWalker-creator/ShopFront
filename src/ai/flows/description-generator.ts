
'use server';
/**
 * @fileOverview An AI flow to generate product descriptions.
 *
 * - generateDescription - A function that generates a description based on product info.
 */

import {ai} from '@/ai/genkit';
import {
  DescriptionGeneratorInput,
  DescriptionGeneratorInputSchema,
  DescriptionGeneratorOutputSchema,
} from '@/ai/schemas/description-generator-schema';
import {generate} from 'genkit';

export async function generateDescription(input: DescriptionGeneratorInput) {
  return generateDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: {schema: DescriptionGeneratorInputSchema},
  output: {schema: DescriptionGeneratorOutputSchema},
  prompt: `You are an expert in e-commerce marketing. Based on the product name and image, write a compelling and concise product description of about 2-3 sentences.

Product Name: {{{productName}}}
{{#if imageDataUri}}
Product Image: {{media url=imageDataUri}}
{{/if}}
`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: DescriptionGeneratorInputSchema,
    outputSchema: DescriptionGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
