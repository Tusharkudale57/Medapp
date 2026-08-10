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

  navigateToCourses() {
    this.router.navigate(['/events']);
  }

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
      `Accrevent Private Session Notes\n` +
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
    // Show the completion success screen after a short delay
    setTimeout(() => {
      this.liveSessionCompleted = true;
    }, 800);
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
      const blob = new Blob(['MedCME Resource Presentation: ' + fileName + '\n\nThis is a mock slide deck presentation for continuous medical education and best practices guidelines.'], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      alert(`Slide deck "${fileName}" downloaded successfully!`);
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
    ctx.fillText('ACCREDITED CME CERTIFICATE OF CLINICAL EXCELLENCE', width / 2, 115);

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

    // Reg Info
    const currentUserObj = this.authService.currentUser();
    if (currentUserObj?.registrationNo) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Medical Reg No: ${currentUserObj.registrationNo}`, width / 2, 265);
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
}
