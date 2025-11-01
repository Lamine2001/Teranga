/**
 * Create Consultation Component
 * Allows doctors to create and manage consultations with patient history
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ConsultationNotesComponent],
  templateUrl: './create-consultation.component.html',
  styleUrls: ['./create-consultation.component.scss']
})
export class CreateConsultationComponent implements OnInit, OnDestroy {
  // Patient selection
  searchPatientForm: FormGroup;
  selectedPatient: PatientInfo | null = null;
  searchResults: PatientInfo[] = [];
  isSearching = false;
  
  // Autocomplete
  private searchTerms = new Subject<string>();
  private readonly MIN_SEARCH_LENGTH = 4;
  showAutocomplete = false;
  
  // Patient appointments table
  showPatientsTable = true; // Changed from false to true
  patientsWithAppointments: any[] = [];
  filteredPatients: any[] = [];
  isLoadingPatients = false;
  tableFilterText = '';
  tableSortColumn: 'name' | 'date' | 'status' = 'date';
  tableSortDirection: 'asc' | 'desc' = 'desc';
  selectedStatusFilter = '';
  selectedStartDate = '';
  selectedEndDate = '';
  
  // Consultation
  currentConsultation: Consultation | null = null;
  consultationStarted = false;
  consultationStartTime?: Date;
  selectedAppointment: any = null; // Add missing property
  
  // Patient history
  patientPreviousConsultations: PreviousConsultation[] = [];
  isLoadingHistory = false;
  showPatientHistory = true;
  
  // Current doctor
  currentDoctor: any = null;
  currentDoctorId: number | null = null; // Add missing property
  
  // Auto-save
  private autoSaveTimer: any; // Add auto-save timer
  
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
    this.currentDoctorId = this.currentDoctor?.id || this.currentDoctor?.userId; // Set doctor ID
    
    // Setup autocomplete for patient search
    this.setupAutocomplete();
    
    // Check if patient ID or appointment ID is provided in route params
    this.route.params.subscribe(params => {
      const appointmentId = params['appointmentId'];
      
      if (appointmentId) {
        // Load appointment details first, then start consultation
        this.loadAppointmentAndStartConsultation(+appointmentId);
      } else if (params['patientId']) {
        this.loadPatientById(+params['patientId']);
      } else {
        // Load patients with appointments for this doctor by default
        this.loadPatientsWithAppointments();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchTerms.complete();
    // Clear auto-save timer
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  /**
   * Setup autocomplete with debounce and minimum character check
   */
  private setupAutocomplete(): void {
    this.searchTerms.pipe(
      // Wait 300ms after each keystroke
      debounceTime(300),
      // Only search if term is at least MIN_SEARCH_LENGTH characters
      filter(term => term.length >= this.MIN_SEARCH_LENGTH),
      // Ignore if same as previous search term
      distinctUntilChanged(),
      // Switch to new search observable (cancel previous)
      switchMap((term: string) => {
        this.isSearching = true;
        console.log('Autocomplete search for:', term);
        return this.userService.searchUsers(term, 'PATIENT');
      })
    ).subscribe({
      next: (results: any[]) => {
        console.log('Autocomplete results:', results);
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
        this.showAutocomplete = this.searchResults.length > 0;
      },
      error: (error) => {
        console.error('Autocomplete error:', error);
        this.isSearching = false;
        this.searchResults = [];
        this.showAutocomplete = false;
      }
    });
  }

  /**
   * Handle input change for autocomplete
   */
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (value.length < this.MIN_SEARCH_LENGTH) {
      this.searchResults = [];
      this.showAutocomplete = false;
      this.isSearching = false;
    } else {
      this.searchTerms.next(value);
    }
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
        // Store the appointment
        this.selectedAppointment = appointment;
        
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
    this.showAutocomplete = false;
    this.searchPatientForm.patchValue({ searchQuery: '' });
    this.loadPatientHistory(patient.id);
  }

  /**
   * Close autocomplete dropdown
   */
  closeAutocomplete(): void {
    setTimeout(() => {
      this.showAutocomplete = false;
    }, 200); // Delay to allow click event to fire
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
        // Filter only completed consultations for history
        this.patientPreviousConsultations = consultations
          .filter(c => {
            // Use lowercase for status comparison
            return c.status === 'completed';
          })
          .map(c => ({
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

    if (!this.selectedAppointment?.id) {
      this.errorMessage = 'Aucun rendez-vous sélectionné';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const startRequest: StartConsultationRequest = {
      appointmentId: this.selectedAppointment.id,
      patientId: this.selectedPatient.id,
      consultationType: this.selectedAppointment.type || this.selectedAppointment.appointmentType || 'onsite',
      notes: ''
    };

    console.log('Starting consultation with request:', startRequest); // Debug log

    this.consultationService.startConsultation(startRequest).subscribe({
      next: (consultation) => {
        console.log('Consultation started successfully:', consultation); // Debug log
        console.log('Consultation ID:', consultation.id); // Check if ID is present
        
        if (!consultation.id) {
          console.error('WARNING: Consultation created without ID!');
          this.errorMessage = 'Erreur: La consultation a été créée sans identifiant';
          this.isLoading = false;
          return;
        }
        
        this.currentConsultation = consultation;
        this.consultationStarted = true;
        this.consultationStartTime = new Date();
        this.isLoading = false;
        this.successMessage = 'Consultation démarrée avec succès';
        
        // Start auto-save timer
        this.startAutoSave();
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du démarrage de la consultation';
        console.error('Error starting consultation:', error);
        console.error('Full error response:', error.error); // Log full error
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

  /**
   * Load patients with appointments for current doctor
   */
  loadPatientsWithAppointments(status?: string, startDate?: string, endDate?: string): void {
    if (!this.currentDoctor?.id && !this.currentDoctorId) {
      console.warn('No current doctor ID');
      return;
    }

    this.isLoadingPatients = true;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

    // Build query parameters
    let queryParams = '';
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) queryParams = '?' + params.join('&');

    // Fetch patients with appointments using new endpoint
    this.http.get<any[]>(`${environment.apiUrl}/appointments/doctor/patients${queryParams}`, { headers }).subscribe({
      next: (patients) => {
        this.patientsWithAppointments = patients.map(p => ({
          patientId: p.patientId,
          patientFirstName: p.patientFirstName,
          patientLastName: p.patientLastName,
          patientEmail: p.patientEmail,
          patientPhone: p.patientPhone,
          patientGender: p.patientGender,
          appointmentId: p.appointmentId,
          appointmentDate: p.appointmentDate,
          appointmentTime: p.startTime || p.appointmentDate,
          appointmentType: p.appointmentType,
          status: p.appointmentStatus,
          hasConsultation: p.hasExistingConsultation,
          consultationRecordId: p.consultationRecordId,
          appointmentNotes: p.appointmentNotes
        }));
        
        // Filter out completed and cancelled appointments if needed
        this.filteredPatients = this.patientsWithAppointments.filter(patient => {
          const normalizedStatus = patient.status?.toLowerCase();
          // Show all appointments or filter based on requirement
          return true; // Show all for now, remove filter
        });
        
        this.sortPatientsTable();
        this.isLoadingPatients = false;
        console.log('Loaded patients with appointments:', this.patientsWithAppointments);
      },
      error: (error) => {
        console.error('Error loading patients with appointments:', error);
        this.isLoadingPatients = false;
        this.errorMessage = 'Erreur lors du chargement des patients';
      }
    });
  }

  /**
   * Toggle patients table visibility
   */
  togglePatientsTable(): void {
    this.showPatientsTable = !this.showPatientsTable;
    if (this.showPatientsTable && this.patientsWithAppointments.length === 0) {
      this.loadPatientsWithAppointments();
    }
  }

  /**
   * Apply filters (status, date range)
   */
  applyFilters(): void {
    this.loadPatientsWithAppointments(
      this.selectedStatusFilter || undefined,
      this.selectedStartDate || undefined,
      this.selectedEndDate || undefined
    );
  }

  /**
   * Filter patients table
   */
  filterPatientsTable(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tableFilterText = input.value.toLowerCase();
    
    if (!this.tableFilterText) {
      this.filteredPatients = [...this.patientsWithAppointments];
    } else {
      this.filteredPatients = this.patientsWithAppointments.filter(patient => {
        const fullName = `${patient.patientFirstName} ${patient.patientLastName}`.toLowerCase();
        const email = (patient.patientEmail || '').toLowerCase();
        const phone = (patient.patientPhone || '').toLowerCase();
        const status = (patient.status || '').toLowerCase();
        
        return fullName.includes(this.tableFilterText) ||
               email.includes(this.tableFilterText) ||
               phone.includes(this.tableFilterText) ||
               status.includes(this.tableFilterText);
      });
    }
    
    this.sortPatientsTable();
  }

  /**
   * Sort patients table
   */
  sortPatientsTable(column?: 'name' | 'date' | 'status'): void {
    if (column) {
      if (this.tableSortColumn === column) {
        this.tableSortDirection = this.tableSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.tableSortColumn = column;
        this.tableSortDirection = 'asc';
      }
    }

    this.filteredPatients.sort((a, b) => {
      let compareA, compareB;

      switch (this.tableSortColumn) {
        case 'name':
          compareA = `${a.patientFirstName} ${a.patientLastName}`.toLowerCase();
          compareB = `${b.patientFirstName} ${b.patientLastName}`.toLowerCase();
          break;
        case 'date':
          compareA = new Date(a.appointmentTime).getTime();
          compareB = new Date(b.appointmentTime).getTime();
          break;
        case 'status':
          compareA = (a.status || '').toLowerCase();
          compareB = (b.status || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (compareA < compareB) {
        return this.tableSortDirection === 'asc' ? -1 : 1;
      }
      if (compareA > compareB) {
        return this.tableSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Select patient from table
   */
  selectPatientFromTable(patient: any): void {
    this.selectedPatient = {
      id: patient.patientId,
      firstName: patient.patientFirstName,
      lastName: patient.patientLastName,
      email: patient.patientEmail,
      phone: patient.patientPhone
    };
    
    // Store appointment data
    this.selectedAppointment = {
      id: patient.appointmentId,
      type: patient.appointmentType,
      appointmentType: patient.appointmentType,
      status: patient.status,
      date: patient.appointmentDate,
      time: patient.appointmentTime
    };
    
    this.loadPatientHistory(patient.patientId);
    this.showPatientsTable = false;
    
    // Check if consultation already exists
    if (patient.hasConsultation && patient.appointmentId) {
      // Load existing consultation by appointment ID
      console.log('Loading existing consultation for appointment ID:', patient.appointmentId);
      this.loadConsultationByAppointmentId();
    } else {
      // Create new consultation if appointment exists and is not completed/cancelled
      if (patient.appointmentId) {
        const normalizedStatus = patient.status?.toLowerCase();
        // Use lowercase for comparison
        if (normalizedStatus !== 'completed' && normalizedStatus !== 'cancelled') {
          console.log('Starting new consultation for appointment ID:', patient.appointmentId);
          this.startConsultationFromAppointment(patient.appointmentId, patient.appointmentType);
        } else {
          console.log('Cannot start consultation: appointment status is', patient.status);
        }
      } else {
        console.log('Cannot start consultation: no appointment ID');
      }
    }
  }

  /**
   * Load an existing consultation by ID
   */
  private loadExistingConsultation(consultationId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading existing consultation with ID:', consultationId);
    
    this.consultationService.getConsultation(consultationId).subscribe({
      next: (consultation) => {
        console.log('Existing consultation loaded:', consultation);
        
        if (!consultation.id) {
          console.error('WARNING: Consultation loaded without ID!');
          this.errorMessage = 'Erreur: La consultation chargée n\'a pas d\'identifiant';
          this.isLoading = false;
          return;
        }
        
        this.currentConsultation = consultation;
        this.consultationStarted = true;
        this.consultationStartTime = new Date(consultation.startTime);
        this.isLoading = false;
        this.successMessage = 'Consultation existante chargée avec succès';
        
        // Don't start auto-save for existing consultations that might be completed
        // Use lowercase status values
        if (consultation.status !== 'completed' && consultation.status !== 'cancelled') {
          this.startAutoSave();
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading existing consultation:', error);
        
        if (error.status === 404) {
          // Consultation not found, try to get it by appointment ID
          this.loadConsultationByAppointmentId();
        } else {
          this.errorMessage = 'Erreur lors du chargement de la consultation existante';
        }
      }
    });
  }

  /**
   * Try to load consultation by appointment ID as fallback
   */
  private loadConsultationByAppointmentId(): void {
    if (!this.selectedAppointment?.id) {
      this.errorMessage = 'Impossible de charger la consultation: ID de rendez-vous manquant';
      return;
    }
    
    console.log('Trying to load consultation by appointment ID:', this.selectedAppointment.id);
    
    this.consultationService.getConsultationByAppointmentId(this.selectedAppointment.id).subscribe({
      next: (consultationDetails: any) => {
        console.log('Consultation details loaded by appointment ID:', consultationDetails);
        
        // Map the ConsultationDetailsDTO to our consultation object
        const consultation: any = {
          id: consultationDetails.record?.id || consultationDetails.appointment?.id,
          appointmentId: consultationDetails.appointment?.id,
          patientId: consultationDetails.appointment?.patientId,
          patientFirstName: consultationDetails.appointment?.patientFirstName,
          patientLastName: consultationDetails.appointment?.patientLastName,
          patientEmail: consultationDetails.appointment?.patientEmail,
          doctorId: consultationDetails.appointment?.doctorId,
          doctorFirstName: consultationDetails.appointment?.doctorFirstName,
          doctorLastName: consultationDetails.appointment?.doctorLastName,
          startTime: consultationDetails.record?.startedAt || consultationDetails.appointment?.appointmentTime,
          endTime: consultationDetails.record?.endedAt,
          status: consultationDetails.appointment?.status || 'in-progress',
          consultationType: consultationDetails.record?.consultationType || consultationDetails.appointment?.appointmentType || 'onsite',
          chiefComplaint: consultationDetails.record?.chiefComplaint,
          diagnosis: consultationDetails.record?.diagnosis,
          treatment: consultationDetails.record?.treatmentPlan,
          notes: consultationDetails.appointment?.notes,
          prescriptions: [],
          labTests: []
        };
        
        if (!consultation.id) {
          console.error('WARNING: Consultation loaded without ID!');
          this.errorMessage = 'Erreur: La consultation chargée n\'a pas d\'identifiant';
          this.isLoading = false;
          return;
        }
        
        this.currentConsultation = consultation;
        this.consultationStarted = true;
        this.consultationStartTime = new Date(consultation.startTime);
        this.isLoading = false;
        this.successMessage = 'Consultation existante trouvée et chargée';
        
        // Don't start auto-save for existing consultations that might be completed
        if (consultation.status !== 'completed' && consultation.status !== 'cancelled') {
          this.startAutoSave();
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading consultation by appointment ID:', error);
        
        // If no consultation exists for this appointment, offer to create one
        if (error.status === 404) {
          if (confirm('Aucune consultation trouvée pour ce rendez-vous. Voulez-vous en créer une nouvelle?')) {
            this.startConsultationFromAppointment(this.selectedAppointment.id, this.selectedAppointment.type);
          }
        } else {
          this.errorMessage = 'Erreur lors du chargement de la consultation';
        }
      }
    });
  }

  /**
   * Start auto-save timer for consultation notes
   */
  private startAutoSave(): void {
    // Clear existing timer if any
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    // Auto-save every 30 seconds
    this.autoSaveTimer = setInterval(() => {
      if (this.currentConsultation && this.consultationStarted) {
        console.log('Auto-save triggered');
        // The ConsultationNotesComponent will handle the actual saving
      }
    }, 30000); // 30 seconds
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'confirmed':
      case 'scheduled':
        return 'status-confirmed';
      case 'pending':
      case 'in-progress':
        return 'status-pending';
      case 'cancelled':
      case 'canceled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Format date for table display
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

