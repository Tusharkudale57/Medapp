import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
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
  EventRegistration
} from '../models/course.model';
import { CmeApiService } from './cme-api.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private isBrowser: boolean;

  private eventsSignal = signal<CmeEvent[]>([
    {
      id: 'evt-001',
      title: 'Advanced Cardiac Life Support & Emergency Protocols 2026',
      description: 'A comprehensive ACLS update CME session covering updated resuscitation algorithms, ECG mastery, and acute cardiac emergency management for cardiologists and emergency physicians.',
      date: '2026-08-15',
      time: '09:00 AM IST',
      venue: 'AIIMS New Delhi - Auditorium Block A',
      mode: 'Offline',
      speaker: 'Dr. Vikram Malhotra',
      speakerRole: 'Head of Cardiology, AIIMS New Delhi',
      category: 'Cardiology',
      creditPoints: 2,
      price: 1999,
      maxSeats: 120,
      registeredCount: 87,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-001',
      status: 'upcoming',
      bannerColor: '#0ea5e9'
    },
    {
      id: 'evt-002',
      title: 'Pediatric Emergency Protocols & Neonatal Resuscitation',
      description: 'A critical care CME session for pediatricians and emergency physicians. Covers updated NRP guidelines, septic shock management in children, and PALS case studies.',
      date: '2026-08-22',
      time: '10:30 AM IST',
      venue: 'Online (Zoom Webinar)',
      mode: 'Online',
      speaker: 'Dr. Meenakshi Rao',
      speakerRole: 'HOD Pediatrics, Manipal Hospitals',
      category: 'Pediatrics',
      creditPoints: 1,
      price: 999,
      maxSeats: 500,
      registeredCount: 214,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-002',
      status: 'upcoming',
      bannerColor: '#8b5cf6'
    },
    {
      id: 'evt-003',
      title: 'Neurology Update: Stroke Management & Thrombolysis',
      description: 'Evidence-based stroke care CME covering tPA eligibility, mechanical thrombectomy decision-making, and post-stroke rehabilitation protocols.',
      date: '2026-09-05',
      time: '11:00 AM IST',
      venue: 'Apollo Hospitals, Chennai - Conference Hall 2',
      mode: 'Offline',
      speaker: 'Dr. Suresh Patel',
      speakerRole: 'Consultant Neurologist, Apollo Chennai',
      category: 'Neurology',
      creditPoints: 2,
      price: 1999,
      maxSeats: 80,
      registeredCount: 43,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-003',
      status: 'upcoming',
      bannerColor: '#f59e0b'
    },
    {
      id: 'evt-004',
      title: 'Surgical Oncology & Minimally Invasive Techniques',
      description: 'CME workshop on laparoscopic oncosurgery, sentinel node biopsy, and robotic-assisted procedures in GI cancers. Includes live operative demonstrations.',
      date: '2026-09-18',
      time: '09:30 AM IST',
      venue: 'Tata Memorial Centre, Mumbai',
      mode: 'Offline',
      speaker: 'Dr. Ananya Desai',
      speakerRole: 'Surgical Oncologist, Tata Memorial',
      category: 'Surgery',
      creditPoints: 3,
      price: 2499,
      maxSeats: 60,
      registeredCount: 22,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-004',
      status: 'upcoming',
      bannerColor: '#10b981'
    },
    {
      id: 'evt-005',
      title: 'Diabetes & Endocrinology: Latest Pharmacotherapy 2026',
      description: 'Comprehensive CME covering GLP-1 receptor agonists, SGLT-2 inhibitor updates, insulin pump therapy, and continuous glucose monitoring.',
      date: '2026-10-02',
      time: '02:00 PM IST',
      venue: 'Online (Google Meet)',
      mode: 'Online',
      speaker: 'Dr. Priya Nair',
      speakerRole: 'Endocrinologist, Fortis Healthcare',
      category: 'Endocrinology',
      creditPoints: 1,
      price: 1299,
      maxSeats: 1000,
      registeredCount: 389,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-005',
      status: 'upcoming',
      bannerColor: '#ec4899'
    },
    {
      id: 'evt-006',
      title: 'Modern Radiology & AI Diagnostic Algorithms',
      description: 'CME session outlining deep learning tools in CT/MRI interpretation, automated anomaly detection, and radiological diagnostic pathways.',
      date: '2026-10-15',
      time: '11:00 AM IST',
      venue: 'Online (Google Meet)',
      mode: 'Online',
      speaker: 'Dr. Sanjay Gupta',
      speakerRole: 'Head of Radiology, Ganga Hospital',
      category: 'Radiology',
      creditPoints: 2,
      price: 1499,
      maxSeats: 400,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-006',
      status: 'upcoming',
      bannerColor: '#f97316'
    },
    {
      id: 'evt-007',
      title: 'Emergency Trauma Management & Acute Surgical Care',
      description: 'CME workshop on primary trauma survey, airway management, hemorrhagic shock stabilization, and life-saving emergency room procedures.',
      date: '2026-10-22',
      time: '09:00 AM IST',
      venue: 'Sion Hospital, Mumbai - Emergency Seminar Room',
      mode: 'Offline',
      speaker: 'Dr. Amit Shah',
      speakerRole: 'Trauma Specialist, KEM Hospital',
      category: 'Emergency',
      creditPoints: 3,
      price: 2199,
      maxSeats: 70,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-007',
      status: 'upcoming',
      bannerColor: '#ef4444'
    },
    {
      id: 'evt-008',
      title: 'Infectious Diseases Update: Post-Pandemic Protocols',
      description: 'CME covering vector-borne outbreaks, multi-drug resistant bacterial infections, and antibiotic stewardship clinical guidelines.',
      date: '2026-11-05',
      time: '03:00 PM IST',
      venue: 'Online (Zoom Meeting)',
      mode: 'Online',
      speaker: 'Dr. Vineet Saran',
      speakerRole: 'Epidemiologist, Fortis Hospital',
      category: 'General Medicine',
      creditPoints: 1,
      price: 1099,
      maxSeats: 800,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-008',
      status: 'upcoming',
      bannerColor: '#14b8a6'
    },
    {
      id: 'evt-009',
      title: 'Pediatric ICU Guidelines & Ventilator Support',
      description: 'Comprehensive guidelines for managing pediatric respiratory failure, septic shock, pediatric ACLS, and foreign body aspiration.',
      date: '2026-11-12',
      time: '10:00 AM IST',
      venue: 'Online & KEM Hospital, Mumbai',
      mode: 'Hybrid',
      speaker: 'Dr. Sunita Deshmukh',
      speakerRole: 'Professor of Pediatrics, KEM Hospital',
      category: 'Pediatrics',
      creditPoints: 2,
      price: 1899,
      maxSeats: 250,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-009',
      status: 'upcoming',
      bannerColor: '#8b5cf6'
    },
    {
      id: 'evt-010',
      title: 'Advanced Laparoscopy & Minimal Access Surgery',
      description: 'Practical training and case reviews for general surgeons on laparoscopic cholecystectomy, hernia repairs, and fundoplication.',
      date: '2026-11-20',
      time: '09:00 AM IST',
      venue: 'Max Healthcare, New Delhi - Surgical Suite',
      mode: 'Offline',
      speaker: 'Dr. Rajesh Sharma',
      speakerRole: 'Director of General Surgery, Max Healthcare',
      category: 'Surgery',
      creditPoints: 3,
      price: 2999,
      maxSeats: 50,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-010',
      status: 'upcoming',
      bannerColor: '#10b981'
    },
    {
      id: 'evt-011',
      title: 'Dermatology & Cosmetology: Clinical Update 2026',
      description: 'Accredited session on managing chronic psoriasis, biological treatments, acne scarring protocols, and aesthetic dermatology laser procedures.',
      date: '2026-12-03',
      time: '02:00 PM IST',
      venue: 'Online (Zoom Webinar)',
      mode: 'Online',
      speaker: 'Dr. Shalini Sen',
      speakerRole: 'Consultant Dermatologist, Skin Clinic Delhi',
      category: 'General Medicine',
      creditPoints: 1,
      price: 1599,
      maxSeats: 500,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-011',
      status: 'upcoming',
      bannerColor: '#ec4899'
    },
    {
      id: 'evt-012',
      title: 'Critical Care Nephrology & Renal Replacement Therapy',
      description: 'CME workshop on CRRT prescription, acute kidney injury in the ICU, fluid overload management, and drug dosing adjustments during dialysis.',
      date: '2026-12-10',
      time: '09:30 AM IST',
      venue: 'Medanta Medicity, Gurugram',
      mode: 'Hybrid',
      speaker: 'Dr. Ramesh Iyer',
      speakerRole: 'Chief Nephrologist, Medanta',
      category: 'General Medicine',
      creditPoints: 2,
      price: 1799,
      maxSeats: 150,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-012',
      status: 'upcoming',
      bannerColor: '#0ea5e9'
    },
    {
      id: 'evt-013',
      title: 'Psychiatric Emergencies & De-escalation Techniques',
      description: 'CME outlining rapid assessment and intervention in acute psychosis, severe agitation, suicidal ideation, and emergency pharmacotherapy.',
      date: '2026-12-18',
      time: '04:00 PM IST',
      venue: 'Online (Google Meet)',
      mode: 'Online',
      speaker: 'Dr. Anjali Mehta',
      speakerRole: 'Consultant Psychiatrist, NIMHANS',
      category: 'General Medicine',
      creditPoints: 1,
      price: 1199,
      maxSeats: 600,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-013',
      status: 'upcoming',
      bannerColor: '#f59e0b'
    },
    {
      id: 'evt-014',
      title: 'Pulmonary Medicine & Mechanical Ventilation Protocols',
      description: 'Interactive session detailing ventilation settings in ARDS, weaning criteria, capnography analysis, and handling ventilator alarms in the ICU.',
      date: '2027-01-08',
      time: '10:00 AM IST',
      venue: 'Apollo Hospitals, Hyderabad',
      mode: 'Offline',
      speaker: 'Dr. Devendra Nath',
      speakerRole: 'Head of Pulmonology, Apollo Hyderabad',
      category: 'General Medicine',
      creditPoints: 2,
      price: 1699,
      maxSeats: 100,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-014',
      status: 'upcoming',
      bannerColor: '#f97316'
    },
    {
      id: 'evt-015',
      title: 'Gynecological Laparoscopy Workshop & Hysteroscopy',
      description: 'Accredited surgery workshop focusing on pelvic anatomy, laparoscopic suturing techniques, and hysterectomy simulation training.',
      date: '2027-01-15',
      time: '09:00 AM IST',
      venue: 'Sir Ganga Ram Hospital, New Delhi',
      mode: 'Offline',
      speaker: 'Dr. Preeti Sinha',
      speakerRole: 'Senior Gynecologist, Ganga Ram Hospital',
      category: 'Surgery',
      creditPoints: 3,
      price: 2299,
      maxSeats: 60,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-015',
      status: 'upcoming',
      bannerColor: '#10b981'
    },
    {
      id: 'evt-016',
      title: 'Rheumatology Update: Biologics & Biosimilars',
      description: 'Accredited review of clinical guidelines in early rheumatoid arthritis treatment, targeted therapies, and JAK inhibitor safety profiles.',
      date: '2027-02-05',
      time: '03:00 PM IST',
      venue: 'Online (Zoom Meeting)',
      mode: 'Online',
      speaker: 'Dr. Niraj Verma',
      speakerRole: 'Rheumatologist, Medicity',
      category: 'General Medicine',
      creditPoints: 1,
      price: 1399,
      maxSeats: 500,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-016',
      status: 'upcoming',
      bannerColor: '#ec4899'
    },
    {
      id: 'evt-017',
      title: 'Hematology: Diagnostics & Bone Marrow Transplants',
      description: 'CME covering diagnostic assays for leukemias, coagulation disorders, and indications/complications in clinical stem cell transplants.',
      date: '2027-02-12',
      time: '11:30 AM IST',
      venue: 'Tata Medical Center, Kolkata & Online',
      mode: 'Hybrid',
      speaker: 'Dr. Sandeep Roy',
      speakerRole: 'Clinical Hematologist, Tata Medical Center',
      category: 'General Medicine',
      creditPoints: 2,
      price: 2599,
      maxSeats: 200,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-017',
      status: 'upcoming',
      bannerColor: '#14b8a6'
    },
    {
      id: 'evt-018',
      title: 'Ophthalmology: Advanced Cataract Surgery (Phacoemulsification)',
      description: 'Operative workshop outlining premium IOL selections, managing intraoperative complications, and hands-on phaco training.',
      date: '2027-03-05',
      time: '09:00 AM IST',
      venue: 'L. V. Prasad Eye Institute, Hyderabad',
      mode: 'Offline',
      speaker: 'Dr. Harish Salve',
      speakerRole: 'Director Ophthalmologist, LVPEI',
      category: 'Surgery',
      creditPoints: 3,
      price: 1999,
      maxSeats: 80,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-018',
      status: 'upcoming',
      bannerColor: '#8b5cf6'
    },
    {
      id: 'evt-019',
      title: 'Geriatric Medicine & Palliative Care Protocols',
      description: 'Guidelines on polypharmacy management in elderly patients, cognitive decline assessments, and end-of-life palliative pain control.',
      date: '2027-03-12',
      time: '02:00 PM IST',
      venue: 'Online (Zoom Meeting)',
      mode: 'Online',
      speaker: 'Dr. K. R. Narayan',
      speakerRole: 'Geriatrician, Apollo Hospitals',
      category: 'General Medicine',
      creditPoints: 1,
      price: 1299,
      maxSeats: 700,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-019',
      status: 'upcoming',
      bannerColor: '#f59e0b'
    },
    {
  id: '3',
  backendId: 3,
  title: 'Advanced Cardiology CME Workshop',
  description: 'A live CME workshop covering recent advances in cardiology.',
  date: '2026-10-15',
  time: '10:00 AM IST',
  venue: 'Online',
  mode: 'Online',
  speaker: 'Dr. Rahul Sharma',
  speakerEmail: 'rahul.sharma@example.com',
  speakerRole: 'Senior Cardiologist',
  category: 'Cardiology',
  creditPoints: 2,
  price: 1000,
  maxSeats: 100,
  registeredCount: 0,
  hostId: 'admin_001',
  hostName: 'Dr. Administrator (Chief CME Director)',
  paymentLink: 'https://example.com/join/cardiology',
  status: 'upcoming',
  publicationStatus: 'PUBLISHED',
  bannerColor: '#1976D2',
  zohoBackstageLink: 'https://example.com/event/cardiology',
  streamEmbedUrl: 'https://example.com/embed/cardiology'
},

{
  id: '4',
  backendId: 4,
  title: 'Recent Advances in Neurology',
  description: 'An interactive CME session covering recent developments in neurology, diagnosis, and patient management.',
  date: '2026-11-20',
  time: '10:00 AM IST',
  venue: 'Online',
  mode: 'Online',
  speaker: 'Dr. Priya Mehta',
  speakerEmail: 'priya.mehta@example.com',
  speakerRole: 'Senior Neurologist',
  category: 'Neurology',
  creditPoints: 3,
  price: 750,
  maxSeats: 150,
  registeredCount: 0,
  hostId: 'admin_001',
  hostName: 'Dr. Administrator (Chief CME Director)',
  paymentLink: 'https://example.com/join/neurology',
  status: 'upcoming',
  publicationStatus: 'PUBLISHED',
  bannerColor: '#7B1FA2',
  zohoBackstageLink: 'https://example.com/event/neurology',
  streamEmbedUrl: 'https://example.com/embed/neurology'
},
    {
      id: 'evt-002',
      backendId: 2,
      title: 'Clinical Pharmacology & Dangerous Drug Interactions',
      description: 'Accredited session focused on pharmacokinetics, CYP450 enzyme inducers/inhibitors, and preventing adverse drug events in clinical practice.',
      date: '2027-04-02',
      time: '04:00 PM IST',
      venue: 'Online (Google Meet)',
      mode: 'Online',
      speaker: 'Dr. Suresh Chand',
      speakerRole: 'Professor of Pharmacology, AIIMS',
      category: 'General Medicine',
      creditPoints: 1,
      price: 1099,
      maxSeats: 900,
      registeredCount: 0,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-002',
      status: 'upcoming',
      bannerColor: '#ef4444'
    },
    {
      id: 'evt-021',
      title: 'Orthopedic Update: Joint Replacement & Sports Injuries 2026',
      description: 'CME workshop covering advances in total knee and hip arthroplasty, ACL reconstruction techniques, and post-op rehabilitation protocols for orthopedic surgeons.',
      date: '2026-09-10',
      time: '09:30 AM IST',
      venue: 'Kokilaben Hospital, Mumbai - Seminar Hall',
      mode: 'Offline',
      speaker: 'Dr. Nikhil Kadam',
      speakerRole: 'Senior Orthopedic Surgeon, Kokilaben Hospital',
      category: 'Orthopedics',
      creditPoints: 2,
      price: 1799,
      maxSeats: 100,
      registeredCount: 34,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-021',
      status: 'upcoming',
      bannerColor: '#10b981'
    },
    {
      id: 'evt-022',
      title: 'Oncology Masterclass: Immunotherapy & Targeted Therapy',
      description: 'Latest evidence on PD-1/PD-L1 checkpoint inhibitors, CAR-T cell therapy, and biomarker-driven treatment decisions in solid tumors and hematological malignancies.',
      date: '2026-09-20',
      time: '11:00 AM IST',
      venue: 'Online (Zoom Webinar)',
      mode: 'Online',
      speaker: 'Dr. Priya Bhatia',
      speakerRole: 'Medical Oncologist, Rajiv Gandhi Cancer Institute',
      category: 'Oncology',
      creditPoints: 2,
      price: 1499,
      maxSeats: 600,
      registeredCount: 178,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-022',
      status: 'upcoming',
      bannerColor: '#ec4899'
    },
    {
      id: 'evt-023',
      title: 'Obstetrics & Gynecology: High-Risk Pregnancy Management',
      description: 'Evidence-based CME on managing gestational diabetes, preeclampsia, PROM, placenta previa, and fetal monitoring in high-risk obstetric cases.',
      date: '2026-10-08',
      time: '10:00 AM IST',
      venue: 'Online & Wockhardt Hospital, Mumbai',
      mode: 'Hybrid',
      speaker: 'Dr. Rekha Singhal',
      speakerRole: 'HOD Obstetrics & Gynecology, Wockhardt Hospital',
      category: 'Obstetrics',
      creditPoints: 2,
      price: 1299,
      maxSeats: 300,
      registeredCount: 92,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-023',
      status: 'upcoming',
      bannerColor: '#f472b6'
    },
    {
      id: 'evt-024',
      title: 'Pulmonology: COPD, Asthma & Interstitial Lung Disease',
      description: 'Clinical update on GOLD COPD guidelines, biologic therapies in severe asthma, antifibrotic treatment in IPF, and pulmonary rehabilitation protocols.',
      date: '2026-10-18',
      time: '02:30 PM IST',
      venue: 'Online (Google Meet)',
      mode: 'Online',
      speaker: 'Dr. Avinash Bhatt',
      speakerRole: 'Consultant Pulmonologist, Hinduja Hospital',
      category: 'General Medicine',
      creditPoints: 1,
      price: 999,
      maxSeats: 800,
      registeredCount: 241,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-024',
      status: 'upcoming',
      bannerColor: '#38bdf8'
    },
    {
      id: 'evt-025',
      title: 'Urology: Robotic Surgery & Uro-Oncology Update',
      description: 'Advanced CME session on robotic prostatectomy, bladder cancer BCG immunotherapy, renal tumor ablation, and urological laparoscopy case reviews.',
      date: '2026-11-07',
      time: '09:00 AM IST',
      venue: 'Global Hospital, Chennai - Urology Suite',
      mode: 'Offline',
      speaker: 'Dr. Santosh Kulkarni',
      speakerRole: 'Director Urology & Robotic Surgery, Global Hospital',
      category: 'Surgery',
      creditPoints: 3,
      price: 2299,
      maxSeats: 75,
      registeredCount: 28,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-025',
      status: 'upcoming',
      bannerColor: '#6366f1'
    },
    {
      id: 'evt-026',
      title: 'ENT & Head-Neck Surgery: Endoscopic & Microsurgery CME',
      description: 'Accredited CME covering functional endoscopic sinus surgery (FESS), thyroid surgery, cholesteatoma management, and cochlear implant evaluation protocols.',
      date: '2026-11-25',
      time: '10:30 AM IST',
      venue: 'Online & Lilavati Hospital, Mumbai',
      mode: 'Hybrid',
      speaker: 'Dr. Deepa Menon',
      speakerRole: 'Head of ENT, Lilavati Hospital Mumbai',
      category: 'Surgery',
      creditPoints: 2,
      price: 1599,
      maxSeats: 200,
      registeredCount: 55,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-026',
      status: 'upcoming',
      bannerColor: '#f59e0b'
    },
    {
      id: 'evt-027',
      title: 'Gastroenterology & Hepatology Update: IBD & NAFLD 2026',
      description: 'Comprehensive CME on modern biologic therapy in Inflammatory Bowel Disease, Non-Alcoholic Fatty Liver Disease (MAFLD) management, and advanced therapeutic endoscopy protocols.',
      date: '2026-11-28',
      time: '09:00 AM IST',
      venue: 'Sir Ganga Ram Hospital, New Delhi',
      mode: 'Offline',
      speaker: 'Dr. Alok Verma',
      speakerRole: 'HOD Gastroenterology, Sir Ganga Ram Hospital',
      category: 'Gastroenterology',
      creditPoints: 2,
      price: 1899,
      maxSeats: 120,
      registeredCount: 42,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-027',
      status: 'upcoming',
      bannerColor: '#10b981'
    },
    {
      id: 'evt-028',
      title: 'Anesthesiology & Airway Management Masterclass 2026',
      description: 'CME workshop on difficult airway algorithms, videolaryngoscopy, ultrasound-guided regional nerve blocks, and perioperative hemodynamic monitoring.',
      date: '2026-12-05',
      time: '11:00 AM IST',
      venue: 'Online (Zoom Webinar)',
      mode: 'Online',
      speaker: 'Dr. Smita Kapoor',
      speakerRole: 'Professor of Anesthesiology, PGI Chandigarh',
      category: 'General Medicine',
      creditPoints: 2,
      price: 1399,
      maxSeats: 500,
      registeredCount: 165,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-028',
      status: 'upcoming',
      bannerColor: '#0ea5e9'
    },
    {
      id: 'evt-029',
      title: 'Clinical Pathology & Laboratory Medicine Guidelines',
      description: 'Accredited session covering next-generation sequencing in oncology, liquid biopsy interpretation, and quality assurance in automated diagnostic labs.',
      date: '2026-12-12',
      time: '02:00 PM IST',
      venue: 'Online & Metropolis Diagnostics Centre, Mumbai',
      mode: 'Hybrid',
      speaker: 'Dr. Rajiv Mukherji',
      speakerRole: 'Chief Pathologist, Metropolis Healthcare',
      category: 'General Medicine',
      creditPoints: 1,
      price: 1199,
      maxSeats: 350,
      registeredCount: 88,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-029',
      status: 'upcoming',
      bannerColor: '#8b5cf6'
    },
    {
      id: 'evt-030',
      title: 'Rheumatology & Autoimmune Disorders: Biologic Therapies',
      description: 'Clinical update on targeted DMARDs, JAK inhibitors in Rheumatoid Arthritis, SLE management guidelines, and early diagnosis of Spondyloarthritis.',
      date: '2026-12-20',
      time: '10:00 AM IST',
      venue: 'Medanta Medicity, Gurugram - Auditorium',
      mode: 'Offline',
      speaker: 'Dr. Meera Joshi',
      speakerRole: 'Head of Rheumatology, Medanta Gurugram',
      category: 'General Medicine',
      creditPoints: 2,
      price: 1699,
      maxSeats: 150,
      registeredCount: 61,
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: 'https://medcme.org/pay/evt-030',
      status: 'upcoming',
      bannerColor: '#ec4899'
    },
  ]);

  private registrationsSignal = signal<EventRegistration[]>([]);

  public events = computed(() => this.eventsSignal());
  public registrations = computed(() => this.registrationsSignal());

  constructor(@Inject(PLATFORM_ID) platformId: Object, private api: CmeApiService) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadFromStorage();
    if (this.isBrowser) {
      this.syncEventsFromBackend();
    }
    
    // Inject mock detail fields to all events and override bannerColor with soft, light blue shades
    const silentColors = ['#bae6fd', '#e0f2fe', '#dbeafe', '#93c5fd', '#bae6fd', '#bae6fd'];
    this.eventsSignal.update(events => events.map((e, index) => ({
      ...e,
      bannerColor: silentColors[index % silentColors.length],
      language: e.language || 'English',
      preRead: e.preRead || 'ACLS Resuscitation Guidelines & Pre-Event Study Guide (PDF)',
      outline: e.outline || '1. Introduction & Panel Details\n2. Basic MCQ (Pre-Test)\n3. Lecture Session 1\n4. Mid-Session MCQ (Knowledge Check)\n5. Lecture Session 2\n6. Live Q&A and Expert Panel Discussion',
      scopeDetails: e.scopeDetails || `Accredited CME event focusing on advanced clinical protocols, guidelines, and diagnostic decisions. Earn +${e.creditPoints} CME points.`,
      outcome: e.outcome || 'Mastery of specialized diagnostics, implementation of critical protocols, and verified CME credits.',
      videoAssistance: e.videoAssistance || 'Live Stream, 2 Dedicated Moderators, 1-2 Consultants for Chat Q&A',
      zohoBackstageLink: e.zohoBackstageLink || '',
      streamEmbedUrl: e.streamEmbedUrl || ''
    })));
  }

  async syncEventsFromBackend(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getAllEvents());
      if (response?.success && Array.isArray(response.data)) {
        const backendEvents = response.data.map(e => this.mapBackendEventToUi(e));
        if (backendEvents.length > 0) {
          this.eventsSignal.set(this.sortEventsByDateDesc(backendEvents));
          this.saveEventsToStorage();
          await this.syncRegistrationsFromBackend();
        }
      }
    } catch (e) {
      console.warn('Backend events unavailable; using local event data.', e);
    }
  }

  async syncRegistrationsFromBackend(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getEnrolledEvents());
      if (response?.success && Array.isArray(response.data)) {
        const userRegistrations = response.data.map(r => this.mapBackendRegistrationToUi(r));
        this.replaceBackendRegistrations(userRegistrations);
      }
    } catch (e) {
      this.registrationsSignal.set([]);
      this.saveRegistrationsToStorage();
      console.warn('Backend enrolled events unavailable; using local registrations.', e);
    }
  }

  async syncEventRegistrationsFromBackend(eventId: string): Promise<void> {
    const event = this.getEventById(eventId);
    const backendId = event?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return;
    try {
      const response = await firstValueFrom(this.api.getEventRegistrations(backendId));
      if (response?.success && Array.isArray(response.data)) {
        const registrations = response.data.map(r => this.mapBackendRegistrationToUi(r));
        if (registrations.length > 0) {
          this.mergeRegistrations(registrations);
        }
      }
    } catch (e) {
      console.warn('Backend event registrations unavailable; using local registrations.', e);
    }
  }

  async syncAttendanceFromBackend(eventId: string): Promise<void> {
    const event = this.getEventById(eventId);
    const backendId = event?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return;
    try {
      const response = await firstValueFrom(this.api.getAttendanceForEvent(backendId));
      if (response?.success && Array.isArray(response.data)) {
        this.applyBackendAttendance(response.data);
      }
    } catch (e) {
      console.warn('Backend attendance unavailable; using local attendance.', e);
    }
    await this.syncAttendanceSheetFromBackend(eventId);
  }

  /**
   * GET /api/admin/attendance/event/{eventId}/get-attendance-sheet
   * Sync full attendance sheet data & update local stats/registrations
   */
  async syncAttendanceSheetFromBackend(eventId: string): Promise<AttendanceSheetData | null> {
    const event = this.getEventById(eventId);
    const backendId = event?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return null;
    try {
      const response = await firstValueFrom(this.api.getAttendanceSheet(backendId));
      const sheetData: AttendanceSheetData | null = response?.data || (response?.rows ? response : null);
      if (sheetData) {
        // Update event statistics
        this.eventsSignal.update(events =>
          events.map(e => e.id === eventId ? {
            ...e,
            registeredCount: sheetData.enrolledCount ?? e.registeredCount,
            presentCount: sheetData.presentCount ?? e.presentCount,
            absentCount: sheetData.absentCount ?? e.absentCount,
            certificateIssuedCount: sheetData.certsIssuedCount ?? e.certificateIssuedCount
          } : e)
        );
        this.saveEventsToStorage();

        // Update registrations signal from backend rows
        if (Array.isArray(sheetData.rows)) {
          this.registrationsSignal.update(regs => {
            const list = [...regs];
            for (const row of sheetData.rows) {
              const idx = list.findIndex(r => r.eventId === eventId && (
                r.registrationId === row.registrationId ||
                r.userName === row.doctorName ||
                (r.userPhone && row.mobileNumber && r.userPhone === row.mobileNumber)
              ));
              if (idx >= 0) {
                list[idx] = {
                  ...list[idx],
                  registrationId: row.registrationId || list[idx].registrationId,
                  attended: row.attended,
                  attendanceStatus: row.attended ? 'PRESENT' : 'ABSENT',
                  certificateIssued: row.creditsStatus === 'Issued' || row.creditsStatus === 'Allocated',
                  paymentStatus: (row.paymentStatus?.toLowerCase() === 'confirmed' ? 'paid' : list[idx].paymentStatus) as any
                };
              } else {
                // Add missing row from backend as new UI registration
                list.push({
                  registrationId: row.registrationId,
                  eventId: eventId,
                  backendEventId: backendId,
                  userId: 'doc_backend_' + row.registrationId,
                  userName: row.doctorName || 'Dr. Doctor',
                  userPhone: row.mobileNumber || '9876543210',
                  registeredAt: new Date().toISOString(),
                  paymentStatus: (row.paymentStatus?.toLowerCase() === 'confirmed' ? 'paid' : 'pending') as any,
                  attended: row.attended,
                  attendanceStatus: row.attended ? 'PRESENT' : 'ABSENT',
                  certificateIssued: row.creditsStatus === 'Issued' || row.creditsStatus === 'Allocated'
                });
              }
            }
            return list;
          });
          this.saveRegistrationsToStorage();
        }
        return sheetData;
      }
    } catch (e) {
      console.warn('Backend attendance sheet unavailable; using local sheet.', e);
    }
    return null;
  }

  /**
   * PUT /api/admin/attendance/event/{eventId}/attendance-update-one-or-bulk
   * Single or bulk update doctor attendance
   */
  async updateAttendanceOneOrBulk(eventId: string, entries: AttendanceEntryPayload[]): Promise<boolean> {
    const event = this.getEventById(eventId);
    const backendId = event?.backendId ?? this.toBackendId(eventId);
    
    // Update local signal state immediately for high responsiveness
    const entryMap = new Map<number, boolean>();
    entries.forEach(e => entryMap.set(e.registrationId, e.present));

    this.registrationsSignal.update(regs =>
      regs.map(r => {
        if (r.eventId === eventId && r.registrationId && entryMap.has(r.registrationId)) {
          const isPresent = entryMap.get(r.registrationId)!;
          return {
            ...r,
            attended: isPresent,
            attendanceStatus: isPresent ? 'PRESENT' : 'ABSENT',
            attendedAt: isPresent ? new Date().toISOString() : undefined,
            certificateIssued: isPresent ? r.certificateIssued : false
          };
        }
        return r;
      })
    );
    this.saveRegistrationsToStorage();

    if (backendId) {
      try {
        await firstValueFrom(this.api.updateAttendanceBulk(backendId, entries));
        await this.syncAttendanceSheetFromBackend(eventId);
        return true;
      } catch (e) {
        console.warn('Backend bulk attendance update failed; local attendance retained.', e);
      }
    }
    return true;
  }

  /**
   * POST /api/admin/attendance/event/{eventId}/allocate-credits
   * Allocate CME credits and issue certificates end-to-end
   */
  async allocateCreditsForEvent(eventId: string): Promise<{ certificatesIssued: number; alreadyIssued: number; sheet?: AttendanceSheetData }> {
    const event = this.getEventById(eventId);
    const backendId = event?.backendId ?? this.toBackendId(eventId);

    let result = { certificatesIssued: 0, alreadyIssued: 0, sheet: undefined as AttendanceSheetData | undefined };

    if (backendId) {
      try {
        const response = await firstValueFrom(this.api.allocateCredits(backendId));
        const resData = response?.data || response;
        if (resData && typeof resData.certificatesIssued === 'number') {
          result.certificatesIssued = resData.certificatesIssued;
          result.alreadyIssued = resData.alreadyIssued ?? 0;
          result.sheet = resData.sheet;
        }
      } catch (e) {
        console.warn('Backend allocate-credits endpoint call failed; falling back to local allocation.', e);
      }
    }

    // Update local registrations to mark certificateIssued = true
    let localIssuedCount = 0;
    this.registrationsSignal.update(list =>
      list.map(r => {
        if (r.eventId === eventId && r.attended) {
          if (!r.certificateIssued) {
            localIssuedCount++;
          }
          return { ...r, certificateIssued: true };
        }
        return r;
      })
    );
    this.saveRegistrationsToStorage();

    if (result.certificatesIssued === 0 && localIssuedCount > 0) {
      result.certificatesIssued = localIssuedCount;
    }

    // Update event stats
    if (event) {
      this.eventsSignal.update(events =>
        events.map(e => e.id === eventId ? {
          ...e,
          certificateIssuedCount: Math.max((e.certificateIssuedCount || 0), (this.getPresentCount(eventId)))
        } : e)
      );
      this.saveEventsToStorage();
    }

    return result;
  }

  /**
   * GET /api/admin/attendance/event/{eventId}/export-attendance-sheet
   * Download/Export event attendance sheet
   */
  async exportAttendanceSheet(eventId: string): Promise<boolean> {
    const event = this.getEventById(eventId);
    const backendId = event?.backendId ?? this.toBackendId(eventId);
    if (backendId) {
      try {
        const blob = await firstValueFrom(this.api.exportAttendanceSheet(backendId));
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `CME_Attendance_Sheet_${event?.title ? event.title.replace(/\s+/g, '_') : backendId}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
          return true;
        }
      } catch (e) {
        console.warn('Backend export-attendance-sheet failed; client CSV export fallback will handle download.', e);
      }
    }
    return false;
  }


  private loadFromStorage() {
    if (!this.isBrowser) return;
    try {
      const savedEvents = localStorage.getItem('medcme_events');
      if (savedEvents) {
        const parsed = JSON.parse(savedEvents);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((e: any) => e.id));
          const missingDefaults = this.eventsSignal().filter(e => !existingIds.has(e.id));
          if (missingDefaults.length > 0) {
            const merged = this.sortEventsByDateDesc([...parsed, ...missingDefaults]);
            this.eventsSignal.set(merged);
            localStorage.setItem('medcme_events', JSON.stringify(merged));
            return;
          } else {
            this.eventsSignal.set(this.sortEventsByDateDesc(parsed));
            return;
          }
        }
      }
      // Save default list to storage if cached events are shorter/empty
      this.saveEventsToStorage();
    } catch (e) {
      console.error('Failed to load event data from storage', e);
    }
  }

  private saveRegistrationsToStorage() {
    if (!this.isBrowser) return;
    localStorage.setItem('medcme_registrations', JSON.stringify(this.registrationsSignal()));
  }

  private saveEventsToStorage() {
    if (!this.isBrowser) return;
    localStorage.setItem('medcme_events', JSON.stringify(this.eventsSignal()));
  }

  getUpcomingEvents(): CmeEvent[] {
    return this.sortEventsByDateDesc(
      this.eventsSignal().filter(e => e.status === 'upcoming' && this.isFutureEvent(e))
    );
  }

  getPastEvents(): CmeEvent[] {
    return this.sortEventsByDateDesc(
      this.eventsSignal().filter(e => this.isPastEvent(e))
    );
  }

  getEventById(id: string): CmeEvent | undefined {
    return this.eventsSignal().find(e => e.id === id);
  }

  getEventsByHost(hostId: string): CmeEvent[] {
    return this.sortEventsByDateDesc(this.eventsSignal().filter(e => e.hostId === hostId));
  }

  getRegistrationsByEvent(eventId: string): EventRegistration[] {
    return this.registrationsSignal().filter(r => r.eventId === eventId);
  }

  getRegisteredEvents(userId?: string, userEmail?: string): CmeEvent[] {
    const registrations = this.registrationsSignal().filter(reg =>
      (!userId && !userEmail) ||
      reg.userId === userId ||
      Boolean(userEmail && reg.userEmail?.toLowerCase() === userEmail.toLowerCase())
    );
    const events = registrations.map(registration => {
      const event = this.eventsSignal().find(candidate =>
        candidate.backendId === registration.backendEventId ||
        (candidate.backendId === this.toBackendId(registration.eventId) && candidate.id !== registration.eventId)
      );
      return event || this.mapRegistrationToEvent(registration);
    });
    return this.sortEventsByDateDesc(events.filter((event, index, list) =>
      list.findIndex(candidate => candidate.id === event.id) === index
    ));
  }

  isRegistered(eventId: string, userId: string): boolean {
    return this.registrationsSignal().some(r => r.eventId === eventId && r.userId === userId);
  }

  getRegistration(eventId: string, userId: string): EventRegistration | undefined {
    return this.registrationsSignal().find(r => r.eventId === eventId && r.userId === userId);
  }

  getEnrolledCount(eventId: string): number {
    const event = this.getEventById(eventId);
    const localCount = this.registrationsSignal().filter(r => r.eventId === eventId).length;
    return Math.max(Number(event?.registeredCount || 0), localCount);
  }

  getPresentCount(eventId: string): number {
    const event = this.getEventById(eventId);
    const localCount = this.registrationsSignal().filter(r => r.eventId === eventId && r.attended).length;
    return Math.max(Number(event?.presentCount || 0), localCount);
  }

  getAbsentCount(eventId: string): number {
    const event = this.getEventById(eventId);
    const localCount = this.registrationsSignal().filter(r => r.eventId === eventId && r.attendanceStatus === 'ABSENT').length;
    return Math.max(Number(event?.absentCount || 0), localCount);
  }

  getCertificateIssuedCount(eventId: string): number {
    const event = this.getEventById(eventId);
    const localCount = this.registrationsSignal().filter(r => r.eventId === eventId && r.certificateIssued).length;
    return Math.max(Number(event?.certificateIssuedCount || 0), localCount);
  }

  /**
   * Registers a doctor for an event via POST /api/v1/event-registrations.
   * Resolves `true` only after the backend confirms success, so callers can
   * gate "Registration Successful" / "Enrolled" UI on the actual response.
   */
  registerForEvent(
    eventId: string,
    userId: string,
    userName: string,
    userEmail?: string,
    userPhone?: string,
    paymentStatus?: 'pending' | 'paid' | 'free' | 'sponsored',
    sponsoredBy?: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const alreadyRegistered = this.registrationsSignal().some(
        r => r.eventId === eventId && r.userId === userId
      );
      if (alreadyRegistered) {
        resolve(false);
        return;
      }

      const event = this.getEventById(eventId);
      if (!event) {
        resolve(false);
        return;
      }

      const backendEventId = event.backendId ?? this.toBackendId(eventId);
      if (!backendEventId) {
        console.warn('Cannot register: missing backend event id for', eventId);
        resolve(false);
        return;
      }

      this.api.registerForEvent(backendEventId, true).subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            const registration = this.mapBackendRegistrationToUi(response.data, userId);
            registration.paymentStatus = paymentStatus || (event.price === 0 ? 'free' : 'paid');
            registration.sponsoredBy = sponsoredBy;
            registration.userName = registration.userName || userName;
            registration.userPhone = registration.userPhone || userPhone;

            this.registrationsSignal.update(list => [...list, registration]);
            this.eventsSignal.update(events =>
              this.sortEventsByDateDesc(events.map(e =>
                e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e
              ))
            );
            this.saveRegistrationsToStorage();
            this.saveEventsToStorage();
            resolve(true);
          } else {
            resolve(false);
          }
        },
        error: (e) => {
          console.warn('Backend event registration failed.', e);
          resolve(false);
        }
      });
    });
  }

  markAttendance(eventId: string, userId: string, attended: boolean): boolean {
    let found = false;
    this.registrationsSignal.update(list =>
      list.map(r => {
        if (r.eventId === eventId && r.userId === userId) {
          found = true;
          return {
            ...r,
            attended,
            attendanceStatus: attended ? 'PRESENT' : 'ABSENT',
            attendedAt: attended ? new Date().toISOString() : undefined,
            certificateIssued: attended ? r.certificateIssued : false
          };
        }
        return r;
      })
    );
    if (found) {
      this.saveRegistrationsToStorage();
      const reg = this.getRegistration(eventId, userId);
      if (reg?.registrationId) {
        this.updateAttendanceOneOrBulk(eventId, [{
          registrationId: reg.registrationId,
          present: attended
        }]);
      }
    }
    return found;
  }

  markCertificateIssued(eventId: string, userId: string): boolean {
    const reg = this.getRegistration(eventId, userId);
    if (!reg || !reg.attended) return false;
    this.registrationsSignal.update(list =>
      list.map(r =>
        r.eventId === eventId && r.userId === userId
          ? { ...r, certificateIssued: true }
          : r
      )
    );
    this.saveRegistrationsToStorage();
    if (reg.registrationId) {
      this.api.issueCertificate(reg.registrationId).subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            this.applyBackendAttendance([response.data]);
            this.refreshEventFromBackend(eventId);
          }
        },
        error: (e) => console.warn('Backend certificate issue failed; local certificate retained.', e)
      });
    }
    return true;
  }

  addEvent(partial: Partial<CmeEvent>, hostId: string, hostName: string): CmeEvent {
    const tempId = 'evt-' + Date.now();
    const newEvent: CmeEvent = {
      id: tempId,
      title: partial.title || 'Untitled CME Event',
      description: partial.description || '',
      date: partial.date || new Date().toISOString().split('T')[0],
      time: partial.time || '10:00 AM IST',
      venue: partial.venue || 'TBD',
      mode: partial.mode || 'Online',
      speaker: partial.speaker || '',
      speakerEmail: partial.speakerEmail || '',
      speakerRole: partial.speakerRole || '',
      category: partial.category || 'General Medicine',
      creditPoints: partial.creditPoints ?? 1,
      price: partial.price ?? 0,
      maxSeats: partial.maxSeats ?? 100,
      registeredCount: 0,
      hostId,
      hostName,
      paymentLink: `https://medcme.org/pay/${tempId}`,
      status: 'upcoming',
      publicationStatus: 'DRAFT',
      bannerColor: partial.bannerColor || '#0ea5e9',
      preRead: partial.preRead || 'ACLS_Standard_Protocols_Guideline.pdf',
      zohoBackstageLink: partial.zohoBackstageLink || '',
      streamEmbedUrl: partial.streamEmbedUrl || ''
    };
    this.eventsSignal.update(events => this.sortEventsByDateDesc([newEvent, ...events]));
    this.saveEventsToStorage();
    this.api.createEvent(this.mapUiEventToBackendRequest(newEvent)).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          const saved = this.mapBackendEventToUi(response.data);
          this.eventsSignal.update(events => {
            const filtered = events.filter(event => event.id !== tempId);
            return this.sortEventsByDateDesc([saved, ...filtered]);
          });
          this.saveEventsToStorage();
        }
      },
      error: (e) => {
        this.eventsSignal.update(events => events.filter(event => event.id !== tempId));
        this.saveEventsToStorage();
        this.showBackendError('Event creation failed', e);
      }
    });
    return newEvent;
  }

  deleteEvent(eventId: string): void {
    const event = this.getEventById(eventId);
    this.eventsSignal.update(events => events.filter(e => e.id !== eventId));
    this.saveEventsToStorage();
    const backendId = event?.backendId ?? this.toBackendId(eventId);
    if (backendId) {
      this.api.deleteEvent(backendId).subscribe({
        error: (e) => console.warn('Backend event delete failed; local delete retained.', e)
      });
    }
  }

  updateEvent(updated: CmeEvent): void {
    this.eventsSignal.update(events =>
      this.sortEventsByDateDesc(events.map(e => e.id === updated.id ? { ...e, ...updated } : e))
    );
    this.saveEventsToStorage();
    const backendId = updated.backendId ?? this.toBackendId(updated.id);
    if (backendId) {
      this.api.updateEvent(backendId, this.mapUiEventToBackendRequest(updated)).subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            const saved = this.mapBackendEventToUi(response.data);
            this.eventsSignal.update(events => this.sortEventsByDateDesc(events.map(e => e.id === updated.id ? saved : e)));
            this.saveEventsToStorage();
          }
        },
        error: (e) => this.showBackendError('Event update failed', e)
      });
    }
  }

  publishEvent(eventId: string): void {
    const backendId = this.getEventById(eventId)?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return;
    this.api.publishEvent(backendId).subscribe({
      next: (response) => this.replaceFromBackendResponse(response.data),
      error: (e) => console.warn('Backend publish failed.', e)
    });
  }

  unpublishEvent(eventId: string): void {
    const backendId = this.getEventById(eventId)?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return;
    this.api.unpublishEvent(backendId).subscribe({
      next: (response) => this.replaceFromBackendResponse(response.data),
      error: (e) => console.warn('Backend unpublish failed.', e)
    });
  }

  async joinEvent(eventId: string, userId: string): Promise<string | null> {
    const registration = this.getRegistration(eventId, userId);
    const event = this.getEventById(eventId);
    if (!registration?.registrationId) {
      return this.getJoinLinkFromEvent(event);
    }
    try {
      const response = await firstValueFrom(this.api.joinEvent(registration.registrationId).pipe(timeout(3000)));
      return response?.data?.meetingLink || this.getJoinLinkFromEvent(event);
    } catch (e) {
      console.warn('Backend join event failed.', e);
      return this.getJoinLinkFromEvent(event);
    }
  }

  private getJoinLinkFromEvent(event?: CmeEvent): string | null {
    const candidates = [
      event?.zohoBackstageLink,
      event?.paymentLink,
      event?.venue
    ];
    return candidates.find(link => !!link && /^https?:\/\//i.test(link)) || null;
  }

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    const registration = this.getRegistration(eventId, userId);
    if (!registration?.registrationId) return;
    try {
      const response = await firstValueFrom(this.api.leaveEvent(registration.registrationId).pipe(timeout(3000)));
      if (response?.data) {
        this.applyJoinStatus(response.data);
      }
    } catch (e) {
      console.warn('Backend leave event failed.', e);
    }
  }

  async heartbeatEvent(eventId: string, userId: string): Promise<boolean> {
    const registration = this.getRegistration(eventId, userId);
    if (!registration?.registrationId) return true;
    try {
      const response = await firstValueFrom(this.api.heartbeatEvent(registration.registrationId).pipe(timeout(3000)));
      if (response?.data) {
        this.applyJoinStatus(response.data);
        return true;
      }
    } catch (e) {
      console.warn('Backend heartbeat failed.', e);
    }
    return false;
  }

  async completeEvent(eventId: string, userId: string): Promise<boolean> {
    const registration = this.getRegistration(eventId, userId);
    if (!registration?.registrationId) return true;
    try {
      const response = await firstValueFrom(this.api.completeEvent(registration.registrationId).pipe(timeout(3000)));
      if (response?.data) {
        this.applyJoinStatus(response.data);
        return response.data.attendanceStatus === 'PRESENT';
      }
    } catch (e) {
      console.warn('Backend complete event failed.', e);
    }
    return false;
  }

  getDocumentDownloadUrl(documentId: number): string {
    return this.api.getDocumentDownloadUrl(documentId);
  }

  async loadEventDocuments(eventId: string): Promise<EventDocument[]> {
    const backendId = this.getEventById(eventId)?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return [];
    try {
      const response = await firstValueFrom(this.api.getEventDocuments(backendId));
      return response?.data || [];
    } catch (e) {
      console.warn('Backend document list failed.', e);
      return [];
    }
  }

  notifyRegisteredPeople(eventId: string, subject: string, message: string): void {
    const backendId = this.getEventById(eventId)?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return;
    this.api.notifyRegisteredPeople(backendId, { subject, message }).subscribe({
      error: (e) => console.warn('Backend notification failed.', e)
    });
  }

  uploadRecording(eventId: string, recording: File): void {
    const backendId = this.getEventById(eventId)?.backendId ?? this.toBackendId(eventId);
    if (!backendId) {
      console.warn('Recording upload requires a backend event id.');
      return;
    }
    this.api.uploadRecording(backendId, recording).subscribe({
      next: (response) => this.replaceFromBackendResponse(response.data),
      error: (e) => console.warn('Backend recording upload failed.', e)
    });
  }

  getRecordingDownloadUrl(event: CmeEvent): string | null {
    if (!this.isRecordingAvailable(event)) {
      return null;
    }
    const backendId = event.backendId ?? this.toBackendId(event.id);
    if (event.recordingUrl && /^https?:\/\//i.test(event.recordingUrl)) {
      return event.recordingUrl;
    }
    if (event.recordingDownloadUrl && /^https?:\/\//i.test(event.recordingDownloadUrl)) {
      return event.recordingDownloadUrl;
    }
    return backendId && event.recordingDownloadUrl ? this.api.getRecordingDownloadUrl(backendId) : null;
  }

  isRecordingAvailable(event: CmeEvent): boolean {
    const hasRecording = Boolean(event.recordingUrl || event.recordingDownloadUrl);
    if (!hasRecording) {
      return false;
    }
    if (event.recordingAvailable === false) {
      return false;
    }
    return this.getEventTimestamp(event) <= Date.now();
  }

  getWhatsAppShareUrl(event: CmeEvent): string {
    const text = encodeURIComponent(
      `CME Event Invitation\n\n` +
      `${event.title}\n` +
      `Date: ${this.formatDate(event.date)} at ${event.time}\n` +
      `Venue: ${event.venue} (${event.mode})\n` +
      `Speaker: ${event.speaker} - ${event.speakerRole}\n` +
      `CME Credits: ${event.creditPoints} Point(s)\n` +
      `Fee: ${event.price === 0 ? 'FREE' : 'Rs. ' + event.price}\n\n` +
      `Register here: ${event.paymentLink}\n\n` +
      `Hosted by All India CME`
    );
    return `https://wa.me/?text=${text}`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getSeatsLeft(event: CmeEvent): number {
    return Math.max(0, event.maxSeats - event.registeredCount);
  }

  private replaceFromBackendResponse(event?: BackendEventResponse): void {
    if (!event) return;
    const mapped = this.mapBackendEventToUi(event);
    this.eventsSignal.update(events => this.sortEventsByDateDesc(events.map(e => e.id === mapped.id ? mapped : e)));
    this.saveEventsToStorage();
  }

  private sortEventsByDateDesc(events: CmeEvent[]): CmeEvent[] {
    return [...events].sort((a, b) => this.getEventTimestamp(b) - this.getEventTimestamp(a));
  }

  private getEventTimestamp(event: CmeEvent): number {
    const dateMatch = (event.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const timeMatch = (event.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      let hour = timeMatch ? Number(timeMatch[1]) : 0;
      const minute = timeMatch ? Number(timeMatch[2]) : 0;
      const meridiem = timeMatch?.[3]?.toUpperCase();
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      const value = new Date(
        Number(dateMatch[1]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[3]),
        hour,
        minute
      ).getTime();
      return Number.isFinite(value) ? value : 0;
    }

    const value = new Date(`${event.date} ${event.time || ''}`).getTime();
    return Number.isFinite(value) ? value : 0;
  }

  private isFutureEvent(event: CmeEvent): boolean {
    const timestamp = this.getEventTimestamp(event);
    return timestamp > 0 && timestamp >= Date.now();
  }

  private isPastEvent(event: CmeEvent): boolean {
    const timestamp = this.getEventTimestamp(event);
    return timestamp > 0 && timestamp < Date.now();
  }

  private refreshEventFromBackend(eventId: string): void {
    const backendId = this.getEventById(eventId)?.backendId ?? this.toBackendId(eventId);
    if (!backendId) return;
    this.api.getEventById(backendId).subscribe({
      next: (response) => this.replaceFromBackendResponse(response.data),
      error: (e) => console.warn('Backend event refresh failed.', e)
    });
  }

  private mergeRegistrations(registrations: EventRegistration[]): void {
    this.registrationsSignal.update(list => {
      const next = [...list];
      for (const reg of registrations) {
        const index = next.findIndex(existing =>
          (reg.registrationId && existing.registrationId === reg.registrationId) ||
          (existing.eventId === reg.eventId && existing.userId === reg.userId)
        );
        if (index >= 0) {
          const existing = next[index];
          next[index] = {
            ...existing,
            ...reg,
            attended: reg.attended || existing.attended,
            attendanceStatus: reg.attendanceStatus || existing.attendanceStatus,
            attendedAt: reg.attendedAt || existing.attendedAt,
            certificateIssued: reg.certificateIssued || existing.certificateIssued
          };
        } else {
          next.push(reg);
        }
      }
      return next;
    });
    this.saveRegistrationsToStorage();
  }

  private replaceBackendRegistrations(registrations: EventRegistration[]): void {
    this.registrationsSignal.set(registrations);
    this.saveRegistrationsToStorage();
  }

  private applyBackendAttendance(attendance: BackendEventAttendanceResponse[]): void {
    this.registrationsSignal.update(list => list.map(reg => {
      const found = attendance.find(a => a.registrationId === reg.registrationId);
      if (!found) return reg;
      return {
        ...reg,
        attended: found.status === 'PRESENT',
        attendanceStatus: found.status,
        attendedAt: found.markedAt || reg.attendedAt,
        certificateIssued: found.status === 'ABSENT' ? false : Boolean(found.certificateIssued || reg.certificateIssued)
      };
    }));
    this.saveRegistrationsToStorage();
  }

  private applyJoinStatus(status: { registrationId: number; attendanceStatus: string; joinedAt?: string; leftAt?: string; lastSeenAt?: string; completedAt?: string; minutesAttended?: number }): void {
    this.registrationsSignal.update(list => list.map(reg => {
      if (reg.registrationId !== status.registrationId) return reg;
      return {
        ...reg,
        attended: status.attendanceStatus === 'PRESENT',
        attendanceStatus: status.attendanceStatus as EventRegistration['attendanceStatus'],
        attendedAt: status.completedAt || status.leftAt || status.joinedAt || reg.attendedAt,
        certificateIssued: status.attendanceStatus === 'ABSENT' ? false : reg.certificateIssued
      };
    }));
    this.saveRegistrationsToStorage();
  }

  private mapBackendRegistrationToUi(reg: BackendEventRegistrationResponse, fallbackUserId?: string): EventRegistration {
    return {
      registrationId: reg.registrationId,
      eventId: String(reg.eventId),
      backendEventId: reg.eventId,
      eventTitle: reg.eventTitle,
      eventDate: reg.eventDate,
      eventTime: reg.eventTime,
      userId: fallbackUserId || String(reg.doctorProfileId),
      userName: reg.fullName,
      userEmail: reg.email,
      userPhone: reg.mobileNumber,
      registeredAt: new Date().toISOString(),
      paymentStatus: reg.totalAmount > 0 ? 'paid' : 'free',
      attended: false,
      attendanceStatus: 'PENDING',
      certificateIssued: false,
      meetingLink: reg.meetingLink,
      totalAmount: Number(reg.totalAmount || 0),
      registrationStatus: reg.registrationStatus,
      gstAmount: Number(reg.gstAmount || 0),
      registrationFee: Number(reg.registrationFee || 0)
    };
  }

  private mapRegistrationToEvent(registration: EventRegistration): CmeEvent {
    const eventDate = registration.eventDate || new Date().toISOString();
    return {
      id: registration.eventId,
      backendId: registration.backendEventId ?? (this.toBackendId(registration.eventId) || undefined),
      title: registration.eventTitle || `CME Event ${registration.eventId}`,
      description: '',
      date: this.toDatePart(eventDate),
      time: this.toDisplayTime(registration.eventTime || eventDate),
      venue: 'Online',
      mode: 'Online',
      speaker: '',
      speakerRole: '',
      category: 'General Medicine',
      creditPoints: 0,
      price: Number(registration.registrationFee || 0),
      maxSeats: 0,
      registeredCount: 1,
      hostId: 'backend',
      hostName: 'All India CME',
      paymentLink: registration.meetingLink || '',
      status: 'upcoming',
      bannerColor: '#bae6fd'
    };
  }

  private mapBackendEventToUi(event: BackendEventResponse): CmeEvent {
    const eventDateTime = event.eventDateTime || event.eventDate;
    const datePart = this.toDatePart(eventDateTime);
    const timePart = this.toDisplayTime(event.eventTime || eventDateTime);
    const status = event.status === 'COMPLETED' ? 'completed' : event.status === 'CANCELLED' ? 'completed' : 'upcoming';
    return {
      id: String(event.id),
      backendId: event.id,
      title: event.title,
      description: event.description || '',
      date: datePart,
      time: timePart,
      venue: event.joinLink || event.zohoBackstageLink || (event.mode === 'ONLINE' ? 'Online' : 'TBD'),
      mode: this.toUiMode(event.mode),
      speaker: event.speakerName || '',
      speakerEmail: event.speakerEmail || '',
      speakerRole: event.speakerRole || '',
      category: this.toUiCategory(event.category),
      creditPoints: Number(event.cmeCreditPoints || 0),
      price: Number(event.registrationFee || 0),
      maxSeats: event.maxSeats || 100,
      registeredCount: Number(event.enrolledCount || 0),
      presentCount: Number(event.presentCount || 0),
      absentCount: Number(event.absentCount || 0),
      certificateIssuedCount: Number(event.certificateIssuedCount || 0),
      hostId: 'admin_001',
      hostName: 'Dr. Administrator (Chief CME Director)',
      paymentLink: event.joinLink || event.zohoBackstageLink || `https://medcme.org/pay/${event.id}`,
      status,
      publicationStatus: event.status,
      bannerColor: event.cardAccentColor || '#bae6fd',
      language: 'English',
      preRead: event.documents?.[0]?.fileName || 'ACLS_Standard_Protocols_Guideline.pdf',
      zohoBackstageLink: event.zohoBackstageLink || '',
      streamEmbedUrl: event.streamEmbedUrl || '',
      recordingFileName: event.recordingFileName,
      recordingContentType: event.recordingContentType,
      recordingFileSize: event.recordingFileSize,
      recordingPublishedAt: event.recordingPublishedAt,
      recordingAvailable: event.recordingAvailable,
      recordingUrl: event.recordingUrl,
      recordingDownloadUrl: event.recordingDownloadUrl,
      documents: event.documents || []
    };
  }

  private mapUiEventToBackendRequest(event: CmeEvent): BackendEventRequest {
    const eventDateTime = this.combineDateAndTime(event.date, event.time);
    const eventEndDateTime = this.addMinutesToDateTime(eventDateTime, 60);
    return {
      speakerName: event.speaker,
      speakerEmail: event.speakerEmail,
      speakerRole: event.speakerRole,
      title: event.title,
      description: event.description,
      eventDate: eventDateTime,
      eventTime: eventEndDateTime,
      joinLink: event.mode === 'Online' ? event.zohoBackstageLink || event.paymentLink : undefined,
      zohoBackstageLink: event.zohoBackstageLink || '',
      streamEmbedUrl: event.streamEmbedUrl || '',
      liveProvider: event.mode === 'Offline' ? 'NONE' : 'ZOHO_WEBINAR',
      createProviderRoom: event.mode !== 'Offline',
      mode: this.toBackendMode(event.mode),
      category: this.toBackendCategory(event.category),
      mandatory: false,
      cmeCreditPoints: event.creditPoints,
      registrationFee: event.price,
      maxSeats: event.maxSeats,
      cardAccentColor: event.bannerColor
    };
  }

  private toBackendId(id: string): number | null {
    const numeric = Number(id.replace('evt-', ''));
    return Number.isInteger(numeric) && numeric > 0 && numeric < 1000000000 ? numeric : null;
  }

  private toUiMode(mode: string): 'Online' | 'Offline' | 'Hybrid' {
    if (mode === 'OFFLINE') return 'Offline';
    if (mode === 'HYBRID') return 'Hybrid';
    return 'Online';
  }

  private toBackendMode(mode: string): 'ONLINE' | 'OFFLINE' | 'HYBRID' {
    if (mode === 'Offline') return 'OFFLINE';
    if (mode === 'Hybrid') return 'HYBRID';
    return 'ONLINE';
  }

  private toUiCategory(category: string): string {
    if (category === 'GeneralMedicine') return 'General Medicine';
    if (category === 'Endrocrinology') return 'Endocrinology';
    return category || 'General Medicine';
  }

  private toBackendCategory(category: string): string {
    const normalized = (category || '').replace(/\s+/g, '').toLowerCase();
    if (normalized === 'generalmedicine') return 'GeneralMedicine';
    if (normalized === 'endocrinology') return 'Endrocrinology';
    const allowed: Record<string, string> = {
      cardiology: 'Cardiology',
      pediatrics: 'Pediatrics',
      neurology: 'Neurology',
      surgery: 'Surgery',
      oncology: 'Oncology',
      psychiatry: 'Psychiatry'
    };
    return allowed[normalized] || 'GeneralMedicine';
  }

  private toDatePart(value: string): string {
    return value ? value.split('T')[0] : new Date().toISOString().split('T')[0];
  }

  private toDisplayTime(value: string): string {
    if (!value) return '10:00 AM IST';
    const time = value.includes('T') ? value.split('T')[1] : value;
    const [hourRaw, minute = '00'] = time.split(':');
    const hour = Number(hourRaw);
    if (!Number.isFinite(hour)) return '10:00 AM IST';
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.padStart(2, '0')} ${suffix} IST`;
  }

  private combineDateAndTime(date: string, time: string): string {
    const cleanDate = date || new Date().toISOString().split('T')[0];
    const match = (time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return `${cleanDate}T10:00:00`;
    let hour = Number(match[1]);
    const minute = match[2];
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
      return `${cleanDate}T${String(hour).padStart(2, '0')}:${minute}:00`;
    }

  private addMinutesToDateTime(dateTime: string, minutesToAdd: number): string {
    const value = new Date(dateTime);
    if (!Number.isFinite(value.getTime())) {
      return dateTime;
    }
    value.setMinutes(value.getMinutes() + minutesToAdd);
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    const hh = String(value.getHours()).padStart(2, '0');
    const min = String(value.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
  }

  private showBackendError(prefix: string, error: any): void {
    const message = error?.error?.message || error?.message || 'Please try again.';
    console.warn(prefix, error);
    if (typeof window !== 'undefined') {
      alert(`${prefix}: ${message}`);
    }
  }
}