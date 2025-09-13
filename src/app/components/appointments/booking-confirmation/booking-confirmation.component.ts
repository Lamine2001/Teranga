import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService, AppointmentResponseDTO } from '../../../services/appointment.service';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.scss']
})
export class BookingConfirmationComponent implements OnInit {
  @Input() selectedSlot!: AppointmentResponseDTO;
  @Input() user: any = null;
  @Output() bookingComplete = new EventEmitter<any>();
  @Output() bookingCancel = new EventEmitter<void>();

  bookingForm: FormGroup;
  paymentForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPaymentSection = false;
  paymentMethod = '';
  bookingData: any = null;

  // Appointment types
  appointmentTypes = [
    { value: 'virtual', label: 'Consultation en ligne', icon: 'fas fa-video' },
    { value: 'onsite', label: 'Consultation sur site', icon: 'fas fa-hospital' }
  ];

  // Urgency levels
  urgencyLevels = [
    { value: 'low', label: 'Faible', description: 'Routine, pas urgent', color: '#28a745' },
    { value: 'medium', label: 'Moyen', description: 'Dans les prochains jours', color: '#ffc107' },
    { value: 'high', label: 'Urgent', description: 'Dans les 24h', color: '#dc3545' }
  ];

  // Payment methods
  paymentMethods = [
    { 
      value: 'card', 
      label: 'Carte bancaire', 
      icon: 'fas fa-credit-card',
      description: 'Visa, Mastercard'
    },
    { 
      value: 'mobile_money', 
      label: 'Mobile Money', 
      icon: 'fas fa-mobile-alt',
      description: 'Orange Money, MTN Money'
    },
    { 
      value: 'onsite', 
      label: 'Paiement sur place', 
      icon: 'fas fa-hand-holding-usd',
      description: 'Espèces, carte bancaire'
    },
    { 
      value: 'insurance', 
      label: 'Assurance maladie', 
      icon: 'fas fa-shield-alt',
      description: 'CNAS, IPM, autres'
    }
  ];

  // Mobile money providers
  mobileMoneyProviders = [
    { value: 'orange_money', label: 'Orange Money', icon: 'fas fa-mobile-alt', color: '#ff6600' },
    { value: 'mtn_money', label: 'MTN Money', icon: 'fas fa-mobile-alt', color: '#ffcc00' },
    { value: 'free_money', label: 'Free Money', icon: 'fas fa-mobile-alt', color: '#0066cc' }
  ];

  // Technical requirements for virtual appointments
  technicalRequirements = [
    { key: 'hasStableInternet', label: 'Connexion internet stable' },
    { key: 'hasWebcam', label: 'Webcam fonctionnelle' },
    { key: 'hasMicrophone', label: 'Microphone activé' },
    { key: 'hasSpeaker', label: 'Haut-parleurs/casque' }
  ];

  // Video platforms
  videoPlatforms = [
    { value: 'zoom', label: 'Zoom', icon: 'fab fa-zoom' },
    { value: 'google_meet', label: 'Google Meet', icon: 'fab fa-google' },
    { value: 'teams', label: 'Microsoft Teams', icon: 'fab fa-microsoft' }
  ];

  // Reminder options
  reminderOptions = [
    { value: 'email', label: 'Email', icon: 'fas fa-envelope' },
    { value: 'sms', label: 'SMS', icon: 'fas fa-sms' },
    { value: 'both', label: 'Email et SMS', icon: 'fas fa-bell' }
  ];

