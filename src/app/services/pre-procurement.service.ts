import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { GenericHttpService } from './generic-http.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PreProcurementService {
  baseEndPoint;

  constructor(
    public genericHttpService: GenericHttpService,
    private httpclient: HttpClient
  ) {
    this.baseEndPoint = environment.apiURL;
  }

  getCessDetails(queryParams?) {
    return this.genericHttpService.Get(
      '/payment/calculate-amount/?' + queryParams
    );
  }


  calculateAmountBulk(data: any[]): Observable<any> {
  const endPoint =
    this.baseEndPoint + '/payment/calculate-amount-bulk/';

  return this.httpclient.post(endPoint, data);
}

  getProcurmentDetails(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/payment/procrument-bulk/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }
  // getProcurmentDetails() {
  //   return this.genericHttpService.Get('/payment/procrument-bulk/');
  // }
  getProcurementById(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/payment/procrument-details/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }
  // getProcurementById(id: string){
  //   return this.genericHttpService.Get('/payment/procrument-details/?id='+id);
  // }

  createProcurmentOrder(data: any) {
    let endPoint = this.baseEndPoint + '/payment/procrument-details/';
    return this.httpclient.post(endPoint, data);
  }

  getStampTypeByState(id: string) {
    let endPoint =
      this.baseEndPoint + '/estamp/state-stamp-type/?state_code=' + id;
    return this.httpclient.get(endPoint);
  }

  getArticles(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/articles/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }

    return this.httpclient.get(endPoint);
  }


  getReviewerData(account_id: any): Observable<any> {
    let endPoint = this.baseEndPoint + `/payment/validate-pre-procurement-reviewers/?account_id=${account_id}`;
    return this.httpclient.get(endPoint);
  }

  getApproveOrder(data: any) {
    let endPoint =
      this.baseEndPoint + '/payment/pre-procurement-order-approve/';
    return this.httpclient.post(endPoint, data);
  }

  getPreProcurmentCount(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/payment/pre-procurement-status/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  ExportProcurmentReport(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/payment/pre-procurement-report/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }
}