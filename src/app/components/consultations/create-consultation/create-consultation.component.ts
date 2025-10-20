/**
 * Create Consultation Component
 * Allows doctors to create and manage consultations with patient history
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Consultation, StartConsultationRequest } from '../../../models/consultation.model';
import { ConsultationNotesComponent } from '../consultation-notes/consultation-notes.component';
import { environment } from '../../../../environments/environment';

interface PatientInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  medicalHistory?: string[];
}

interface PreviousConsultation {
  id: number;
  date: string;
  doctorName: string;
  diagnosis: string;
  treatment: string;
  prescriptions?: any[];
}

@Component({
  selector: 'app-create-consultation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConsultationNotesComponent],
  templateUrl: './create-consultation.component.html',
  styleUrls: ['./create-consultation.component.scss']
})
export class CreateConsultationComponent implements OnInit {
  // Patient selection
  searchPatientForm: FormGroup;
  selectedPatient: PatientInfo | null = null;
  searchResults: PatientInfo[] = [];
  isSearching = false;
  
  // Consultation
  currentConsultation: Consultation | null = null;
  consultationStarted = false;
  consultationStartTime?: Date;
  
  // Patient history
  patientPreviousConsultations: PreviousConsultation[] = [];
  isLoadingHistory = false;
  showPatientHistory = true;
  
  // Current doctor
  currentDoctor: any = null;
  
  // UI states
  activeTab: 'current' | 'history' | 'attachments' = 'current';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private consultationService: ConsultationService,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.searchPatientForm = this.fb.group({
      searchQuery: ['', [Validators.required, Validators.minLength(2)]],
      searchType: ['name'] // 'name', 'email', 'phone', 'id'
    });
  }

  ngOnInit(): void {
    this.currentDoctor = this.authService.getCurrentUser();
    
    // Check if patient ID or appointment ID is provided in route params
    this.route.params.subscribe(params => {
      const appointmentId = params['appointmentId'];
      
      if (appointmentId) {
        // Load appointment details first, then start consultation
        this.loadAppointmentAndStartConsultation(+appointmentId);
      } else if (params['patientId']) {
        this.loadPatientById(+params['patientId']);
      }
    });
  }

  /**
   * Load appointment details and start consultation
   */
  private loadAppointmentAndStartConsultation(appointmentId: number): void {
    this.isLoading = true;
    
    // Fetch appointment details from backend
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
    
    this.http.get<any>(`${environment.apiUrl}/appointments/${appointmentId}`, { 
      headers 
    }).subscribe({
      next: (appointment) => {
        // Extract patient information from appointment
        if (appointment.patientId) {
          this.selectedPatient = {
            id: appointment.patientId,
            firstName: appointment.patientFirstName || appointment.firstName,
            lastName: appointment.patientLastName || appointment.lastName,
            email: appointment.patientEmail || appointment.email,
            phone: appointment.patientPhone || appointment.phone,
            dateOfBirth: appointment.patientDateOfBirth,
            gender: appointment.patientGender,
            address: appointment.patientAddress
          };
          
          // Load patient history
          this.loadPatientHistory(appointment.patientId);
          
          // Automatically start consultation
          this.startConsultationFromAppointment(appointmentId, appointment.appointmentType || 'onsite');
        } else {
          this.errorMessage = 'Informations patient manquantes dans le rendez-vous';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading appointment:', error);
        this.errorMessage = 'Impossible de charger les détails du rendez-vous';
        this.isLoading = false;
      }
    });
  }

  /**
   * Search for patients
   */
  searchPatients(): void {
    if (this.searchPatientForm.invalid) {
      return;
    }

    this.isSearching = true;
    this.errorMessage = '';
    const query = this.searchPatientForm.get('searchQuery')?.value;

    // Call user service to search patients
    this.userService.searchUsers(query, 'PATIENT').subscribe({
      next: (results: any[]) => {
        this.searchResults = results.map(user => ({
          id: user.id || user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address
        }));
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching patients:', error);
        this.errorMessage = 'Erreur lors de la recherche de patients';
        this.isSearching = false;
        this.searchResults = [];
      }
    });
  }

  /**
   * Select a patient from search results
   */
  selectPatient(patient: PatientInfo): void {
    this.selectedPatient = patient;
    this.searchResults = [];
    this.searchPatientForm.reset();
    this.loadPatientHistory(patient.id);
  }

  /**
   * Load patient by ID
   */
  loadPatientById(patientId: number): void {
    this.userService.getUserById(patientId).subscribe({
      next: (user: any) => {
        this.selectedPatient = {
          id: user.id || user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address,
          medicalHistory: user.medicalHistory
        };
        this.loadPatientHistory(patientId);
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.errorMessage = 'Impossible de charger les informations du patient';
      }
    });
  }

  /**
   * Load patient consultation history
   */
  loadPatientHistory(patientId: number): void {
    this.isLoadingHistory = true;

    this.consultationService.getPatientConsultations({ patientId }).subscribe({
      next: (consultations) => {
        this.patientPreviousConsultations = consultations.map(c => ({
          id: c.id,
          date: c.startTime,
          doctorName: `Dr. ${c.doctorFirstName} ${c.doctorLastName}`,
          diagnosis: c.diagnosis || 'Non spécifié',
          treatment: c.treatment || 'Non spécifié',
          prescriptions: c.prescriptions
        }));
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading patient history:', error);
        this.isLoadingHistory = false;
        this.patientPreviousConsultations = [];
      }
    });
  }

  /**
   * Start a new consultation
   */
  startNewConsultation(): void {
    if (!this.selectedPatient) {
      this.errorMessage = 'Veuillez sélectionner un patient';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const request: StartConsultationRequest = {
      appointmentId: 0, // For walk-in consultations without appointment
      consultationType: 'onsite',
      patientId: this.selectedPatient.id
    } as any;

    this.consultationService.startConsultation(request).subscribe({
      next: (consultation) => {
        this.currentConsultation = consultation;
        this.consultationStarted = true;
        this.consultationStartTime = new Date();
        this.isLoading = false;
        this.successMessage = 'Consultation démarrée avec succès';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du démarrage de la consultation';
        console.error('Error starting consultation:', error);
      }
    });
  }

  /**
   * Start consultation from an existing appointment
   */
  startConsultationFromAppointment(appointmentId: number, consultationType: 'virtual' | 'onsite' = 'onsite'): void {
    this.isLoading = true;

    const request: StartConsultationRequest = {
      appointmentId: appointmentId,
      consultationType: consultationType,
      patientId: this.selectedPatient?.id // Include patientId
    };

    this.consultationService.startConsultation(request).subscribe({
      next: (consultation) => {
        this.currentConsultation = consultation;
        this.consultationStarted = true;
        this.consultationStartTime = new Date();
        
        // If patient info not already loaded, load from consultation
        if (!this.selectedPatient) {
          this.selectedPatient = {
            id: consultation.patientId,
            firstName: consultation.patientFirstName,
            lastName: consultation.patientLastName,
            email: consultation.patientEmail
          };
          this.loadPatientHistory(consultation.patientId);
        }
        
        this.isLoading = false;
        this.successMessage = `Consultation démarrée avec ${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du démarrage de la consultation';
        console.error('Error starting consultation:', error);
      }
    });
  }

  /**
   * View a previous consultation
   */
  viewPreviousConsultation(consultationId: number): void {
    window.open(`/consultations/${consultationId}`, '_blank');
  }

  /**
   * Cancel patient selection
   */
  clearPatientSelection(): void {
    this.selectedPatient = null;
    this.patientPreviousConsultations = [];
    this.currentConsultation = null;
    this.consultationStarted = false;
  }

  /**
   * Handle consultation ended event
   */
  onConsultationEnded(): void {
    this.successMessage = 'Consultation terminée avec succès';
    
    setTimeout(() => {
      this.router.navigate(['/doctor-dashboard']);
    }, 2000);
  }

  /**
   * Get consultation duration
   */
  getConsultationDuration(): string {
    if (!this.consultationStartTime) return '00:00';
    
    const now = new Date();
    const diff = now.getTime() - this.consultationStartTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Calculate patient age
   */
  getPatientAge(dateOfBirth?: string): number {
    if (!dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Handle file selection for attachments
   */
  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0 && this.currentConsultation) {
      // TODO: Implement file upload
      console.log('Files selected:', files);
      for (let i = 0; i < files.length; i++) {
        this.consultationService.addConsultationAttachment(this.currentConsultation.id, files[i]).subscribe({
          next: () => {
            console.log('File uploaded successfully:', files[i].name);
            this.successMessage = `Fichier ${files[i].name} téléchargé avec succès`;
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            console.error('Error uploading file:', error);
            this.errorMessage = `Erreur lors du téléchargement de ${files[i].name}`;
          }
        });
      }
    }
  }
}

