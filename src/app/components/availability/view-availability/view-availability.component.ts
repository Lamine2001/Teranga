import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityService } from '../../../services/availability.service';
import { Availability } from '../../../interfaces/availability.interface';

@Component({
  selector: 'app-view-availability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-availability.component.html',
  styleUrls: ['./view-availability.component.css']
})
export class ViewAvailabilityComponent implements OnInit {
  availabilities: Availability[] = [];
  loading = false;
  error = '';

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit(): void {
    this.loadAvailabilities();
  }

  loadAvailabilities(): void {
    this.loading = true;
    this.error = '';

    this.availabilityService.getAvailabilities().subscribe({
      next: (response) => {
        this.loading = false;
        this.availabilities = response.data || response || [];
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des disponibilités';
        console.error('Error loading availabilities:', error);
      }
    });
  }

  deleteAvailability(id: string | number): void {
    if (!id) {
      console.error('ID is required for deletion');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      this.availabilityService.deleteAvailability(id).subscribe({
        next: () => {
          this.loadAvailabilities();
        },
        error: (error) => {
          console.error('Error deleting availability:', error);
          this.error = 'Erreur lors de la suppression';
        }
      });
    }
  }

  blockAvailability(id: string | number): void {
    if (!id) {
      console.error('ID is required for blocking');
      return;
    }
    
    // Trouver la disponibilité dans la liste
    const availability = this.availabilities.find(a => a.id?.toString() === id.toString());
    if (!availability) {
      this.error = 'Disponibilité non trouvée';
      return;
    }

    // Basculer le statut isBlocked
    const newBlockedStatus = !availability.isBlocked;
    
    this.availabilityService.updateAvailability(id, {
      ...availability,
      isBlocked: newBlockedStatus
    }).subscribe({
      next: () => {
        this.loadAvailabilities();
      },
      error: (error) => {
        console.error('Error updating availability:', error);
        this.error = 'Erreur lors de la mise à jour';
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
