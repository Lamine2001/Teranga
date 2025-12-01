import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../../../services/availability.service';
import { CreateAvailabilityRequest } from '../../../interfaces/availability.interface';
import { AuthService } from '../../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-create-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-availability.component.html',
  styleUrls: ['./create-availability.component.css']
})
export class CreateAvailabilityComponent implements OnInit {
  @Output() availabilityCreated = new EventEmitter<any>();
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

  // Recurrent availability properties
  creationMode: 'single' | 'recurrent' = 'single';
  recurrentStartDate: string = '';
  recurrentEndDate: string = '';
  recurrentStartTime: string = '09:00';
  recurrentEndTime: string = '17:00';
  slotDuration: number = 60;

  daysOfWeek = [
    { value: 1, label: 'Lun', selected: false },
    { value: 2, label: 'Mar', selected: false },
    { value: 3, label: 'Mer', selected: false },
    { value: 4, label: 'Jeu', selected: false },
    { value: 5, label: 'Ven', selected: false },
    { value: 6, label: 'Sam', selected: false },
    { value: 0, label: 'Dim', selected: false }
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
    console.log('User userType:', user?.userType);
    console.log('Is doctor?', this.authService.isDoctor());
    
    // Vérifier que l'utilisateur est bien un docteur
    if (!this.authService.isDoctor()) {
      // Pour debug, afficher plus d'informations
      this.error = `Seuls les médecins peuvent créer des disponibilités. Type d'utilisateur actuel: ${user?.userType || 'non défini'}`;
      console.error('User is not a doctor. Current userType:', user?.userType);
    }
  }

  setDefaultDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.startDate = today.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
    this.startTimeInput = '09:00';
    this.endTimeInput = '17:00';
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMaxDateForMonth(): string {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  }

  onRecurrentDateChange(): void {
    // S'assurer que la date de fin n'est pas avant la date de début
    if (this.recurrentEndDate && this.recurrentStartDate) {
      if (new Date(this.recurrentEndDate) < new Date(this.recurrentStartDate)) {
        this.recurrentEndDate = this.recurrentStartDate;
      }
    }
  }

  getPreviewSlots(): any[] {
    if (this.creationMode !== 'recurrent') return [];
    
    if (!this.recurrentStartDate || !this.recurrentEndDate || 
        !this.recurrentStartTime || !this.recurrentEndTime) {
      return [];
    }

    const selectedDays = this.daysOfWeek.filter(d => d.selected).map(d => d.value);
    if (selectedDays.length === 0) return [];

    const slots: any[] = [];
    const start = new Date(this.recurrentStartDate);
    const end = new Date(this.recurrentEndDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      
      if (selectedDays.includes(dayOfWeek)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // Générer les créneaux pour cette journée
        const daySlots = this.generateSlotsForDay(
          dateStr, 
          this.recurrentStartTime, 
          this.recurrentEndTime, 
          this.slotDuration
        );
        
        slots.push(...daySlots);
      }
    }

    return slots;
  }

  generateSlotsForDay(date: string, startTime: string, endTime: string, duration: number): any[] {
    const slots: any[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentTime = startHour * 60 + startMinute; // En minutes
    const endTimeMinutes = endHour * 60 + endMinute;
    
    while (currentTime + duration <= endTimeMinutes) {
      const slotStartHour = Math.floor(currentTime / 60);
      const slotStartMinute = currentTime % 60;
      const slotEndTime = currentTime + duration;
      const slotEndHour = Math.floor(slotEndTime / 60);
      const slotEndMinute = slotEndTime % 60;
      
      slots.push({
        date: date,
        startTime: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`,
        endTime: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`
      });
      
      currentTime += duration;
    }
    
    return slots;
  }

  isFormValid(): boolean {
    if (this.creationMode === 'single') {
      return !!(this.startDate && this.startTimeInput && this.endDate && this.endTimeInput);
    } else {
      const hasSelectedDays = this.daysOfWeek.some(d => d.selected);
      return !!(
        this.recurrentStartDate && 
        this.recurrentEndDate && 
        this.recurrentStartTime && 
        this.recurrentEndTime && 
        hasSelectedDays
      );
    }
  }

  getSubmitButtonText(): string {
    if (this.creationMode === 'single') {
      return 'Créer la disponibilité';
    } else {
      const count = this.getPreviewSlots().length;
      return count > 0 ? `Créer ${count} créneau(x)` : 'Créer les disponibilités';
    }
  }

  onSubmit(): void {
    if (this.creationMode === 'single') {
      this.createSingleAvailability();
    } else {
      this.createRecurrentAvailabilities();
    }
  }

  createSingleAvailability(): void {
    // Pour debug, vérifier le rôle et afficher des informations
    const user = this.authService.getCurrentUser();
    const token = this.authService.getToken();
    console.log('Submitting as user:', user);
    console.log('User userType on submit:', user?.userType);
    console.log('Auth token:', token);
    console.log('Is authenticated:', this.authService.isAuthenticated());

    if (!this.validateForm()) {
      return;
    }

    // Vérifier si l'utilisateur est connecté et a un token
    if (!token) {
      this.error = 'Vous devez être connecté pour créer une disponibilité';
      return;
    }

    if (!this.authService.isDoctor()) {
      this.error = 'Seuls les médecins peuvent créer des disponibilités';
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
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error headers:', error.headers);
        
        if (error.status === 401) {
          this.error = 'Non autorisé - Veuillez vous reconnecter';
        } else if (error.status === 403) {
          this.error = 'Accès refusé - Vous n\'avez pas les permissions nécessaires';
        } else {
          this.error = error.error?.message || 'Erreur de connexion au serveur';
        }
      }
    });
  }

  // ...existing code...

