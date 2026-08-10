import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Booking } from '../../services/booking';
import { PaymentLinkService } from '../../services/payment-link';
import { Router } from '@angular/router';

declare var Razorpay: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment implements OnInit {
  patient: any;
  appointment: any;
  isBrowser: boolean;
  paymentLink: string = '';
  generatingLink = false;

  constructor(
    private booking: Booking,
    private router: Router,
    private paymentLinkService: PaymentLinkService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.patient = this.booking.patientInfo;
    this.appointment = this.booking.appointmentInfo;

    if (!this.patient || !this.appointment) {
      this.router.navigate(['/']);
    }
  }

  // Way 1: Pay right now on this device
  payNow() {
    if (!this.isBrowser) return;

    const options = {
      key: 'rzp_test_TIRF1jkl1g0ryG',
      amount: this.appointment.fee * 100,
      currency: 'INR',
      name: 'Doctor Appointment Booking',
      description: `Consultation with ${this.appointment.doctorName}`,
      handler: (response: any) => {
        alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
        this.router.navigate(['/']);
      },
      prefill: {
        name: this.patient.name,
        contact: this.patient.phone
      },
      theme: { color: '#3399cc' }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  // Way 2: Generate a link to share with the patient
  generatePaymentLink() {
    this.generatingLink = true;
    this.paymentLinkService.createLink({
      amount: this.appointment.fee,
      patientName: this.patient.name,
      phone: this.patient.phone,
      doctorName: this.appointment.doctorName
    }).subscribe({
      next: (res: any) => {
        this.paymentLink = res.short_url;
        this.generatingLink = false;
      },
      error: (err) => {
        console.error(err);
        alert('Failed to generate payment link. Check backend console.');
        this.generatingLink = false;
      }
    });
  }

  shareOnWhatsApp() {
    const message = `Hi ${this.patient.name}, please complete your payment of ₹${this.appointment.fee} for consultation with ${this.appointment.doctorName}: ${this.paymentLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  copyLink() {
    navigator.clipboard.writeText(this.paymentLink);
    alert('Link copied to clipboard!');
  }
}