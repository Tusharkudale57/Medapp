import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { EmailService } from '../../services/email.service';
import { CmeEvent, EventRegistration, Course } from '../../models/course.model';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './host-dashboard.html',
  styleUrl: './host-dashboard.css'
})
export class HostDashboardComponent implements OnInit {
  showCreateModal = false;
  editingEventId: string | null = null;
  showAttendanceModal = false;
  selectedEventForAttendance: CmeEvent | null = null;
  copiedEventId = '';
  copiedCourseId = '';
  certIssuedMsg = '';
  absentMsg = '';
  presentMsg = '';

  // Admin section views toggle
  activeHostTab: 'events' | 'courses' | 'users' | 'settings' = 'events';
  coursesList: Course[] = [];
  searchUserQuery = '';

  // New Event Form
  newTitle = '';
  newDescription = '';
  newDate = '';
  newTime = '10:00 AM IST';
  newVenue = '';
  newMode: 'Online' | 'Offline' | 'Hybrid' = 'Online';
  newSpeaker = '';
  newSpeakerRole = '';
  newCategory = 'Cardiology';
  newCreditPoints = 1;
  newPrice = 0;
  newMaxSeats = 100;
  newBannerColor = '#0ea5e9';
  newPreRead = '';
  newZohoLink = '';
  uploadedFiles: Array<{ name: string; size: string; status: 'uploaded' | 'uploading' }> = [];

  onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const newFileItem: { name: string; size: string; status: 'uploaded' | 'uploading' } = {
        name: file.name,
        size: `${sizeMB} MB`,
        status: 'uploading'
      };
      
      this.uploadedFiles.push(newFileItem);

