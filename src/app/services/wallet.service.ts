import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { GenericHttpService } from './generic-http.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  baseEndPoint = '';
  constructor(
    public httpService: GenericHttpService,
    private httpclient: HttpClient
  ) {}

  createWallet(walletData: any): Observable<any> {
    return this.httpService.Post(walletData, '/wallet/create-account/');
  }
  getWalletClientDetails(walletID: string): Observable<any> {
    return this.httpService.Get(
      `/wallet/fetch-account-details/?virtual_account_no=${walletID}`
    );
  }
  getTransactionHeaderDetails(userID: string): Observable<any> {
    return this.httpService.Get(
      `/wallet/fetch-account-details/?virtual_account_no=${userID}`
    );
  }

  createPaymentOrder(payload: any): Observable<any> {
   return this.httpService.Post(payload, '/wallet/create-payment-order/');
  }

  getWalletAccountDetails(params): Observable<any> {
    let queryParams = new HttpParams()
      .set('page_number', params.page)
      .set('page_size', params.limit)
      .set('wallet', 'true');

    // Optional params
    if (params.search) {
      queryParams = queryParams.set('search', params.search);
    }

    if (params.sort) {
      queryParams = queryParams.set('sort', params.sort);
    }

    return this.httpService.Get(`/account/account/?${queryParams.toString()}`);
  }
  getTransactions(walletId) {
    return this.httpService.Get(
      `/wallet/fetch-transactions/?virtual_account_no=${walletId}`
    );
  }

  getPayeeOptons(accountID) {
    return this.httpService.Get(
      `/wallet/fetch-linked-payee/?virtual_account_no=${accountID}`
    );
  }
  sendOtp(otpType): Observable<any> {
    return this.httpService.Post(otpType, '/ops/send/otp/');
  }
  validateOtp(verificationType, otp): Observable<any> {
    return this.httpService.Get(
      '/ops/verify-otp/?verification_type=' + verificationType + '&otp=' + otp
    );
  }
  createPayee(data): Observable<any> {
    return this.httpService.Post(data, '/wallet/create-payee/');
  }
  createTransaction(data) {
    return this.httpService.Post(data, '/wallet/create-transaction/');
  }
  getTransactionDetails(accountNmber, params): Observable<any> {
    let endPoint = `/wallet/get-transactions/?account_id=${accountNmber}`;
    if (params) {
      endPoint +=
        '&' + this.httpService.getQueryString(params).replace(/^\?/, '');
    }
    return this.httpService.Get(endPoint);
  }
  getPaymentValidation(payment_option): Observable<any> {
    return this.httpService.Get(
      `/wallet/payment-mode-validation?payment_mode=${payment_option}`
    );
  }

  exportTransactions(accountNmber, params): Observable<any> {
    let endPoint = `/wallet/transactions-report/?account_id=${accountNmber}`;
    if (params) {
      endPoint +=
        '&' + this.httpService.getQueryString(params).replace(/^\?/, '');
    }
    return this.httpService.Get(endPoint);
  }

  base64ToCSV(base64String: string, fileName: string) {
    const byteCharacters = atob(base64String);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
  
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, { type: 'application/csv' });
    const csvURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = csvURL;
    link.download = `${fileName}.csv`;
      link.click();
      URL.revokeObjectURL(csvURL);
  }
}
