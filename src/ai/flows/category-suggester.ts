
'use server';
/**
 * @fileOverview An AI flow to suggest product categories.
 *
 * - getSuggestedCategories - A function that suggests categories based on product info.
 */

import {ai} from '@/ai/genkit';
import {
  CategorySuggesterInput,
  CategorySuggesterInputSchema,
  CategorySuggesterOutputSchema
} from '@/ai/schemas/category-suggester-schema';

export async function getSuggestedCategories(input: CategorySuggesterInput) {
  return suggestCategoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoriesPrompt',
  input: {schema: CategorySuggesterInputSchema},
  output: {schema: CategorySuggesterOutputSchema},
  prompt: `You are an expert in e-commerce merchandising. Based on the product name and description, suggest 3 to 5 appropriate and concise categories for it.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}`,
});

const suggestCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestCategoriesFlow',
    inputSchema: CategorySuggesterInputSchema,
    outputSchema: CategorySuggesterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
