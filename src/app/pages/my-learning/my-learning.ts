import { Component, OnInit, ElementRef, ViewChild, Inject, PLATFORM_ID, signal, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { EventService } from '../../services/event.service';
import { Course, CmeEvent, Certificate, EventRegistration } from '../../models/course.model';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-learning.html',
  styleUrl: './my-learning.css'
})
export class MyLearningComponent implements OnInit {
  activeTab = signal<'in_progress' | 'completed' | 'certificates'>('in_progress');
  
  // Greeting state
  greeting: string = 'Welcome';

  showExploreMenu = false;
  activeSubMenu = 'specialties';
  
  // Certificate viewer state
  selectedCertificate: Certificate | null = null;
  showCertModal = false;

  // Edit Goal Modal state
  showGoalModal = false;
  userCareerGoal = 'IT Project Manager'; // Default matching screenshot

  // Event Detail Modal state
  showEventDetailModal = false;
  selectedEventForDetail: CmeEvent | null = null;

  // Live Room State
  showLiveRoomModal = false;
  activeLiveEvent: CmeEvent | null = null;
  liveChatMessages: Array<{ sender: string; text: string; time: string; isUser: boolean }> = [];
  newChatMessageText = '';

  // MCQ state
  basicMcqAnswered = false;
  basicMcqSelectedOption = -1;
  basicMcqIsCorrect: boolean | null = null;

  midMcqAnswered = false;
  midMcqSelectedOption = -1;
  midMcqIsCorrect: boolean | null = null;

  // Live Room Notes & Feedback states
  liveRoomNotes = '';
  liveFeedbackSubmitted = false;
  liveFeedbackRating = 0;
  liveFeedbackText = '';
  liveSessionCompleted = false;

  @ViewChild('certCanvas') certCanvas!: ElementRef<HTMLCanvasElement>;

  private isBrowser: boolean;

  constructor(
    public authService: AuthService,
    private courseService: CourseService,
    private eventService: EventService,
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

    // Set greeting based on current hour
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Good morning';
    } else if (hour < 17) {
      this.greeting = 'Good afternoon';
    } else {
      this.greeting = 'Good evening';
    }

