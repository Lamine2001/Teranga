import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkUserRoleAndRedirect();
  }

  private checkUserRoleAndRedirect() {
    const user = this.authService.getCurrentUser();
    console.log('Dashboard - Current user:', user);
    console.log('Dashboard - User role:', user?.role);
    
    if (!user) {
      console.log('No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    const role = user.role?.toUpperCase();
    console.log('Dashboard - Normalized role:', role);
    
    // Redirection automatique selon le rôle
    if (role === 'DOCTOR' || role === 'MEDECIN') {
      console.log('User is DOCTOR, redirecting to doctor dashboard');
      this.router.navigate(['/dashboard/doctor']);
    } else if (role === 'PATIENT') {
      console.log('User is PATIENT, redirecting to patient dashboard');
      this.router.navigate(['/dashboard/patient']);
    } else if (role === 'ADMIN') {
      console.log('User is ADMIN, redirecting to admin dashboard');
      this.router.navigate(['/dashboard/admin']);
    }
    // Si aucun rôle spécifique, rester sur le dashboard général
  }
}