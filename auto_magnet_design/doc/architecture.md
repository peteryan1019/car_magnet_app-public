# AutoMagnet Design - C4 Architecture Diagrams

## Level 1: System Context Diagram

*Shows the system as a whole and how it interacts with users and external services.*

```
                              ┌───────────────┐
                              │   Customer    │
                              │   (Browser)   │
                              └───────┬───────┘
                                      │
                          designs magnets, pays,
                          receives order emails
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │                         │
                        │   AutoMagnet Design     │
                        │   (Next.js Web App)     │
                        │                         │
                        └──┬──────┬───────┬────┬──┘
                           │      │       │    │
              ┌────────────┘      │       │    └────────────┐
              ▼                   ▼       ▼                 ▼
     ┌─────────────────┐ ┌────────────┐ ┌──────────┐ ┌───────────┐
     │  Google Gemini  │ │   Stripe   │ │  Google  │ │   Gmail   │
     │                 │ │            │ │  Cloud   │ │   SMTP    │
     │ Generates       │ │ Processes  │ │ Storage  │ │           │
     │ magnet designs  │ │ payments   │ │          │ │ Sends     │
     │ and edits       │ │ and sends  │ │ Stores   │ │ order and │
     │                 │ │ webhooks   │ │ images   │ │ verify    │
     │                 │ │            │ │ & logos  │ │ emails    │
     └─────────────────┘ └────────────┘ └──────────┘ └───────────┘
```

---

## Level 2: Container Diagram

*Shows the major containers (deployable units) inside the system and how they communicate.*

```
                              ┌───────────────┐
                              │   Customer    │
                              │   (Browser)   │
                              └───────┬───────┘
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Vercel (Deployment)                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                Next.js Application                            │  │
│  │                                                               │  │
│  │  ┌─────────────────────┐      ┌────────────────────────────┐  │  │
│  │  │   React Frontend    │      │   Next.js Backend          │  │  │
│  │  │                     │      │                            │  │  │
│  │  │  16 pages           │ ───► │  Server Actions            │  │  │
│  │  │  11 components      │      │  (auth, designs, email,    │  │  │
│  │  │  (Three.js, Fabric, │      │   preferences)             │  │  │
│  │  │   jsPDF)            │      │                            │  │  │
│  │  │                     │      │  API Routes                │  │  │
│  │  │                     │      │  (checkout, webhooks,      │  │  │
│  │  │                     │      │   gemini, upload, health)  │  │  │
│  │  └─────────────────────┘      └─────────────┬──────────────┘  │  │
│  │                                              │                │  │
│  └──────────────────────────────────────────────┼────────────────┘  │
│                                                 │                   │
└─────────────────────────────────────────────────┼───────────────────┘
                                                  │
                    ┌─────────────┬───────────────┼───────────────┐
                    ▼             ▼               ▼               ▼
           ┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────┐
           │ Neon         │ │ Stripe   │ │ Google Cloud │ │  Gmail    │
           │ PostgreSQL   │ │ API      │ │              │ │  SMTP     │
           │              │ │          │ │ Gemini AI    │ │           │
           │ users        │ │ Payments │ │ GCS Storage  │ │ Emails   │
           │ designs      │ │ Webhooks │ │              │ │           │
           │ orders       │ │          │ │              │ │           │
           │ preferences  │ │          │ │              │ │           │
           │ tokens       │ │          │ │              │ │           │
           └──────────────┘ └──────────┘ └──────────────┘ └───────────┘
```

---

## Level 3: Component Diagram

*Shows the internal components of the Next.js backend and how they depend on each other.
Services and Repo Implementations both depend on Interfaces (Dependency Inversion).
The Container wires them together and is the only file that touches the database.*

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             Next.js Backend                                      │
│                                                                                  │
│                                                                                  │
│  "use server" Wrappers              API Route Handlers                           │
│  ┌──────────────────┐               ┌──────────────────────────┐                │
│  │ auth-actions.ts  │               │ /api/checkout            │                │
│  │ design-actions.ts│               │ /api/gemini              │                │
│  │ email-actions.ts │               │ /api/gemini-partial      │                │
│  │ preferences/     │               │ /api/upload-logo         │                │
│  │   actions.ts     │               │ /api/saveImage           │                │
│  └────────┬─────────┘               │ /api/webhooks/stripe     │                │
│           │                          │ /api/orders              │                │
│           │ imports service          │ /api/health              │                │
│           │ from container           └─────────────┬────────────┘                │
│           │                                        │ imports service             │
│           │                                        │ from container              │
│           ▼                                        ▼                             │
│  ┌──────────────────────────────────────────────────────────────────────┐        │
│  │                            Container                                │        │
│  │                       lib/repos/container.ts                        │        │
│  │                                                                     │        │
│  │         Creates repos from db, injects repos into services          │        │
│  │                                                                     │        │
│  │  const userRepo = createUserRepo(db)                                │        │
│  │  const authService = createAuthService({ userRepo, tokenRepo })     │        │
│  │  ...                                                                │        │
│  └──────────┬──────────────────────────────────────────┬───────────────┘        │
│             │ creates                                  │ creates                │
│             ▼                                          ▼                        │
│                                                                                  │
│    Services Layer                             Repo Implementations               │
│    lib/services/                              lib/repos/                          │
│  ┌────────────────────────┐                ┌────────────────────────┐            │
│  │ authService            │                │ userRepo.ts            │            │
│  │ designService          │                │ designRepo.ts          │            │
│  │ emailService           │                │ orderRepo.ts           │            │
│  │ preferencesService     │   depends on   │ preferencesRepo.ts     │ implements │
│  │ webhookService         │ ──────────┐    │                        │ ────────┐  │
│  │ ordersService          │           │    │ (Drizzle ORM queries)  │         │  │
│  │ testService            │           │    └────────────┬───────────┘         │  │
│  └────────────────────────┘           │                 │                     │  │
│                                       │                 │                     │  │
│                                       ▼                 ▼                     │  │
│                            ┌──────────────────────────────────────┐           │  │
│                            │       Repository Interfaces          │◄──────────┘  │
│                            │       lib/repos/interfaces.ts        │              │
│                            │                                      │              │
│                            │  IUserRepo  IVerificationTokenRepo   │              │
│                            │  IDesignRepo  IOrderRepo             │              │
│                            │  IPreferencesRepo                    │              │
│                            └──────────────────────────────────────┘              │
│                                                                                  │
│                                                                                  │
│                            ┌──────────────────────────────────────┐              │
│                            │           Drizzle ORM                │              │
│                            │           db/index.ts                │              │
│                            └─────────────────┬────────────────────┘              │
│                                              │                                   │
└──────────────────────────────────────────────┼───────────────────────────────────┘
                                               │
                                               ▼
                                       ┌──────────────┐
                                       │     Neon     │
                                       │  PostgreSQL  │
                                       └──────────────┘
```
