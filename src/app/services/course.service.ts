import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Course } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private isBrowser: boolean;

  private defaultCourses: Course[] = [
    {
      id: 'course-1',
      title: 'Advanced Cardiovascular Life Support & ECG Mastery',
      shortDescription: 'Master 12-lead ECG interpretation, acute coronary syndromes, and updated ACLS resuscitation algorithms.',
      detailedDescription: 'This accredited Continuing Medical Education (CME) course provides comprehensive, evidence-based training on Advanced Cardiovascular Life Support (ACLS), 12-Lead Electrocardiogram (ECG) interpretation, lethal arrhythmia identification, emergency cardiac pharmacology, and post-cardiac arrest care. Ideal for physicians, cardiologists, emergency physicians, and critical care specialists.',
      category: 'Cardiology',
      instructor: 'Dr. Vikram Malhotra, MD, DM (Cardiology)',
      instructorRole: 'Head of Department - Cardiology, AIIMS New Delhi',
      instructorImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
      price: 1499,
      creditPoints: 1,
      thumbnail: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80',
      duration: '4.5 Hours',
      level: 'Advanced',
      rating: 4.9,
      reviewsCount: 342,
      studentsCount: 1850,
      accreditation: 'Accredited by National Medical Commission (NMC) & ICCME (1 CME Credit)',
      modules: [
        {
          id: 'mod-101',
          title: 'Module 1: Acute Coronary Syndromes & 12-Lead ECG Localization',
          duration: '45 mins',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          description: 'Recognizing STEMI, NSTEMI, Unstable Angina, and anatomical localization of ischemic injury on 12-Lead ECG.',
          content: '<h3>1. Introduction to Acute Coronary Syndromes (ACS)</h3><p>Acute Coronary Syndromes encompass a spectrum of myocardial ischemia ranging from unstable angina to ST-elevation myocardial infarction (STEMI).</p>'
        },
        {
          id: 'mod-102',
          title: 'Module 2: Lethal Arrhythmias & Synchronized Cardioversion',
          duration: '60 mins',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          description: 'Algorithms for Ventricular Fibrillation (VF), Pulseless Electrical Activity (PEA), Asystole, and Tachyarrhythmias.',
          content: '<h3>2. ACLS Resuscitation Algorithms</h3><p>High-quality CPR and biphasic defibrillation protocols.</p>'
        }
      ],
      quiz: [
        {
          id: 'q1',
          question: 'In a patient presenting with acute substernal chest pain, ST elevation in leads II, III, and aVF indicates infarction in which anatomical area?',
          options: ['Anterior Wall (LAD)', 'Inferior Wall (RCA)', 'Lateral Wall (LCx)', 'Posterior Wall'],
          correctAnswer: 1
        },
        {
          id: 'q2',
          question: 'What is the recommended first-line pharmacological treatment for persistent, refractory Ventricular Fibrillation after the 3rd defibrillation shock?',
          options: ['Atropine 1mg IV', 'Adenosine 6mg rapid IV push', 'Amiodarone 300mg IV bolus', 'Dopamine infusion'],
          correctAnswer: 2
        }
      ]
    },
    {
      id: 'course-2',
      title: 'Pediatric Emergency Medicine & Resuscitation',
      shortDescription: 'Guidelines for managing pediatric respiratory failure, septic shock, pediatric ACLS, and foreign body aspiration.',
      detailedDescription: 'This 1-Credit CME course covers crucial clinical skills required for emergency room physicians, pediatricians, and intensivists.',
      category: 'Pediatrics',
      instructor: 'Dr. Sunita Deshmukh, MD (Pediatrics)',
      instructorRole: 'Professor of Pediatrics, KEM Hospital Mumbai',
      instructorImage: 'https://images.unsplash.com/photo-1594824813566-78a99479b1c7?w=300&auto=format&fit=crop&q=80',
      price: 1899,
      creditPoints: 1,
      thumbnail: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
      duration: '5.0 Hours',
      level: 'Intermediate',
      rating: 4.8,
      reviewsCount: 210,
      studentsCount: 1420,
      accreditation: 'Accredited by Indian Academy of Pediatrics (IAP) & NBMCE (1 CME Credit)',
      modules: [
        {
          id: 'mod-201',
          title: 'Module 1: Pediatric Assessment Triangle & Respiratory Failure',
          duration: '60 mins',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          description: 'Evaluating Appearance, Work of Breathing, and Circulation to Skin.',
          content: '<h3>Pediatric Assessment Triangle</h3><p>Rapid assessment techniques for pediatric emergency triage.</p>'
        }
      ],
      quiz: [
        {
          id: 'q2-1',
          question: 'When peripheral venous access cannot be obtained within 90 seconds in a child in septic shock, what is the next immediate access step?',
          options: ['Central Venous Line insertion', 'Intraosseous (IO) needle insertion', 'Subclavian vein cutdown', 'Internal jugular cannulation'],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 'course-3',
      title: 'Neurology in Primary Care & Acute Stroke Protocol',
      shortDescription: 'Timely recognition of acute ischemic stroke, door-to-needle thrombolysis, mechanical thrombectomy, and seizure management.',
      detailedDescription: 'Covers NIH Stroke Scale (NIHSS) assessment, non-contrast CT head interpretation, and alteplase thrombolysis.',
      category: 'Neurology',
      instructor: 'Dr. Anand Ramanathan, DM (Neurology)',
      instructorRole: 'Senior Consultant Neurologist, Apollo Hospitals',
      instructorImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
      price: 1299,
      creditPoints: 1,
      thumbnail: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80',
      duration: '3.5 Hours',
      level: 'Intermediate',
      rating: 4.7,
      reviewsCount: 180,
      studentsCount: 980,
      accreditation: 'Accredited by Indian Academy of Neurology (IAN) (1 CME Credit)',
      modules: [
        {
          id: 'mod-301',
          title: 'Module 1: Acute Ischemic Stroke & NIHSS Scoring',
          duration: '50 mins',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          description: 'FAST protocol, NIHSS scale evaluation, and hyperacute head CT findings.',
          content: '<h3>Acute Stroke Management</h3><p>Time is brain: Door-to-needle target time < 45 minutes.</p>'
        }
      ],
      quiz: [
        {
          id: 'q3-1',
          question: 'What is the maximum time window from symptom onset for administering IV thrombolysis in acute ischemic stroke?',
          options: ['2.0 Hours', '3.0 Hours', '4.5 Hours', '12.0 Hours'],
          correctAnswer: 2
        }
      ]
    },
    {
      id: 'course-4',
      title: 'Advanced Surgical Wound Closure & Infection Control',
      shortDescription: 'Evidence-based surgical techniques, suture material selection, vacuum-assisted closure (VAC), and surgical site infection prophylaxis.',
      detailedDescription: 'Designed for general surgeons, resident doctors, and operating room physicians. Learn suture techniques and wound debridement.',
      category: 'Surgery',
      instructor: 'Dr. Rajesh Sharma, MS, MCh',
      instructorRole: 'Director of Surgery, Max Healthcare',
      instructorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
      price: 1599,
      creditPoints: 1,
      thumbnail: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=80',
      duration: '4.0 Hours',
      level: 'Intermediate',
      rating: 4.9,
      reviewsCount: 155,
      studentsCount: 840,
      accreditation: 'Accredited by Association of Surgeons of India (ASI) (1 CME Credit)',
      modules: [],
      quiz: []
    }
  ];

  private courses: Course[] = [];

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadCoursesFromStorage();
  }

  /**
   * Returns a curated, high-definition medical poster matching any medical specialty or title.
   */
  getCategoryPoster(category: string, title?: string): string {
    const combined = `${category || ''} ${title || ''}`.toLowerCase();

    if (combined.includes('physio') || combined.includes('physical therapy') || combined.includes('rehab')) {
      return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80'; // Physiotherapy clinic & spinal rehab
    }
    if (combined.includes('ortho') || combined.includes('bone') || combined.includes('joint') || combined.includes('spine')) {
      return 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80'; // Orthopedics & joint anatomy
    }
    if (combined.includes('ayur') || combined.includes('ayush') || combined.includes('herbal')) {
      return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'; // Ayurveda & traditional herbal medicine
    }
    if (combined.includes('homeo') || combined.includes('homeopathy')) {
      return 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=600&auto=format&fit=crop&q=80'; // Homeopathy & natural clinical remedies
    }
    if (combined.includes('cardio') || combined.includes('heart') || combined.includes('ecg') || combined.includes('acls')) {
      return 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80'; // Cardiology & ECG
    }
    if (combined.includes('neuro') || combined.includes('brain') || combined.includes('stroke')) {
      return 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80'; // Neurology & brain MRI
    }
    if (combined.includes('pediat') || combined.includes('child') || combined.includes('neonat') || combined.includes('pals')) {
      return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80'; // Pediatrics & child health
    }
    if (combined.includes('surg') || combined.includes('operat') || combined.includes('wound') || combined.includes('laparoscop')) {
      return 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=80'; // Surgery & operating room
    }
    if (combined.includes('radio') || combined.includes('x-ray') || combined.includes('mri') || combined.includes('ct scan') || combined.includes('ultrasound')) {
      return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80'; // Radiology & medical imaging
    }
    if (combined.includes('emerg') || combined.includes('trauma') || combined.includes('icu') || combined.includes('critical')) {
      return 'https://images.unsplash.com/photo-1583324113626-70df0f4decab?w=600&auto=format&fit=crop&q=80'; // Emergency & trauma resuscitation
    }
    if (combined.includes('oncol') || combined.includes('cancer') || combined.includes('chemo') || combined.includes('tumor')) {
      return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80'; // Oncology & cancer care
    }
    if (combined.includes('endo') || combined.includes('diabet') || combined.includes('thyroid') || combined.includes('metabol')) {
      return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80'; // Endocrinology & diabetes
    }
    if (combined.includes('derma') || combined.includes('skin') || combined.includes('cosmet')) {
      return 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&auto=format&fit=crop&q=80'; // Dermatology & clinical skin
    }
    if (combined.includes('gastro') || combined.includes('digest') || combined.includes('liver') || combined.includes('endoscop')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80'; // Gastroenterology & endoscopy
    }
    if (combined.includes('obgyn') || combined.includes('gynec') || combined.includes('obstet') || combined.includes('matern') || combined.includes('pregnan')) {
      return 'https://images.unsplash.com/photo-1578496781985-452d4a934d50?w=600&auto=format&fit=crop&q=80'; // Obstetrics & Gynecology
    }
    if (combined.includes('psych') || combined.includes('mental') || combined.includes('behavior')) {
      return 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=600&auto=format&fit=crop&q=80'; // Psychiatry & Mental Health
    }
    if (combined.includes('ophthal') || combined.includes('eye') || combined.includes('vision') || combined.includes('retina')) {
      return 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&auto=format&fit=crop&q=80'; // Ophthalmology & eye care
    }
    if (combined.includes('general') || combined.includes('internal') || combined.includes('family') || combined.includes('physician')) {
      return 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80'; // General & Internal Medicine
    }

    // Default high-grade medical CME poster
    return 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=80';
  }

  private loadCoursesFromStorage() {
    if (this.isBrowser) {
      const saved = localStorage.getItem('medcme_courses');
      if (saved) {
        try {
          const parsed: Course[] = JSON.parse(saved);
          const oldPlaceholder = 'photo-1576091160399-112ba8d25d1d';
          let updated = false;
          this.courses = parsed.map(c => {
            if (!c.thumbnail || c.thumbnail.includes(oldPlaceholder)) {
              updated = true;
              return { ...c, thumbnail: this.getCategoryPoster(c.category, c.title) };
            }
            return c;
          });
          if (updated) {
            this.saveCoursesToStorage();
          }
          return;
        } catch (e) {
          console.error('Failed to load courses', e);
        }
      }
      this.courses = [...this.defaultCourses];
      this.saveCoursesToStorage();
    } else {
      this.courses = [...this.defaultCourses];
    }
  }

  private saveCoursesToStorage() {
    if (!this.isBrowser) return;
    localStorage.setItem('medcme_courses', JSON.stringify(this.courses));
  }

  getCourses(): Course[] {
    return this.courses;
  }

  getCourseById(id: string): Course | undefined {
    return this.courses.find(c => c.id === id);
  }

  getCoursesByCategory(category: string): Course[] {
    if (!category || category === 'All') return this.courses;
    return this.courses.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  searchCourses(query: string, category: string = 'All'): Course[] {
    let result = this.getCoursesByCategory(category);
    if (!query || query.trim() === '') return result;
    const q = query.toLowerCase().trim();
    return result.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.shortDescription.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q)
    );
  }

  getCategories(): string[] {
    return ['All', 'Cardiology', 'Pediatrics', 'Neurology', 'Surgery', 'Radiology', 'Emergency', 'Orthopedics', 'Physiotherapy', 'Ayurveda', 'Homeopathy', 'Dermatology', 'General Medicine'];
  }

  // --- ADMIN COURSE MANAGEMENT METHODS ---

  addCourse(newCourse: Partial<Course>): Course {
    const id = 'course-' + Date.now();
    const fullCourse: Course = {
      id,
      title: newCourse.title || 'New Medical CME Course',
      shortDescription: newCourse.shortDescription || 'Comprehensive continuing medical education module.',
      detailedDescription: newCourse.detailedDescription || newCourse.shortDescription || 'Detailed medical guidelines and clinical workflow.',
      category: newCourse.category || 'Cardiology',
      instructor: newCourse.instructor || 'Dr. Medical Expert',
      instructorRole: newCourse.instructorRole || 'Senior Medical Consultant',
      instructorImage: newCourse.instructorImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
      price: newCourse.price || 1499,
      creditPoints: newCourse.creditPoints || 1,
      thumbnail: newCourse.thumbnail && !newCourse.thumbnail.includes('photo-1576091160399-112ba8d25d1d')
        ? newCourse.thumbnail
        : this.getCategoryPoster(newCourse.category || 'Cardiology', newCourse.title),
      duration: newCourse.duration || '3.0 Hours',
      level: newCourse.level || 'Intermediate',
      rating: 5.0,
      reviewsCount: 1,
      studentsCount: 1,
      accreditation: newCourse.accreditation || 'Accredited by National Board of CME (1 Credit)',
      modules: [
        {
          id: 'mod-' + Date.now(),
          title: 'Module 1: Clinical Introduction & Guidelines',
          duration: '45 mins',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          description: 'Introduction to clinical guidelines and diagnostic protocols.',
          content: '<h3>Clinical Guidelines</h3><p>Comprehensive overview of updated treatment guidelines and protocols.</p>'
        }
      ],
      quiz: [
        {
          id: 'q-' + Date.now(),
          question: 'What is the primary diagnostic marker for acute clinical evaluation in this course?',
          options: ['Clinical History & Physical Exam', 'Empiric Therapy', 'Observation Only', 'None of the above'],
          correctAnswer: 0
        }
      ]
    };

    this.courses.unshift(fullCourse);
    this.saveCoursesToStorage();
    return fullCourse;
  }

  updateCoursePrice(courseId: string, newPrice: number): boolean {
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      course.price = newPrice;
      this.saveCoursesToStorage();
      return true;
    }
    return false;
  }

  updateCourse(courseId: string, updatedFields: Partial<Course>): boolean {
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      Object.assign(course, updatedFields);
      this.saveCoursesToStorage();
      return true;
    }
    return false;
  }

  deleteCourse(courseId: string): boolean {
    const initialLen = this.courses.length;
    this.courses = this.courses.filter(c => c.id !== courseId);
    if (this.courses.length !== initialLen) {
      this.saveCoursesToStorage();
      return true;
    }
    return false;
  }
}
