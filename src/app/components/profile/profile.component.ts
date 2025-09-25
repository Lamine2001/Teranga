import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserProfile } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  loading = true;
  error: string | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile';
        this.loading = false;
        console.error('Error loading profile:', err);
      }
    });
  }
}
