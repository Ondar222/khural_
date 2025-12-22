# khural-front

Frontend (Vite + React + Ant Design) for the **khural** project.

## Requirements

- Node.js 18+

## Local development

1. Install dependencies:

```bash
npm ci
```

2. Start the backend (default port **4000**).

3. Start the frontend:

```bash
npm run dev
```

The frontend dev server uses **`/api`** proxy to `http://localhost:4000` (see `vite.config.js`).

## Configuration

The app resolves API base URL in this order:

1. `window.__API_BASE_URL__`
2. `<meta name="api-base" content="...">`
3. `VITE_API_BASE_URL`
4. Defaults:
   - `localhost` → `/api` (dev proxy)
   - otherwise → same origin

Example env file is in `env.example` (copy it to `.env.local` if you want to use Vite env variables).

## Auth tokens

- Access token is stored as `access_token` (legacy `auth_token` is also supported)
- Refresh token is stored as `refresh_token`

On **401** the client attempts to refresh the access token via `POST /auth/refresh` and retries the request once.

