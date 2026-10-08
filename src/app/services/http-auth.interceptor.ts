import { finalize, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { StorageService } from './storage.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ABCLLoginUrl } from '../models/user-login.model';
import { UrlValidatorService } from './url-validator.service';
import { AbclService } from './abcl.service';
import { DomainType } from '../enum/domain-type.enum';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root',
})
export class HttpAuthInterceptor implements HttpInterceptor {
  private isMessageDisplayed = false;
  loginUrl: ABCLLoginUrl = new ABCLLoginUrl();

  private static pendingRequests = 0;

  private decrementAndHide(): void {
    HttpAuthInterceptor.pendingRequests = Math.max(
      0,
      HttpAuthInterceptor.pendingRequests - 1,
    );
    if (HttpAuthInterceptor.pendingRequests === 0) {
      this.spinner.hide();
    }
  }

  constructor(
    private storageService: StorageService,
    private messageService: MessageService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private urlValidator: UrlValidatorService,
    private abclService: AbclService,
    private analyticsService: AnalyticsService,
    private modalService: NgbModal,
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const tokenstring = this.storageService.getToken() || null;
    HttpAuthInterceptor.pendingRequests++;
    this.spinner.show();
    const isOwnBackendRequest =
      !/^https?:\/\//i.test(request.url) ||
      request.url.startsWith(environment.apiURL);
    const isAuthenticationRequest =
      /\/(?:login|send\/otp|verify-otp|send-otp-mfa|varify-two-factor-verification|cyberark-login)\/?(?:\?|$)/i.test(
        request.urlWithParams,
      );
    const isAddToken = request.headers.get('isAddToken');
    if (isAddToken) {
      request = request.clone({
        headers: request.headers.delete('isAddToken'),
      });
    } else if (tokenstring && isOwnBackendRequest && !isAuthenticationRequest) {
      request = request.clone({
        headers: request.headers.set('Authorization', 'Bearer ' + tokenstring),
      });
    }

    // Spinner hide is handled centrally in finalize() below, so it only
    // fires once every in-flight request has settled — see decrementAndHide().
    return next.handle(request).pipe(
      tap(undefined, (err: HttpErrorResponse) => {
          // GA ANALYTICS LOGGING (Executes for ALL errors)
          try {
            const orderId =
              request.params.get('order_id') ||
              this.extractFromUrl(request.urlWithParams, 'order_id');
            const orgId =
              request.params.get('org_id') ||
              this.extractFromUrl(request.urlWithParams, 'org_id');
            const cleanEndpoint = request.url.split('?')[0];

            this.analyticsService.logApiFailure(
              cleanEndpoint,
              request.method,
              err.status,
              err.message || 'Unknown HTTP Error',
              orderId,
              orgId,
            );
          } catch (analyticsError) {
            console.error('Analytics tracking failed silently', analyticsError);
          }

          if (!this.isMessageDisplayed) {
            if (
              err.status === 401 &&
              tokenstring &&
              isOwnBackendRequest &&
              !isAuthenticationRequest
            ) {
              const abclToken = this.storageService.getABCLToken();
              if (abclToken) {
                const logoutUrl = this.abclService.getLogoutUrl();
                if (
                  this.urlValidator.isValidRedirectUrl(
                    logoutUrl,
                    DomainType.ABCL,
                  )
                ) {
                  this.modalService.dismissAll();
                  this.storageService.clearStorage();
                  window.location.href = `${logoutUrl}${abclToken}`;
                }
              } else {
                this.storageService.clearStorage();
                this.modalService.dismissAll();
                void this.router.navigateByUrl(this.loginUrl.base_url);
              }
            } else if (err.status == 500) {
              this.messageService.add({
                severity: 'error',
                detail: err.error.message || 'Internal Server Error',
              });
            } else if (err.status == 400) {
              const isBulkEstampError =
                err.url?.toLowerCase().includes('estamp') &&
                err.error?.content?.order_id &&
                err.error?.content?.referance_id;
              const isOrderError =
                err.url?.toLowerCase().includes('order') &&
                err.error?.content?.order_id &&
                err.error?.content?.referance_id;

              const isCatUploadError =
                err.url?.toLowerCase().includes('catupload') &&
                err.error?.content?.order_id &&
                err.error?.content?.referance_id;

              if (isBulkEstampError || isOrderError || isCatUploadError) {
                return;
              }

              if (err.error?.content?.errors) {
                err.error.content.errors.forEach((mess) => {
                  this.messageService.add({
                    severity: 'error',
                    detail: typeof mess === 'string' ? mess : mess.error,
                  });
                });
              } else if (err.error.detail) {
                this.messageService.add({
                  severity: 'error',
                  detail: err.error?.detail,
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  detail: err?.error?.message,
                });
              }
            } else if (err?.error?.message || err?.error?.content?.errors) {
              err.error.content.errors.length > 0
                ? this.messageService.add({
                    severity: 'error',
                    detail: err.error.content?.errors[0],
                  })
                : this.messageService.add({
                    severity: 'error',
                    detail: err.error?.message,
                  });
            }
          }
        },
      ),
      finalize(() => this.decrementAndHide()),
    );
  }

  private extractFromUrl(url: string, param: string): string | null {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.searchParams.get(param);
    } catch {
      return null;
    }
  }
}
