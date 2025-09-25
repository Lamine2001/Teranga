# Teranga Medical Platform - Complete Workflows Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Authentication & Authorization Workflows](#authentication--authorization-workflows)
3. [Doctor-Specific Workflows](#doctor-specific-workflows)
4. [Patient-Specific Workflows](#patient-specific-workflows)
5. [Profile Management Workflows](#profile-management-workflows)
6. [Public Pages Workflows](#public-pages-workflows)
7. [Navigation & Routing Workflows](#navigation--routing-workflows)
8. [Technical Architecture](#technical-architecture)
9. [User Experience Flows](#user-experience-flows)

---

## Application Overview

Teranga is an Angular 19 medical platform (branded as "VitaMedicale") that connects patients with doctors for appointment scheduling and medical consultations. The application integrates with a Spring Boot backend running on `localhost:8080`.

**Key Features:**
- JWT-based authentication
- Role-based access control (Doctor/Patient)
- Appointment booking system
- Availability management for doctors
- Profile management
- Responsive design

---

## Authentication & Authorization Workflows

### 1. User Registration Workflow

**Entry Point:** `/auth` page with registration mode

**Process Flow:**
1. User accesses `/auth?mode=register`
2. Registration form displays with role selection
3. User fills required fields:
   - Email (validated)
   - Password (min 8 characters)
   - Confirm Password
   - First Name, Last Name
   - Phone Number
   - Role-specific fields:
     - **Doctor**: Specialization, License Number
     - **Patient**: Date of Birth, Address
4. System validates form data
5. API call: `POST /api/auth/register`
6. Backend creates user account
7. Response includes user data + JWT token
8. User automatically logged in
9. Redirect based on role:
   - Doctor → `/doctor-dashboard`
   - Patient → `/patient-dashboard`

**Error Handling:**
- Email already exists → Display error message
- Validation errors → Show field-specific errors
- Server errors → Display user-friendly error message

### 2. User Login Workflow

**Entry Point:** `/auth` page with login mode

**Process Flow:**
1. User accesses `/auth` (default login mode)
2. User enters credentials:
   - Email
   - Password
3. System validates form
4. API call: `POST /api/auth/apiLogin`
5. Backend validates credentials
6. Response includes:
   - User profile data
   - JWT token
7. Token stored in localStorage/sessionStorage
8. User state updated in AuthService
9. Redirect based on user role:
   - Doctor → `/doctor-dashboard`
   - Patient → `/patient-dashboard`

**Error Handling:**
- Invalid credentials → "Identifiants incorrects"
- Account disabled → "Compte désactivé"
- Network errors → "Erreur de connexion"

### 3. Password Reset Workflow

**Entry Point:** "Forgot Password" link on login form

**Process Flow:**
1. User clicks "Mot de passe oublié?"
2. Modal opens with email input
3. User enters registered email
4. API call: `POST /api/auth/forgot-password`
5. System sends reset code via email
6. User enters received code + new password
7. API call: `POST /api/auth/verifyCode` (validate code)
8. API call: `POST /api/auth/reset-password`
9. Password updated successfully
10. User redirected to login page

**Error Handling:**
- Email not found → "Email non trouvé"
- Invalid code → "Code invalide"
- Code expired → "Code expiré"

### 4. Session Management Workflow

**Process Flow:**
1. **Token Storage:**
   - JWT stored in multiple localStorage keys for compatibility
   - Token also stored in sessionStorage as backup
   - User profile data cached in localStorage

2. **Route Protection:**
   - AuthGuard checks authentication status
   - Unauthenticated users redirected to `/auth`
   - Protected routes: `/profile/*`, `/doctor-dashboard`, `/patient-dashboard`

3. **Request Interception:**
   - AuthInterceptor adds Bearer token to API requests
   - Skips auth headers for public endpoints
   - Handles token refresh scenarios

4. **Session Restoration:**
   - On app reload, check localStorage for token
   - Verify token validity with backend
   - Restore user state if valid
   - Clear invalid/expired tokens

---

## Doctor-Specific Workflows

### 1. Doctor Dashboard Workflow

**Entry Point:** `/doctor-dashboard`

**Dashboard Features:**
- **Overview Section:**
  - Statistics display (patients, appointments, consultations)
  - Quick action buttons
  - Recent activity summary

- **Navigation Menu:**
  - Collapsible sidebar with sections:
    - Vue d'ensemble
    - Gestion des Disponibilités
    - Rendez-vous
    - Consultations
    - Prescriptions Médicales
    - Documents Médicaux
    - Messagerie
    - Mes Patients
    - Mon Profil
    - Paramètres

- **Real-time Updates:**
  - Badge notifications for pending items
  - Dynamic menu item updates
  - Live statistics refresh

### 2. Availability Management Workflow

#### Create Availability Workflow
**Entry Point:** Doctor Dashboard → "Gestion des Disponibilités" → "Créer des Disponibilités"

**Process Flow:**
1. Doctor selects create availability option
2. Form displays with fields:
   - Start Date (default: tomorrow)
   - Start Time (default: 09:00)
   - End Date (default: tomorrow)
   - End Time (default: 17:00)
   - Consultation Duration (15, 30, 45, 60, 90, 120 minutes)
3. System validates:
   - Dates must be in future
   - End time after start time
   - Valid time format
4. API call: `POST /api/availability/create`
5. Backend creates availability slots
6. Success message displayed
7. Option to create more or view existing availabilities

**Error Handling:**
- Invalid date/time → Field-specific validation errors
- Server errors → "Erreur lors de la création"
- Circular reference errors → Warning with success indication

#### View Availabilities Workflow
**Entry Point:** Doctor Dashboard → "Gestion des Disponibilités" → "Voir mes Disponibilités"

**Process Flow:**
1. Doctor selects view availabilities
2. API call: `GET /api/availability/doctor`
3. System displays list of availabilities:
   - Date and time range
   - Duration
   - Status (available/blocked)
   - Action buttons (block/delete)
4. Real-time updates when actions performed

#### Manage Availabilities Workflow

**Block Availability:**
1. Doctor clicks "Bloquer" on specific availability
2. API call: `PUT /api/availability/{id}/block`
3. Availability marked as blocked
4. List refreshed with updated status

**Delete Availability:**
1. Doctor clicks "Supprimer" on specific availability
2. Confirmation dialog appears
3. Upon confirmation: API call: `DELETE /api/availability/{id}`
4. Availability removed from list
5. Success message displayed

**Unblock Availability:**
1. Doctor clicks "Débloquer" on blocked availability
2. API call: `PUT /api/availability/{id}/unblock`
3. Availability marked as available
4. List refreshed with updated status

### 3. Appointment Management Workflow

#### View Appointments
**Process Flow:**
1. **Today's Appointments:**
   - Display current day appointments
   - Show patient details and time slots
   - Quick actions for each appointment

2. **Upcoming Appointments:**
   - List future appointments
   - Filter by date range
   - Patient contact information

3. **Appointment History:**
   - Past appointments archive
   - Search and filter capabilities
   - Export functionality

#### Appointment Actions
**Cancel Appointment:**
1. Doctor selects appointment to cancel
2. Confirmation dialog with reason field
3. API call: `DELETE /api/appointments/{id}`
4. Patient notified of cancellation
5. Availability slot becomes available

**Reschedule Appointment:**
1. Doctor selects appointment to reschedule
2. Shows available time slots
3. API call: `POST /api/appointments/{id}/reschedule`
4. Patient notified of new time
5. Original slot becomes available

### 4. Consultation Management Workflow

**Process Flow:**
1. **New Consultation:**
   - Doctor selects patient from appointment
   - Opens consultation form
   - Records symptoms, diagnosis, treatment
   - Saves consultation notes

2. **Consultation History:**
   - View past consultations for patient
   - Search by date, patient, or symptoms
   - Export consultation reports

3. **Prescription Management:**
   - Create prescriptions during consultation
   - Use prescription templates
   - Send prescriptions to pharmacy

---

## Patient-Specific Workflows

### 1. Patient Dashboard Workflow

**Entry Point:** `/patient-dashboard`

**Dashboard Features:**
- **Profile Overview:**
  - User profile information display
  - Quick profile edit access
  - Account status information

- **Appointments Summary:**
  - Upcoming appointments list
  - Next appointment highlight
  - Quick booking access

- **Quick Actions:**
  - "Prendre Rendez-vous" button
  - "Mes Rendez-vous" button
  - Profile management links

### 2. Appointment Booking Workflow

#### Search for Appointments
**Entry Point:** Patient Dashboard → "Prendre Rendez-vous" or `/appointments/search`

**Process Flow:**
1. Patient accesses appointment search page
2. Search form with criteria:
   - **Date**: Default to tomorrow, date picker
   - **Specialty**: Dropdown with medical specialties
   - **Doctor**: Optional specific doctor selection
   - **Preferred Times**: Morning/Afternoon/Evening
   - **Max Distance**: Location radius (if applicable)
3. System validates search criteria
4. API call: `POST /api/appointments/search`
5. Backend returns available slots with:
   - Doctor information (name, specialty, department)
   - Available time slots
   - Location details
   - Consultation fees
6. Patient views results in organized list
7. Filter and sort options available

#### Book Appointment
**Process Flow:**
1. Patient selects desired time slot
2. Booking form displays:
   - Appointment details summary
   - Notes field for special requests
   - Confirmation checkbox
3. Patient fills additional information
4. API call: `POST /api/appointments/book`
5. Backend creates appointment
6. Confirmation message displayed
7. Appointment added to patient's schedule
8. Doctor notified of new booking

**Error Handling:**
- Slot no longer available → "Créneau non disponible"
- Booking conflicts → "Conflit d'horaire"
- Validation errors → Field-specific messages

#### Manage Appointments
**Process Flow:**
1. **View Appointments:**
   - Patient accesses "Mes Rendez-vous"
   - Displays upcoming and past appointments
   - Shows appointment status and details

2. **Cancel Appointment:**
   - Patient selects appointment to cancel
   - Confirmation dialog appears
   - API call: `DELETE /api/appointments/{id}`
   - Doctor notified of cancellation
   - Refund processing (if applicable)

3. **Reschedule Appointment:**
   - Patient selects appointment to reschedule
   - Shows available alternative slots
   - API call: `POST /api/appointments/{id}/reschedule`
   - Doctor notified of change
   - Original slot becomes available

---

## Profile Management Workflows

### 1. View Profile Workflow

**Entry Point:** `/profile` (protected by AuthGuard)

**Process Flow:**
1. User navigates to profile page
2. System checks authentication status
3. API call: `GET /api/users/profile`
4. Backend returns complete profile data
5. Profile information displayed:
   - **Personal Information:**
     - Name, email, phone
     - Address (patients)
     - Date of birth (patients)
   - **Medical Information (Doctors):**
     - Specialization
     - License number
     - Department
     - Years of experience
   - **Account Information:**
     - Account creation date
     - Last login
     - Account status
6. Action buttons available:
   - Edit Profile
   - Change Password
   - Back to Dashboard

**Error Handling:**
- Profile not found → "Profil non trouvé"
- Permission denied → Redirect to login
- Network errors → "Erreur de connexion"

### 2. Edit Profile Workflow

**Entry Point:** `/profile/edit`

**Process Flow:**
1. User clicks "Modifier le Profil"
2. Edit form loads with current data
3. User modifies fields:
   - **Personal Information:**
     - First name, last name
     - Phone number
     - Address (patients)
   - **Medical Information (Doctors):**
     - Specialization
     - License number
     - Department
   - **Emergency Contact (Patients):**
     - Contact name, phone, relationship
4. System validates changes:
   - Required field validation
   - Format validation (phone, email)
   - Data consistency checks
5. API call: `PUT /api/users/profile`
6. Backend updates profile
7. Success message displayed
8. User redirected to profile view
9. Updated information reflected

**Error Handling:**
- Validation errors → Field-specific error messages
- Duplicate data → "Information déjà utilisée"
- Server errors → "Erreur lors de la mise à jour"

### 3. Change Password Workflow

**Entry Point:** `/profile/change-password`

**Process Flow:**
1. User clicks "Changer le Mot de Passe"
2. Password change form displays:
   - Current password field
   - New password field
   - Confirm new password field
3. System validates:
   - Current password is correct
   - New password meets requirements (min 8 chars, complexity)
   - New passwords match
4. API call: `POST /api/users/change-password`
5. Backend verifies current password
6. Password updated in database
7. Success message displayed
8. User automatically logged out
9. Redirected to login page with success message

**Error Handling:**
- Incorrect current password → "Mot de passe actuel incorrect"
- Weak new password → "Mot de passe trop faible"
- Password mismatch → "Les mots de passe ne correspondent pas"
- Server errors → "Erreur lors du changement"

---

## Public Pages Workflows

### 1. Home Page Workflow

**Entry Point:** `/home` (default route)

**Page Components:**
1. **Hero Section:**
   - Main call-to-action
   - "Prendre Rendez-vous" button
   - "En savoir plus" button
   - Background image/video

2. **About Section:**
   - Platform description
   - Mission and values
   - Statistics and achievements

3. **Services Section:**
   - Available medical services
   - Service categories
   - "Voir tous les services" link

4. **Testimonials Section:**
   - Patient reviews and ratings
   - Doctor testimonials
   - Success stories

5. **Partners Section:**
   - Partner hospitals and clinics
   - Medical institutions
   - Trust indicators

6. **Contact Section:**
   - Contact information
   - Contact form
   - Location details

### 2. Services Page Workflow

**Entry Point:** `/services`

**Process Flow:**
1. User navigates to services page
2. Services categorized and displayed:
   - **Medical Specialties:**
     - Cardiology, Dermatology, etc.
     - Doctor listings by specialty
   - **Service Types:**
     - Consultations
     - Emergency services
     - Preventive care
   - **Booking Options:**
     - Online booking
     - Phone booking
     - Walk-in appointments
3. Each service shows:
   - Description and details
   - Available doctors
   - Pricing information
   - Booking availability
4. Direct booking links to appointment search

---

## Navigation & Routing Workflows

### 1. Route Protection Workflow

**Process Flow:**
1. **Authentication Check:**
   - AuthGuard intercepts route navigation
   - Checks if user is authenticated
   - Validates JWT token if present

2. **Role-Based Routing:**
   - Authenticated users redirected to appropriate dashboard
   - Unauthenticated users redirected to `/auth`
   - Invalid tokens cleared and user logged out

3. **Protected Routes:**
   - `/profile/*` - Requires authentication
   - `/doctor-dashboard` - Requires doctor role
   - `/patient-dashboard` - Requires patient role
   - `/appointments/*` - Requires authentication

### 2. Header Navigation Workflow

**Process Flow:**
1. **Dynamic Navigation:**
   - Navigation items change based on authentication status
   - Authenticated users see profile and logout options
   - Unauthenticated users see login/register options

2. **User Profile Dropdown:**
   - User avatar and name display
   - Profile management links
   - Logout option
   - Role-specific quick actions

3. **Mobile Navigation:**
   - Responsive hamburger menu
   - Collapsible navigation items
   - Touch-friendly interface

### 3. Logout Workflow

**Process Flow:**
1. User clicks logout button
2. Confirmation dialog appears (optional)
3. API call: `POST /api/auth/logout`
4. Local storage cleared:
   - JWT tokens removed
   - User profile data cleared
   - Session data cleared
5. User state reset in AuthService
6. Redirect to home page or login page
7. Success message displayed

---

## Technical Architecture

### 1. Backend Integration

**API Configuration:**
- **Base URL:** `http://localhost:8080/api`
- **Authentication:** JWT-based with Bearer tokens
- **Content Type:** `application/json`
- **CORS:** Configured for frontend domain

**API Endpoints:**
```
Authentication:
- POST /api/auth/apiLogin
- POST /api/auth/register
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/verifyCode
- POST /api/auth/reset-password
- GET /api/auth/verify

User Management:
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/users/change-password

Availability Management:
- POST /api/availability/create
- GET /api/availability/doctor
- PUT /api/availability/{id}/block
- PUT /api/availability/{id}/unblock
- DELETE /api/availability/{id}

Appointment Management:
- POST /api/appointments/search
- POST /api/appointments/book
- GET /api/appointments/patient
- GET /api/appointments/doctor
- DELETE /api/appointments/{id}
- POST /api/appointments/{id}/reschedule
```

### 2. Data Models

**User Interface:**
```typescript
interface User {
  id?: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType?: 'patient' | 'doctor' | string;
  role?: string;
}
```

**Doctor Interface:**
```typescript
interface Doctor extends User {
  userType: 'doctor';
  specialization: string;
  licenseNumber: string;
  department: string;
  availableHours: string[];
}
```

**Patient Interface:**
```typescript
interface Patient extends User {
  userType: 'patient';
  dateOfBirth: Date;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
}
```

**Availability Interface:**
```typescript
interface Availability {
  id: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isBlocked: boolean;
  createdAt?: string;
  updatedAt?: string;
  slots?: TimeSlot[];
}
```

### 3. Security Features

**Authentication Security:**
- JWT token expiration handling
- Secure token storage in localStorage
- Automatic token refresh mechanism
- Role-based access control

**Data Protection:**
- Input validation and sanitization
- XSS prevention measures
- CSRF protection
- Secure password requirements

**Error Handling:**
- Comprehensive error catching
- User-friendly error messages
- Logging for debugging
- Graceful degradation

---

## User Experience Flows

### 1. New Doctor Onboarding Flow

**Complete Journey:**
1. **Registration:**
   - Doctor accesses registration page
   - Fills personal and professional information
   - Provides medical credentials (license, specialization)
   - Account created and verified

2. **First Login:**
   - Doctor logs in with new credentials
   - Redirected to doctor dashboard
   - Guided tour of dashboard features

3. **Setup Availability:**
   - Doctor creates initial availability slots
   - Sets consultation duration preferences
   - Configures working hours and days

4. **Profile Completion:**
   - Doctor completes profile information
   - Uploads professional photo
   - Adds detailed medical credentials

5. **Ready for Patients:**
   - Doctor's profile visible to patients
   - Availability slots bookable
   - Notification system activated

### 2. New Patient Onboarding Flow

**Complete Journey:**
1. **Registration:**
   - Patient accesses registration page
   - Fills personal information
   - Provides contact and emergency details
   - Account created and verified

2. **First Login:**
   - Patient logs in with new credentials
   - Redirected to patient dashboard
   - Overview of available services

3. **Profile Setup:**
   - Patient completes medical history
   - Adds insurance information
   - Sets notification preferences

4. **First Appointment:**
   - Patient searches for suitable doctor
   - Books first appointment
   - Receives confirmation and reminders

5. **Ongoing Usage:**
   - Patient manages appointments
   - Accesses medical records
   - Communicates with doctors

### 3. Appointment Lifecycle Flow

**Complete Process:**
1. **Doctor Creates Availability:**
   - Doctor sets available time slots
   - Specifies consultation duration
   - Updates schedule as needed

2. **Patient Searches and Books:**
   - Patient searches for appointments
   - Filters by specialty, date, location
   - Selects preferred time slot
   - Provides appointment notes

3. **Appointment Confirmation:**
   - Both parties receive confirmation
   - Reminder notifications scheduled
   - Calendar integration available

4. **Pre-Appointment:**
   - Reminder notifications sent
   - Patient can reschedule if needed
   - Doctor can prepare consultation notes

5. **During Appointment:**
   - Virtual consultation (if applicable)
   - In-person consultation
   - Real-time communication

6. **Post-Appointment:**
   - Consultation notes recorded
   - Prescriptions issued
   - Follow-up appointments scheduled
   - Patient feedback collected

### 4. Emergency and Edge Case Flows

**Emergency Scenarios:**
1. **System Outage:**
   - Graceful error handling
   - Offline mode capabilities
   - Data synchronization on recovery

2. **Appointment Conflicts:**
   - Automatic conflict detection
   - Alternative slot suggestions
   - Manual resolution options

3. **User Account Issues:**
   - Account lockout handling
   - Password reset flow
   - Account recovery process

4. **Payment Issues:**
   - Payment failure handling
   - Refund processing
   - Alternative payment methods

---

## Workflow Integration Points

### 1. Cross-Workflow Dependencies
- Authentication required for all protected workflows
- Profile completion affects available features
- Appointment booking depends on doctor availability
- Notification system integrates with all major workflows

### 2. Data Synchronization
- Real-time updates across user sessions
- Automatic refresh of dashboard data
- Conflict resolution for simultaneous edits
- Offline data caching and sync

### 3. Performance Optimization
- Lazy loading of components
- Efficient API call patterns
- Caching strategies for frequently accessed data
- Progressive loading for large datasets

---

## New Patient Appointment Booking Workflow (Without Account)

### Overview
This workflow describes the complete process for a new patient (without an existing account) to book an appointment with a doctor, including both virtual (online) and on-site appointment options. The process includes account creation during the booking flow.

### Entry Point
- **Public Access**: User visits the Teranga platform without authentication
- **Entry Routes**: 
  - Home page (`/home`) → "Prendre Rendez-vous" button
  - Services page (`/services`) → "Réserver maintenant" button
  - Direct navigation to `/appointments/search`

---

### Detailed Workflow Steps

#### **Phase 1: Initial Access and Search**

**Step 1: Landing on Appointment Search**
1. **Page Load**: User accesses `/appointments/search`
2. **Authentication Check**: System detects unauthenticated user
3. **Guest Mode Activation**: Platform operates in guest mode with limited features
4. **Search Interface Display**: Appointment search form is presented

**Step 2: Appointment Search Criteria**
1. **Search Form Fields**:
   ```
   - Date: Date picker (default: tomorrow)
   - Specialty: Dropdown selection
     * Cardiologie
     * Dermatologie
     * Endocrinologie
     * Gastro-entérologie
     * Gynécologie
     * Neurologie
     * Oncologie
     * Ophtalmologie
     * Orthopédie
     * Pédiatrie
     * Psychiatrie
     * Radiologie
     * Rhumatologie
     * Urologie
     * Médecine générale
   - Doctor Name: Optional text input
   - Appointment Type: Radio buttons
     * Consultation en ligne (Virtual)
     * Consultation sur site (On-site)
   - Preferred Time: Checkboxes
     * Matin (08:00-12:00)
     * Après-midi (12:00-17:00)
     * Soir (17:00-20:00)
   - Location: For on-site appointments
     * Ville/Région selection
     * Distance maximale (km)
   ```

2. **Form Validation**:
   - Required fields validation
   - Date must be in future
   - Time slot availability check

**Step 3: Search Execution**
1. **API Call**: `POST /api/appointments/search-public`
   ```json
   {
     "date": "2024-01-15",
     "specialty": "Cardiologie",
     "appointmentType": "virtual", // or "onsite"
     "preferredTimes": ["morning", "afternoon"],
     "location": "Dakar",
     "maxDistance": 10
   }
   ```

2. **Response Processing**:
   ```json
   {
     "availableSlots": [
       {
         "id": "slot_123",
         "doctorId": "doc_456",
         "doctorName": "Dr. Marie Diop",
         "specialty": "Cardiologie",
         "appointmentType": "virtual",
         "dateTime": "2024-01-15T09:00:00",
         "duration": 30,
         "consultationFee": 15000,
         "platform": "Zoom", // for virtual appointments
         "location": "Clinique du Plateau", // for on-site
         "rating": 4.8,
         "availableSlots": 3
       }
     ]
   }
   ```

---

#### **Phase 2: Slot Selection and Account Creation**

**Step 4: Available Slots Display**
1. **Results Presentation**:
   - Grid/list view of available appointments
   - Each slot shows:
     - Doctor information (name, photo, specialty, rating)
     - Date and time
     - Appointment type (Virtual/On-site)
     - Consultation fee
     - Available slots remaining
     - "Réserver" button

2. **Filtering Options**:
   - Sort by: Date, Time, Price, Rating
   - Filter by: Appointment type, Price range, Doctor rating

**Step 5: Slot Selection**
1. **User Action**: Patient clicks "Réserver" on desired slot
2. **Authentication Prompt**: Modal appears with options:
   ```
   "Pour réserver un rendez-vous, vous devez avoir un compte"
   
   Options:
   □ J'ai déjà un compte (Login)
   □ Créer un nouveau compte
   ```

3. **Account Creation Flow Initiated**:
   - User selects "Créer un nouveau compte"
   - Registration form appears in modal/side panel

**Step 6: Account Registration During Booking**
1. **Registration Form Fields**:
   ```typescript
   {
     // Personal Information
     firstName: string (required),
     lastName: string (required),
     email: string (required, validated),
     phone: string (required, format: +221 XX XXX XX XX),
     dateOfBirth: Date (required),
     gender: 'M' | 'F' (required),
     
     // Contact Information
     address: string (required),
     city: string (required),
     emergencyContactName: string (required),
     emergencyContactPhone: string (required),
     emergencyContactRelationship: string (required),
     
     // Account Security
     password: string (min 8 chars, complexity),
     confirmPassword: string (must match),
     
     // Medical Information
     medicalHistory: string[] (optional),
     allergies: string[] (optional),
     currentMedications: string[] (optional),
     insuranceProvider: string (optional),
     insuranceNumber: string (optional),
     
     // Preferences
     preferredLanguage: 'fr' | 'en',
     notificationPreferences: {
       email: boolean,
       sms: boolean,
       whatsapp: boolean
     },
     
     // Legal
     termsAccepted: boolean (required),
     privacyPolicyAccepted: boolean (required),
     marketingConsent: boolean (optional)
   }
   ```

2. **Form Validation**:
   - Real-time field validation
   - Email uniqueness check
   - Phone number format validation
   - Password strength indicator
   - Terms acceptance requirement

**Step 7: Account Creation**
1. **API Call**: `POST /api/auth/register`
   ```json
   {
     "firstName": "Aminata",
     "lastName": "Fall",
     "email": "aminata.fall@email.com",
     "phone": "+221 77 123 45 67",
     "password": "SecurePass123!",
     "confirmPassword": "SecurePass123!",
     "userType": "patient",
     "dateOfBirth": "1990-05-15",
     "address": "Rue de la République, Dakar",
     "emergencyContactName": "Moussa Fall",
     "emergencyContactPhone": "+221 77 987 65 43",
     "emergencyContactRelationship": "Époux",
     "medicalHistory": ["Hypertension"],
     "allergies": ["Pénicilline"],
     "termsAccepted": true,
     "privacyPolicyAccepted": true
   }
   ```

2. **Account Creation Response**:
   ```json
   {
     "success": true,
     "user": {
       "id": "patient_789",
       "email": "aminata.fall@email.com",
       "firstName": "Aminata",
       "lastName": "Fall",
       "userType": "PATIENT",
       "isActive": true
     },
     "token": "jwt_token_here"
   }
   ```

3. **Automatic Login**: User is automatically logged in after registration

---

#### **Phase 3: Appointment Booking Completion**

**Step 8: Appointment Details Confirmation**
1. **Booking Summary Display**:
   ```
   RÉSUMÉ DU RENDEZ-VOUS
   
   Médecin: Dr. Marie Diop
   Spécialité: Cardiologie
   Date: 15 Janvier 2024
   Heure: 09:00 - 09:30
   Type: Consultation en ligne
   Plateforme: Zoom
   Tarif: 15,000 FCFA
   
   Patient: Aminata Fall
   Email: aminata.fall@email.com
   Téléphone: +221 77 123 45 67
   ```

2. **Additional Information Collection**:
   ```typescript
   {
     // Appointment-specific details
     reasonForVisit: string (required),
     symptoms: string (optional),
     urgency: 'low' | 'medium' | 'high',
     preferredLanguage: 'fr' | 'en',
     
     // For virtual appointments
     technicalRequirements: {
       hasStableInternet: boolean,
       hasWebcam: boolean,
       hasMicrophone: boolean,
       platformPreference: 'Zoom' | 'Google Meet' | 'Teams'
     },
     
     // For on-site appointments
     transportationMethod: 'personal' | 'public' | 'taxi',
     accessibilityNeeds: string (optional),
     
     // Communication preferences
     reminderMethod: 'email' | 'sms' | 'both',
     reminderTiming: '24h' | '2h' | '30min'
   }
   ```

**Step 9: Payment Processing**
1. **Payment Options Display**:
   ```
   MODES DE PAIEMENT
   
   □ Paiement en ligne (Carte bancaire)
     - Visa, Mastercard, Orange Money, MTN Money
   
   □ Paiement à la consultation
     - Espèces, Carte bancaire
   
   □ Assurance maladie
     - CNAS, IPM, Autres
   ```

2. **Online Payment Flow** (if selected):
   ```typescript
   {
     paymentMethod: 'card' | 'mobile_money' | 'bank_transfer',
     amount: 15000,
     currency: 'XOF',
     paymentProvider: 'stripe' | 'paystack' | 'flutterwave',
     
     // For card payments
     cardDetails: {
       number: string,
       expiryMonth: number,
       expiryYear: number,
       cvv: string,
       cardholderName: string
     },
     
     // For mobile money
     mobileMoneyDetails: {
       provider: 'orange_money' | 'mtn_money' | 'free_money',
       phoneNumber: string,
       pin: string
     }
   }
   ```

3. **Payment API Call**: `POST /api/payments/process`
   ```json
   {
     "appointmentId": "temp_appointment_123",
     "amount": 15000,
     "currency": "XOF",
     "paymentMethod": "card",
     "cardToken": "tok_1234567890",
     "metadata": {
       "patientId": "patient_789",
       "doctorId": "doc_456",
       "appointmentType": "virtual"
     }
   }
   ```

**Step 10: Final Booking Confirmation**
1. **Booking API Call**: `POST /api/appointments/book`
   ```json
   {
     "availabilityId": "slot_123",
     "patientId": "patient_789",
     "appointmentType": "virtual",
     "reasonForVisit": "Contrôle cardiaque de routine",
     "symptoms": "Palpitations occasionnelles",
     "urgency": "medium",
     "preferredLanguage": "fr",
     "technicalRequirements": {
       "hasStableInternet": true,
       "hasWebcam": true,
       "hasMicrophone": true,
       "platformPreference": "Zoom"
     },
     "reminderPreferences": {
       "method": "both",
       "timing": "24h"
     },
     "paymentId": "payment_456"
   }
   ```

2. **Booking Confirmation Response**:
   ```json
   {
     "success": true,
     "appointment": {
       "id": "appointment_789",
       "patientId": "patient_789",
       "doctorId": "doc_456",
       "dateTime": "2024-01-15T09:00:00",
       "duration": 30,
       "type": "virtual",
       "status": "confirmed",
       "meetingLink": "https://zoom.us/j/123456789",
       "meetingId": "123 456 789",
       "passcode": "Teranga2024",
       "consultationFee": 15000,
       "paymentStatus": "paid"
     },
     "confirmationNumber": "TER-2024-001-789"
   }
   ```

**Step 11: Post-Booking Actions**
1. **Confirmation Page Display**:
   ```
   ✅ RENDEZ-VOUS CONFIRMÉ
   
   Numéro de confirmation: TER-2024-001-789
   Date: 15 Janvier 2024 à 09:00
   Médecin: Dr. Marie Diop
   
   Pour consultation en ligne:
   Lien Zoom: https://zoom.us/j/123456789
   ID: 123 456 789
   Code: Teranga2024
   
   Actions:
   - Ajouter au calendrier
   - Recevoir rappel par SMS/Email
   - Annuler le rendez-vous
   - Modifier le rendez-vous
   ```

2. **Automatic Actions Triggered**:
   - **Email Confirmation**: Sent to patient's email
   - **SMS Notification**: Sent to patient's phone
   - **Calendar Invite**: iCal file generated
   - **Doctor Notification**: Doctor notified of new appointment
   - **Reminder Scheduling**: Automated reminders set up

3. **User Redirected**: To patient dashboard (`/patient-dashboard`)

---

#### **Phase 4: Pre-Appointment Management**

**Step 12: Appointment Preparation**
1. **Virtual Appointment Setup**:
   ```
   PRÉPARATION CONSULTATION EN LIGNE
   
   Vérifications techniques:
   □ Connexion internet stable
   □ Webcam fonctionnelle
   □ Microphone activé
   □ Navigateur à jour
   
   Test de connexion: [Tester maintenant]
   
   Instructions:
   1. Cliquez sur le lien 5 minutes avant l'heure
   2. Utilisez votre nom complet
   3. Activez caméra et microphone
   4. Préparez vos questions
   ```

2. **On-site Appointment Instructions**:
   ```
   INSTRUCTIONS CONSULTATION SUR SITE
   
   Adresse: Clinique du Plateau, Rue de la République
   Arrivée recommandée: 15 minutes avant l'heure
   
   À apporter:
   □ Pièce d'identité
   □ Carte d'assurance maladie (si applicable)
   □ Liste des médicaments actuels
   □ Résultats d'examens récents
   
   Parking: Disponible sur place
   Transport public: Ligne 15, arrêt "Plateau"
   ```

**Step 13: Reminder System**
1. **Automated Reminders**:
   - **24h before**: Email + SMS reminder
   - **2h before**: SMS reminder
   - **30min before**: Final SMS reminder

2. **Reminder Content**:
   ```
   RAPPEL RENDEZ-VOUS
   
   Bonjour Aminata,
   
   Vous avez un rendez-vous avec Dr. Marie Diop
   Date: 15 Janvier 2024 à 09:00
   Type: Consultation en ligne
   
   Lien Zoom: https://zoom.us/j/123456789
   
   Pour annuler: [Lien d'annulation]
   ```

---

### Error Handling and Edge Cases

#### **Registration Errors**
- **Email Already Exists**: Prompt to login instead
- **Weak Password**: Show password requirements
- **Invalid Phone**: Format validation with examples
- **Terms Not Accepted**: Highlight required checkboxes

#### **Payment Errors**
- **Payment Failed**: Retry options, alternative payment methods
- **Insufficient Funds**: Payment method suggestions
- **Network Issues**: Offline payment option (pay at appointment)

#### **Booking Conflicts**
- **Slot No Longer Available**: Show alternative slots
- **System Overload**: Queue system with estimated wait time
- **Doctor Unavailable**: Suggest alternative doctors

#### **Technical Issues**
- **Platform Connectivity**: Fallback communication methods
- **Browser Compatibility**: Supported browser recommendations
- **Device Issues**: Mobile vs desktop optimization

---

### Success Metrics and Analytics

#### **Conversion Tracking**
- **Search to Selection**: % of users who select a slot
- **Selection to Registration**: % who complete account creation
- **Registration to Booking**: % who complete booking process
- **Booking to Attendance**: % who attend their appointment

#### **User Experience Metrics**
- **Time to Complete**: Average booking completion time
- **Drop-off Points**: Where users abandon the process
- **Error Rates**: Common failure points
- **User Satisfaction**: Post-booking feedback scores

---

### Integration Points

#### **Third-Party Services**
- **Payment Gateways**: Stripe, Paystack, Flutterwave
- **Video Platforms**: Zoom, Google Meet, Microsoft Teams
- **Communication**: Twilio (SMS), SendGrid (Email)
- **Calendar**: Google Calendar, Outlook integration
- **Maps**: Google Maps for location services

#### **Internal Systems**
- **Doctor Scheduling**: Real-time availability updates
- **Notification System**: Multi-channel communication
- **Analytics Platform**: User behavior tracking
- **Customer Support**: Live chat integration

---

This comprehensive workflow ensures that new patients can seamlessly book appointments while creating their accounts, with full support for both virtual and on-site consultations, complete with payment processing and automated reminder systems.

---

This comprehensive workflow documentation covers all major user journeys and technical processes in the Teranga medical platform, providing a complete understanding of the application's functionality and user experience.
