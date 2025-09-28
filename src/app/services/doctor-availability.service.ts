import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorAvailabilityService {
  private apiUrl = `${environment.apiUrl}/availability`; // Corriger l'URL (availability au singulier)

  constructor(private http: HttpClient) {}

  // ...existing code...

  deleteAvailability(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { 
      responseType: 'text' // Spécifier que la réponse est du texte
    }).pipe(
      map((response: string) => {
        // La réponse est une chaîne de texte
        console.log('Delete response:', response);
        return { message: response, success: true };
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}