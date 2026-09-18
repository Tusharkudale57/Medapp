import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { EmailService } from '../../services/email.service';
import { EventRegistration, Course,EventResponse ,CreateEventRequest} from '../../models/course.model';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './host-dashboard.html',
  styleUrl: './host-dashboard.css'
})
export class HostDashboardComponent implements OnInit {

  showCreateModal = false;

  editingEventId: number | null = null;
  syncingEventId: number | null = null;
 publishingEventId: number | null = null;

  showAttendanceModal = false;
  selectedEventForAttendance: EventResponse | null = null;

  showEventDetailModal = false;
  selectedEventForDetail: EventResponse | null = null;
  copiedEventId: string | number = '';
  copiedCourseId = '';

  certIssuedMsg = '';
  absentMsg = '';
  presentMsg = '';

  // Admin section views toggle
  activeHostTab: 'events' | 'courses' | 'users' | 'settings' = 'events';

  coursesList: Course[] = [];
  searchUserQuery = '';

  minEventDate = '';

  // ---------------------------------------------------------------------------
  // Event form
  // ---------------------------------------------------------------------------

  newTitle = '';
  newDescription = '';
  newDate = '';
  newTime = '10:00 AM IST';

  /**
   * Backend EventResponse currently does not have a separate venue field.
   * We continue using this UI field and map it to joinLink.
   */
  newVenue = '';

  newMode: 'Online' | 'Offline' | 'Hybrid' = 'Online';

  newSpeaker = '';
  newSpeakerEmail = '';
  newSpeakerRole = '';
  newCategory = 'Cardiology';

  newCreditPoints = 1;
  newPrice = 0;
  newMaxSeats = 100;

  newBannerColor = '#0ea5e9';

  /**
   * Backend EventResponse does not currently expose a preRead field.
   * Keep this UI field for now so the existing HTML continues to work.
   */
  newPreRead = '';

  newZohoLink = '';

  newStreamEmbedUrl = '';
  selectedRecordingFiles: { [eventId: string]: File | undefined } = {};
  uploadedFiles: Array<{
    name: string;
    size: string;
    status: 'uploaded' | 'uploading';
  }> = [];

  selectedDocuments: File[] = [];
  selectedPhoto: File | null = null;

  readonly categories = [
    'Cardiology',
    'Pediatrics',
    'Neurology',
    'Surgery',
    'Endocrinology',
    'Oncology',
    'Psychiatry',
    'General Medicine'
  ];

  readonly colorOptions = [
    '#bae6fd',
    '#e0f2fe',
    '#dbeafe',
    '#93c5fd',
    '#a5f3fc',
    '#cbd5e1',
    '#c0e0de',
    '#f1f5f9'
  ];

