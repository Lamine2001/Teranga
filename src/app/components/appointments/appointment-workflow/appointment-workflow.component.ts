import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

export interface WorkflowState {
  consultationMode?: 'onsite' | 'video';
  patientType?: 'nouveau' | 'existant';
  specialty?: string;
  professionalId?: number;
  selectedSlot?: any;
  userData?: any;
}

@Component({
  selector: 'app-appointment-workflow',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './appointment-workflow.component.html',
  styleUrls: ['./appointment-workflow.component.scss']
})
export class AppointmentWorkflowComponent implements OnInit {
  
  currentStep = 1;
  totalSteps = 7;
  workflowState: WorkflowState = {};

  steps = [
    { id: 1, name: 'Mode de consultation', route: '/book-appointment/mode', completed: false },
    { id: 2, name: 'Type de patient', route: '/book-appointment/patient-type', completed: false },
    { id: 3, name: 'Spécialité', route: '/book-appointment/specialty', completed: false },
    { id: 4, name: 'Professionnel', route: '/book-appointment/professional', completed: false },
    { id: 5, name: 'Disponibilités', route: '/book-appointment/availability', completed: false },
    { id: 6, name: 'Informations', route: '/book-appointment/information', completed: false },
    { id: 7, name: 'Confirmation', route: '/book-appointment/confirmation', completed: false }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load workflow state from localStorage if available
    this.loadWorkflowState();
    
    // Determine current step based on URL or state
    this.determineCurrentStep();
  }

  private loadWorkflowState(): void {
    const savedState = localStorage.getItem('appointment-workflow-state');
    if (savedState) {
      try {
        this.workflowState = JSON.parse(savedState);
      } catch (error) {
        console.error('Error loading workflow state:', error);
        this.workflowState = {};
      }
    }
  }

  private saveWorkflowState(): void {
    localStorage.setItem('appointment-workflow-state', JSON.stringify(this.workflowState));
  }

  private determineCurrentStep(): void {
    const currentUrl = this.router.url;
    
    if (currentUrl.includes('/mode')) {
      this.currentStep = 1;
    } else if (currentUrl.includes('/patient-type')) {
      this.currentStep = 2;
    } else if (currentUrl.includes('/specialty')) {
      this.currentStep = 3;
    } else if (currentUrl.includes('/professional')) {
      this.currentStep = 4;
    } else if (currentUrl.includes('/availability')) {
      this.currentStep = 5;
    } else if (currentUrl.includes('/information')) {
      this.currentStep = 6;
    } else if (currentUrl.includes('/confirmation')) {
      this.currentStep = 7;
    }
  }

  updateWorkflowState(updates: Partial<WorkflowState>): void {
    this.workflowState = { ...this.workflowState, ...updates };
    this.saveWorkflowState();
    
    // Mark completed steps
    this.markCompletedSteps();
  }

  private markCompletedSteps(): void {
    if (this.workflowState.consultationMode) {
      this.steps[0].completed = true;
    }
    if (this.workflowState.patientType) {
      this.steps[1].completed = true;
    }
    if (this.workflowState.specialty) {
      this.steps[2].completed = true;
    }
    if (this.workflowState.professionalId) {
      this.steps[3].completed = true;
    }
    if (this.workflowState.selectedSlot) {
      this.steps[4].completed = true;
    }
    if (this.workflowState.userData) {
      this.steps[5].completed = true;
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getStepClass(step: any): string {
    let classes = 'step';
    
    if (step.id === this.currentStep) {
      classes += ' current';
    } else if (step.completed) {
      classes += ' completed';
    } else if (step.id < this.currentStep) {
      classes += ' accessible';
    }
    
    return classes;
  }

  navigateToStep(step: any): void {
    // Only allow navigation to completed steps or the next step
    if (step.completed || step.id <= this.currentStep + 1) {
      this.router.navigate([step.route]);
    }
  }

  resetWorkflow(): void {
    this.workflowState = {};
    localStorage.removeItem('appointment-workflow-state');
    this.currentStep = 1;
    this.steps.forEach(step => step.completed = false);
    this.router.navigate(['/book-appointment/mode']);
  }

  getWorkflowSummary(): string {
    const parts = [];
    
    if (this.workflowState.consultationMode) {
      parts.push(this.workflowState.consultationMode === 'onsite' ? 'onsite' : 'Vidéo');
    }
    
    if (this.workflowState.patientType) {
      parts.push(this.workflowState.patientType === 'nouveau' ? 'Nouveau patient' : 'Patient existant');
    }
    
    if (this.workflowState.specialty) {
      parts.push(this.workflowState.specialty);
    }
    
    return parts.join(' • ');
  }
}
