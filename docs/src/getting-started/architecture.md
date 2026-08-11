# System Architecture

Plan AI is built as a robust, modern monorepo. It leverages a microservice-inspired architecture while keeping all the code in a single repository for maximum developer velocity and perfectly synchronized TypeScript types.

## High-Level Data Flow

The platform consists of three distinct client applications that all feed into a unified backend API.

```mermaid
graph TD
    %% Clients
    Mobile[📱 Mobile App<br>React Native / Expo]
    Desktop[💻 Desktop Recorder<br>Electron]
    Web[🖥️ Web App<br>React]

    %% Backend & Integrations
    Backend[⚙️ Backend API<br>Node / Express]
    DB[(🗄️ PostgreSQL Database)]
    AI_Deepgram[🎙️ Deepgram API<br>Audio Transcription]
    AI_OpenRouter[🧠 OpenRouter API<br>LLM Processing]
    Auth[🔐 Firebase<br>Authentication]
    Ext_Trackers[🔌 Issue Trackers<br>Jira, Linear, Trello, Notion, Asana]
    Ext_Crm[🏢 CRM<br>Twenty]
    Ext_Cloud[☁️ Cloud Storage<br>Google Drive, OneDrive]
    Ext_Mcp[🤖 AI Assistants<br>MCP server]

    %% Flow
    Mobile -->|Uploads Audio| Backend
    Desktop -->|Uploads System Audio| Backend
    Web <-->|Manages Meetings & Tasks| Backend
    Backend <--> DB
    Backend <--> AI_Deepgram
    Backend <--> AI_OpenRouter
    Backend <--> Ext_Trackers
    Backend <--> Ext_Crm
    Backend <--> Ext_Cloud
    Ext_Mcp -->|Reads meetings & tasks| Backend
    Mobile --> Auth
    Web --> Auth
    Desktop --> Auth
```

Outbound integrations all follow the same shape: credentials are stored per **workspace**, never globally, and each post-meeting step reports its own status back onto the meeting so a failed sync is visible instead of silently missing.

The MCP server is the one arrow pointing inwards — an external AI assistant reading your workspace rather than Plan AI writing to a third party. See [MCP Server](/features/mcp-server).

## The Backend Intelligence Pipeline

When a user finishes a meeting and the audio is uploaded from the Desktop Recorder or Mobile app, it does not get processed immediately on the main thread. 

To ensure the API remains highly responsive, we use **BullMQ and Redis** to handle the heavy lifting asynchronously.

```mermaid
graph TD
    %% Connectors
    subgraph Connectors[Connectors & Clients]
    Mobile[📱 Mobile App]
    Recorder[💻 Desktop Recorder]
    Web[🖥️ Web App]
    end

    %% API Layer
    subgraph Backend[Core Backend]
    API[⚙️ Node / Express API]
    Workers[⚒️ Background Jobs<br>BullMQ / Redis]
    end

    %% Data Layer
    subgraph DataLayer[Data & Storage]
    DB[(🗄️ Relational DB<br>PostgreSQL / Prisma)]
    VectorDB[(🧠 Vector DB<br>Qdrant)]
    end

    %% AI & Analysis
    subgraph Intelligence[AI & Analysis]
    LLMs[🤖 OpenRouter]
    Speech[🎙️ Deepgram]
    VoiceAI[🗣️ Voice Biometrics<br>Python / SpeechBrain]
    end

    %% Flow
    Mobile -.->|Audio Streams| API
    Recorder -.->|System Audio| API
    Web <-->|Tasks & Config| API
    
    API -->|Queues Tasks| Workers
    
    Workers <--> DB
    Workers <--> VectorDB
    
    Workers <--> Speech
    Workers <--> VoiceAI
    Workers <--> LLMs
```

### 1. The Voice Biometrics Service (Python)
Identifying *who* is speaking is notoriously difficult for standard LLMs. We deployed a dedicated Python microservice running `uvicorn` and `FastAPI` that uses the open-source **SpeechBrain (ECAPA-TDNN)** model. 

When the background worker receives an audio file, it sends it to this internal microservice (running on Port 8001) to perform deep mathematical speaker verification and diarization, ensuring the transcript correctly attributes sentences to the right people.

### 2. Semantic Memory (Vector DB)
We use **Qdrant** as our Vector Database. When meeting transcripts are finalized, they are chunked and vectorized. This allows the unified chat interface on the Web App to perform semantic similarity searches across hundreds of past meetings in milliseconds, fetching the exact "Context" needed to answer the user's question accurately.

## Guaranteed Type Safety

One of the largest pain points in monorepos is keeping the frontend clients perfectly synchronized with the backend database schemas. 

Plan AI uses an automated OpenAPI/Swagger generation pipeline to guarantee 100% type safety across the entire stack. Types are **never hand-written** for API response shapes.

```mermaid
graph TD
    Schema[schema.prisma] -->|Generates DB Types| Controllers[TSOA Controllers]
    Controllers -->|Generates OpenAPI Spec| Swagger[swagger.json]
    
    Swagger -->|openapi-typescript| WebTypes[plan-ai/frontend/src/types/api.d.ts]
    Swagger -->|openapi-typescript| DeskTypes[plan-ai-recorder/src/types/api.d.ts]
    Swagger -->|openapi-typescript| MobTypes[plan-ai-mobile/src/types/api.d.ts]
```

By running `yarn update` from the root directory, the system automatically migrates the database, regenerates the Swagger specification, and pushes the exact TypeScript types out to the Web App, the Electron App, and the React Native App simultaneously.