  reminderTimings = [
    { value: '24h', label: '24h avant', icon: 'fas fa-clock' },
    { value: '2h', label: '2h avant', icon: 'fas fa-clock' },
    { value: '30min', label: '30min avant', icon: 'fas fa-clock' }
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private paymentService: PaymentService
  ) {
    this.bookingForm = this.fb.group({
      reasonForVisit: ['', [Validators.required]],
      symptoms: [''],
      urgency: ['medium', [Validators.required]],
      preferredLanguage: ['fr'],
      appointmentType: ['virtual', [Validators.required]],
      
      // Virtual appointment specific
      technicalRequirements: this.fb.group({
        hasStableInternet: [true],
        hasWebcam: [true],
        hasMicrophone: [true],
        hasSpeaker: [true],
        platformPreference: ['zoom']
      }),
      
      // On-site appointment specific
      transportationMethod: ['personal'],
      accessibilityNeeds: [''],
      
      // Communication preferences
      reminderMethod: ['both'],
      reminderTiming: ['24h'],
      
      // Additional notes
      additionalNotes: ['']
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['', [Validators.required]],
      
      // Card payment details
      cardDetails: this.fb.group({
        cardNumber: [''],
        expiryMonth: [''],
        expiryYear: [''],
        cvv: [''],
        cardholderName: ['']
      }),
      
      // Mobile money details
      mobileMoneyDetails: this.fb.group({
        provider: [''],
        phoneNumber: [''],
        pin: ['']
      }),
      
      // Insurance details
      insuranceDetails: this.fb.group({
        provider: [''],
        policyNumber: [''],
        memberId: ['']
      })
    });
  }

