import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CmeEvent, EventRegistration } from '../models/course.model';

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
      id: 'evt-020',
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
      paymentLink: 'https://medcme.org/pay/evt-020',
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
    }
  ]);

  private registrationsSignal = signal<EventRegistration[]>([]);

  public events = computed(() => this.eventsSignal());
  public registrations = computed(() => this.registrationsSignal());

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadFromStorage();
    
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
      zohoBackstageLink: e.zohoBackstageLink || ''
    })));
  }

  private loadFromStorage() {
    if (!this.isBrowser) return;
    try {
      const savedRegs = localStorage.getItem('medcme_registrations');
      if (savedRegs) {
        this.registrationsSignal.set(JSON.parse(savedRegs));
      }
      const savedEvents = localStorage.getItem('medcme_events');
      if (savedEvents) {
        const parsed = JSON.parse(savedEvents);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((e: any) => e.id));
          const missingDefaults = this.eventsSignal().filter(e => !existingIds.has(e.id));
          if (missingDefaults.length > 0) {
            const merged = [...parsed, ...missingDefaults];
            this.eventsSignal.set(merged);
            localStorage.setItem('medcme_events', JSON.stringify(merged));
            return;
          } else {
            this.eventsSignal.set(parsed);
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
    return this.eventsSignal().filter(e => e.status === 'upcoming');
  }

  getEventById(id: string): CmeEvent | undefined {
    return this.eventsSignal().find(e => e.id === id);
  }

  getEventsByHost(hostId: string): CmeEvent[] {
    return this.eventsSignal().filter(e => e.hostId === hostId);
  }

  getRegistrationsByEvent(eventId: string): EventRegistration[] {
    return this.registrationsSignal().filter(r => r.eventId === eventId);
  }

  isRegistered(eventId: string, userId: string): boolean {
    return this.registrationsSignal().some(r => r.eventId === eventId && r.userId === userId);
  }

  getRegistration(eventId: string, userId: string): EventRegistration | undefined {
    return this.registrationsSignal().find(r => r.eventId === eventId && r.userId === userId);
  }

  getEnrolledCount(eventId: string): number {
    return this.registrationsSignal().filter(r => r.eventId === eventId).length;
  }

  getPresentCount(eventId: string): number {
    return this.registrationsSignal().filter(r => r.eventId === eventId && r.attended).length;
  }

  getAbsentCount(eventId: string): number {
    return this.registrationsSignal().filter(r => r.eventId === eventId && !r.attended).length;
  }

  getCertificateIssuedCount(eventId: string): number {
    return this.registrationsSignal().filter(r => r.eventId === eventId && r.certificateIssued).length;
  }

  registerForEvent(eventId: string, userId: string, userName: string, userEmail?: string, userPhone?: string, paymentStatus?: 'pending' | 'paid' | 'free' | 'sponsored', sponsoredBy?: string): boolean {
    const alreadyRegistered = this.registrationsSignal().some(
      r => r.eventId === eventId && r.userId === userId
    );
    if (alreadyRegistered) return false;
    const event = this.getEventById(eventId);
    if (!event) return false;

    const registration: EventRegistration = {
      eventId,
      userId,
      userName,
      userEmail,
      userPhone,
      registeredAt: new Date().toISOString(),
      paymentStatus: paymentStatus || (event.price === 0 ? 'free' : 'pending'),
      attended: false,
      certificateIssued: false,
      sponsoredBy: sponsoredBy
    };

    this.registrationsSignal.update(list => [...list, registration]);
    this.eventsSignal.update(events =>
      events.map(e => e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e)
    );
    this.saveRegistrationsToStorage();
    this.saveEventsToStorage();
    return true;
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
            attendedAt: attended ? new Date().toISOString() : undefined,
            certificateIssued: attended ? r.certificateIssued : false
          };
        }
        return r;
      })
    );
    if (found) this.saveRegistrationsToStorage();
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
    return true;
  }

  addEvent(partial: Partial<CmeEvent>, hostId: string, hostName: string): CmeEvent {
    const id = 'evt-' + Date.now();
    const newEvent: CmeEvent = {
      id,
      title: partial.title || 'Untitled CME Event',
      description: partial.description || '',
      date: partial.date || new Date().toISOString().split('T')[0],
      time: partial.time || '10:00 AM IST',
      venue: partial.venue || 'TBD',
      mode: partial.mode || 'Online',
      speaker: partial.speaker || '',
      speakerRole: partial.speakerRole || '',
      category: partial.category || 'General Medicine',
      creditPoints: partial.creditPoints ?? 1,
      price: partial.price ?? 0,
      maxSeats: partial.maxSeats ?? 100,
      registeredCount: 0,
      hostId,
      hostName,
      paymentLink: `https://medcme.org/pay/${id}`,
      status: 'upcoming',
      bannerColor: partial.bannerColor || '#0ea5e9',
      preRead: partial.preRead || 'ACLS_Standard_Protocols_Guideline.pdf',
      zohoBackstageLink: partial.zohoBackstageLink || ''
    };
    this.eventsSignal.update(events => [newEvent, ...events]);
    this.saveEventsToStorage();
    return newEvent;
  }

  deleteEvent(eventId: string): void {
    this.eventsSignal.update(events => events.filter(e => e.id !== eventId));
    this.saveEventsToStorage();
  }

  updateEvent(updated: CmeEvent): void {
    this.eventsSignal.update(events =>
      events.map(e => e.id === updated.id ? { ...e, ...updated } : e)
    );
    this.saveEventsToStorage();
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
      `Hosted by MedCME Academy`
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
}
