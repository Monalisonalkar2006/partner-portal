import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { IdleSessionService } from '../../services/idle-session.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { UserProfileService } from '../../services/user-profile.service';
import { ABCLLoginUrl } from '../../models/user-login.model';
import { AbclService } from '../../services/abcl.service';
import { UrlValidatorService } from '../../services/url-validator.service';
import { DomainType } from '../../enum/domain-type.enum';

@Component({
    selector: 'app-common-landing-page',
    templateUrl: './common-landing-page.component.html',
    styleUrls: ['./common-landing-page.component.scss'],
    standalone: false
})
export class CommonLandingPageComponent implements OnInit {
  order_reviewer: any;
  otp_validation: any;
  showAccessDenied: boolean = false;
  abclLoginUrl: ABCLLoginUrl = new ABCLLoginUrl();
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private spinner: NgxSpinnerService,
    private idleSessionService: IdleSessionService,
    private storageService: StorageService,
    private modalService: NgbModal,
    private userService: UserProfileService,
    private abclService: AbclService,
    private urlValidator: UrlValidatorService,
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      const error = params['error'];

      if (error === 'access_denied') {
        this.showAccessDenied = true;
        this.spinner.hide();
        return;
      }
      const code = params['code'];
      if (code) {
        this.spinner.show();
        this.loginService
          .getCyberArkToken({ code: code })
          .subscribe((res: any) => {
            if (res) {
              this.setUserDetails(res);
            }
          });
      }
    });
  }
  ngOnInit(): void {}
  setUserDetails(res) {
    this.spinner.show();
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
    this.storageService.setABCLToken(res['content'].abcl_token);
    this.abclService.setLogoutUrl(res.content.abcl_logout_url);
    this.router.navigate(['/doqfy/pre-procurement/procurement-listing']);
    this.modalService.dismissAll();
  }
  setOrderReviewer(account_id) {
    this.userService.getOrderReviewConsent(account_id).subscribe((res) => {
      this.order_reviewer = res['content'].maker_checker;
      this.otp_validation = res['content'].esign_otp;
      this.storageService.setOrderReviewConsent(this.order_reviewer);
      this.storageService.setOtpValidation(this.otp_validation);
      this.storageService.setEstampDefault(res['content'].estamp_default);
      this.storageService.setEsignDefault(res['content'].esign_default);
      this.storageService.setStampEdit(res['content'].estamp_field_editable);
      this.storageService.setAdharEdit(res['content'].aadhaar_validation);
      this.storageService.setAutoEsignEdit(res['content'].auto_esign);
      this.storageService.setOrderPayment(res['content'].order_payment);
      this.storageService.setAbclMidMarket(res['content'].additional_configuration?.abcl_mid_market);
      this.storageService.setSyncSecondPartyAndPrice(res['content']?.additional_configuration?.sync_second_party_and_price ?? false);
      const editPdfStatus = !!res['content']?.additional_configuration?.edit_pdf;
      this.storageService.setEditPdf(editPdfStatus);
      this.storageService.setAuthenticationDefault(
        res['content'].authentication_default
      );
      this.storageService.setUploadDocxFile(res['content'].upload_docx_file);
    });
  }
  redirectToLogin() {
    if(this.urlValidator.isValidRedirectUrl(this.abclLoginUrl.login_url, DomainType.ABCL)){
      window.location.href = this.abclLoginUrl.login_url;
    }
  }
}
