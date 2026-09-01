export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  description: string;
  content: string;
  completed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Course {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: string;
  instructor: string;
  instructorRole: string;
  instructorImage: string;
  price: number;
  creditPoints: number;
  thumbnail: string;
  duration: string;
  level: string;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  accreditation: string;
  modules: CourseModule[];
  quiz: QuizQuestion[];
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  creditPoints: number;
  recipientName: string;
  verificationCode: string;
  issuer: string;
  type?: 'course' | 'event';  // distinguishes course completion vs event attendance
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  registrationNo: string;
  creditPoints: number;
  purchasedCourseIds: string[];
  completedCourseIds: string[];
  certificates: Certificate[];
  role: 'doctor' | 'admin' | 'user';
  sirName?: string;
  middleName?: string;
  city?: string;
  specialtyOther?: string;
  interests?: string[];
  gender?: string;
  dob?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  hospital?: string;
  organization?: string;
  experience?: number;
  language?: string;
  emailConsent?: boolean;
  whatsappConsent?: boolean;
  isSuspended?: boolean;
  clinicAddress?: string;
  practicingInterest?: string;
}

// ─── CME Events ────────────────────────────────────────────────────────────────
// TODO: When backend is ready, replace static data in EventService with:
//   this.http.get<CmeEvent[]>('/api/events')
//   this.http.get<CmeEvent>(`/api/events/${id}`)
//   this.http.post<CmeEvent>('/api/events', payload)

export interface CmeEvent {
  id: string;
  title: string;
  description: string;
  date: string;            // ISO date string e.g. "2026-08-15"
  time: string;            // e.g. "10:00 AM IST"
  venue: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  speaker: string;
  speakerRole: string;
  category: string;
  creditPoints: number;
  price: number;           // 0 = free
  maxSeats: number;
  registeredCount: number;
  hostId: string;
  hostName: string;
  paymentLink: string;     // mock URL — replace with real gateway link from backend
  status: 'upcoming' | 'ongoing' | 'completed';
  bannerColor?: string;    // optional accent color for UI card
  language?: string;
  preRead?: string;
  outline?: string;
  scopeDetails?: string;
  outcome?: string;
  videoAssistance?: string;
  zohoBackstageLink?: string;
}

// TODO: When backend is ready, replace with:
//   this.http.post<EventRegistration>('/api/events/register', payload)
export interface EventRegistration {
  eventId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  registeredAt: string;   // ISO timestamp
  paymentStatus: 'pending' | 'paid' | 'free' | 'sponsored';
  attended: boolean;          // Admin marks as present/absent
  certificateIssued: boolean; // Certificate issued after marking present
  attendedAt?: string;        // Timestamp when marked present
  sponsoredBy?: string;       // MR Sponsor name or sponsor code
}

export interface RegisterRequest {
  designation: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  preferredLanguage?: string;
  gender?: string;
  dateOfBirth?: string;
  medicalRegistrationNo: string;
  specialtyCategory: string;
  hospitalOrInstitutionName: string;
  organization?: string;
  departmentName?: string;
  city: string;
  professionalQualification: string;
  yearsOfExperience?: number;
  clinicAddress?: string;
  practicingInterest?: string;
  cmeInterests?: string[];
  emailOptIn: boolean;
  whatsappOptIn: boolean;
  termsAccepted: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

