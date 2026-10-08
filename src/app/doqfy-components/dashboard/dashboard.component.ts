import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit {
  userRole: string;
  filterDate: any;
  startDate: any = '';
  endDate: any = '';

  constructor(private storageService: StorageService, private router: Router) {
    this.userRole = this.storageService.getRole() || null;
    //  this.filterDate = {startDate : this.startDate , endDate:this.endDate};
    if (this.userRole != 'CLIENT') {
      //  this.router.navigate(['doqfy/admin-dashboard']);
    }
  }

  ngOnInit(): void {}

  oneDateChange(event) {
    this.filterDate = event;
  }
}
