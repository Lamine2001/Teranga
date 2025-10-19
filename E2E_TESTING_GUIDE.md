# 🎭 Playwright E2E Testing Guide - Teranga MSanté

## 📋 Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Test Coverage](#test-coverage)
6. [Writing New Tests](#writing-new-tests)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This test suite provides comprehensive end-to-end testing for the Teranga MSanté application using Playwright. It covers:

- ✅ Authentication (Login & Registration)
- ✅ Appointment Booking Workflow
- ✅ User Profile Management
- ✅ Doctor Dashboard
- ✅ Patient Dashboard
- ✅ Breadcrumb Navigation
- ✅ Cross-browser Testing

**Total Test Cases: 30+**

---

## 🚀 Installation

### Prerequisites
- Node.js 18.13.0 or higher
- npm or yarn
- Backend running on http://localhost:8080
- Frontend running on http://localhost:4200

### Install Playwright

```bash
# Already installed via:
npm install -D @playwright/test @types/node --legacy-peer-deps

# Install browsers
npx playwright install
```

---

## 📁 Test Structure

```
e2e/
├── fixtures/
│   └── test-data.ts          # Test data and mock objects
├── helpers/
│   ├── auth-helper.ts         # Authentication utilities
│   └── navigation-helper.ts   # Navigation utilities
├── pages/
│   └── appointment-workflow.page.ts  # Page Object Models
└── tests/
    ├── auth/
    │   ├── login.spec.ts      # Login tests (8 tests)
    │   └── registration.spec.ts # Registration tests (7 tests)
    ├── appointments/
    │   └── booking-workflow.spec.ts # Booking workflow tests (15 tests)
    ├── dashboard/
    │   ├── patient-dashboard.spec.ts # Patient dashboard tests (8 tests)
    │   └── doctor-dashboard.spec.ts  # Doctor dashboard tests (8 tests)
    └── profile/
        └── profile.spec.ts    # Profile tests (10 tests)
```

---

## ▶️ Running Tests

### Run All Tests

```bash
# Run all tests in all browsers
npx playwright test

# Run all tests in headed mode (see browser)
npx playwright test --headed

# Run all tests in Chromium only
npx playwright test --project=chromium
```

### Run Specific Test Suites

```bash
# Run only authentication tests
npx playwright test e2e/tests/auth

# Run only appointment workflow tests
npx playwright test e2e/tests/appointments

# Run only profile tests
npx playwright test e2e/tests/profile

# Run specific test file
npx playwright test e2e/tests/auth/login.spec.ts
```

### Run Specific Tests

```bash
# Run a single test by name
npx playwright test -g "should login as patient"

# Run tests matching a pattern
npx playwright test -g "dashboard"
```

### Debug Mode

```bash
# Run in debug mode with inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test e2e/tests/auth/login.spec.ts --debug
```

### UI Mode (Interactive)

```bash
# Run in UI mode for interactive debugging
npx playwright test --ui
```

---

## 📊 Test Coverage

### Authentication Tests (15 tests)

#### Login Tests (8 tests)
- ✅ Display login form
- ✅ Login as patient successfully
- ✅ Login as doctor successfully
- ✅ Show error for invalid credentials
- ✅ Show validation error for empty fields
- ✅ Navigate to registration page
- ✅ Navigate to forgot password
- ✅ Persist login after page refresh

#### Registration Tests (7 tests)
- ✅ Display registration form
- ✅ Register new patient successfully
- ✅ Register new doctor successfully
- ✅ Show error for mismatched passwords
- ✅ Show validation for invalid email
- ✅ Toggle between patient and doctor registration
- ✅ Navigate to login from registration

### Appointment Workflow Tests (15 tests)

#### Guest User Workflow (6 tests)
- ✅ Complete consultation mode selection
- ✅ Complete patient type selection
- ✅ Complete specialty selection
- ✅ Complete doctor selection
- ✅ Search and filter doctors
- ✅ Complete full booking workflow

#### Breadcrumb Navigation (3 tests)
- ✅ Display breadcrumb on each step
- ✅ Navigate back using breadcrumb
- ✅ Preserve workflow state when navigating back

#### Authenticated User Workflow (2 tests)
- ✅ Book appointment as logged-in patient
- ✅ Auto-fill patient information

#### Video Consultation Workflow (2 tests)
- ✅ Show video consultation specific options
- ✅ Display video consultation information

#### Workflow Validation (2 tests)
- ✅ Require mode selection before continuing
- ✅ Persist workflow state across page refresh

### Dashboard Tests (16 tests)

#### Patient Dashboard (8 tests)
- ✅ Display patient dashboard
- ✅ Display welcome message with patient name
- ✅ Display upcoming appointments
- ✅ Navigate to book appointment
- ✅ Display patient statistics
- ✅ Navigate to profile
- ✅ Display recent appointments
- ✅ Display quick actions

#### Doctor Dashboard (8 tests)
- ✅ Display doctor dashboard
- ✅ Display welcome message with doctor name
- ✅ Display today's appointments
- ✅ Navigate to availability management
- ✅ Display doctor statistics
- ✅ Display patient list
- ✅ Navigate to profile
- ✅ Display upcoming appointments

### Profile Tests (10 tests)
- ✅ Display user profile
- ✅ Display user information correctly
- ✅ Navigate to edit profile
- ✅ Update profile information
- ✅ Navigate to change password
- ✅ Change password successfully
- ✅ Show error for incorrect current password
- ✅ Validate password confirmation match
- ✅ Cancel profile edit
- ✅ Verify changes are persisted

---

## 📝 Writing New Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth-helper';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/some-page');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page).toHaveURL('/expected-url');
  });
});
```

### Using Page Object Model

```typescript
import { AppointmentWorkflowPage } from '../../pages/appointment-workflow.page';

