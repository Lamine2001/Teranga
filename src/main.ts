import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
// Retirer provideAnimations si présent
// import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),  // Enable fetch API for better SSR performance
      withInterceptors([authInterceptor])
    ),
    provideNoopAnimations() // Utiliser NoopAnimations au lieu de provideAnimations
  ]
}).catch(err => console.error(err));
