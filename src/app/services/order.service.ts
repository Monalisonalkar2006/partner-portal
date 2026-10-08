import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { GenericHttpService } from './generic-http.service';
import { start } from '@popperjs/core';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  baseEndPoint = '';
  orderType: string;

  constructor(
    private httpclient: HttpClient,
    private genericHttpService: GenericHttpService,
    private analyticsService: AnalyticsService,
  ) {
    this.baseEndPoint = environment.apiURL;
  }

  // GET
  getOrders(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/order/orders/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

    
  logOrderTransaction(id: string | number, service?: string, isError = false, errorMsg = '') {
    if (isError) {
        this.analyticsService.logSystemError(service || 'ORDER_SYSTEM', errorMsg || 'Unknown Error', id);
      } else {
        this.analyticsService.logPurchase(id, service || 'UNKNOWN');
    }
  }
  
  getBulkCatUploadOrders(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/sqs/bulk/orders-report/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getUserDetailsByEmail(payload: {
    account_id: any;
    user_email: any;
  }): Observable<any> {
    const endPoint = this.baseEndPoint + '/sqs/bulk/user/details/';
    return this.httpclient.post(endPoint, payload);
  }

  getDraftOrder(orderId: number): Observable<any> {
    const endPoint = `${this.baseEndPoint}/order/cat/draft/?order_id=${orderId}`;
    return this.httpclient.get<any>(endPoint);
  }

  getOrdersPagination(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/order/orders-pagination/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  getEditTemplatePDFDocument(data): Observable<any> {
    let endPoint = this.baseEndPoint + '/order/cat/template/pdf/';
    return this.httpclient.post(endPoint, data);
  }

  getBulkOrders(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/bulk-order/orders/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }

    return this.httpclient.get(endPoint);
  }

  postEstampData(data: any): Observable<any> {
    let endPoint = this.baseEndPoint + '/estamp/order/';
    return this.httpclient.post(endPoint, data);
  }

  getOrderDetail(order_id: number) {
    let endPoint =
      this.baseEndPoint + `/order/orders/?order_ids=${order_id}&detail=1`;
    return this.httpclient.get(endPoint);
  }
  sendLinkToPayee(order_id: number) {
    let endPoint =
      this.baseEndPoint +
      `/payment/retrigger-payment-link/?order_id=${order_id}`;
    return this.httpclient.get(endPoint);
  }

  getAuditTrail(order_id: number) {
    let endPoint =
      this.baseEndPoint + `/order/audit_trail/?order_id=${order_id}`;
    return this.httpclient.get(endPoint);
  }

  getBulkOrderPdfData(id) {
    let data = { bulk_id: id };
    let endPoint = this.baseEndPoint + `/order/bulk-order-documents-email/`;
    return this.httpclient.post(endPoint, data);
  }

  getAllBulkOrderPdfData(queryParams?: object) {
    let endPoint = this.baseEndPoint + `/order/bulk-order-documents/`;
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint, {
      responseType: 'blob',
    });
  }

  getOrderDocument(order_id: number) {
    let endPoint =
      this.baseEndPoint + `/order/order_document/?order_id=${order_id}`;
    return this.httpclient.get(endPoint);
  }
  getOrderDocumentReview(order_id: number) {
    let endPoint =
      this.baseEndPoint +
      `/order/order-reviewar-document/?order_id=${order_id}`;
    return this.httpclient.get(endPoint);
  }
  getBranchList() {
    let endPoint = this.baseEndPoint + `/account/branch/`;
    return this.httpclient.get(endPoint);
  }

  getBranchListWithSearch(branch) {
    let endPoint = this.baseEndPoint + `/account/branch/?search=${branch}`;
    return this.httpclient.get(endPoint);
  }

  approveOrder(data: any): Observable<any> {
    let endPoint = this.baseEndPoint + '/order/approve-order/';
    return this.httpclient.post(endPoint, data);
  }

  verifyApproverEmail(data: any): Observable<any> {
    let endPoint = this.baseEndPoint + '/order/validate-order-reviewer/';
    return this.httpclient.post(endPoint, data);
  }

  getApproverEmail(account_id: any): Observable<any> {
    let endPoint = this.baseEndPoint + `/order/validate-order-reviewer/?account_id=${account_id}`;
    return this.httpclient.get(endPoint);
  }

  cancelOrder(data: any): Observable<any> {
    let endPoint = this.baseEndPoint + '/order/move-order-cancelled/';
    return this.httpclient.post(endPoint, data);
  }

  getBalance(id): Observable<any> {
    let endPoint = this.baseEndPoint + `/payment/balance/?account_id=${id}`;
    return this.httpclient.get(endPoint);
  }

  getBulkOrderSummary(id: any) {
    let endPoint =
      this.baseEndPoint + `/bulk-order/orders-summary/?bulk_order_id=${id}`;
    return this.httpclient.get(endPoint);
  }

  exportEsbtrFiles(order_id: number) {
    let endPoint =
      this.baseEndPoint +
      `/bulk-order/export-esbtr-file/?bulk_order_id=${order_id}`;
    return this.httpclient.get(endPoint);
  }

  getBranchListbyStateId(id) {
    let endPoint =
      this.baseEndPoint + `/account/branch/?pagination=0&state_id=${id}`;
    return this.httpclient.get(endPoint);
  }

  getStates() {
    //let endPoint = this.baseEndPoint + `/states/`;
    let endPoint = this.baseEndPoint + '/account/branch-states/';
    return this.httpclient.get(endPoint);
  }

  updateOrder(data) {
    let endPoint = this.baseEndPoint + `/order/orders/`;
    return this.httpclient.put(endPoint, data);
  }
  //----------------------------------------Esign Apis-------------------------------//
  moveToPriority(data: any) {
    return this.genericHttpService.Post(data, '/order/move-order-in-priority/');
  }

  esignOrderApi(id) {
    let endPoint = this.baseEndPoint + `/esign/update-status/?order_id=${id}`;
    return this.httpclient.get(endPoint);
  }

 getPaymentAmountDetails(id: any, is_pre_order: boolean = false, is_bulk: boolean = false) {
    let endPoint = ``;
    if (is_pre_order) {
      endPoint = this.baseEndPoint + `/payment/order-transaction-data/?pre_order_id=${id}`;
    } else if (is_bulk) {
      endPoint = this.baseEndPoint + `/payment/order-transaction-data/?bulk_id=${id}`;
    } else {
      endPoint = this.baseEndPoint + `/payment/order-transaction-data/?order_id=${id}`;
    }
    return this.httpclient.get(endPoint);
  }

  sendSignerReminder(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/esign/send-esign-reminder/';
    if (queryParams) {
      endPoint += this.genericHttpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }
  approveBulkCatUploadOrder(orderUuid: string): Observable<any> {
    const endPoint = this.baseEndPoint + `/sqs/bulk/approve-order/${orderUuid}`;
    return this.httpclient.post(endPoint, {});
  }
  rejectBulkCatUploadOrder(orderUuid: string, rejectionReason: string): Observable<any> {
  const endPoint = this.baseEndPoint + `/sqs/bulk/reject-order/${orderUuid}`;
  return this.httpclient.post(endPoint, {
    rejection_reason: rejectionReason
  });
}
  getIndividualBulkCatUploadOrder(orderUuid: string): Observable<any> {
    const endPoint =
      this.baseEndPoint +
      `/sqs/bulk/orders-report/?bulk_order_uuid=${orderUuid}`;
    return this.httpclient.get(endPoint);
  }
  downloadBulkOrderExcel(bulkOrderUuid: string): Observable<Blob> {
    const endPoint =
      this.baseEndPoint +
      `/sqs/bulk/orders-report/download-excel/${bulkOrderUuid}`;
    return this.httpclient.get(endPoint, { responseType: 'blob' });
  }
  getBulkOrderFileBase64(
    bulkOrderUuid: string,
    referenceId: string,
  ): Observable<any> {
    const queryParams = {
      bulk_order_uuid: bulkOrderUuid,
      reference_id: referenceId,
    };
    let endPoint = this.baseEndPoint + '/sqs/bulk/orders/file-base64';
    endPoint += this.genericHttpService.getQueryString(queryParams);
    return this.httpclient.get(endPoint);
  }

  getUserSettings() {
  const endPoint = this.baseEndPoint + '/user/user-settings/';
  return this.httpclient.get(endPoint);
}
saveUserSettings(payload: any) {
  const endPoint = this.baseEndPoint + '/user/user-settings/';
  return this.httpclient.post(endPoint, payload);
}
}
