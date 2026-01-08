# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## AI Features Setup

This application uses Genkit to power AI features like theme generation and product suggestions. **To enable these features, you need a Gemini API key from a Google Cloud project with billing enabled.**

1.  Create a project on [Google Cloud Platform](https://console.cloud.google.com/).
2.  Enable billing for your project.
3.  Enable the "Vertex AI API" for your project.
4.  Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey) while logged into an account associated with your billed project.
5.  Open the `.env` file in the root of this project.
6.  Add your API key to the `GEMINI_API_KEY` variable:

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

After adding the key, you will need to restart your development server for the change to take effect. Without a valid, billed API key, the AI features will fail.
