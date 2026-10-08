import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GenericHttpService {

  baseEndPoint = '';
  constructor(private httpclient: HttpClient) {
   this.baseEndPoint = environment.apiURL;
  }

  // GET
  Get(apiEndPoint: string, id?: any, queryString?: string): Observable<any> {
    let endPoint = this.baseEndPoint + apiEndPoint;
    if (id) {
      endPoint += '' + id;
    }
    if (queryString) {
      endPoint += '?' + queryString;
    }
    return this.httpclient.get(endPoint);
  }

  // POST
  Post(data: any, apiEndPoint: string): Observable<any> {
    return this.httpclient.post(this.baseEndPoint + apiEndPoint, data);
  }

  // POST
  PostEncoded(formdata: any, apiEndPoint: string, options: any): Observable<any> {
    return this.httpclient.post(this.baseEndPoint + apiEndPoint, formdata, options);
  }

  // PUT
  Put(data: any, apiEndPoint: string): Observable<any> {
    return this.httpclient.put(this.baseEndPoint + apiEndPoint, data);
  }

  // PUT S3 PRESIGNED URL
  PutS3PreSignedUrl(presignedurl: string, file: any): Observable<any> {
    const headers = { 'Content-Type': file.type, isAddToken: 'false' };
    return this.httpclient.put(presignedurl, file, {
      headers
    });
  }

  // DELETE
  Delete(apiEndPoint: string): Observable<any> {
    return this.httpclient.delete(this.baseEndPoint + apiEndPoint);
  }

  getQueryString(queryParams){
    var queryParamsArray:any = [];
      for (let key in queryParams){
        queryParamsArray.push(key + "=" + queryParams[key])
      }
      return "?" + queryParamsArray.join("&")
  }

  getFilters(queryParams?:object): Observable<any> {
    let endPoint = this.baseEndPoint + "/filters/";
    if (queryParams){
      endPoint += this.getQueryString(queryParams);
    }

    return this.httpclient.get(endPoint);
  }

  getStates(): Observable<any> {
    let endPoint = this.baseEndPoint + "/states/";
    return this.httpclient.get(endPoint);
  }

  getStatesWithBranches(): Observable<any> {
    let endPoint = this.baseEndPoint + "/account/branch-states/";
    return this.httpclient.get(endPoint);
  }
}
