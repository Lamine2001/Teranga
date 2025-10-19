/**
 * Navigation Helper for Playwright Tests
 */
import { Page, expect } from '@playwright/test';

export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to home page
   */
  async goToHome() {
    await this.page.goto('/home');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to appointment booking workflow
   */
  async goToBookAppointment() {
    await this.page.goto('/book-appointment');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to specific step in appointment workflow
   */
  async goToWorkflowStep(step: 'mode' | 'patient-type' | 'specialty' | 'doctor' | 'availability' | 'information' | 'confirmation') {
    await this.page.goto(`/book-appointment/${step}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to patient dashboard
   */
  async goToPatientDashboard() {
    await this.page.goto('/patient-dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to doctor dashboard
   */
  async goToDoctorDashboard() {
    await this.page.goto('/doctor-dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to user profile
   */
  async goToProfile() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to edit profile
   */
  async goToEditProfile() {
    await this.page.goto('/profile/edit');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to change password
   */
  async goToChangePassword() {
    await this.page.goto('/profile/change-password');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click breadcrumb to navigate
   */
  async clickBreadcrumb(label: string) {
    await this.page.click(`.breadcrumb a:has-text("${label}"), .breadcrumb-item:has-text("${label}")`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify current URL
   */
  async verifyUrl(expectedPath: string | RegExp) {
    const currentUrl = this.page.url();
    if (typeof expectedPath === 'string') {
      expect(currentUrl).toContain(expectedPath);
    } else {
      expect(currentUrl).toMatch(expectedPath);
    }
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }
}

