
'use server';
/**
 * @fileOverview An AI flow to generate a color theme for a storefront.
 *
 * - generateTheme - A function that generates a theme based on a text description.
 */

import {ai} from '@/ai/genkit';
import {
  ThemeGeneratorInput,
  ThemeGeneratorInputSchema,
  ThemeGeneratorOutputSchema,
} from '@/ai/schemas/theme-generator-schema';

export async function generateTheme(input: ThemeGeneratorInput) {
  return generateThemeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateThemePrompt',
  input: {schema: ThemeGeneratorInputSchema},
  output: {schema: ThemeGeneratorOutputSchema},
  prompt: `You are an expert web designer specializing in creating accessible and visually appealing color palettes for e-commerce websites.

Based on the user's description, generate a complete color theme for both light and dark modes. You must provide values for all the specified HSL color variables for both the base (light) theme and the nested dark theme.

The HSL values should be in the format "H S% L%". For example: "210 40% 98%".

Ensure the color combinations have good contrast ratios for accessibility. For example, 'primary' and 'primaryForeground' should be easily readable when layered. This applies to both light and dark themes. The dark theme should be a proper dark theme, not just an inversion of the light theme.

User's Theme Description: {{{description}}}`,
});

const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: ThemeGeneratorInputSchema,
    outputSchema: ThemeGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
