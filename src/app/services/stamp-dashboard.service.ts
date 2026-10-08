import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { GenericHttpService } from './generic-http.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StampDashboardService {
  baseEndPoint;

  constructor(
    public genericHttpService: GenericHttpService, 
    private httpclient: HttpClient
  ) {
    this.baseEndPoint = environment.apiURL;
  }

  getStampDetails(queryParams?:object): Observable<any> {
    let endPoint = this.baseEndPoint + "/payment/procrument-bulk/";
    if (queryParams){
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getProcurementById(queryParams?:object): Observable<any> {
    let endPoint = this.baseEndPoint + "/payment/procrument-details/";
    if (queryParams){
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  postStampAvailable(data: any) {
    return this.genericHttpService.Post(data, '/estamp/stamp-availability-ops/');
  }

  getStampAvailable(id: string) {
    let endPoint = this.baseEndPoint + "/estamp/stamp-availability/?account=" + id;
    return this.httpclient.get(endPoint);
  }

  getWalletDetails(id: string) {
    let endPoint = this.baseEndPoint + "/estamp/wallet-balance/?account_id=" + id;
    return this.httpclient.get(endPoint);
  }

}
