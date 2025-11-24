# Cloudflare Production Architecture & Deployment Guide

## Architecture Overview
*   **Hybrid Setup:** Cloudflare Pages (Frontend) + Cloudflare Workers (Backend).
*   **Frontend:** React/Vite app hosted on Pages (`jyotilalchandani.pages.dev`).
    *   **Routing:** Uses HashRouter (`#/`).
    *   **API Proxy:** `functions/api/[[proxy]].js` intercepts `/api/*` requests and forwards them to the backend Worker.
*   **Backend:** Cloudflare Worker (`jyotilalchandani-backend`).
    *   **Entry Point:** `_worker.js`.
    *   **Features:** Handles API logic, Durable Objects (`AffiliateCounter` for tracking), and KV Storage (Caching).
    *   **Self-Hosted News:** Aggregates news via Cron jobs and caches in KV to avoid rate limits.

## Configuration Files
*   **Frontend (Pages):** `wrangler.toml` (No `main` field, defines `pages_build_output_dir`).
*   **Backend (Worker):** `wrangler.backend.toml` (Defines `main = "_worker.js"`, Durable Objects, KV bindings, Cron triggers).

## Deployment Instructions

### 1. Build Frontend
```bash
npm run build
```
*   Output: `dist/` directory.

### 2. Deploy Backend (Worker)
```bash
npx wrangler deploy --config wrangler.backend.toml --env ""
```
*   Deploys `_worker.js`, Durable Objects, and KV bindings.
*   **Note:** Must use `--env ""` to target the default environment correctly if not using specific envs.

### 3. Deploy Frontend (Pages)
```bash
npx wrangler pages deploy dist --commit-dirty
```
*   Deploys static assets from `dist/` and Pages Functions.

### Full Deployment Command
```bash
npm run build && npx wrangler deploy --config wrangler.backend.toml --env "" && npx wrangler pages deploy dist --commit-dirty
```

## Key Secrets
*   Managed via `wrangler secret put <KEY> --config wrangler.backend.toml`.
*   **Important:** `GUARDIAN_API_KEY`, `ADMIN_PASSWORD`, `NEWSAPI_KEY`.
