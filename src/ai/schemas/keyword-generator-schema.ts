
import {z} from 'genkit';

export const KeywordGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('The description of the product.'),
  category: z.string().optional().describe('The category of the product.'),
});
export type KeywordGeneratorInput = z.infer<
  typeof KeywordGeneratorInputSchema
>;

export const KeywordGeneratorOutputSchema = z.object({
  keywords: z
    .array(z.string())
    .describe('An array of at least 20 relevant SEO keywords.'),
});
export type KeywordGeneratorOutput = z.infer<
  typeof KeywordGeneratorOutputSchema
>;
