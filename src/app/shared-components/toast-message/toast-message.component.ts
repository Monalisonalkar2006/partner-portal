import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';

export interface ToasterState {
  toastType: string;
  show: boolean;
  message: string;
}

@Component({
  selector: 'app-toast-message',
  templateUrl: './toast-message.component.html',
  styleUrls: ['./toast-message.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ToastMessageComponent implements OnInit, OnDestroy {

  toastType = 'alert-success';
  show = false;
  message = "";
  private subscription!: Subscription;

  constructor(private toastService: ToastService) { }

  ngOnInit() {
    const that = this;
    this.subscription = this.toastService.toasterState.subscribe(
      async (state: ToasterState) => {
        that.show = await state.show;
        that.toastType = await state.toastType;
        that.message = await state.message;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
