
import {z} from 'genkit';

export const CategorySuggesterInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('The description of the product.'),
});
export type CategorySuggesterInput = z.infer<typeof CategorySuggesterInputSchema>;

export const CategorySuggesterOutputSchema = z.object({
  categories: z.array(z.string()).describe('An array of 3-5 relevant category suggestions.'),
});
export type CategorySuggesterOutput = z.infer<typeof CategorySuggesterOutputSchema>;
