import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule], // Ajouter CommonModule pour *ngIf
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit {
  imageLoaded = false;
  imageError = false;
  loadingImage: SafeUrl; // Utiliser SafeUrl pour la sécurité

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer
  ) {
    // Sécuriser l'URL de l'image de chargement
    this.loadingImage = this.sanitizer.bypassSecurityTrustUrl('/loadingA.png');
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Précharger l'image de manière optimisée
      this.preloadImage();
    } else {
      // Côté serveur, on considère l'image comme chargée
      this.imageLoaded = true;
    }
  }

  private preloadImage(): void {
    const img = new Image();
    img.onload = () => {
      this.imageLoaded = true;
    };
    img.onerror = () => {
      this.imageError = true;
      console.warn('Erreur de chargement de l\'image hero');
    };
    // Commencer le chargement immédiatement
    img.src = '/pic_12.jpg';
  }

  onImageLoad(): void {
    this.imageLoaded = true;
  }

  onImageError(): void {
    this.imageError = true;
    console.warn('Erreur de chargement de l\'image hero');
  }
}