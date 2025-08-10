import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, Doctor, Patient, LoginCredentials, RegisterData } from '../interfaces/user';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Configuration de l'API backend
  private readonly apiUrl = environment.apiUrl; // URL depuis l'environnement
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {
    // Vérifier si l'utilisateur est déjà connecté (localStorage)
    this.checkAuthStatus();
  }

  login(credentials: LoginCredentials): Observable<{ success: boolean; user?: User; error?: string }> {
    return this.http.post<{ user: User; token: string }>(`${this.apiUrl}/auth/login`, credentials, this.httpOptions)
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

  register(data: RegisterData): Observable<{ success: boolean; user?: User; error?: string }> {
    return this.http.post<{ user: User; token: string }>(`${this.apiUrl}/auth/register`, data, this.httpOptions)
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
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/auth/logout`, {}, this.getAuthHeaders())
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
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
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

  getAuthToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
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
}
