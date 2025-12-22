import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() consultationMode?: string;
  @Input() specialty?: string;
  @Input() location?: string;
  @Output() slotSelected = new EventEmitter<{ slot: any, doctor: any }>();
  @Output() showRegistration = new EventEmitter<any>();
  
  searchForm: FormGroup;
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  specialties: string[] = [
    'Toutes les spécialités',
    'Psychologie clinique',
    'Psychothérapie',
    'Coaching de vie',
    'Thérapie de couple',
    'Psychologie de l\'enfant et de l\'adolescent',
    'Gestion du stress et de l\'anxiété',
    'Développement personnel',
    'Thérapie familiale',
    'Psychiatrie',
    'Neuropsychologie',
    'Psychologie du travail'
  ];
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
    
    // Déterminer où naviguer en fonction du contexte
    const patientType = currentContext.patientType;
    
    if (patientType === 'existing') {
      // Si on est dans appointment-search, émettre l'événement au lieu de naviguer
      this.slotSelected.emit({ slot, doctor });
    } else {
      // Pour les nouveaux patients ou wizard, naviguer vers la bonne route
      this.router.navigate(['/appointments/wizard']).then(success => {
        console.log('Navigation to wizard success:', success);
      }).catch(error => {
        console.error('Navigation error:', error);
      });
    }
  }

  onSelectTimeSlot(slot: any, doctor: any): void {
    // Pour les patients existants, procéder directement à la réservation
    console.log('Selected slot for existing patient:', slot, doctor);
    
    const currentContext = this.appointmentContextService.getContext();
    
    // Mettre à jour le contexte
    this.appointmentContextService.updateContext({
      consultationMode: currentContext.consultationMode,
      patientType: currentContext.patientType || 'existing',
      selectedDoctor: doctor,
      selectedSlot: slot
    });
    
    // Si on est dans le contexte appointment-search, émettre un événement au lieu de naviguer
    if (currentContext.patientType === 'existing' || currentContext.consultationMode) {
      // Émettre l'événement pour que le composant parent gère l'affichage
      console.log('Emitting slotSelected event from doctors-list');
      this.slotSelected.emit({ slot, doctor });
    } else {
      // Sinon, naviguer vers le wizard
      this.router.navigate(['/appointments/wizard']).then(success => {
        console.log('Navigation to wizard success:', success);
      }).catch(error => {
        console.error('Navigation error:', error);
      });
    }
  }
}