    // Restore goal from localStorage if available
    if (this.isBrowser) {
      const savedGoal = localStorage.getItem('medcme_career_goal');
      if (savedGoal) {
        this.userCareerGoal = savedGoal;
      }
    }
  }

  // --- Career Goal ---
  openGoalModal() {
    this.showGoalModal = true;
  }

  closeGoalModal() {
    this.showGoalModal = false;
  }

  saveGoal(newGoal: string) {
    if (newGoal.trim()) {
      this.userCareerGoal = newGoal.trim();
      if (this.isBrowser) {
        localStorage.setItem('medcme_career_goal', this.userCareerGoal);
      }
    }
    this.closeGoalModal();
  }

  // --- Filtering Methods ---
  setTab(tab: 'in_progress' | 'completed' | 'certificates') {
    this.activeTab.set(tab);
  }

  get inProgressCourses(): Course[] {
    const allCourses = this.courseService.getCourses();
    return allCourses.filter(c => 
      this.authService.isCoursePurchased(c.id) && !this.authService.isCourseCompleted(c.id)
    );
  }

  get completedCourses(): Course[] {
    const allCourses = this.courseService.getCourses();
    return allCourses.filter(c => 
      this.authService.isCourseCompleted(c.id)
    );
  }

  get registeredEvents(): CmeEvent[] {
    const user = this.authService.currentUser();
    if (!user) return [];
    
    // Get all events from service
    const allEvents = this.eventService.getUpcomingEvents();
    
    // Filter events where registration exists for user
    return allEvents.filter(e => this.eventService.isRegistered(e.id, user.id));
  }

  get inProgressEvents(): CmeEvent[] {
    // An event is in progress if registered, but not yet attended/completed
    const user = this.authService.currentUser();
    if (!user) return [];

    return this.registeredEvents.filter(e => {
      const reg = this.eventService.getRegistration(e.id, user.id);
      return reg ? !reg.attended : true;
    });
  }

  get completedEvents(): CmeEvent[] {
    const user = this.authService.currentUser();
    if (!user) return [];

    return this.registeredEvents.filter(e => {
      const reg = this.eventService.getRegistration(e.id, user.id);
      return reg ? reg.attended : false;
    });
  }

  get certificates(): Certificate[] {
    return this.authService.getUserCertificates();
  }

  // --- Course Navigation ---
  resumeCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  viewCourseDetail(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  // --- Navigation Header Links ---
  openEventDetail(event: CmeEvent) {
    this.selectedEventForDetail = event;
    this.showEventDetailModal = true;
  }

  closeEventDetail() {
    this.showEventDetailModal = false;
    this.selectedEventForDetail = null;
  }

  navigateToEvents() {
    this.router.navigate(['/dashboard']);
  }

  filterByDropdownCategory(category: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medcme_active_category_filter', category);
    }
    this.router.navigate(['/dashboard']);
    this.showExploreMenu = false;
  }

  filterByDropdownMode(mode: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medcme_active_mode_filter', mode);
    }
    this.router.navigate(['/dashboard']);
    this.showExploreMenu = false;
  }

  selectDemoSpecialty(specialty: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medcme_active_category_filter', specialty);
    }
    this.router.navigate(['/dashboard']);
    this.showExploreMenu = false;
  }

  selectDemoEvent(title: string, category: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medcme_active_category_filter', category);
      localStorage.setItem('medcme_active_mode_filter', 'All');
    }
    this.router.navigate(['/dashboard']);
    this.showExploreMenu = false;
  }

  toggleExploreMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showExploreMenu = !this.showExploreMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.explore-dropdown-container')) {
      this.showExploreMenu = false;
    }
  }

  // navigateToCourses() {
  //   this.router.navigate(['/events']);
  // }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  navigateToHostDashboard() {
    this.router.navigate(['/host-dashboard']);
  }

  navigateToCredits() {
    this.router.navigate(['/credits']);
  }

  navigateToKnowledge() {
    this.router.navigate(['/knowledge']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleRole() {
    this.authService.toggleUserRole();
    if (this.authService.isAdmin()) {
      this.router.navigate(['/host-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  openLiveRoom(event: CmeEvent) {
    this.activeLiveEvent = event;
    this.showLiveRoomModal = true;
    
    // Pre-populate chat messages
    this.liveChatMessages = [
      { sender: 'Moderator 1 (Dr. Anjali Sharma)', text: 'Welcome to this Live CME Event! Please use this chat for Q&A with our panel.', time: '10:00 AM', isUser: false },
      { sender: 'Consultant 1 (Dr. Suresh Patel)', text: 'Hello doctors. I am online to answer your questions regarding today\'s clinical protocols.', time: '10:02 AM', isUser: false }
    ];
    
    // Reset quizzes
    this.basicMcqAnswered = false;
    this.basicMcqSelectedOption = -1;
    this.basicMcqIsCorrect = null;
    
    this.midMcqAnswered = false;
    this.midMcqSelectedOption = -1;
    this.midMcqIsCorrect = null;

    // Reset notes & feedback
    this.liveRoomNotes = '';
    this.liveFeedbackSubmitted = false;
    this.liveFeedbackRating = 0;
    this.liveFeedbackText = '';
    this.liveSessionCompleted = false;

    // Load saved notes from LocalStorage if present
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`medcme_notes_${event.id}`);
      if (saved) {
        this.liveRoomNotes = saved;
      }
    }
  }

  saveNotes() {
    if (!this.activeLiveEvent) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`medcme_notes_${this.activeLiveEvent.id}`, this.liveRoomNotes);
    }
  }

  downloadNotes() {
    if (!this.activeLiveEvent) return;
    const blob = new Blob([
      `MedCME Private Session Notes\n` +
      `Event: ${this.activeLiveEvent.title}\n` +
      `Speaker: ${this.activeLiveEvent.speaker}\n` +
      `Date: ${this.activeLiveEvent.date}\n\n` +
      `My Private Notes:\n` +
      `=========================\n` +
      `${this.liveRoomNotes}`
    ], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CME_Notes_${this.activeLiveEvent.id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }



  submitFeedback() {
    if (this.liveFeedbackRating === 0) {
      alert('Please select a star rating first.');
      return;
    }
    
    this.liveFeedbackSubmitted = true;
    this.liveSessionCompleted = true;

    // Automatically issue the certificate to the doctor
    const user = this.authService.currentUser();
    if (user && this.activeLiveEvent) {
      this.authService.issueEventCertificate(
        user.id,
        this.activeLiveEvent.id,
        this.activeLiveEvent.title,
        this.activeLiveEvent.creditPoints || 1
      );
    }
  }

  closeCompletedSession() {
    this.liveSessionCompleted = false;
    this.closeLiveRoom();
    // Navigate to My Learning to see certificates
    this.router.navigate(['/my-learning']);
  }

  closeLiveRoom() {
    this.showLiveRoomModal = false;
    this.activeLiveEvent = null;
  }

  downloadPPT(fileName: string) {
    if (typeof window !== 'undefined') {
      const globalStore = (window as any).medcme_uploaded_files;
      const uploadedFileBase64 = globalStore ? globalStore[fileName] : null;

      if (uploadedFileBase64) {
        const fetchAndDownload = async () => {
          try {
            const res = await fetch(uploadedFileBase64);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
            alert(`Slide deck "${fileName}" downloaded successfully!`);
          } catch (err) {
            console.error('Error downloading uploaded slide binary', err);
          }
        };
        fetchAndDownload();
      } else {
        const finalFileName = fileName.toLowerCase().endsWith('.txt') ? fileName : fileName + '.txt';
        const blob = new Blob(['MedCME Resource Presentation: ' + fileName + '\n\nThis is a mock slide deck presentation for continuous medical education and best practices guidelines.'], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        a.click();
        window.URL.revokeObjectURL(url);
        alert(`Slide deck downloaded as text file "${finalFileName}" successfully!`);
      }
    }
  }

  downloadPreRead(event: any) {
    const fileName = event.preRead || 'ACLS_Standard_Protocols_Guideline.pdf';
    if (typeof window !== 'undefined') {
      const globalStore = (window as any).medcme_uploaded_files;
      const uploadedFileBase64 = globalStore ? globalStore[fileName] : null;

      if (uploadedFileBase64) {
        const fetchAndDownload = async () => {
          try {
            const res = await fetch(uploadedFileBase64);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
            alert(`Document "${fileName}" downloaded successfully!`);
          } catch (err) {
            console.error('Error downloading uploaded file binary', err);
          }
        };
        fetchAndDownload();
      } else {
        const finalFileName = fileName.toLowerCase().endsWith('.txt') ? fileName : fileName + '.txt';
        const blob = new Blob([
          `MedCME Mandatory CME Pre-Read Material\n` +
          `=========================================\n` +
          `Event: ${event.title}\n` +
          `Speaker: ${event.speaker}\n` +
          `CME Credits: ${event.creditPoints}\n\n` +
          `Please review this document carefully before attending the live session.\n` +
          `Reference ID: PR-${event.id}`
        ], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        a.click();
        window.URL.revokeObjectURL(url);
        alert(`Mandatory pre-read document downloaded as text file "${finalFileName}" successfully! Please read it before joining.`);
      }
    }
  }

  sendLiveChatMessage() {
    if (!this.newChatMessageText.trim()) return;
    
    const user = this.authService.currentUser();
    const userName = user ? user.name : 'Dr. Tushar Kudale';
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Add user message
    this.liveChatMessages.push({
      sender: userName,
      text: this.newChatMessageText.trim(),
      time: timeStr,
      isUser: true
    });
    
    const query = this.newChatMessageText.trim();
    this.newChatMessageText = '';
    
    // Scroll chat after DOM update
    setTimeout(() => {
      const container = document.getElementById('chat-history-scroll-ml');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
    
    // Simulate response from Consultant
    setTimeout(() => {
      this.simulateConsultantReply(query, userName);
    }, 1500);
  }

  simulateConsultantReply(query: string, doctorName: string) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    let reply = `Thank you for your question, ${doctorName}. For this specific scenario, standard guidelines recommend following local institution policies and cross-referencing with the CME lecture slide deck.`;
    const qLower = query.toLowerCase();
    
    if (qLower.includes('dosage') || qLower.includes('dose') || qLower.includes('mg') || qLower.includes('drug')) {
      reply = `Excellent point, ${doctorName}. Standard initial dosing guidelines for cardiac resuscitation suggest Epinephrine 1mg IV/IO every 3-5 minutes, and Amiodarone 300mg bolus for refractory VF/pVT.`;
    } else if (qLower.includes('sepsis') || qLower.includes('icu') || qLower.includes('ventilator') || qLower.includes('protocol')) {
      reply = `${doctorName}, in ICU septic shock scenarios, we follow the Surviving Sepsis Hour-1 bundle: measure lactate, draw blood cultures, start broad-spectrum antibiotics, and run 30mL/kg crystalloid fluid resuscitation.`;
    } else if (qLower.includes('pediatric') || qLower.includes('pals') || qLower.includes('child') || qLower.includes('pls')) {
      reply = `Great question regarding pediatric care, ${doctorName}. Remember that for cuffed endotracheal tubes, cuffed size is calculated as (Age/4) + 3.5 mm, and uncuffed size as (Age/4) + 4 mm.`;
    } else if (qLower.includes('mcq') || qLower.includes('quiz') || qLower.includes('test')) {
      reply = `Please complete the interactive MCQs in the outline tab on the left of your panel to verify your understanding, ${doctorName}!`;
    }
    
    this.liveChatMessages.push({
      sender: 'Consultant 1 (Dr. Suresh Patel)',
      text: reply,
      time: timeStr,
      isUser: false
    });
    
    // Scroll chat after DOM update
    setTimeout(() => {
      const container = document.getElementById('chat-history-scroll-ml');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  submitBasicMcq(optionIdx: number) {
    if (this.basicMcqAnswered) return;
    this.basicMcqSelectedOption = optionIdx;
    this.basicMcqAnswered = true;
    this.basicMcqIsCorrect = (optionIdx === 1); // Option B is correct
  }

  submitMidMcq(optionIdx: number) {
    if (this.midMcqAnswered) return;
    this.midMcqSelectedOption = optionIdx;
    this.midMcqAnswered = true;
    this.midMcqIsCorrect = (optionIdx === 2); // Option C is correct
  }

  // --- Certificate Drawer ---
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
    const currentUserObj = this.authService.currentUser();
    if (currentUserObj?.registrationNo) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Georgia, serif';
      ctx.fillText(`Medical Reg. No: ${currentUserObj.registrationNo}`, W / 2, 288);
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
}
