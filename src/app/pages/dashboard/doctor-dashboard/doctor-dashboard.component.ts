import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../interfaces/user';
import { CreateAvailabilityComponent } from '../../../components/availability/create-availability/create-availability.component';
import { ViewAvailabilityComponent } from '../../../components/availability/view-availability/view-availability.component';

interface DoctorProfile extends User {
  speciality?: string;
  licenseNumber?: string;
  hospital?: string;
  yearsOfExperience?: number;
  qualifications?: string[];
  consultationFee?: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  subItems?: SubMenuItem[];
  expanded?: boolean;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedConsultations: number;
  unreadMessages: number;
  pendingPrescriptions: number;
}

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    CreateAvailabilityComponent,
    ViewAvailabilityComponent
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  doctor: DoctorProfile | null = null;
  activeSection: string = 'overview';
  activeSubSection: string = '';
  isSidebarCollapsed: boolean = false;

  // Dashboard statistics
  stats: DashboardStats = {
    totalPatients: 127,
    todayAppointments: 8,
    pendingAppointments: 3,
    completedConsultations: 450,
    unreadMessages: 5,
    pendingPrescriptions: 2
  };

  // Menu structure
  menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: 'fas fa-tachometer-alt'
    },
    {
      id: 'availability',
      label: 'Gestion des Disponibilités',
      icon: 'fas fa-calendar-check',
      expanded: false,
      subItems: [
        { id: 'create-availability', label: 'Créer des Disponibilités', icon: 'fas fa-plus-circle' },
        { id: 'view-availability', label: 'Voir mes Disponibilités', icon: 'fas fa-eye' },
        { id: 'block-availability', label: 'Bloquer des Créneaux', icon: 'fas fa-ban' },
        { id: 'delete-availability', label: 'Supprimer des Disponibilités', icon: 'fas fa-trash' }
      ]
    },
    {
      id: 'appointments',
      label: 'Rendez-vous',
      icon: 'fas fa-calendar-alt',
      badge: this.stats.pendingAppointments,
      expanded: false,
      subItems: [
        { id: 'today-appointments', label: 'Rendez-vous du Jour', badge: this.stats.todayAppointments },
        { id: 'upcoming-appointments', label: 'Rendez-vous à Venir' },
        { id: 'appointment-history', label: 'Historique des Rendez-vous' },
        { id: 'cancel-appointment', label: 'Annuler un Rendez-vous' }
      ]
    },
    {
      id: 'consultations',
      label: 'Consultations',
      icon: 'fas fa-stethoscope',
      expanded: false,
      subItems: [
        { id: 'new-consultation', label: 'Nouvelle Consultation', icon: 'fas fa-plus' },
        { id: 'consultation-history', label: 'Historique des Consultations', icon: 'fas fa-history' },
        { id: 'consultation-notes', label: 'Notes de Consultation', icon: 'fas fa-notes-medical' }
      ]
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions Médicales',
      icon: 'fas fa-prescription',
      badge: this.stats.pendingPrescriptions,
      expanded: false,
      subItems: [
        { id: 'create-prescription', label: 'Créer une Prescription', icon: 'fas fa-file-prescription' },
        { id: 'prescription-templates', label: 'Modèles de Prescription', icon: 'fas fa-clipboard-list' },
        { id: 'prescription-history', label: 'Historique des Prescriptions', icon: 'fas fa-archive' }
      ]
    },
    {
      id: 'medical-records',
      label: 'Documents Médicaux',
      icon: 'fas fa-file-medical',
      expanded: false,
      subItems: [
        { id: 'upload-documents', label: 'Télécharger des Documents', icon: 'fas fa-upload' },
        { id: 'view-documents', label: 'Consulter les Documents', icon: 'fas fa-folder-open' },
        { id: 'share-documents', label: 'Partager des Documents', icon: 'fas fa-share-alt' }
      ]
    },
    {
      id: 'messaging',
      label: 'Messagerie',
      icon: 'fas fa-comments',
      badge: this.stats.unreadMessages,
      expanded: false,
      subItems: [
        { id: 'inbox', label: 'Boîte de Réception', badge: this.stats.unreadMessages },
        { id: 'sent-messages', label: 'Messages Envoyés' },
        { id: 'new-message', label: 'Nouveau Message', icon: 'fas fa-pen' }
      ]
    },
    {
      id: 'patients',
      label: 'Mes Patients',
      icon: 'fas fa-users',
      expanded: false,
      subItems: [
        { id: 'patient-list', label: 'Liste des Patients' },
        { id: 'patient-search', label: 'Rechercher un Patient', icon: 'fas fa-search' },
        { id: 'patient-records', label: 'Dossiers Patients' }
      ]
    },
    {
      id: 'profile',
      label: 'Mon Profil',
      icon: 'fas fa-user-md'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'fas fa-cog'
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadDoctorProfile();
    this.updateMenuBadges();
  }

  loadDoctorProfile() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.doctor = {
        ...user,
        speciality: 'Médecine Générale',
        licenseNumber: 'MED-2024-001',
        hospital: 'Hôpital Principal de Dakar',
        yearsOfExperience: 5,
        qualifications: ['Doctorat en Médecine', 'Spécialisation en Médecine Interne'],
        consultationFee: 15000
      } as DoctorProfile;
    }
  }

  updateMenuBadges() {
    // Update badges dynamically
    const appointmentsItem = this.menuItems.find(item => item.id === 'appointments');
    if (appointmentsItem) {
      appointmentsItem.badge = this.stats.pendingAppointments;
    }

    const messagingItem = this.menuItems.find(item => item.id === 'messaging');
    if (messagingItem) {
      messagingItem.badge = this.stats.unreadMessages;
    }

    const prescriptionsItem = this.menuItems.find(item => item.id === 'prescriptions');
    if (prescriptionsItem) {
      prescriptionsItem.badge = this.stats.pendingPrescriptions;
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleMenuItem(item: MenuItem) {
    if (item.subItems && item.subItems.length > 0) {
      item.expanded = !item.expanded;
    } else {
      this.selectMenuItem(item.id);
    }
  }

  selectMenuItem(sectionId: string, subSectionId?: string) {
    this.activeSection = sectionId;
    this.activeSubSection = subSectionId || '';
    
    // Close all expanded menus except the current one
    this.menuItems.forEach(item => {
      if (item.id !== sectionId) {
        item.expanded = false;
      }
    });
  }

  isActiveSection(sectionId: string, subSectionId?: string): boolean {
    if (subSectionId) {
      return this.activeSection === sectionId && this.activeSubSection === subSectionId;
    }
    return this.activeSection === sectionId && !this.activeSubSection;
  }

  getSectionTitle(): string {
    const mainItem = this.menuItems.find(item => item.id === this.activeSection);
    if (!mainItem) return 'Tableau de Bord';

    if (this.activeSubSection && mainItem.subItems) {
      const subItem = mainItem.subItems.find(sub => sub.id === this.activeSubSection);
      return subItem ? subItem.label : mainItem.label;
    }

    return mainItem.label;
  }

  // Updated placeholder methods with proper implementations
  handleCreateAvailability() {
    this.activeSubSection = 'create-availability';
  }

  handleDeleteAvailability() {
    this.activeSubSection = 'delete-availability';
  }

  handleGetDoctorAvailability() {
    this.activeSubSection = 'view-availability';
  }

  handleBlockAvailability() {
    this.activeSubSection = 'block-availability';
  }

  onAvailabilityCreated() {
    // Refresh or navigate to view availabilities
    this.activeSubSection = 'view-availability';
  }

  handleGetDoctorAppointments() {
    console.log('Getting doctor appointments...');
    // TODO: Implement get doctor appointments
  }

  handleCancelAppointment() {
    console.log('Canceling appointment...');
    // TODO: Implement cancel appointment
  }
}
