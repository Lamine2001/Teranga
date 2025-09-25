import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DoctorService } from '../../../services/doctor.service';
import { AppointmentContextService } from '../../../services/appointment-context.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { DoctorAvailabilityComponent } from '../doctor-availability/doctor-availability.component';

@Component({
  selector: 'app-doctors-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent, DoctorAvailabilityComponent],
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss']
})
export class DoctorsListComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  specialties: string[] = ['Toutes les spécialités', 'Médecine générale', 'Cardiologie', 'Dermatologie', 'Pédiatrie', 'Gynécologie'];
  isLoading = false;
  errorMessage = '';
  expandedDoctorId: string | null = null;
  selectedDoctor: any = null;
  private destroy$ = new Subject<void>();

  breadcrumbItems = [
    { label: 'Accueil', url: '/' },
    { label: 'Rendez-vous', url: '/appointments' },
    { label: 'Médecins', active: true }
  ];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private appointmentContextService: AppointmentContextService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      searchText: [''],
      specialty: ['Toutes les spécialités'],
      availability: ['all']
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.setupSearchListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearchListeners(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.filterDoctors();
      });
  }

  loadDoctors(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.doctorService.getAllDoctors().subscribe({
      next: (response) => {
        this.doctors = response;
        this.filteredDoctors = response;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Impossible de charger la liste des médecins. Veuillez réessayer.';
        this.isLoading = false;
        console.error('Error loading doctors:', error);
      }
    });
  }

  filterDoctors(): void {
    const { searchText, specialty, availability } = this.searchForm.value;
    
    this.filteredDoctors = this.doctors.filter(doctor => {
      // Filter by search text
      const matchesSearch = !searchText || 
        this.getDoctorDisplayName(doctor).toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(searchText.toLowerCase());
      
      // Filter by specialty
      const matchesSpecialty = specialty === 'Toutes les spécialités' || 
        doctor.specialty === specialty;
      
      // Filter by availability
      const matchesAvailability = availability === 'all' || 
        (availability === 'available' && this.hasAvailabilities(doctor));
      
      return matchesSearch && matchesSpecialty && matchesAvailability;
    });
  }

  toggleDoctorPanel(doctorId: string): void {
    if (this.expandedDoctorId === doctorId) {
      this.expandedDoctorId = null;
      this.selectedDoctor = null;
    } else {
      this.expandedDoctorId = doctorId;
      this.selectedDoctor = this.doctors.find(d => d.id === doctorId);
    }
  }

  getDoctorDisplayName(doctor: any): string {
    if (doctor.firstName && doctor.lastName) {
      return `${doctor.firstName} ${doctor.lastName}`;
    }
    return doctor.name || 'Médecin';
  }

  formatSpecialty(specialty: string): string {
    return specialty || 'Médecine générale';
  }

  hasAvailabilities(doctor: any): boolean {
    return doctor.availabilities && doctor.availabilities.length > 0;
  }

  onShowRegistration(slot: any, doctor: any): void {
    // Pour les nouveaux patients, afficher le formulaire d'inscription
    console.log('Show registration for new patient:', slot, doctor);
    
    // S'assurer que le contexte est bien mis à jour avec toutes les informations
    const currentContext = this.appointmentContextService.getContext();
    
    this.appointmentContextService.updateContext({
      consultationMode: currentContext.consultationMode,
      patientType: currentContext.patientType || 'new',
      selectedDoctor: doctor,
      selectedSlot: slot
    });
    
    // Naviguer vers la page de booking
    this.router.navigate(['/appointments/booking']).then(success => {
      console.log('Navigation success:', success);
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  onSelectTimeSlot(slot: any, doctor: any): void {
    // Pour les patients existants, procéder directement à la réservation
    console.log('Selected slot for existing patient:', slot, doctor);
    
    const currentContext = this.appointmentContextService.getContext();
    
    this.appointmentContextService.updateContext({
      consultationMode: currentContext.consultationMode,
      patientType: 'existing',
      selectedDoctor: doctor,
      selectedSlot: slot
    });
    
    // Naviguer vers la page de booking
    this.router.navigate(['/appointments/booking']).then(success => {
      console.log('Navigation success:', success);
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }
}



