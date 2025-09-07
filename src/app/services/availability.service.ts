import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Availability, 
  CreateAvailabilityRequest, 
  AvailabilityResponse, 
  AvailabilityListResponse 
} from '../interfaces/availability.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private apiUrl = 'http://localhost:8080/api/availability';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Get token directly from localStorage
    console.log('Token being sent:', token); // Debug log
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      // Make sure the token format is correct
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // Créer une disponibilité avec meilleure gestion d'erreur
  createAvailability(availability: CreateAvailabilityRequest): Observable<AvailabilityResponse> {
    console.log('Creating availability:', availability);
    
    return this.http.post<any>(`${this.apiUrl}/create`, availability, {
      headers: this.getHeaders(),
      observe: 'response'
    }).pipe(
      map(response => {
        console.log('Response received:', response);
        
        // Vérifier si la réponse est valide malgré l'erreur de sérialisation
        if (response.status === 200 || response.status === 201) {
          return {
            success: true,
            data: response.body || {},
            message: 'Disponibilité créée avec succès'
          };
        }
        
        return {
          success: false,
          error: 'Erreur lors de la création'
        };
      }),
      catchError(error => {
        console.error('Error creating availability:', error);
        
        let errorMessage = 'Erreur lors de la création de la disponibilité';
        
        // Gérer l'erreur de sérialisation circulaire
        if (error.status === 500 && error.error?.message?.includes('nesting depth')) {
          // Si c'est une erreur de sérialisation mais que la création a réussi
          console.warn('Circular reference error, but availability might be created');
          return of({
            success: true,
            message: 'Disponibilité probablement créée (vérifiez la liste)',
            error: 'Avertissement: Problème de format de réponse du serveur'
          });
        }
        
        if (error.status === 403) {
          errorMessage = 'Accès refusé. Vérifiez que vous êtes connecté en tant que médecin.';
        } else if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Données invalides';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Contactez l administrateur.';
        }
        
        return of({
          success: false,
          error: errorMessage
        });
      })
    );
  }

  // Récupérer toutes les disponibilités du docteur
  getDoctorAvailabilities(): Observable<AvailabilityListResponse> {
    return this.http.get<any[]>(`${this.apiUrl}/doctor`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        data: response
      })),
      catchError(error => {
        console.error('Error fetching availabilities:', error);
        return of({
          success: false,
          error: error.error?.message || 'Erreur lors de la récupération des disponibilités'
        });
      })
    );
  }

  // Supprimer une disponibilité
  deleteAvailability(id: string): Observable<AvailabilityResponse> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => ({
        success: true,
        message: 'Disponibilité supprimée avec succès'
      })),
      catchError(error => {
        console.error('Error deleting availability:', error);
        return of({
          success: false,
          error: error.error?.message || 'Erreur lors de la suppression de la disponibilité'
        });
      })
    );
  }

  // Bloquer une disponibilité
  blockAvailability(id: string): Observable<AvailabilityResponse> {
    return this.http.put<any>(`${this.apiUrl}/${id}/block`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        data: response,
        message: 'Disponibilité bloquée avec succès'
      })),
      catchError(error => {
        console.error('Error blocking availability:', error);
        return of({
          success: false,
          error: error.error?.message || 'Erreur lors du blocage de la disponibilité'
        });
      })
    );
  }

  // Débloquer une disponibilité (si nécessaire)
  unblockAvailability(id: string): Observable<AvailabilityResponse> {
    return this.http.put<any>(`${this.apiUrl}/${id}/unblock`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: true,
        data: response,
        message: 'Disponibilité débloquée avec succès'
      })),
      catchError(error => {
        console.error('Error unblocking availability:', error);
        return of({
          success: false,
          error: error.error?.message || 'Erreur lors du déblocage de la disponibilité'
        });
      })
    );
  }
}
