/**
 * Video Consultation Component
 * Handles video consultations using Jitsi Meet
 */
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation, StartConsultationRequest } from '../../../models/consultation.model';
import { ConsultationNotesComponent } from '../consultation-notes/consultation-notes.component';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-video-consultation',
  standalone: true,
  imports: [CommonModule, ConsultationNotesComponent],
  templateUrl: './video-consultation.component.html',
  styleUrls: ['./video-consultation.component.scss']
})
export class VideoConsultationComponent implements OnInit, OnDestroy {
  consultation: Consultation | null = null;
  appointmentId: string = '';
  isLoading = true;
  errorMessage = '';
  
  // Video call state
  jitsiApi: any = null;
  isCallActive = false;
  isMuted = false;
  isVideoOff = false;
  
  // Consultation notes panel
  showNotesPanel = false;
  
  // Call statistics
  callDuration = 0;
  callStartTime?: Date;
  private durationInterval?: any;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private consultationService: ConsultationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.appointmentId = params['id'];
      this.initializeConsultation();
    });
  }

  ngOnDestroy(): void {
    this.endCall();
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }

  initializeConsultation(): void {
    this.isLoading = true;

    // Start consultation
    const request: StartConsultationRequest = {
      appointmentId: this.appointmentId,
      consultationType: 'virtual'
    };

    this.consultationService.startConsultation(request).subscribe({
      next: (consultation) => {
        this.consultation = consultation;
        this.isLoading = false;
        this.loadJitsi();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du démarrage de la consultation';
        console.error('Error starting consultation:', error);
        
        // If consultation already exists, try to load it
        this.consultationService.getConsultationByAppointmentId(this.appointmentId).subscribe({
          next: (consultation) => {
            this.consultation = consultation;
            this.loadJitsi();
          },
          error: () => {
            this.errorMessage = 'Impossible de démarrer la consultation';
          }
        });
      }
    });
  }

  loadJitsi(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Load Jitsi Meet API script if not already loaded
    if (typeof JitsiMeetExternalAPI === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        this.initializeJitsiMeet();
      };
      document.head.appendChild(script);
    } else {
      this.initializeJitsiMeet();
    }
  }

  initializeJitsiMeet(): void {
    if (!this.consultation || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: `MSante_Consultation_${this.consultation.id}`,
      width: '100%',
      height: 600,
      parentNode: document.querySelector('#jitsi-container'),
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'raisehand',
          'videoquality', 'filmstrip', 'stats', 'tileview'
        ],
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false
      },
      userInfo: {
        displayName: `Dr. ${this.consultation.doctorFirstName} ${this.consultation.doctorLastName}`
      }
    };

    this.jitsiApi = new JitsiMeetExternalAPI(domain, options);
    this.isCallActive = true;
    this.callStartTime = new Date();

    // Start call duration counter
    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        this.callDuration = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000);
      }
    }, 1000);

    // Listen to events
    this.jitsiApi.addEventListener('videoConferenceJoined', () => {
      console.log('Video conference joined');
    });

    this.jitsiApi.addEventListener('videoConferenceLeft', () => {
      console.log('Video conference left');
      this.handleCallEnded();
    });

    this.jitsiApi.addEventListener('readyToClose', () => {
      this.handleCallEnded();
    });
  }

  toggleMute(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleAudio');
      this.isMuted = !this.isMuted;
    }
  }

  toggleVideo(): void {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleVideo');
      this.isVideoOff = !this.isVideoOff;
    }
  }

  toggleNotesPanel(): void {
    this.showNotesPanel = !this.showNotesPanel;
  }

  endCall(): void {
    if (this.jitsiApi) {
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    }
    this.isCallActive = false;
    
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }

  handleCallEnded(): void {
    this.endCall();
    
    // Show notes panel to complete consultation
    this.showNotesPanel = true;
  }

  onConsultationEnded(): void {
    // Redirect to consultation details or history
    if (this.consultation) {
      this.router.navigate(['/consultations', this.consultation.id]);
    } else {
      this.router.navigate(['/consultations/history']);
    }
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

