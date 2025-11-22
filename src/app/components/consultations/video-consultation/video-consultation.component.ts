/**
 * Video Consultation Component
 * Handles video consultations using multiple platforms (Jitsi, Zoom, etc.)
 */
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation, StartConsultationRequest, VideoConsultationConfig } from '../../../models/consultation.model';
import { ConsultationNotesComponent } from '../consultation-notes/consultation-notes.component';

declare var JitsiMeetExternalAPI: any;
declare var ZoomMtg: any;

@Component({
  selector: 'app-video-consultation',
  standalone: true,
  imports: [CommonModule, ConsultationNotesComponent],
  templateUrl: './video-consultation.component.html',
  styleUrls: ['./video-consultation.component.scss']
})
export class VideoConsultationComponent implements OnInit, OnDestroy {
  consultation: Consultation | null = null;
  videoConfig: VideoConsultationConfig | null = null;
  appointmentId!: string;
  isLoading = true;
  errorMessage = '';
  
  // Video call state
  jitsiApi: any = null;
  isCallActive = false;
  isMuted = false;
  isVideoOff = false;
  
  // Platform type
  videoPlatform: 'jitsi' | 'zoom' | 'teams' | 'meet' | 'custom' = 'jitsi';
  
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
        
        // Check if videoConfig is included in consultation response
        if (consultation.videoConfig) {
          this.videoConfig = consultation.videoConfig;
          this.videoPlatform = this.videoConfig.platform || 'jitsi';
          this.isLoading = false;
          this.loadVideoSDK();
        } else {
          // Get video configuration separately if not included
          this.consultationService.getVideoConsultationConfig(consultation.id).subscribe({
            next: (config) => {
              this.videoConfig = config;
              this.videoPlatform = config.platform || 'jitsi';
              this.isLoading = false;
              this.loadVideoSDK();
            },
            error: (error) => {
              this.isLoading = false;
              this.errorMessage = 'Erreur lors de la récupération de la configuration vidéo';
              console.error('Error getting video config:', error);
            }
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du démarrage de la consultation';
        console.error('Error starting consultation:', error);
        
        // If consultation already exists, try to load it
        this.consultationService.getConsultationByAppointmentId(this.appointmentId).subscribe({
          next: (consultation) => {
            this.consultation = consultation;
            
            // Use videoConfig from consultation or fetch separately
            if (consultation.videoConfig) {
              this.videoConfig = consultation.videoConfig;
              this.videoPlatform = this.videoConfig.platform || 'jitsi';
              this.loadVideoSDK();
            } else {
              this.consultationService.getVideoConsultationConfig(consultation.id).subscribe({
                next: (config) => {
                  this.videoConfig = config;
                  this.videoPlatform = config.platform || 'jitsi';
                  this.loadVideoSDK();
                },
                error: () => {
                  this.errorMessage = 'Impossible de charger la configuration vidéo';
                }
              });
            }
          },
          error: () => {
            this.errorMessage = 'Impossible de démarrer la consultation';
          }
        });
      }
    });
  }

  loadVideoSDK(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    switch (this.videoPlatform) {
      case 'jitsi':
        this.loadJitsi();
        break;
      case 'zoom':
        this.loadZoom();
        break;
      case 'teams':
        this.loadTeams();
        break;
      case 'meet':
        this.loadGoogleMeet();
        break;
      case 'custom':
        this.loadCustomPlatform();
        break;
      default:
        this.loadJitsi();
    }
  }

  loadJitsi(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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
    if (!this.consultation || !this.videoConfig || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const domain = this.videoConfig.jitsiDomain || 'meet.jit.si';
    const roomName = this.videoConfig.jitsiRoomName || 
                     this.videoConfig.roomId || 
                     `MSante_${this.consultation.id}`;

    const options = {
      roomName: roomName,
      width: '100%',
      height: 600,
      parentNode: document.querySelector('#jitsi-container'),
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        requireDisplayName: false
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
        displayName: this.videoConfig.doctorName,
        email: this.videoConfig.doctorEmail
      }
    };

    // Add JWT token if provided
    if (this.videoConfig.jitsiToken) {
      (options as any).jwt = this.videoConfig.jitsiToken;
    }

    // Add password if required
    if (this.videoConfig.jitsiPassword) {
      (options as any).roomPassword = this.videoConfig.jitsiPassword;
    }

    this.jitsiApi = new JitsiMeetExternalAPI(domain, options);
    this.isCallActive = true;
    this.startCallTimer();

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

  loadZoom(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Load Zoom SDK CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://source.zoom.us/2.18.0/css/bootstrap.css';
    document.head.appendChild(link);

    const zoomLink = document.createElement('link');
    zoomLink.rel = 'stylesheet';
    zoomLink.href = 'https://source.zoom.us/2.18.0/css/react-select.css';
    document.head.appendChild(zoomLink);

    // Load Zoom SDK scripts
    if (typeof ZoomMtg === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://source.zoom.us/2.18.0/lib/vendor/react.min.js';
      script.async = true;
      script.onload = () => {
        const reactDomScript = document.createElement('script');
        reactDomScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js';
        reactDomScript.onload = () => {
          const reduxScript = document.createElement('script');
          reduxScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/redux.min.js';
          reduxScript.onload = () => {
            const zoomScript = document.createElement('script');
            zoomScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js';
            zoomScript.onload = () => {
              const sdkScript = document.createElement('script');
              sdkScript.src = 'https://source.zoom.us/zoom-meeting-2.18.0.min.js';
              sdkScript.onload = () => this.initializeZoom();
              document.head.appendChild(sdkScript);
            };
            document.head.appendChild(zoomScript);
          };
          document.head.appendChild(reduxScript);
        };
        document.head.appendChild(reactDomScript);
      };
      document.head.appendChild(script);
    } else {
      this.initializeZoom();
    }
  }

  initializeZoom(): void {
    if (!this.videoConfig || !isPlatformBrowser(this.platformId)) {
      return;
    }

    ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();

    const meetConfig = {
      meetingNumber: this.videoConfig.zoomMeetingId || this.videoConfig.zoomMeetingNumber?.toString() || '',
      userName: this.videoConfig.doctorName,
      passWord: this.videoConfig.zoomPasscode || this.videoConfig.zoomPassword || '',
      leaveUrl: window.location.origin + '/consultations/history',
      role: this.videoConfig.zoomRole || 1,
      userEmail: this.videoConfig.doctorEmail || '',
      signature: this.videoConfig.zoomSignature || '',
      apiKey: this.videoConfig.zoomApiKey || this.videoConfig.zoomSdkKey || '',
      success: (success: any) => {
        console.log('Zoom meeting started', success);
        this.isCallActive = true;
        this.startCallTimer();

        ZoomMtg.inMeetingServiceListener('onUserLeave', () => {
          this.handleCallEnded();
        });

        ZoomMtg.inMeetingServiceListener('onMeetingStatus', (data: any) => {
          if (data.meetingStatus === 3) {
            this.handleCallEnded();
          }
        });
      },
      error: (error: any) => {
        console.error('Zoom meeting error', error);
        this.errorMessage = 'Erreur lors du démarrage de la réunion Zoom';
      }
    };

    ZoomMtg.init({
      leaveUrl: meetConfig.leaveUrl,
      success: () => {
        ZoomMtg.join({
          meetingNumber: meetConfig.meetingNumber,
          userName: meetConfig.userName,
          signature: meetConfig.signature,
          apiKey: meetConfig.apiKey,
          userEmail: meetConfig.userEmail,
          passWord: meetConfig.passWord,
          success: meetConfig.success,
          error: meetConfig.error
        });
      },
      error: (error: any) => {
        console.error('Zoom init error', error);
        this.errorMessage = 'Erreur lors de l\'initialisation de Zoom';
      }
    });
  }

  loadTeams(): void {
    if (!this.videoConfig) {
      this.errorMessage = 'Configuration Microsoft Teams non disponible';
      return;
    }

    const teamsUrl = this.videoConfig.teamsUrl || this.videoConfig.teamsJoinUrl;
    if (!teamsUrl) {
      this.errorMessage = 'URL Microsoft Teams non disponible';
      return;
    }

    window.open(teamsUrl, '_blank');
    this.isCallActive = true;
    this.startCallTimer();
  }

  loadGoogleMeet(): void {
    if (!this.videoConfig || !this.videoConfig.meetUrl) {
      this.errorMessage = 'URL Google Meet non disponible';
      return;
    }

    window.open(this.videoConfig.meetUrl, '_blank');
    this.isCallActive = true;
    this.startCallTimer();
  }

  loadCustomPlatform(): void {
    if (!this.videoConfig || !this.videoConfig.customUrl) {
      this.errorMessage = 'URL de visioconférence non disponible';
      return;
    }

    const container = document.querySelector('#jitsi-container');
    if (container) {
      const iframe = document.createElement('iframe');
      iframe.src = this.videoConfig.customUrl;
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; fullscreen; display-capture';
      container.appendChild(iframe);
      
      this.isCallActive = true;
      this.startCallTimer();
    }
  }

  startCallTimer(): void {
    this.callStartTime = new Date();
    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        this.callDuration = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000);
      }
    }, 1000);
  }

  toggleMute(): void {
    if (this.videoPlatform === 'jitsi' && this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleAudio');
      this.isMuted = !this.isMuted;
    }
  }

  toggleVideo(): void {
    if (this.videoPlatform === 'jitsi' && this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleVideo');
      this.isVideoOff = !this.isVideoOff;
    }
  }

  toggleNotesPanel(): void {
    this.showNotesPanel = !this.showNotesPanel;
  }

  endCall(): void {
    if (this.videoPlatform === 'jitsi' && this.jitsiApi) {
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    } else if (this.videoPlatform === 'zoom') {
      if (typeof ZoomMtg !== 'undefined') {
        ZoomMtg.leaveMeeting({});
      }
    }
    
    this.isCallActive = false;
    
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
    }
  }

  handleCallEnded(): void {
    this.endCall();
    this.showNotesPanel = true;
  }

  onConsultationEnded(): void {
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