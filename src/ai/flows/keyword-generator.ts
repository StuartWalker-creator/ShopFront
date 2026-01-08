
'use server';
/**
 * @fileOverview An AI flow to generate product keywords.
 *
 * - generateKeywords - A function that generates keywords based on product info.
 */

import {ai} from '@/ai/genkit';
import {
  KeywordGeneratorInput,
  KeywordGeneratorInputSchema,
  KeywordGeneratorOutput,
  KeywordGeneratorOutputSchema,
} from '@/ai/schemas/keyword-generator-schema';

export async function generateKeywords(
  input: KeywordGeneratorInput
): Promise<KeywordGeneratorOutput> {
  return generateKeywordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateKeywordsPrompt',
  input: {schema: KeywordGeneratorInputSchema},
  output: {schema: KeywordGeneratorOutputSchema},
  prompt: `You are an expert in e-commerce SEO and product merchandising. Based on the product name, description, and category, generate a list of at least 20 relevant and popular search keywords. These keywords should help customers find this product easily. Include synonyms, related terms, and common search queries.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Product Category: {{{category}}}`,
});

const generateKeywordsFlow = ai.defineFlow(
  {
    name: 'generateKeywordsFlow',
    inputSchema: KeywordGeneratorInputSchema,
    outputSchema: KeywordGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
