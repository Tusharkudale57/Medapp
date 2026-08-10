import { Component, OnInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Certificate, UserProfile } from '../../models/course.model';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;
  selectedCertificate: Certificate | null = null;
  showCertModal = false;

  // Edit profile state
  isEditing = false;
  editFirstName = '';
  editLastName = '';
  editSpecialtyDropdown = '';
  editSpecialtyOther = '';
  editRegNo = '';
  editEmail = '';
  editPhone = '';
  editCity = '';

  // Expanded fields
  editGender = 'Male';
  editDob = '';
  editDesignation = '';
  editDepartment = '';
  editQualification = '';
  editHospital = '';
  editExperience = 0;
  editLanguage = 'English';
  editEmailConsent = true;
  editWhatsappConsent = true;

  // Photo upload state
  profilePhotoUrl = 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?w=200&auto=format&fit=crop&q=80';
  uploadError = '';

  // Interests selection
  allInterests: string[] = ['Cardiology', 'Pediatrics', 'Neurology', 'Surgery', 'General Medicine', 'AI in Medicine', 'Robotic Surgery', 'Free Cardiac Clinics'];
  selectedInterests: string[] = [];

  // Change password state
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordChangeMessage = '';
  passwordChangeSuccess = false;

  private isBrowser: boolean;

  @ViewChild('certCanvas') certCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(
    public authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.user = this.authService.currentUser();
    if (this.user) {
      let cleanName = this.user.name.trim();
      if (cleanName.toLowerCase().startsWith('dr. ')) {
        cleanName = cleanName.substring(4).trim();
      }
      const nameParts = cleanName.split(/\s+/);
      this.editFirstName = nameParts[0] || '';
      this.editLastName = this.user.sirName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
      this.editRegNo = this.user.registrationNo;
      this.editEmail = this.user.email;
      this.editPhone = this.user.phone;
      this.editCity = this.user.city || '';

      const knownSpecialties = ['Cardiology', 'Pediatrics', 'Neurology', 'Surgery', 'General Medicine'];
      if (knownSpecialties.includes(this.user.specialty)) {
        this.editSpecialtyDropdown = this.user.specialty;
        this.editSpecialtyOther = '';
      } else {
        this.editSpecialtyDropdown = 'Others';
        this.editSpecialtyOther = this.user.specialty;
      }

      // Initialize expanded fields
      this.editGender = this.user.gender || 'Male';
      this.editDob = this.user.dob || '';
      this.editDesignation = this.user.designation || '';
      this.editDepartment = this.user.department || '';
      this.editQualification = this.user.qualification || '';
      this.editHospital = this.user.hospital || '';
      this.editExperience = this.user.experience || 0;
      this.editLanguage = this.user.language || 'English';
      this.editEmailConsent = this.user.emailConsent !== false;
      this.editWhatsappConsent = this.user.whatsappConsent !== false;
      this.selectedInterests = [...(this.user.interests || [])];
    }

    if (this.isBrowser) {
      const savedPhoto = localStorage.getItem('medcme_profile_photo');
      if (savedPhoto) {
        this.profilePhotoUrl = savedPhoto;
      }
    }
  }

  toggleInterest(interest: string) {
    const idx = this.selectedInterests.indexOf(interest);
    if (idx > -1) {
      this.selectedInterests.splice(idx, 1);
    } else {
      this.selectedInterests.push(interest);
    }
  }

  isInterestSelected(interest: string): boolean {
    return this.selectedInterests.includes(interest);
  }

  onPhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadError = '';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.uploadError = 'Invalid image type. Please select a JPG, JPEG, or PNG.';
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.uploadError = 'File size exceeds 2MB limit.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePhotoUrl = e.target.result;
      if (this.isBrowser) {
        localStorage.setItem('medcme_profile_photo', this.profilePhotoUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordChangeMessage = 'Please fill out all password fields.';
      this.passwordChangeSuccess = false;
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordChangeMessage = 'New password and confirmation do not match.';
      this.passwordChangeSuccess = false;
      return;
    }
    this.passwordChangeMessage = 'Password updated successfully!';
    this.passwordChangeSuccess = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    setTimeout(() => this.passwordChangeMessage = '', 3500);
  }

  saveProfile() {
    if (!this.editFirstName.trim() || !this.editLastName.trim()) return;
    if (!this.user) return;

    const prefix = this.user.name.trim().toLowerCase().startsWith('dr. ') ? 'Dr. ' : '';
    const fullName = `${prefix}${this.editFirstName.trim()} ${this.editLastName.trim()}`;
    const finalSpecialty = this.editSpecialtyDropdown === 'Others' ? this.editSpecialtyOther : this.editSpecialtyDropdown;

    this.authService.updateExtendedProfile({
      name: fullName,
      sirName: this.editLastName.trim(),
      specialty: finalSpecialty,
      registrationNo: this.editRegNo,
      email: this.editEmail,
      phone: this.editPhone,
      city: this.editCity,
      gender: this.editGender,
      dob: this.editDob,
      designation: this.editDesignation,
      department: this.editDepartment,
      qualification: this.editQualification,
      hospital: this.editHospital,
      experience: this.editExperience,
      language: this.editLanguage,
      interests: this.selectedInterests,
      emailConsent: this.editEmailConsent,
      whatsappConsent: this.editWhatsappConsent
    });

    this.user = this.authService.currentUser();
    this.isEditing = false;
  }

  get certificates(): Certificate[] {
    return this.authService.getUserCertificates();
  }

  get totalCreditPoints(): number {
    return this.certificates.reduce((sum, c) => sum + (c.creditPoints || 1), 0);
  }

  openCertificate(cert: Certificate) {
    this.selectedCertificate = cert;
    this.showCertModal = true;
    setTimeout(() => {
      this.drawCertificateOnCanvas();
    }, 150);
  }

  closeCertificateModal() {
    this.showCertModal = false;
    this.selectedCertificate = null;
  }

  drawCertificateOnCanvas() {
    if (!this.isBrowser || !this.certCanvas || !this.selectedCertificate) return;

    const canvas = this.certCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cert = this.selectedCertificate;
    const width = 1000;
    const height = 700;
    canvas.width = width;
    canvas.height = height;

    // Background Gradient & Border
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Borders
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Corner Ornaments
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(32, 32, 24, 24);
    ctx.fillRect(width - 56, 32, 24, 24);
    ctx.fillRect(32, height - 56, 24, 24);
    ctx.fillRect(width - 56, height - 56, 24, 24);

    // Header Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NATIONAL BOARD OF CONTINUING MEDICAL EDUCATION', width / 2, 90);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('ACCEDITED CME CERTIFICATE OF CLINICAL EXCELLENCE', width / 2, 115);

    // Divider Line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 135);
    ctx.lineTo(width - 150, 135);
    ctx.stroke();

    // Certification Statement
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('This is to officially certify that', width / 2, 185);

    // Doctor Name
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px system-ui, serif';
    ctx.fillText(cert.recipientName.toUpperCase(), width / 2, 235);

    // Reg info
    if (this.user?.registrationNo) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Medical Reg No: ${this.user.registrationNo}`, width / 2, 265);
    }

    // Completion Statement
    ctx.fillStyle = '#475569';
    ctx.font = '16px Georgia, serif';
    const completionText = cert.type === 'event'
      ? 'has successfully attended the accredited continuing medical education event'
      : 'has successfully completed the accredited medical continuing education course';
    ctx.fillText(completionText, width / 2, 310);

    // Course Title
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(`"${cert.courseTitle}"`, width / 2, 355);

    // Credit Award Pill Background
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 180, 390, 360, 44, 22);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`AWARDED ${cert.creditPoints}.0 PRESERVED CME CREDIT POINT${cert.creditPoints > 1 ? 'S' : ''}`, width / 2, 418);

    // Dates and Verification
    ctx.fillStyle = '#334155';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Issue Date: ${cert.issueDate}`, 80, 520);
    ctx.fillText(`Verification Code: ${cert.verificationCode}`, 80, 545);

    // Gold Medal Seal Circle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(width / 2, 530, 42, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED', width / 2, 525);
    ctx.fillText('CME 2026', width / 2, 542);

    // Signature Area
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic bold 20px cursive, Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('Dr. V. K. Malhotra', width - 80, 515);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 240, 525);
    ctx.lineTo(width - 60, 525);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Director of Medical Education', width - 80, 545);
  }

  downloadCertificate() {
    if (!this.isBrowser || !this.certCanvas || !this.selectedCertificate) return;

    const canvas = this.certCanvas.nativeElement;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `CME_Certificate_${this.selectedCertificate.verificationCode}.png`;
    link.click();
  }

  downloadCertificatePdf() {
    if (!this.isBrowser || !this.certCanvas || !this.selectedCertificate) return;

    try {
      const canvas = this.certCanvas.nativeElement;
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`CME_Certificate_${this.selectedCertificate.verificationCode}.pdf`);
    } catch (e) {
      console.error('Failed to generate PDF', e);
      alert('Could not download PDF. Please download the PNG instead.');
    }
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToMyLearning() {
    this.router.navigate(['/my-learning']);
  }
}
