import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, timeout } from 'rxjs';
import {
  AllocateCreditsResponse,
  AttendanceEntryPayload,
  AttendanceSheetData,
  AttendanceSheetRow,
  AttendanceStatusSummary,
  BackendEventAttendanceResponse,
  BackendEventRegistrationResponse,
  BackendEventRequest,
  BackendEventResponse,
  CmeEvent,
  EventDocument,
  EventRegistration,
  EventResponse,
  ApiResponse,
  EventPageResponse,
  CreateEventRequest
} from '../models/course.model';
import { CmeApiService } from './cme-api.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  /**
   * ==========================================================
   * EVENT SIGNAL
   * ==========================================================
   *
   * Backend is the source of truth.
   *
   * Components should READ:
   *
   *   this.eventService.events()
   *
   * They should NOT modify this signal directly.
   */
  private eventsSignal = signal<EventResponse[]>([]);

  /**
   * Read-only signal exposed to components.
   */
  readonly events = this.eventsSignal.asReadonly();
  private isBrowser: boolean;

  /**
   * ==========================================================
   * REGISTRATION SIGNAL
   * ==========================================================
   *
   * Keeping this temporarily because your existing application
   * still uses EventRegistration.
   *
   * Registration backend endpoints were not included in the
   * EventController you provided, so registration functionality
   * remains local for now.
   */
  private registrationsSignal = signal<EventRegistration[]>([]);

  readonly registrations = computed(
    () => this.registrationsSignal()
  );


  /**
   * API base path
   */
  private readonly apiUrl = '/api/event';


  constructor(
    @Inject(PLATFORM_ID) platformId: Object, private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }


  // ============================================================
  // EVENTS - GET ALL
  // ============================================================

  /**
   * Get paginated events from backend.
   *
   * Backend:
   * GET /api/event/get-all-events
   *
   * Example:
   * getAllEvents(0, 10)
   *
   * Optional filters:
   * mode
   * category
   */
  getAllEvents(
    page: number = 0,
    size: number = 100,
    mode?: string,
    category?: string
  ): Observable<ApiResponse<EventPageResponse>> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (mode) {
      params = params.set('mode', mode);
    }

    if (category) {
      params = params.set('category', category);
    }

    const token = this.isBrowser
      ? localStorage.getItem('medcme_jwt_token')
      : null;

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    return this.http.get<ApiResponse<EventPageResponse>>(
      `${this.apiUrl}/get-all-events`,
      {
        params,
        headers
      }
    ).pipe(
      tap(response => {

        if (response?.data?.content && Array.isArray(response.data.content)) {
          this.eventsSignal.set(response.data.content);
        } else {
          this.eventsSignal.set([]);
        }

      })
    );
  }


  // ============================================================
  // EVENTS - GET UPCOMING
  // ============================================================

  /**
   * Get upcoming events from backend.
   *
   * Backend:
   * GET /api/event/upcoming-events
   */
  getUpcomingEvents(
    mode?: string,
    category?: string
  ): Observable<ApiResponse<EventResponse[]>> {

    let params = new HttpParams();

    if (mode) {
      params = params.set('mode', mode);
    }

    if (category) {
      params = params.set('category', category);
    }

    const token = this.isBrowser
      ? localStorage.getItem('medcme_jwt_token')
      : null;

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    return this.http.get<ApiResponse<EventResponse[]>>(
      `${this.apiUrl}/upcoming-events`,
      {
        params,
        headers
      }
    ).pipe(
      tap(response => {
        if (response?.data && Array.isArray(response.data)) {
          this.eventsSignal.set(response.data);
        }
      })
    );
  }


  // ============================================================
  // EVENTS - GET BY ID
  // ============================================================

  /**
   * Get a single event from backend.
   *
   * Backend:
   * GET /api/event/view-event-details/{id}
   */
  getEventById(
    id: number
  ): Observable<ApiResponse<EventResponse>> {

    return this.http.get<ApiResponse<EventResponse>>(
      `${this.apiUrl}/view-event-details/${id}`
    );
  }


  // ============================================================
  // EVENTS - CREATE
  // ============================================================

  /**
   * Create a new event.
   *
   * Backend:
   * POST /api/event/create-new-event
   *
   * Content-Type:
   * multipart/form-data
   *
   * Supports:
   * - Event fields
   * - One photo
   * - Multiple documents
   */
  createEvent(
    request: CreateEventRequest,
    photo?: File | null,
    documents: File[] = []
  ): Observable<ApiResponse<EventResponse>> {

    const formData = new FormData();

    // ------------------------------------------
    // Event fields
    // ------------------------------------------

    formData.append(
      'speakerName',
      request.speakerName || ''
    );

    formData.append(
      'speakerRole',
      request.speakerRole || ''
    );

     formData.append(
      'speakerEmail',
      request.speakerEmail || ''
    );

    formData.append(
      'title',
      request.title
    );

    formData.append(
      'description',
      request.description || ''
    );

    formData.append(
      'sequenceNo',
      String(request.sequenceNo ?? 1)
    );

    formData.append(
      'eventDate',
      request.eventDate
    );

    formData.append(
      'eventTime',
      request.eventTime
    );

    formData.append(
      'joinLink',
      request.joinLink || ''
    );

    formData.append(
      'zohoBackstageLink',
      request.zohoBackstageLink || ''
    );

    formData.append(
      'mode',
      request.mode
    );

    formData.append(
      'category',
      request.category
    );

    formData.append(
      'mandatory',
      String(request.mandatory ?? true)
    );

    formData.append(
      'cmeCreditPoints',
      String(request.cmeCreditPoints ?? 0)
    );

    formData.append(
      'registrationFee',
      String(request.registrationFee ?? 0)
    );

    formData.append(
      'maxSeats',
      String(request.maxSeats ?? 100)
    );

    formData.append(
      'cardAccentColor',
      request.cardAccentColor || ''
    );

    // ------------------------------------------
    // Photo
    // ------------------------------------------

    if (photo) {
      formData.append('photo', photo);
    }

    // ------------------------------------------
    // Documents
    // ------------------------------------------

    documents.forEach(file => {
      formData.append('documents', file);
    });

    // ------------------------------------------
    // JWT Token
    // ------------------------------------------

    const token = localStorage.getItem('medcme_jwt_token');

    return this.http
      .post<ApiResponse<EventResponse>>(
        `${this.apiUrl}/create-new-event`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token || ''}`
          }
        }
      )
      .pipe(
        tap(response => {

          /**
           * If backend successfully creates an event,
           * add the returned event to our signal.
           */
          if (response?.data) {
            this.eventsSignal.update(events => [
              response.data,
              ...events
            ]);
          }

        })
      );
  }


  // ============================================================
  // EVENTS - UPDATE
  // ============================================================

  /**
   * Update an existing event.
   *
   * Backend:
   * PUT /api/event/update-event/{id}
   */
  updateEvent(
    id: number,
    request: CreateEventRequest
  ): Observable<ApiResponse<EventResponse>> {

    const token = this.isBrowser
      ? localStorage.getItem('medcme_jwt_token')
      : null;

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    return this.http
      .put<ApiResponse<EventResponse>>(
        `${this.apiUrl}/update-event/${id}`,
        request,
        {
          headers
        }
      )
      .pipe(
        tap(response => {

          if (response?.data) {

            this.eventsSignal.update(events =>
              events.map(event =>
                event.id === id
                  ? response.data
                  : event
              )
            );

          }

        })
      );
  }


  // ============================================================
  // EVENTS - DELETE
  // ============================================================

  /**
   * Delete an event.
   *
   * Backend:
   * DELETE /api/event/delete-event/{id}
   */
  deleteEvent(
    id: number
  ): Observable<ApiResponse<void>> {

    const token = this.isBrowser
      ? localStorage.getItem('medcme_jwt_token')
      : null;

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    return this.http
      .delete<ApiResponse<void>>(
        `${this.apiUrl}/delete-event/${id}`,
        {
          headers
        }
      )
      .pipe(
        tap(() => {

          this.eventsSignal.update(events =>
            events.filter(event => event.id !== id)
          );

        })
      );
  }


  // ============================================================
  // EVENT DOCUMENTS
  // ============================================================

  /**
   * Get documents belonging to an event.
   *
   * Backend:
   * GET /api/event/{eventId}/documents
   */
  getEventDocuments(
    eventId: number
  ): Observable<ApiResponse<EventDocument[]>> {

    return this.http.get<ApiResponse<EventDocument[]>>(
      `${this.apiUrl}/${eventId}/documents`
    );
  }


  /**
   * Build document download URL.
   *
   * Backend:
   * GET /api/event/documents/{documentId}/download
   */
  getDocumentDownloadUrl(
    documentId: number
  ): string {

    return `${this.apiUrl}/documents/${documentId}/download`;
  }


  // ============================================================
  // EVENT PHOTO
  // ============================================================

  /**
   * Build event photo URL.
   *
   * Backend response example:
   *
   * photoUrl: "/api/event/4/photo"
   */
  getEventPhotoUrl(
    event: EventResponse
  ): string | null {

    if (!event.photoUrl) {
      return null;
    }

    return event.photoUrl;
  }


  // ============================================================
  // LOCAL REGISTRATION METHODS
  // ============================================================
  //
  // IMPORTANT:
  // These methods are retained because your existing frontend
  // uses EventRegistration.
  //
  // Your EventController does NOT currently provide registration,
  // attendance or certificate APIs.
  //
  // Therefore these should eventually be migrated to a separate
  // RegistrationService once the backend endpoints are available.
  // ============================================================

  getRegistrationsByEvent(
    eventId: string
  ): EventRegistration[] {

    return this.registrationsSignal().filter(
      registration => registration.eventId === eventId
    );
  }


  isRegistered(
    eventId: string,
    userId: string
  ): boolean {

    return this.registrationsSignal().some(
      registration =>
        registration.eventId === eventId &&
        registration.userId === userId
    );
  }


  getRegistration(
    eventId: string,
    userId: string
  ): EventRegistration | undefined {

    return this.registrationsSignal().find(
      registration =>
        registration.eventId === eventId &&
        registration.userId === userId
    );
  }


  getEnrolledCount(
    eventId: string
  ): number {

    return this.registrationsSignal().filter(
      registration =>
        registration.eventId === eventId
    ).length;
  }


  getPresentCount(
    eventId: string
  ): number {

    return this.registrationsSignal().filter(
      registration =>
        registration.eventId === eventId &&
        registration.attended
    ).length;
  }


  getAbsentCount(
    eventId: string
  ): number {

    return this.registrationsSignal().filter(
      registration =>
        registration.eventId === eventId &&
        !registration.attended
    ).length;
  }


  getCertificateIssuedCount(
    eventId: string
  ): number {

    return this.registrationsSignal().filter(
      registration =>
        registration.eventId === eventId &&
        registration.certificateIssued
    ).length;
  }


  // ============================================================
  // LOCAL REGISTRATION
  // ============================================================

  registerForEvent(eventId: string, userId: string, userName: string, userEmail?: string, userPhone?: string, paymentStatus?: 'pending' | 'paid' | 'free' | 'sponsored', sponsoredBy?: string): boolean {
    const alreadyRegistered = this.registrationsSignal().some(
      r => r.eventId === eventId && r.userId === userId
    );
    if (alreadyRegistered) return false;
    const event = this.eventsSignal().find(
      e => e.id === Number(eventId)
    );
    if (!event) return false;

    const registration: EventRegistration = {
      eventId,
      userId,
      userName,
      userEmail,
      userPhone,
      registeredAt: new Date().toISOString(),
      paymentStatus: paymentStatus || 'pending',
      attended: false,
      certificateIssued: false,
      sponsoredBy
    };


    this.registrationsSignal.update(
      registrations => [
        ...registrations,
        registration
      ]
    );


    return true;
  }


  // ============================================================
  // ATTENDANCE
  // ============================================================

  markAttendance(
    eventId: string,
    userId: string,
    attended: boolean
  ): boolean {

    let found = false;

    this.registrationsSignal.update(
      registrations =>
        registrations.map(registration => {

          if (
            registration.eventId === eventId &&
            registration.userId === userId
          ) {

            found = true;

            return {
              ...registration,
              attended,
              attendedAt: attended
                ? new Date().toISOString()
                : undefined,
              certificateIssued: attended
                ? registration.certificateIssued
                : false
            };
          }

          return registration;

        })
    );

    return found;
  }


  // ============================================================
  // CERTIFICATE
  // ============================================================

  markCertificateIssued(
    eventId: string,
    userId: string
  ): boolean {

    const registration =
      this.getRegistration(eventId, userId);

    if (!registration || !registration.attended) {
      return false;
    }


    this.registrationsSignal.update(
      registrations =>
        registrations.map(registration => {

          if (
            registration.eventId === eventId &&
            registration.userId === userId
          ) {

            return {
              ...registration,
              certificateIssued: true
            };

          }

          return registration;

        })
    );


    return true;
  }


  // ============================================================
  // UI HELPERS
  // ============================================================

  /**
   * Format backend eventDateTime.
   *
   * Example:
   * 2026-12-15T09:00:00
   *
   * becomes:
   * 15 December 2026
   */
  formatDate(
    dateTime: string
  ): string {

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );
  }


  /**
   * Format event time.
   *
   * Example:
   * 2026-12-15T09:00:00
   *
   * becomes:
   * 9:00 AM
   */
  formatTime(
    dateTime: string
  ): string {

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }
    );
  }


  /**
   * Return seats left.
   *
   * NOTE:
   * EventResponse currently does NOT contain registeredCount.
   *
   * Therefore we cannot calculate:
   *
   * maxSeats - registeredCount
   *
   * from the current backend response.
   *
   * If registered count is added to backend later,
   * this method can be updated.
   */
  getSeatsLeft(
    event: EventResponse
  ): number | null {

    if (event.maxSeats === null) {
      return null;
    }

    return event.maxSeats;
  }


  /**
   * Return a suitable card color.
   *
   * Backend provides cardAccentColor.
   * If it is null, use a default frontend color.
   */
  getCardAccentColor(
    event: EventResponse
  ): string {

    return event.cardAccentColor || '#bae6fd';
  }


  /**
   * WhatsApp share URL using the NEW EventResponse fields.
   */
  getWhatsAppShareUrl(
    event: EventResponse
  ): string {

    const date = this.formatDate(
      event.eventDateTime
    );

    const time = this.formatTime(
      event.eventDateTime
    );

    const fee =
      event.registrationFee === 0
        ? 'FREE'
        : `Rs. ${event.registrationFee}`;


    const text =
      `CME Event Invitation\n\n` +
      `${event.title}\n\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      `Mode: ${event.mode}\n` +
      `Category: ${event.category}\n` +
      `Speaker: ${event.speakerName}\n` +
      `Speaker Role: ${event.speakerRole}\n` +
      `CME Credits: ${event.cmeCreditPoints ?? 0}\n` +
      `Fee: ${fee}\n\n` +
      `Register for this CME event.`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }


  // ============================================================
  // SIGNAL HELPERS
  // ============================================================

  /**
   * Clear events from the local signal.
   *
   * This does NOT delete events from backend.
   * It only clears frontend state.
   */
  clearEvents(): void {
    this.eventsSignal.set([]);
  }

  publishEvent(
  id: number
): Observable<ApiResponse<EventResponse>> {

  const token = this.isBrowser
    ? localStorage.getItem('medcme_jwt_token')
    : null;

  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  return this.http.patch<ApiResponse<EventResponse>>(
    `${this.apiUrl}/${id}/publish`,
    {},
    { headers }
  ).pipe(
    tap(response => {
      if (response?.data) {
        this.eventsSignal.update(events =>
          events.map(event =>
            event.id === id
              ? response.data!
              : event
          )
        );
      }
    })
  );
}

unpublishEvent(
  id: number
): Observable<ApiResponse<EventResponse>> {

  const token = this.isBrowser
    ? localStorage.getItem('medcme_jwt_token')
    : null;

  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  return this.http.patch<ApiResponse<EventResponse>>(
    `${this.apiUrl}/${id}/unpublish`,
    {},
    { headers }
  ).pipe(
    tap(response => {
      if (response?.data) {
        this.eventsSignal.update(events =>
          events.map(event =>
            event.id === id
              ? response.data!
              : event
          )
        );
      }
    })
  );
}

syncEventFromZoho(
  id: number
): Observable<ApiResponse<EventResponse>> {

  const token = this.isBrowser
    ? localStorage.getItem('medcme_jwt_token')
    : null;

  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  return this.http.post<ApiResponse<EventResponse>>(
    `${this.apiUrl}/${id}/sync-from-zoho`,
    {},
    { headers }
  ).pipe(
    tap(response => {
      if (response?.data) {
        this.eventsSignal.update(events =>
          events.map(event =>
            event.id === id
              ? response.data!
              : event
          )
        );
      }
    })
  );
}
}
