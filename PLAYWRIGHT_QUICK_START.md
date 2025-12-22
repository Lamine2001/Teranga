# 🎭 Playwright Quick Start Guide

## ⚡ Get Started in 5 Minutes

### 1️⃣ Prerequisites Check

```bash
# Verify backend is running
curl http://localhost:8080/actuator/health
# Expected: JSON response with status

# Verify frontend is running (or start it)
curl http://localhost:4200
# Expected: HTML content
```

If either service is not running:

```bash
# Start backend (from securemsante folder)
cd ../
docker compose -f docker-compose.simple-redeploy.yml up -d

# Start frontend (from Teranga folder)
npm start
```

---

### 2️⃣ Run Your First Test

```bash
# Run all tests in UI mode (Interactive - Recommended for first time)
npm run test:e2e:ui

# OR run in headed mode (see browser)
npm run test:e2e:headed

# OR run in headless mode (fast)
npm run test:e2e
```

---

### 3️⃣ View Test Results

```bash
# After tests complete, view the HTML report
npm run test:e2e:report
```

---

## 🎯 Test Suite Overview

### Available Test Suites

| Suite | Tests | File | Command |
|-------|-------|------|---------|
| **Login** | 8 tests | `e2e/tests/auth/login.spec.ts` | `npx playwright test login` |
| **Registration** | 7 tests | `e2e/tests/auth/registration.spec.ts` | `npx playwright test registration` |
| **Booking Workflow** | 15 tests | `e2e/tests/appointments/booking-workflow.spec.ts` | `npx playwright test booking-workflow` |
| **Patient Dashboard** | 8 tests | `e2e/tests/dashboard/patient-dashboard.spec.ts` | `npx playwright test patient-dashboard` |
| **Doctor Dashboard** | 8 tests | `e2e/tests/dashboard/doctor-dashboard.spec.ts` | `npx playwright test doctor-dashboard` |
| **Profile** | 10 tests | `e2e/tests/profile/profile.spec.ts` | `npx playwright test profile` |

**Total: 56+ comprehensive tests**

---

## 🚀 Common Commands

### Development

```bash
# Run tests and watch for changes
npx playwright test --headed --project=chromium

# Debug a specific test
npx playwright test -g "should login as patient" --debug

# Run only failed tests
npx playwright test --last-failed
```

### By Browser

```bash
# Test in Chrome
npm run test:e2e:chromium

# Test in Firefox
npm run test:e2e:firefox

# Test in Safari
npm run test:e2e:webkit

# Test on mobile
npm run test:e2e:mobile
```

### Reports

```bash
# Generate HTML report
npm run test:e2e

# View report
npm run test:e2e:report

# Results are in:
# - playwright-report/ (HTML)
# - test-results/ (JSON, JUnit)
```

---

## 🎬 Example Test Run

```bash
# 1. Make sure services are running
docker ps
# Should see: msante-backend and msante-mysql

# 2. Run a single test file to start
npx playwright test e2e/tests/auth/login.spec.ts --headed

# 3. Watch the browser automate:
# - Navigate to login page
# - Fill in credentials
# - Click submit
# - Verify redirect

# 4. View results in terminal
# ✅ Passed tests will show in green
# ❌ Failed tests will show in red

# 5. For detailed report
npx playwright show-report
```

---

## 🐛 Quick Troubleshooting

### Tests fail with "localhost:4200 not available"
```bash
# Start the frontend
npm start

# Wait for "Angular Live Development Server is listening on localhost:4200"
```

### Tests fail with "API errors"
```bash
# Check backend status
docker logs msante-backend --tail=50

# Restart backend if needed
docker restart msante-backend
```

### Browsers not installed
```bash
# Install Playwright browsers
npx playwright install
```

### Tests are flaky
```bash
# Run with retries
npx playwright test --retries=2

# Run specific test multiple times
npx playwright test login.spec.ts --repeat-each=3
```

---

## 📋 Test Checklist

Before running tests, ensure:

- [ ] Backend is running on port 8080
- [ ] Frontend is running on port 4200
- [ ] MySQL database is accessible
- [ ] Playwright browsers are installed
- [ ] No other services on ports 4200/8080

---

## 🎯 What Gets Tested

### ✅ User Authentication
- Login with valid/invalid credentials
- Registration for patients and doctors
- Password reset flow
- Session persistence

### ✅ Appointment Booking
- Full workflow from mode selection to confirmation
- Breadcrumb navigation
- State persistence
- Doctor search and filtering
- Guest and authenticated user flows

### ✅ Dashboards
- Patient dashboard display and navigation
- Doctor dashboard with appointments
- Statistics and quick actions
- Navigation to other sections

### ✅ Profile Management
- View profile information
- Edit profile details
- Change password
- Form validation

---

## 🎨 Interactive Testing (Recommended)

The best way to start is with UI mode:

```bash
npm run test:e2e:ui
```

This opens an interactive window where you can:
- ✅ Pick which tests to run
- ✅ Watch tests execute in real-time
- ✅ Debug failures immediately
- ✅ View screenshots and videos
- ✅ Inspect element locators

---

## 📊 Expected Results

After running all tests, you should see:

```
Running 56 tests using 4 workers

  ✓ e2e/tests/auth/login.spec.ts (8/8) [2.1s]
  ✓ e2e/tests/auth/registration.spec.ts (7/7) [1.8s]
  ✓ e2e/tests/appointments/booking-workflow.spec.ts (15/15) [4.2s]
  ✓ e2e/tests/dashboard/patient-dashboard.spec.ts (8/8) [1.5s]
  ✓ e2e/tests/dashboard/doctor-dashboard.spec.ts (8/8) [1.6s]
  ✓ e2e/tests/profile/profile.spec.ts (10/10) [2.3s]

  56 passed (13.5s)
```

---

## 🚀 You're Ready!

Everything is set up. Just run:

```bash
npm run test:e2e:ui
```

And start testing! 🎉

For detailed documentation, see: `E2E_TESTING_GUIDE.md`