createRecurrentAvailabilities(): void {
  this.loading = true;
  this.error = '';
  this.success = '';

  const slots = this.getPreviewSlots();
  
  if (slots.length === 0) {
    this.error = 'Aucun créneau à créer. Vérifiez vos sélections.';
    this.loading = false;
    return;
  }

  // Créer toutes les disponibilités
  const availabilityRequests = slots.map(slot => {
    // Utiliser le format local sans conversion de fuseau horaire
    const startDateTime = `${slot.date}T${slot.startTime}:00`;
    const endDateTime = `${slot.date}T${slot.endTime}:00`;
    
    return {
      startTime: startDateTime,
      endTime: endDateTime,
      durationMinutes: this.slotDuration
    };
  });

  // Envoyer toutes les requêtes
  const requests = availabilityRequests.map(req => 
    this.availabilityService.createAvailability(req)
  );

  // Utiliser forkJoin pour attendre toutes les requêtes
  forkJoin(requests).subscribe({
    next: (responses) => {
      this.success = `${responses.length} créneau(x) créé(s) avec succès!`;
      this.loading = false;
      this.resetForm();
      
      setTimeout(() => {
        this.availabilityCreated.emit(responses);
        this.onClose();
      }, 1500);
    },
    error: (error) => {
      console.error('Error creating availabilities:', error);
      this.error = 'Erreur lors de la création des disponibilités. Certains créneaux n\'ont peut-être pas été créés.';
      this.loading = false;
    }
  });
}

// ...existing code...

  /**
   * Get minimum date for date inputs (today)
   */
  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  resetForm() {
    // Reset single mode
    this.setDefaultDates();
    this.error = '';
    this.success = '';

    // Reset recurrent mode
    this.creationMode = 'single';
    this.recurrentStartDate = '';
    this.recurrentEndDate = '';
    this.recurrentStartTime = '09:00';
    this.recurrentEndTime = '17:00';
    this.slotDuration = 60;
    this.daysOfWeek.forEach(day => day.selected = false);
  }

  validateForm(): boolean {
    if (!this.startDate || !this.startTimeInput || !this.endDate || !this.endTimeInput) {
      this.error = 'Veuillez remplir tous les champs';
      return false;
    }

    // For comparison, create local dates
    const start = new Date(this.startDate + 'T' + this.startTimeInput);
    const end = new Date(this.endDate + 'T' + this.endTimeInput);
    
    // Debug logging
    console.log('=== VALIDATION DEBUG ===');
    console.log('Start date input:', this.startDate);
    console.log('Start time input:', this.startTimeInput);
    console.log('End date input:', this.endDate);
    console.log('End time input:', this.endTimeInput);
    console.log('Parsed start (local):', start);
    console.log('Parsed end (local):', end);
    console.log('Start valid?', !isNaN(start.getTime()));
    console.log('End valid?', !isNaN(end.getTime()));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.error = 'Format de date/heure invalide. Utilisez le format 24h (ex: 21:00 pour 9PM)';
      return false;
    }

    // Check if start date/time is in the past
    // Ajouter une marge de 1 minute pour éviter les problèmes de timing
    const now = new Date();
    const nowMinusOneMinute = new Date(now.getTime() - 60000); // 1 minute de marge
    
    console.log('Current time:', now);
    console.log('Start time:', start);
    console.log('Now minus 1 minute:', nowMinusOneMinute);
    console.log('Is start in past?', start < nowMinusOneMinute);
    
    if (start < nowMinusOneMinute) {
      this.error = 'La date et heure de début ne peuvent pas être dans le passé';
      return false;
    }

    // End must be after start
    console.log('End <= Start?', end <= start);
    if (end <= start) {
      this.error = 'La date et heure de fin doivent être après la date et heure de début';
      return false;
    }

    console.log('=== VALIDATION PASSED ===');
    return true;
  }

  onClose() {
    this.close.emit();
  }
}

