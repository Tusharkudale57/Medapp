import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private isBrowser: boolean;

  // EmailJS Configuration Properties (customizable by Admin)
  public serviceId = 'service_medcme';     // Default Service ID
  public templateId = 'template_otp';     // Default Template ID
  public publicKey = '';                  // Set EmailJS User/Public key here or dynamically in admin settings panel

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadConfig();
  }

  // Load configuration from local storage if set by settings console
  private loadConfig() {
    if (!this.isBrowser) return;
    const savedKey = localStorage.getItem('medcme_emailjs_public_key');
    const savedService = localStorage.getItem('medcme_emailjs_service_id');
    const savedTemplate = localStorage.getItem('medcme_emailjs_template_id');

    if (savedKey) this.publicKey = savedKey;
    if (savedService) this.serviceId = savedService;
    if (savedTemplate) this.templateId = savedTemplate;

    // Initialize EmailJS if public key is present
    if (this.publicKey) {
      emailjs.init(this.publicKey);
    }
  }

  // Persist config updates from settings panel
  public saveConfig(pubKey: string, servId: string, tempId: string) {
    if (!this.isBrowser) return;
    this.publicKey = pubKey;
    this.serviceId = servId;
    this.templateId = tempId;

    localStorage.setItem('medcme_emailjs_public_key', pubKey);
    localStorage.setItem('medcme_emailjs_service_id', servId);
    localStorage.setItem('medcme_emailjs_template_id', tempId);

    if (pubKey) {
      emailjs.init(pubKey);
    }
  }

  /**
   * Sends an OTP Email to the specified recipient using EmailJS.
   * If EmailJS is not configured yet, falls back to simulated alert/console logs.
   */
  async sendOtpEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    console.log(`[EmailService] Attempting to send OTP (${otpCode}) to ${toEmail}`);

    if (!this.publicKey) {
      const fallbackMsg = `[Simulation] EmailJS not configured (Public Key is missing). OTP is ${otpCode}`;
      console.log(fallbackMsg);
      return { 
        success: true, 
        message: 'Simulated dispatch successful. Please configure EmailJS Public Key in settings for real emails.' 
      };
    }

    try {
      const templateParams = {
        to_email: toEmail,
        otp_code: otpCode,
        app_name: 'MedCME Academy',
        subject: 'Your MedCME Verification Code'
      };

      const response = await emailjs.send(this.serviceId, this.templateId, templateParams);
      console.log('[EmailService] EmailJS send success:', response.status, response.text);
      return { success: true, message: 'OTP sent successfully via EmailJS!' };
    } catch (error: any) {
      console.error('[EmailService] EmailJS send failed:', error);
      return { 
        success: false, 
        message: error?.text || error?.message || 'Failed to dispatch email via EmailJS.' 
      };
    }
  }
}
