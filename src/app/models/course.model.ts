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
  backendId?: number;
  title: string;
  description: string;
  date: string;            // ISO date string e.g. "2026-08-15"
  time: string;            // e.g. "10:00 AM IST"
  venue: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  speaker: string;
  speakerEmail?: string;
  speakerRole: string;
  category: string;
  creditPoints: number;
  price: number;           // 0 = free
  maxSeats: number;
  registeredCount: number;
  presentCount?: number;
  absentCount?: number;
  certificateIssuedCount?: number;
  hostId: string;
  hostName: string;
  paymentLink: string;     // mock URL — replace with real gateway link from backend
  status: 'upcoming' | 'ongoing' | 'completed';
  publicationStatus?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  bannerColor?: string;    // optional accent color for UI card
  language?: string;
  preRead?: string;
  outline?: string;
  scopeDetails?: string;
  outcome?: string;
  videoAssistance?: string;
  zohoBackstageLink?: string;
  streamEmbedUrl?: string;
  recordingFileName?: string;
  recordingContentType?: string;
  recordingFileSize?: number;
  recordingPublishedAt?: string;
  recordingAvailable?: boolean;
  recordingUrl?: string;
  recordingDownloadUrl?: string;
  documents?: EventDocument[];
}

// TODO: When backend is ready, replace with:
//   this.http.post<EventRegistration>('/api/events/register', payload)
export interface EventRegistration {
  registrationId?: number;
  eventId: string;
  backendEventId?: number;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  registeredAt: string;   // ISO timestamp
  paymentStatus: 'pending' | 'paid' | 'free' | 'sponsored';
  attended: boolean;          // Admin marks as present/absent
  attendanceStatus?: 'PENDING' | 'PRESENT' | 'ABSENT';
  certificateIssued: boolean; // Certificate issued after marking present
  attendedAt?: string;        // Timestamp when marked present
  sponsoredBy?: string;       // MR Sponsor name or sponsor code
  meetingLink?: string;
  totalAmount?: number;
}

export interface EventDocument {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
}

export interface BackendEventRequest {
  speakerName?: string;
  speakerEmail?: string;
  speakerRole?: string;
  title: string;
  description?: string;
  sequenceNo?: number;
  eventDate: string;
  eventTime: string;
  joinLink?: string;
  zohoBackstageLink?: string;
  streamEmbedUrl?: string;
  liveProvider?: 'NONE' | 'ZOHO_MEETING' | 'ZOHO_WEBINAR';
  createProviderRoom?: boolean;
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  category: string;
  mandatory: boolean;
  cmeCreditPoints?: number;
  registrationFee?: number;
  maxSeats?: number;
  cardAccentColor?: string;
}

export interface BackendEventResponse extends BackendEventRequest {
  id: number;
  createdAt?: string;
  zohoBackstageEventId?: string;
  recordingFileName?: string;
  recordingContentType?: string;
  recordingFileSize?: number;
  recordingPublishedAt?: string;
  recordingAvailable?: boolean;
  recordingUrl?: string;
  recordingDownloadUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  registrationId?: number;
  registrationStatus?: string;
  registered?: boolean;
  enrolledCount?: number;
  presentCount?: number;
  absentCount?: number;
  certificateIssuedCount?: number;
  documents?: EventDocument[];
}

export interface BackendEventRegistrationResponse {
  registrationId: number;
  registrationStatus: string;
  fullName: string;
  doctorProfileId: number;
  email: string;
  mobileNumber: string;
  specialtyCategory: string;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  meetingLink: string;
  cmeCreditPoints: number;
  registrationFee: number;
  gstAmount: number;
  totalAmount: number;
}

export interface BackendEventJoinResponse {
  registrationId: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  meetingLink: string;
  joinedAt: string;
  leftAt?: string;
  lastSeenAt?: string;
  completedAt?: string;
  minutesAttended?: number;
  attendanceStatus: string;
}

export interface BackendEventAttendanceResponse {
  attendanceId: number;
  registrationId: number;
  eventId: number;
  eventTitle: string;
  doctorProfileId: number;
  attendeeName: string;
  attendeeEmail: string;
  status: 'PENDING' | 'PRESENT' | 'ABSENT';
  minutesAttended?: number;
  remarks?: string;
  joinedAt?: string;
  leftAt?: string;
  lastSeenAt?: string;
  completedAt?: string;
  certificateIssued?: boolean;
  certificateIssuedAt?: string;
  markedAt: string;
  updatedAt?: string;
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

export interface EventDocument {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
}

export interface EventResponse {
  id: number;
  speakerName: string;
  speakerRole: string;
  title: string;
  description: string;
  sequenceNo: number;
  eventDateTime: string;
  joinLink: string | null;
  zohoBackstageLink: string | null;
  mode: string;
  category: string;
  mandatory: boolean;
  createdAt: string;
  cmeCreditPoints: number | null;
  registrationFee: number;
  maxSeats: number | null;
  cardAccentColor: string | null;
  photoUrl: string | null;
  documents: EventDocument[];
}

export interface EventPageResponse {
  content: EventResponse[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
}

export interface CreateEventRequest {
  speakerName?: string;
  speakerRole?: string;
  title: string;
  description?: string;
  sequenceNo?: number;
  eventDate: string;
  eventTime: string;
  joinLink?: string;
  zohoBackstageLink?: string;
  mode: string;
  category: string;
  mandatory?: boolean;
  cmeCreditPoints?: number;
  registrationFee?: number;
  maxSeats?: number;
  cardAccentColor?: string;
}
