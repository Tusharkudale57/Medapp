import { Injectable } from '@angular/core';

export interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  phone: string;
  symptoms: string;
}

export interface AppointmentInfo {
  doctorName: string;
  date: string;
  time: string;
  consultationType: string;
  fee: number;
}

@Injectable({ providedIn: 'root' })
export class Booking {
  patientInfo!: PatientInfo;
  appointmentInfo!: AppointmentInfo;

  setPatientInfo(data: PatientInfo) {
    this.patientInfo = data;
  }

  setAppointmentInfo(data: AppointmentInfo) {
    this.appointmentInfo = data;
  }
}