import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Touch to refresh IDE diagnostics
  activeRole = signal<'doctor' | 'admin'>('doctor'); // Default is Doctor Login!

  // Form Fields
  userId: string = 'doctor@medcme.org';
  userPass: string = 'doctor123';

  errorMessage: string = '';
  loading: boolean = false;

  // Popups & Registration Form states
  showNotRegisteredModal = false;
  showRegistrationForm = false;

  // New User Registration Fields
  regDesignation: string = 'Dr.';
  regFirstName: string = '';
  regLastName: string = '';
  regMobileNumber: string = '';
  regCity: string = '';
  regSuccessMsg: string = '';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  switchRole(role: 'doctor' | 'admin') {
    this.activeRole.set(role);
    this.errorMessage = '';
    if (role === 'doctor') {
      this.userId = 'doctor@medcme.org';
      this.userPass = 'doctor123';
    } else {
      this.userId = 'admin@medcme.org';
      this.userPass = 'admin123';
    }
  }

  fillDoctorDemo() {
    this.activeRole.set('doctor');
    this.userId = 'doctor@medcme.org';
    this.userPass = 'doctor123';
  }

  fillAdminDemo() {
    this.activeRole.set('admin');
    this.userId = 'admin@medcme.org';
    this.userPass = 'admin123';
  }

  // Focus out (blur) check on Username/Mobile number field
  checkNumberPresent() {
    // Only check for doctor role and if user typed something
    if (this.activeRole() !== 'doctor') return;
    const input = this.userId.trim();
    if (!input) return;

    // Check if user exists in mock DB
    const exists = this.authService.checkUserExists(input);
    if (!exists) {
      // Auto pre-fill mobile field if input looks like a phone number
      if (/^\d{8,15}$/.test(input)) {
        this.regMobileNumber = input;
      } else {
        this.regMobileNumber = '';
      }
      this.showNotRegisteredModal = true;
    }
  }

  openRegistration() {
    this.showNotRegisteredModal = false;
    this.showRegistrationForm = true;
  }

  closeRegistration() {
    this.showRegistrationForm = false;
    this.showNotRegisteredModal = false;
  }

  submitRegistration() {
    if (!this.regFirstName.trim() || !this.regLastName.trim() || !this.regMobileNumber.trim()) {
      alert('Please fill in all required fields (First Name, Last Name, and Mobile Number).');
      return;
    }

    // Register user in mock DB
    this.authService.registerNewUser(
      this.regDesignation,
      this.regFirstName,
      this.regLastName,
      this.regMobileNumber,
      this.regCity
    );

    this.showRegistrationForm = false;
    this.regSuccessMsg = `Successfully registered Dr. ${this.regFirstName}! You are now logged in.`;

    setTimeout(() => {
      this.regSuccessMsg = '';
      this.router.navigate(['/dashboard']);
    }, 2000);
  }

  onLogin() {
    this.errorMessage = '';
    this.loading = true;

    setTimeout(() => {
      this.loading = false;

      if (this.activeRole() === 'doctor') {
        const res = this.authService.authenticateDoctor(this.userId, this.userPass);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = res.message || 'Invalid Doctor Login Credentials';
        }
      } else {
        const res = this.authService.authenticateAdmin(this.userId, this.userPass);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = res.message || 'Invalid Administrator Login Credentials';
        }
      }
    }, 500);
  }
}
