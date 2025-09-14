import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityService } from '../../../services/availability.service';
import { Availability } from '../../../interfaces/availability.interface';
import { HttpErrorResponse } from '@angular/common/http';

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
  successMessage = '';

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
      this.error = 'ID requis pour la suppression';
      this.successMessage = '';
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      this.loading = true;
      this.error = '';
      this.successMessage = '';

      this.availabilityService.deleteAvailability(id).subscribe({
        next: (response: any) => {
          this.loading = false;
          
          // Analyser le statut de la réponse pour donner le bon feedback
          if (response && response.status) {
            switch (response.status) {
              case 200:
                this.successMessage = 'Disponibilité supprimée avec succès';
                break;
              case 204:
                this.successMessage = 'Disponibilité supprimée avec succès (aucun contenu retourné)';
                break;
              default:
                this.successMessage = 'Disponibilité supprimée';
            }
          } else {
            // Si pas de statut explicite mais succès
            this.successMessage = 'Disponibilité supprimée avec succès';
          }

          // Recharger la liste pour refléter les changements
          this.loadAvailabilities();
          
          // Effacer le message de succès après 3 secondes
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.successMessage = '';
          
          // Gestion détaillée des erreurs selon le statut HTTP
          switch (error.status) {
            case 400:
              this.error = 'Requête invalide : Vérifiez les données envoyées';
              break;
            case 401:
              this.error = 'Non autorisé : Veuillez vous reconnecter';
              break;
            case 403:
              this.error = 'Accès interdit : Vous n\'avez pas les permissions nécessaires';
              break;
            case 404:
              this.error = 'Disponibilité non trouvée : Elle a peut-être déjà été supprimée';
              break;
            case 409:
              this.error = 'Conflit : Cette disponibilité est peut-être liée à des rendez-vous existants';
              break;
            case 500:
              this.error = 'Erreur serveur : Veuillez réessayer plus tard';
              break;
            case 0:
              this.error = 'Erreur de connexion : Vérifiez votre connexion internet';
              break;
            default:
              this.error = error.error?.message || 'Erreur lors de la suppression de la disponibilité';
          }
          
          console.error('Error deleting availability:', error);
          
          // Effacer le message d'erreur après 5 secondes
          setTimeout(() => {
            this.error = '';
          }, 5000);
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
