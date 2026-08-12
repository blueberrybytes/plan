# Environment Variables

If you are self-hosting Plan AI, you will need to configure environment variables for all three of the core backend applications (The Node API, the React Frontend, and the Python Voice API).

## Global Configuration
Plan AI uses a master script to generate `.env` templates across the entire monorepo.
From the root of the repository, run:
```bash
yarn setup:env
```

## Backend Variables (`plan-ai/backend/.env`)

This is the most critical environment file. It handles database connections, API keys, integrations, and internal service discovery.

| Variable | Description | Example |
|----------|-------------|---------|
| **Core & Services** | | |
| `ENV` | The environment you are running in. | `local` |
| `PORT` | The port the Express API runs on. | `8080` |
| `FRONTEND_URL` | The public URL of the frontend app (for CORS). | `http://localhost:3000` |
| `BACKEND_URL` | The public URL of this API (for webhooks). | `https://api.plan-ai.com` |
| `APP_URL` | The main URL of the app. Used to build links that leave the product — emails, and the document link written into CRM notes — so a wrong value ships a broken link to your customers. | `https://plan-ai.blueberrybytes.com` |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins for production. Leave empty for local dev (allows all origins). | `https://plan-ai.blueberrybytes.com` |
| `API_ADMIN_KEY` | Secret key for cron jobs or admin overrides. | `test123` |
| `LOG_LEVEL` | Logging verbosity (`info`, `debug`, `error`). | `info` |
| **Databases** | | |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://planai:planai123@localhost/planai_db` |
| `REDIS_URL` | Redis connection for BullMQ jobs. | `redis://localhost:6379` |
| `QDRANT_URL` | Vector Database connection. | `http://127.0.0.1:6333` |
| `QDRANT_CONTEXT_COLLECTION` | The name of the collection for contexts. | `context_files` |
| **BullMQ Dashboard** | | |
| `BULL_BOARD_USER` | Basic auth username for the queue dashboard. | `admin` |
| `BULL_BOARD_PASSWORD` | Basic auth password for the queue dashboard. | `admin` |
| **AI Providers** | | |
| `OPENROUTER_API_KEY` | System-level OpenRouter fallback key. | `sk-or-v1-xxxx` |
| `DEEPGRAM_API_KEY` | System-level Deepgram fallback key. | `xxxx` |
| `OPENAI_API_KEY` | Optional OpenAI key. | `sk-proj-xxxx` |
| `GROQ_API_KEY` | Optional Groq key. | `gsk_xxxx` |
| `VOICE_AI_URL` | Internal URL for the Python Voice API. | `http://localhost:8001` |
| `VOICE_AI_API_KEY` | Shared secret between the backend and voice-ai service. Leave empty for local dev. | `your-secret-key` |
| **Integrations** | | |
| `JIRA_CLIENT_ID` | OAuth Client ID for Jira integration. | `xxxx` |
| `JIRA_CLIENT_SECRET` | OAuth Client Secret for Jira integration. | `xxxx` |
| `JIRA_REDIRECT_URI` | Jira OAuth callback URL. | `http://localhost:8080/api/jira/callback` |
| `TRELLO_GLOBAL_API_KEY` | Trello global API key for automated OAuth. | `xxxx` |
| `GITHUB_APP_ID` | GitHub App ID for codebase connection. | `xxxx` |
| `GITHUB_WEBHOOK_SECRET` | Secret for GitHub webhooks. | `xxxx` |
| `GITHUB_PRIVATE_KEY` | The private key for the GitHub App. | `-----BEGIN RSA PRIVATE KEY-----...` |
| `USE_GITNEXUS` | Enable local GitNexus MCP indexing. | `false` |
| `GITNEXUS_MCP_URL` | URL for the GitNexus MCP Server. | `http://localhost:4747/api/mcp` |
| `LINEAR_CLIENT_ID` | OAuth Client ID for Linear integration. | `xxxx` |
| `LINEAR_CLIENT_SECRET` | OAuth Client Secret for Linear integration. | `xxxx` |
| `LINEAR_REDIRECT_URI` | Linear OAuth callback URL. | `http://localhost:8080/api/linear/callback` |
| `LINEAR_WEBHOOK_SECRET` | Secret for Linear webhooks (optional). | `xxxx` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID (Drive integration). | `xxxx` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret. | `xxxx` |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL. | `http://localhost:8080/api/google/callback` |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID (OneDrive integration). | `xxxx` |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth client secret. | `xxxx` |
| `MICROSOFT_TENANT_ID` | Microsoft Azure tenant ID. | `xxxx` |
| `MICROSOFT_REDIRECT_URI` | Microsoft OAuth callback URL. | `http://localhost:8080/api/microsoft/callback` |
| `NOTION_CLIENT_ID` | Notion OAuth client ID. | `xxxx` |
| `NOTION_CLIENT_SECRET` | Notion OAuth client secret. | `xxxx` |
| `NOTION_REDIRECT_URI` | Notion OAuth callback URL. | `http://localhost:8080/api/notion/callback` |
| `ASANA_CLIENT_ID` | Asana OAuth client ID. | `xxxx` |
| `ASANA_CLIENT_SECRET` | Asana OAuth client secret. | `xxxx` |
| `ASANA_REDIRECT_URI` | Asana OAuth callback URL. | `http://localhost:8080/api/asana/callback` |
| **Auth & Email** | | |
| `FIREBASE_SERVICE_KEY` | Base64 encoded Firebase Service Account JSON. | `=` |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name. | `plan-ai.appspot.com` |
| `RESEND_API_KEY` | Resend API key for transactional emails. | `re_xxxx` |
| `FROM_EMAIL` | Sender address for system emails. | `noreply@plan-ai.blueberrybytes.com` |
| **Stripe Billing (optional)** — see [Stripe Billing setup](/self-hosting/stripe-billing) | | |
| `STRIPE_SECRET_KEY` | Stripe secret key. Leave empty to disable billing entirely (OSS default). | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard or CLI. | `whsec_…` |
| `STRIPE_PRICE_PRO_BYOK` | Stripe Price ID for the Pro BYOK tier (€6/seat/month). | `price_…` |
| `STRIPE_PRICE_PRO_MANAGED` | Stripe Price ID for the Pro Managed tier (€29/seat/month). | `price_…` |
| `STRIPE_PRICE_BUSINESS_BYOK` | Stripe Price ID for the Business BYOK tier (€14/seat/month). | `price_…` |
| `STRIPE_PRICE_BUSINESS_MANAGED` | Stripe Price ID for the Business Managed tier (€65/seat/month). | `price_…` |
| `STRIPE_CHECKOUT_SUCCESS_PATH` | Path appended to `APP_URL` for Stripe success redirect. | `/billing?status=success` |
| `STRIPE_CHECKOUT_CANCEL_PATH` | Path appended to `APP_URL` for Stripe cancel redirect. | `/billing?status=canceled` |
| `STRIPE_BYOK_TRIAL_DAYS` | Free-trial length for BYOK tiers. Leave empty for no trial. | `14` |

