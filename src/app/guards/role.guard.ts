import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredRole = route.data['role'];
    const user = this.authService.getCurrentUser();
    
    console.log('=== ROLE GUARD CHECK ===');
    console.log('Required role:', requiredRole);
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    
    if (!user) {
      console.log('No user, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    
    const userRole = user.role?.toUpperCase();
    const required = requiredRole?.toUpperCase();
    
    console.log('Comparing roles - User:', userRole, 'Required:', required);
    
    // Vérifier si l'utilisateur a le bon rôle
    if (required === 'DOCTOR' && (userRole === 'DOCTOR' || userRole === 'MEDECIN')) {
      console.log('Access granted - User is doctor');
      return true;
    }
    
    if (required === 'PATIENT' && userRole === 'PATIENT') {
      console.log('Access granted - User is patient');
      return true;
    }
    
    if (required === 'ADMIN' && userRole === 'ADMIN') {
      console.log('Access granted - User is admin');
      return true;
    }
    
    // Si pas le bon rôle, rediriger vers le bon dashboard
    console.log('Access denied - redirecting to appropriate dashboard');
    
    if (userRole === 'DOCTOR' || userRole === 'MEDECIN') {
      this.router.navigate(['/dashboard/doctor']);
    } else if (userRole === 'PATIENT') {
      this.router.navigate(['/dashboard/patient']);
    } else {
      this.router.navigate(['/dashboard']);
    }
    
    return false;
  }
}

