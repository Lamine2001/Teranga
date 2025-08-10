import { Routes } from '@angular/router';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { DoctorDashboardComponent } from './pages/dashboard/doctor-dashboard/doctor-dashboard.component';
import { PatientDashboardComponent } from './pages/dashboard/patient-dashboard/patient-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'auth', component: AuthPageComponent },
  { path: 'doctor-dashboard', component: DoctorDashboardComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
  { path: '**', redirectTo: '/home' }
];
