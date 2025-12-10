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
          
          // The response should have the structure: { user: UserResponseDTO, token: string }
          let token = response.token;
          let userData = response.user;
          
          if (!token) {
            console.error('No token in response');
            return { success: false, error: 'Aucun token reçu du serveur' };
          }
          
          if (!userData) {
            console.error('No user data in response');
            return { success: false, error: 'Données utilisateur manquantes' };
          }
          
          console.log('Token found:', token);
          console.log('User data found:', userData);
          
          // Map UserResponseDTO to User interface
          const user: User = {
            id: userData.userId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            userType: userData.userType,
            isActive: userData.isActive,
            createdAt: userData.createdAt
          } as User;
          
          // Keep userType in uppercase format as stored in backend
          if (user.userType) {
            const normalizedType = user.userType.toUpperCase();
            if (normalizedType === 'DOCTOR' || normalizedType === 'DOCTEUR') {
              user.userType = 'DOCTOR';
            } else if (normalizedType === 'PATIENT') {
              user.userType = 'PATIENT';
            }
          }
          
          console.log('Mapped user object:', user);
          console.log('User type:', user.userType);
          
          // Clean and store token
          token = String(token).trim();
          if (token.startsWith('Bearer ')) {
            token = token.substring(7);
          }
          
          // Save token and user data
          if (isPlatformBrowser(this.platformId)) {
            // Store token in multiple keys for compatibility
            localStorage.setItem('token', token);
            localStorage.setItem('authToken', token);
            localStorage.setItem('jwt', token);
            sessionStorage.setItem('token', token);
            
            // Store user data
            localStorage.setItem(this.userKey, JSON.stringify(user));
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            console.log('Data saved to storage');
            console.log('Stored user:', JSON.parse(localStorage.getItem('currentUser') || '{}'));
          }
          
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          
          return { success: true, user: user };
        }),
        catchError(error => {
          console.error('Login error:', error);
          console.error('Error response:', error.error);
          const errorMessage = this.errorHandler.handleHttpError(error);
          return of({ success: false, error: errorMessage });
        })
      );
  }

  register(data: RegisterData): Observable<{ success: boolean; user?: User; error?: string; message?: string; info?: string }> {
    return this.http.post<any>(`${this.apiUrl}/register`, data, this.httpOptions)
      .pipe(
        map(response => {
          console.log('=== REGISTER RESPONSE DEBUG ===');
          console.log('Full response:', response);
          
          // Response has the structure: { success, message, userId, email, firstName, lastName, role, accountStatus, info }
          if (!response.success) {
            return { 
              success: false, 
              error: response.message || 'Erreur lors de l\'inscription' 
            };
          }
          
          // Map response to User interface
          const user: User = {
            id: response.userId,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            phone: data.phone, // From registration data
            userType: response.role,
            isActive: response.accountStatus !== 'pending_activation',
            createdAt: new Date().toISOString()
          } as User;
          
          // Normalize userType
          if (user.userType) {
            const normalizedType = user.userType.toUpperCase();
            if (normalizedType === 'DOCTOR' || normalizedType === 'DOCTEUR') {
              user.userType = 'DOCTOR';
            } else if (normalizedType === 'PATIENT') {
              user.userType = 'PATIENT';
            }
          }
          
          console.log('Registered user:', user);
          console.log('User userType:', user.userType);
          console.log('Account status:', response.accountStatus);
          
          // Note: No token is provided during registration
          // User needs to login after account activation
          
          return { 
            success: true, 
            user: user,
            message: response.message,
            info: response.info
          };
        }),
        catchError(error => {
          console.error('Registration error:', error);
          const errorMessage = this.errorHandler.handleHttpError(error);
          return of({ success: false, error: errorMessage });
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

  // Ajouter une méthode pour vérifier le rôle
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    console.log('Current user:', user);
    console.log('User userType:', user?.userType);
    console.log('Checking for role:', role);
    
    if (user?.userType) {
      // Si le rôle est stocké avec le préfixe ROLE_
      if (user.userType === `ROLE_${role}`) {
        return true;
      }
      // Si le rôle est stocké sans préfixe
      if (user.userType === role) {
        return true;
      }
      // Comparaison insensible à la casse
      if (user.userType.toUpperCase() === role.toUpperCase()) {
        return true;
      }
      // Si le rôle contient ROLE_ et on compare sans
      if (user.userType.replace('ROLE_', '') === role) {
        return true;
      }
    }
    
    return false;
  }

  isDoctor(): boolean {
    const user = this.getCurrentUser();
    console.log('isDoctor() check - userType:', user?.userType);
    
    if (!user?.userType) {
      return false;
    }
    
    // Normaliser le userType en majuscules pour la comparaison
    const normalizedUserType = user.userType.toUpperCase();
    
    // Vérifier si l'utilisateur est un docteur
    return normalizedUserType === 'DOCTOR' || 
           normalizedUserType === 'MEDECIN' || 
           normalizedUserType === 'ROLE_DOCTOR' ||
           normalizedUserType === 'ROLE_MEDECIN' ||
           // Retirer le préfixe ROLE_ s'il existe
           normalizedUserType.replace('ROLE_', '') === 'DOCTOR' ||
           normalizedUserType.replace('ROLE_', '') === 'MEDECIN';
  }

  isPatient(): boolean {
    return this.hasRole('PATIENT') || 
           this.hasRole('ROLE_PATIENT');
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
  verifyToken(): Observable<{ valid: boolean; user?: User; status?: number }> {
    const token = this.getAuthToken();
    if (!token) {
      return of({ valid: false });
    }

    return this.http.get<any>(`${this.apiUrl}/verify`, this.getAuthHeaders())
      .pipe(
        map(response => {
          if (response.user) {
            const userData = response.user;
            const user: User = {
              id: userData.userId,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              userType: userData.userType,
              isActive: userData.isActive,
              createdAt: userData.createdAt
            } as User;
            
            // Keep userType in uppercase format as stored in backend
            if (user.userType) {
              const normalizedType = user.userType.toUpperCase();
              if (normalizedType === 'DOCTOR' || normalizedType === 'DOCTEUR') {
                user.userType = 'DOCTOR';
              } else if (normalizedType === 'PATIENT') {
                user.userType = 'PATIENT';
              }
            }
            
            return { valid: true, user: user };
          }
          return { valid: false };
        }),
        catchError((error) => {
          console.warn('Token verification failed:', error);
          // ✅ FIX: Don't clear user data on network errors
          // Only return status to let caller decide
          return of({ valid: false, status: error.status });
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
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (savedUser && token) {
        try {
          const user = JSON.parse(savedUser);
          console.log('Restored user from storage:', user);
          console.log('User type from storage:', user.userType);
          
          // ✅ Set user immediately to avoid delay
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          
          // ✅ IMPROVED: Verify token but don't force logout on errors
          this.verifyToken().subscribe({
            next: (result) => {
              if (result.valid && result.user) {
                // ✅ Update with fresh data from server
                console.log('Token verified, updating user from server');
                this.currentUserSubject.next(result.user);
                this.isAuthenticatedSubject.next(true);
              } else if (result.status === 401) {
                // ✅ Only logout on explicit 401 Unauthorized
                console.log('Token invalid (401), logging out');
                this.clearUserData();
                this.router.navigate(['/auth']);
              } else {
                // ✅ Keep local user for other errors (network, 500, etc.)
                console.warn('Token verification failed, keeping local user (status:', result.status, ')');
              }
            },
            error: (error) => {
              // ✅ Keep local user if verification fails (offline mode)
              console.warn('Token verification error, keeping local user:', error);
              // Only logout on explicit 401
              if (error.status === 401) {
                console.log('Unauthorized, logging out');
                this.clearUserData();
                this.router.navigate(['/auth']);
              }
            }
          });
        } catch (e) {
          console.error('Error parsing saved user:', e);
          this.clearUserData();
        }
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
    return this.http.post(`${this.apiUrl}/forgot-password`, { email }, this.httpOptions)
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
    return this.http.post(`${this.apiUrl}/verifyCode`, { email, code }, this.httpOptions)
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
    return this.http.post(`${this.apiUrl}/reset-password`, { 
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
    return this.http.post(`${this.apiUrl}/password-reset/confirm`, {
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
    
    // Return userType since that's where PATIENT or DOCTOR is stored
    return user.userType || null;
  }
}








