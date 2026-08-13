import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { CmeEvent } from '../../models/course.model';
import { RazorpayService } from '../../services/razorpay.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  activeFilter = signal<'All' | 'Online' | 'Offline' | 'Hybrid' | 'Free'>('All');
  readonly filters: Array<'All' | 'Online' | 'Offline' | 'Hybrid' | 'Free'> = ['All', 'Online', 'Offline', 'Hybrid', 'Free'];

  showExploreMenu = false;
  activeCategory = signal<string>('All');
  activeSubMenu = 'specialties';

  // Interests popup state
  showInterestPopup = false;
  medicalInterests = ['Cardiology', 'Pediatrics', 'Neurology', 'Surgery', 'General Medicine'];
  techInterests = ['AI in Medicine', 'Robotic Surgery', 'Digital Health Records', 'Telemedicine'];
  charityInterests = ['Rural Healthcare Camps', 'Free Pediatric Screening', 'Free Cardiac Clinics', 'NGO Medical Relief'];
  selectedInterests: string[] = [];

  // Details Modal state
  selectedEventForDetail: CmeEvent | null = null;
  showDetailModal = false;

  // Protocol Modal state
  showProtocolModal = false;
  selectedProtocolType: 'CLS' | 'PLS' | 'ICU' | 'DRUGS' | 'OBGYN' | 'TRAUMA' | 'NEURO' | null = null;

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

  showRegisterModal = false;
  selectedEvent: CmeEvent | null = null;
  registrationSuccess = false;
  agreeTermsCheckout = false;

  // Razorpay simulated state
  showSimulatedRazorpay = false;

  // Advanced Search, Filter & Sort States
  searchQuery = '';
  showFiltersPanel = false;
  selectedLanguages: string[] = []; // Empty = all
  startDateFilter = '';
  endDateFilter = '';
  minCreditsFilter = 0;
  maxCreditsFilter = 5;
  sortByFilter = 'Date';
  visibleCount = 6;

  // Live Room Notes & Feedback states
  liveRoomNotes = '';
  liveFeedbackSubmitted = false;
  liveFeedbackRating = 0;
  liveFeedbackText = '';
  liveSessionCompleted = false;
  processingPayment = false;
  paymentSuccess = false;
  paymentTransactionId = '';
  selectedPaymentMethod: 'upi' | 'card' | 'netbanking' = 'upi';
  upiId = 'doctor@okicici';

  // MR Sponsor Code state
  showSponsorInput = false;
  sponsorCode = '';
  sponsorNameDetected = '';
  sponsorCodeError = '';

  // Admin: create event modal
  showCreateModal = false;
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
  readonly colorOptions = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f97316', '#14b8a6', '#ef4444'];

  constructor(
    public authService: AuthService,
    public eventService: EventService,
    private razorpayService: RazorpayService,
    private router: Router
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      const cat = localStorage.getItem('medcme_active_category_filter');
      if (cat) {
        this.activeCategory.set(cat);
        localStorage.removeItem('medcme_active_category_filter');
      }
      const mode = localStorage.getItem('medcme_active_mode_filter');
      if (mode) {
        if (mode === 'Free') {
          this.activeFilter.set('Free');
        } else {
          this.activeFilter.set(mode as any);
        }
        localStorage.removeItem('medcme_active_mode_filter');
      }
      const interestsSaved = localStorage.getItem('medcme_interests_saved');
      if (!interestsSaved && this.authService.isDoctor()) {
        this.showInterestPopup = true;
      }
    }
  }

  get filteredEvents(): CmeEvent[] {
    let events = this.eventService.getUpcomingEvents();
    
    const cat = this.activeCategory();
    if (cat !== 'All') {
      events = events.filter(e => e.category.toLowerCase() === cat.toLowerCase());
    }

    const filter = this.activeFilter();
    if (filter === 'Free') {
      events = events.filter(e => e.price === 0);
    } else if (filter !== 'All') {
      events = events.filter(e => e.mode === filter);
    }

    // Keyword Search Filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      events = events.filter(e => 
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.speaker || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }

    // Language Filter
    if (this.selectedLanguages.length > 0) {
      events = events.filter(e => {
        const lang = e.language || 'English';
        return this.selectedLanguages.includes(lang);
      });
    }

    // Date Range Filter
    if (this.startDateFilter) {
      events = events.filter(e => e.date >= this.startDateFilter);
    }
    if (this.endDateFilter) {
      events = events.filter(e => e.date <= this.endDateFilter);
    }

    // Credits range Filter
    events = events.filter(e => e.creditPoints >= this.minCreditsFilter && e.creditPoints <= this.maxCreditsFilter);

    // Sorting
    if (this.sortByFilter === 'Date') {
      events = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (this.sortByFilter === 'Newest') {
      events = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (this.sortByFilter === 'Price') {
      events = events.sort((a, b) => a.price - b.price);
    } else if (this.sortByFilter === 'Popularity') {
      events = events.sort((a, b) => b.registeredCount - a.registeredCount);
    } else if (this.sortByFilter === 'Relevance') {
      const user = this.authService.currentUser();
      const spec = user ? (user.specialty || '').toLowerCase() : '';
      const ints = user ? (user.interests || []).map(i => i.toLowerCase()) : [];
      events = events.sort((a, b) => {
        const aCat = a.category.toLowerCase();
        const bCat = b.category.toLowerCase();
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        let aScore = 0;
        let bScore = 0;
        
        if (aCat === spec) aScore += 5;
        if (bCat === spec) bScore += 5;
        
        ints.forEach(interest => {
          if (aCat.includes(interest) || aTitle.includes(interest)) aScore += 2;
          if (bCat.includes(interest) || bTitle.includes(interest)) bScore += 2;
        });
        
        return bScore - aScore;
      });
    }

    return events;
  }

  get relevantEvents(): CmeEvent[] {
    const user = this.authService.currentUser();
    if (!user || user.role === 'admin') return [];
    
    const specialty = (user.specialty || '').toLowerCase();
    const interests = user.interests || [];
    
    return this.filteredEvents.filter(event => {
      const cat = (event.category || '').toLowerCase();
      const title = (event.title || '').toLowerCase();
      
      const matchesSpecialty = specialty.includes(cat) || cat.includes(specialty);
      const matchesInterests = interests.some(interest => {
        const clean = interest.toLowerCase();
        return cat.includes(clean) || title.includes(clean);
      });
      
      return matchesSpecialty || matchesInterests;
    });
  }

  get genericEvents(): CmeEvent[] {
    const relevant = this.relevantEvents;
    if (relevant.length === 0) {
      return this.filteredEvents;
    }
    return this.filteredEvents.filter(event => !relevant.some(r => r.id === event.id));
  }

  get paginatedRelevantEvents(): CmeEvent[] {
    return this.relevantEvents.slice(0, this.visibleCount);
  }

  get paginatedGenericEvents(): CmeEvent[] {
    return this.genericEvents.slice(0, this.visibleCount);
  }

  get fastFillingEvents(): CmeEvent[] {
    return this.eventService.getUpcomingEvents()
      .filter(e => {
        const left = this.seatsLeft(e);
        return left > 0 && left < 30;
      })
      .sort((a, b) => this.seatsLeft(a) - this.seatsLeft(b));
  }

  toggleLanguageFilter(lang: string) {
    const idx = this.selectedLanguages.indexOf(lang);
    if (idx > -1) {
      this.selectedLanguages.splice(idx, 1);
    } else {
      this.selectedLanguages.push(lang);
    }
  }

  isLanguageSelected(lang: string): boolean {
    return this.selectedLanguages.includes(lang);
  }

  resetAllFilters() {
    this.searchQuery = '';
    this.selectedLanguages = [];
    this.startDateFilter = '';
    this.endDateFilter = '';
    this.minCreditsFilter = 0;
    this.maxCreditsFilter = 5;
    this.sortByFilter = 'Date';
    this.activeFilter.set('All');
    this.activeCategory.set('All');
    this.visibleCount = 6;
  }

  loadMore() {
    this.visibleCount += 6;
  }

  toggleInterest(interest: string) {
    const idx = this.selectedInterests.indexOf(interest);
    if (idx > -1) {
      this.selectedInterests.splice(idx, 1);
    } else {
      this.selectedInterests.push(interest);
    }
  }

  saveInterests() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medcme_interests_saved', 'true');
      localStorage.setItem('medcme_selected_interests', JSON.stringify(this.selectedInterests));
    }
    const user = this.authService.currentUser();
    if (user) {
      const updated = {
        ...user,
        interests: this.selectedInterests
      };
      this.authService.updateProfileWithInterests(updated);
    }
    this.showInterestPopup = false;
  }

  skipInterests() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medcme_interests_saved', 'true');
    }
    this.showInterestPopup = false;
  }

  openDetailModal(event: CmeEvent) {
    this.selectedEventForDetail = event;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedEventForDetail = null;
  }

  openLiveRoom(event: CmeEvent) {
    this.activeLiveEvent = event;
    this.showLiveRoomModal = true;
    this.showDetailModal = false;
    
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
    this.router.navigate(['/my-learning']);
  }

  closeLiveRoom() {
    this.showLiveRoomModal = false;
    this.activeLiveEvent = null;
    this.liveSessionCompleted = false;
    this.liveFeedbackSubmitted = false;
    this.liveFeedbackRating = 0;
    this.liveFeedbackText = '';
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
      const container = document.getElementById('chat-history-scroll');
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
      const container = document.getElementById('chat-history-scroll');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  submitBasicMcq(optionIdx: number) {
    if (this.basicMcqAnswered) return;
    this.basicMcqSelectedOption = optionIdx;
    this.basicMcqAnswered = true;
    this.basicMcqIsCorrect = (optionIdx === 1); // Option B is correct: "Immediate CPR for 2 minutes"
  }

  submitMidMcq(optionIdx: number) {
    if (this.midMcqAnswered) return;
    this.midMcqSelectedOption = optionIdx;
    this.midMcqAnswered = true;
    this.midMcqIsCorrect = (optionIdx === 2); // Option C is correct: "3:1 ratio (90 compressions + 30 breaths/min)"
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

  getCategoryImage(category: string): string {
    const cat = (category || '').toLowerCase();
    if (cat.includes('cardio')) {
      return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('pediat')) {
      return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('neuro')) {
      return 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('surg')) {
      return 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('radio')) {
      return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('emerg')) {
      return 'https://images.unsplash.com/photo-1583324113626-70df0f4decab?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('endo') || cat.includes('diabet')) {
      return 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('oncol') || cat.includes('cancer')) {
      return 'https://images.unsplash.com/photo-1579154204601-01588f351167?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=80';
  }

  openProtocolModal(type: 'CLS' | 'PLS' | 'ICU' | 'DRUGS' | 'OBGYN' | 'TRAUMA' | 'NEURO') {
    this.selectedProtocolType = type;
    this.showProtocolModal = true;
  }

  closeProtocolModal() {
    this.showProtocolModal = false;
    this.selectedProtocolType = null;
  }

  filterByDropdownCategory(category: string) {
    this.activeCategory.set(category);
    this.showExploreMenu = false;
  }

  filterByDropdownMode(mode: string) {
    if (mode === 'Free') {
      this.activeFilter.set('Free');
    } else {
      this.activeFilter.set(mode as any);
    }
    this.showExploreMenu = false;
  }

  clearCategoryFilter() {
    this.activeCategory.set('All');
  }

  selectDemoSpecialty(specialty: string) {
    this.activeCategory.set(specialty);
    this.showExploreMenu = false;
  }

  selectDemoEvent(title: string, category: string) {
    this.activeCategory.set(category);
    this.activeFilter.set('All');
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

  setFilter(f: 'All' | 'Online' | 'Offline' | 'Hybrid' | 'Free') {
    this.activeFilter.set(f);
  }

  openRegisterModal(event: CmeEvent) {
    this.selectedEvent = event;
    this.registrationSuccess = false;
    this.showRegisterModal = true;
    this.agreeTermsCheckout = false;
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
    this.selectedEvent = null;
    this.showSponsorInput = false;
    this.sponsorCode = '';
    this.sponsorNameDetected = '';
    this.sponsorCodeError = '';
    this.agreeTermsCheckout = false;
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
      } else if (code.includes('FREE') || code.includes('SPONSOR') || code.startsWith('MR')) {
        this.sponsorNameDetected = 'Special MR Sponsor';
        return;
      }
    }

    this.sponsorCodeError = 'Invalid MR Sponsorship Code. Try codes like MR_SUN, MR_REDDY, or MR_FREE.';
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
      // Bypass payment with MR sponsor validation
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

    const success = this.eventService.registerForEvent(
      this.selectedEvent.id,
      user.id,
      user.name,
      user.email,
      user.phone || '9876543210',
      'paid'
    );
    if (success) {
      this.registrationSuccess = true;
      setTimeout(() => this.closeRegisterModal(), 2200);
    }
  }

  isRegistered(eventId: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return this.eventService.isRegistered(eventId, user.id);
  }

  seatsLeft(event: CmeEvent): number {
    return this.eventService.getSeatsLeft(event);
  }

  formatDate(dateStr: string): string {
    return this.eventService.formatDate(dateStr);
  }

  getModeIcon(mode: string): string {
    if (mode === 'Online') return 'Online';
    if (mode === 'Offline') return 'Offline';
    return 'Hybrid';
  }

  // Admin create event
  openCreateModal() {
    this.resetForm();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  createEvent() {
    if (!this.newTitle.trim() || !this.newDate || !this.newVenue.trim()) return;
    const user = this.authService.currentUser();
    if (!user) return;
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
      preRead: this.newPreRead || 'ACLS_Standard_Protocols_Guideline.pdf'
    }, user.id, user.name);
    this.showCreateModal = false;
  }

  deleteEvent(eventId: string, ev: Event) {
    ev.stopPropagation();
    if (confirm('Remove this event from the platform?')) {
      this.eventService.deleteEvent(eventId);
    }
  }

  navigateToEvents() {
    this.activeFilter.set('All');
    this.activeCategory.set('All');
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  navigateToCourses() {
    this.router.navigate(['/events']);
  }

  navigateToMyLearning() {
    this.router.navigate(['/my-learning']);
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
    this.uploadedFiles = [];
  }
}
