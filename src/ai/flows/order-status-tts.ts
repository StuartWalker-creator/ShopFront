
'use server';
/**
 * @fileOverview An AI flow to generate a TTS audio clip for an order status update.
 *
 * - generateOrderStatusAudio - A function that generates the audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const OrderStatusTTSInputSchema = z.object({
  customerName: z.string().describe("The customer's name."),
  orderStatus: z.string().describe("The new status of the order (e.g., 'processing', 'shipped')."),
  businessName: z.string().describe("The name of the business."),
});
export type OrderStatusTTSInput = z.infer<typeof OrderStatusTTSInputSchema>;

const OrderStatusTTSOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI."),
});
export type OrderStatusTTSOutput = z.infer<typeof OrderStatusTTSOutputSchema>;

export async function generateOrderStatusAudio(input: OrderStatusTTSInput): Promise<OrderStatusTTSOutput> {
  return generateAudioFlow(input);
}


async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        const bufs: any[] = [];
        writer.on('error', reject);
        writer.on('data', (d) => bufs.push(d));
        writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

        writer.write(pcmData);
        writer.end();
    });
}

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateOrderStatusAudioFlow',
    inputSchema: OrderStatusTTSInputSchema,
    outputSchema: OrderStatusTTSOutputSchema,
  },
  async ({ customerName, orderStatus, businessName }) => {
    const prompt = `Hi ${customerName}, great news from ${businessName}! Your order is now ${orderStatus}.`;

    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: prompt,
      });

    if (!media?.url) {
      throw new Error('Audio generation failed.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    
    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
