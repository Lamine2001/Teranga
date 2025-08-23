import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginFormComponent } from '../../components/auth/login-form/login-form.component';
import { RegisterFormComponent } from '../../components/auth/register-form/register-form.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, RegisterFormComponent],
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.scss']
})
export class AuthPageComponent implements OnInit {
  showRegister = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check query parameters for mode
    this.route.queryParams.subscribe(params => {
      this.showRegister = params['mode'] === 'register';
    });
  }

  toggleMode(): void {
    this.showRegister = !this.showRegister;
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: this.showRegister ? 'register' : 'login' },
      queryParamsHandling: 'merge'
    });
  }

  getModeText(): string {
    return this.showRegister ? 'Se connecter' : 'Créer un compte';
  }

  getModeDescription(): string {
    return this.showRegister 
      ? 'Vous avez déjà un compte ? Connectez-vous ici'
      : 'Vous n\'avez pas de compte ? Créez-en un ici';
  }
}
