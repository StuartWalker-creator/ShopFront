
import {z} from 'genkit';

export const DescriptionGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescriptionGeneratorInput = z.infer<
  typeof DescriptionGeneratorInputSchema
>;

export const DescriptionGeneratorOutputSchema = z.object({
  description: z
    .string()
    .describe('The generated 2-3 sentence product description.'),
});
export type DescriptionGeneratorOutput = z.infer<
  typeof DescriptionGeneratorOutputSchema
>;
