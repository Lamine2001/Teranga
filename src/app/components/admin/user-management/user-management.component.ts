import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementService } from '../../../services/user-management.service';
import { UserManagement } from '../../../interfaces/user-management.interface';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent, NotificationComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  activeTab: 'pending' | 'active' | 'disabled' = 'pending';
  
  pendingCount = 0;
  activeCount = 0;
  disabledCount = 0;
  totalCount = 0;

  pendingUsers: UserManagement[] = [];
  activeUsers: UserManagement[] = [];
  disabledUsers: UserManagement[] = [];

  isLoading = false;
  error = '';

  // Modal de confirmation
  showConfirmDialog = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  confirmAction: (() => void) | null = null;

  // Notification
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'info';
  private notificationTimeout: any;

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.loadPendingUsers();
    this.loadActiveUsers();
    this.loadDisabledUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = '';

    switch (this.activeTab) {
      case 'pending':
        this.loadPendingUsers();
        break;
      case 'active':
        this.loadActiveUsers();
        break;
      case 'disabled':
        this.loadDisabledUsers();
        break;
    }
  }

  loadPendingUsers(): void {
    this.isLoading = true;
    this.userManagementService.getPendingUsers().subscribe({
      next: (response) => {
        this.pendingUsers = response.users;
        this.pendingCount = response.count;
        this.updateTotalCount();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending users:', error);
        this.error = 'Erreur lors du chargement des utilisateurs en attente';
        this.isLoading = false;
      }
    });
  }

  loadActiveUsers(): void {
    this.isLoading = true;
    this.userManagementService.getActiveUsers().subscribe({
      next: (response) => {
        this.activeUsers = response.users;
        this.activeCount = response.count;
        this.updateTotalCount();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading active users:', error);
        this.error = 'Erreur lors du chargement des utilisateurs actifs';
        this.isLoading = false;
      }
    });
  }

  loadDisabledUsers(): void {
    this.isLoading = true;
    this.userManagementService.getDisabledUsers().subscribe({
      next: (response) => {
        this.disabledUsers = response.users;
        this.disabledCount = response.count;
        this.updateTotalCount();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading disabled users:', error);
        this.error = 'Erreur lors du chargement des utilisateurs désactivés';
        this.isLoading = false;
      }
    });
  }

  updateTotalCount(): void {
    this.totalCount = this.pendingCount + this.activeCount + this.disabledCount;
  }

  switchTab(tab: 'pending' | 'active' | 'disabled'): void {
    this.activeTab = tab;
    this.error = '';
    this.isLoading = false;
  }

  activateUser(user: UserManagement): void {
    this.confirmDialogTitle = 'Activer le compte';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir activer le compte de ${user.firstName} ${user.lastName} ?`;
    this.confirmAction = () => this.performActivateUser(user.email);
    this.showConfirmDialog = true;
  }

  private performActivateUser(email: string): void {
    this.userManagementService.activateUser(email).subscribe({
      next: () => {
        this.showNotificationMessage('Compte activé avec succès', 'success');
        this.loadAllUsers();
      },
      error: (error) => {
        console.error('Error activating user:', error);
        this.showNotificationMessage('Erreur lors de l\'activation du compte', 'error');
      }
    });
  }

  disableUser(user: UserManagement): void {
    this.confirmDialogTitle = 'Désactiver le compte';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir désactiver le compte de ${user.firstName} ${user.lastName} ?`;
    this.confirmAction = () => this.performDisableUser(user.email);
    this.showConfirmDialog = true;
  }

  private performDisableUser(email: string): void {
    this.userManagementService.disableUser(email).subscribe({
      next: () => {
        this.showNotificationMessage('Compte désactivé avec succès', 'success');
        this.loadAllUsers();
      },
      error: (error) => {
        console.error('Error disabling user:', error);
        this.showNotificationMessage('Erreur lors de la désactivation du compte', 'error');
      }
    });
  }

  deleteUser(user: UserManagement): void {
    this.confirmDialogTitle = 'Supprimer le compte';
    this.confirmDialogMessage = `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${user.firstName} ${user.lastName} ? Cette action est irréversible.`;
    this.confirmAction = () => this.performDeleteUser(user.userId);
    this.showConfirmDialog = true;
  }

  private performDeleteUser(userId: string): void {
    this.userManagementService.deleteUser(userId).subscribe({
      next: () => {
        this.showNotificationMessage('Compte supprimé avec succès', 'success');
        this.loadAllUsers();
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showNotificationMessage('Erreur lors de la suppression du compte', 'error');
      }
    });
  }

  onConfirmAction(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.showConfirmDialog = false;
      this.confirmAction = null;
    }
  }

  onCancelDialog(): void {
    this.showConfirmDialog = false;
    this.confirmAction = null;
  }

  private showNotificationMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  onNotificationClosed(): void {
    this.showNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  getDateDisplay(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'PATIENT': 'Patient',
      'DOCTOR': 'Médecin',
      'ADMIN': 'Administrateur'
    };
    return roleLabels[role] || role;
  }
}
