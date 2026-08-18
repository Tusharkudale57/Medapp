import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { Course } from '../../models/course.model';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.html',
  styleUrl: './events.css'
})
export class EventsComponent implements OnInit {
  courses: Course[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  searchQuery: string = '';

  showExploreMenu = false;
  activeSubMenu = 'specialties';

  // Admin modals
  showCreateCourseModal = false;
  editingCourseId: string | null = null;

  newCourseTitle: string = '';
  newCourseCategory: string = 'Cardiology';
  newCoursePriceInput: number = 1999;
  newCourseDuration: string = '4.0 Hours';
  newCourseInstructor: string = 'Dr. Healthcare Director';
  newCourseDescription: string = 'Comprehensive clinical guidelines and emergency protocols.';

  constructor(
    public authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.categories = this.courseService.getCategories();
    this.loadCourses();
  }

  loadCourses() {
    this.courses = this.courseService.searchCourses(this.searchQuery, this.selectedCategory);
  }

  onCategorySelect(category: string) {
    this.selectedCategory = category;
    this.loadCourses();
  }

  onSearchChange() {
    this.loadCourses();
  }

  viewCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToMyLearning() {
    this.router.navigate(['/my-learning']);
  }

  filterByDropdownCategory(category: string) {
    this.selectedCategory = category;
    this.loadCourses();
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
    this.selectedCategory = specialty;
    this.loadCourses();
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

  // --- Admin Actions ---
  openCreateCourseModal() {
    this.editingCourseId = null;
    this.resetNewCourseForm();
    this.showCreateCourseModal = true;
  }

  openEditCourseModal(course: Course, event: Event) {
    event.stopPropagation();
    this.editingCourseId = course.id;
    this.newCourseTitle = course.title;
    this.newCourseCategory = course.category;
    this.newCoursePriceInput = course.price;
    this.newCourseDuration = course.duration;
    this.newCourseInstructor = course.instructor;
    this.newCourseDescription = course.shortDescription;
    this.showCreateCourseModal = true;
  }

  closeCreateCourseModal() {
    this.showCreateCourseModal = false;
    this.editingCourseId = null;
  }

  saveCourse() {
    if (!this.newCourseTitle.trim()) return;

    const coursePayload = {
      title: this.newCourseTitle,
      category: this.newCourseCategory,
      price: this.newCoursePriceInput,
      duration: this.newCourseDuration,
      instructor: this.newCourseInstructor,
      shortDescription: this.newCourseDescription
    };

    if (this.editingCourseId) {
      this.courseService.updateCourse(this.editingCourseId, coursePayload);
      this.editingCourseId = null;
    } else {
      this.courseService.addCourse(coursePayload);
    }
    this.showCreateCourseModal = false;
    this.loadCourses();
    this.resetNewCourseForm();
  }

  resetNewCourseForm() {
    this.newCourseTitle = '';
    this.newCourseCategory = 'Cardiology';
    this.newCoursePriceInput = 1999;
    this.newCourseDuration = '4.0 Hours';
    this.newCourseInstructor = 'Dr. Healthcare Director';
    this.newCourseDescription = 'Comprehensive clinical guidelines and emergency protocols.';
  }

  deleteCourse(courseId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to remove this course from the catalog?')) {
      this.courseService.deleteCourse(courseId);
      this.loadCourses();
    }
  }
}