::: tip Twenty CRM needs no variables here
Twenty is self-hosted per customer, so its instance URL and API key are stored per **workspace** and entered in the app under Settings → Integrations — not in this file. See [CRM Sync](/features/crm-twenty).
:::

## Frontend Variables (`plan-ai/frontend/.env`)

These variables are exposed to the React frontend application using Create React App (`REACT_APP_` prefix).

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Local dev port for React. | `3000` |
| `REACT_APP_API_BACKEND_URL` | The URL of your Node Backend API. | `http://localhost:8080` |
| `REACT_APP_ENV` | Environment context for the UI. | `local` |
| `REACT_APP_ENABLE_REMOTE_LOGS` | Enable/disable sending logs remotely. | `false` |
| **Firebase Auth** | | |
| `REACT_APP_FIREBASE_API_KEY` | Public Firebase API Key. | `AIzaSy...` |
| `REACT_APP_FIREBASE_APP_ID` | Public Firebase App ID. | `1:1234:web:abcd` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain. | `plan-ai-1234.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase Project ID. | `plan-ai-1234` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET`| Firebase Storage bucket. | `plan-ai-1234.appspot.com` |
| `REACT_APP_FIREBASE_MEASUREMENT_ID`| Firebase Analytics ID. | `G-1234` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging ID. | `12345` |
| **Google Integrations** | | |
| `REACT_APP_GOOGLE_CLIENT_ID` | For Google Drive / Docs picker. | `xxxx.apps.googleusercontent.com` |
| `REACT_APP_GOOGLE_API_KEY` | For Google Drive API access. | `AIzaSy...` |
| `REACT_APP_GOOGLE_APP_ID` | Google App ID. | `1234567890` |

