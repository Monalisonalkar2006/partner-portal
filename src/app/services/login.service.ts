import { Injectable } from '@angular/core';
import { ApiEndPoint } from '../models/api-end-point.enum';
import { UserLogin } from '../models/user-login.model';
import { envConfig } from '../../env-config';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { CookieService } from 'ngx-cookie-service';
import { ABCLLoginUrl } from '../models/user-login.model';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly abclToken = 'abcl_token';
  abclLoginUrl: ABCLLoginUrl = new ABCLLoginUrl();
  public currentUser?: UserLogin;
  selectedbrnchId? = '';
  baseEndPoint = '';

  constructor(
    private httpclient: HttpClient,
    private storageService: StorageService,
    private cookieService: CookieService
  ) {
    this.baseEndPoint = envConfig.apiUrl;
  }

  Get(apiEndPoint: string, id?: any, queryString?: string): Observable<any> {
    let endPoint = this.baseEndPoint + apiEndPoint;
    if (id) {
      endPoint += '' + id;
    }
    if (queryString) {
      endPoint += '?' + queryString;
    }
    return this.httpclient.get(endPoint);
  }

  Post(data: any, apiEndPoint: string): Observable<any> {
    return this.httpclient.post(this.baseEndPoint + apiEndPoint, data);
  }

  login(loginData: { username: string; otp?: string }) {
    return this.Post(loginData, ApiEndPoint.loginApi);
  }

  sendOtp(email: any) {
    return this.Get(ApiEndPoint.sendOtp, '?email=' + email);
  }
  verifyOtp(email: any, otp: any) {
    return this.Get(ApiEndPoint.verifyOtp, '?otp=' + otp + '&email=' + email);
  }
  resetPassword(otp: any, confirm_password: any, email: any, password: any) {
    return this.Get(
      ApiEndPoint.resetPassword,
      '?otp=' +
        otp +
        '&confirm_password=' +
        confirm_password +
        '&email=' +
        email +
        '&password=' +
        password
    );
  }

  logout() {
    return this.Get(ApiEndPoint.logoutApi);
  }

  logoutBeacon(): boolean {
    const logoutUrl = this.baseEndPoint + ApiEndPoint.logoutApi;
    const accessToken = this.cookieService.get('accessToken');
    const abclToken = this.storageService.getABCLToken();

    const tokenToSend = accessToken || abclToken;

    if (tokenToSend && navigator.sendBeacon) {
      const data = new FormData();
      data.append('accessToken', tokenToSend);

      const success = navigator.sendBeacon(logoutUrl, data);

      if (success) {
        this.cookieService.delete('role');
        this.cookieService.delete('accessToken');
      }
      return success;
    }
    return false;
  }

  sendOtpForMFA(email: string, verificationType: any) {
    return this.Get(
      ApiEndPoint.sendOtpForVerification,
      '?verification_type=' + verificationType + '&email=' + email
    );
  }
  verifyTwoFactorValidation(body: any) {
    return this.Post(body, ApiEndPoint.twoFactorValidation);
  }
  getCyberArkToken(body: any) {
    return this.Post(body, ApiEndPoint.cyberArkToken);
  }
}
