import { Injectable } from '@angular/core';
import { ToasterState } from '../../app/shared-components/toast-message/toast-message.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toasterSubject = new Subject<ToasterState>();

  toasterState = this.toasterSubject.asObservable();

  constructor() { }

  show(message: string, toastType: string) {
    let that = this;
    this.toasterSubject.next({ show: true, message: message, toastType: toastType } as ToasterState);
    setTimeout(function () { that.hide(); }, 3000);
  }

  hide() {
    this.toasterSubject.next({ show: false, message: "", toastType: "" } as ToasterState);
  }
}
