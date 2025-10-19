/**
 * Authentication - Login Tests
 */
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth-helper';
import { testUsers } from '../../fixtures/test-data';

test.describe('Login Functionality', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.clearAuth();
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/auth');
    
    // Verify login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Connexion"), button:has-text("Se connecter")')).toBeVisible();
  });

  test('should login as patient successfully', async ({ page }) => {
    await authHelper.login(testUsers.patient.email, testUsers.patient.password, 'patient');
    
    // Verify redirect to patient dashboard or home
    await expect(page).toHaveURL(/\/(home|patient-dashboard|dashboard)/);
    
    // Verify user is logged in
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
    
    // Verify user data in localStorage
    const user = await authHelper.getCurrentUser();
    expect(user).toBeTruthy();
    expect(user.email).toBe(testUsers.patient.email);
  });

  test('should login as doctor successfully', async ({ page }) => {
    await authHelper.login(testUsers.doctor.email, testUsers.doctor.password, 'doctor');
    
    // Verify redirect to doctor dashboard
    await expect(page).toHaveURL(/\/(home|doctor-dashboard|dashboard)/);
    
    // Verify user is logged in
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
    
    // Verify user data
    const user = await authHelper.getCurrentUser();
    expect(user).toBeTruthy();
    expect(user.email).toBe(testUsers.doctor.email);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('input[type="email"]', 'invalid@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(1000);
    
    // Verify error message is displayed
    const errorMessage = page.locator('.error, .alert-danger, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify still on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check if inputs are marked as invalid (HTML5 validation or custom)
    const emailValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    const passwordValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    
    expect(emailValid || passwordValid).toBe(false);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/auth');
    
    // Click on register link
    await page.click('a:has-text("S\'inscrire"), button:has-text("Créer un compte"), a:has-text("Inscription")');
    
    // Verify navigation to registration
    await expect(page).toHaveURL(/\/(auth\?mode=register|register)/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth');
    
    // Click on forgot password link
    await page.click('a:has-text("Mot de passe oublié"), a:has-text("Forgot password")');
    
    // Verify forgot password form or modal is visible
    const forgotPasswordElement = page.locator('input[type="email"], .forgot-password-form, .forgot-password-modal');
    await expect(forgotPasswordElement).toBeVisible({ timeout: 5000 });
  });

  test('should persist login after page refresh', async ({ page }) => {
    await authHelper.login(testUsers.patient.email, testUsers.patient.password, 'patient');
    
    // Refresh the page
    await page.reload();
    
    // Verify user is still logged in
    const isLoggedIn = await authHelper.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
    
    // Verify not redirected to auth page
    await expect(page).not.toHaveURL(/\/auth/);
  });
});

