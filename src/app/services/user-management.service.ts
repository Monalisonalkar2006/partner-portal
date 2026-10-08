import { Injectable } from '@angular/core';
import { GenericHttpService } from './generic-http.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  baseEndPoint: any;

  constructor(
    public httpService: GenericHttpService,
    private httpclient: HttpClient
  ) {
    this.baseEndPoint = environment.apiURL;
  }

  getUsersDetails(queryParams?: any) {
    return this.httpService.Get('/user/?search=' + queryParams);
  }

  getUsersDetailsById(id: any) {
    return this.httpService.Get('/user/?user_id=' + id);
  }

  getUserData(queryParams?: object): Observable<any> {
    let endPoint = this.baseEndPoint + '/user/';
    if (queryParams) {
      endPoint += this.httpService.getQueryString(queryParams);
    }
    return this.httpclient.get(endPoint);
  }

  createUser(BranchData: any) {
    return this.httpService.Post(BranchData, '/user/');
  }
  // editUser(BranchData:any) {

  //   return this.httpService.Put(BranchData, '/user/');

  // }

  editUser(BranchData: any) {
    let endPoint = this.baseEndPoint + '/user/';

    return this.httpclient.put(endPoint, BranchData);
  }

toggleUserStatus(payload: any) {
  return this.httpService.Get(
    `/user/toggle-user-status/?user_id=${payload.user_id}&is_approver=${payload.is_approver}&is_user_active=${payload.is_user_active}`
  );
}

  userRoleFilter() {
    return this.httpService.Get(`/filters/?filters=roles`);
  }

  getUserActivityReport(data: any) {
    return this.httpService.Post(data, '/user-activity-report/');
  }

  downloadBase64File(base64Data: string, fileName: string, mimeType: string) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}