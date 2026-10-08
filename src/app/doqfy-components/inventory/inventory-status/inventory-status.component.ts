import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { EstampService } from 'src/app/services/estamp.service';
import { StorageService } from 'src/app/services/storage.service';
import { GenericHttpService } from 'src/app/services/generic-http.service';
import moment from 'moment';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import { state } from '@angular/animations';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { TableColumn } from 'src/app/shared-components/data-table/data-table.component';

@Component({
    selector: 'app-inventory-status',
    templateUrl: './inventory-status.component.html',
    styleUrls: ['./inventory-status.component.scss'],
    standalone: false
})
export class InventoryStatusComponent implements OnInit {
  readonly statusColumns: TableColumn[] = [
    { field: 'state', header: 'State' },
    { field: 'total_stamps', header: 'Total Stamps' },
    { field: 'consumed_stamps', header: 'Consumed Stamps' },
    { field: 'available_stamps', header: 'Available Stamps' },
    { field: 'action', header: 'Action', toggleable: false },
  ];

  readonly denominationColumns: TableColumn[] = [
    { field: 'state', header: 'State' },
    { field: 'article_code', header: 'Article' },
    { field: 'denomination', header: 'Denomination' },
    { field: 'total_stamps', header: 'Total Stamps' },
    { field: 'consumed_stamps', header: 'Consumed Stamps' },
    { field: 'available_stamps', header: 'Available Stamps' },
  ];

  estampFilters: { account_id: string | null };
  stampInventoryStatusData: any;
  stampDenominationCountData: any;
  states: any;
  selectedState: any;
  rangeDates: Date;
  //dateRange: Date[] = [];
  @ViewChild('calendar') calendar: any;
  maxDate = new Date();
  isViewMoreClicked: boolean = false;
  accounts: any;
  selectedStateCode: any;
  selectedAccount: any;

  constructor(private estampService: EstampService,
    private storageService: StorageService,
    private genericHttpService: GenericHttpService,
    private userDashboardService: UserDashboardService,
    private accountManagementService:AccountManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.estampFilters = {
      account_id: this.storageService.getAccountId() || null,
    };
  }

  ngOnInit(): void {
    this.getStampInventoryStatus(this.estampFilters)
    this.getAccountDetails();
    this.getStates();
  }

  getStampInventoryStatus(filters) {
    this.stampInventoryStatusData = [];
    this.estampService.getStampInventoryStatus(filters).subscribe((resp) => {
      if (resp.status == 200) {
        if (resp.content.length != 0) {
          this.stampInventoryStatusData = resp.content;
        } else {
          this.stampInventoryStatusData = [];
        }
      }
      this.cdr.detectChanges();
    })
  }

  getStampDenominationCount(state_code) {
    this.selectedStateCode = state_code
    this.estampFilters["state_code"] = state_code
    this.isViewMoreClicked = true
    this.estampService.getStampDenominationCount(this.estampFilters).subscribe((resp) => {
      if (resp.status == 200) {
        if (resp.content.length != 0) {
          this.stampDenominationCountData = resp.content;
        } else {
          this.stampDenominationCountData = resp.content;
        }
      }
      this.cdr.detectChanges();
    })
  }

  getStates() {
    this.genericHttpService.getStates().subscribe((resp) => {
      if (resp.status == 200) {
        this.states = resp.content;
      }
    })
  }

  onChangeState() {
    if (this.selectedState !== null)
      this.estampFilters["state_code"] = this.selectedState;
    else
      this.estampFilters["state_code"] = ''
    this.getStampInventoryStatus(this.estampFilters);
  }

  onSelect() {
    if (this.rangeDates[1]) {
      this.estampFilters["start_date"] = moment(this.rangeDates[0]).format("YYYY-MM-DD");
      this.estampFilters["end_date"] = moment(this.rangeDates[1]).format("YYYY-MM-DD");
      this.calendar.overlayVisible = false;
      this.getStampInventoryStatus(this.estampFilters);
    }
  }

  onDateRangeChange(evt) {
    if (evt === null) {
      this.estampFilters["start_date"] = ''
      this.estampFilters["end_date"] = ''
      this.getStampInventoryStatus(this.estampFilters);
    }
  }

  getAccountDetails() {
    this.userDashboardService.getAccountDetail().subscribe((res: any) => {
      this.accounts = res.content;
      this.getDefaultAccountDetails();
    })
  }

  getDefaultAccountDetails(){
    const  account_id = this.storageService.getAccountId();
    if(account_id){
    
      this.accountManagementService.getAccountDetail(account_id).subscribe( res =>{
       this.accounts.push(res['content'][0]);
       this.selectedAccount = res['content'][0].id;
      })
    }
  }

  onChangeAccount(event) {

    if (event.value === null)
      this.estampFilters["account_id"] = this.storageService.getAccountId() || null;
    else {
      this.estampFilters["account_id"] = event.value;
     
    }
    this.getStampInventoryStatus(this.estampFilters)
  }

  onAccountFilter(event) {
    if (event.filter !== null) {
      this.getAccountDetailsByFilter(event.filter)
    } else {
      this.getAccountDetailsByFilter('');
    }
  }

  getAccountDetailsByFilter(value) {
    const accountFilter = { search: value };
    this.userDashboardService.getFilteredAccountDqetail(accountFilter).subscribe((res: any) => {
      this.accounts = res.content
    })
  }

  onSelectDateRange() {
    if (this.rangeDates[1]) {
      this.estampFilters["start_date"] = moment(this.rangeDates[0]).format("YYYY-MM-DD");
      this.estampFilters["end_date"] = moment(this.rangeDates[1]).format("YYYY-MM-DD");
      this.calendar.overlayVisible = false;
      this.getStampDenominationCount(this.selectedStateCode);
    }
  }

  onDateRangeChangeStateWise(evt) {
    if (evt === null) {
      this.estampFilters["start_date"] = ''
      this.estampFilters["end_date"] = ''
      this.getStampDenominationCount(this.selectedStateCode);
    }
  }

  goToInventoryStatus() {
    this.isViewMoreClicked = false;

    if (!this.selectedState) {
      delete this.estampFilters["state_code"]
      this.getStampInventoryStatus(this.estampFilters)
    }

  }


}
