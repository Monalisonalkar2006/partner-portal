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
  month: string;
  formatted_date: string;
  opening_balance: string;
  consumed_balance: string;
  closing_balance: string;
}

@Component({
    selector: 'app-wallet-opening-closing-balance',
    templateUrl: './wallet-opening-closing-balance.component.html',
    styleUrls: ['./wallet-opening-closing-balance.component.scss'],
    standalone: false
})
export class WalletOpeningClosingBalanceComponent implements OnInit {
  readonly columns: TableColumn[] = [
    { field: 'formatted_date', header: 'Month' },
    { field: 'opening_balance', header: 'Opening Balance' },
    { field: 'consumed_balance', header: 'Consumed Balance' },
    { field: 'closing_balance', header: 'Closing Balance' },
  ];

  walletData: stampDetails [] = [];
  editMode: boolean = false;
  account_id: string;
  accounts: any;
  selectedAccount: string;
  onSearchTextChange: Subject<string> = new Subject<string>();
  accountFilter = {
    "search": ''
  }
  constructor(private estampService: StampDashboardService, private messageService: MessageService,

    private storageService: StorageService,
    private userDashboardService: UserDashboardService,
    private accountManagementService: AccountManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.onSearchTextChange.pipe(debounceTime(1500)).subscribe(value => {
      this.accountFilter.search = value;
      this.accountFilter = Object.assign({}, this.accountFilter)
      value === '' ? this.getAccountDetails() : this.getFilteredAccountDetail(this.accountFilter)
    });
    this.account_id = this.storageService.getAccountId()|| null;
    this.getWalletDetails(this.account_id);
  }

  ngOnInit() {
    this.getAccountDetails();
  }

  getAccountDetails() {
    this.userDashboardService.getAccountDetail().subscribe((res: any) => {
      this.accounts = res.content;
      this.selectedAccount = this.accounts[0].id;
      console.log(this.selectedAccount)
      this.cdr.detectChanges();
    })
  }


  getFilteredAccountDetail(accountFilter) {
    this.userDashboardService.getFilteredAccountDqetail(accountFilter).subscribe((res: any) => {
      this.accounts = res.content
      this.cdr.detectChanges();
    })
  }

  onChangeAccount(event) {
    if (event.value === null) {
      this.getWalletDetails(this.account_id);
    }
    else {
      this.getWalletDetails(event.value)
    }

  }

  getWalletDetails(id) {
    this.estampService.getWalletDetails(id).subscribe(res => {
      this.walletData = res['content'];
      this.cdr.detectChanges();
    })
  }
  onAccountFilter(evt) {

    if (evt.filter === null) {
      this.accountFilter.search = ''
      this.onSearchTextChange.next('')
    }
    else
      this.onSearchTextChange.next(evt.filter)
  }

  downloadExcel() {

    if (this.walletData.length != 0) {
      const headers = [
        "month",
        "opening balance",
        "consumed balance",
        "closing balance"
      ];
      const jsonData = this.walletData.map(data => ({
        "month": data.formatted_date,
        "opening balance": data.opening_balance || '',
        "consumed balance": data.consumed_balance,
        "closing balance": data.closing_balance,
      }));

      const workbook = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(jsonData, { header: headers });
      XLSX.utils.book_append_sheet(workbook, ws, "Sheet1");

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Wallet balance details.xlsx');
    }



  }

}
