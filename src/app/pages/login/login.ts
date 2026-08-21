import { Component, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmailService } from '../../services/email.service';
import { CourseService } from '../../services/course.service';
import { EventService } from '../../services/event.service';
import { RazorpayService } from '../../services/razorpay.service';
import { Course, CmeEvent } from '../../models/course.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  // Touch to refresh IDE diagnostics
  activeRole = signal<'doctor' | 'admin'>('doctor'); // Default is Doctor Login!

  // Landing Page dynamic browse, filter & search
  searchQuery = '';
  selectedSpecialty = 'All';
  selectedFormat = 'All';
  eventsLimit = 4;
  coursesLimit = 3;
  showExploreDropdown = false;

  // Selected event details modal
  selectedEventForDetail: CmeEvent | null = null;
  showEventDetailModal = false;

  // Checkout states for Event Registration
  selectedEvent: CmeEvent | null = null;
  showRegisterModal = false;
  agreeTermsCheckout = false;
  showSponsorInput = false;
  sponsorCode = '';
  sponsorNameDetected = '';
  sponsorCodeError = '';
  registrationSuccess = false;
  processingPayment = false;
  paymentSuccess = false;
  paymentTransactionId = '';
  showSimulatedRazorpay = false;
  selectedPaymentMethod: 'upi' | 'card' | 'netbanking' = 'upi';
  upiId = 'doctor@okicici';
  cardNumber = '4532 ΓÇóΓÇóΓÇóΓÇó ΓÇóΓÇóΓÇóΓÇó 8892';

  // isNewRegistration flag for OTP-first new users
  isNewRegistration = false;
  // Modal toggles
  showLoginModal = false;

  // Pending guest actions
  pendingEventForCheckout: CmeEvent | null = null;

  // Form Fields
  userId: string = 'doctor@medcme.org';
  userPass: string = 'doctor123';
  showPassword: boolean = false;
  loginStep: number = 1; // 1: Identifier, 2: Credentials
  loginMethod: 'otp' = 'otp';
  otpSentForLogin = false;
  loginOtpCountdown = 60;
  loginOtpInterval: any = null;
  loginOtpCode = '123456';
  forgotOtpCode = '654321';

  // Left Panel Interactive Carousel Slides
  activeSlideIndex: number = 0;
  slides = [
    {
      icon: '≡ƒÅå',
      tag: 'Accredited CME Platform',
      title: 'Earn & Track CME Credit Points',
      desc: 'Seamlessly participate in MMC & National Medical Council accredited sessions and track your official credit ledger in real time.'
    },
    {
      icon: '≡ƒô£',
      tag: 'Verified Digital Credentials',
      title: 'Instant Gold-Stamped Certificates',
      desc: 'Earn verifiable digital certificates upon completing live sessions and passing interactive medical assessment quizzes.'
    },
    {
      icon: '≡ƒ⌐║',
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
  regMiddleName: string = '';
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
  regInterests: { [key: string]: boolean } = {
    Cardiology: false,
    Pediatrics: false,
    Neurology: false,
    Surgery: false,
    'General Medicine': false
  };

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
    public courseService: CourseService,
    public eventService: EventService,
    private razorpayService: RazorpayService,
    private router: Router
  ) { }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    // If already logged in, redirect straight to dashboard
    if (this.authService.currentUser()) {
      this.router.navigate(['/dashboard']);
    }
  }

  switchRole(role: 'doctor' | 'admin') {
    this.activeRole.set(role);
    this.errorMessage = '';
    this.isNewRegistration = false;
    this.loginMethod = 'otp';
    this.otpSentForLogin = false;
    if (this.loginOtpInterval) {
      clearInterval(this.loginOtpInterval);
    }
    if (role === 'doctor') {
      this.userId = 'doctor@medcme.org';
    } else {
      this.userId = 'admin@medcme.org';
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
      this.loginMethod = 'otp';
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
      this.loginMethod = 'otp';
      if (!this.otpSentForLogin) {
        this.sendLoginOtp();
      }
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
    // 1. Mandatory Field presence checks
    if (!this.regFirstName.trim() || 
        !this.regLastName.trim() || 
        !this.regMobileNumber.trim() || 
        !this.regEmail.trim() ||
        !this.regCity.trim() ||
        !this.regDesignation.trim() ||
        !this.regSpecialty.trim() ||
        !this.regQualification.trim() ||
        !this.regHospital.trim() ||
        !this.regLanguage.trim() ||
        !this.regMmcNo.trim()) {
      alert('Please fill in all required fields (marked with *).');
      return;
    }

    // 2. Character and Format validations
    const namePattern = /^[a-zA-Z\s\-\']{2,60}$/;
    if (!namePattern.test(this.regFirstName.trim())) {
      alert('First Name must be 2-60 characters and contain only letters, spaces, hyphens, or apostrophes.');
      return;
    }

    if (!namePattern.test(this.regLastName.trim())) {
      alert('Last Name (Surname) must be 2-60 characters and contain only letters, spaces, hyphens, or apostrophes.');
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.regEmail.trim())) {
      alert('Please enter a valid email address.');
      return;
    }

    const phonePattern = /^\+?\d{8,15}$/;
    if (!phonePattern.test(this.regMobileNumber.trim())) {
      alert('Please enter a valid mobile number (8-15 digits, country code optional).');
      return;
    }

    // 3. Uniqueness checks
    if (this.authService.checkUserExists(this.regEmail.trim())) {
      alert('This email address is already registered.');
      return;
    }

    if (this.authService.checkUserExists(this.regMobileNumber.trim())) {
      alert('This mobile number is already registered.');
      return;
    }

    // 4. Length and integer validations
    if (this.regHospital.trim().length > 150) {
      alert('Hospital name cannot exceed 150 characters.');
      return;
    }

    if (this.regOrganization && this.regOrganization.trim().length > 150) {
      alert('Organization name cannot exceed 150 characters.');
      return;
    }

    if (this.regExperience !== null && (this.regExperience < 0 || !Number.isInteger(this.regExperience))) {
      alert('Years of Experience must be a non-negative integer.');
      return;
    }

    if (this.regSpecialty === 'Other' && !this.regSpecialtyOther.trim()) {
      alert('Please specify your specialty category.');
      return;
    }

    // 5. Consent and Terms checks
    if (!this.regEmailConsent || !this.regWhatsappConsent || !this.regTermsConsent) {
      alert('You must accept all required consents (Email, WhatsApp) and the Terms & Privacy Policy to proceed.');
      return;
    }

    // 6. Date of birth check (not in future)
    if (this.regDob) {
      const selected = new Date(this.regDob);
      const today = new Date();
      if (selected > today) {
        alert('Date of Birth cannot be in the future.');
        return;
      }
    }

    // 7. Collect selected interests
    const selectedInterests = Object.keys(this.regInterests).filter(k => this.regInterests[k]);

    // 4. Register user in mock DB
    const registrationDetails = {
      designation: this.regDesignation,
      name: this.regFirstName,
      sirName: this.regLastName,
      middleName: this.regMiddleName.trim(),
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
      interests: selectedInterests
    };

    this.authService.registerNewUser(registrationDetails, false);

    this.showRegistrationForm = false;
    this.regSuccessMsg = `Successfully registered Dr. ${this.regFirstName}! Please verify via OTP on the login page to proceed.`;

    setTimeout(() => {
      this.regSuccessMsg = '';
      this.showRegistrationForm = false;
      this.showNotRegisteredModal = false;

      // Bring user to Login modal configured in OTP mode with their registered account ID
      this.userId = registrationDetails.email || registrationDetails.phone;
      this.userPass = '';
      this.activeRole.set('doctor');
      this.loginStep = 2;
      this.loginMethod = 'otp';
      this.showLoginModal = true;

      // Send OTP to user for verification
      this.sendLoginOtp();
    }, 1500);
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

    // OTP is always required — verify it first
    if (this.userPass.trim() !== this.loginOtpCode) {
      this.loading = false;
      this.errorMessage = 'Invalid 6-digit OTP code. Please enter the correct code.';
      return;
    }

    setTimeout(() => {
      this.loading = false;

      // OTP verified — directly authenticate and navigate
      const res = this.authService.authenticateDoctor(this.userId, this.userPass);
      if (this.activeRole() === 'admin') {
        const adminRes = this.authService.authenticateAdmin(this.userId, this.userPass);
        if (adminRes.success) {
          this.showLoginModal = false;
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'OTP verified but admin account not found.';
        }
        return;
      }

      if (res.success) {
        if (this.pendingEventForCheckout) {
          this.showLoginModal = false;
          this.openRegisterModal(this.pendingEventForCheckout);
          this.pendingEventForCheckout = null;
        } else {
          this.showLoginModal = false;
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.errorMessage = 'OTP verified but account not found. Please register first.';
      }
    }, 500);
  }

  // --- Dynamic Search, Filters & Checkout Helpers ---
  get filteredEvents(): CmeEvent[] {
    let list = this.eventService.getUpcomingEvents();
    if (this.selectedSpecialty !== 'All') {
      list = list.filter(e => e.category.toLowerCase() === this.selectedSpecialty.toLowerCase());
    }
    if (this.selectedFormat !== 'All') {
      list = list.filter(e => e.mode === this.selectedFormat);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.speaker || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get visibleEvents(): CmeEvent[] {
    return this.filteredEvents.slice(0, this.eventsLimit);
  }

  showMoreEvents() {
    this.eventsLimit = this.filteredEvents.length;
  }

  showLessEvents() {
    this.eventsLimit = 4;
  }

  get visibleCourses() {
    return this.filteredCourses.slice(0, this.coursesLimit);
  }

  showMoreCourses() {
    this.coursesLimit = this.filteredCourses.length;
  }

  showLessCourses() {
    this.coursesLimit = 3;
  }

  get filteredCourses(): Course[] {
    let list = this.courseService.getCourses();
    if (this.selectedSpecialty !== 'All') {
      list = list.filter(c => c.category.toLowerCase() === this.selectedSpecialty.toLowerCase());
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.shortDescription || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.instructor || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  toggleExploreDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showExploreDropdown = !this.showExploreDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.explore-dropdown-container')) {
      this.showExploreDropdown = false;
    }
  }

  selectExploreOption(option: 'Online' | 'Offline' | 'Hybrid' | 'Courses' | 'All') {
    this.showExploreDropdown = false;
    if (option === 'Courses') {
      const element = document.getElementById('courses-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      if (option === 'All') {
        this.selectedFormat = 'All';
      } else {
        this.selectedFormat = option;
      }
      const element = document.getElementById('events-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  selectSpecialtyBadge(specialty: string) {
    this.selectedSpecialty = specialty;
  }

  viewCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  openEventDetail(event: CmeEvent) {
    this.selectedEventForDetail = event;
    this.showEventDetailModal = true;
  }

  closeEventDetail() {
    this.selectedEventForDetail = null;
    this.showEventDetailModal = false;
  }

  registerForEventFromDetail() {
    if (!this.selectedEventForDetail) return;
    const event = this.selectedEventForDetail;
    this.closeEventDetail();

    const user = this.authService.currentUser();
    if (!user) {
      this.pendingEventForCheckout = event;
      this.showLoginModal = true;
    } else {
      this.openRegisterModal(event);
    }
  }

  openRegisterModal(event: CmeEvent) {
    this.selectedEvent = event;
    this.registrationSuccess = false;
    this.showRegisterModal = true;
    this.agreeTermsCheckout = false;
    this.showSponsorInput = false;
    this.sponsorCode = '';
    this.sponsorNameDetected = '';
    this.sponsorCodeError = '';
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
    this.selectedEvent = null;
  }

  verifySponsorCode() {
    this.sponsorCodeError = '';
    this.sponsorNameDetected = '';
    const raw = this.sponsorCode.trim().toUpperCase();
    if (!raw) return;

    const tokens = raw.split(/[\s,]+/).filter(t => t.length > 0);

    for (const code of tokens) {
      if (code.includes('SUN')) {
        this.sponsorNameDetected = 'Sun Pharma Representative';
        return;
      } else if (code.includes('REDDY')) {
        this.sponsorNameDetected = "Dr. Reddy's Laboratories";
        return;
      } else if (code.includes('CIPLA')) {
        this.sponsorNameDetected = 'Cipla Pharmaceuticals';
        return;
      } else if (code.includes('LUPIN')) {
        this.sponsorNameDetected = 'Lupin Limited';
        return;
      } else if (code.includes('COUPON') || code.includes('DISCOUNT')) {
        this.sponsorNameDetected = 'Promo Coupon Applied (100% waver)';
        return;
      } else if (code.includes('FREE') || code.includes('SPONSOR') || code.startsWith('MR')) {
        this.sponsorNameDetected = 'Special MR Sponsor';
        return;
      }
    }

    this.sponsorCodeError = 'Invalid MR Sponsorship / Coupon Code. Try codes like MR_SUN, COUPON_100, or MR_FREE.';
  }

  async confirmRegister() {
    const user = this.authService.currentUser();
    if (!user || !this.selectedEvent) return;

    if (this.selectedEvent.price === 0) {
      const success = this.eventService.registerForEvent(
        this.selectedEvent.id,
        user.id,
        user.name,
        user.email,
        user.phone || '9876543210',
        'free'
      );
      if (success) {
        this.registrationSuccess = true;
        setTimeout(() => this.closeRegisterModal(), 2200);
      }
    } else if (this.sponsorNameDetected) {
      const success = this.eventService.registerForEvent(
        this.selectedEvent.id,
        user.id,
        user.name,
        user.email,
        user.phone || '9876543210',
        'sponsored',
        this.sponsorNameDetected
      );
      if (success) {
        this.registrationSuccess = true;
        setTimeout(() => this.closeRegisterModal(), 2200);
      }
    } else {
      const details = {
        courseId: this.selectedEvent.id,
        courseTitle: this.selectedEvent.title,
        amount: this.selectedEvent.price,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone || '9876543210'
      };

      const res = await this.razorpayService.openPaymentGateway(details);
      if (res.success && res.paymentId && res.paymentId !== 'FALLBACK_TRIGGER') {
        this.finalizeEventPurchase(res.paymentId);
      } else {
        this.showSimulatedRazorpay = true;
      }
    }
  }

  confirmSimulatedPayment() {
    this.processingPayment = true;
    setTimeout(() => {
      this.processingPayment = false;
      this.paymentSuccess = true;
      this.paymentTransactionId = 'pay_rzp_evt_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      setTimeout(() => {
        this.showSimulatedRazorpay = false;
        this.paymentSuccess = false;
        if (this.selectedEvent) {
          this.finalizeEventPurchase(this.paymentTransactionId);
        }
      }, 1200);
    }, 1500);
  }

  finalizeEventPurchase(transactionId: string) {
    const user = this.authService.currentUser();
    if (!user || !this.selectedEvent) return;

    this.eventService.registerForEvent(
      this.selectedEvent.id,
      user.id,
      user.name,
      user.email,
      user.phone || '9876543210',
      'paid',
      transactionId
    );
    this.registrationSuccess = true;
    setTimeout(() => this.closeRegisterModal(), 2200);
  }

  isRegistered(eventId: string): boolean {
    const user = this.authService.currentUser();
    return user ? this.eventService.isRegistered(eventId, user.id) : false;
  }

  openLoginModalDirect() {
    this.isNewRegistration = false;
    this.activeRole.set('doctor');
    this.userId = 'doctor@medcme.org';
    this.userPass = '';
    this.loginStep = 1;
    this.otpSentForLogin = false;
    this.showLoginModal = true;
  }

  openSignupModalDirect() {
    this.activeRole.set('doctor');
    this.regDesignation = 'Dr.';
    this.regFirstName = '';
    this.regMiddleName = '';
    this.regLastName = '';
    this.regMobileNumber = '';
    this.regEmail = '';
    this.regPassword = '';
    this.regConfirmPassword = '';
    this.regCity = '';
    this.regGender = 'Male';
    this.regDob = '';
    this.regDepartment = '';
    this.regSpecialty = 'Cardiology';
    this.regSpecialtyOther = '';
    this.regQualification = 'MBBS';
    this.regMmcNo = '';
    this.regHospital = '';
    this.regOrganization = '';
    this.regExperience = 2;
    this.regLanguage = 'English';
    this.regClinicAddress = '';
    this.regEmailConsent = true;
    this.regWhatsappConsent = true;
    this.regTermsConsent = false;
    this.regInterests = {
      Cardiology: false,
      Pediatrics: false,
      Neurology: false,
      Surgery: false,
      'General Medicine': false
    };
    this.showRegistrationForm = true;
  }
}
