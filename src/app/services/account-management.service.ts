import { Injectable } from '@angular/core';
import { GenericHttpService } from './generic-http.service';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AccountManagementService {
  baseEndPoint: any;

  constructor(public httpService: GenericHttpService, private httpclient: HttpClient
  ) {
    this.baseEndPoint = environment.apiURL;

  }


  getAccountDetails(queryParams) {
    return this.httpService.Get('/account/account/?fetch_all=true&search=' + queryParams);
  }

  getAccountData(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + "/account/account/";
    if (queryParams) {
      endPoint += this.httpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getAccountDetail(account_id: any) {
    return this.httpService.Get(`/account/account/?account_id=${account_id}`);
  }

  CreateAccount(AccountData: any) {

    return this.httpService.Post(AccountData, '/account/account/');
  }

  toggleAccountStatus(account_id: number) {

    return this.httpService.Get(`/account/toggle-account-status/?account_id=${account_id}`);

  }

  editAccountService(id: any, data: any) {
    return this.httpService.Put(data, `/account/account/?account_id=${id}`);
  }


  getAccountPerUser() {
    return this.httpService.Get(`/account/user-account/`);
  }

  
  getAccountPerUserInventory(value) {
    return this.httpService.Get(`/account/user-account/?search=${value}`);
  }


  getBranchPerUser(accountId, stateId) {
    return this.httpService.Get(`/account/branch/?pagination=0&account_id=${accountId}&state_id=${stateId}`);
  }


  deleteEstamp(data) {
    return this.httpService.Post(data, '/account/delete-account-setting/');
  }

  deleteDefaultEstamp(data) {
    return this.httpService.Post(data, '/account/delete-all-account-setting/');
  }

  deleteDefaultEsignField(data: any) {
    const endPoint = this.baseEndPoint + '/account/default-field-data/';
    return this.httpclient.delete(endPoint, { body: data }); 
  }

}
