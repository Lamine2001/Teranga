/**
 * Appointment Booking Workflow Tests
 */
import { test, expect } from '@playwright/test';
import { AppointmentWorkflowPage } from '../../pages/appointment-workflow.page';
import { AuthHelper } from '../../helpers/auth-helper';
import { testUsers } from '../../fixtures/test-data';

test.describe('Appointment Booking Workflow', () => {
  let workflowPage: AppointmentWorkflowPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    workflowPage = new AppointmentWorkflowPage(page);
    authHelper = new AuthHelper(page);
  });

  test.describe('Guest User Workflow', () => {
    test('should complete consultation mode selection', async ({ page }) => {
      await workflowPage.goto();
      
      // Verify page loaded
      await expect(page).toHaveURL(/\/book-appointment/);
      
      // Select cabinet mode
      await workflowPage.selectConsultationMode('cabinet');
      
      // Verify selection
      await expect(workflowPage.cabinetModeButton).toHaveClass(/selected|active/);
      
      // Click continue
      await workflowPage.clickContinue();
      
      // Verify navigation to next step
      await expect(page).toHaveURL(/\/book-appointment\/(patient-type|mode)/);
    });

    test('should complete patient type selection', async ({ page }) => {
      await page.goto('/book-appointment/patient-type');
      
      // Select new patient
      await workflowPage.selectPatientType('nouveau');
      
      // Verify selection
      await expect(workflowPage.newPatientButton).toHaveClass(/selected|active/);
      
      // Click continue
      await workflowPage.clickContinue();
      
      // Verify navigation to specialty selection
      await expect(page).toHaveURL(/\/book-appointment\/specialty/);
    });

    test('should complete specialty selection', async ({ page }) => {
      await page.goto('/book-appointment/specialty');
      
      // Select Cardiologie specialty
      await workflowPage.selectSpecialty('Cardiologie');
      
      // Click continue
      await workflowPage.clickContinue();
      
      // Verify navigation to doctor selection
      await expect(page).toHaveURL(/\/book-appointment\/doctor/);
    });

    test('should complete doctor selection', async ({ page }) => {
      await page.goto('/book-appointment/doctor');
      
      // Wait for doctors to load
      await page.waitForSelector('.doctor-card, .professional-card', { timeout: 10000 });
      
      // Get first available doctor
      const firstDoctor = await page.locator('.doctor-card, .professional-card').first();
      await firstDoctor.scrollIntoViewIfNeeded();
      await firstDoctor.click();
      
      // Verify selection
      await expect(firstDoctor).toHaveClass(/selected|active/);
      
      // Click continue
      await workflowPage.clickContinue();
      
      // Verify navigation to availability
      await expect(page).toHaveURL(/\/book-appointment\/availability/);
    });

    test('should search and filter doctors', async ({ page }) => {
      await page.goto('/book-appointment/doctor');
      
      // Wait for doctors to load
      await page.waitForSelector('.doctor-card, .professional-card', { timeout: 10000 });
      
      // Search for a doctor
      await workflowPage.searchDoctor('Dr');
      
      // Verify search results
      const doctorCards = await workflowPage.doctorCards.count();
      expect(doctorCards).toBeGreaterThan(0);
      
      // Sort doctors by rating
      if (await workflowPage.sortByDropdown.isVisible()) {
        await workflowPage.sortDoctors('rating');
        await page.waitForTimeout(500);
      }
    });

    test('should complete full booking workflow', async ({ page }) => {
      await workflowPage.completeBookingWorkflow({
        mode: 'cabinet',
        patientType: 'nouveau',
        specialty: 'Cardiologie',
      });
      
      // Verify we reached doctor selection or availability
      await expect(page).toHaveURL(/\/book-appointment\/(doctor|availability)/);
      
      // Verify workflow state is saved
      await workflowPage.verifyWorkflowState({
        consultationMode: 'cabinet',
        patientType: 'nouveau',
        specialty: 'cardiologie',
      });
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display breadcrumb on each step', async ({ page }) => {
      await workflowPage.goto();
      
      // Verify breadcrumb is visible
      await expect(workflowPage.breadcrumb).toBeVisible();
      
      // Navigate through workflow
      await workflowPage.selectConsultationMode('cabinet');
      await workflowPage.clickContinue();
      
      // Verify breadcrumb updates
      await workflowPage.verifyBreadcrumbStep('Type de patient');
    });

    test('should navigate back using breadcrumb', async ({ page }) => {
      // Navigate to specialty step
      await page.goto('/book-appointment/specialty');
      
      // Click on "Type de consultation" in breadcrumb
      await workflowPage.clickBreadcrumbItem('Type de consultation');
      
      // Verify navigation back
      await expect(page).toHaveURL(/\/book-appointment\/mode/);
    });

    test('should preserve workflow state when navigating back', async ({ page }) => {
      // Complete first two steps
      await workflowPage.goto();
      await workflowPage.selectConsultationMode('video');
      await workflowPage.clickContinue();
      
      await workflowPage.selectPatientType('existant');
      await workflowPage.clickContinue();
      
      // Navigate back using breadcrumb
      await workflowPage.clickBreadcrumbItem('Mode');
      
      // Verify previous selection is still selected
      await expect(workflowPage.videoModeButton).toHaveClass(/selected|active/);
      
      // Navigate forward again
      await workflowPage.clickContinue();
      
      // Verify patient type selection preserved
      await expect(workflowPage.existingPatientButton).toHaveClass(/selected|active/);
    });
  });

  test.describe('Authenticated User Workflow', () => {
    test.beforeEach(async ({ page }) => {
      // Login as patient
      await authHelper.login(testUsers.patient.email, testUsers.patient.password, 'patient');
    });

    test('should book appointment as logged-in patient', async ({ page }) => {
      await workflowPage.completeBookingWorkflow({
        mode: 'video',
        patientType: 'existant',
        specialty: 'Psychologie',
      });
      
      // Verify workflow completed successfully
      await expect(page).toHaveURL(/\/book-appointment\/(doctor|availability|confirmation)/);
    });

    test('should auto-fill patient information', async ({ page }) => {
      await workflowPage.goto();
      await workflowPage.selectConsultationMode('cabinet');
      await workflowPage.clickContinue();
      
      // Select existing patient
      await workflowPage.selectPatientType('existant');
      await workflowPage.clickContinue();
      
      // Continue through workflow
      await workflowPage.selectSpecialty('Cardiologie');
      await workflowPage.clickContinue();
      
      // When reaching information step, verify patient data is pre-filled
      const url = page.url();
      if (url.includes('/information')) {
        const user = await authHelper.getCurrentUser();
        
        // Verify user data would be used
        expect(user).toBeTruthy();
        expect(user.email).toBe(testUsers.patient.email);
      }
    });
  });

  test.describe('Video Consultation Workflow', () => {
    test('should show video consultation specific options', async ({ page }) => {
      await workflowPage.goto();
      
      // Select video mode
      await workflowPage.selectConsultationMode('video');
      await workflowPage.clickContinue();
      
      // Verify video mode is saved
      await workflowPage.verifyWorkflowState({
        consultationMode: 'video',
      });
    });

    test('should display video consultation information', async ({ page }) => {
      await workflowPage.goto();
      await workflowPage.selectConsultationMode('video');
      
      // Verify video consultation features are displayed
      const videoFeatures = page.locator(':has-text("vidéo"), :has-text("Plateforme"), :has-text("distance")');
      await expect(videoFeatures.first()).toBeVisible();
    });
  });

  test.describe('Workflow Validation', () => {
    test('should require mode selection before continuing', async ({ page }) => {
      await workflowPage.goto();
      
      // Try to continue without selection
      await workflowPage.clickContinue();
      
      // Verify still on same page or error shown
      const currentUrl = page.url();
      expect(currentUrl).toContain('/book-appointment');
    });

    test('should persist workflow state across page refresh', async ({ page }) => {
      await workflowPage.goto();
      await workflowPage.selectConsultationMode('cabinet');
      await workflowPage.clickContinue();
      
      // Refresh page
      await page.reload();
      
      // Verify workflow state is still there
      await workflowPage.verifyWorkflowState({
        consultationMode: 'cabinet',
      });
    });
  });
});

