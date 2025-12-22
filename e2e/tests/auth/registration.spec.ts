/**
 * Authentication - Registration Tests
 */
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth-helper';
import { testUsers } from '../../fixtures/test-data';

test.describe('Registration Functionality', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.clearAuth();
  });

  test('should display registration form', async ({ page }) => {
    await page.goto('/auth?mode=register');
    
    // Verify registration form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register new patient successfully', async ({ page }) => {
    const newPatient = {
      ...testUsers.newPatient,
      email: `patient_${Date.now()}@msante.sn`, // Unique email
    };
    
    await authHelper.register(newPatient);
    
    // Verify redirect after successful registration
    await expect(page).toHaveURL(/\/(home|dashboard)/, { timeout: 15000 });
    
    // Verify user is logged in
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  });

  test('should register new doctor successfully', async ({ page }) => {
    const newDoctor = {
      ...testUsers.doctor,
      email: `doctor_${Date.now()}@msante.sn`, // Unique email
      confirmPassword: testUsers.doctor.password,
    };
    
    await authHelper.register(newDoctor);
    
    // Verify redirect after successful registration
    await expect(page).toHaveURL(/\/(home|dashboard)/, { timeout: 15000 });
    
    // Verify user is logged in
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/auth?mode=register');
    
    await page.fill('input[name="email"]', 'test@msante.sn');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '+221 77 123 45 67');
    await page.fill('input[name="password"]:not([placeholder*="confirmer"])', 'Password@123');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword@456');
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(500);
    
    // Verify error message about password mismatch
    const errorMessage = page.locator('.error, .alert-danger, [class*="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth?mode=register');
    
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.click('button[type="submit"]');
    
    // Verify email field is marked as invalid
    const emailInput = page.locator('input[name="email"]');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('should toggle between patient and doctor registration', async ({ page }) => {
    await page.goto('/auth?mode=register');
    
    // Select patient
    await page.click('input[value="patient"], label:has-text("Patient")');
    
    // Verify patient-specific fields
    await expect(page.locator('input[name="dateOfBirth"], input[type="date"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('input[name="address"], textarea[name="address"]')).toBeVisible({ timeout: 2000 });
    
    // Select doctor
    await page.click('input[value="doctor"], label:has-text("Médecin")');
    
    // Verify doctor-specific fields
    await expect(page.locator('input[name="specialization"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('input[name="licenseNumber"]')).toBeVisible({ timeout: 2000 });
  });

  test('should navigate to login page from registration', async ({ page }) => {
    await page.goto('/auth?mode=register');
    
    // Click on login link
    await page.click('a:has-text("Se connecter"), a:has-text("Connexion"), button:has-text("Login")');
    
    // Verify navigation to login
    await expect(page).toHaveURL(/\/(auth(?!\?mode=register)|login)$/);
  });
});

