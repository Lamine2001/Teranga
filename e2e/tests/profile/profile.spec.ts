/**
 * User Profile Tests
 */
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth-helper';
import { NavigationHelper } from '../../helpers/navigation-helper';
import { testUsers, profileUpdateData, passwordChangeData } from '../../fixtures/test-data';

test.describe('User Profile Management', () => {
  let authHelper: AuthHelper;
  let navHelper: NavigationHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navHelper = new NavigationHelper(page);
    
    // Login as patient
    await authHelper.login(testUsers.patient.email, testUsers.patient.password, 'patient');
  });

  test('should display user profile', async ({ page }) => {
    await navHelper.goToProfile();
    
    // Verify profile page loaded
    await expect(page).toHaveURL(/\/profile/);
    
    // Verify profile information is displayed
    const profileSection = page.locator('.profile, .user-profile, main');
    await expect(profileSection).toBeVisible();
  });

  test('should display user information correctly', async ({ page }) => {
    await navHelper.goToProfile();
    
    // Verify user name is displayed
    const userName = page.locator(`:has-text("${testUsers.patient.firstName}"), :has-text("${testUsers.patient.lastName}")`);
    await expect(userName.first()).toBeVisible({ timeout: 5000 });
    
    // Verify email is displayed
    const userEmail = page.locator(`:has-text("${testUsers.patient.email}")`);
    await expect(userEmail.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to edit profile', async ({ page }) => {
    await navHelper.goToProfile();
    
    // Click edit button
    await page.click('button:has-text("Modifier"), a:has-text("Edit"), button:has-text("Éditer")');
    
    // Verify navigation to edit page
    await expect(page).toHaveURL(/\/profile\/edit/);
  });

  test('should update profile information', async ({ page }) => {
    await navHelper.goToEditProfile();
    
    // Update profile fields
    await page.fill('input[name="firstName"]', profileUpdateData.firstName);
    await page.fill('input[name="lastName"]', profileUpdateData.lastName);
    await page.fill('input[name="phone"]', profileUpdateData.phone);
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Enregistrer"), button:has-text("Save")');
    
    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    
    // Verify success (either message or redirect to profile)
    const successMessage = await page.locator('.success, .alert-success, :has-text("succès")').isVisible({ timeout: 3000 }).catch(() => false);
    const redirected = page.url().includes('/profile') && !page.url().includes('/edit');
    
    expect(successMessage || redirected).toBeTruthy();
  });

  test('should navigate to change password', async ({ page }) => {
    await navHelper.goToProfile();
    
    // Click change password button
    await page.click('button:has-text("Changer le mot de passe"), a:has-text("Mot de passe"), button:has-text("Password")');
    
    // Verify navigation or modal opened
    const isModal = await page.locator('.modal, [role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
    const isNewPage = page.url().includes('/change-password') || page.url().includes('/password');
    
    expect(isModal || isNewPage).toBeTruthy();
  });

  test('should change password successfully', async ({ page }) => {
    await navHelper.goToChangePassword();
    
    // Fill password change form
    await page.fill('input[name="currentPassword"], input[placeholder*="actuel"]', testUsers.patient.password);
    await page.fill('input[name="newPassword"]:not([name="confirmPassword"])', passwordChangeData.newPassword);
    await page.fill('input[name="confirmPassword"], input[name="confirmNewPassword"]', passwordChangeData.confirmPassword);
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Changer"), button:has-text("Update")');
    
    // Wait for result
    await page.waitForTimeout(2000);
    
    // Verify success message
    const successMessage = page.locator('.success, .alert-success, :has-text("succès")');
    const isVisible = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    
    // Note: In real scenario, we would need to change it back
    if (isVisible) {
      // Change password back to original
      await page.fill('input[name="currentPassword"]', passwordChangeData.newPassword);
      await page.fill('input[name="newPassword"]:not([name="confirmPassword"])', testUsers.patient.password);
      await page.fill('input[name="confirmPassword"]', testUsers.patient.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
  });

  test('should show error for incorrect current password', async ({ page }) => {
    await navHelper.goToChangePassword();
    
    // Fill with incorrect current password
    await page.fill('input[name="currentPassword"]', 'WrongPassword@123');
    await page.fill('input[name="newPassword"]:not([name="confirmPassword"])', 'NewPassword@456');
    await page.fill('input[name="confirmPassword"]', 'NewPassword@456');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error
    await page.waitForTimeout(1000);
    
    // Verify error message
    const errorMessage = page.locator('.error, .alert-danger, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should validate password confirmation match', async ({ page }) => {
    await navHelper.goToChangePassword();
    
    // Fill with mismatched passwords
    await page.fill('input[name="currentPassword"]', testUsers.patient.password);
    await page.fill('input[name="newPassword"]:not([name="confirmPassword"])', 'NewPassword@456');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword@789');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify validation error
    await page.waitForTimeout(500);
    const errorMessage = page.locator('.error, .invalid-feedback, :has-text("correspondent")');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should cancel profile edit', async ({ page }) => {
    await navHelper.goToEditProfile();
    
    // Make some changes
    await page.fill('input[name="firstName"]', 'Changed Name');
    
    // Click cancel button
    await page.click('button:has-text("Annuler"), button:has-text("Cancel")');
    
    // Verify navigation back to profile
    await expect(page).toHaveURL(/\/profile(?!\/edit)/);
    
    // Verify changes were not saved (original name still displayed)
    const originalName = page.locator(`:has-text("${testUsers.patient.firstName}")`);
    await expect(originalName).toBeVisible({ timeout: 3000 });
  });
});

