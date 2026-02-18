# Fried Egg Golf Club (FEGC) - App Overview

## Executive Summary

FEGC is a mobile-first social platform for golfers to discover courses, write reviews, organize meetups, and connect with other members. The app runs natively on iOS (via TestFlight, pending App Store release) and on the web as a static export.

| Environment | URL |
|---|---|
| Web App | https://dist-beau-fried-egg-golfs-projects.vercel.app (Vercel default domain) |
| Admin Panel | https://admin-beau-fried-egg-golfs-projects.vercel.app (Vercel default domain) |
| iOS App | TestFlight (Bundle ID: com.fegc.myapp) |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Expo 54 + React Native 0.81 + React 19 |
| Language | TypeScript 5.9 |
| Routing | expo-router (file-based) |
| Backend / DB | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Maps | Mapbox GL (@rnmapbox/maps native, react-map-gl web) |
| State Management | Single React Context provider (`data/store.tsx`) |
| Push Notifications | Expo Push + Supabase Edge Functions |
| Email | Resend (welcome emails, unread digests) |
| Payments | Stripe (checkout links, webhooks, refunds via Edge Functions) |
| Web Hosting | Vercel (static export from `dist/`) |
| Admin Panel | Vite + React SPA, deployed separately on Vercel |
| iOS Builds | EAS Build + auto-submit to TestFlight |

---

## Codebase Size

| Metric | Count |
|---|---|
| Total TS/TSX files | ~109 |
| Total lines of code | ~22,300 |
| Screens / pages | ~25 |
| Reusable components | ~28 |
| Type definitions | 26 interfaces/types (411 LOC) |
| Store (state layer) | ~2,860 LOC, single file |
| Admin panel source | ~30 files |
| Supabase Edge Functions | 5 (stripe-webhook, stripe-refund, send-welcome-email, send-unread-emails, send-push, notify-nearby-meetup) |

This is a moderately-sized codebase -- roughly equivalent to an early-stage startup MVP. A single developer can navigate the entire thing comfortably.

---

## Estimated Monthly Cost

These estimates assume ~100-500 active users and modest traffic. Costs will vary based on usage patterns.

| Service | Free Tier | Estimated Monthly Cost |
|---|---|---|
| Supabase (Pro) | - | $25 |
| Supabase egress (chat polling) | 250 GB included | $0-50 (see scaling notes) |
| Vercel (Hobby) | 100 GB bandwidth | $0 |
| Mapbox | 50k map loads free | $0 |
| EAS Build (free tier) | 15 builds/mo | $0 |
| Apple Developer Program | - | $8.25 ($99/yr) |
| Resend | 3k emails/mo free | $0 |
| Stripe | Pay-as-you-go | 2.9% + $0.30 per transaction |
| **Total (estimated)** | | **~$35-85/mo** |

At significant scale (1,000+ daily active users), the biggest cost driver will be Supabase egress from chat polling. See scaling section below.

---

## Security Considerations

| Area | Current State | Risk |
|---|---|---|
| Authentication | Supabase Auth (email/password, magic link) | Low -- industry-standard |
| Row-Level Security | RLS policies on Supabase tables | Low -- verify all tables have policies |
| API Keys | Supabase anon key is in client code (expected) | Low -- RLS protects data |
| Service Role Key | In admin `.env` only, not in client | Low |
| Stripe Secrets | In Supabase Edge Function env vars | Low |
| Input Validation | Basic client-side validation | Medium -- add server-side validation for critical writes |
| Content Moderation | Flag queue in admin panel | Low |
| Image Uploads | Direct to Supabase Storage | Medium -- no file type/size validation server-side |
| Push Tokens | Stored in DB, used by Edge Functions | Low |

**Recommendations:**
- Audit all Supabase RLS policies to ensure no tables are publicly writable without authorization
- Add server-side validation on Edge Functions for writes (especially payments)
- Add file type and size limits on Supabase Storage uploads
- Rotate Mapbox token and scope it to your domains

---

## Scaling Concerns

### Critical: Chat Polling

Chat currently uses 5-second polling intervals. At scale this becomes the dominant cost and performance issue:

- **50 active chatters** = ~216 GB/mo egress
- **500 active chatters** = ~2 TB/mo egress (would exceed Supabase Pro bandwidth)

**Mitigation:** Migrate to Supabase Realtime subscriptions. A previous attempt was reverted because unread badges didn't update correctly -- likely needs RLS configuration for Realtime channels.

### Data Loading

- `loadData()` fires ~30-40 queries on app open (profiles, courses, activities, writeups, posts, groups, meetups, conversations, notifications, etc.)
- Tab navigation re-fetches everything with no caching or staleness check
- No pagination on any list (writeups, posts, groups, meetups, conversations)

**Mitigation:** Add pagination, implement stale-while-revalidate caching, and lazy-load data per tab instead of upfront.

### Storage

- Deleted photos are never cleaned up from Supabase Storage
- No image compression or resizing before upload

---

## Remaining Real-World Considerations

### Payments & Membership

- [ ] **Stripe Checkout integration** -- Currently using Stripe payment links (Paylinks). Migrating to Stripe Checkout Sessions would enable programmatic flow control, better error handling, and easier scaling of paid meetups/memberships.
- [ ] **Membership source of truth** -- The app uses Supabase for auth and user state, but Memberstack and Stripe are the actual sources of truth for membership status. These need to be rationalized into a single flow -- likely Stripe as the billing system with webhooks updating Supabase, and deprecating Memberstack.

### Environments & DevOps

- [ ] **Staging vs Production** -- Currently there's a single environment. Need separate Supabase projects, Vercel deployments, and EAS build profiles for staging and production to avoid testing against live data.
- [ ] **CI/CD pipeline** -- No automated testing or deployment pipeline. Builds and deploys are manual.
- [ ] **Database migrations** -- Schema changes are run manually via SQL. Consider a migration tool (Supabase CLI migrations or Prisma).

### Integrations

- [ ] **Hubspot CRM** -- No integration exists yet. Would be valuable for tracking member lifecycle, engagement, and outreach campaigns.
- [ ] **Email marketing** -- Currently using Resend for transactional emails only. No marketing email system (Hubspot, Mailchimp, etc.).
- [ ] **Analytics** -- No analytics platform integrated (Mixpanel, Amplitude, PostHog). No visibility into user behavior, feature adoption, or funnel metrics.

### App Store & Distribution

- [ ] **App Store submission** -- Currently TestFlight only. Need to prepare App Store listing (screenshots, description, privacy policy, review guidelines compliance).
- [ ] **Android build** -- EAS config exists but no Android build has been produced. Need Google Play Developer account ($25 one-time) and Play Store listing.
- [ ] **Privacy policy & Terms of Service** -- Required for App Store and Play Store submission.

### Product & UX

- [ ] **Offline support** -- No offline capability. App requires network for all operations.
- [ ] **Deep linking** -- Verify universal links / app links work correctly for sharing content.
- [ ] **Accessibility** -- No accessibility audit has been done (screen reader labels, contrast ratios, etc.).
- [ ] **Rate limiting** -- No rate limiting on API calls or content creation. A bad actor could spam posts/messages.

### Data & Operations

- [ ] **Backups** -- Verify Supabase automated backups are enabled and test restore process.
- [ ] **Monitoring & Alerting** -- No error tracking (Sentry, Bugsnag) or uptime monitoring.
- [ ] **Storage cleanup** -- Implement a cron job or Edge Function to purge orphaned photos from Supabase Storage.
- [ ] **GDPR / Data deletion** -- No user data export or account deletion flow (required by App Store guidelines).
