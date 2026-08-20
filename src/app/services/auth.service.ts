import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserProfile, Certificate } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;

  private currentUserSignal = signal<UserProfile | null>(null);
  public currentUser = computed(() => this.currentUserSignal());

  private usersSignal = signal<UserProfile[]>([]);
  public users = computed(() => this.usersSignal());

  // Static Pre-defined Accounts
  public staticDoctorAccount: UserProfile = {
    id: 'doc_101',
    name: 'Dr. Tushar Kudale',
    sirName: 'Kudale',
    email: 'doctor@medcme.org',
    phone: '9876543210',
    specialty: 'Cardiology',
    registrationNo: 'MCI-2023-88492',
    creditPoints: 2,
    purchasedCourseIds: ['course-1'],
    completedCourseIds: ['course-1'],
    certificates: [
      {
        id: 'CERT-884921',
        courseId: 'course-1',
        courseTitle: 'Advanced Cardiovascular Life Support & ECG Mastery',
        issueDate: '2026-06-15',
        creditPoints: 1,
        recipientName: 'Dr. Tushar Kudale',
        verificationCode: 'ACLS-2026-88492',
        issuer: 'Indian Council of Continuing Medical Education (ICCME)'
      },
      {
        id: 'CERT-884922',
        courseId: 'course-prior',
        courseTitle: 'Pediatric Emergency Resuscitation & Trauma Care',
        issueDate: '2026-05-10',
        creditPoints: 1,
        recipientName: 'Dr. Tushar Kudale',
        verificationCode: 'PERTC-2026-33910',
        issuer: 'Global Board of CME Accreditation'
      }
    ],
    role: 'doctor',
    city: 'Mumbai',
    interests: ['Cardiology', 'Robotic Surgery', 'Free Cardiac Clinics'],
    gender: 'Male',
    dob: '1990-08-15',
    designation: 'Senior Cardiologist',
    department: 'Cardiology',
    qualification: 'MD, DM Cardiology',
    hospital: 'Fortis Hospital Mumbai',
    experience: 8,
    language: 'English',
    emailConsent: true,
    whatsappConsent: true
  };

  public staticAdminAccount: UserProfile = {
    id: 'admin_001',
    name: 'Dr. Administrator (Chief CME Director)',
    sirName: 'Director',
    email: 'admin@medcme.org',
    phone: '9999999999',
    specialty: 'General Medicine',
    registrationNo: 'ADMIN-DIRECTOR-01',
    creditPoints: 10,
    purchasedCourseIds: ['course-1', 'course-2', 'course-3'],
    completedCourseIds: ['course-1', 'course-2'],
    certificates: [],
    role: 'admin',
    city: 'Delhi',
    interests: []
  };

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initUser();
  }

  private initUser() {
    if (this.isBrowser) {
      // Initialize dynamic users list
      const savedUsers = localStorage.getItem('medcme_all_users');
      if (savedUsers) {
        this.usersSignal.set(JSON.parse(savedUsers));
      } else {
        const initialList = [this.staticDoctorAccount];
        this.usersSignal.set(initialList);
        localStorage.setItem('medcme_all_users', JSON.stringify(initialList));
      }

      const savedUser = localStorage.getItem('medcme_user');
      if (savedUser) {
        try {
          this.currentUserSignal.set(JSON.parse(savedUser));
          return;
        } catch (e) {
          console.error('Failed to parse user session', e);
        }
      }
      // Default to guest (null)
      this.currentUserSignal.set(null);
    } else {
      this.currentUserSignal.set(null);
    }
  }

  private saveUserToStorage(user: UserProfile | null) {
    if (!this.isBrowser) return;
    if (user) {
      localStorage.setItem('medcme_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('medcme_user');
    }
  }

  checkUserExists(idOrMobile: string): boolean {
    const clean = idOrMobile.trim().toLowerCase();
    // Admin is always considered present
    if (clean === 'admin@medcme.org' || clean === '9999999999' || clean === 'admin') {
      return true;
    }
    // Check doctor accounts
    if (clean === 'doctor@medcme.org' || clean === '9876543210' || clean === 'doctor') {
      return true;
    }
    const list = this.usersSignal();
    return list.some(u => u.email.toLowerCase() === clean || u.phone === clean);
  }

  registerNewUser(profile: Partial<UserProfile>, autoLogin: boolean = false): UserProfile {
    const newUser: UserProfile = {
      id: 'doc_' + Date.now(),
      name: `${profile.designation || 'Dr.'} ${profile.name || ''} ${profile.sirName || ''}`,
      sirName: profile.sirName || '',
      email: profile.email || '',
      phone: (profile.phone || '').trim(),
      specialty: profile.specialty || 'General Medicine',
      specialtyOther: profile.specialtyOther || '',
      registrationNo: profile.registrationNo || ('MCI-2026-' + Math.floor(10000 + Math.random() * 90000)),
      creditPoints: 0,
      purchasedCourseIds: [],
      completedCourseIds: [],
      certificates: [],
      role: 'doctor',
      city: profile.city || '',
      interests: profile.interests || [],
      gender: profile.gender || 'Prefer not to say',
      dob: profile.dob || '',
      designation: profile.designation || 'Dr.',
      department: profile.department || '',
      qualification: profile.qualification || '',
      hospital: profile.hospital || '',
      organization: profile.organization || '',
      experience: profile.experience || 0,
      language: profile.language || 'English',
      emailConsent: profile.emailConsent ?? true,
      whatsappConsent: profile.whatsappConsent ?? true,
      clinicAddress: profile.clinicAddress || '',
      practicingInterest: profile.practicingInterest || ''
    };

    // Also add to the users list in local memory to allow checking existence
    this.usersSignal.update(list => {
      const updated = [...list, newUser];
      if (this.isBrowser) {
        localStorage.setItem('medcme_all_users', JSON.stringify(updated));
      }
      return updated;
    });

    if (autoLogin) {
      this.currentUserSignal.set(newUser);
      this.saveUserToStorage(newUser);
    }
    return newUser;
  }

  // Doctor Static/Dynamic Authentication
  authenticateDoctor(idOrMobile: string, passOrOtp: string): { success: boolean; message?: string } {
    const cleanId = idOrMobile.trim().toLowerCase();
    const cleanPass = passOrOtp.trim();

    if ((cleanId === 'doctor@medcme.org' || cleanId === '9876543210' || cleanId.includes('doctor')) &&
        (cleanPass === 'doctor123' || cleanPass === '123456' || cleanPass.length >= 4)) {
      
      const user = { ...this.staticDoctorAccount };
      this.currentUserSignal.set(user);
      this.saveUserToStorage(user);
      return { success: true };
    }

    // Dynamic accounts check
    const list = this.usersSignal();
    const matched = list.find(u => u.email.toLowerCase() === cleanId || u.phone === cleanId);
    if (matched && (cleanPass.length >= 4)) {
      this.currentUserSignal.set(matched);
      this.saveUserToStorage(matched);
      return { success: true };
    }

    return { success: false, message: 'Invalid Doctor credentials. Please check your username/password or register.' };
  }

  // Admin Static Authentication
  authenticateAdmin(idOrMobile: string, passOrOtp: string): { success: boolean; message?: string } {
    const cleanId = idOrMobile.trim().toLowerCase();
    const cleanPass = passOrOtp.trim();

    if ((cleanId === 'admin@medcme.org' || cleanId === '9999999999' || cleanId.includes('admin')) &&
        (cleanPass === 'admin123' || cleanPass === '999999' || cleanPass.length >= 4)) {
      
      const admin = { ...this.staticAdminAccount };
      this.currentUserSignal.set(admin);
      this.saveUserToStorage(admin);
      return { success: true };
    }

    return { success: false, message: 'Invalid Admin credentials. Use admin@medcme.org / admin123' };
  }

  isAdmin(): boolean {
    const user = this.currentUserSignal();
    return user ? user.role === 'admin' : false;
  }

  isDoctor(): boolean {
    const user = this.currentUserSignal();
    return user ? user.role === 'doctor' : true;
  }

  logout() {
    this.currentUserSignal.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('medcme_user');
    }
  }

  toggleUserRole() {
    const user = this.currentUserSignal();
    if (user && user.role === 'doctor') {
      if (this.isBrowser) {
        localStorage.setItem('medcme_last_doctor', JSON.stringify(user));
      }
      const admin = { ...this.staticAdminAccount };
      this.currentUserSignal.set(admin);
      this.saveUserToStorage(admin);
    } else {
      let doc = null;
      if (this.isBrowser) {
        const saved = localStorage.getItem('medcme_last_doctor');
        if (saved) {
          try {
            doc = JSON.parse(saved);
          } catch (e) {
            doc = null;
          }
        }
      }
      if (!doc) {
        doc = { ...this.staticDoctorAccount };
      }
      this.currentUserSignal.set(doc);
      this.saveUserToStorage(doc);
    }
  }

  isCoursePurchased(courseId: string): boolean {
    const user = this.currentUserSignal();
    return user ? user.purchasedCourseIds.includes(courseId) : false;
  }

  isCourseCompleted(courseId: string): boolean {
    const user = this.currentUserSignal();
    return user ? user.completedCourseIds.includes(courseId) : false;
  }

  purchaseCourse(courseId: string): boolean {
    const user = this.currentUserSignal();
    if (!user) return false;

    if (!user.purchasedCourseIds.includes(courseId)) {
      const updatedUser: UserProfile = {
        ...user,
        purchasedCourseIds: [...user.purchasedCourseIds, courseId]
      };
      this.currentUserSignal.set(updatedUser);
      this.saveUserToStorage(updatedUser);
    }
    return true;
  }

  completeCourse(courseId: string, courseTitle: string, creditPointAwarded: number = 1): Certificate {
    const user = this.currentUserSignal();
    if (!user) throw new Error('No active user');

    const alreadyCompleted = user.completedCourseIds.includes(courseId);
    if (alreadyCompleted) {
      const existingCert = user.certificates.find(c => c.courseId === courseId);
      if (existingCert) return existingCert;
    }

    const certId = 'CERT-' + Math.floor(100000 + Math.random() * 900000);
    const verCode = 'CME-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    const newCertificate: Certificate = {
      id: certId,
      courseId: courseId,
      courseTitle: courseTitle,
      issueDate: new Date().toISOString().split('T')[0],
      creditPoints: creditPointAwarded,
      recipientName: user.name,
      verificationCode: verCode,
      issuer: 'National Board of Medical Continuing Education (NBMCE)',
      type: 'course'
    };

    const newCompletedList = alreadyCompleted ? user.completedCourseIds : [...user.completedCourseIds, courseId];
    const newCreditPoints = user.creditPoints + (alreadyCompleted ? 0 : creditPointAwarded);

    const updatedUser: UserProfile = {
      ...user,
      creditPoints: newCreditPoints,
      completedCourseIds: newCompletedList,
      certificates: [newCertificate, ...user.certificates]
    };

    this.currentUserSignal.set(updatedUser);
    this.saveUserToStorage(updatedUser);

    return newCertificate;
  }

  updateProfile(name: string, specialty: string, registrationNo: string) {
    const user = this.currentUserSignal();
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      name,
      specialty,
      registrationNo
    };
    this.currentUserSignal.set(updated);
    this.saveUserToStorage(updated);
  }

  updateExtendedProfile(updates: Partial<UserProfile>) {
    const user = this.currentUserSignal();
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...updates
    };
    this.currentUserSignal.set(updated);
    this.saveUserToStorage(updated);
    
    this.usersSignal.update(list => {
      const next = list.map(u => u.id === user.id ? updated : u);
      if (this.isBrowser) {
        localStorage.setItem('medcme_all_users', JSON.stringify(next));
      }
      return next;
    });
  }

  updateProfileWithInterests(updatedUser: UserProfile) {
    this.currentUserSignal.set(updatedUser);
    this.saveUserToStorage(updatedUser);
    
    this.usersSignal.update(list => {
      const next = list.map(u => u.id === updatedUser.id ? updatedUser : u);
      if (this.isBrowser) {
        localStorage.setItem('medcme_all_users', JSON.stringify(next));
      }
      return next;
    });
  }

  getUserCertificates(): Certificate[] {
    const user = this.currentUserSignal();
    if (!user) return [];

    let certs = [...user.certificates];

    if (this.isBrowser) {
      try {
        // 1. Check persistent issued certificates list
        const savedCerts = localStorage.getItem('medcme_issued_event_certificates');
        if (savedCerts) {
          const list: Array<{ userId: string; cert: Certificate }> = JSON.parse(savedCerts);
          for (const item of list) {
            if (item.userId === user.id || item.cert.recipientName === user.name) {
              if (!certs.some(c => c.id === item.cert.id || (c.courseId === item.cert.courseId && c.type === 'event'))) {
                certs.unshift(item.cert);
              }
            }
          }
        }

        // 2. Check event registrations where certificateIssued === true
        const savedRegs = localStorage.getItem('medcme_registrations');
        const savedEvents = localStorage.getItem('medcme_events');
        if (savedRegs) {
          const regs: any[] = JSON.parse(savedRegs);
          const events: any[] = savedEvents ? JSON.parse(savedEvents) : [];

          for (const reg of regs) {
            if (reg.certificateIssued && (reg.userId === user.id || reg.userName === user.name)) {
              const eventObj = events.find((e: any) => e.id === reg.eventId);
              const eventTitle = eventObj ? eventObj.title : 'CME Medical Conference & Clinical Seminar';
              const creditPoints = eventObj ? (eventObj.creditPoints || 2) : 2;

              const alreadyInList = certs.some(c => c.courseId === reg.eventId && c.type === 'event');
              if (!alreadyInList) {
                const autoCert: Certificate = {
                  id: 'EVT-CERT-' + reg.eventId,
                  courseId: reg.eventId,
                  courseTitle: eventTitle,
                  issueDate: reg.attendedAt ? reg.attendedAt.split('T')[0] : new Date().toISOString().split('T')[0],
                  creditPoints,
                  recipientName: reg.userName || user.name,
                  verificationCode: 'EVTCME-2026-' + reg.eventId.replace(/[^0-9]/g, '88'),
                  issuer: 'Indian Council of Continuing Medical Education (ICCME)',
                  type: 'event'
                };
                certs.unshift(autoCert);
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse event certificates storage', e);
      }
    }
    return certs;
  }

  /**
   * Called by admin (HostDashboard) after marking a doctor as present at an event.
   * Issues a certificate to the specified doctor by userId and saves to persistent storage.
   */
  issueEventCertificate(
    userId: string,
    eventId: string,
    eventTitle: string,
    creditPoints: number,
    recipientName?: string
  ): Certificate | null {
    const certId = 'EVT-CERT-' + Math.floor(100000 + Math.random() * 900000);
    const verCode = 'EVTCME-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    const docName = recipientName || (this.currentUserSignal()?.name) || 'Dr. Tushar Kudale';

    const newCertificate: Certificate = {
      id: certId,
      courseId: eventId,
      courseTitle: eventTitle,
      issueDate: new Date().toISOString().split('T')[0],
      creditPoints,
      recipientName: docName,
      verificationCode: verCode,
      issuer: 'Indian Council of Continuing Medical Education (ICCME)',
      type: 'event'
    };

    if (this.isBrowser) {
      try {
        const saved = localStorage.getItem('medcme_issued_event_certificates');
        const list: Array<{ userId: string; cert: Certificate }> = saved ? JSON.parse(saved) : [];
        const exists = list.some(i => (i.userId === userId || i.cert.recipientName === docName) && i.cert.courseId === eventId);
        if (!exists) {
          list.push({ userId, cert: newCertificate });
          localStorage.setItem('medcme_issued_event_certificates', JSON.stringify(list));
        }
      } catch (e) {
        console.error('Failed to save issued event certificate', e);
      }
    }

    const user = this.currentUserSignal();
    if (user && (user.id === userId || user.role === 'doctor')) {
      const alreadyIssued = user.certificates.some(c => c.courseId === eventId && c.type === 'event');
      if (!alreadyIssued) {
        const updatedUser: UserProfile = {
          ...user,
          creditPoints: user.creditPoints + creditPoints,
          certificates: [newCertificate, ...user.certificates]
        };
        this.currentUserSignal.set(updatedUser);
        this.saveUserToStorage(updatedUser);
      }
    }

    return newCertificate;
  }
}
