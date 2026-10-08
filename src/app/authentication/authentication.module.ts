import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthenticationRoutingModule } from './authentication-routing.module';
import { AuthParentComponent } from './auth-parent/auth-parent.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedComponentsModule } from '../shared-components/shared-components.module';
import { OtpScreenComponent } from './otp-screen/otp-screen.component';
import {NgOtpInputModule} from "ng-otp-input";
import { MicrosoftAuthComponent } from './microsoft-auth/microsoft-auth.component';
import { CommonLandingPageComponent } from './common-landing-page/common-landing-page.component';


@NgModule({
  declarations: [
    AuthParentComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    OtpScreenComponent,
    MicrosoftAuthComponent,
    CommonLandingPageComponent
  ],
  // All the node modules should be added we use for commen should be added in SharedComponentsModule
  imports: [
    CommonModule,
    AuthenticationRoutingModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    NgOtpInputModule    
  ]
})
export class AuthenticationModule { }
