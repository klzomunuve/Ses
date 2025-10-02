# AI WhatsApp Assistant

This project shows how to deploy an AI-powered WhatsApp webhook that forwards incoming messages to OpenAI and replies via WhatsApp Cloud API.

## Quick deploy
1. Create a GitHub repo and push these files.
2. On Render, create a new Web Service from the repo.
3. Set env vars in Render (see `.env.example`).
4. Configure Meta/WhatsApp webhook URL to `https://your-service.onrender.com/webhook`.

## Local testing
- Run `npm ci` then `npm start`.
- Use `ngrok http 3000` for testing locally.

## Next steps
- Add message history (Redis/Postgres).
- Add onboarding and analytics.
