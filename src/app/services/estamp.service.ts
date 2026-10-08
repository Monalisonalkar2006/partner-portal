import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GenericHttpService } from './generic-http.service';
import { StorageService } from './storage.service';

export interface StampDenominationRequest {
  account_id?: number;
  branch_code: string;
  article_code: string;
  total_stamp_duty: number;
}

export interface StampDenominationRequestWithoutAccount {
  branch_code: string;
  article_code: string;
  total_stamp_duty: number;
}

export interface StampDenominationError {
  account_id: number;
  branch_code: string;
  article_code: string;
  available_amount: number;
  required_amount: number;
}

export interface StampDenominationResponse {
  errors: StampDenominationError[];
}

@Injectable({
  providedIn: 'root'
})
export class EstampService {
  baseEndPoint = '';

  constructor(
    private httpclient: HttpClient,
    private genericHttpService: GenericHttpService,
    private storageService: StorageService
  ) {
    this.baseEndPoint = environment.apiURL;
  }

  // GET
  getArticles(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/articles/';
    let value = this.storageService.getContractNumber();
    const contractType = this.storageService.getContractType();
    if (contractType) {
      queryParams = {
        ...queryParams,
        contract_type: value
      };
    }
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }

    return this.httpclient.get(endPoint);
  }

  getStampInventory(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/estamp/certificates/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getStampInventoryAndDenominationInfo(
    payload: StampDenominationRequest[]
  ): Observable<StampDenominationResponse> {
    const url = `${this.baseEndPoint}/estamp/denomination-info/`;
    return this.httpclient.post<StampDenominationResponse>(url, payload);
  }

  getOrderRequiredStampCount(data: any): Observable<any> {
    const url = `${this.baseEndPoint}/estamp/order-required-stamp-count/`;
    return this.httpclient.post(url, data);
  }

  // POST
  postEstampData(data: any): Observable<any> {
    let endPoint = this.baseEndPoint + '/estamp/order/';
    return this.httpclient.post(endPoint, data);
  }

  // DELETE
  Delete(apiEndPoint: string): Observable<any> {
    return this.httpclient.delete(this.baseEndPoint + apiEndPoint);
  }

  getCertificateDetails(data: any): Observable<any> {
    let endPoint = this.baseEndPoint + '/estamp/certificate-details/';
    return this.httpclient.post(endPoint, data);
  }

  getOrValidateReferenceId(queryParams?) {
    let endPoint1 = this.baseEndPoint + '/order/orders-reference-id/';
    let endPoint2 =
      this.baseEndPoint + '/order/orders-reference-id/?reference_id=';
    if (queryParams) {
      endPoint2 += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint1);
  }

  getStampInventoryStatus(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/estamp/stamp-inventory-status/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getStampDenominationCount(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/estamp/stamp-denomination-count/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getStateDenomination(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/estamp/state-stamp-type/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }

    return this.httpclient.get(endPoint);
  }
  getPresignedUrls(sessionUuid: string, payload: any): Observable<any> {
    const endPoint =
      this.baseEndPoint + `/sqs/bulk/presigned-urls/${sessionUuid}`;
    return this.httpclient.post(endPoint, payload);
  }
  signalBulkComplete(sessionUuid: string, body: object = {}): Observable<any> {
    const endPoint =
      this.baseEndPoint + `/sqs/bulk/signal-complete/${sessionUuid}`;
    return this.httpclient.post(endPoint, body);
  }
}
