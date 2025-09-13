import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CreateAvailabilityRequest } from '../interfaces/availability.interface';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private apiUrl = 'http://localhost:8080/api/availability';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  createAvailability(availability: CreateAvailabilityRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('Creating availability with headers:', headers);
    console.log('Token being sent:', this.authService.getToken());
    console.log('Request payload:', availability);
    
    return this.http.post<any>(`${this.apiUrl}/create`, availability, { 
      ...headers, 
      observe: 'response' // Pour récupérer la réponse complète avec le statut
    })
      .pipe(
        map(response => {
          console.log('Full HTTP response:', response);
          console.log('HTTP Status:', response.status);
          console.log('Response body:', response.body);
          
          let message = '';
          let success = false;
          
          // Analyser le code de statut HTTP
          switch (response.status) {
            case 200:
              success = true;
              message = 'Disponibilité mise à jour avec succès';
              break;
            case 201:
              success = true;
              message = 'Disponibilité créée avec succès';
              break;
            case 202:
              success = true;
              message = 'Demande de création acceptée et en cours de traitement';
              break;
            case 204:
              success = true;
              message = 'Disponibilité créée (pas de contenu retourné)';
              break;
            default:
              success = true;
              message = `Disponibilité traitée (Code: ${response.status})`;
          }
          
          return {
            success: success,
            message: message,
            data: response.body,
            status: response.status
          };
        }),
        catchError(error => {
          console.error('Error creating availability:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Error body:', error.error);
          
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
          
          // Analyser les codes d'erreur HTTP
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Données invalides ou format incorrect';
              break;
            case 401:
              errorMessage = 'Session expirée. Veuillez vous reconnecter';
              break;
            case 403:
              errorMessage = 'Accès refusé. Vérifiez que vous êtes connecté en tant que médecin';
              break;
            case 404:
              errorMessage = 'Endpoint non trouvé. Vérifiez la configuration du serveur';
              break;
            case 409:
              errorMessage = 'Conflit: Cette disponibilité existe peut-être déjà';
              break;
            case 422:
              errorMessage = 'Données non traitables. Vérifiez les champs requis';
              break;
            case 500:
              errorMessage = 'Erreur serveur interne. Contactez l\'administrateur';
              break;
            case 502:
              errorMessage = 'Serveur indisponible. Réessayez plus tard';
              break;
            case 503:
              errorMessage = 'Service temporairement indisponible';
              break;
            default:
              errorMessage = `Erreur HTTP ${error.status}: ${error.error?.message || 'Erreur inconnue'}`;
          }
          
          return of({
            success: false,
            error: errorMessage,
            status: error.status
          });
        })
      );
  }

  getAvailabilities(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/doctor`, this.getAuthHeaders())
      .pipe(
        catchError(error => {
          console.error('Error fetching availabilities:', error);
          return throwError(() => error);
        })
      );
  }

  getAvailabilityById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders())
      .pipe(
        catchError(error => {
          console.error('Error fetching availability:', error);
          return throwError(() => error);
        })
      );
  }

  updateAvailability(id: number | string, availability: any): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('Updating availability with ID:', id, 'Data:', availability);
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, availability, headers)
      .pipe(
        map(response => {
          console.log('Availability updated successfully:', response);
          return response;
        }),
        catchError(error => {
          console.error('Error updating availability:', error);
          return throwError(() => error);
        })
      );
  }

  deleteAvailability(id: number | string): Observable<any> {
    const headers = this.getAuthHeaders();
    console.log('Deleting availability with ID:', id);
    
    return this.http.delete<any>(`${this.apiUrl}/${id}`, headers)
      .pipe(
        map(response => {
          console.log('Availability deleted successfully:', response);
          return response;
        }),
        catchError(error => {
          console.error('Error deleting availability:', error);
          return throwError(() => error);
        })
      );
  }
}
