/**
 * Patient Dashboard Tests
 */
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth-helper';
import { NavigationHelper } from '../../helpers/navigation-helper';
import { testUsers } from '../../fixtures/test-data';

test.describe('Patient Dashboard', () => {
  let authHelper: AuthHelper;
  let navHelper: NavigationHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navHelper = new NavigationHelper(page);
    
    // Login as patient
    await authHelper.login(testUsers.patient.email, testUsers.patient.password, 'patient');
  });

  test('should display patient dashboard', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Verify dashboard loaded
    await expect(page).toHaveURL(/\/(patient-dashboard|dashboard)/);
    
    // Verify dashboard elements
    const dashboard = page.locator('.dashboard, .patient-dashboard, main');
    await expect(dashboard).toBeVisible();
  });

  test('should display welcome message with patient name', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Verify welcome message
    const welcomeMessage = page.locator(`:has-text("Bienvenue"), :has-text("${testUsers.patient.firstName}")`);
    await expect(welcomeMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display upcoming appointments', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Look for appointments section
    const appointmentsSection = page.locator('.appointments, .upcoming-appointments, :has-text("Rendez-vous")');
    await expect(appointmentsSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to book appointment', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Click book appointment button
    await page.click('button:has-text("Prendre rendez-vous"), a:has-text("Nouveau rendez-vous"), button:has-text("Book")');
    
    // Verify navigation
    await expect(page).toHaveURL(/\/(book-appointment|appointments\/search)/);
  });

  test('should display patient statistics', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Look for statistics cards
    const stats = page.locator('.stat-card, .dashboard-card, .metric');
    const count = await stats.count();
    
    // Should have at least some dashboard elements
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to profile from dashboard', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Click on profile link/button
    await page.click('a:has-text("Profil"), button:has-text("Mon profil"), .profile-link');
    
    // Verify navigation to profile
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display recent appointments', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Look for recent appointments section
    const recentAppointments = page.locator('.recent-appointments, .appointment-history, :has-text("Historique")');
    
    // Should be visible or show empty state
    const isVisible = await recentAppointments.first().isVisible({ timeout: 3000 }).catch(() => false);
    const emptyState = await page.locator(':has-text("Aucun rendez-vous"), :has-text("No appointments")').isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(isVisible || emptyState).toBeTruthy();
  });

  test('should display quick actions', async ({ page }) => {
    await navHelper.goToPatientDashboard();
    
    // Look for quick action buttons
    const quickActions = page.locator('.quick-actions, .action-buttons, button, a[class*="action"]');
    const count = await quickActions.count();
    
    expect(count).toBeGreaterThan(0);
  });
});

