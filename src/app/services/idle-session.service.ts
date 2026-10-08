import { Inject, Injectable } from '@angular/core';
import { Keepalive } from '@ng-idle/keepalive';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { StorageService } from './storage.service';
import { ABCLLoginUrl } from '../models/user-login.model';
import { LoginService } from './login.service';
import { MsalService } from '@azure/msal-angular';
import { AbclService } from './abcl.service';
import { UrlValidatorService } from './url-validator.service';
import { DomainType } from '../enum/domain-type.enum';
import { MessageService } from 'primeng/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root',
})
export class IdleSessionService {
  private readonly idleTimeoutSeconds = 20 * 60; // 20min idle-logout
  private readonly abclToken = 'abcl_token';
  static readonly idleLogoutFlag = 'idle_logout';
  abclLoginUrl: ABCLLoginUrl = new ABCLLoginUrl();

  constructor(
    @Inject(Idle) private idle: Idle,
    private keepalive: Keepalive,
    private router: Router,
    private loginService: LoginService,
    private authService: MsalService,
    private cookieService: CookieService,
    private storageService: StorageService,
    private abclService: AbclService,
    private urlValidator: UrlValidatorService,
    private messageService: MessageService,
    private modalService: NgbModal,
  ) {
    this.idle.setIdle(this.idleTimeoutSeconds);

    this.idle.setTimeout(5);

    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    this.idle.onTimeout.subscribe(() => {
      this.handleIdleTimeout();
    });

    this.idle.watch();
  }

  logout() {
    this.loginService.logout().subscribe((res) => {
      if (res.message === 'Logout Successfully') {
        if (res.content.redirect_url) {
          const token = this.storageService.getABCLToken();
          let redirectUrl = res.content.redirect_url;
          if (token) {
            redirectUrl = `${redirectUrl}${token}`;
          }
          window.location.replace(redirectUrl);
        } else {
          this.router.navigate(['login']);
        }
        this.cookieService.delete('role');
        this.cookieService.delete('accessToken');
        this.storageService.clearStorage();
        this.authService.instance.setActiveAccount(null);
      }
    });
  }

  private hasTimedOut = false;

  private handleIdleTimeout(): void {
    if (this.hasTimedOut) {
      return;
    }
    this.hasTimedOut = true;
    this.idle.stop();
    this.cookieService.delete('role');
    this.cookieService.delete('accessToken');

    this.messageService.add({
      severity: 'info',
      summary: 'Session Expired',
      detail: 'You have been logged out due to 20 minutes of inactivity.',
      life: 3000
    });

    setTimeout(() => {
      const abclToken = this.storageService.getABCLToken();
      if (abclToken) {
        const logoutUrl = this.abclService.getLogoutUrl();
        if (this.urlValidator.isValidRedirectUrl(logoutUrl, DomainType.ABCL)) {
          this.storageService.clearStorage();
          this.modalService.dismissAll();
          window.location.href = `${logoutUrl}${abclToken}`;
        }
      } else {
        sessionStorage.setItem(IdleSessionService.idleLogoutFlag, 'true');
        this.storageService.clearStorage();
        this.redirectToLogin();
      }
    }, 3000);
  }

  private redirectToLogin(): void {
    this.modalService.dismissAll();
    window.location.replace(this.abclLoginUrl.base_url);
  }

  reset(): void {
    this.hasTimedOut = false;
    this.idle.watch();
  }
}