      // Read file content as DataURL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (typeof window !== 'undefined') {
          if (!(window as any).medcme_uploaded_files) {
            (window as any).medcme_uploaded_files = {};
          }
          (window as any).medcme_uploaded_files[file.name] = e.target.result;
        }
      };
      reader.readAsDataURL(file);

      // Simulate upload delay
      setTimeout(() => {
        newFileItem.status = 'uploaded';
        if (!this.newPreRead) {
          this.newPreRead = file.name;
        }
      }, 700);
    }
  }

  removeUploadedFile(index: number) {
    const fileName = this.uploadedFiles[index].name;
    this.uploadedFiles.splice(index, 1);
    
    if (typeof window !== 'undefined' && (window as any).medcme_uploaded_files) {
      delete (window as any).medcme_uploaded_files[fileName];
    }

    if (this.uploadedFiles.length === 0) {
      this.newPreRead = '';
    } else {
      this.newPreRead = this.uploadedFiles[0].name;
    }
  }

  readonly categories = ['Cardiology', 'Pediatrics', 'Neurology', 'Surgery', 'Endocrinology', 'Oncology', 'Psychiatry', 'General Medicine'];
  readonly colorOptions = ['#bae6fd', '#e0f2fe', '#dbeafe', '#93c5fd', '#a5f3fc', '#cbd5e1', '#c0e0de', '#f1f5f9'];

  constructor(
    public eventService: EventService,
    public authService: AuthService,
    public courseService: CourseService,
    public emailService: EmailService,
    private router: Router
  ) {}

  saveEmailSettings() {
    this.emailService.saveConfig(
      this.emailService.publicKey,
      this.emailService.serviceId,
      this.emailService.templateId
    );
    alert('EmailJS settings updated and saved to system registry!');
  }

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.coursesList = this.courseService.getCourses();
  }

  get filteredUsers() {
    const list = this.authService.users();
    if (!this.searchUserQuery.trim()) return list;
    const q = this.searchUserQuery.toLowerCase().trim();
    return list.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      (u.registrationNo && u.registrationNo.toLowerCase().includes(q)) ||
      u.specialty.toLowerCase().includes(q) ||
      (u.clinicAddress && u.clinicAddress.toLowerCase().includes(q)) ||
      (u.practicingInterest && u.practicingInterest.toLowerCase().includes(q))
    );
  }

  toggleUserStatus(user: any) {
    user.isSuspended = !user.isSuspended;
    alert(`Doctor "${user.name}" status updated successfully.`);
  }

  get hostEvents(): CmeEvent[] {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.eventService.getEventsByHost(user.id);
  }

  get totalRegistrations(): number {
    return this.hostEvents.reduce((sum, e) => sum + e.registeredCount, 0);
  }

  get totalPresent(): number {
    return this.hostEvents.reduce((sum, e) => sum + this.eventService.getPresentCount(e.id), 0);
  }

  get totalCertificatesIssued(): number {
    return this.hostEvents.reduce((sum, e) => sum + this.eventService.getCertificateIssuedCount(e.id), 0);
  }

  // --- Create & Edit Event -----------------------------------------------------------
  openCreateModal() {
    this.editingEventId = null;
    this.resetForm();
    this.showCreateModal = true;
  }

  openEditModal(event: CmeEvent) {
    this.editingEventId = event.id;
    this.newTitle = event.title;
    this.newDescription = event.description || '';
    this.newDate = event.date;
    this.newTime = event.time || '10:00 AM IST';
    this.newVenue = event.venue || '';
    this.newMode = event.mode || 'Online';
    this.newSpeaker = event.speaker || '';
    this.newSpeakerRole = event.speakerRole || '';
    this.newCategory = event.category || 'Cardiology';
    this.newCreditPoints = event.creditPoints || 1;
    this.newPrice = event.price || 0;
    this.newMaxSeats = event.maxSeats || 100;
    this.newBannerColor = event.bannerColor || '#0ea5e9';
    this.newPreRead = event.preRead || '';
    this.newZohoLink = event.zohoBackstageLink || '';
    if (event.preRead) {
      this.uploadedFiles = [{ name: event.preRead, size: 'N/A', status: 'uploaded' }];
    } else {
      this.uploadedFiles = [];
    }
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.editingEventId = null;
  }

  saveEvent() {
    if (!this.newTitle.trim() || !this.newDate || !this.newVenue.trim()) return;
    const user = this.authService.currentUser();
    if (!user) return;

    if (this.editingEventId) {
      const existing = this.eventService.getEventById(this.editingEventId);
      if (existing) {
        this.eventService.updateEvent({
          ...existing,
          title: this.newTitle,
          description: this.newDescription,
          date: this.newDate,
          time: this.newTime,
          venue: this.newVenue,
          mode: this.newMode,
          speaker: this.newSpeaker,
          speakerRole: this.newSpeakerRole,
          category: this.newCategory,
          creditPoints: this.newCreditPoints,
          price: this.newPrice,
          maxSeats: this.newMaxSeats,
          bannerColor: this.newBannerColor,
          preRead: this.newPreRead || 'ACLS_Standard_Protocols_Guideline.pdf',
          zohoBackstageLink: this.newZohoLink
        });
      }
      this.editingEventId = null;
    } else {
      this.eventService.addEvent({
        title: this.newTitle,
        description: this.newDescription,
        date: this.newDate,
        time: this.newTime,
        venue: this.newVenue,
        mode: this.newMode,
        speaker: this.newSpeaker,
        speakerRole: this.newSpeakerRole,
        category: this.newCategory,
        creditPoints: this.newCreditPoints,
        price: this.newPrice,
        maxSeats: this.newMaxSeats,
        bannerColor: this.newBannerColor,
        preRead: this.newPreRead || 'ACLS_Standard_Protocols_Guideline.pdf',
        zohoBackstageLink: this.newZohoLink
      }, user.id, user.name);
    }
    this.showCreateModal = false;
  }

  deleteEvent(eventId: string) {
    if (confirm('Are you sure you want to remove this event?')) {
      this.eventService.deleteEvent(eventId);
    }
  }

  // --- Attendance & Certificate -----------------------------------------------
  openAttendanceModal(event: CmeEvent) {
    this.selectedEventForAttendance = event;
    this.showAttendanceModal = true;
    this.certIssuedMsg = '';
    this.absentMsg = '';
    this.presentMsg = '';
  }

  closeAttendanceModal() {
    this.showAttendanceModal = false;
    this.selectedEventForAttendance = null;
  }

  getAttendees(eventId: string): EventRegistration[] {
    return this.eventService.getRegistrationsByEvent(eventId);
  }

  toggleAttendeeAttendance(reg: EventRegistration) {
    const nextVal = !reg.attended;
    this.eventService.markAttendance(reg.eventId, reg.userId, nextVal);
    const eventTitle = this.selectedEventForAttendance?.title || 'the event';
    if (nextVal) {
      this.presentMsg = `${reg.userName} was marked Present for ${eventTitle}`;
      this.absentMsg = '';
      setTimeout(() => this.presentMsg = '', 4500);
    } else {
      this.absentMsg = `${reg.userName} was marked Absent for ${eventTitle}`;
      this.presentMsg = '';
      setTimeout(() => this.absentMsg = '', 4500);
    }
    this.certIssuedMsg = '';
  }

  allocateCreditsToSelected() {
    if (!this.selectedEventForAttendance) return;
    const event = this.selectedEventForAttendance;
    const attendees = this.getAttendees(event.id);
    const selectedAttendees = attendees.filter(reg => reg.attended);

    if (selectedAttendees.length === 0) {
      alert('Please check at least one attendee to allocate credits.');
      return;
    }

    let count = 0;
    for (const reg of selectedAttendees) {
      if (!reg.certificateIssued) {
        // Mark certificate issued in event service
        this.eventService.markCertificateIssued(reg.eventId, reg.userId);
        // Issue event certificate to doctor's profile
        this.authService.issueEventCertificate(
          reg.userId,
          reg.eventId,
          event.title,
          event.creditPoints,
          reg.userName
        );
        count++;
      }
    }

    if (count > 0) {
      this.certIssuedMsg = `Successfully allocated CME credit points and issued certificates to ${count} selected attendee(s)!`;
    } else {
      this.certIssuedMsg = `Selected attendees already have credits allocated.`;
    }
    setTimeout(() => this.certIssuedMsg = '', 5000);
  }

  sendCourseLinkWhatsApp(course: Course) {
    const courseUrl = window.location.origin + '/course/' + course.id;
    const text = `Hi Doctor, please register for the CME course: "${course.title}". Enrolling gives you accredited CME points. Enroll here: ${courseUrl}`;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
  }

  copyCourseLink(course: Course) {
    const courseUrl = window.location.origin + '/course/' + course.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(courseUrl).then(() => {
        this.copiedCourseId = course.id;
        setTimeout(() => this.copiedCourseId = '', 2500);
      });
    }
  }

  downloadCsvReport() {
    if (!this.selectedEventForAttendance) return;
    const event = this.selectedEventForAttendance;
    const attendees = this.getAttendees(event.id);
    
    if (attendees.length === 0) {
      alert('No registrations to download.');
      return;
    }

    // CSV Headers
    const headers = ['Doctor Name', 'Email', 'Mobile Number', 'Registration Status', 'Attended (Y/N)', 'Credits Status', 'Registered At'];
    
    // CSV Rows
    const rows = attendees.map(reg => [
      `"${reg.userName.replace(/"/g, '""')}"`,
      `"${(reg.userEmail || '').replace(/"/g, '""')}"`,
      `"${(reg.userPhone || '9876543210').replace(/"/g, '""')}"`,
      `"${reg.paymentStatus.toUpperCase()}"`,
      `"${reg.attended ? 'Y' : 'N'}"`,
      `"${reg.certificateIssued ? 'Allocated' : 'Pending'}"`,
      `"${new Date(reg.registeredAt).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CME_Event_Report_${event.title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getEnrolledCount(eventId: string): number {
    return this.eventService.getEnrolledCount(eventId);
  }

  getPresentCount(eventId: string): number {
    return this.eventService.getPresentCount(eventId);
  }

  getAbsentCount(eventId: string): number {
    return this.eventService.getAbsentCount(eventId);
  }

  getCertIssuedCount(eventId: string): number {
    return this.eventService.getCertificateIssuedCount(eventId);
  }

  getAttendancePercent(eventId: string): number {
    const enrolled = this.getEnrolledCount(eventId);
    if (enrolled === 0) return 0;
    return Math.round((this.getPresentCount(eventId) / enrolled) * 100);
  }

  // --- Sharing ----------------------------------------------------------------
  copyPaymentLink(event: CmeEvent) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(event.paymentLink).then(() => {
        this.copiedEventId = event.id;
        setTimeout(() => this.copiedEventId = '', 2500);
      });
    }
  }

  shareOnWhatsApp(event: CmeEvent) {
    const url = this.eventService.getWhatsAppShareUrl(event);
    window.open(url, '_blank');
  }

  formatDate(dateStr: string): string {
    return this.eventService.formatDate(dateStr);
  }

  seatsLeft(event: CmeEvent): number {
    return this.eventService.getSeatsLeft(event);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  toggleRole() {
    this.authService.toggleUserRole();
    if (this.authService.isAdmin()) {
      this.router.navigate(['/host-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private resetForm() {
    this.newTitle = '';
    this.newDescription = '';
    this.newDate = '';
    this.newTime = '10:00 AM IST';
    this.newVenue = '';
    this.newMode = 'Online';
    this.newSpeaker = '';
    this.newSpeakerRole = '';
    this.newCategory = 'Cardiology';
    this.newCreditPoints = 1;
    this.newPrice = 0;
    this.newMaxSeats = 100;
    this.newBannerColor = '#0ea5e9';
    this.newPreRead = '';
    this.newZohoLink = '';
    this.uploadedFiles = [];
  }
}
