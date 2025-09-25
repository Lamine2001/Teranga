import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  handleHttpError(error: HttpErrorResponse): string {
    let errorMessage = 'Une erreur inattendue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé - Vérifiez vos identifiants';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflit - Données déjà existantes';
          break;
        case 422:
          errorMessage = error.error?.message || 'Données de validation incorrectes';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        case 503:
          errorMessage = 'Service temporairement indisponible';
          break;
        default:
          errorMessage = error.error?.message || `Erreur: ${error.status}`;
      }
    }

    console.error('Erreur HTTP:', error);
    return errorMessage;
  }

  logError(error: any, context?: string): void {
    console.error(`Erreur${context ? ` dans ${context}` : ''}:`, error);
  }
}
