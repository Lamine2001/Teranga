import { Routes } from '@angular/router';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { DoctorDashboardComponent } from './pages/dashboard/doctor-dashboard/doctor-dashboard.component';
import { PatientDashboardComponent } from './pages/dashboard/patient-dashboard/patient-dashboard.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { EditProfileComponent } from './components/user-profile/edit-profile/edit-profile.component';
import { ChangePasswordComponent } from './components/user-profile/change-password/change-password.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'services', loadComponent: () => import('./pages/service-page/service-page.component').then(m => m.ServicePageComponent) },
  { path: 'auth', component: AuthPageComponent },
  { path: 'doctor-dashboard', component: DoctorDashboardComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
  { path: 'appointments/search', loadComponent: () => import('./components/appointments/appointment-search/appointment-search.component').then(m => m.AppointmentSearchComponent) },
  { path: 'book-appointment', loadComponent: () => import('./components/appointments/appointment-search/appointment-search.component').then(m => m.AppointmentSearchComponent) },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ForgotPasswordComponent },
  { 
    path: 'profile', 
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile/edit', 
    component: EditProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile/change-password', 
    component: ChangePasswordComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/home' }
];
