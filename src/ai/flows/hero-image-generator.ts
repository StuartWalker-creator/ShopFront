
'use server';
/**
 * @fileOverview An AI flow to generate a hero image for a storefront.
 *
 * - generateHeroImage - A function that generates an image based on a text description.
 */

import {ai} from '@/ai/genkit';
import {
  HeroImageGeneratorInput,
  HeroImageGeneratorInputSchema,
  HeroImageGeneratorOutput,
  HeroImageGeneratorOutputSchema,
} from '@/ai/schemas/hero-image-generator-schema';

export async function generateHeroImage(input: HeroImageGeneratorInput): Promise<HeroImageGeneratorOutput> {
  return generateHeroImageFlow(input);
}


const generateHeroImageFlow = ai.defineFlow(
    {
      name: 'generateHeroImageFlow',
      inputSchema: HeroImageGeneratorInputSchema,
      outputSchema: HeroImageGeneratorOutputSchema,
    },
    async (input) => {
        const { media } = await ai.generate({
            model: 'googleai/imagen-4.0-fast-generate-001',
            prompt: `A cinematic, visually stunning, high-quality photograph for a website hero image. The image should be in a 16:9 aspect ratio. The user's request is: "${input.description}"`,
        });

        const imageUrl = media.url;
        
        if (!imageUrl) {
            throw new Error("Image generation failed to return a URL.");
        }

        return { imageUrl };
    }
);
