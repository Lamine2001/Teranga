import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.scss']
})
export class AuthPageComponent {
  showRegister = false;

  toggleMode(): void {
    this.showRegister = !this.showRegister;
  }
}
