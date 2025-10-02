import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppointmentContext {
  consultationMode?: string; // 'video' | 'in-person'
  patientType?: string; // 'new' | 'existing' | 'guest'
  selectedDoctor?: any;
  selectedSlot?: any;
  patientData?: any;
  confirmedAppointment?: any; // Ajout pour stocker le rendez-vous confirmé
  confirmationCode?: string; // Pour les réservations guest
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentContextService {
  private contextSubject = new BehaviorSubject<AppointmentContext>({});
  public context$: Observable<AppointmentContext> = this.contextSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialiser seulement côté client
    if (isPlatformBrowser(this.platformId)) {
      // Code d'initialisation qui utilise sessionStorage
      this.loadContext();
    }
  }

  updateContext(updates: Partial<AppointmentContext>): void {
    const currentContext = this.contextSubject.value;
    const newContext = { ...currentContext, ...updates };
    this.contextSubject.next(newContext);
    
    // Sauvegarder dans sessionStorage seulement côté client
    if (isPlatformBrowser(this.platformId)) {
      this.saveContext();
    }
  }

  getContext(): AppointmentContext {
    return this.contextSubject.value;
  }

  private loadContext(): void {
    // Cette méthode ne sera appelée que côté client
    if (isPlatformBrowser(this.platformId) && typeof sessionStorage !== 'undefined') {
      try {
        const savedContext = sessionStorage.getItem('appointmentContext');
        if (savedContext) {
          const parsedContext = JSON.parse(savedContext);
          this.contextSubject.next(parsedContext);
          console.log('Context loaded from sessionStorage:', parsedContext);
        }
      } catch (error) {
        console.error('Error loading context from sessionStorage:', error);
        // Nettoyer en cas d'erreur
        this.clearSavedContext();
      }
    }
  }

  saveContext(): void {
    if (isPlatformBrowser(this.platformId) && typeof sessionStorage !== 'undefined') {
      try {
        const currentContext = this.contextSubject.value;
        if (currentContext && Object.keys(currentContext).length > 0) {
          sessionStorage.setItem('appointmentContext', JSON.stringify(currentContext));
          console.log('Context saved to sessionStorage:', currentContext);
        }
      } catch (error) {
        console.error('Error saving context to sessionStorage:', error);
      }
    }
  }

  clearSavedContext(): void {
    if (isPlatformBrowser(this.platformId) && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('appointmentContext');
        console.log('Context cleared from sessionStorage');
      } catch (error) {
        console.error('Error clearing context from sessionStorage:', error);
      }
    }
  }

  clearContext(): void {
    this.contextSubject.next({});
    this.clearSavedContext();
  }

  getPatientType(): string | undefined {
    return this.contextSubject.value.patientType;
  }

  getConsultationMode(): string | undefined {
    return this.contextSubject.value.consultationMode;
  }

  setSelectedSlot(slot: any): void {
    this.updateContext({ selectedSlot: slot });
  }

  setSelectedDoctor(doctor: any): void {
    this.updateContext({ selectedDoctor: doctor });
  }
}
