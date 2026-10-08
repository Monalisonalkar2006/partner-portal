import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ToastMessageComponent } from './toast-message/toast-message.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputText,
    Checkbox,
    Button,
    Toast,
    ToastMessageComponent,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputText,
    Checkbox,
    Button,
    Toast,
    ToastMessageComponent,
  ],
  providers: [MessageService]
})
export class SharedComponentsModule { }
