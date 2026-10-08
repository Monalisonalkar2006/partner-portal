import { EventEmitter, Injectable } from '@angular/core';
import { GenericHttpService } from './generic-http.service';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CatUploadService {
  valueChanged: EventEmitter<string> = new EventEmitter<string>();
  selectedValue: string;
  uploadDocumentsDetails: any;
  branchId: any;
  orderDetails: any;
  baseEndPoint: string;
  formData: any = null;
  estampFormData: any = null;
  esignFormData: any = null;

  constructor(
    public httpService: GenericHttpService,
    private httpclient: HttpClient
  ) {
    this.baseEndPoint = environment.apiURL;
  }
  private orderIdsSubject = new BehaviorSubject<(string | number)[]>([]);
  orderIds$ = this.orderIdsSubject.asObservable();

  setOrderIds(orderIds: (string | number)[]) {
    this.orderIdsSubject.next(orderIds);
  }

  clearOrderIds() {
    this.orderIdsSubject.next([]);
  }

  setSelectedValue(value: string) {
    this.selectedValue = value;
    this.valueChanged.emit(this.selectedValue);
  }

  getBranchList() {
    return this.httpService.Get('/organisation/branch/');
  }

  catUploadPlaceOrder(data: any, orderId?: string | null) {
    if (orderId) {
      return this.httpService.Put(data, '/order/cat/upload/');
    } else {
      return this.httpService.Post(data, '/order/cat/upload/');
    }
  }

  deleteDraftItem(id: number, type: 'estamp' | 'esign') {
    const param = type === 'estamp' ? 'etamp_id' : 'esign_id';
    return this.httpService.Delete(`/order/cat/draft/?${param}=${id}`);
  }
  
  catImportPlaceOrder(data) {
    return this.httpService.Post(data, '/order/import-contracts/');
  }
  getArticleList(data) {
    return this.httpService.Get(
      '/articles/?state_code=' +
        data.state_code +
        '&article_code=' +
        data.article_code +
        '&article_name=' +
        data.article_name
    );
  }

  getOrderStatus() {
    return this.httpService.Get('/order/order-status');
  }

  getOrderConfirmation(data) {
    return this.httpService.Get(
      '/order/orders/?order_ids=' + data.order_ids + '&detail=' + data.detail
    );
  }

  getPricingDetails(data) {
    return this.httpService.Get('/payment/pricing/?organisation_id=' + data);
  }

  getBulkOrders(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/bulk-order/orders/';
    if (queryParams) {
      endPoint += this.httpService.getQueryString(queryParams);
    }

    return this.httpclient.get(endPoint);
  }

  getOrValidateReferenceId(queryParams?) {
    if (queryParams) {
      return this.httpService.Get(
        '/order/orders-reference-id/?reference_id=' + queryParams
      );
    } else {
      return this.httpService.Get('/order/orders-reference-id/');
    }
  }

  getAddionalFieldDetails(id) {
    const contractType = id;
    return this.httpService.Get(
      `/order/contract-fields/?contract_type=${contractType}`
    );
  }

  setFormData(data: any) {
    this.formData = data;
  }

  // Get the stored form data
  getFormData() {
    return this.formData;
  }

  setEstampFormData(data: any) {
    this.estampFormData = data;
  }

  clearEstampFormData() {
    this.estampFormData = null;
  }

  getEstampFormData() {
    return this.estampFormData;
  }

  setEsignFormData(data: any) {
    this.esignFormData = data;
  }

  getEsignFormData() {
    return this.esignFormData;
  }

  // Clear the stored form data
  clearFormData() {
    this.esignFormData = null;
    this.estampFormData = null;
    this.formData = null;
  }
}
