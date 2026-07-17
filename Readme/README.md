# STEM Assessment Platform

Welcome to the new STEM Assessment platform! This system replaces the old "Live Quiz" with a robust, scalable, and beautifully designed interface meant specifically for kids learning STEM and Tinkering in India.

## Features
- **Kids-Friendly UI**: Vibrant, engaging, and responsive interface using Glassmorphism.
- **Dark/Light Mode**: Easily toggleable themes.
- **Role-Based Access**: 
  - **Students**: Enter Name, Grade, and School to start an assessment.
  - **Teachers**: Login (default `admin` / `password` in dev mode) to view submitted results.
- **Media Support**: Questions can now include images and audio clips.
- **Cloudflare Powered Backend**: A serverless Node.js backend using Cloudflare Workers ensures fast and secure data handling.
- **Discord Integration**: Webhook integration to automatically send answer sheets to a Discord server.

## File Structure
- `pages/assessment.html`: The main entry point for the frontend application.
- `css/assessment.css`: Stylesheet handling the UI, animations, and themes.
- `js/assessment.js`: Frontend logic for managing state, timers, and API communication.
- `live-quiz-data/questions.json`: The database of 50 questions used in the assessment.
- `backend-api/`: The Cloudflare Worker project for the backend.

## How to Run the Frontend
Since it is built with pure HTML/CSS/JS, you can serve it using any simple web server:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000/pages/assessment.html`.

## How to Run the Cloudflare Backend

1. Navigate to the backend directory:
```bash
cd backend-api
```
2. Install Wrangler (Cloudflare CLI) if you haven't already:
```bash
npm install -g wrangler
```
3. Run the local development server:
```bash
npm run dev
```
By default, this will run on `http://127.0.0.1:8787`. The frontend (`js/assessment.js`) is already configured to point to this address.

## Setting Up Discord Webhook
1. Go to your Discord Server Settings > Integrations > Webhooks.
2. Create a New Webhook and copy the URL.
3. Open `backend-api/wrangler.toml` and paste the URL under `[vars] DISCORD_WEBHOOK_URL = "..."`.
4. The worker will automatically send a message with the answer sheet whenever a student submits.

## Managing Questions
To add more questions or modify existing ones, edit `live-quiz-data/questions.json`.
- For image questions, add: `"media_type": "image", "media_url": "URL"`
- For audio questions, add: `"media_type": "audio", "media_url": "URL"`
