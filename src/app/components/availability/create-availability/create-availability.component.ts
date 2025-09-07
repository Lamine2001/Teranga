import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../../../services/availability.service';
import { CreateAvailabilityRequest } from '../../../interfaces/availability.interface';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-create-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-availability.component.html',
  styleUrls: ['./create-availability.component.css']
})
export class CreateAvailabilityComponent implements OnInit {
  @Output() availabilityCreated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  availability: CreateAvailabilityRequest = {
    startTime: '',
    endTime: '',
    durationMinutes: 30
  };

  // For date/time inputs
  startDate: string = '';
  startTimeInput: string = '';
  endDate: string = '';
  endTimeInput: string = '';

  durations = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 heure' },
    { value: 90, label: '1h30' },
    { value: 120, label: '2 heures' }
  ];

  loading = false;
  error = '';
  success = '';

  constructor(
    private availabilityService: AvailabilityService,
    private authService: AuthService
  ) {
    this.setDefaultDates();
  }

  ngOnInit() {
    // Debug: Afficher les informations de l'utilisateur
    const user = this.authService.getCurrentUser();
    console.log('Current user in component:', user);
    console.log('User role:', user?.role);
    console.log('Is doctor?', this.authService.isDoctor());
    
    // Vérifier que l'utilisateur est bien un docteur
    if (!this.authService.isDoctor()) {
      // Pour debug, afficher plus d'informations
      this.error = `Seuls les médecins peuvent créer des disponibilités. Rôle actuel: ${user?.role || 'non défini'}`;
      console.error('User is not a doctor. Current role:', user?.role);
    }
  }

  setDefaultDates() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.startDate = tomorrow.toISOString().split('T')[0];
    this.endDate = tomorrow.toISOString().split('T')[0];
    this.startTimeInput = '09:00';
    this.endTimeInput = '17:00';
  }

  onSubmit() {
    // Pour debug, vérifier le rôle et afficher des informations
    const user = this.authService.getCurrentUser();
    console.log('Submitting as user:', user);
    console.log('User role on submit:', user?.role);

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Combine date and time for ISO format
    this.availability.startTime = `${this.startDate}T${this.startTimeInput}:00`;
    this.availability.endTime = `${this.endDate}T${this.endTimeInput}:00`;

    console.log('Submitting availability:', this.availability);

    this.availabilityService.createAvailability(this.availability).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.success = response.message || 'Disponibilité créée avec succès';
          
          // Si c'est un avertissement, l'afficher différemment
          if (response.error) {
            this.error = response.error;
          }
          
          setTimeout(() => {
            this.availabilityCreated.emit();
            this.resetForm();
          }, 2000);
        } else {
          this.error = response.error || 'Erreur lors de la création';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Erreur de connexion au serveur';
        console.error('Error:', error);
      }
    });
  }

  validateForm(): boolean {
    if (!this.startDate || !this.startTimeInput || !this.endDate || !this.endTimeInput) {
      this.error = 'Veuillez remplir tous les champs';
      return false;
    }

    const start = new Date(`${this.startDate}T${this.startTimeInput}`);
    const end = new Date(`${this.endDate}T${this.endTimeInput}`);
    const now = new Date();

    if (start < now) {
      this.error = 'La date de début doit être dans le futur';
      return false;
    }

    if (end <= start) {
      this.error = 'La date de fin doit être après la date de début';
      return false;
    }

    return true;
  }

  resetForm() {
    this.setDefaultDates();
    this.availability.durationMinutes = 30;
    this.error = '';
    this.success = '';
  }

  onClose() {
    this.close.emit();
  }
}

