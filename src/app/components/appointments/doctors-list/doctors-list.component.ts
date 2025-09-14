import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DoctorService, Doctor } from '../../../services/doctor.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-doctors-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss']
})
export class DoctorsListComponent implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  isLoading = false;
  errorMessage = '';
  consultationMode: string = '';
  patientType: string = '';
  searchForm: FormGroup;
  
  breadcrumbItems = [
    { label: 'Accueil', url: '/' },
    { label: 'Rendez-vous', url: '/appointments' },
    { label: 'Mode de consultation', url: '/appointments/consultation-mode' },
    { label: 'Type de patient', url: '/appointments/patient-type' },
    { label: 'Choisir un médecin', active: true }
  ];

  specialties = [
    'Tous',
    'Médecine générale',
    'Cardiologie',
    'Dermatologie',
    'Gynécologie',
    'Pédiatrie',
    'Psychiatrie',
    'Orthopédie',
    'Ophtalmologie',
    'ORL',
    'Neurologie'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private doctorService: DoctorService
  ) {
    this.searchForm = this.fb.group({
      searchText: [''],
      specialty: ['Tous'],
      availability: ['all']
    });
  }

  ngOnInit(): void {
    // Récupérer les paramètres
    this.route.queryParams.subscribe(params => {
      this.consultationMode = params['mode'] || sessionStorage.getItem('consultationMode') || '';
      this.patientType = params['patientType'] || sessionStorage.getItem('patientType') || '';
    });

    // Charger la liste des médecins
    this.loadDoctors();

    // Écouter les changements du formulaire de recherche
    this.searchForm.valueChanges.subscribe(() => {
      this.filterDoctors();
    });
  }

  loadDoctors(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.doctorService.getAllDoctors().subscribe({
      next: (response: Doctor[]) => {
        this.doctors = response;
        this.filteredDoctors = response;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Erreur lors du chargement des médecins';
        this.isLoading = false;
        console.error('Error loading doctors:', error);
      }
    });
  }

  filterDoctors(): void {
    const { searchText, specialty, availability } = this.searchForm.value;
    
    this.filteredDoctors = this.doctors.filter(doctor => {
      // Filtrer par texte de recherche
      const matchesSearch = !searchText || 
        doctor.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(searchText.toLowerCase());
      
      // Filtrer par spécialité
      const matchesSpecialty = specialty === 'Tous' || doctor.specialty === specialty;
      
      // Filtrer par disponibilité (si implémenté)
      const matchesAvailability = availability === 'all' || 
        (availability === 'available' && doctor.isAvailable);
      
      return matchesSearch && matchesSpecialty && matchesAvailability;
    });
  }

  selectDoctor(doctor: Doctor): void {
    // Stocker les informations du médecin sélectionné
    sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
    
    // Rediriger en fonction du type de patient
    if (this.patientType === 'new') {
      // Nouveau patient - rediriger vers l'inscription avec le médecin pré-sélectionné
      this.router.navigate(['/register'], {
        queryParams: {
          doctorId: doctor.id,
          redirect: '/appointments/booking',
          mode: this.consultationMode
        }
      });
    } else if (this.patientType === 'guest') {
      // Patient invité - aller directement à la réservation
      this.router.navigate(['/appointments/search'], {
        queryParams: {
          doctorId: doctor.id,
          mode: this.consultationMode,
          guest: true
        }
      });
    }
  }

  getDoctorAvatar(doctor: Doctor): string {
    return doctor.avatarUrl || '/assets/default-doctor-avatar.png';
  }

  getDoctorRating(doctor: Doctor): number {
    return doctor.rating || 4.5;
  }

  getDoctorExperience(doctor: Doctor): string {
    return doctor.yearsOfExperience ? `${doctor.yearsOfExperience} ans d'expérience` : 'Expérience non spécifiée';
  }
}
