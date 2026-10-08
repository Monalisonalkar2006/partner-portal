import { Injectable } from '@angular/core';
import { GenericHttpService } from './generic-http.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserDashboardService {

  baseEndPoint = '';

  constructor(
    public httpService: GenericHttpService,
    private httpclient: HttpClient,
    private storageService: StorageService) {
    this.baseEndPoint = environment.apiURL;
  }

  getAccountDetail() {
    return this.httpService.Get(`/account/user-account/`);
  }

  getFilteredAccountDqetail(queryParams) {
    return this.httpService.Get(`/account/user-account/?search=` + queryParams.search);
  }

  getStates() {
    const account_id = this.storageService.getAccountId() || null;
    const contractType = this.storageService.getContractType();
    const contractNumber = this.storageService.getContractNumber()
    if (contractType && contractNumber) {
      return this.httpService.Get(`/account/branch-states/?account_id=${account_id}&contract_type=001`);

    } else {
      return this.httpService.Get(`/account/branch-states/?account_id=${account_id}`);

    }
  }


  //------------------------State Procurment ---------------------------//

  getStatesProcurement(account_id) {

    return this.httpService.Get(`/account/branch-states/?account_id=${account_id}`);
  }
  //---------------------------------------------------------------------//

  getStatesByAccount(id) {
    return this.httpService.Get(`/account/branch-states/?account_id=${id}`);
  }

  getUsersDetails() {
    return this.httpService.Get('/user/');
  }


  getOrganizationDetails() {
    return this.httpService.Get('/organisation/');
  }

  editOrganizationData(data) {
    return this.httpService.Put(data, '/organisation/');
  }

  getBranchList() {
    return this.httpService.Get(
      '/account/branch/?pagination=0'
    );
  }

  getBranchListByAccountAndState(account_id, state_id) {
    return this.httpService.Get(
      `/account/branch/?account_id=${account_id}&state_id=${state_id}&pagination=0`
    );
  }

  getBranchListbyStateId(stateId, accountId) {
    return this.httpService.Get(
      `/account/branch/?pagination=0&state_id=${stateId}&account_id=${accountId}`
    );
  }
  getBranchListbyAccountID(id, account_id) {
    return this.httpService.Get(
      '/account/branch/?pagination=0&state_id=' + id + '&account_id=' + [account_id]
    );
  }


  getAllBranches(queryParams) {
    return this.httpService.Get(
      '/account/branch/?pagination=' + queryParams
    );
  }

  getDashboard() {
    return this.httpService.Get('/dashboard/');
  }

  getOrderDetails() {
    return this.httpService.Get('/order/orders/');
  }

  getFilterDetails(param: any) {
    return this.httpService.Get('/dashboard/' + param);
  }

  getOrdersCount(startDate?, endDate?) {
    if (startDate || endDate) {
      return this.httpService.Get('/order/orders-counts?start_date=' + startDate + '&end_date=' + endDate);
    }
    return this.httpService.Get('/order/orders-counts');
  }

  // getFilterDetailsForReportsSummary(param?: any) {

  //   return this.httpService.Get('/order/orders-counts/' + param);
  // }

  getFilterDetailsForReportsSummary(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + "/order/orders-counts/";
    if (queryParams) {
      endPoint += this.httpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getRefIdConsent(queryParams?) {
    return this.httpService.Get('/user/get/user-consent/?consent_type=' + queryParams);
  }

  getStampDashboardData(queryParams?) {
    return this.httpService.Get('/estamp/stamp-dashboard/?account_id=' + queryParams.account_id + '&state_code=' + queryParams.state_code);
  }

  postStampDashboardData(data) {
    return this.httpService.Post('/estamp/stamp-dashboard/', data);
  }

  exportStampDashboardData(queryParams?) {
    return this.httpService.Get('/report/export-stamp-dashboard/?account_id=' + queryParams.account_id + '&state_code=' + queryParams.state_code);
  }

  getDefaultFieldData(account_id) {
    const user_id = this.storageService.getUserID() || null;
    return this.httpService.Get(`/account/default-field-data/?account_id=${account_id}&user_id=${user_id}`);
  }

  getOrdersCountForDashboard(param) {
    return this.httpService.Get('/dashboard-order-count/' + param);
  }

  getFilterOrderDetails(param: any) {
    return this.httpService.Get('/dashboard-order-count/' + param);
  }

  getEstampsCount() {
    return this.httpService.Get('/dashboard-estamp-count/');
  }

  getFilterEstampDetails(param: any) {
    return this.httpService.Get('/dashboard-estamp-count/' + param);
  }

  getEsignsCount() {
    return this.httpService.Get('/dashboard-esign-count/');
  }

  getFilterEsignDetails(param: any) {
    return this.httpService.Get('/dashboard-esign-count/' + param);
  }

  getConsumptionReport(data: any) {
    let endPoint = this.baseEndPoint + `/report/v1/consumption-report/`;
    return this.httpclient.post(endPoint, data);
  }
convertCsvFile(data: any): Observable<any> {
  return this.httpclient.post(
    this.baseEndPoint + '/order/convert-csv-file/',
    data
  );
}

}
