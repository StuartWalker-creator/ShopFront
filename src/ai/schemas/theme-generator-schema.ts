
import {z} from 'genkit';

export const ThemeGeneratorInputSchema = z.object({
  description: z
    .string()
    .describe('A natural language description of the desired store theme.'),
});
export type ThemeGeneratorInput = z.infer<typeof ThemeGeneratorInputSchema>;

const ThemeColorsSchema = z.object({
  background: z
    .string()
    .describe('The HSL value for the overall page background.'),
  foreground: z
    .string()
    .describe('The HSL value for the default text color.'),
  card: z.string().describe('The HSL value for the background of cards.'),
  primary: z
    .string()
    .describe('The HSL value for primary interactive elements like buttons.'),
  primaryForeground: z
    .string()
    .describe('The HSL value for text on top of primary elements.'),
  secondary: z
    .string()
    .describe('The HSL value for secondary interactive elements.'),
  secondaryForeground: z
    .string()
    .describe('The HSL value for text on top of secondary elements.'),
  accent: z.string().describe('The HSL value for accent elements.'),
  accentForeground: z
    .string()
    .describe('The HSL value for text on top of accent elements.'),
});

export const ThemeGeneratorOutputSchema = ThemeColorsSchema.extend({
  dark: ThemeColorsSchema.describe('The color palette for the dark theme.'),
});

export type ThemeGeneratorOutput = z.infer<typeof ThemeGeneratorOutputSchema>;
