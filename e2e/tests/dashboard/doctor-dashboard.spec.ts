/**
 * Doctor Dashboard Tests
 */
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth-helper';
import { NavigationHelper } from '../../helpers/navigation-helper';
import { testUsers } from '../../fixtures/test-data';

test.describe('Doctor Dashboard', () => {
  let authHelper: AuthHelper;
  let navHelper: NavigationHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navHelper = new NavigationHelper(page);
    
    // Login as doctor
    await authHelper.login(testUsers.doctor.email, testUsers.doctor.password, 'doctor');
  });

  test('should display doctor dashboard', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Verify dashboard loaded
    await expect(page).toHaveURL(/\/(doctor-dashboard|dashboard)/);
    
    // Verify dashboard elements
    const dashboard = page.locator('.dashboard, .doctor-dashboard, main');
    await expect(dashboard).toBeVisible();
  });

  test('should display welcome message with doctor name', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Verify welcome message
    const welcomeMessage = page.locator(`:has-text("Dr."), :has-text("${testUsers.doctor.firstName}")`);
    await expect(welcomeMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display today appointments', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Look for today's appointments section
    const todayAppointments = page.locator('.today-appointments, :has-text("Aujourd\'hui"), :has-text("Today")');
    await expect(todayAppointments.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to availability management', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Click on availability/schedule button
    await page.click('button:has-text("Disponibilités"), a:has-text("Gérer mes disponibilités"), button:has-text("Schedule")');
    
    // Verify navigation or modal opened
    await page.waitForTimeout(1000);
    
    const isModal = await page.locator('.modal, [role="dialog"]').isVisible().catch(() => false);
    const isNewPage = page.url().includes('/availability') || page.url().includes('/schedule');
    
    expect(isModal || isNewPage).toBeTruthy();
  });

  test('should display doctor statistics', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Look for statistics cards
    const stats = page.locator('.stat-card, .dashboard-card, .metric');
    const count = await stats.count();
    
    // Should display various statistics
    expect(count).toBeGreaterThan(0);
  });

  test('should display patient list or appointments', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Look for patient/appointment list
    const patientList = page.locator('.patient-list, .appointment-list, table, .list-group');
    
    const isVisible = await patientList.first().isVisible({ timeout: 3000 }).catch(() => false);
    const emptyState = await page.locator(':has-text("Aucun"), :has-text("No patients")').isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(isVisible || emptyState).toBeTruthy();
  });

  test('should navigate to profile from dashboard', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Click on profile link/button
    await page.click('a:has-text("Profil"), button:has-text("Mon profil"), .profile-link');
    
    // Verify navigation to profile
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display upcoming appointments', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Look for upcoming appointments section
    const upcomingSection = page.locator('.upcoming-appointments, :has-text("À venir"), :has-text("Upcoming")');
    await expect(upcomingSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('should create new availability slot', async ({ page }) => {
    await navHelper.goToDoctorDashboard();
    
    // Click create availability button
    const createButton = page.locator('button:has-text("Créer"), button:has-text("Nouvelle disponibilité"), button:has-text("Add")');
    
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      
      // Verify form or modal opened
      const form = page.locator('form, .modal, [role="dialog"]');
      await expect(form).toBeVisible({ timeout: 5000 });
    }
  });
});

