import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, delay, tap } from 'rxjs/operators';
import { User, Doctor, Patient, LoginCredentials, RegisterData } from '../interfaces/user';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from './error-handler.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private tokenKey = 'token';
  private userKey = 'user';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Configuration de l'API backend
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private router: Router
  ) {
    // Vérifier si l'utilisateur est déjà connecté (localStorage)
    this.checkAuthStatus();
  }

  login(credentials: LoginCredentials): Observable<{ success: boolean; user?: User; error?: string }> {
    // Update to use the correct endpoint from Swagger
    return this.http.post<any>(`${this.apiUrl}/apiLogin`, credentials, this.httpOptions)
      .pipe(
        map(response => {
          console.log('=== LOGIN RESPONSE DEBUG ===');
          console.log('Full response:', response);
          console.log('Response keys:', Object.keys(response));
          
          // Try to find the JWT token in various possible locations
          let token = null;
          
          // Check common token field names
          const tokenFields = ['jwt', 'JWT', 'token', 'Token', 'accessToken', 'access_token', 'authToken', 'authorization'];
          for (const field of tokenFields) {
            if (response[field]) {
              token = response[field];
              console.log(`Token found in field "${field}":`, token);
              break;
            }
          }
          
          // Check if the whole response is the token (string response)
          if (!token && typeof response === 'string' && response.length > 20) {
            token = response;
            console.log('Response is the token itself:', token);
          }
          
          let user: User = response.user || response;
          
          if (token) {
            console.log('Token to be stored:', token);
            console.log('Token type:', typeof token);
            
            // Make sure token is a string
            token = String(token).trim();
            
            // Remove "Bearer " prefix if it exists
            if (token.startsWith('Bearer ')) {
              token = token.substring(7);
            }
            
            // Save token consistently across all storage keys
            if (isPlatformBrowser(this.platformId)) {
              // Use consistent token storage
              localStorage.setItem('token', token);
              localStorage.setItem('authToken', token);
              localStorage.setItem('jwt', token);
              sessionStorage.setItem('token', token);
              sessionStorage.setItem('authToken', token);
              sessionStorage.setItem('jwt', token);
              
              console.log('Token saved to storage');
              console.log('Verification - token from storage:', localStorage.getItem('token'));
            }
            
            // Create user object if not provided
            if (!user.id && response.id) {
              user = {
                id: response.id,
                email: response.email || credentials.email,
                role: response.role || response.userType,
                userType: response.userType || response.role,
                firstName: response.firstName,
                lastName: response.lastName
              } as User;
            }
            
            // Ensure role is set for compatibility
            if (!user.role && user.userType) {
              user.role = user.userType;
            }
            
            // Save user info
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(this.userKey, JSON.stringify(user));
              localStorage.setItem('currentUser', JSON.stringify(user));
            }
            
            this.currentUserSubject.next(user);
            this.isAuthenticatedSubject.next(true);
            
            return { success: true, user: user };
          }
          
          console.error('No token found in response');
          return { success: false, error: 'Aucun token reçu du serveur' };
        }),
        catchError(error => {
          console.error('Login error:', error);
          console.error('Error response:', error.error);
          const errorMessage = this.errorHandler.handleHttpError(error);
          return of({ success: false, error: errorMessage });
        })
      );
  }

  register(data: RegisterData): Observable<{ success: boolean; user?: User; error?: string }> {
    return this.http.post<{ user: User; token: string }>(`${this.apiUrl}/signup`, data, this.httpOptions)
      .pipe(
        map(response => {
          if (response.user && response.token) {
            // Stocker le token
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('authToken', response.token);
            }
            this.setCurrentUser(response.user);
            return { success: true, user: response.user };
          }
          return { success: false, error: 'Réponse invalide du serveur' };
        }),
        catchError(error => {
          const errorMessage = this.errorHandler.handleHttpError(error);
          return [{ success: false, error: errorMessage }];
        })
      );
  }

  logout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/logout`, {}, this.getAuthHeaders())
      .pipe(
        map(() => {
          this.clearUserData();
          return { success: true };
        }),
        catchError(error => {
          console.error('Erreur de déconnexion:', error);
          // Même en cas d'erreur, on déconnecte l'utilisateur localement
          this.clearUserData();
          return [{ success: true }];
        })
      );
  }
 

  private clearUserData(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Clear all token storage locations
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem(this.userKey);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('authToken');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isDoctor(): boolean {
    const user = this.getCurrentUser();
    return user?.userType === 'doctor';
  }

  isPatient(): boolean {
    const user = this.getCurrentUser();
    return user?.userType === 'patient';
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      // Check all possible token storage locations
      const token = localStorage.getItem('token') || 
             localStorage.getItem('authToken') || 
             localStorage.getItem('jwt') ||
             sessionStorage.getItem('token') || 
             sessionStorage.getItem('authToken') ||
             sessionStorage.getItem('jwt');
      
      if (token) {
        console.log('getToken() returning:', token);
      }
      
      return token;
    }
    return null;
  }

  getAuthToken(): string | null {
    // Use the same method for consistency
    return this.getToken();
  }

  private getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  // Méthode pour vérifier la validité du token
  verifyToken(): Observable<{ valid: boolean; user?: User }> {
    const token = this.getAuthToken();
    if (!token) {
      return new Observable(observer => {
        observer.next({ valid: false });
        observer.complete();
      });
    }

    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/verify`, this.getAuthHeaders())
      .pipe(
        map(response => ({ valid: true, user: response.user })),
        catchError(() => {
          this.clearUserData();
          return [{ valid: false }];
        })
      );
  }

  private setCurrentUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private checkAuthStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('authToken');
      
      if (savedUser && token) {
        // Vérifier la validité du token avec le backend
        this.verifyToken().subscribe({
          next: (result) => {
            if (result.valid && result.user) {
              this.currentUserSubject.next(result.user);
              this.isAuthenticatedSubject.next(true);
            } else {
              this.clearUserData();
            }
          },
          error: () => {
            this.clearUserData();
          }
        });
      }
    }
  }

  sendResetCode(email: string): Observable<any> {
    // Using actual API endpoint from Swagger
    const useMockAPI = false; // Disabled mock since we have the real endpoint
    
    if (useMockAPI) {
      // Simulate API call with delay
      return of({ success: true, message: 'Code sent successfully' }).pipe(
        delay(1000),
        map(response => {
          // Store the mock code in sessionStorage for testing
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('mockResetCode', '123456');
            sessionStorage.setItem('resetEmail', email);
          }
          return response;
        })
      );
    }
    
    // Actual API call - adjust endpoint path based on your Swagger spec
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }, this.httpOptions)
      .pipe(
        map(response => response),
        catchError(error => {
          // Check if response is HTML instead of JSON
          if (error.error instanceof ProgressEvent || typeof error.error === 'string') {
            console.error('API endpoint not available or returning HTML');
            return throwError(() => new Error('Service temporairement indisponible. Veuillez réessayer plus tard.'));
          }
          return throwError(() => new Error(error.error?.message || 'Erreur lors de l\'envoi du code'));
        })
      );
  }

  verifyResetCode(email: string, code: string): Observable<any> {
    const useMockAPI = false; // Disabled mock
    
    if (useMockAPI) {
      return of({ success: true }).pipe(
        delay(500),
        map(() => {
          if (isPlatformBrowser(this.platformId)) {
            const mockCode = sessionStorage.getItem('mockResetCode');
            const resetEmail = sessionStorage.getItem('resetEmail');
            
            if (email === resetEmail && code === mockCode) {
              return { success: true, message: 'Code verified' };
            } else {
              throw new Error('Code invalide ou expiré');
            }
          }
          return { success: true };
        }),
        catchError(error => throwError(() => error))
      );
    }
    
    // Verify code endpoint
    return this.http.post(`${this.apiUrl}/auth/verify-code`, { email, code }, this.httpOptions)
      .pipe(
        map(response => response),
        catchError(error => {
          if (error.error instanceof ProgressEvent || typeof error.error === 'string') {
            return throwError(() => new Error('Service temporairement indisponible'));
          }
          return throwError(() => new Error(error.error?.message || 'Code invalide'));
        })
      );
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    const useMockAPI = false; // Disabled mock
    
    if (useMockAPI) {
      return of({ success: true }).pipe(
        delay(1000),
        map(() => {
          if (isPlatformBrowser(this.platformId)) {
            // Clear mock data
            sessionStorage.removeItem('mockResetCode');
            sessionStorage.removeItem('resetEmail');
          }
          return { success: true, message: 'Password reset successfully' };
        })
      );
    }
    
    // Reset password endpoint from Swagger
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { 
      email, 
      code, 
      newPassword 
    }, this.httpOptions)
      .pipe(
        map(response => response),
        catchError(error => {
          if (error.error instanceof ProgressEvent || typeof error.error === 'string') {
            return throwError(() => new Error('Service temporairement indisponible'));
          }
          return throwError(() => new Error(error.error?.message || 'Erreur lors de la réinitialisation'));
        })
      );
  }

  // Alternative: If your API uses a single endpoint for password reset
  // Based on typical Swagger REST API patterns
  initiatePasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/password-reset/initiate`, { email }, this.httpOptions)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  confirmPasswordReset(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/password-reset/confirm`, {
      email,
      token,
      newPassword
    }, this.httpOptions)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  // Méthode pour demander la réinitialisation du mot de passe (envoie un code par email)
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  private handleError = (error: any) => {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.error && typeof error.error === 'object') {
      // Backend returned an error response
      errorMessage = error.error.message || error.error.error || errorMessage;
    } else if (typeof error.error === 'string') {
      // HTML response (404, etc.)
      errorMessage = 'Service temporairement indisponible';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    // Check both role and userType for compatibility
    if ('role' in user && user.role) {
      return user.role;
    }
    if ('userType' in user && user.userType) {
      return user.userType;
    }
    return null;
  }
}
