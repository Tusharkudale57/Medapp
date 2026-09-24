import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/course.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignupComponent {

  // Registration fields
  regDesignation = 'Dr.';
  regFirstName = '';
  regMiddleName = '';
  regLastName = '';
  regMobileNumber = '';
  regEmail = '';
  regCity = '';

  regGender = 'Male';
  regDob = '';

  regDepartment = '';
  regSpecialty = 'Cardiology';
  regSpecialtyOther = '';

  regQualification = 'MBBS';
  regMmcNo = '';

  regHospital = '';
  regOrganization = '';
  regExperience = 2;

  regLanguage = 'English';
  regClinicAddress = '';

  regEmailConsent = true;
  regWhatsappConsent = true;
  regTermsConsent = false;

  regSuccessMsg = '';

  regInterests: { [key: string]: boolean } = {
    Cardiology: false,
    Pediatrics: false,
    Neurology: false,
    Surgery: false,
    'General Medicine': false
  };

  constructor(
  private authService: AuthService,
  private router: Router
) {}

  submitRegistration(): void {

  // 1. Mandatory Field presence checks
  if (
    !this.regFirstName.trim() ||
    !this.regLastName.trim() ||
    !this.regMobileNumber.trim() ||
    !this.regEmail.trim() ||
    !this.regCity.trim() ||
    !this.regDesignation.trim() ||
    !this.regSpecialty.trim() ||
    !this.regQualification.trim() ||
    !this.regHospital.trim() ||
    !this.regLanguage.trim() ||
    !this.regMmcNo.trim()
  ) {
    alert('Please fill in all required fields (marked with *).');
    return;
  }

  // 2. Character and format validations

  const namePattern = /^[a-zA-Z\s\-']{2,60}$/;

  if (!namePattern.test(this.regFirstName.trim())) {
    alert(
      'First Name must be 2-60 characters and contain only letters, spaces, hyphens, or apostrophes.'
    );
    return;
  }

  if (!namePattern.test(this.regLastName.trim())) {
    alert(
      'Last Name (Surname) must be 2-60 characters and contain only letters, spaces, hyphens, or apostrophes.'
    );
    return;
  }

  const emailPattern =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailPattern.test(this.regEmail.trim())) {
    alert('Please enter a valid email address.');
    return;
  }

  // Original application validation:
  // 8-15 digits, country code optional
  const phonePattern = /^\+?\d{8,15}$/;

  if (!phonePattern.test(this.regMobileNumber.trim())) {
    alert(
      'Please enter a valid mobile number (8-15 digits, country code optional).'
    );
    return;
  }

  // 3. Duplicate email check
  if (this.authService.checkUserExists(this.regEmail.trim())) {
    alert('This email address is already registered.');
    return;
  }

  // 4. Duplicate mobile check
  if (this.authService.checkUserExists(this.regMobileNumber.trim())) {
    alert('This mobile number is already registered.');
    return;
  }

  // 5. Hospital length
  if (this.regHospital.trim().length > 150) {
    alert('Hospital name cannot exceed 150 characters.');
    return;
  }

  // 6. Organization length
  if (
    this.regOrganization &&
    this.regOrganization.trim().length > 150
  ) {
    alert('Organization name cannot exceed 150 characters.');
    return;
  }

  // 7. Experience validation
  if (
    this.regExperience !== null &&
    (
      this.regExperience < 0 ||
      !Number.isInteger(this.regExperience)
    )
  ) {
    alert(
      'Years of Experience must be a non-negative integer.'
    );
    return;
  }

  // 8. Other specialty validation
  if (
    this.regSpecialty === 'Other' &&
    !this.regSpecialtyOther.trim()
  ) {
    alert('Please specify your specialty category.');
    return;
  }

  // 9. Consent validation
  if (
    !this.regEmailConsent ||
    !this.regWhatsappConsent ||
    !this.regTermsConsent
  ) {
    alert(
      'You must accept all required consents (Email, WhatsApp) and the Terms & Privacy Policy to proceed.'
    );
    return;
  }

  // 10. DOB validation
  if (this.regDob) {

    const selected = new Date(this.regDob);
    const today = new Date();

    if (selected > today) {
      alert('Date of Birth cannot be in the future.');
      return;
    }
  }

  // 11. Collect selected interests
  const selectedInterests = Object.keys(this.regInterests)
    .filter(key => this.regInterests[key]);

  // Registration details
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

    specialty:
      this.regSpecialty === 'Other'
        ? this.regSpecialtyOther
        : this.regSpecialty,

    specialtyOther:
      this.regSpecialtyOther.trim(),

    qualification:
      this.regQualification,

    registrationNo:
      this.regMmcNo.trim(),

    hospital:
      this.regHospital.trim(),

    organization:
      this.regOrganization.trim(),

    experience:
      this.regExperience,

    language:
      this.regLanguage,

    emailConsent:
      this.regEmailConsent,

    whatsappConsent:
      this.regWhatsappConsent,

    clinicAddress:
      this.regClinicAddress.trim(),

    interests:
      selectedInterests
  };

  const requestPayload: RegisterRequest = {

    designation:
      this.regDesignation || 'Dr.',

    firstName:
      this.regFirstName.trim(),

    middleName:
      this.regMiddleName.trim(),

    lastName:
      this.regLastName.trim(),

    mobileNumber:
      this.regMobileNumber.trim(),

    email:
      this.regEmail.trim().toLowerCase(),

    preferredLanguage:
      this.regLanguage || 'English',

    gender:
      this.regGender || 'Male',

    dateOfBirth:
      this.regDob
        ? this.regDob.split('T')[0]
        : '1988-05-15',

    medicalRegistrationNo:
      this.regMmcNo.trim(),

    specialtyCategory:
      this.regSpecialty === 'Other'
        ? this.regSpecialtyOther.trim()
        : this.regSpecialty,

    hospitalOrInstitutionName:
      this.regHospital.trim(),

    organization:
      this.regOrganization.trim(),

    departmentName:
      this.regDepartment.trim(),

    city:
      this.regCity.trim(),

    professionalQualification:
      this.regQualification,

    yearsOfExperience:
      Number(this.regExperience) || 0,

    clinicAddress:
      this.regClinicAddress.trim(),

    practicingInterest:
      selectedInterests.length > 0
        ? selectedInterests.join(', ')
        : 'General Medicine',

    cmeInterests:
      selectedInterests.length > 0
        ? selectedInterests
        : [this.regSpecialty],

    emailOptIn:
      this.regEmailConsent,

    whatsappOptIn:
      this.regWhatsappConsent,

    termsAccepted:
      this.regTermsConsent
  };

  // Register user locally
  this.authService.registerNewUser(
    registrationDetails,
    false
  );

  // Navigate directly to Login OTP screen
  this.router.navigate(['/login'], {
    state: {
      registrationSuccess: true,
      userId:
        registrationDetails.email ||
        registrationDetails.phone
    }
  });

  // Sync doctor profile in backend
  this.authService
    .registerDoctorProfile(requestPayload)
    .subscribe({
      next: () => {
        console.log(
          'Backend registration synced successfully'
        );
      },

      error: (err) => {
        console.warn(
          'Backend registration sync note:',
          err
        );
      }
    });
}
}