import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmailService } from '../../services/email.service';

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
  showPassword: boolean = false;
  loginStep: number = 1; // 1: Identifier, 2: Credentials
  loginMethod: 'password' | 'otp' = 'password';
  otpSentForLogin = false;
  loginOtpCountdown = 60;
  loginOtpInterval: any = null;
  loginOtpCode = '123456';
  forgotOtpCode = '654321';

  // Left Panel Interactive Carousel Slides
  activeSlideIndex: number = 0;
  slides = [
    {
      icon: '🏆',
      tag: 'Accredited CME Platform',
      title: 'Earn & Track CME Credit Points',
      desc: 'Seamlessly participate in MMC & National Medical Council accredited sessions and track your official credit ledger in real time.'
    },
    {
      icon: '📜',
      tag: 'Verified Digital Credentials',
      title: 'Instant Gold-Stamped Certificates',
      desc: 'Earn verifiable digital certificates upon completing live sessions and passing interactive medical assessment quizzes.'
    },
    {
      icon: '🩺',
      tag: 'Clinical Knowledge Bank',
      title: 'Live Webinars & Pre-Read Guides',
      desc: 'Access specialized clinical protocols, downloadable slide decks, and interact directly with premier medical faculty.'
    }
  ];

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

  // Expanded FRD Registration Fields
  regEmail: string = '';
  regPassword: string = '';
  regConfirmPassword: string = '';
  regGender: string = 'Male';
  regDob: string = '';
  regDepartment: string = '';
  regSpecialty: string = 'Cardiology';
  regSpecialtyOther: string = '';
  regQualification: string = 'MBBS';
  regMmcNo: string = '';
  regHospital: string = '';
  regOrganization: string = '';
  regExperience: number = 2;
  regLanguage: string = 'English';
  regEmailConsent: boolean = true;
  regWhatsappConsent: boolean = true;
  regTermsConsent: boolean = false;
  regClinicAddress: string = '';
  regPracticingInterest: string = '';

  // Forgot Password / OTP State Variables
  showForgotPassword = false;
  forgotEmailOrMobile = '';
  otpSent = false;
  otpCode = '';
  otpCountdown = 60;
  otpInterval: any = null;
  newPassword = '';
  newPasswordConfirm = '';
  forgotSuccessMsg = '';
  forgotErrorMsg = '';

  constructor(
    public authService: AuthService,
    public emailService: EmailService,
    private router: Router
  ) { }

  switchRole(role: 'doctor' | 'admin') {
    this.activeRole.set(role);
    this.errorMessage = '';
    this.loginMethod = 'password';
    this.otpSentForLogin = false;
    if (this.loginOtpInterval) {
      clearInterval(this.loginOtpInterval);
    }
    if (role === 'doctor') {
      this.userId = 'doctor@medcme.org';
      this.userPass = 'doctor123';
    } else {
      this.userId = 'admin@medcme.org';
      this.userPass = 'admin123';
    }
  }

  setSlide(index: number) {
    this.activeSlideIndex = index;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToStep(step: number) {
    this.loginStep = step;
    if (step === 1) {
      this.loginMethod = 'password';
      this.otpSentForLogin = false;
      if (this.loginOtpInterval) {
        clearInterval(this.loginOtpInterval);
      }
    }
  }

  nextStep() {
    if (!this.userId.trim()) {
      this.errorMessage = 'Please enter your Registered Email or Mobile Number.';
      return;
    }
    this.errorMessage = '';
    this.checkNumberPresent();
    if (!this.showNotRegisteredModal) {
      this.loginStep = 2;
    }
  }

  fillDoctorDemo() {
    this.activeRole.set('doctor');
    this.userId = 'doctor@medcme.org';
    this.userPass = 'doctor123';
    this.loginStep = 1;
  }

  fillAdminDemo() {
    this.activeRole.set('admin');
    this.userId = 'admin@medcme.org';
    this.userPass = 'admin123';
    this.loginStep = 1;
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
    // 1. Mandatory Field checks
    if (!this.regFirstName.trim() || !this.regLastName.trim() || !this.regMobileNumber.trim() || !this.regEmail.trim()) {
      alert('Please fill in all required fields: First Name, Last Name, Email, and Mobile.');
      return;
    }

    if (!this.regPassword.trim() || this.regPassword !== this.regConfirmPassword) {
      alert('Passwords do not match or are empty.');
      return;
    }

    if (!this.regTermsConsent) {
      alert('You must accept the Terms and Conditions to proceed.');
      return;
    }

    // 2. Date of birth check (not in future)
    if (this.regDob) {
      const selected = new Date(this.regDob);
      const today = new Date();
      if (selected > today) {
        alert('Date of Birth cannot be in the future.');
        return;
      }
    }

    // 3. Register user in mock DB
    const registrationDetails = {
      designation: this.regDesignation,
      name: this.regFirstName,
      sirName: this.regLastName,
      email: this.regEmail.trim(),
      phone: this.regMobileNumber.trim(),
      city: this.regCity.trim(),
      gender: this.regGender,
      dob: this.regDob,
      department: this.regDepartment.trim(),
      specialty: this.regSpecialty === 'Other' ? this.regSpecialtyOther : this.regSpecialty,
      specialtyOther: this.regSpecialtyOther.trim(),
      qualification: this.regQualification,
      registrationNo: this.regMmcNo.trim(),
      hospital: this.regHospital.trim(),
      organization: this.regOrganization.trim(),
      experience: this.regExperience,
      language: this.regLanguage,
      emailConsent: this.regEmailConsent,
      whatsappConsent: this.regWhatsappConsent,
      clinicAddress: this.regClinicAddress.trim(),
      practicingInterest: this.regPracticingInterest.trim()
    };

    this.authService.registerNewUser(registrationDetails);

    this.showRegistrationForm = false;
    this.regSuccessMsg = `Successfully registered Dr. ${this.regFirstName}! You are now logged in.`;

    setTimeout(() => {
      this.regSuccessMsg = '';
      this.router.navigate(['/dashboard']);
    }, 2000);
  }

  // --- Password Recovery / OTP Simulation logic ---
  openForgotPassword() {
    this.showForgotPassword = true;
    this.otpSent = false;
    this.forgotSuccessMsg = '';
    this.forgotErrorMsg = '';
  }

  closeForgotPassword() {
    this.showForgotPassword = false;
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }

  sendForgotOtp() {
    if (!this.forgotEmailOrMobile.trim()) {
      this.forgotErrorMsg = 'Please enter your Registered Email or Mobile Number.';
      return;
    }
    this.forgotErrorMsg = '';
    this.otpSent = true;
    this.otpCountdown = 60;

    // Generate random 6-digit code
    this.forgotOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP via EmailService
    this.emailService.sendOtpEmail(this.forgotEmailOrMobile.trim(), this.forgotOtpCode).then(res => {
      if (!this.emailService.publicKey) {
        alert(`[Simulated Dispatch] Your Password Recovery OTP is: ${this.forgotOtpCode}`);
        this.otpCode = this.forgotOtpCode;
      } else {
        alert(res.message);
      }
    });

    // Start timer countdown
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
    this.otpInterval = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
      } else {
        clearInterval(this.otpInterval);
      }
    }, 1000);
  }

  verifyOtpAndReset() {
    if (!this.otpCode || this.otpCode !== this.forgotOtpCode) {
      this.forgotErrorMsg = 'Please enter the correct 6-digit OTP code.';
      return;
    }
    if (!this.newPassword || this.newPassword !== this.newPasswordConfirm) {
      this.forgotErrorMsg = 'Passwords do not match or are empty.';
      return;
    }
    this.forgotErrorMsg = '';
    this.forgotSuccessMsg = 'Password successfully reset! You can now log in with your new password.';

    setTimeout(() => {
      this.closeForgotPassword();
    }, 2000);
  }

  sendLoginOtp() {
    if (!this.userId.trim()) return;
    this.otpSentForLogin = true;
    this.loginOtpCountdown = 60;
    this.errorMessage = '';

    // Generate random 6-digit code
    this.loginOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send OTP via EmailService
    this.emailService.sendOtpEmail(this.userId.trim(), this.loginOtpCode).then(res => {
      if (!this.emailService.publicKey) {
        alert(`[Simulated SMS/Email] Your MedCME login OTP is: ${this.loginOtpCode}`);
        this.userPass = this.loginOtpCode;
      } else {
        alert(res.message);
      }
    });

    if (this.loginOtpInterval) {
      clearInterval(this.loginOtpInterval);
    }
    this.loginOtpInterval = setInterval(() => {
      if (this.loginOtpCountdown > 0) {
        this.loginOtpCountdown--;
      } else {
        clearInterval(this.loginOtpInterval);
      }
    }, 1000);
  }

  onLogin() {
    this.errorMessage = '';
    this.loading = true;

    // Verify OTP code if using OTP login method
    if (this.loginMethod === 'otp' && this.userPass.trim() !== this.loginOtpCode) {
      this.loading = false;
      this.errorMessage = 'Invalid 6-digit OTP code. Please enter the correct code.';
      return;
    }

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
