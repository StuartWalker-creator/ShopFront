
import {z} from 'genkit';

export const HeroImageGeneratorInputSchema = z.object({
  description: z
    .string()
    .describe('A natural language description of the desired hero image.'),
});
export type HeroImageGeneratorInput = z.infer<typeof HeroImageGeneratorInputSchema>;


export const HeroImageGeneratorOutputSchema = z.object({
    imageUrl: z
      .string()
      .describe('The generated image as a data URI.'),
  });
  
export type HeroImageGeneratorOutput = z.infer<typeof HeroImageGeneratorOutputSchema>;
