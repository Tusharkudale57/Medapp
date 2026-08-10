import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentLinkService {
  private baseUrl = 'http://localhost:3000'; // match your Spring Boot port

  constructor(private http: HttpClient) {}

  createLink(data: { amount: number; patientName: string; phone: string; doctorName: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-payment-link`, data);
  }
}