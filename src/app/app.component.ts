import { Component, AfterViewInit, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit {
  ngOnInit(): void {
   
  }
  title = 'VitaMedicale';

  ngAfterViewInit(): void {
    // Signaler que Angular est prêt après que la vue soit initialisée
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.postMessage({ type: 'angular-ready' }, '*');
      }
    }, 100);
  }
}
