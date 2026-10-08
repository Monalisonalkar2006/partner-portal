import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    baseEndPoint = ""
    constructor(public httpClient: HttpClient) {
        this.baseEndPoint = environment.apiURL;
    }

    getNotifications() {
        let endPoint = this.baseEndPoint + "/notification/notifications/";
        return this.httpClient.get(endPoint);
    }

    notificationMarkRead(data) {
        let endPoint = this.baseEndPoint + "/notification/notification-mark-read/";
        return this.httpClient.post(endPoint, data);
    }
}