  ngOnInit(): void {
    // Set default values based on selected slot
    this.bookingForm.patchValue({
      appointmentType: this.selectedSlot.appointmentType || 'virtual'
    });

    // Watch payment method changes
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.paymentMethod = method;
      this.updatePaymentValidation(method);
    });
  }

  updatePaymentValidation(paymentMethod: string): void {
    const cardDetails = this.paymentForm.get('cardDetails');
    const mobileMoneyDetails = this.paymentForm.get('mobileMoneyDetails');
    const insuranceDetails = this.paymentForm.get('insuranceDetails');

    // Reset all validators
    cardDetails?.clearValidators();
    mobileMoneyDetails?.clearValidators();
    insuranceDetails?.clearValidators();

    // Apply validators based on payment method
    switch (paymentMethod) {
      case 'card':
        cardDetails?.setValidators([
          Validators.required,
          this.validateCardDetails.bind(this)
        ]);
        break;
      case 'mobile_money':
        mobileMoneyDetails?.setValidators([
          Validators.required,
          this.validateMobileMoneyDetails.bind(this)
        ]);
        break;
      case 'insurance':
        insuranceDetails?.setValidators([
          Validators.required,
          this.validateInsuranceDetails.bind(this)
        ]);
        break;
    }

    // Update validation
    cardDetails?.updateValueAndValidity();
    mobileMoneyDetails?.updateValueAndValidity();
    insuranceDetails?.updateValueAndValidity();
  }

  validateCardDetails(group: any): any {
    const cardNumber = group.get('cardNumber')?.value;
    const expiryMonth = group.get('expiryMonth')?.value;
    const expiryYear = group.get('expiryYear')?.value;
    const cvv = group.get('cvv')?.value;
    const cardholderName = group.get('cardholderName')?.value;

    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardholderName) {
      return { incomplete: true };
    }

    // Basic card number validation
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      return { invalidCardNumber: true };
    }

    // CVV validation
    if (!/^\d{3,4}$/.test(cvv)) {
      return { invalidCvv: true };
    }

    return null;
  }

  validateMobileMoneyDetails(group: any): any {
    const provider = group.get('provider')?.value;
    const phoneNumber = group.get('phoneNumber')?.value;
    const pin = group.get('pin')?.value;

    if (!provider || !phoneNumber || !pin) {
      return { incomplete: true };
    }

    // Phone number validation
    if (!/^\+221\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(phoneNumber)) {
      return { invalidPhoneNumber: true };
    }

    return null;
  }

  validateInsuranceDetails(group: any): any {
    const provider = group.get('provider')?.value;
    const policyNumber = group.get('policyNumber')?.value;
    const memberId = group.get('memberId')?.value;

    if (!provider || !policyNumber || !memberId) {
      return { incomplete: true };
    }

    return null;
  }

  onProceedToPayment(): void {
    if (this.bookingForm.valid) {
      this.bookingData = this.bookingForm.value;
      this.showPaymentSection = true;
    } else {
      this.markFormGroupTouched();
    }
  }

  onBackToBooking(): void {
    this.showPaymentSection = false;
  }

  onSubmitBooking(): void {
    if (this.showPaymentSection && this.paymentForm.invalid) {
      this.markPaymentFormTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Prepare booking data
    const bookingData = {
      availabilityId: this.selectedSlot.id,
      patientId: this.user?.id,
      appointmentType: this.bookingForm.get('appointmentType')?.value,
      reasonForVisit: this.bookingForm.get('reasonForVisit')?.value,
      symptoms: this.bookingForm.get('symptoms')?.value,
      urgency: this.bookingForm.get('urgency')?.value,
      preferredLanguage: this.bookingForm.get('preferredLanguage')?.value,
      technicalRequirements: this.bookingForm.get('technicalRequirements')?.value,
      transportationMethod: this.bookingForm.get('transportationMethod')?.value,
      accessibilityNeeds: this.bookingForm.get('accessibilityNeeds')?.value,
      reminderPreferences: {
        method: this.bookingForm.get('reminderMethod')?.value,
        timing: this.bookingForm.get('reminderTiming')?.value
      },
      additionalNotes: this.bookingForm.get('additionalNotes')?.value,
      paymentData: this.paymentForm.value
    };

    // Process payment first if required
    if (this.paymentMethod !== 'onsite' && this.paymentMethod !== 'insurance') {
      this.processPayment(bookingData);
    } else {
      this.createAppointment(bookingData);
    }
  }

  private processPayment(bookingData: any): void {
    const paymentData = {
      amount: this.selectedSlot.consultationFee,
      currency: 'XOF',
      paymentMethod: this.paymentMethod,
      appointmentData: bookingData,
      ...this.paymentForm.value
    };

    this.paymentService.processPayment(paymentData).subscribe({
      next: (paymentResponse) => {
        if (paymentResponse.success) {
          bookingData.paymentId = paymentResponse.paymentId;
          this.createAppointment(bookingData);
        } else {
          this.isLoading = false;
          this.errorMessage = paymentResponse.error || 'Erreur lors du traitement du paiement';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du traitement du paiement';
        console.error('Payment error:', error);
      }
    });
  }

  private createAppointment(bookingData: any): void {
    this.appointmentService.bookAppointment(bookingData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Rendez-vous confirmé avec succès!';
          this.bookingComplete.emit(response.appointment);
        } else {
          this.errorMessage = response.error || 'Erreur lors de la réservation';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors de la réservation';
        console.error('Booking error:', error);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.bookingForm.controls).forEach(key => {
      const control = this.bookingForm.get(key);
      control?.markAsTouched();
    });
  }

  private markPaymentFormTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  cancelBooking(): void {
    this.bookingCancel.emit();
  }

  getUrgencyColor(urgency: string): string {
    const level = this.urgencyLevels.find(u => u.value === urgency);
    return level?.color || '#6c757d';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getAppointmentTypeIcon(type: string): string {
    const appointmentType = this.appointmentTypes.find(t => t.value === type);
    return appointmentType?.icon || 'fas fa-calendar';
  }

  getPaymentMethodIcon(method: string): string {
    const paymentMethod = this.paymentMethods.find(m => m.value === method);
    return paymentMethod?.icon || 'fas fa-credit-card';
  }

  isVirtualAppointment(): boolean {
    return this.bookingForm.get('appointmentType')?.value === 'virtual';
  }

  isOnsiteAppointment(): boolean {
    return this.bookingForm.get('appointmentType')?.value === 'onsite';
  }

  getFieldError(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} est requis`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      reasonForVisit: 'Raison de la consultation',
      urgency: 'Niveau d\'urgence',
      appointmentType: 'Type de consultation'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bookingForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getDateDisplay(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTimeRange(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
}
