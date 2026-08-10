import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Booking } from '../../services/booking';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.css'
})
export class AppointmentForm {
  form: FormGroup;

  doctors = [
    { name: 'Dr. Sharma (General Physician)', fee: 500 },
    { name: 'Dr. Mehta (Dermatologist)', fee: 700 },
    { name: 'Dr. Iyer (Cardiologist)', fee: 1000 }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private booking: Booking
  ) {
    this.form = this.fb.group({
      doctorName: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      consultationType: ['Online', Validators.required]
    });
  }

  onNext() {
    if (this.form.valid) {
      const selectedDoctor = this.doctors.find(d => d.name === this.form.value.doctorName);
      this.booking.setAppointmentInfo({
        ...this.form.value,
        fee: selectedDoctor ? selectedDoctor.fee : 500
      });
      this.router.navigate(['/payment']);
    } else {
      this.form.markAllAsTouched();
    }
  }
}