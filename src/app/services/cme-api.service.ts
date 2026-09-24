import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  BackendEventAttendanceResponse,
  BackendEventJoinResponse,
  BackendEventRegistrationResponse,
  BackendEventRequest,
  BackendEventResponse,
  EventDocument,
  RegisterRequest
} from '../models/course.model';

export type BackendEventMode = 'ONLINE' | 'OFFLINE' | 'HYBRID';
export type BackendAttendanceStatus = 'PENDING' | 'PRESENT' | 'ABSENT';

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  purpose: 'REGISTRATION' | 'LOGIN';
}

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface EventNotificationPayload {
  subject: string;
  message: string;
}

export interface MarkAttendancePayload {
  registrationId: number;
  status: BackendAttendanceStatus;
  minutesAttended?: number;
  remarks?: string;
}

@Injectable({ providedIn: 'root' })
export class CmeApiService {
  private readonly apiRoot = '/api';
  private readonly eventRoot = '/api/v1/event';
  private readonly registrationRoot = '/api/v1/event-registrations';
  private readonly attendanceRoot = '/api/v1/event-attendance';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  adminLogin(payload: AdminLoginPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiRoot}/auth/admin/login`, payload);
  }

  registerDoctor(payload: RegisterRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiRoot}/auth/register`, payload);
  }

  sendLoginOtp(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiRoot}/auth/login/send-otp`, { email });
  }

  verifyOtp(payload: VerifyOtpPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiRoot}/auth/verify-otp`, payload);
  }

  getMyProfile(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiRoot}/profile/get-my-profile`, {
      headers: this.authHeaders()
    });
  }

  updateMyProfile(payload: RegisterRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiRoot}/profile/update-my-profile`, payload, {
      headers: this.authHeaders()
    });
  }

  getAllEvents(): Observable<ApiResponse<BackendEventResponse[]>> {
    return this.http.get<ApiResponse<BackendEventResponse[]>>(this.eventRoot, {
      headers: this.authHeaders()
    });
  }

  getUpcomingEvents(mode?: BackendEventMode, category?: string): Observable<ApiResponse<BackendEventResponse[]>> {
    let params = new HttpParams();
    if (mode) params = params.set('mode', mode);
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<BackendEventResponse[]>>(`${this.eventRoot}/upcoming`, {
      headers: this.authHeaders(),
      params
    });
  }

  getEventById(id: number): Observable<ApiResponse<BackendEventResponse>> {
    return this.http.get<ApiResponse<BackendEventResponse>>(`${this.eventRoot}/${id}`, {
      headers: this.authHeaders()
    });
  }

  createEvent(payload: BackendEventRequest): Observable<ApiResponse<BackendEventResponse>> {
    return this.http.post<ApiResponse<BackendEventResponse>>(this.eventRoot, payload, {
      headers: this.jsonAuthHeaders()
    });
  }

  createEventWithDocuments(payload: BackendEventRequest, documents: File[]): Observable<ApiResponse<BackendEventResponse>> {
    const form = new FormData();
    form.append('request', JSON.stringify(payload));
    for (const document of documents) {
      form.append('documents', document);
    }
    return this.http.post<ApiResponse<BackendEventResponse>>(this.eventRoot, form, {
      headers: this.authHeaders()
    });
  }

  updateEvent(id: number, payload: BackendEventRequest): Observable<ApiResponse<BackendEventResponse>> {
    return this.http.put<ApiResponse<BackendEventResponse>>(`${this.eventRoot}/${id}`, payload, {
      headers: this.jsonAuthHeaders()
    });
  }

  publishEvent(id: number): Observable<ApiResponse<BackendEventResponse>> {
    return this.http.patch<ApiResponse<BackendEventResponse>>(`${this.eventRoot}/${id}/publish`, null, {
      headers: this.authHeaders()
    });
  }

  unpublishEvent(id: number): Observable<ApiResponse<BackendEventResponse>> {
    return this.http.patch<ApiResponse<BackendEventResponse>>(`${this.eventRoot}/${id}/unpublish`, null, {
      headers: this.authHeaders()
    });
  }

  deleteEvent(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.eventRoot}/${id}`, {
      headers: this.authHeaders()
    });
  }

  getEventDocuments(eventId: number): Observable<ApiResponse<EventDocument[]>> {
    return this.http.get<ApiResponse<EventDocument[]>>(`${this.eventRoot}/${eventId}/documents`, {
      headers: this.authHeaders()
    });
  }

  getDocumentDownloadUrl(documentId: number): string {
    return `${this.eventRoot}/documents/${documentId}/download`;
  }

  uploadRecording(eventId: number, recording: File): Observable<ApiResponse<BackendEventResponse>> {
    const form = new FormData();
    form.append('recording', recording);
    return this.http.post<ApiResponse<BackendEventResponse>>(`${this.eventRoot}/${eventId}/recording`, form, {
      headers: this.authHeaders()
    });
  }

  getRecordingDownloadUrl(eventId: number): string {
    return `${this.eventRoot}/${eventId}/recording/download`;
  }

  registerForEvent(eventId: number, termsAccepted = true): Observable<ApiResponse<BackendEventRegistrationResponse>> {
    const payload = { eventId, termsAccepted };
    return this.http.post<ApiResponse<BackendEventRegistrationResponse>>(
      this.registrationRoot,
      payload,
      { headers: this.jsonAuthHeaders() }
    );
  }

  getEnrolledEvents(): Observable<ApiResponse<BackendEventRegistrationResponse[]>> {
    return this.http.get<ApiResponse<BackendEventRegistrationResponse[]>>(`${this.registrationRoot}/all`, {
      headers: this.authHeaders()
    });
  }

  getEventRegistrations(eventId: number): Observable<ApiResponse<BackendEventRegistrationResponse[]>> {
    return this.http.get<ApiResponse<BackendEventRegistrationResponse[]>>(`${this.registrationRoot}/event/${eventId}`, {
      headers: this.authHeaders()
    });
  }

  joinEvent(registrationId: number): Observable<ApiResponse<BackendEventJoinResponse>> {
    return this.http.post<ApiResponse<BackendEventJoinResponse>>(`${this.registrationRoot}/${registrationId}/join`, null, {
      headers: this.authHeaders()
    });
  }

  leaveEvent(registrationId: number): Observable<ApiResponse<BackendEventJoinResponse>> {
    return this.http.post<ApiResponse<BackendEventJoinResponse>>(`${this.registrationRoot}/${registrationId}/leave`, null, {
      headers: this.authHeaders()
    });
  }

  heartbeatEvent(registrationId: number): Observable<ApiResponse<BackendEventJoinResponse>> {
    return this.http.post<ApiResponse<BackendEventJoinResponse>>(`${this.registrationRoot}/${registrationId}/heartbeat`, null, {
      headers: this.authHeaders()
    });
  }

  completeEvent(registrationId: number): Observable<ApiResponse<BackendEventJoinResponse>> {
    return this.http.post<ApiResponse<BackendEventJoinResponse>>(`${this.registrationRoot}/${registrationId}/complete`, null, {
      headers: this.authHeaders()
    });
  }

  notifyRegisteredPeople(eventId: number, payload: EventNotificationPayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.registrationRoot}/event/${eventId}/notify`, payload, {
      headers: this.jsonAuthHeaders()
    });
  }

  markAttendance(payload: MarkAttendancePayload): Observable<ApiResponse<BackendEventAttendanceResponse>> {
    return this.http.post<ApiResponse<BackendEventAttendanceResponse>>(`${this.attendanceRoot}/mark`, payload, {
      headers: this.jsonAuthHeaders()
    });
  }

  issueCertificate(registrationId: number): Observable<ApiResponse<BackendEventAttendanceResponse>> {
    return this.http.post<ApiResponse<BackendEventAttendanceResponse>>(`${this.attendanceRoot}/${registrationId}/certificate`, null, {
      headers: this.authHeaders()
    });
  }

  getAllCertificates(): Observable<ApiResponse<{ totalCreditPoints: number; certificates: any[] }>> {
    return this.http.get<ApiResponse<{ totalCreditPoints: number; certificates: any[] }>>(
      `${this.apiRoot}/certificates/get-all-certificates`,
      { headers: this.authHeaders() }
    );
  }

  getCertificateDetails(certificateId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiRoot}/certificates/get-certificate-details/${certificateId}`, {
      headers: this.authHeaders()
    });
  }

  downloadCertificate(certificateId: number): Observable<Blob> {
    return this.http.get(`${this.apiRoot}/certificates/my-certificates/${certificateId}/download-certificate`, {
      headers: this.authHeaders(),
      params: new HttpParams().set('format', 'pdf'),
      responseType: 'blob'
    });
  }

  getAttendanceForEvent(eventId: number): Observable<ApiResponse<BackendEventAttendanceResponse[]>> {
    return this.http.get<ApiResponse<BackendEventAttendanceResponse[]>>(`${this.attendanceRoot}/event/${eventId}`, {
      headers: this.authHeaders()
    });
  }

  private jsonAuthHeaders(): HttpHeaders {
    return this.authHeaders().set('Content-Type', 'application/json');
  }

  private authHeaders(): HttpHeaders {
    const token = this.isBrowser ? localStorage.getItem('medcme_jwt_token') : null;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  hasJwtToken(): boolean {
    return this.isBrowser && !!localStorage.getItem('medcme_jwt_token');
  }
}
