# Handzi

> Skilled hands, one tap away. *(Repo and package names still say `handyconnect`.)*

Handzi is a marketplace connecting South African households with verified handymen (plumbing, electrical, roofing and more).
Clients post jobs and compare quotes or book packaged services. Handymen build a profile, get verified and get paid through escrow.
Admins monitor everything from a web dashboard.

## Repo layout (npm workspaces)

| Path | What |
|---|---|
| `apps/api` | Express + MongoDB + Socket.io API |
| `apps/mobile` | Expo (SDK 54, Expo Router) app with client and handyman modes |
| `apps/admin` | React + Vite + Tailwind admin dashboard (http://localhost:5173) |
| `packages/shared` | Shared enums/constants (statuses, roles, categories) |
| `handzi-brand` | Brand kit: BRAND.md (rules), tokens (source of truth for both apps), logos, fonts |

## Getting started

```bash
npm install                      # from the repo root
colima start                     # Docker runtime (once per boot)
npm run db:up                    # MongoDB in Docker (or point MONGODB_URI at Atlas)
cp apps/api/.env.example apps/api/.env   # already done once; edit secrets
npm run seed                     # categories, platform settings, admin user
npm run api                      # http://localhost:5000
npm run mobile                   # Expo dev server; open in Expo Go
npm run admin                    # admin dashboard on http://localhost:5173 (log in with ADMIN_EMAIL / ADMIN_PASSWORD)
npm test                         # API tests (in-memory MongoDB, no Docker needed)
```

In development the SMS provider is stubbed: OTP codes are logged by the API and shown on the verify screen.
On a physical phone the app talks to the API on your computer's LAN IP at port 5000, so keep both on the same network.

## API (v1)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Creates a client account and sends an OTP |
| POST | `/auth/login` | `identifier` is a phone number or email |
| POST | `/auth/otp/send`, `/auth/otp/verify` | Phone verification |
| POST | `/auth/password/reset` | OTP with `purpose: reset_password` |
| POST | `/auth/refresh`, `/auth/logout` | Logout revokes refresh tokens |
| GET | `/auth/me` | |
| PATCH | `/users/me` | Name, email, avatar, location |
| POST | `/users/me/mode` | Switch between `client` and `handyman` |
| POST | `/users/me/handyman` | Start handyman onboarding |
| POST | `/users/me/onboarding/client` | Location (required), interests, avatar |
| GET | `/categories` | |
| POST | `/uploads` | multipart `file` + `kind` (avatar, portfolio, certificate, id_document, selfie). ID, selfie and certificate files are private |
| GET/PATCH | `/handymen/me` | Own profile + completion checklist |
| POST/PATCH/DELETE | `/handymen/me/{work-history,portfolio,certifications}[/:id]` | Profile list sections |
| POST | `/handymen/me/verification` | Submit ID + selfie for review |
| POST | `/handymen/me/complete-onboarding` | Publishes the profile once every required section is done |
| GET | `/handymen` | Browse published handymen (`category`, `lat`/`lng`, `verified`) |
| GET | `/handymen/:userId` | Public profile (no documents, exact location or payout data) |
| POST | `/jobs` | Client posts a job (location defaults to their home) |
| GET | `/jobs/mine`, `/jobs/feed` | Client's jobs; handyman feed (open jobs in their trades and radius) |
| GET | `/jobs/:id` | Owner sees everything; handymen see suburb only until hired |
| POST | `/jobs/:id/cancel` | |
| GET/POST | `/jobs/:jobId/quotes` | Client compares quotes; verified handymen send one |
| GET | `/quotes/mine` | Handyman's quotes |
| PATCH | `/quotes/:id`, POST `/quotes/:id/{withdraw,accept,decline}` | Accepting assigns the job and creates a booking awaiting payment |
| GET/POST | `/conversations` | Inbox (`?role=client\|handyman`) / start a chat about a job |
| GET/POST | `/conversations/:id/messages` | Paged history (`?before=`) / send (text + up to 4 photos) |
| POST | `/conversations/:id/{read,block,unblock}` | |
| GET | `/notifications`, POST `/notifications/read` | In-app notifications |
| POST | `/reports` | Flag a user, job or message |
| GET | `/bookings?role=`, `/bookings/:id` | Bookings per side; address shared with the handyman once paid |
| POST | `/bookings/:id/pay` | Client pays (mock provider; `simulate: "decline"` to test failures) |
| POST | `/bookings/:id/{start,complete,confirm}` | Handyman starts/finishes; client confirms → payout released |
| POST | `/bookings/:id/{cancel,dispute,review}` | Cancel before work starts (refund), report a problem (payout frozen), rate each other |
| GET | `/bookings/earnings`, `/handymen/:id/reviews` | Handyman earnings; public client reviews |

**Socket.io** (same host, `auth: { token }`): server emits `notification:new`, `message:new`, `conversation:read`, `typing`;
clients emit `typing`, `conversation:focus` / `conversation:blur` (no push for a chat that's on screen).

**Payments are simulated** (`PAYMENT_PROVIDER=mock`): no money moves. To go live, add `src/services/payments/paystack.js`
with the same `charge` / `refund` / `payout` functions and set `PAYMENT_PROVIDER=paystack`. Completed jobs auto-confirm
after `autoConfirmHours` (default 72) via a 10-minute timer in the API.

**Admin API** (`/api/v1/admin/*`, admin role only; every write is recorded in the audit log): stats and queues,
verifications (approve/reject, verify certificates), users (search, suspend/ban/reinstate), jobs (remove/restore),
bookings, disputes (notes, resolve as release/refund/split), reports (action/dismiss, hide messages/reviews),
categories, settings, audit log.

**Dev helper:** `npm run dev:verify -w apps/api -- <mobile number>` marks a handyman as ID-verified until the admin dashboard exists.

**Push notifications** need an EAS project id: run `npx eas init` in `apps/mobile` once. iOS Expo Go then receives pushes;
Android needs a development build (Expo Go on Android no longer supports remote push). In-app notifications work everywhere.

## Milestones

1. ✅ Foundation: monorepo, auth with OTP, data models, categories, mobile auth and mode switching
2. ✅ Onboarding and profiles: start screen with side selection; client onboarding; handyman profile (about, trades and skills, work history, portfolio, certifications, area and rates, ID verification); public profile; UI kit. *(Service listings move to milestone 3.)*
3. ✅ Jobs and quotes: post a job, nearby handyman feed, send/edit/withdraw quotes, compare and accept *(bookings UI comes with payments)*
4. ✅ Chat and notifications: real-time chat per job, typing and read receipts, in-app and push notifications, report/block
5. ✅ Bookings and payments (simulated): pay, start, complete, confirm or auto-confirm, cancel with refund, disputes freeze payout, reviews, earnings *(real Paystack later)*
6. Reviews, reports, disputes
7. ✅ Admin dashboard: overview and trends, verification queue, disputes with release/refund/split, reports and moderation, users, jobs, bookings, categories, settings, audit log
8. Polish and EAS builds
