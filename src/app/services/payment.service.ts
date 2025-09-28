import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface PaymentRequest {
  amount: number;
  appointmentId: string;
  patientInfo: any;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor() { }

  processPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    // Simulation d'un appel API de paiement
    return of({
      success: true,
      transactionId: 'TXN_' + Date.now(),
      message: 'Paiement traité avec succès'
    }).pipe(
      delay(2000) // Simuler une latence réseau
    );
  }

  validatePayment(transactionId: string): Observable<boolean> {
    // Simulation de validation de paiement
    return of(true).pipe(delay(1000));
  }
}