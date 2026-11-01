# AutoMagnet

A Next.js application for generating and editing car-magnet designs, previewing them on vehicles, and placing print orders.

## Development

The application is in `auto_magnet_design/`. Use Node.js **24.22.1 or newer within 24.x** and pnpm **10.16.1**.

```sh
cd auto_magnet_design
nvm install
nvm use
npm install --global pnpm@10.16.1
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Populate `.env.local` with your own database, AI, storage, email, and Stripe configuration. Generate independent random values of at least 32 bytes for `JWT_SECRET` and `HEALTH_CHECK_TOKEN`. Never commit real credentials. Configure `PRINT_SHOP_EMAIL` for order notifications; it defaults to the configured sender account.

## Validation

```sh
pnpm check:runtime
pnpm test:runtime
pnpm typecheck
pnpm test:ci
pnpm lint
```

## Deployment

Vercel's project root must be `auto_magnet_design`. `package.json` selects Node 24.x, with a minimum security baseline of 24.22.1. Vercel manages exact patch versions. Both the build and server startup reject runtimes below that baseline, which fixes Node2Shell (CVE-2026-111497). Keep Node updated as additional security fixes are released.

Set production secrets in Vercel. Deployment is opt-in: set the GitHub Actions repository variable `ENABLE_VERCEL_DEPLOY=true` after configuring your Vercel project and secrets. The CI deployment uses `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `HEALTH_CHECK_TOKEN` from GitHub Actions secrets. It deploys production configuration without assigning the production domain, verifies the authenticated `/api/health` response including the actual runtime version, then promotes that same deployment.

```sh
curl --fail -H "Authorization: Bearer $HEALTH_CHECK_TOKEN" https://your-deployment.example/api/health
```

Course submissions, grading material, generated customer assets, and historical credentials have been excluded from the public source. Third-party asset licenses remain with their assets.
