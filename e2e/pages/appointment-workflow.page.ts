/**
 * Page Object Model for Appointment Booking Workflow
 */
import { Page, Locator, expect } from '@playwright/test';

export class AppointmentWorkflowPage {
  readonly page: Page;
  
  // Consultation Mode Selector
  readonly cabinetModeButton: Locator;
  readonly videoModeButton: Locator;
  readonly continueButton: Locator;
  
  // Patient Type Selector
  readonly newPatientButton: Locator;
  readonly existingPatientButton: Locator;
  
  // Specialty Selector
  readonly specialtyCards: Locator;
  
  // Doctor Selection
  readonly doctorCards: Locator;
  readonly searchDoctorInput: Locator;
  readonly sortByDropdown: Locator;
  
  // Breadcrumb
  readonly breadcrumb: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Consultation Mode elements
    this.cabinetModeButton = page.locator('button:has-text("Consultation en cabinet"), .mode-card:has-text("cabinet")').first();
    this.videoModeButton = page.locator('button:has-text("Consultation en vidéo"), .mode-card:has-text("vidéo")').first();
    this.continueButton = page.locator('button:has-text("Continuer"), button:has-text("Suivant")').first();
    
    // Patient Type elements
    this.newPatientButton = page.locator('button:has-text("Nouveau patient"), .patient-type-card:has-text("Nouveau")').first();
    this.existingPatientButton = page.locator('button:has-text("Patient existant"), .patient-type-card:has-text("existant")').first();
    
    // Specialty elements
    this.specialtyCards = page.locator('.specialty-card, button[class*="specialty"]');
    
    // Doctor Selection elements
    this.doctorCards = page.locator('.doctor-card, .professional-card');
    this.searchDoctorInput = page.locator('input[placeholder*="Rechercher"], input[type="search"]');
    this.sortByDropdown = page.locator('select[name="sortBy"], .sort-dropdown');
    
    // Breadcrumb
    this.breadcrumb = page.locator('.breadcrumb, nav[aria-label="breadcrumb"]');
  }

  /**
   * Navigate to appointment workflow start
   */
  async goto() {
    await this.page.goto('/book-appointment');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select consultation mode
   */
  async selectConsultationMode(mode: 'cabinet' | 'video') {
    if (mode === 'cabinet') {
      await this.cabinetModeButton.click();
    } else {
      await this.videoModeButton.click();
    }
    
    // Verify selection
    const selectedCard = mode === 'cabinet' ? this.cabinetModeButton : this.videoModeButton;
    await expect(selectedCard).toHaveClass(/selected|active/);
  }

  /**
   * Select patient type
   */
  async selectPatientType(type: 'nouveau' | 'existant') {
    if (type === 'nouveau') {
      await this.newPatientButton.click();
    } else {
      await this.existingPatientButton.click();
    }
    
    // Verify selection
    const selectedCard = type === 'nouveau' ? this.newPatientButton : this.existingPatientButton;
    await expect(selectedCard).toHaveClass(/selected|active/);
  }

  /**
   * Select specialty
   */
  async selectSpecialty(specialty: string) {
    const specialtyCard = this.page.locator(`.specialty-card:has-text("${specialty}"), button:has-text("${specialty}")`).first();
    await specialtyCard.click();
    
    // Verify selection
    await expect(specialtyCard).toHaveClass(/selected|active/);
  }

  /**
   * Select a doctor by name
   */
  async selectDoctor(doctorName: string) {
    const doctorCard = this.page.locator(`.doctor-card:has-text("${doctorName}"), .professional-card:has-text("${doctorName}")`).first();
    await doctorCard.scrollIntoViewIfNeeded();
    await doctorCard.click();
    
    // Verify selection
    await expect(doctorCard).toHaveClass(/selected|active/);
  }

  /**
   * Search for doctors
   */
  async searchDoctor(searchTerm: string) {
    await this.searchDoctorInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for search results
  }

  /**
   * Sort doctors by criteria
   */
  async sortDoctors(sortBy: 'rating' | 'experience' | 'price' | 'availability') {
    await this.sortByDropdown.selectOption(sortBy);
    await this.page.waitForTimeout(500); // Wait for sorting
  }

  /**
   * Click continue button
   */
  async clickContinue() {
    await this.continueButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Complete full appointment booking workflow
   */
  async completeBookingWorkflow(options: {
    mode: 'cabinet' | 'video';
    patientType: 'nouveau' | 'existant';
    specialty: string;
    doctorName?: string;
  }) {
    // Step 1: Select consultation mode
    await this.goto();
    await this.selectConsultationMode(options.mode);
    await this.clickContinue();
    
    // Step 2: Select patient type
    await this.selectPatientType(options.patientType);
    await this.clickContinue();
    
    // Step 3: Select specialty
    await this.selectSpecialty(options.specialty);
    await this.clickContinue();
    
    // Step 4: Select doctor (if provided)
    if (options.doctorName) {
      await this.selectDoctor(options.doctorName);
      await this.clickContinue();
    }
  }

  /**
   * Verify breadcrumb shows correct step
   */
  async verifyBreadcrumbStep(stepName: string) {
    const breadcrumbItem = this.breadcrumb.locator(`:has-text("${stepName}")`);
    await expect(breadcrumbItem).toBeVisible();
  }

  /**
   * Click breadcrumb to navigate back
   */
  async clickBreadcrumbItem(itemName: string) {
    await this.breadcrumb.locator(`a:has-text("${itemName}")`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify workflow state is persisted
   */
  async verifyWorkflowState(expectedState: {
    consultationMode?: string;
    patientType?: string;
    specialty?: string;
  }) {
    const state = await this.page.evaluate(() => {
      const stateStr = localStorage.getItem('appointment-workflow-state');
      return stateStr ? JSON.parse(stateStr) : null;
    });
    
    if (expectedState.consultationMode) {
      expect(state.consultationMode).toBe(expectedState.consultationMode);
    }
    if (expectedState.patientType) {
      expect(state.patientType).toBe(expectedState.patientType);
    }
    if (expectedState.specialty) {
      expect(state.specialty).toBe(expectedState.specialty);
    }
  }
}

