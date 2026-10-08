import { Injectable } from '@angular/core';
import { GenericHttpService } from './generic-http.service';
import { StorageService } from './storage.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  // ✅ BehaviorSubject to emit account changes
  private accountChangedSubject = new BehaviorSubject<string | null>(null);
  accountChanged$ = this.accountChangedSubject.asObservable();

  constructor(public httpService: GenericHttpService, private storageService: StorageService) { }

  // ✅ Call this whenever account changes
  emitAccountChange(accountId: string): void {
    this.accountChangedSubject.next(accountId);
  }

  getUserDetail() {
    return this.httpService.Get('/user/get/user/profile/');
  }

  editUserDetail(data: any) {
    return this.httpService.Put(data, `/user/user/profile/`);
  }

  notificationConsent(data) {
    return this.httpService.Post(data, '/notification/notification-consent/');
  }

  refIdConsent(data) {
    return this.httpService.Post(data, '/user/toggle-user-consent/');
  }

  getRefIdConsent(queryParams?) {
    return this.httpService.Get('/user/get/user-consent/?consent_type=' + queryParams);
  }

  orderReviewConsent(data) {
    return this.httpService.Post(data, '/account/account-setting/');
  }

  getOrderReviewConsent(id) {
    return this.httpService.Get(`/account/account-setting/?account_id=${id}`);
  }

  getArticles(state_code?: any) {
    const url = state_code ? `/articles/?state_code=${state_code}` : `/articles/`;
    return this.httpService.Get(url);
  }

  getDefaultFieldData(account_id) {
    const user_id = this.storageService.getUserID() || null;
    return this.httpService.Get(`/account/default-field-data/?account_id=${account_id}&user_id=${user_id}`);
  }

  postDefaultFieldData(data) {
    return this.httpService.Post(data, '/account/default-field-data/');
  }

  putDefaultFieldData(data) {
    return this.httpService.Put(data, '/account/default-field-data/');
  }

  addGeoFencing(data) {
    return this.httpService.Post(data, "/esign/add-ip-geofencing/");
  }
}
