import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppointmentWizardState {
  currentStep?: string;
  consultationMode?: 'video' | 'in-person';
  patientType?: 'new' | 'existing' | 'guest';
  doctorId?: string;
  doctorDetails?: any;
  slotId?: string;
  slotDetails?: any;
  patientData?: any;
  confirmedAppointment?: any;
  confirmationCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentWizardStore {
  private readonly STORAGE_KEY = 'appointment-wizard-state';
  private state$ = new BehaviorSubject<AppointmentWizardState>({});

  constructor() {
    // Charger l'état depuis localStorage au démarrage
    this.loadState();
  }

  get value(): AppointmentWizardState {
    return this.state$.value;
  }

  asObservable(): Observable<AppointmentWizardState> {
    return this.state$.asObservable();
  }

  setState(partial: Partial<AppointmentWizardState>): void {
    const newState = { ...this.value, ...partial };
    this.state$.next(newState);
    this.saveState(newState);
  }

  updateField<K extends keyof AppointmentWizardState>(
    field: K,
    value: AppointmentWizardState[K]
  ): void {
    this.setState({ [field]: value });
  }

  clearState(): void {
    this.state$.next({});
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  private saveState(state: AppointmentWizardState): void {
    // Sauvegarder dans localStorage pour persister entre les onglets
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    // Aussi dans sessionStorage pour une récupération plus rapide
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  private loadState(): void {
    try {
      // Essayer d'abord sessionStorage (plus récent)
      const sessionState = sessionStorage.getItem(this.STORAGE_KEY);
      if (sessionState) {
        this.state$.next(JSON.parse(sessionState));
        return;
      }

      // Sinon, charger depuis localStorage
      const localState = localStorage.getItem(this.STORAGE_KEY);
      if (localState) {
        this.state$.next(JSON.parse(localState));
      }
    } catch (error) {
      console.error('Error loading wizard state:', error);
      this.clearState();
    }
  }

  // Méthodes utilitaires spécifiques
  setDoctor(doctor: any): void {
    this.setState({
      doctorId: doctor.id,
      doctorDetails: doctor
    });
  }

  setSlot(slot: any): void {
    this.setState({
      slotId: slot.id,
      slotDetails: slot
    });
  }

  isStateComplete(): boolean {
    const state = this.value;
    return !!(state.consultationMode && state.patientType && state.doctorId && state.slotId);
  }

  getReturnUrl(): string {
    return '/appointments/wizard';
  }

  prepareForLogin(): void {
    // Sauvegarder l'état actuel avant la redirection
    const currentState = this.value;
    this.setState({
      ...currentState,
      currentStep: 'login-redirect'
    });
  }
}