  constructor(
    public eventService: EventService,
    public authService: AuthService,
    public courseService: CourseService,
    public emailService: EmailService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  ngOnInit(): void {

    // if (!this.authService.isAdmin()) {
    //   this.router.navigate(['/dashboard']);
    //   return;
    // }

    this.coursesList = this.courseService.getCourses();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');

    this.minEventDate = `${year}-${month}-${day}`;

    // Load events from backend.
    this.eventService.getAllEvents(0, 100).subscribe({
      next: response => {
        // console.log('Host dashboard events loaded:', response.data.content);
      },
      error: error => {
        console.error('Failed to load events:', error);
      }
    });
  }

  // ===========================================================================
  // USERS
  // ===========================================================================

  get filteredUsers() {
    const list = this.authService.users();

    if (!this.searchUserQuery.trim()) {
      return list;
    }

    const q = this.searchUserQuery.toLowerCase().trim();

    return list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.registrationNo &&
        u.registrationNo.toLowerCase().includes(q)) ||
      u.specialty.toLowerCase().includes(q) ||
      (u.clinicAddress &&
        u.clinicAddress.toLowerCase().includes(q)) ||
      (u.practicingInterest &&
        u.practicingInterest.toLowerCase().includes(q))
    );
  }

  toggleUserStatus(user: any): void {
    user.isSuspended = !user.isSuspended;

    alert(
      `Doctor "${user.name}" status updated successfully.`
    );
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  /**
   * EventService is now the single source of truth.
   *
   * IMPORTANT:
   * The current backend EventResponse does not contain hostId.
   * Therefore we cannot filter events by host using getEventsByHost().
   *
   * For now, host dashboard displays all events returned by EventService.
   *
   * Once backend adds hostId/host endpoint, this getter can be changed.
   */
  get hostEvents(): EventResponse[] {
    return this.eventService.events();
  }

  /**
   * EventResponse does not currently contain registeredCount.
   * Therefore this cannot be calculated from the event response alone.
   *
   * Returning 0 keeps the dashboard safe until registration statistics
   * are provided by the backend.
   */
  get totalRegistrations(): number {
    return 0;
  }

  get totalPresent(): number {
    return this.hostEvents.reduce(
      (sum, event) =>
        sum + this.eventService.getPresentCount(String(event.id)),
      0
    );
  }

  get totalCertificatesIssued(): number {
    return this.hostEvents.reduce(
      (sum, event) =>
        sum + this.eventService.getCertificateIssuedCount(String(event.id)),
      0
    );
  }

  // ===========================================================================
  // DATE / TIME
  // ===========================================================================

  private convertTimeToLocalDateTime(
    date: string,
    time: string
  ): string {

    const cleanTime = time
      .replace(/\s*IST\s*/i, '')
      .trim();

    const match = cleanTime.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!match) {
      throw new Error(`Invalid event time: ${time}`);
    }

    let hour = Number(match[1]);
    const minute = match[2];
    const period = match[3].toUpperCase();

    if (period === 'AM' && hour === 12) {
      hour = 0;
    } else if (period === 'PM' && hour !== 12) {
      hour += 12;
    }

    return `${date}T${hour
      .toString()
      .padStart(2, '0')}:${minute}:00`;
  }

  formatDate(dateStr: string): string {
    return this.eventService.formatDate(dateStr);
  }

  // ===========================================================================
  // CREATE / EDIT EVENT
  // ===========================================================================

  openCreateModal(): void {
    this.editingEventId = null;

    this.resetForm();

    this.selectedDocuments = [];
    this.selectedPhoto = null;

    this.showCreateModal = true;
  }

  openEditModal(event: EventResponse): void {

    this.editingEventId = event.id;

    this.newTitle = event.title;
    this.newDescription = event.description || '';

    const eventDate = new Date(event.eventDateTime);

    if (!Number.isNaN(eventDate.getTime())) {
      this.newDate = event.eventDateTime.substring(0, 10);

      let hours = eventDate.getHours();
      const minutes = eventDate.getMinutes();

      const period = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;

      if (hours === 0) {
        hours = 12;
      }

      this.newTime =
        `${hours}:${String(minutes).padStart(2, '0')} ${period} IST`;
    } else {
      this.newDate = '';
      this.newTime = '10:00 AM IST';
    }

    /**
     * Backend does not have venue.
     * Existing UI venue is mapped to joinLink.
     */
    this.newVenue = event.joinLink || '';

    this.newMode = this.toUiMode(event.mode);

    this.newSpeaker = event.speakerName || '';
    this.newSpeakerRole = event.speakerRole || '';

    this.newCategory = event.category || 'Cardiology';

    this.newCreditPoints = event.cmeCreditPoints ?? 1;

    this.newPrice = event.registrationFee ?? 0;

    this.newMaxSeats = event.maxSeats ?? 100;

    this.newBannerColor =
      event.cardAccentColor || '#0ea5e9';

    this.newZohoLink =
      event.zohoBackstageLink || '';

    /**
     * Backend response has documents instead of preRead.
     */
    if (event.documents && event.documents.length > 0) {

      const firstDocument = event.documents[0];

      this.newPreRead = firstDocument.fileName;

      this.uploadedFiles = event.documents.map(document => ({
        name: document.fileName,
        size: this.formatFileSize(document.fileSize),
        status: 'uploaded' as const
      }));

    } else {

      this.newPreRead = '';
      this.uploadedFiles = [];
    }

    this.selectedDocuments = [];
    this.selectedPhoto = null;

    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.editingEventId = null;
  }

  canSaveEvent(): boolean {
    return Boolean(
      this.newTitle.trim() &&
      this.newDate &&
      this.newVenue.trim() &&
      this.hasValidSpeakerFields()
    );
  }

  private hasValidSpeakerFields(): boolean {
    return Boolean(
      this.newSpeaker.trim() &&
      this.newSpeakerRole.trim()
    );
  }

  saveEvent(): void {

    if (
      !this.newTitle.trim() ||
      !this.newDate
    ) {
      alert('Please enter the event title and date.');
      return;
    }

    const user = this.authService.currentUser();

    if (!user) {
      alert('User session not found.');
      return;
    }

    let eventTime: string;

    try {

      eventTime = this.convertTimeToLocalDateTime(
        this.newDate,
        this.newTime
      );

    } catch (error) {

      console.error(error);

      alert('Please enter a valid event time.');
      return;
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    if (this.editingEventId !== null) {

      const eventId = this.editingEventId;

      const request: CreateEventRequest = {
        speakerName: this.newSpeaker,
        speakerRole: this.newSpeakerRole,
          speakerEmail: this.newSpeakerEmail,
        title: this.newTitle,
        description: this.newDescription,

        sequenceNo: 1,

        eventDate: `${this.newDate}T00:00:00`,
        eventTime: eventTime,

        joinLink: this.newVenue || '',
        zohoBackstageLink: this.newZohoLink || '',

        mode: this.newMode.toUpperCase(),
        category: this.newCategory,

        mandatory: false,

        cmeCreditPoints: this.newCreditPoints,
        registrationFee: this.newPrice,
        maxSeats: this.newMaxSeats,

        cardAccentColor: this.newBannerColor
      };

      this.eventService
        .updateEvent(eventId, request)
        .subscribe({

          next: response => {

            console.log(
              'Event updated successfully:',
              response
            );

            alert('Event updated successfully.');

            this.showCreateModal = false;
            this.editingEventId = null;

            this.resetForm();
          },

          error: error => {

            console.error(
              'Update event failed:',
              error
            );

            alert(
              error?.error?.message ||
              'Failed to update event.'
            );
          }

        });

      return;
    }

    // ========================================================================
    // CREATE
    // ========================================================================

    const request: CreateEventRequest = {

      speakerName: this.newSpeaker,
      speakerRole: this.newSpeakerRole,
      speakerEmail: this.newSpeakerEmail,

      title: this.newTitle,
      description: this.newDescription,

      sequenceNo: 1,

      eventDate: `${this.newDate}T00:00:00`,
      eventTime: eventTime,

      joinLink: this.newVenue || '',
      zohoBackstageLink: this.newZohoLink || '',

      mode: this.newMode.toUpperCase(),
      category: this.newCategory,

      mandatory: false,

      cmeCreditPoints: this.newCreditPoints,
      registrationFee: this.newPrice,
      maxSeats: this.newMaxSeats,

      cardAccentColor: this.newBannerColor
    };

    this.eventService
      .createEvent(
        request,
        this.selectedPhoto,
        this.selectedDocuments
      )
      .subscribe({

        next: response => {

          console.log(
            'Event created successfully:',
            response
          );

          alert('Event created successfully.');

          this.showCreateModal = false;

          this.resetForm();

          this.selectedDocuments = [];
          this.selectedPhoto = null;
        },

        error: error => {

          console.error(
            'Create event failed:',
            error
          );

          alert(
            error?.error?.message ||
            'Failed to create event.'
          );
        }

      });
  }

  // ===========================================================================
  // DELETE EVENT
  // ===========================================================================

  deleteEvent(eventId: number): void {

    if (
      !confirm(
        'Are you sure you want to remove this event?'
      )
    ) {
      return;
    }

    this.eventService
      .deleteEvent(eventId)
      .subscribe({

        next: response => {

          console.log(
            'Event deleted successfully:',
            response
          );

          alert('Event deleted successfully.');
        },

        error: error => {

          console.error(
            'Delete event failed:',
            error
          );

          alert(
            error?.error?.message ||
            'Failed to delete event.'
          );
        }

      });
  }

  // ===========================================================================
  // ATTENDANCE
  // ===========================================================================

  openAttendanceModal(
    event: EventResponse
  ): void {

    this.selectedEventForAttendance = event;

    this.showAttendanceModal = true;

    this.certIssuedMsg = '';
    this.absentMsg = '';
    this.presentMsg = '';
  }

  onRecordingSelected(eventId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedRecordingFiles[eventId] = input.files?.[0];
  }

  uploadRecording(eventId: string) {
    const recording = this.selectedRecordingFiles[eventId];
    if (!recording) {
      alert('Please choose a recording file first.');
      return;
    }
    // Recording upload is not part of the current EventService/backend contract.
    // Keep the UI handler safe until a recording endpoint is added.
    alert('Recording upload is not available yet.');
    this.selectedRecordingFiles[eventId] = undefined;
  }

  getRecordingDownloadUrl(event: EventResponse): string | null {
    return null;
  }

  isRecordingAvailable(event: EventResponse): boolean {
    return false;
  }

  closeAttendanceModal(): void {

    this.showAttendanceModal = false;

    this.selectedEventForAttendance = null;
  }

  getAttendees(eventId: number): EventRegistration[] {

    return this.eventService
      .getRegistrationsByEvent(String(eventId));
  }

  toggleAttendeeAttendance(
    reg: EventRegistration
  ): void {

    const nextVal = !reg.attended;

    this.eventService.markAttendance(
      reg.eventId,
      reg.userId,
      nextVal
    );

    const eventTitle =
      this.selectedEventForAttendance?.title ||
      'the event';

    if (nextVal) {

      this.presentMsg =
        `${reg.userName} was marked Present for ${eventTitle}`;

      this.absentMsg = '';

      setTimeout(
        () => this.presentMsg = '',
        4500
      );

    } else {

      this.absentMsg =
        `${reg.userName} was marked Absent for ${eventTitle}`;

      this.presentMsg = '';

      setTimeout(
        () => this.absentMsg = '',
        4500
      );
    }

    this.certIssuedMsg = '';
  }

  allocateCreditsToSelected(): void {

    if (!this.selectedEventForAttendance) {
      return;
    }

    const event =
      this.selectedEventForAttendance;

    const attendees =
      this.getAttendees(event.id);

    const selectedAttendees =
      attendees.filter(reg => reg.attended);

    if (selectedAttendees.length === 0) {

      alert(
        'Please check at least one attendee to allocate credits.'
      );

      return;
    }

    let count = 0;

    for (const reg of selectedAttendees) {

      if (!reg.certificateIssued) {

        this.eventService.markCertificateIssued(
          reg.eventId,
          reg.userId
        );

        this.authService.issueEventCertificate(
          reg.userId,
          reg.eventId,
          event.title,
          event.cmeCreditPoints ?? 0,
          reg.userName
        );

        count++;
      }
    }

    if (count > 0) {

      this.certIssuedMsg =
        `Successfully allocated CME credit points and issued certificates to ${count} selected attendee(s)!`;

    } else {

      this.certIssuedMsg =
        'Selected attendees already have credits allocated.';
    }

    setTimeout(
      () => this.certIssuedMsg = '',
      5000
    );
  }

  // ===========================================================================
  // COURSE SHARING
  // ===========================================================================

  sendCourseLinkWhatsApp(
    course: Course
  ): void {

    const courseUrl =
      window.location.origin +
      '/course/' +
      course.id;

    const text =
      `Hi Doctor, please register for the CME course: "${course.title}". Enrolling gives you accredited CME points. Enroll here: ${courseUrl}`;

    window.open(
      'https://api.whatsapp.com/send?text=' +
      encodeURIComponent(text),
      '_blank'
    );
  }

  copyCourseLink(course: Course): void {

    const courseUrl =
      window.location.origin +
      '/course/' +
      course.id;

    if (navigator.clipboard) {

      navigator.clipboard
        .writeText(courseUrl)
        .then(() => {

          this.copiedCourseId = course.id;

          setTimeout(
            () => this.copiedCourseId = '',
            2500
          );
        });
    }
  }

  // ===========================================================================
  // CSV REPORT
  // ===========================================================================

  downloadCsvReport(): void {

    if (!this.selectedEventForAttendance) {
      return;
    }

    const event =
      this.selectedEventForAttendance;

    const attendees =
      this.getAttendees(event.id);

    if (attendees.length === 0) {

      alert(
        'No registrations to download.'
      );

      return;
    }

    const headers = [
      'Doctor Name',
      'Email',
      'Mobile Number',
      'Registration Status',
      'Attended (Y/N)',
      'Credits Status',
      'Registered At'
    ];

    const rows = attendees.map(reg => [

      `"${reg.userName.replace(/"/g, '""')}"`,

      `"${(reg.userEmail || '')
        .replace(/"/g, '""')}"`,

      `"${(reg.userPhone || '9876543210')
        .replace(/"/g, '""')}"`,

      `"${reg.paymentStatus.toUpperCase()}"`,

      `"${reg.attended ? 'Y' : 'N'}"`,

      `"${reg.certificateIssued
        ? 'Allocated'
        : 'Pending'}"`,

      `"${new Date(
        reg.registeredAt
      ).toLocaleString()}"`
    ]);

    const csvContent =
      [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

    const blob =
      new Blob(
        [csvContent],
        {
          type: 'text/csv;charset=utf-8;'
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.setAttribute(
      'href',
      url
    );

    link.setAttribute(
      'download',
      `CME_Event_Report_${event.title
        .replace(/\s+/g, '_')}.csv`
    );

    link.style.visibility = 'hidden';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // ===========================================================================
  // ATTENDANCE COUNTS
  // ===========================================================================

  getEnrolledCount(eventId: number): number {

    return this.eventService
      .getEnrolledCount(String(eventId));
  }

  getPresentCount(eventId: number): number {

    return this.eventService
      .getPresentCount(String(eventId));
  }

  getAbsentCount(eventId: number): number {

    return this.eventService
      .getAbsentCount(String(eventId));
  }

  getCertIssuedCount(eventId: number): number {

    return this.eventService
      .getCertificateIssuedCount(String(eventId));
  }

  getAttendancePercent(eventId: number): number {

    const enrolled =
      this.getEnrolledCount(eventId);

    if (enrolled === 0) {
      return 0;
    }

    return Math.round(
      (this.getPresentCount(eventId) /
        enrolled) *
      100
    );
  }

  // ===========================================================================
  // SHARING
  // ===========================================================================

  copyPaymentLink(
    event: EventResponse
  ): void {

    /**
     * There is no paymentLink in EventResponse.
     * Use joinLink until a dedicated payment URL is added to backend.
     */
    const link =
      event.joinLink || '';

    if (!link) {

      alert(
        'No event link is available for this event.'
      );

      return;
    }

    if (navigator.clipboard) {

      navigator.clipboard
        .writeText(link)
        .then(() => {

          this.copiedEventId = event.id;

          setTimeout(
            () => this.copiedEventId = '',
            2500
          );
        });
    }
  }

  shareOnWhatsApp(
    event: EventResponse
  ): void {

    const url =
      this.eventService
        .getWhatsAppShareUrl(event);

    window.open(
      url,
      '_blank'
    );
  }

  // ===========================================================================
  // SEATS
  // ===========================================================================

  seatsLeft(event: EventResponse): number {

    const seats =
      this.eventService.getSeatsLeft(event);

    return seats ?? 0;
  }

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  backToDashboard(): void {

    this.router.navigate([
      '/dashboard'
    ]);
  }

  toggleRole(): void {

    this.authService.toggleUserRole();

    if (this.authService.isAdmin()) {

      this.router.navigate([
        '/host-dashboard'
      ]);

    } else {

      this.router.navigate([
        '/dashboard'
      ]);
    }
  }

  // ===========================================================================
  // FILES
  // ===========================================================================

  onFileSelected(event: any): void {

    const files: FileList =
      event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    for (
      let i = 0;
      i < files.length;
      i++
    ) {

      const file = files[i];

      this.selectedDocuments.push(file);

      const sizeMB =
        (
          file.size /
          (1024 * 1024)
        ).toFixed(1);

      this.uploadedFiles.push({

        name: file.name,

        size: `${sizeMB} MB`,

        status: 'uploaded'
      });

      if (!this.newPreRead) {
        this.newPreRead = file.name;
      }
    }
  }

  onPhotoSelected(event: any): void {

    const files: FileList =
      event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    this.selectedPhoto = files[0];
  }

  removeUploadedFile(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.uploadedFiles.length
    ) {
      return;
    }

    const fileName =
      this.uploadedFiles[index].name;

    this.uploadedFiles.splice(
      index,
      1
    );

    this.selectedDocuments =
      this.selectedDocuments.filter(
        file => file.name !== fileName
      );

    if (
      typeof window !== 'undefined' &&
      (window as any).medcme_uploaded_files
    ) {

      delete (
        window as any
      ).medcme_uploaded_files[fileName];
    }

    if (
      this.uploadedFiles.length === 0
    ) {

      this.newPreRead = '';

    } else {

      this.newPreRead =
        this.uploadedFiles[0].name;
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private toUiMode(
    mode: string
  ): 'Online' | 'Offline' | 'Hybrid' {

    switch (
      mode?.toUpperCase()
    ) {

      case 'OFFLINE':
        return 'Offline';

      case 'HYBRID':
        return 'Hybrid';

      case 'ONLINE':
      default:
        return 'Online';
    }
  }

  private formatFileSize(
    bytes: number
  ): string {

    if (!bytes || bytes <= 0) {
      return 'N/A';
    }

    const mb =
      bytes / (1024 * 1024);

    return `${mb.toFixed(1)} MB`;
  }

  private resetForm(): void {

    this.newTitle = '';
    this.newDescription = '';

    this.newDate = '';
    this.newTime = '10:00 AM IST';

    this.newVenue = '';

    this.newMode = 'Online';

    this.newSpeaker = '';
    this.newSpeakerEmail = '';
    this.newSpeakerRole = '';

    this.newCategory = 'Cardiology';

    this.newCreditPoints = 1;
    this.newPrice = 0;
    this.newMaxSeats = 100;

    this.newBannerColor = '#0ea5e9';

    this.newPreRead = '';
    this.newZohoLink = '';
    this.newStreamEmbedUrl = '';
    this.uploadedFiles = [];

    this.selectedDocuments = [];
    this.selectedPhoto = null;
  }

  saveEmailSettings(): void {
  this.emailService.saveConfig(
    this.emailService.publicKey,
    this.emailService.serviceId,
    this.emailService.templateId
  );

  alert('EmailJS settings updated and saved to system registry!');
}

syncEventWithZoho(event: EventResponse): void {
  if (!event?.id) {
    return;
  }

  this.syncingEventId = event.id;

  this.eventService.syncEventFromZoho(event.id).subscribe({
    next: (response) => {
      this.syncingEventId = null;

      if (response?.success) {
        alert(
          response.message || 'Event synced with Zoho successfully.'
        );

        // Update current event with latest backend data
        if (response.data) {
          Object.assign(event, response.data);
        }
      } else {
        alert(
          response?.message || 'Failed to sync event with Zoho.'
        );
      }
    },

    error: (error) => {
      this.syncingEventId = null;

      const message =
        error?.error?.message ||
        error?.message ||
        'Failed to sync event with Zoho.';

      alert(message);
    }
  });
}

toggleEventPublishStatus(event: EventResponse): void {
  if (!event?.id) {
    return;
  }

  const isPublished =
    event.status?.toUpperCase() === 'PUBLISHED';

  this.publishingEventId = event.id;

  const request$ = isPublished
    ? this.eventService.unpublishEvent(event.id)
    : this.eventService.publishEvent(event.id);

  request$.subscribe({
    next: (response) => {
      this.publishingEventId = null;

      if (response?.success) {

        if (response.data) {
          Object.assign(event, response.data);
        } else {
          event.status = isPublished
            ? 'UNPUBLISHED'
            : 'PUBLISHED';
        }

        alert(
          response.message ||
          (isPublished
            ? 'Event unpublished successfully.'
            : 'Event published successfully.')
        );

      } else {
        alert(
          response?.message ||
          (isPublished
            ? 'Failed to unpublish event.'
            : 'Failed to publish event.')
        );
      }
    },

    error: (error) => {
      this.publishingEventId = null;

      const message =
        error?.error?.message ||
        error?.message ||
        (isPublished
          ? 'Failed to unpublish event.'
          : 'Failed to publish event.');

      alert(message);
    }
  });
}
}