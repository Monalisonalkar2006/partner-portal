import { EventEmitter, Injectable } from '@angular/core';
import { GenericHttpService } from './generic-http.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  valueChanged: EventEmitter<string> = new EventEmitter<string>();
  selectedValue: string;
  uploadDocumentsDetails: any;
  branchId: any;
  orderDetails: any;
  baseEndPoint = '';

  constructor(public httpService: GenericHttpService, private httpclient: HttpClient) {
    this.baseEndPoint = environment.apiURL;
   }

  setSelectedValue(value: string) {
    this.selectedValue = value;
    this.valueChanged.emit(this.selectedValue);
  }

  getStateWallet(queryParams?:object): Observable<any> {
    let endPoint = this.baseEndPoint + "/payment/transfer-state/";
    if (queryParams){
      endPoint += this.httpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }
  
  getPaymentStatus(queryParams?:object): Observable<any> {
    return this.httpService.Post(queryParams, '/payment/razorpay-callback/');
  }

  getBranchWallet(id) {
    return this.httpService.Get('/payment/transfer-branch/?state_wallet_id=' + id);
  }

  getState() {
    //return this.httpService.Get('/states/');
    return this.httpService.Get('/account/branch-states/');
  }

  addNewStateWallet(data) {
    return this.httpService.Post(data, '/payment/transfer-state/');
  }

  addNewBranchWallet(data) {
    return this.httpService.Post(data, '/payment/transfer-branch/');
  }

  getStampTypeByState(id: string) {
    return this.httpService.Get('/estamp/state-stamp-type/?state_code=' + id);
  }

  getBranchList() {
    return this.httpService.Get('/account/branch/');
  }

  getBalance(id:any): Observable<any> {
    let endPoint = this.baseEndPoint + `/payment/balance/?account_id=${id}`;
    return this.httpclient.get(endPoint);
  }

  getTransactionDetails() {
    return this.httpService.Get('/payment/transatction/');
  }

  getPaymentAmountDetails(id){
    let endPoint = this.baseEndPoint + `payment/order-transaction-data/?order_id=${id}`
    return this.httpclient.get(endPoint)
  }
 
    getProcurementById(params?: any) {
    let endPoint = this.baseEndPoint + `/payment/procrument-details/`;

    if (params && Object.keys(params).length > 0) {
      const queryParams = Object.keys(params)
        .filter(
          (key) =>
            params[key] !== null &&
            params[key] !== undefined &&
            params[key] !== ''
        )
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');

      endPoint += `?${queryParams}`;
    }

    return this.httpclient.get(endPoint);
  }

  getProcurementDetailsReport(params?: any): Observable<any> {
    let endPoint = this.baseEndPoint + `/payment/procrument-details-report/`;

    if (params && Object.keys(params).length > 0) {
      const queryParams = Object.keys(params)
        .filter(
          (key) =>
            params[key] !== null &&
            params[key] !== undefined &&
            params[key] !== ''
        )
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');

      endPoint += `?${queryParams}`;
    }

    return this.httpclient.get(endPoint);
  }
}