test('should use page object', async ({ page }) => {
  const workflowPage = new AppointmentWorkflowPage(page);
  
  await workflowPage.goto();
  await workflowPage.selectConsultationMode('cabinet');
  await workflowPage.clickContinue();
  
  await expect(page).toHaveURL(/\/patient-type/);
});
```

---

## 🎯 Best Practices

### 1. Use Locators Wisely

```typescript
// ❌ Bad: Fragile selectors
await page.click('#button-123');

// ✅ Good: Semantic selectors
await page.click('button:has-text("Continue")');
```

### 2. Wait for Network Idle

```typescript
// Wait for page to fully load
await page.waitForLoadState('networkidle');
```

### 3. Use Assertions

```typescript
// ✅ Good: Use expect for assertions
await expect(page.locator('.element')).toBeVisible();

// ❌ Bad: Boolean checks without assertions
const isVisible = await page.locator('.element').isVisible();
```

### 4. Isolate Tests

```typescript
// Each test should be independent
test.beforeEach(async ({ page }) => {
  // Clear state before each test
  await authHelper.clearAuth();
});
```

### 5. Use Page Objects

```typescript
// Encapsulate page interactions in Page Objects
class MyPage {
  constructor(private page: Page) {}
  
  async clickButton() {
    await this.page.click('button');
  }
}
```

---

## 🔧 Configuration

### Test Environment Variables

Create `.env.test` file:

```bash
# Backend URL
BACKEND_URL=http://localhost:8080

# Frontend URL
FRONTEND_URL=http://localhost:4200

# Test credentials
TEST_PATIENT_EMAIL=patient.test@msante.sn
TEST_PATIENT_PASSWORD=Patient@123

TEST_DOCTOR_EMAIL=doctor.test@msante.sn
TEST_DOCTOR_PASSWORD=Doctor@123
```

### Playwright Config Highlights

```typescript
// playwright.config.ts
{
  baseURL: 'http://localhost:4200',
  timeout: 60000,
  retries: 2,
  workers: 4,
  
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }
}
```

---

## 🧪 Test Execution Commands

### Development

```bash
# Run tests while developing
npx playwright test --headed --project=chromium

