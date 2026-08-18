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
  editOrganization = '';
  editClinicAddress = '';
  editPracticingInterest = '';
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
      this.editOrganization = this.user.organization || '';
      this.editClinicAddress = this.user.clinicAddress || '';
      this.editPracticingInterest = this.user.practicingInterest || '';
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
      organization: this.editOrganization,
      clinicAddress: this.editClinicAddress,
      practicingInterest: this.editPracticingInterest,
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
    const W = 1050;
    const H = 740;
    canvas.width = W;
    canvas.height = H;

    // ── 1. Cream/Ivory background ──────────────────────────────────
    ctx.fillStyle = '#fdfaf4';
    ctx.fillRect(0, 0, W, H);

    // ── 2. Subtle watermark diagonal lines ─────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1;
    for (let x = -H; x < W + H; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── 3. Outer dark navy border ───────────────────────────────────
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // ── 4. Inner gold double-line border ───────────────────────────
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // ── 5. Corner ornament diamonds ────────────────────────────────
    const drawCornerDiamond = (cx: number, cy: number) => {
      ctx.save();
      ctx.fillStyle = '#b8860b';
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-10, -10, 20, 20);
      ctx.restore();
    };
    drawCornerDiamond(48, 48);
    drawCornerDiamond(W - 48, 48);
    drawCornerDiamond(48, H - 48);
    drawCornerDiamond(W - 48, H - 48);

    // ── 6. Navy top header band ─────────────────────────────────────
    const headerH = 110;
    const headerGrad = ctx.createLinearGradient(0, 48, 0, 48 + headerH);
    headerGrad.addColorStop(0, '#0f2167');
    headerGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(48, 48, W - 96, headerH);

    // Gold accent line at bottom of header
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(48, 48 + headerH - 4, W - 96, 4);

    // Left emblem circle
    const embX = 118, embY = 48 + headerH / 2;
    ctx.fillStyle = '#d4a017';
    ctx.beginPath();
    ctx.arc(embX, embY, 30, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner circle
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(embX, embY, 22, 0, 2 * Math.PI);
    ctx.stroke();
    // Star symbol
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚕', embX, embY);

    // Right emblem circle (mirror)
    const embX2 = W - 118;
    ctx.fillStyle = '#d4a017';
    ctx.beginPath();
    ctx.arc(embX2, embY, 30, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(embX2, embY, 22, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚕', embX2, embY);

    // Header title text — centred between emblems
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('NATIONAL BOARD OF CONTINUING MEDICAL EDUCATION', W / 2, embY - 10);

    ctx.fillStyle = '#d4a017';
    ctx.font = '11px Georgia, serif';
    ctx.fillText('ACCREDITED CME CERTIFICATE OF CLINICAL EXCELLENCE  ·  INDIA', W / 2, embY + 14);

    // ── 7. Thin gold rule below header ─────────────────────────────
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, 48 + headerH + 14);
    ctx.lineTo(W - 100, 48 + headerH + 14);
    ctx.stroke();

    // ── 8. "This is to certify" italic line ────────────────────────
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('This is to officially certify that', W / 2, 200);

    // ── 9. Recipient name ──────────────────────────────────────────
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillText(cert.recipientName.toUpperCase(), W / 2, 255);

    // Name underline
    const nameWidth = ctx.measureText(cert.recipientName.toUpperCase()).width;
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameWidth / 2, 264);
    ctx.lineTo(W / 2 + nameWidth / 2, 264);
    ctx.stroke();

    // ── 10. Reg number ─────────────────────────────────────────────
    if (this.user?.registrationNo) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Georgia, serif';
      ctx.fillText(`Medical Reg. No: ${this.user.registrationNo}`, W / 2, 288);
    }

    // ── 11. Completion statement ───────────────────────────────────
    ctx.fillStyle = '#475569';
    ctx.font = '15px Georgia, serif';
    const completionText = cert.type === 'event'
      ? 'has successfully attended the accredited continuing medical education event'
      : 'has successfully completed the accredited medical continuing education course';
    ctx.fillText(completionText, W / 2, 326);

    // ── 12. Course/event title ─────────────────────────────────────
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`" ${cert.courseTitle} "`, W / 2, 368);

    // ── 13. Credits award pill ─────────────────────────────────────
    const pillW = 400, pillH = 42, pillX = W / 2 - pillW / 2, pillY = 392;
    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
    pillGrad.addColorStop(0, '#1e3a8a');
    pillGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    (ctx as any).roundRect(pillX, pillY, pillW, pillH, 21);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(`⚡  AWARDED ${cert.creditPoints} PRESERVED CME CREDIT POINT${cert.creditPoints > 1 ? 'S' : ''}`, W / 2, pillY + 27);

    // ── 14. Gold divider before footer ────────────────────────────
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 456);
    ctx.lineTo(W - 100, 456);
    ctx.stroke();

    // ── 15. Seal stamp (center) ────────────────────────────────────
    const sealX = W / 2, sealY = 548;
    // Outer ring
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 52, 0, 2 * Math.PI);
    ctx.fill();
    // Middle ring
    ctx.fillStyle = '#d4a017';
    ctx.beginPath();
    ctx.arc(sealX, sealY, 44, 0, 2 * Math.PI);
    ctx.fill();
    // Inner fill
    const sealGrad = ctx.createRadialGradient(sealX - 8, sealY - 8, 4, sealX, sealY, 40);
    sealGrad.addColorStop(0, '#fbbf24');
    sealGrad.addColorStop(1, '#b8860b');
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 40, 0, 2 * Math.PI);
    ctx.fill();
    // Seal text
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED', sealX, sealY - 5);
    ctx.fillText('CME 2026', sealX, sealY + 10);
    // Deco ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 36, 0, 2 * Math.PI);
    ctx.stroke();

    // ── 16. Issue date & verification (left) ──────────────────────
    ctx.fillStyle = '#475569';
    ctx.font = '13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Issue Date:`, 90, 490);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(cert.issueDate, 175, 490);

    ctx.fillStyle = '#475569';
    ctx.font = '13px Georgia, serif';
    ctx.fillText(`Verification:`, 90, 512);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText(cert.verificationCode, 175, 512);

    ctx.fillStyle = '#475569';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`Issuer: ${cert.issuer || 'ICCME – India'}`, 90, 534);

    // ── 17. Signature (right) ──────────────────────────────────────
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'italic bold 22px cursive, Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('Dr. V. K. Malhotra', W - 90, 500);

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(W - 280, 508);
    ctx.lineTo(W - 78, 508);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('Director of Medical Education', W - 90, 524);
    ctx.fillText('National Board of CME, India', W - 90, 540);

    // ── 18. Issuer info line ───────────────────────────────────────
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('This certificate is digitally verifiable. Scan or visit medcme.org/verify to confirm authenticity.', W / 2, 620);
    ctx.fillText(`Certificate ID: ${cert.id || cert.verificationCode}`, W / 2, 638);
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
