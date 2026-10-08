import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { StampDashboardService } from 'src/app/services/stamp-dashboard.service';
import { StorageService } from 'src/app/services/storage.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import { Subject, debounceTime } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { TableColumn } from 'src/app/shared-components/data-table/data-table.component';

interface stampDetails {
  state: string;
  state_code: string;
  type: string;
  denomination: string;
  procurement: string;
  amount: string;
  consumed: string;
  availability: string;
  procured: string;
  to_be_procured: string;
}
@Component({
    selector: 'app-stamp-availability',
    templateUrl: './stamp-availability.component.html',
    styleUrls: ['./stamp-availability.component.scss'],
    standalone: false
})
export class StampAvailabilityComponent implements OnInit {
  readonly columns: TableColumn[] = [
    { field: 'state', header: 'State' },
    { field: 'type', header: 'Stamp Type' },
    { field: 'denomination', header: 'Denomination' },
    { field: 'procurement', header: 'Procurement Count' },
    { field: 'amount', header: 'Amount' },
    { field: 'consumed', header: 'Consumed' },
    { field: 'availability', header: 'Actual Availability' },
    { field: 'to_be_procured', header: 'To be Procured' },
  ];

  stampInventoryStatusData: stampDetails[] = [];
  editMode: boolean = false;
  account_id: string;
  accounts: any;
  selectedAccount: string;
  onSearchTextChange: Subject<string> = new Subject<string>();
  accountFilter = {
    search: '',
  };
  constructor(
    private estampService: StampDashboardService,
    private messageService: MessageService,

    private storageService: StorageService,
    private userDashboardService: UserDashboardService,
    private accountManagementService: AccountManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.onSearchTextChange.pipe(debounceTime(1500)).subscribe((value) => {
      this.accountFilter.search = value;
      this.accountFilter = Object.assign({}, this.accountFilter);
      value === ''
        ? this.getAccountDetails()
        : this.getFilteredAccountDetail(this.accountFilter);
    });
    this.account_id = this.storageService.getAccountId() || null;
    this.getStampAvailability(this.account_id);
  }

  ngOnInit() {
    this.getAccountDetails();
  }

  getAccountDetails() {
    this.userDashboardService.getAccountDetail().subscribe((res: any) => {
      this.accounts = res.content;
      this.cdr.detectChanges();
    });
  }

  editAccountDetails(id: any) {
    this.accountManagementService.getAccountDetail(id).subscribe((res: any) => {
      const accountData = res.content[0];
      this.selectedAccount = accountData.id;
      this.accounts.push(accountData);
      this.cdr.detectChanges();
    });
  }

  getFilteredAccountDetail(accountFilter) {
    this.userDashboardService
      .getFilteredAccountDqetail(accountFilter)
      .subscribe((res: any) => {
        this.accounts = res.content;
        this.cdr.detectChanges();
      });
  }

  onChangeAccount() {
    this.getStampAvailability(this.account_id);
  }

  getStampAvailability(id) {
    this.estampService.getStampAvailable(id).subscribe((res) => {
      this.stampInventoryStatusData = res['content'].values;
      this.cdr.detectChanges();
    });
  }
  onAccountFilter(evt) {
    if (evt.filter === null) {
      this.accountFilter.search = '';
      this.onSearchTextChange.next('');
    } else this.onSearchTextChange.next(evt.filter);
  }

  downloadExcel() {
    if (this.stampInventoryStatusData.length != 0) {
      const headers = [
        'State',
        'State Code',
        'Stamp Type',
        'Denomination',
        'Procurement Count',
        'Amount',
        'Consumed',
        'Actual Availability',
        'To be Procured',
      ];
      const jsonData = this.stampInventoryStatusData.map((data) => ({
        State: data.state,
        'State Code': data.state_code || '',
        'Stamp Type': data.type,
        Denomination: data.denomination,
        'Procurement Count': data.procurement,
        Amount: data.amount,
        Consumed: data.consumed,
        'Actual Availability': data.availability,
        'To be Procured': data.to_be_procured,
      }));

      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(jsonData, { header: headers });
      XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(
        new Blob([wbout], { type: 'application/octet-stream' }),
        'Stamp Availability.xlsx'
      );
    }
  }
}