## Voice Service Variables (`plan-ai/voice-ai/.env`)

This powers the deep-learning speaker identification system.

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | The port the FastAPI service runs on. | `8001` |
| `HOST` | The binding host. | `0.0.0.0` |
| `HF_HOME` | Directory for caching HuggingFace models. | `./.cache/huggingface` |
| `VOICE_AI_API_KEY` | Shared secret to authenticate requests from the backend. Must match the backend value. | `your-secret-key` |
| `VOICE_REQUEST_TIMEOUT` | Request timeout in seconds (default: `180`). | `180` |

## Desktop Recorder Variables (`plan-ai-recorder/.env`)

The Electron desktop application uses Vite, so all public variables are prefixed with `VITE_`.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_PLAN_AI_API_URL` | The URL of the Node Backend API. | `http://localhost:8080` |
| `VITE_PLAN_AI_WEB_URL` | The URL of the Web Dashboard. | `http://localhost:3000` |
| `VITE_APP_PROTOCOL` | The deep-linking protocol scheme. | `blueberrybytes-recorder` |
| `VITE_LOGIN_BUG` | Dev flag for debugging the auth flow. | `false` |
| **Firebase Auth** | | |
| `VITE_FIREBASE_API_KEY` | Public Firebase API Key. | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain. | `plan-ai-1234.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID. | `plan-ai-1234` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Storage bucket. | `plan-ai-1234.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging ID. | `12345` |
| `VITE_FIREBASE_APP_ID` | Public Firebase App ID. | `1:1234:web:abcd` |
| `VITE_FIREBASE_MEASUREMENT_ID`| Firebase Analytics ID. | `G-1234` |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking. | `https://xxxx@sentry.io/xxx` |

## Mobile App Variables (`plan-ai-mobile/.env.local`)

The React Native (Expo) app uses `EXPO_PUBLIC_` prefixes so variables are securely bundled into the native IPA/APK.

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Modifies `app.config.ts` bundle identities. | `development` |
| `EXPO_PUBLIC_PLAN_AI_API_URL` | The URL of the Node Backend API. | `http://localhost:8080` or `http://192.168.1.44:8080` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`| Google Client ID for mobile auth. | `xxxx.apps.googleusercontent.com` |
| `SENTRY_AUTH_TOKEN` | Secret token for uploading source maps to Sentry. | `sntrys_xxxx` |

### Firebase Native Configuration
In addition to the environment variables above, the native mobile app requires actual configuration files from your Firebase Console. You must download these files and place them in the root of the `plan-ai-mobile` directory:
- `google-services.json` (For Android)
- `GoogleService-Info.plist` (For iOS)

> **⚠️ Security Warning:** Do NOT commit these files to a public repository! They are included in the `.gitignore` by default. While they are embedded in your final public APK/IPA, committing them raw allows forks to accidentally use your Firebase backend for their environments.
