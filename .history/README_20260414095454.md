# 🧪 Fortly — Automated Test Suite

A full three-layer test automation suite for **Fortly**, a SaaS platform that helps small businesses build their online presence with a portfolio, booking system, gallery, reviews, and built-in chat.

The suite covers **Unit Tests**, **Integration Tests**, and **End-to-End Tests** — written with [Playwright](https://playwright.dev) and [Jest](https://jestjs.io), with credentials managed securely via environment variables.

> ⚠️ **Note:** All credentials and environment-specific URLs are stored in environment variables and are not included in this repository. See [Setup](#setup) for configuration instructions.

---

## 🗂️ Project Structure

```
├── tests/
│   ├── e2e/                          # Full browser flow tests (Playwright)
│   │   ├── onboarding.spec.ts        # Business signup & onboarding
│   │   ├── login.spec.ts             # Business login
│   │   ├── booking.spec.ts           # Client booking flow
│   │   ├── chat.spec.ts              # Real-time chat (client ↔ business)
│   │   ├── gallery.spec.ts           # Image & video upload/delete
│   │   ├── reviews.spec.ts           # Review submission & business reply
│   │   ├── services.spec.ts          # Service management & scheduling
│   │   └── sidebar.spec.ts           # Business profile & social links
│   ├── integration/                  # API-level tests (Jest + Axios)
│   │   ├── auth.test.ts              # Login, get me, forgot password
│   │   ├── business.test.ts          # Get business by slug, booking policy
│   │   ├── bookings.test.ts          # Available slots, create, cancel
│   │   ├── reviews.test.ts           # Get, create, reply
│   │   └── services.test.ts          # CRUD for services
│   └── unit/                         # Component & utility tests (Jest)
│       ├── apiCache.test.ts          # Cache get/set/invalidate/prefix
│       ├── dateHelpers.test.ts       # Date formatting & calendar utilities
│       ├── businessData.test.ts      # Business data shape & helpers
│       ├── ReviewCard.test.tsx       # ReviewCard component rendering
│       ├── GalleryItem.test.tsx      # GalleryItem image/video rendering
│       └── BookingPolicy.test.tsx    # BookingPolicy component rendering
├── helpers/
│   └── auth.ts                       # Shared login helper for E2E tests
├── assets/
│   ├── sample-image.png              # Test image for upload tests
│   ├── sample-video.mp4              # Test video for upload tests
│   └── logo.jpg                      # Test logo for onboarding
├── .env.test.example                 # Environment variable template
├── playwright.config.ts              # Playwright configuration
├── jest.config.ts                    # Jest configuration
└── package.json
```

---

## ✨ What's Tested

### 🎭 E2E Tests (Playwright)

Full browser automation tests covering real user flows across both the **business dashboard** and **client-facing pages**.

| Test File | What It Covers |
|---|---|
| `onboarding.spec.ts` | Business signup, logo upload, slug generation, category selection, account deletion cleanup |
| `login.spec.ts` | Valid credential login, redirect to dashboard |
| `booking.spec.ts` | Client selects service → fills form → confirms booking → booking appears in business calendar → business confirms |
| `chat.spec.ts` | Client opens chat → sends message → business receives and replies → client sees reply (real-time, unique message IDs per run) |
| `gallery.spec.ts` | Upload image and video → verify Cloudinary URLs → zoom/nav in modal → verify on client page → delete both → verify client gallery is empty |
| `reviews.spec.ts` | Client submits review → verify on client page → verify on business page → business replies → verify reply on both sides |
| `services.spec.ts` | Add booking policy → add service → edit service → set weekly schedule → full cleanup |
| `sidebar.spec.ts` | Edit profile (tagline, description, location, social links) → verify changes → restore original values |

### 🔗 Integration Tests (Jest + Axios)

Direct API tests hitting real endpoints with authentication, covering happy paths and error cases.

| Test File | Endpoints Covered |
|---|---|
| `auth.test.ts` | `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password` |
| `business.test.ts` | `GET /business/:slug`, `PUT /business/booking-policy` |
| `bookings.test.ts` | `GET /bookings/available-slots`, `POST /bookings`, `GET /bookings/client/:email`, `GET /bookings/my-bookings`, `PUT /bookings/:id/cancel` |
| `reviews.test.ts` | `GET /reviews/business/:slug`, `GET /reviews/my-reviews`, `POST /reviews`, `PUT /reviews/:id/reply` |
| `services.test.ts` | `GET /services/business/:slug`, `GET /services/my-services`, `POST /services`, `PUT /services/:id`, `DELETE /services/:id` |

Each integration test covers:
- ✅ Happy path (correct data, correct auth)
- ❌ Missing required fields
- ❌ Wrong/missing auth token
- ❌ Non-existent resources (404)

### ⚙️ Unit Tests (Jest)

Isolated tests for utility functions and React components — no browser or network required.

| Test File | What It Tests |
|---|---|
| `apiCache.test.ts` | `getCached`, `setCached`, `invalidateCache`, `invalidatePrefix` — including TTL expiry simulation with `Date.now` mocking |
| `dateHelpers.test.ts` | `formatDate`, `formatTime`, `formatDateTime`, `getMonthName`, `getDaysInMonth`, `getFirstDayOfMonth`, `isToday`, `isSameDay`, `addDays`, `startOfWeek`, `endOfWeek`, `getWeekDays`, `formatDateForAPI`, `isUpcoming`, `isPast`, `getRelativeTime` |
| `businessData.test.ts` | `businessData` shape, `getBusinessName`, `getContactInfo`, `getBusinessHours` |
| `ReviewCard.test.tsx` | Name/date/text rendering, star rating (filled vs empty), business reply section |
| `GalleryItem.test.tsx` | Image rendering, video rendering, muted attribute, `onClick` handler |
| `BookingPolicy.test.tsx` | Default content, custom props, empty list, HTML structure (h2, ol) |

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
npm install
npx playwright install --with-deps
```

### Environment Variables

```bash
cp .env.test.example .env.test
```

Fill in your values — see `.env.test.example` for the full list. Required variables include:

```
BASE_URL=
API_URL=
TEST_BUSINESS_EMAIL=
TEST_BUSINESS_PASSWORD=
TEST_BUSINESS_NAME=
TEST_BUSINESS_TAGLINE=
TEST_BUSINESS_DESCRIPTION=
TEST_BUSINESS_LOCATION=
TEST_OWNER_NAME=
TEST_OWNER_MOBILENUMBER=
TEST_CLIENT_NAME=
TEST_CLIENT_EMAIL=
TEST_CLIENT_MOBILENUMBER=
TEST_CLIENT_ADDRESS=
TEST_BUSINESS_EXISTING_LINK=
TEST_BUSINESS_EXISTING_ACCOUNT=
TEST_BUSINESS_EXISTING_PASSWORD=
TEST_BUSINESS_TEMP_EMAIL_ONBOARDING=
```

---

## ▶️ Running Tests

> ⚠️ Make sure your local server is running before executing integration or E2E tests:
> ```bash
> npm run dev
> ```

### Unit Tests (Jest — no server needed)
```bash
npm run test:unit
```
Runs all tests in `tests/unit_tests/` using jsdom environment. No server required.

### Integration Tests (Jest + Axios — server required)
```bash
npm run test:integration
```
Runs all tests in `tests/integration_tests/` against the live API. Tests run serially (`--runInBand`) to avoid race conditions.

### Run a specific unit or integration test file
```bash
# Unit test
npx jest tests/unit_tests/dateHelpers.test.ts --watchAll=false

# Integration test
npx jest tests/integration_tests/auth.test.ts --watchAll=false --runInBand
```

### E2E Tests (Playwright — server required)
```bash
npx playwright test
```

### Run a specific E2E test file
```bash
npx playwright test tests/e2e/booking.spec.ts
```

### Run E2E tests in headed mode (watch the browser)
```bash
npx playwright test --headed
```

### Run E2E tests in debug mode
```bash
npx playwright test --debug
```

### Generate Playwright selector interactively
```bash
npx playwright codegen http://localhost:3000
```

---

## 📊 Test Reports

```bash
# Playwright HTML report (E2E)
npx playwright show-report
```

Reports include pass/fail results, screenshots, video recordings, and detailed step logs.

---

## 🧠 Technical Highlights

- **Full three-layer coverage** — unit, integration, and E2E tests in a single unified suite
- **Real-time chat testing** — E2E test uses unique message IDs per run (`Date.now()` + random suffix) to prevent false positives from previous test runs
- **Cross-tab E2E flows** — business and client flows tested simultaneously using `page.context().waitForEvent('page')` for multi-tab scenarios
- **Cloudinary media verification** — gallery tests assert actual Cloudinary URLs are present after upload, not just that the upload button was clicked
- **Self-cleaning tests** — E2E tests restore original data after each run (sidebar values, booking policy, services) so the test environment stays consistent
- **TTL expiry simulation** — cache unit tests mock `Date.now` to simulate time passing without waiting
- **Component + logic coverage** — unit tests cover both React components (rendering, props, events) and pure utility functions (date formatting, cache, business data)
- **Integration test chaining** — bookings and reviews integration tests create a resource in one test and use the returned ID in subsequent tests (update, cancel, reply)
- **Secure credential handling** — all sensitive data via `.env.test`, never hardcoded

---

## 🏗️ About Fortly

Fortly is a SaaS platform built for small businesses — providing a professional online presence with a customizable portfolio, booking system, gallery, built-in client chat, reviews, and a shareable business link. This test suite was written by the same developer who built the product.