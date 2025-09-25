import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'mobile_money' | 'bank_transfer' | 'onsite' | 'insurance';
  appointmentData: any;
  cardDetails?: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    cardholderName: string;
  };
  mobileMoneyDetails?: {
    provider: 'orange_money' | 'mtn_money' | 'free_money';
    phoneNumber: string;
    pin: string;
  };
  insuranceDetails?: {
    provider: string;
    policyNumber: string;
    memberId: string;
  };
  metadata?: any;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  status?: 'pending' | 'completed' | 'failed';
  error?: string;
  message?: string;
  redirectUrl?: string;
  qrCode?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  isAvailable: boolean;
  processingFee?: number;
  minAmount?: number;
  maxAmount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Process a payment for appointment booking
   */
  processPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/process`, paymentData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(amount: number): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/methods?amount=${amount}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Verify payment status
   */
  verifyPayment(paymentId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/verify/${paymentId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Process card payment
   */
  processCardPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/card`, paymentData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Process mobile money payment
   */
  processMobileMoneyPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/mobile-money`, paymentData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Process insurance payment
   */
  processInsurancePayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/insurance`, paymentData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Cancel a payment
   */
  cancelPayment(paymentId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/cancel/${paymentId}`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get payment history for user
   */
  getPaymentHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Refund a payment
   */
  refundPayment(paymentId: string, reason?: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/refund/${paymentId}`, {
      reason: reason || 'User requested refund'
    }, {
      headers: this.getHeaders()
    });
  }

  /**
   * Generate payment QR code for mobile money
   */
  generateQRCode(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/qr-code`, paymentData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and non-digit characters
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    // Process digits from right to left
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Get card type from card number
   */
  getCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Visa
    if (/^4/.test(cleaned)) {
      return 'visa';
    }
    
    // Mastercard
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
      return 'mastercard';
    }
    
    // American Express
    if (/^3[47]/.test(cleaned)) {
      return 'amex';
    }
    
    return 'unknown';
  }

  /**
   * Format card number with spaces
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Calculate processing fee
   */
  calculateProcessingFee(amount: number, paymentMethod: string): number {
    const fees = {
      card: 0.029, // 2.9%
      mobile_money: 0.015, // 1.5%
      bank_transfer: 0.005, // 0.5%
      onsite: 0,
      insurance: 0
    };

    const feeRate = fees[paymentMethod as keyof typeof fees] || 0;
    return Math.round(amount * feeRate);
  }

  /**
   * Get payment status color for UI
   */
  getPaymentStatusColor(status: string): string {
    const colors = {
      pending: '#ffc107',
      completed: '#28a745',
      failed: '#dc3545',
      cancelled: '#6c757d',
      refunded: '#17a2b8'
    };

    return colors[status as keyof typeof colors] || '#6c757d';
  }

  /**
   * Get payment status text for UI
   */
  getPaymentStatusText(status: string): string {
    const texts = {
      pending: 'En attente',
      completed: 'Payé',
      failed: 'Échec',
      cancelled: 'Annulé',
      refunded: 'Remboursé'
    };

    return texts[status as keyof typeof texts] || status;
  }
}
