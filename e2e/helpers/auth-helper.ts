/**
 * Authentication Helper for Playwright Tests
 */
import { Page, expect } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with email and password
   */
  async login(email: string, password: string, userType: 'doctor' | 'patient' = 'patient') {
    await this.page.goto('/auth');
    
    // Wait for auth page to load
    await this.page.waitForLoadState('networkidle');
    
    // Fill login form
    await this.page.fill('input[name="email"], input[type="email"]', email);
    await this.page.fill('input[name="password"], input[type="password"]', password);
    
    // Select user type if available
    const userTypeSelector = await this.page.locator(`input[value="${userType}"]`).first();
    if (await userTypeSelector.isVisible()) {
      await userTypeSelector.check();
    }
    
    // Click login button
    await this.page.click('button:has-text("Connexion"), button:has-text("Se connecter"), button[type="submit"]');
    
    // Wait for redirect after successful login
    await this.page.waitForURL(/\/(home|dashboard|patient-dashboard|doctor-dashboard)/, { timeout: 15000 });
    
    // Verify login success
    const url = this.page.url();
    expect(url).toMatch(/\/(home|dashboard|patient-dashboard|doctor-dashboard)/);
  }

  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    userType: 'doctor' | 'patient';
    specialization?: string;
    licenseNumber?: string;
    dateOfBirth?: string;
    address?: string;
  }) {
    await this.page.goto('/auth?mode=register');
    
    // Wait for registration form
    await this.page.waitForLoadState('networkidle');
    
    // Fill common fields
    await this.page.fill('input[name="email"], input[type="email"]', userData.email);
    await this.page.fill('input[name="firstName"]', userData.firstName);
    await this.page.fill('input[name="lastName"]', userData.lastName);
    await this.page.fill('input[name="phone"]', userData.phone);
    await this.page.fill('input[name="password"]:not([placeholder*="confirmer"])', userData.password);
    await this.page.fill('input[name="confirmPassword"], input[placeholder*="confirmer"]', userData.confirmPassword);
    
    // Select user type
    await this.page.click(`input[value="${userData.userType}"], label:has-text("${userData.userType === 'doctor' ? 'Médecin' : 'Patient'}")`);
    
    // Fill role-specific fields
    if (userData.userType === 'doctor' && userData.specialization && userData.licenseNumber) {
      await this.page.fill('input[name="specialization"]', userData.specialization);
      await this.page.fill('input[name="licenseNumber"]', userData.licenseNumber);
    } else if (userData.userType === 'patient' && userData.dateOfBirth && userData.address) {
      await this.page.fill('input[name="dateOfBirth"], input[type="date"]', userData.dateOfBirth);
      await this.page.fill('input[name="address"], textarea[name="address"]', userData.address);
    }
    
    // Submit registration
    await this.page.click('button:has-text("S\'inscrire"), button:has-text("Créer"), button[type="submit"]');
    
    // Wait for redirect after successful registration
    await this.page.waitForURL(/\/(home|dashboard)/, { timeout: 15000 });
  }

  /**
   * Logout from the application
   */
  async logout() {
    // Look for logout button in header/menu
    const logoutButton = this.page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion"), button:has-text("Logout")');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Try opening user menu first
      await this.page.click('button:has-text("Mon compte"), .user-menu, .profile-menu');
      await logoutButton.click();
    }
    
    // Wait for redirect to auth page
    await this.page.waitForURL(/\/auth|\/login|^\/$/, { timeout: 10000 });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('authToken'));
    return !!token;
  }

  /**
   * Get current user data from localStorage
   */
  async getCurrentUser() {
    return await this.page.evaluate(() => {
      const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
  }

  /**
   * Clear authentication state
   */
  async clearAuth() {
    await this.page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      sessionStorage.clear();
    });
  }
}

