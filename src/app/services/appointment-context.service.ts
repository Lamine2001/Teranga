import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppointmentContext {
  consultationMode?: string; // 'video' | 'in-person'
  patientType?: string; // 'new' | 'existing' | 'guest'
  selectedDoctor?: any;
  selectedSlot?: any;
  patientData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentContextService {
  private contextSubject = new BehaviorSubject<AppointmentContext>({});
  public context$: Observable<AppointmentContext> = this.contextSubject.asObservable();

  constructor() {
    // Restaurer le contexte depuis sessionStorage si disponible
    const savedContext = sessionStorage.getItem('appointmentContext');
    if (savedContext) {
      this.contextSubject.next(JSON.parse(savedContext));
    }
  }

  updateContext(updates: Partial<AppointmentContext>): void {
    const currentContext = this.contextSubject.value;
    const newContext = { ...currentContext, ...updates };
    this.contextSubject.next(newContext);
    
    // Sauvegarder dans sessionStorage
    sessionStorage.setItem('appointmentContext', JSON.stringify(newContext));
  }

  getContext(): AppointmentContext {
    return this.contextSubject.value;
  }

  clearContext(): void {
    this.contextSubject.next({});
    sessionStorage.removeItem('appointmentContext');
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