# Run specific test file in watch mode
npx playwright test login.spec.ts --headed --project=chromium

# Debug a failing test
npx playwright test --debug
```

### CI/CD

```bash
# Run all tests in CI mode
npx playwright test --reporter=html,junit

# Generate test report
npx playwright show-report
```

### Performance Testing

```bash
# Run tests with performance tracing
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

---

## 📊 Test Reports

### HTML Report

```bash
# Run tests
npx playwright test

# View report
npx playwright show-report
```

### JUnit Report

Located at: `test-results/junit.xml`

### JSON Report

Located at: `test-results/results.json`

---

## 🐛 Troubleshooting

### Issue: Tests fail with "Timeout"

**Solution:**
```typescript
// Increase timeout for slow operations
await page.waitForSelector('.element', { timeout: 30000 });
```

### Issue: "Element not visible"

**Solution:**
```typescript
// Scroll element into view
await element.scrollIntoViewIfNeeded();

// Wait for element to be visible
await expect(element).toBeVisible({ timeout: 10000 });
```

### Issue: "Navigation timeout"

**Solution:**
```typescript
// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Or increase navigation timeout
await page.goto('/path', { timeout: 30000 });
```

### Issue: Flaky tests

**Solutions:**
1. Use auto-waiting features
2. Avoid hardcoded waits (`waitForTimeout`)
3. Use `waitForSelector` or `waitForLoadState`
4. Enable retries in config

### Issue: Backend not responding

**Check:**
```bash
# Verify backend is running
curl http://localhost:8080/actuator/health

# Check Docker containers
docker ps

# View backend logs
docker logs msante-backend
```

---

## 🎨 Advanced Features

### Visual Regression Testing

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveScreenshot('home-page.png');
});
```

### Network Interception

```typescript
test('should mock API response', async ({ page }) => {
  await page.route('**/api/appointments/**', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ appointments: [] })
    });
  });
  
  await page.goto('/appointments');
});
```

### Accessibility Testing

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/home');
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## 📦 Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:mobile": "playwright test --project='Mobile Chrome'"
  }
}
```

---

## 🎯 Test Scenarios Coverage

### ✅ **Authentication Scenarios**
- [x] Guest user can view login page
- [x] User can login with valid credentials
- [x] User sees error with invalid credentials
- [x] User can register as patient
- [x] User can register as doctor
- [x] User can reset password
- [x] Login persists after refresh
- [x] User can logout

### ✅ **Appointment Booking Scenarios**
- [x] Guest can start booking process
- [x] Guest can select consultation mode (cabinet/video)
- [x] Guest can select patient type (new/existing)
- [x] Guest can select specialty
- [x] Guest can view and select doctors
- [x] Guest can search doctors
- [x] Guest can filter/sort doctors
- [x] Breadcrumb navigation works
- [x] Workflow state persists
- [x] Authenticated user auto-fills info

### ✅ **Dashboard Scenarios**
- [x] Patient can view their dashboard
- [x] Patient can see upcoming appointments
- [x] Patient can book new appointment
- [x] Doctor can view their dashboard
- [x] Doctor can see today's appointments
- [x] Doctor can manage availability
- [x] Doctor can view patient list

### ✅ **Profile Scenarios**
- [x] User can view profile
- [x] User can edit profile
- [x] User can change password
- [x] Profile updates are validated
- [x] Changes are persisted

---

## 🔍 Test Data

### Test Users (Defined in `fixtures/test-data.ts`)

```typescript
// Test Patient
Email: patient.test@msante.sn
Password: Patient@123

// Test Doctor
Email: doctor.test@msante.sn
Password: Doctor@123
```

**Note:** For registration tests, unique emails are generated using timestamps to avoid conflicts.

---

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start Backend
        run: docker compose up -d
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🎬 Running Your First Test

### Step 1: Ensure Services are Running

```bash
# Check backend
curl http://localhost:8080/actuator/health

# Check frontend
curl http://localhost:4200
```

### Step 2: Run a Single Test

```bash
# Run login test
npx playwright test e2e/tests/auth/login.spec.ts --headed --project=chromium
```

