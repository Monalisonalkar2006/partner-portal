import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { IdleSessionService } from '../../services/idle-session.service';
import { UserProfileService } from '../../services/user-profile.service';
import { AnnouncementService } from '../../services/announcement.service';
import { MessageService } from 'primeng/api';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { filter, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MsalAuthService } from '../../services/msal-auth.service';
import { CyberArkRedirectService } from '../../services/cyberark-redirect.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit, OnDestroy {
  isMsAuthPage: boolean;
  loginForm: FormGroup;
  submitted = false;
  showInvalid: boolean = false;
  authErrorMessage = 'The email or verification code is incorrect.';
  isOtpStep = false;
  isLoading = false;
  order_reviewer: any;
  otp_validation: any;
  showAnnouncement: boolean = true;
  isClosing = false;
  selectedUserEmail = '';
  showOtpComponent: boolean = true;
  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
    inputClass: 'login-otp-digit',
  };
  enableOtp: boolean = true;
  timeLeft = 30;
  otp = '';
  interval: any;
  loginAttemptCount = 0;

  constructor(
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private idleSessionService: IdleSessionService,
    private cookieService: CookieService,
    private storageService: StorageService,
    private loginService: LoginService,
    private userService: UserProfileService,
    private router: Router,
    private announcementService: AnnouncementService,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private messageService: MessageService,
    private httpClient: HttpClient,
    private msalAuthService: MsalAuthService,
    private cyberArkService: CyberArkRedirectService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      acceptTerms: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    if (sessionStorage.getItem(IdleSessionService.idleLogoutFlag)) {
      sessionStorage.removeItem(IdleSessionService.idleLogoutFlag);
    }

    const shouldShowLoader = this.cyberArkService.checkAndRedirect();

    if (shouldShowLoader) {
      this.spinner.show();
      document.body.classList.add('blur-background');
      return;
    }
    this.msalAuthService.isSsoAuth$.subscribe((authStatus) => {
      this.isMsAuthPage = authStatus;
      console.log('SSO Auth Status Updated:', this.isMsAuthPage);
    });

    this.msalAuthService.accessToken$.subscribe((accessToken) => {
      if (accessToken) {
        this.msalAuthService.sendAccessTokenToBackend(accessToken).subscribe({
          next: (res) => {
            this.setUserDetails(res);
          },
          error: (error) => {
            console.error('Error sending token to backend', error);
            this.handleAuthError();
          },
        });
      }
    });

    this.msalAuthService.initMsalAuth();
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  handleAuthError() {
    this.router.navigate(['login']);
    this.cookieService.delete('accessToken');
    this.storageService.clearStorage();
    this.authService.instance.setActiveAccount(null);
  }

  gotoDashboard() {
    this.router.navigate(['doqfy/dashboard']);
  }
  //----------------------------------Using for validation --------------------------------//
  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.showInvalid = false;
    this.submitted = true;
    this.selectedUserEmail = (this.loginForm.controls['email']?.value || '').trim();

    if (this.loginForm.invalid) {
      if (this.loginForm.controls['acceptTerms'].errors) {
        this.messageService.add({
          severity: 'info',
          detail:
            'Please accept the Terms of Services and Privacy Policy to continue',
          styleClass: 'custom-toast-error',
        });
      }
      return;
    }

    if (this.isOtpStep) {
      this.otpOnSubmit();
      return;
    }

    this.isLoading = true;
    this.loginService.login({ username: this.selectedUserEmail }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isOtpStep = true;
        this.loginAttemptCount = 0;
        this.enableOtp = true;
        this.otp = '';
        this.timeLeft = 30;
        this.startTimer();
        this.messageService.add({
          severity: 'success',
          summary: 'OTP Sent',
          detail: res?.message || `Verification code sent to ${this.selectedUserEmail}`,
        });
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.loginAttemptCount++;
        const errorMessage =
          error?.error?.message || 'An error occurred during login';
        this.authErrorMessage = errorMessage;

        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: errorMessage,
          styleClass: 'custom-toast-error',
        });

        this.showInvalid = true;
        this.cdr.detectChanges();
      },
    });
  }

  setUserDetails(res) {
    this.spinner.show();
    this.showInvalid = false;
    this.idleSessionService.reset();
    this.storageService.setOrganization(res['content'].organisation_name);
    this.storageService.setUser(res['content'].user);
    this.storageService.setToken(res['content'].token);
    this.storageService.setRole(res['content'].role);
    this.storageService.setAccountId(res['content'].account_id);
    this.storageService.setSignProvider(res['content'].sign_providers);
    this.setOrderReviewer(res['content'].account_id);
    this.storageService.setBranchId(res['content'].branch_id);
    this.storageService.setLoginEmail(res['content'].user_email);
    this.storageService.setOrganizationId(res['content'].organisation_id);
    this.storageService.setUserID(res['content'].user_id);

    this.router.navigate(['/doqfy/pre-procurement/procurement-listing']);
  }

  //---------------------- Show success login message on login -------------------------//

  setOrderReviewer(account_id) {
    this.userService.getOrderReviewConsent(account_id).subscribe((res) => {
      this.order_reviewer = res['content'].maker_checker;
      this.otp_validation = res['content'].esign_otp;
      this.storageService.setOrderReviewConsent(this.order_reviewer);
      this.storageService.setOtpValidation(this.otp_validation);
      this.storageService.setEstampDefault(res['content'].estamp_default);
      this.storageService.setEsignDefault(res['content'].esign_default);
      this.storageService.setStampEdit(res['content'].estamp_field_editable);
      this.storageService.setStampSignatory(res['content'].stamp_sign);
      this.storageService.setAdharEdit(res['content'].aadhaar_validation);
      this.storageService.setAutoEsignEdit(res['content'].auto_esign);
      this.storageService.setOrderPayment(res['content'].order_payment);
      this.storageService.setDropBoxEnabled(res['content']?.additional_configuration?.drop_box);
      this.storageService.setSyncSecondPartyAndPrice(res['content']?.additional_configuration?.sync_second_party_and_price ?? false);
      this.storageService.setAuthenticationDefault(
        res['content'].authentication_default
      );
      this.storageService.setInventoryPayment(res['content'].additional_configuration?.inventory_payment);
      this.storageService.setAbclMidMarket(res['content'].additional_configuration?.abcl_mid_market);
      this.storageService.setInfiniteCorp(res['content'].additional_configuration?.default_esign);
      this.storageService.setUploadDocxFile(res['content'].upload_docx_file);
      const editPdfStatus = !!res['content']?.additional_configuration?.edit_pdf;
      this.storageService.setEditPdf(editPdfStatus);
      this.storageService.setPaymentProviders(res['content'].payment_providers);
      const cloudSignStatus = !!res['content']?.cloud_sign;
      this.storageService.setCloudSign(cloudSignStatus);
      const authorisedSignatureStatus = !!res['content']?.is_authorized_signature;
      this.storageService.setAuthorisedSignature(authorisedSignatureStatus);
      this.storageService.setRefIdWithFileNameValidation(
        !!res['content']?.additional_configuration?.reference_id_with_file_name_validation
      );
    });
  }

  toggleAnnouncement() {
    if (this.showAnnouncement) {
      this.closeToggle();
    } else {
      this.showAnnouncement = true;
    }
    this.announcementService.setAnnouncementStatus(this.showAnnouncement);
  }

  closeToggle() {
    this.isClosing = true; // Start the fade-out animation
    setTimeout(() => {
      this.showAnnouncement = false; // Remove the popup after the animation
      this.isClosing = false; // Reset the isClosing state
    }, 500); // Match this with the CSS transition duration
  }
  resendOtp() {
    if (this.isLoading) {
      return;
    }

    const email = (this.selectedUserEmail || this.loginForm.controls['email']?.value || '').trim();
    if (!email) {
      this.messageService.add({
        severity: 'error',
        summary: 'Email Missing',
        detail: 'Please enter your email address again.',
        styleClass: 'custom-toast-error',
      });
      return;
    }

    this.isLoading = true;
    this.showInvalid = false;
    this.selectedUserEmail = email;

    // Call login API to generate & resend a new OTP
    this.loginService.login({ username: email }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.timeLeft = 30;
        this.startTimer();
        this.otp = '';
        this.enableOtp = true;
        this.showOtpComponent = false;
        setTimeout(() => {
          this.showOtpComponent = true;
          this.cdr.detectChanges();
        }, 0);
        this.messageService.add({
          severity: 'success',
          summary: 'OTP Sent',
          detail: res?.message || `A new verification code was sent to ${email}`,
        });
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isLoading = false;
        const errorMessage =
          error?.error?.message || 'Could not resend the verification code. Please try again.';
        this.authErrorMessage = errorMessage;
        this.showInvalid = true;
        this.messageService.add({
          severity: 'error',
          summary: 'Resend Failed',
          detail: errorMessage,
          styleClass: 'custom-toast-error',
        });
        this.cdr.detectChanges();
      },
    });
  }

  changeEmail() {
    this.isOtpStep = false;
    this.otp = '';
    this.enableOtp = true;
    this.showInvalid = false;
    this.timeLeft = 30;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.cdr.detectChanges();
  }

  startTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.cdr.detectChanges();
      } else {
        this.timeLeft = 0;
        clearInterval(this.interval);
        this.interval = null;
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  onOtpChange(otp: string) {
    this.otp = otp;
    this.enableOtp = otp.length !== 6;
    this.showInvalid = false;
  }

  otpOnSubmit() {
    if (this.enableOtp || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.showInvalid = false;
    this.loginService
      .login({ username: this.selectedUserEmail, otp: this.otp })
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.loginAttemptCount = 0;
          if (!res?.content?.token) {
            this.authErrorMessage =
              res?.message || 'The verification code is invalid or expired.';
            this.showInvalid = true;
            return;
          }
          this.setUserDetails(res);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.authErrorMessage =
            error?.error?.message || 'The verification code is invalid or expired.';
          this.showInvalid = true;
        },
      });
  }
}