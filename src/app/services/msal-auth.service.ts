import { Injectable } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { AuthenticationResult, EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { StorageService } from './storage.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MsalAuthService {
  private isSsoAuthSubject = new BehaviorSubject<boolean>(false);
  isSsoAuth$ = this.isSsoAuthSubject.asObservable();

  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  accessToken$ = this.accessTokenSubject.asObservable();

  constructor(
    private msalService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private httpClient: HttpClient,
    private router: Router,
    private cookieService: CookieService,
    private storageService: StorageService,
    private spinner: NgxSpinnerService) { }

  initMsalAuth(): void {
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) =>
          msg.eventType === EventType.LOGIN_SUCCESS || msg.eventType === EventType.SSO_SILENT_SUCCESS
        )
      )
      .subscribe((result: EventMessage) => {
        if (result) {
          this.isSsoAuthSubject.next(true);
        }

        this.spinner.show();

        const payload = result.payload as AuthenticationResult;
        this.msalService.instance.setActiveAccount(payload.account);
      });

    this.msalBroadcastService.inProgress$
      .pipe(filter((status: InteractionStatus) => status === InteractionStatus.None))
      .subscribe(() => {
        this.checkAndSetActiveAccount();
        this.spinner.hide();
      });
  }

  checkAndSetActiveAccount() {
    let activeAccount = this.msalService.instance.getActiveAccount();

    if (activeAccount || (!activeAccount && this.msalService.instance.getAllAccounts().length > 0)) {
      let accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(accounts[0]);

      this.getAccessToken()
    }
  }


  getAccessToken(): void {
    const request = {
      scopes: ["user.read"]
    };

    this.msalService.acquireTokenSilent(request).subscribe({
      next: (result: AuthenticationResult) => {
        this.accessTokenSubject.next(result.accessToken);
      },
      error: (error) => {
        console.error("Token acquisition failed:", error);
        this.router.navigate(['login']);
        this.accessTokenSubject.next(null);
        this.logout()
      }
    });
  }


  sendAccessTokenToBackend(accessToken: string): Observable<any> {
    let apiUrl = environment.msLoginUrl;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    const body = { access_token: accessToken };

    return this.httpClient.post<any>(apiUrl, body, { headers }).pipe(
      catchError((error) => {
        console.error("Error sending token to backend:", error);
        this.isSsoAuthSubject.next(false)
        this.handleAuthError(); 
        return throwError(() => error); 
      })
    );
  }

  private handleAuthError() {
    this.router.navigate(['/login']); 
    this.cookieService.delete('accessToken');
    this.storageService.clearStorage();
    this.msalService.instance.setActiveAccount(null);
  }


  logout(): void {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: environment.msalConfig.auth.postLogoutRedirectUri 
    });
  }


}
