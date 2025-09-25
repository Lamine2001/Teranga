import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class MockAuthService {
  private tokenKey = 'mock_token';
  private userKey = 'mock_user';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  /**
   * Generate a mock JWT token for development
   */
  generateMockToken(): string {
    const header = {
      "alg": "HS256",
      "typ": "JWT"
    };

    const payload = {
      "sub": "mock-user-id",
      "email": "mock@teranga.com",
      "role": "patient",
      "iat": Math.floor(Date.now() / 1000),
      "exp": Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Simple base64 encoding (not secure, just for development)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa('mock-signature-for-development');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Create a mock user for development
   */
  createMockUser(): User {
    return {
      id: 'mock-user-id',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'mock@teranga.com',
      phone: '+221 77 123 45 67',
      dateOfBirth: '1990-01-01',
      gender: 'M',
      address: '123 Rue de la Paix',
      city: 'Dakar',
      userType: 'patient',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Mock login for development
   */
  login(credentials: any): Observable<{ success: boolean; user?: User; token?: string; error?: string }> {
    // Simulate API delay
    return new Observable(observer => {
      setTimeout(() => {
        const token = this.generateMockToken();
        const user = this.createMockUser();
        
        // Store token and user
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        
        observer.next({
          success: true,
          user: user,
          token: token
        });
        observer.complete();
      }, 1000); // 1 second delay to simulate network
    });
  }

  /**
   * Mock registration for development
   */
  register(userData: any): Observable<{ success: boolean; user?: User; token?: string; error?: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        const token = this.generateMockToken();
        const user = this.createMockUser();
        
        // Update user data with registration info
        user.firstName = userData.firstName || user.firstName;
        user.lastName = userData.lastName || user.lastName;
        user.email = userData.email || user.email;
        user.phone = userData.phone || user.phone;
        
        // Store token and user
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        
        observer.next({
          success: true,
          user: user,
          token: token
        });
        observer.complete();
      }, 1500); // 1.5 second delay
    });
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && this.isAuthenticatedSubject.value;
  }

  /**
   * Check auth status from localStorage
   */
  private checkAuthStatus(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.tokenKey);
      const userStr = localStorage.getItem(this.userKey);
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          this.logout();
        }
      }
    }
  }

  /**
   * Mock logout
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Mock forgot password
   */
  forgotPassword(email: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: `Un email de réinitialisation a été envoyé à ${email}`
        });
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Mock reset password
   */
  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message?: string; error?: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Mot de passe réinitialisé avec succès'
        });
        observer.complete();
      }, 1000);
    });
  }
}
