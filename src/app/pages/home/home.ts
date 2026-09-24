import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';
import { EventService } from '../../services/event.service';
import {
  Course,
  EventResponse
} from '../../models/course.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {

  searchQuery = '';
  selectedSpecialty = 'All';
  selectedFormat = 'All';

  eventsLimit = 4;
  coursesLimit = 3;

  showExploreDropdown = false;

  selectedEventForDetail: EventResponse | null = null;
  showEventDetailModal = false;

  // Events loaded from backend API
  events: EventResponse[] = [];

  constructor(
    public authService: AuthService,
    public courseService: CourseService,
    public eventService: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    this.loadUpcomingEvents();
  }

  /**
   * Load upcoming events from backend
   */
  loadUpcomingEvents(): void {

    this.eventService.getUpcomingEvents().subscribe({
      next: (response) => {

        this.events = response.data ?? [];

      },

      error: (error) => {

        console.error(
          'Failed to load upcoming events:',
          error
        );

        this.events = [];
      }
    });
  }

  /**
   * Filter events
   */
  get filteredEvents(): EventResponse[] {

    let list = [...this.events];

    // Specialty filter
    if (this.selectedSpecialty !== 'All') {

      list = list.filter(
        event =>
          event.category?.toLowerCase() ===
          this.selectedSpecialty.toLowerCase()
      );
    }

    // Format filter
    if (this.selectedFormat !== 'All') {

      list = list.filter(
        event =>
          event.mode?.toLowerCase() ===
          this.selectedFormat.toLowerCase()
      );
    }

    // Search filter
    if (this.searchQuery.trim()) {

      const q = this.searchQuery
        .toLowerCase()
        .trim();

      list = list.filter(event =>
        (event.title || '').toLowerCase().includes(q) ||
        (event.description || '').toLowerCase().includes(q) ||
        (event.speakerName || '').toLowerCase().includes(q) ||
        (event.speakerRole || '').toLowerCase().includes(q) ||
        (event.category || '').toLowerCase().includes(q)
      );
    }

    return list;
  }

  get visibleEvents(): EventResponse[] {
    return this.filteredEvents.slice(
      0,
      this.eventsLimit
    );
  }

  showMoreEvents(): void {
    this.eventsLimit = this.filteredEvents.length;
  }

  showLessEvents(): void {
    this.eventsLimit = 4;
  }

  /**
   * Filter courses
   */
  get filteredCourses(): Course[] {

    let list = this.courseService.getCourses();

    // Specialty filter
    if (this.selectedSpecialty !== 'All') {

      list = list.filter(
        course =>
          course.category?.toLowerCase() ===
          this.selectedSpecialty.toLowerCase()
      );
    }

    // Search filter
    if (this.searchQuery.trim()) {

      const q = this.searchQuery
        .toLowerCase()
        .trim();

      list = list.filter(course =>
        (course.title || '').toLowerCase().includes(q) ||
        (course.shortDescription || '').toLowerCase().includes(q) ||
        (course.category || '').toLowerCase().includes(q) ||
        (course.instructor || '').toLowerCase().includes(q)
      );
    }

    return list;
  }

  get visibleCourses(): Course[] {
    return this.filteredCourses.slice(
      0,
      this.coursesLimit
    );
  }

  showMoreCourses(): void {
    this.coursesLimit = this.filteredCourses.length;
  }

  showLessCourses(): void {
    this.coursesLimit = 3;
  }

  toggleExploreDropdown(event: MouseEvent): void {

    event.stopPropagation();

    this.showExploreDropdown =
      !this.showExploreDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    const target = event.target as HTMLElement;

    if (!target.closest('.explore-dropdown-container')) {
      this.showExploreDropdown = false;
    }
  }

  selectExploreOption(
    option: 'Online' | 'Offline' | 'Hybrid' | 'Courses' | 'All'
  ): void {

    this.showExploreDropdown = false;

    if (option === 'Courses') {

      const element =
        document.getElementById('courses-section');

      if (element) {

        element.scrollIntoView({
          behavior: 'smooth'
        });
      }

      return;
    }

    this.selectedFormat =
      option === 'All'
        ? 'All'
        : option;

    const element =
      document.getElementById('events-section');

    if (element) {

      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }

  selectSpecialtyBadge(specialty: string): void {
    this.selectedSpecialty = specialty;
  }

  viewCourse(courseId: string): void {
    this.router.navigate([
      '/course',
      courseId
    ]);
  }

  /**
   * Open event details
   */
  openEventDetail(event: EventResponse): void {

    this.selectedEventForDetail = event;
    this.showEventDetailModal = true;
  }

  /**
   * Close event details
   */
  closeEventDetail(): void {

    this.selectedEventForDetail = null;
    this.showEventDetailModal = false;
  }

  /**
   * Get event poster
   *
   * Use API photoUrl when available.
   * Otherwise use category-based fallback.
   */
  getEventPoster(event: EventResponse): string {

    if (event.photoUrl) {
      return event.photoUrl;
    }

    return this.courseService.getCategoryPoster(
      event.category,
      event.title
    );
  }

  /**
   * Get course poster
   */
  getCoursePoster(course: Course): string {

    if (
      course.thumbnail &&
      !course.thumbnail.includes(
        'photo-1576091160399-112ba8d25d1d'
      )
    ) {
      return course.thumbnail;
    }

    return this.courseService.getCategoryPoster(
      course.category,
      course.title
    );
  }

  /**
   * Image fallback
   */
  onImgError(
    event: Event,
    category: string,
    title?: string
  ): void {

    const image =
      event.target as HTMLImageElement;

    if (!image) {
      return;
    }

    if (image.dataset['fallbackApplied']) {

      image.onerror = null;

      image.src =
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80';

      return;
    }

    image.dataset['fallbackApplied'] = 'true';

    image.src =
      this.courseService.getCategoryPoster(
        category,
        title
      );
  }
}