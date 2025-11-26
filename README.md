# Blush & Breathe - Health & Beauty Hub

A modern health and beauty web application built with Next.js 16 and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 16 (Pages Router) + Tailwind CSS v4
- **Backend**: Cloudflare Workers
- **AI**: Google Gemini 2.0 Flash (Diet Plan Generation)
- **Deployment**: Vercel (Frontend) + Cloudflare Workers (Backend)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── pages/           # Next.js pages (SSR/ISR)
│   └── api/         # API routes (Vercel Edge Functions)
├── components/      # React components
├── services/        # API services
├── hooks/           # Custom React hooks
├── styles/          # Global CSS styles
├── public/          # Static assets
├── cloudflare-worker/  # Backend worker (hb-reader)
└── wrangler.backend.toml  # Backend worker config
```

## Features

- 🏠 Homepage with curated health & beauty content
- 📰 Article reading with clean extraction (Mozilla Readability)
- 🛒 Health Store with eBay product integration
- 🥗 AI-powered Diet Plan Generator (Gemini AI)
- 📺 YouTube video integration (Shorts + Full Videos)
- 🌙 Dark/Light mode support
- 📱 Fully responsive mobile design

## Environment Variables

Set in Vercel dashboard:
- `YOUTUBE_API_KEY` - YouTube Data API key
- `GEMINI_API_KEY` - Google Gemini API key

## Documentation

See [CONTEXT.md](./CONTEXT.md) for detailed architecture and development notes.
