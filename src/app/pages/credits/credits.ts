import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { CourseService } from '../../services/course.service';
import { Certificate, CmeEvent, EventRegistration } from '../../models/course.model';

interface LedgerItem {
  title: string;
  date: string;
  type: 'Course' | 'Event';
  credits: number;
  status: 'Approved' | 'Under Review' | 'Revoked';
  certificateId: string;
}

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credits.html',
  styleUrl: './credits.css'
})
export class CreditsComponent implements OnInit {
  ledger: LedgerItem[] = [];
  
  // KPI summary
  totalCreditsEarned = 0;
  pendingCredits = 0;
  adjustedCredits = 0;

  // Discrepancy Modal
  showDiscrepancyModal = false;
  discrepancySubject = '';
  discrepancyMessage = '';
  discrepancySubmitted = false;

  private isBrowser: boolean;

  constructor(
    public authService: AuthService,
    private eventService: EventService,
    private courseService: CourseService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // Redirect if not logged in
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }
    this.buildLedger();
  }

  buildLedger() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.ledger = [];
    this.totalCreditsEarned = 0;
    this.pendingCredits = 0;

    // 1. Add Completed Courses (Approved status)
    const certs = this.authService.getUserCertificates();
    for (const cert of certs) {
      this.ledger.push({
        title: cert.courseTitle,
        date: cert.issueDate,
        type: cert.type === 'event' ? 'Event' : 'Course',
        credits: cert.creditPoints,
        status: 'Approved',
        certificateId: cert.verificationCode
      });
      this.totalCreditsEarned += cert.creditPoints;
    }

    // 2. Add Registered Live Events that are pending
    const upcomingEvents = this.eventService.getUpcomingEvents();
    const userRegs = upcomingEvents.filter(e => this.eventService.isRegistered(e.id, user.id));

    for (const event of userRegs) {
      const reg = this.eventService.getRegistration(event.id, user.id);
      if (reg && !reg.certificateIssued) {
        this.ledger.push({
          title: event.title,
          date: event.date,
          type: 'Event',
          credits: event.creditPoints,
          status: 'Under Review',
          certificateId: 'N/A'
        });
        this.pendingCredits += event.creditPoints;
      }
    }

    // 3. Add one mock adjusted credit row for UI presentation
    this.adjustedCredits = 1.0;
    this.ledger.push({
      title: 'Prior Council Transfer Credit Adjustment',
      date: '2026-04-10',
      type: 'Course',
      credits: 1.0,
      status: 'Approved',
      certificateId: 'ADJ-8820'
    });
    this.totalCreditsEarned += 1.0;
  }

  openDiscrepancyModal() {
    this.showDiscrepancyModal = true;
    this.discrepancySubmitted = false;
  }

  closeDiscrepancyModal() {
    this.showDiscrepancyModal = false;
    this.discrepancySubject = '';
    this.discrepancyMessage = '';
  }

  submitDiscrepancy() {
    if (!this.discrepancySubject.trim() || !this.discrepancyMessage.trim()) {
      alert('Please fill out all discrepancy report fields.');
      return;
    }
    this.discrepancySubmitted = true;
    setTimeout(() => {
      alert('Audit request filed successfully! Our team will contact you within 3 business days.');
      this.closeDiscrepancyModal();
    }, 1500);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToMyLearning() {
    this.router.navigate(['/my-learning']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}
