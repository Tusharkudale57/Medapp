import { Component, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { RazorpayService } from '../../services/razorpay.service';
import { Course, CourseModule } from '../../models/course.model';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css'
})
export class CourseDetailComponent implements OnInit {
  course: Course | undefined;
  activeTab = signal<'overview' | 'modules' | 'quiz' | 'accreditation'>('overview');
  activeModule: CourseModule | undefined;
  
  // Razorpay payment state
  showSimulatedRazorpay = false;
  selectedPaymentMethod: 'upi' | 'card' | 'netbanking' = 'upi';
  upiId: string = 'doctor@okicici';
  cardNumber: string = '4532 •••• •••• 8892';
  processingPayment = false;
  paymentSuccess = false;
  paymentTransactionId = '';

  // Quiz state
  userAnswers: { [key: string]: number } = {};
  quizSubmitted = false;
  quizScore = 0;
  quizPassed = false;

  // Certificate awarded notification modal
  showCertAwardedModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private courseService: CourseService,
    private razorpayService: RazorpayService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.course = this.courseService.getCourseById(id);
        if (this.course && this.course.modules.length > 0) {
          this.activeModule = this.course.modules[0];
        }
      }
    });
  }

  isPurchased(): boolean {
    return this.course ? this.authService.isCoursePurchased(this.course.id) : false;
  }

  isCompleted(): boolean {
    return this.course ? this.authService.isCourseCompleted(this.course.id) : false;
  }

  async initiatePurchase() {
    if (!this.course) return;
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const details = {
      courseId: this.course.id,
      courseTitle: this.course.title,
      amount: this.course.price,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone
    };

    const res = await this.razorpayService.openPaymentGateway(details);

    if (res.success && res.paymentId && res.paymentId !== 'FALLBACK_TRIGGER') {
      this.finalizePurchase(res.paymentId);
    } else {
      // Show interactive Razorpay modal fallback
      this.showSimulatedRazorpay = true;
    }
  }

  confirmSimulatedPayment() {
    this.processingPayment = true;
    setTimeout(() => {
      this.processingPayment = false;
      this.paymentSuccess = true;
      this.paymentTransactionId = 'pay_rzp_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      setTimeout(() => {
        this.showSimulatedRazorpay = false;
        this.paymentSuccess = false;
        if (this.course) {
          this.finalizePurchase(this.paymentTransactionId);
        }
      }, 1200);
    }, 1500);
  }

  finalizePurchase(transactionId: string) {
    if (!this.course) return;
    this.authService.purchaseCourse(this.course.id);
    this.activeTab.set('modules');
  }

  selectModule(mod: CourseModule) {
    this.activeModule = mod;
  }

  selectAnswer(questionId: string, optionIndex: number) {
    this.userAnswers[questionId] = optionIndex;
  }

  submitQuiz() {
    if (!this.course) return;
    
    let score = 0;
    this.course.quiz.forEach(q => {
      if (this.userAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    this.quizScore = score;
    this.quizSubmitted = true;
    this.quizPassed = score >= Math.ceil(this.course.quiz.length * 0.6);

    if (this.quizPassed) {
      // Award 1 Preserved Credit Point & Certificate
      this.authService.completeCourse(this.course.id, this.course.title, 1);
      this.showCertAwardedModal = true;
    }
  }

  navigateToProfile() {
    this.showCertAwardedModal = false;
    this.router.navigate(['/profile']);
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
