import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PaymentDetails {
  courseId: string;
  courseTitle: string;
  amount: number;
  userName: string;
  userEmail: string;
  userPhone: string;
}

declare var Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class RazorpayService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadScript();
    }
  }

  private loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isBrowser) {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async openPaymentGateway(details: PaymentDetails): Promise<{ success: boolean; paymentId?: string }> {
    if (!this.isBrowser) {
      return { success: true, paymentId: 'pay_simulated_' + Date.now() };
    }

    const scriptLoaded = await this.loadScript();

    return new Promise((resolve) => {
      if (scriptLoaded && typeof Razorpay !== 'undefined') {
        try {
          const options = {
            key: 'rzp_test_TIRF1jkl1g0ryG', // Razorpay Test key
            amount: details.amount * 100, // Amount in paise
            currency: 'INR',
            name: 'MedCME Academy',
            description: `Course Purchase: ${details.courseTitle}`,
            image: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
            prefill: {
              name: details.userName,
              email: details.userEmail,
              contact: details.userPhone
            },
            theme: {
              color: '#0f172a'
            },
            handler: (response: any) => {
              resolve({
                success: true,
                paymentId: response.razorpay_payment_id || ('pay_' + Math.random().toString(36).substring(2, 10))
              });
            },
            modal: {
              ondismiss: () => {
                resolve({ success: false });
              }
            }
          };
          const rzp = new Razorpay(options);
          rzp.open();
          return;
        } catch (e) {
          console.warn('Razorpay SDK failed to launch, using interactive payment gateway overlay', e);
        }
      }
      // If Razorpay SDK is blocked or offline, fallback return handled via component's interactive Razorpay dialog modal
      resolve({ success: false, paymentId: 'FALLBACK_TRIGGER' });
    });
  }
}
