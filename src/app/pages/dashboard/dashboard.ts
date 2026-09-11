import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RazorpayService } from '../../services/razorpay.service';
import { EventService } from '../../services/event.service';
import { EventResponse, CreateEventRequest } from '../../models/course.model';

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
  selectedEventForDetail: EventResponse | null = null;
  showDetailModal = false;

  // Protocol Modal state
  showProtocolModal = false;
  selectedProtocolType: 'CLS' | 'PLS' | 'ICU' | 'DRUGS' | 'OBGYN' | 'TRAUMA' | 'NEURO' | null = null;

  // Live Room State
  showLiveRoomModal = false;
  activeLiveEvent: EventResponse | null = null;
  liveChatMessages: Array<{ sender: string; text: string; time: string; isUser: boolean }> = [];
  newChatMessageText = '';
  showJoinLiveAlert = false;  // shown when non-registered user clicks Join Live

  // MCQ state
  basicMcqAnswered = false;
  basicMcqSelectedOption = -1;
  basicMcqIsCorrect: boolean | null = null;

  midMcqAnswered = false;
  midMcqSelectedOption = -1;
  midMcqIsCorrect: boolean | null = null;

  showRegisterModal = false;
  selectedEvent: EventResponse | null = null;
  registrationSuccess = false;
  agreeTermsCheckout = false;

  // Razorpay simulated state
  showSimulatedRazorpay = false;

  // Advanced Search, Filter & Sort States
  showInterestedOnly = false;
  searchQuery = '';
  showFiltersPanel = false;
  selectedLanguages: string[] = []; // Empty = all
  startDateFilter = '';
  endDateFilter = '';
  minCreditsFilter = 0;
  maxCreditsFilter = 5;
  sortByFilter = 'Date';
  visibleCount = 6;

  events: EventResponse[] = [];

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
  editingEventId: number | null = null;
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
  categories = ['Cardiology', 'Oncology', 'Neurology', 'Pediatrics', 'Surgery', 'General Medicine', 'Orthopedics', 'Obstetrics', 'Gastroenterology', 'Radiology', 'Emergency', 'Dermatology', 'Endocrinology', 'Psychiatry'];

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


  readonly colorOptions = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f97316', '#14b8a6', '#ef4444'];

  constructor(
    public authService: AuthService,
    public eventService: EventService,
    private razorpayService: RazorpayService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUpcomingEvents();

    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }
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

  loadUpcomingEvents(): void {
    this.eventService.getUpcomingEvents().subscribe({
      next: (response) => {
        this.events = response.data ?? [];
      },
      error: (error) => {
        console.error('Failed to load upcoming events:', error);
        this.events = [];
      }
    });
  }

  get filteredEvents(): EventResponse[] {

    let events: EventResponse[] = [...this.events];
    
    // Filter by interests if enabled, otherwise prioritize interests by sorting them first
    const user = this.authService.currentUser();
    if (user && user.interests && user.interests.length > 0) {
      if (this.showInterestedOnly) {
        events = events.filter(e => user.interests!.includes(e.category));
      } else {
        events = [...events].sort((a, b) => {
          const aMatch = user.interests!.includes(a.category) ? 1 : 0;
          const bMatch = user.interests!.includes(b.category) ? 1 : 0;
          return bMatch - aMatch;
        });
      }
    }

    const cat = this.activeCategory();
    if (cat !== 'All') {
      events = events.filter(e => e.category.toLowerCase() === cat.toLowerCase());
    }

    const filter = this.activeFilter();
    if (filter === 'Free') {
      events = events.filter(e => e.registrationFee === 0);
    } else if (filter !== 'All') {
      events = events.filter(e => e.mode === filter);
    }

    // Keyword Search Filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      events = events.filter(e => 
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.speakerName || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }

    // Language Filter
    if (this.selectedLanguages.length > 0) {
      events = events.filter((e: EventResponse) => {
        // EventResponse currently has no language field.
        // Keep English as the only available language until the backend exposes it.
        return this.selectedLanguages.includes('English');
      });
    }

    // Date Range Filter
    if (this.startDateFilter) {
      events = events.filter(e => e.eventDateTime >= this.startDateFilter);
    }
    if (this.endDateFilter) {
      events = events.filter(e => e.eventDateTime <= this.endDateFilter);
    }

    // Credits range Filter
    events = events.filter((e: EventResponse) => (e.cmeCreditPoints ?? 0) >= this.minCreditsFilter && (e.cmeCreditPoints ?? 0) <= this.maxCreditsFilter);

    // Sorting
    if (this.sortByFilter === 'Date') {
      events = events.sort((a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime());
    } else if (this.sortByFilter === 'Newest') {
      events = events.sort((a, b) => new Date(b.eventDateTime).getTime() - new Date(a.eventDateTime).getTime());
    } else if (this.sortByFilter === 'Price') {
      events = events.sort((a, b) => a.registrationFee - b.registrationFee);
    } else if (this.sortByFilter === 'Popularity') {
      events = [...events];
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

  get relevantEvents(): EventResponse[] {
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

  get genericEvents(): EventResponse[] {
    const relevant = this.relevantEvents;
    if (relevant.length === 0) {
      return this.filteredEvents;
    }
    return this.filteredEvents.filter(event => !relevant.some(r => r.id === event.id));
  }

  get paginatedRelevantEvents(): EventResponse[] {
    return this.relevantEvents.slice(0, this.visibleCount);
  }

  get paginatedGenericEvents(): EventResponse[] {
    return this.genericEvents.slice(0, this.visibleCount);
  }

  get fastFillingEvents(): EventResponse[] {
    return [...this.events]
      .filter((e: EventResponse) => {
        const left = this.seatsLeft(e);
        return left > 0 && left < 30;
      })
      .sort((a: EventResponse, b: EventResponse) => this.seatsLeft(a) - this.seatsLeft(b));
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

  openDetailModal(event: EventResponse) {
    this.selectedEventForDetail = event;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedEventForDetail = null;
  }

  openLiveRoom(event: EventResponse) {
    // Access check: only registered users can join the live room
    const user = this.authService.currentUser();
    if (!user) return;
    const registered = this.eventService.isRegistered(event.id.toString(), user.id);
    if (!registered) {
      this.showJoinLiveAlert = true;
      setTimeout(() => this.showJoinLiveAlert = false, 4000);
      return;
    }

    // Close ALL other modals first
    this.showDetailModal = false;
    this.selectedEventForDetail = null;
    this.showRegisterModal = false;
    this.showProtocolModal = false;

    this.activeLiveEvent = event;
    this.showLiveRoomModal = true;
    
    // Pre-populate chat messages
    this.liveChatMessages = [
      { sender: 'Moderator 1 (Dr. Anjali Sharma)', text: `Welcome to the Live CME: ${event.title}! Use this chat for Q&A with our panel.`, time: '10:00 AM', isUser: false },
      { sender: `Consultant 1 (Dr. ${event.speakerName})`, text: `Hello doctors. I am online to answer your questions regarding today's session: ${event.title}.`, time: '10:02 AM', isUser: false },
      { sender: 'Moderator 2 (Dr. Renu Kapoor)', text: 'Please answer the pre-test MCQ below to get started. All questions are CME accredited.', time: '10:04 AM', isUser: false }
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
      `All India CME Private Session Notes\n` +
      `Event: ${this.activeLiveEvent.title}\n` +
      `Speaker: ${this.activeLiveEvent.speakerName}\n` +
      `Date: ${this.activeLiveEvent.eventDateTime}\n\n` +
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
        this.activeLiveEvent.id.toString(),
        this.activeLiveEvent.title,
        (this.activeLiveEvent.cmeCreditPoints ?? 0) || 1
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
      const blob = new Blob(['All India CME Resource Presentation: ' + fileName + '\n\nThis is a mock slide deck presentation for continuous medical education and best practices guidelines.'], { type: 'text/plain' });
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
    if (cat.includes('physio') || cat.includes('rehab')) {
      return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('ortho') || cat.includes('bone') || cat.includes('joint')) {
      return 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('ayur') || cat.includes('herbal')) {
      return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('homeo')) {
      return 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('cardio') || cat.includes('heart')) {
      return 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('pediat') || cat.includes('child')) {
      return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('neuro') || cat.includes('brain') || cat.includes('stroke')) {
      return 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('surg') || cat.includes('operat')) {
      return 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('radio') || cat.includes('x-ray') || cat.includes('mri') || cat.includes('ct')) {
      return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('emerg') || cat.includes('trauma') || cat.includes('icu')) {
      return 'https://images.unsplash.com/photo-1583324113626-70df0f4decab?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('endo') || cat.includes('diabet')) {
      return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('oncol') || cat.includes('cancer')) {
      return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('derma') || cat.includes('skin')) {
      return 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('gastro') || cat.includes('digest')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('obgyn') || cat.includes('gynec') || cat.includes('obstet') || cat.includes('matern')) {
      return 'https://images.unsplash.com/photo-1578496781985-452d4a934d50?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('psych') || cat.includes('mental')) {
      return 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=600&auto=format&fit=crop&q=80';
    } else if (cat.includes('ophthal') || cat.includes('eye')) {
      return 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80';
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

  openRegisterModal(event: EventResponse) {
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

    if (this.selectedEvent.registrationFee === 0) {
      const success = this.eventService.registerForEvent(
        String(this.selectedEvent.id),
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
        String(this.selectedEvent.id),
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
        courseId: String(this.selectedEvent.id),
        courseTitle: this.selectedEvent.title,
        amount: this.selectedEvent.registrationFee,
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
      String(this.selectedEvent.id),
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

  seatsLeft(event: EventResponse): number {
    return event.maxSeats ?? 0;
  }

  formatDate(dateStr: string): string {
    return this.eventService.formatDate(dateStr);
  }

  getModeIcon(mode: string): string {
    const normalized = (mode || '').toUpperCase();
    if (normalized === 'ONLINE') return 'Online';
    if (normalized === 'OFFLINE') return 'Offline';
    return 'Hybrid';
  }

  private convertTimeToLocalDateTime(date: string, time: string): string {
    const cleanTime = (time || '').replace(/\s*IST\s*/i, '').trim();
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

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

    return `${date}T${hour.toString().padStart(2, '0')}:${minute}:00`;
  }

  // Admin create event
  openCreateModal() {
    if (!this.authService.isAdmin()) return;
    this.editingEventId = null;
    this.resetForm();
    this.showCreateModal = true;
  }

  openEditModal(event: EventResponse, ev: Event) {
    ev.stopPropagation();
    this.editingEventId = event.id;
    this.newTitle = event.title;
    this.newDescription = event.description || '';
    this.newDate = event.eventDateTime.split('T')[0];
    this.newTime = event.eventDateTime ? new Date(event.eventDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM IST';
    this.newVenue = event.joinLink || '';
    const mode = (event.mode || 'ONLINE').toUpperCase();
    this.newMode =
      mode === 'OFFLINE' ? 'Offline' :
      mode === 'HYBRID' ? 'Hybrid' :
      'Online';
    this.newSpeaker = event.speakerName || '';
    this.newSpeakerRole = event.speakerRole || '';
    this.newCategory = event.category || 'Cardiology';
    this.newCreditPoints = (event.cmeCreditPoints ?? 0) || 1;
    this.newPrice = event.registrationFee || 0;
    this.newMaxSeats = event.maxSeats || 100;
    this.newBannerColor = event.cardAccentColor || '#0ea5e9';
    this.newPreRead = event.documents?.[0]?.fileName || '';
    this.newZohoLink = event.zohoBackstageLink || '';
    if (event.documents?.[0]?.fileName) {
      this.uploadedFiles = [{ name: event.documents[0].fileName, size: 'N/A', status: 'uploaded' }];
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
    if (!this.authService.isAdmin()) return;

    const eventDateTime = this.convertTimeToLocalDateTime(this.newDate, this.newTime);

    const request: CreateEventRequest = {
      title: this.newTitle,
      description: this.newDescription,
      eventDate: this.newDate,
      eventTime: eventDateTime.split('T')[1] || '10:00:00',
      joinLink: this.newVenue,
      zohoBackstageLink: this.newZohoLink,
      mode: this.newMode.toUpperCase(),
      category: this.newCategory,
      speakerName: this.newSpeaker,
      speakerRole: this.newSpeakerRole,
      cmeCreditPoints: this.newCreditPoints,
      registrationFee: this.newPrice,
      maxSeats: this.newMaxSeats,
      cardAccentColor: this.newBannerColor
    };

    if (this.editingEventId !== null) {
      this.eventService.updateEvent(this.editingEventId, request).subscribe({
        next: () => {
          this.editingEventId = null;
          this.showCreateModal = false;
          this.loadUpcomingEvents();
        },
        error: (error) => {
          console.error('Failed to update event:', error);
          alert('Failed to update event.');
        }
      });
    } else {
      this.eventService.createEvent(request).subscribe({
        next: () => {
          this.showCreateModal = false;
          this.loadUpcomingEvents();
        },
        error: (error) => {
          console.error('Failed to create event:', error);
          alert('Failed to create event.');
        }
      });
    }
  }

  deleteEvent(eventId: number, ev: Event) {
    ev.stopPropagation();
    if (confirm('Remove this event from the platform?')) {
      this.eventService.deleteEvent(eventId).subscribe({
        next: () => this.loadUpcomingEvents(),
        error: (error) => {
          console.error('Failed to delete event:', error);
          alert('Failed to delete event.');
        }
      });
    }
  }

  navigateToEvents() {
    this.activeFilter.set('All');
    this.activeCategory.set('All');
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  // navigateToCourses() {
  //   this.router.navigate(['/events']);
  // }

  navigateToMyLearning() {
    this.router.navigate(['/my-learning']);
  }

  navigateToHostDashboard() {
    this.router.navigate(['/host-dashboard']);
  }

  // navigateToCredits() {
  //   this.router.navigate(['/credits']);
  // }

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
    this.newDate = new Date().toISOString().split('T')[0];
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
