import { Component, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { MessageService } from 'primeng/api';
import { LoginService } from '../../services/login.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { StorageService } from '../../services/storage.service';

@Component({
    selector: 'app-otp-screen',
    templateUrl: './otp-screen.component.html',
    styleUrls: ['./otp-screen.component.scss'],
    standalone: false
})
export class OtpScreenComponent implements OnInit {
  timeLeft: number = 30;
  interval: any;
  validOTP: boolean = false;
  otp!: string;
  submittedPassword = false;
  showPassword: boolean = false;
  email: any;
  sendOtp: boolean = false;
  @ViewChild('ngOtpInput', { static: false }) ngOtpInput: any;
  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
  };
  passwordForm!: FormGroup;
  enableOtp: boolean = true;
  hide: string = 'pi pi-eye-slash';
  show: string = 'pi pi-eye';
  icontoDisplay: string = this.hide;
  icontoDisplay1: string = this.hide;
  showOtpComponent: boolean = true;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private spiinner: NgxSpinnerService,
    private messageService: MessageService,
    private cookieService: CookieService,
    private storageService: StorageService,
    private loginService: LoginService
  ) {
    this.passwordForm = this.formBuilder.group({
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$'
          ),
          Validators.minLength(8),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    });
    // this.email = this.cookieService.get('email');
    this.email = this.storageService.getLoginEmail();
    this.showInfo();
  }

  ngOnInit() {
    this.spiinner.hide();
    this.startTimer();
  }

  //--------------------- Check that opt 4 values are entered -----------------//
  onOtpChange(otp: string) {
    this.otp = otp;
    if (this.otp.length == 6) {
      this.enableOtp = false;
    } else {
      this.enableOtp = true;
    }
  }

  //------------------------ need to Add opt varivication apt here --------------------//
  otpOnSubmit() {
    this.loginService.verifyOtp(this.email, this.otp).subscribe((res) => {
      this.sendOtp = true;
      this.showInfo();
    });
  }

  startTimer() {
    setTimeout(() => {
      this.showEmailInfo();
    }, 1);
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.timeLeft = 0;
        clearInterval(this.interval);
        this.interval = null;
      }
    }, 1000);
  }

  //----------------To add api to get new Opt --------------//
  resendOtp() {
    this.timeLeft = 30;
    this.startTimer();
    this.loginService.sendOtp(this.email).subscribe((res: any) => {
      if (res) {
        this.router.navigate(['opt-validation']);
      }
    });
    this.showOtpComponent = false;
    this.otp = null;
    setTimeout(() => {
      this.showOtpComponent = true;
    }, 0);
  }

  //--------------------- To check that both new password and confirm password are same or not ---------------------//

  onPasswordChange() {
    if (this.confirmPassword.value == this.password.value) {
      this.confirmPassword.setErrors(null);
    } else {
      this.confirmPassword.setErrors({ mismatch: true });
    }
  }

  get password(): AbstractControl {
    return this.passwordForm.controls['password'];
  }

  get confirmPassword(): AbstractControl {
    return this.passwordForm.controls['confirmPassword'];
  }

  //--------------------------Need to add reset password Api here -----------------------//
  setNewPassword() {
    this.submittedPassword = true;
    if (this.passwordForm.invalid) {
      return;
    }
    const passwordObj = {
      email: this.email,
      password: this.passwordForm.value.password,
      confirmPassword: this.passwordForm.value.confirmPassword,
    };
    this.loginService
      .resetPassword(
        this.otp,
        passwordObj.confirmPassword,
        passwordObj.email,
        passwordObj.password
      )
      .subscribe((res: any) => {
        if (res) {
          this.showResetInfo(res.message);
        }
        setTimeout(() => {
          this.router.navigate(['login']);
        }, 2000);
      });
  }

  //---------------------Reset password show and hide -------------------------------//

  toggleFieldTextType(input: any) {
    if (input.type === 'password') {
      input.type = 'text';
      this.icontoDisplay = this.show;
    } else {
      input.type = 'password';

      this.icontoDisplay = this.hide;
    }
  }

  toggleFieldTextType1(input: any) {
    if (input.type === 'password') {
      input.type = 'text';
      this.icontoDisplay1 = this.show;
    } else {
      input.type = 'password';

      this.icontoDisplay1 = this.hide;
    }
  }

  //-------------------------- using primeng message to display diffrent message -------------------//
  showInfo() {
    this.messageService.add({
      severity: 'info',
      summary: 'OTP Validation Successfully!',
      detail: 'Please  reset your password',
    });
  }

  showEmailInfo() {
    this.messageService.add({
      severity: 'info',
      summary: 'Email Sent Successfully!',
      detail:
        'Please use the OTP sent to the registered email to reset your password',
    });
  }

  showResetInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: msg,
      detail: 'Please use your new password when you login',
    });
  }
}