### Step 3: View Results

```bash
# Generate and open report
npx playwright show-report
```

---

## 🔑 Key Helper Functions

### AuthHelper

```typescript
const authHelper = new AuthHelper(page);

// Login
await authHelper.login(email, password, userType);

// Register
await authHelper.register(userData);

// Logout
await authHelper.logout();

// Check if logged in
const isLoggedIn = await authHelper.isLoggedIn();

// Clear auth state
await authHelper.clearAuth();
```

### NavigationHelper

```typescript
const navHelper = new NavigationHelper(page);

// Navigate to pages
await navHelper.goToHome();
await navHelper.goToBookAppointment();
await navHelper.goToPatientDashboard();
await navHelper.goToDoctorDashboard();
await navHelper.goToProfile();

// Workflow navigation
await navHelper.goToWorkflowStep('specialty');

// Breadcrumb navigation
await navHelper.clickBreadcrumb('Accueil');
```

### AppointmentWorkflowPage

```typescript
const workflowPage = new AppointmentWorkflowPage(page);

// Select options
await workflowPage.selectConsultationMode('cabinet');
await workflowPage.selectPatientType('nouveau');
await workflowPage.selectSpecialty('Cardiologie');
await workflowPage.selectDoctor('Dr. Amadou Diallo');

// Complete full workflow
await workflowPage.completeBookingWorkflow({
  mode: 'cabinet',
  patientType: 'nouveau',
  specialty: 'Cardiologie',
  doctorName: 'Dr. Amadou Diallo'
});

// Verify state
await workflowPage.verifyWorkflowState({
  consultationMode: 'cabinet',
  specialty: 'cardiologie'
});
```

---

## 💡 Tips for Success

### 1. **Always Clean State**
```typescript
test.beforeEach(async ({ page }) => {
  await authHelper.clearAuth();
  // Clear any other persistent state
});
```

### 2. **Use Descriptive Test Names**
```typescript
// ✅ Good
test('should display error when submitting empty login form', ...);

// ❌ Bad
test('test 1', ...);
```

### 3. **Group Related Tests**
```typescript
test.describe('Login Validation', () => {
  test('should validate email', ...);
  test('should validate password', ...);
});
```

### 4. **Handle Async Properly**
```typescript
// Always await async operations
await page.click('button');
await expect(element).toBeVisible();
```

### 5. **Use Soft Assertions for Multiple Checks**
```typescript
// Continue test even if assertion fails
await expect.soft(element1).toBeVisible();
await expect.soft(element2).toBeVisible();
```

---

## 📊 Test Metrics

### Expected Execution Time
- **All tests (single browser)**: ~5-8 minutes
- **All browsers**: ~15-20 minutes
- **Single test suite**: ~1-2 minutes

### Success Criteria
- **Pass Rate**: > 95%
- **Flakiness**: < 5%
- **Coverage**: All critical user journeys

---

## 🚀 Quick Start Commands

```bash
# 1. Install Playwright (already done)
npm install -D @playwright/test

# 2. Install browsers
npx playwright install

# 3. Run all tests
npx playwright test

# 4. Run tests in UI mode (recommended for first time)
npx playwright test --ui

# 5. View last test report
npx playwright show-report
```

---

## 📞 Support

**Common Issues:**
- Backend not running → Start with `docker compose up -d`
- Frontend not running → Start with `npm start`
- Port conflicts → Check ports 4200 and 8080 are available
- Test failures → Check logs in `test-results/` directory

**Useful Commands:**
```bash
# Check test configuration
npx playwright test --list

# Generate code for new tests
npx playwright codegen http://localhost:4200

# Update snapshots
npx playwright test --update-snapshots
```

---

## 🎉 Test Execution Status

**Last Updated:** 2025-10-10  
**Total Tests:** 56+  
**Status:** ✅ Ready to run  
**Coverage:** All major user flows  

Run your first test:
```bash
npx playwright test --ui
```

Happy Testing! 🎭✨

