# Vercel Deployment Guide for IFC Voice Assistant

## Environment Variables Required

You MUST set these environment variables in your Vercel project settings:

### Required:
```
OPENAI_API_KEY=sk-proj-your-api-key-here
```

## How to Set Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Navigate to "Environment Variables" in the left sidebar
4. Add the following variable:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-proj-`)
   - **Environment**: Select all (Production, Preview, Development)
5. Click "Save"

## Redeploy After Setting Variables:

After adding the environment variable:
1. Go to the "Deployments" tab
2. Click on the three dots menu of your latest deployment
3. Select "Redeploy"
4. Choose "Use existing Build Cache" and click "Redeploy"

## Verify Deployment:

Once deployed, your app should be accessible at:
- Production: `https://your-project.vercel.app`

## Troubleshooting:

### 404 Error
If you're getting a 404 error, check:
1. Environment variables are set correctly
2. The deployment logs for any errors
3. The Functions tab to ensure API routes are working

### API Connection Issues
If the voice assistant can't connect:
1. Verify OPENAI_API_KEY is set in Vercel
2. Check that your OpenAI account has Realtime API access
3. Ensure your API key has sufficient credits

## Testing the Deployment:

1. Open your deployed URL
2. Click "Connecter" button
3. Select your preferred language (FR/KH/EN)
4. Hold the microphone button to speak
5. The agent should respond in your selected language

## Support:

For OpenAI Realtime API issues:
- Check: https://platform.openai.com/docs/guides/realtime

For Vercel deployment issues:
- Check deployment logs in Vercel dashboard
- Verify all environment variables are set