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
import { PatientTypeSelectorComponent } from './components/appointments/patient-type-selector/patient-type-selector.component';
import { DoctorsListComponent } from './components/appointments/doctors-list/doctors-list.component';
import { AppointmentBookingComponent } from './components/appointments/appointment-booking/appointment-booking.component';
import { AppointmentWizardComponent } from './components/appointments/appointment-wizard/appointment-wizard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'services', loadComponent: () => import('./pages/service-page/service-page.component').then(m => m.ServicePageComponent) },
  { path: 'auth', component: AuthPageComponent },
  { path: 'doctor-dashboard', component: DoctorDashboardComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
  { path: 'appointments/search', loadComponent: () => import('./components/appointments/appointment-search/appointment-search.component').then(m => m.AppointmentSearchComponent) },
  
  // New Booking Workflow Routes
  {
    path: 'book-appointment',
    loadComponent: () => import('./components/appointments/appointment-workflow/appointment-workflow.component').then(m => m.AppointmentWorkflowComponent),
    children: [
      { path: '', redirectTo: 'mode', pathMatch: 'full' },
      { path: 'mode', loadComponent: () => import('./components/appointments/consultation-mode-selector/consultation-mode-selector.component').then(m => m.ConsultationModeSelectorComponent) },
      { path: 'patient-type', loadComponent: () => import('./components/appointments/patient-type-selector/patient-type-selector.component').then(m => m.PatientTypeSelectorComponent) },
      { path: 'specialty', loadComponent: () => import('./components/appointments/specialty-selector/specialty-selector.component').then(m => m.SpecialtySelectorComponent) },
      { path: 'professional', loadComponent: () => import('./components/appointments/appointment-search/appointment-search.component').then(m => m.AppointmentSearchComponent) },
      { path: 'availability', loadComponent: () => import('./components/appointments/appointment-search/appointment-search.component').then(m => m.AppointmentSearchComponent) },
      { path: 'information', loadComponent: () => import('./components/appointments/appointment-search/appointment-search.component').then(m => m.AppointmentSearchComponent) },
      { path: 'confirmation', loadComponent: () => import('./components/appointments/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent) }
    ]
  },
  { path: 'appointments/patient-type', component: PatientTypeSelectorComponent },
  {
    path: 'appointments/doctors',
    component: DoctorsListComponent
  },
  {
    path: 'appointments/booking',
    component: AppointmentBookingComponent
  },
  {
    path: 'appointments/wizard',
    component: AppointmentWizardComponent
  },
  // Rediriger l'ancienne route vers le wizard
  {
    path: 'appointments/consultation-mode',
    redirectTo: 'appointments/wizard',
    pathMatch: 'full'
  },
  
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
  
  // Consultation Routes
  {
    path: 'consultations/management',
    loadComponent: () => import('./components/consultations/consultation-management/consultation-management.component').then(m => m.ConsultationManagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'consultations/history',
    loadComponent: () => import('./components/consultations/consultation-history/consultation-history.component').then(m => m.ConsultationHistoryComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'consultations/video/:id',
    loadComponent: () => import('./components/consultations/video-consultation/video-consultation.component').then(m => m.VideoConsultationComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'consultations/:id',
    loadComponent: () => import('./components/consultations/consultation-details/consultation-details.component').then(m => m.ConsultationDetailsComponent),
    canActivate: [AuthGuard]
  },
  
  { path: '**', redirectTo: '/home' }
];
