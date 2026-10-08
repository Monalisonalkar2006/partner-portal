import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GenericHttpService } from './generic-http.service';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ESignService {
  baseEndPoint = '';
  orderType: string;
  isLinkCopied: boolean[] = [false];
  public isShareSignVerified: boolean = false;
  public verifiedContact: string = '';
  public isVerifiedEmail: boolean = false;

  constructor(
    private httpclient: HttpClient,
    private genericHttpService: GenericHttpService,
    private messageService: MessageService,
  ) {
    this.baseEndPoint = environment.apiURL;
  }

  //----------------------------------------Esign Apis-------------------------------//
  sendEsignDetails(data): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/create-esign-sequence/';
    return this.httpclient.post(endPoint, data);
  }

  getSignerDetails(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/signatory-details/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  sendSignerReminder(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/send-esign-reminder/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  sendSignatureDetails(data): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/esign-contract/';
    return this.httpclient.post(endPoint, data);
  }

  sendUserDetails(data): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/esign-browser-update/';
    return this.httpclient.post(endPoint, data);
  }

  getIpGeofencing(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/ip-geofencing/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getEsignOrderDetails(id: any) {
    let endPoint =
      this.baseEndPoint + `/esign/signatory-details/?order_id=${id}`;
    return this.httpclient.get(endPoint);
  }
  sendEmailNotification(payload: any): Observable<any> {
    const url = `${this.baseEndPoint}/esign/send-esign-notification/`;
    return this.httpclient.post(url, payload);
  }

  getAadhaarDetails(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/capricorn-webhook';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  determineApiUrl() {
    const host = window.location.host;
    const apiUrls = {
      'dev.doqfy.in': 'https://dev.doqfy.in',
      'qa.doqfy.in': 'https://qa.doqfy.in',
      'uat.doqfy.in': 'https://uat.doqfy.in',
      'prod.doqfy.in': 'https://prod.doqfy.in',
      'release.doqfy.in': 'https://release.doqfy.in',
      'dev-v1.doqfy.in': 'https://dev-v1.doqfy.in',
    };
    const apiUrl = apiUrls[host] || 'https://localhost:4200';
    return apiUrl;
  }

  getAadharLinkTab(esign_id: string, signatory_id: string, index: number) {
    const url =
      this.determineApiUrl() +
      `/aadhaarLink?esign_id=${esign_id}&signatory_id=${signatory_id}`;
    this.copyLink(url, index);
  }

  getEsignTab(esign_id: string, signatory_id: string, index: number) {
    const url =
      this.determineApiUrl() +
      `/eSignLink?esign_id=${esign_id}&signatory_id=${signatory_id}`;
    this.copyLink(url, index);
  }

  copyLink(url: string, index) {
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);

    // Select the URL text
    tempInput.select();
    tempInput.setSelectionRange(0, 99999); /* For mobile devices */

    // Copy the URL to clipboard
    document.execCommand('copy');

    this.isLinkCopied[index] = true;

    setTimeout(() => {
      this.isLinkCopied[index] = false; // Hide the message after a delay
    }, 1200);

    // Remove the temporary input element
    document.body.removeChild(tempInput);

    this.messageService.add({
      severity: 'info',
      detail: `Link Copied`,
      life: 1200,
    });
  }

  sendOtpToVerify(email, order_id?, signatory_id?, contact_number?) {
    let endPoint =
      this.baseEndPoint +
      `/send/otp/?verification_type=ESIGN_VERIFICATION&email=${email}&order_id=${order_id}&signatory_id=${signatory_id}&contact_number=${contact_number}`;
    return this.httpclient.get(endPoint);
  }

  verifySendOtp(data) {
    let endPoint =
      this.baseEndPoint +
      `/verify-otp/?otp=${data.otp}&email=${data.email}&verification_type=ESIGN_VERIFICATION&contact_number=${data.contact_number}`;
    return this.httpclient.get(endPoint);
  }

  reinstateSign(data): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/reinitiate-esign-link/';
    return this.httpclient.post(endPoint, data);
  }

  getExternalSignLink(signatory_id: any, order_id: any, sign_method?: string, sign_mode?: string): Observable<any> {
    let endPoint =
      this.baseEndPoint +
      `/esign/sign-url/?signatory_id=${signatory_id}&order_id=${order_id}`;
    if (sign_method) {
      endPoint += `&sign_method=${sign_method}`;
    }
    if (sign_mode) {
      endPoint += `&sign_mode=${sign_mode}`;
    }
    return this.httpclient.get(endPoint);
  }

  retriggerNeslOrder(orderDetails: any): Observable<any> {
    let endPoint = this.baseEndPoint + '/order/re-trigger-nesl-order/';
    return this.httpclient.post<any>(endPoint, orderDetails);
  }

  detectSignatoryFace(data: any) {
    const url = `${this.baseEndPoint}/esign/detect-signatory-face/`;
    return this.httpclient.post(url, data);
  }
  uploadServersideSign(data) {
    let endPoint = this.baseEndPoint + '/esign/upload-server-side-sign/';
    return this.httpclient.post(endPoint, data);
  }
  getServerSideSign(parms) {
    let endPoint =
      this.baseEndPoint + `/esign/upload-server-side-sign/?user_id=${parms}`;
    return this.httpclient.get(endPoint);
  }
  updateEsignDetails(data): Observable<any> {
    let endPoint = this.baseEndPoint + `/esign/edit-reinitiate-cancel/`;
    return this.httpclient.post(endPoint, data);
  }

  requestShareSignOtp(payload: any): Observable<any> {
    const contactParam = payload.email
      ? `email=${payload.email}`
      : `contact_number=${payload.mobile}`;
    let endPoint =
      this.baseEndPoint +
      `/send/otp/?verification_type=ESIGN_PUBLIC_VERIFICATION&${contactParam}`;
    return this.httpclient.get(endPoint);
  }

  verifyShareSignOtp(payload: any): Observable<any> {
    const contactParam = payload.email
      ? `email=${payload.email}`
      : `contact_number=${payload.mobile}`;
    let endPoint =
      this.baseEndPoint +
      `/verify-otp/?otp=${payload.otp}&${contactParam}&verification_type=ESIGN_PUBLIC_VERIFICATION`;
    return this.httpclient.get(endPoint);
  }

  getPublicEsignUrls(
    contact: string,
    isEmail: boolean,
    pageNumber: number,
    pageSize: number,
  ): Observable<any> {
    const contactParam = isEmail
      ? `email=${contact}`
      : `contact_number=${contact}`;
    let endPoint =
      this.baseEndPoint +
      `/esign/public-esign-urls/?${contactParam}&page_number=${pageNumber}&page_size=${pageSize}`;
    return this.httpclient.get(endPoint);
  }

  checkForImageCaptureRefresh(message: string): void {
    console.log('[Debug] Received message:', message);
    if (!message) {
      console.warn('[Debug] Message is empty or undefined.');
      return;
    }

    if (message.toLowerCase().includes('image not captured')) {
      console.log('[Debug] Condition met! Starting 3-second timer...');

      setTimeout(() => {
        console.log('[Debug] Reloading page now...');
        try {
          window.location.reload();
        } catch (e) {
          console.error('[Debug] Reload failed, using fallback.', e);
          window.location.href = window.location.href;
        }
      }, 3000);
    } else {
      console.log('[Debug] Condition NOT met. Substring not found in message.');
    }
  }

  syncCapturedImageInstantly(base64Image: any,esignId: string, signatoryId: string): void {
  const payload = {
    esign_id: esignId,
    signatory_id: signatoryId,
    user_image: base64Image
  };

  this.sendUserDetails(payload).subscribe({
    next: () => console.log('[Audit Trail] Webcam image synced successfully.'),
    error: (err) => console.error('[Audit Trail] Non-critical image sync error:', err)
  });
}
}
