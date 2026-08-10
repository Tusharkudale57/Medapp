import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Booking } from '../../services/booking';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.css'
})
export class PatientForm {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private booking: Booking
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(1)]],
      gender: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      symptoms: ['', Validators.required]
    });
  }

  onNext() {
    if (this.form.valid) {
      this.booking.setPatientInfo(this.form.value);
      this.router.navigate(['/appointment']);
    } else {
      this.form.markAllAsTouched();
    }
  }
}