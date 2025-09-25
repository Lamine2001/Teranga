import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit {
  imageLoaded = false;
  // Optional: Set to empty string if you don't have a placeholder image yet
  placeholderImage = ''; // You can add base64 image later if needed

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Préchargement anticipé de l'image seulement côté client
      this.preloadImage();
    } else {
      // Côté serveur, on considère l'image comme chargée
      this.imageLoaded = true;
    }
  }

  private preloadImage(): void {
    const img = new Image();
    img.src = '/pic_12.jpg';
    // Add minimum loading time for smoother UX (optional)
    const minLoadTime = 300;
    const startTime = Date.now();

    img.onload = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsedTime);

      setTimeout(() => {
        this.onImageLoad();
      }, remainingTime);
    };

    img.onerror = () => this.onImageError();
  }

  onImageLoad(): void {
    this.imageLoaded = true;
  }

  onImageError(): void {
    console.error('Failed to load hero background image');
    // Keep the gradient background if image fails
    this.imageLoaded = false;
  }
}
