import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { MessageService } from 'primeng/api';
import { LoginService } from '../../services/login.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { StorageService } from '../../services/storage.service';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss'],
    standalone: false
})
export class ForgotPasswordComponent implements OnInit {
  emailForm!: FormGroup;
  submitted: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private cookieService: CookieService,
    private spiinner: NgxSpinnerService,
    private loginService: LoginService,
    private storageService: StorageService,
    private messageService: MessageService
  ) {
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.spiinner.hide();
  }

  // ---------------------- Sending Email Need to add Forget Api --------------------------------------//
  submitMail() {
    this.submitted = true;
    if (this.emailForm.invalid) {
      return;
    }
    const mailObj = {
      email: this.emailForm.value.email,
    };
    this.storageService.setLoginEmail(this.emailForm.value.email);
    this.loginService
      .sendOtp(this.emailForm.value.email)
      .subscribe((res: any) => {
        if (res) {
          this.router.navigate(['opt-validation']);
        }
      });
  }
}
