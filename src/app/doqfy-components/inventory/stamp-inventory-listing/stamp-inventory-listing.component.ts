import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { EstampService } from '../../../services/estamp.service';
import { debounceTime, Subject } from 'rxjs';
import { UserDashboardService } from '../../../services/user-dashboard.service';
import { GenericHttpService } from 'src/app/services/generic-http.service';
import { Paginator } from 'primeng/paginator';
import { CookieService } from 'ngx-cookie-service';
import { ExportExcelService } from 'src/app/services/export-excel.service';
import { StorageService } from 'src/app/services/storage.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { TableColumn } from 'src/app/shared-components/data-table/data-table.component';

interface ExpireData {
  issued_date: string;
  expire_in_days: number;
}

@Component({
    selector: 'app-stamp-inventory-listing',
    templateUrl: './stamp-inventory-listing.component.html',
    styleUrls: ['./stamp-inventory-listing.component.scss'],
    standalone: false
})
export class StampInventoryListingComponent implements OnInit {
  readonly columns: TableColumn[] = [
    { field: 'certificate_number', header: 'Certificate No' },
    { field: 'order_id', header: 'Order No' },
    { field: 'issued_date', header: 'Issued Date' },
    { field: 'denomination', header: 'Denomination' },
    { field: 'account_name', header: 'Account Name' },
    { field: 'state.state_name', header: 'State' },
    { field: 'article_code', header: 'Article', fallback: '--' },
    {
      field: 'stamp_type',
      header: 'Stamp Type',
      accessorFn: (row) => this.getStampTypeValue(row.stamp_type),
    },
    { field: 'status', header: 'Status' },
    {
      field: 'expire_in_days',
      header: 'Expires in (Days)',
      accessorFn: (row) => (row.expire_in_days !== null ? row.expire_in_days : 'NA'),
    },
    { field: 'action', header: 'Action', toggleable: false },
  ];

  @ViewChild('paginatorComponent') paginator: Paginator;
  searchText = '';
  estampStatus = [
    { name: 'Is Expired', code: 'IS_EXPIRED' },
    { name: 'Is Used', code: 'IS_USED' },
    { name: 'Is Available', code: 'AVAILABLE' },
  ];
  states: any;
  selectedState: any = '';
  stampInventoryData: any = [];
  totalRecords: number = 0;
  estampFilters = {
    state_code: '',
    certificate_number: '',
    page_number: 1,
    page_size: 10,
    article_code: '',
  };
  onSearchTextChange: Subject<string> = new Subject<string>();
  pdfSource: any;
  fileURL: string;
  rowsPerPageOptions: number[];
  rowsPerPage: any = 10;
  pageNo: number = 1;
  searchPageNumber: number = 1;
  numberoftables: number;
  userRole: string;
  articles: any = [];
  selectedArticle: any = '';
  accountUserData: any;
  constructor(
    private router: Router,
    private messageService: MessageService,
    private estampService: EstampService,
    private userDashboardService: UserDashboardService,
    private genericHttpService: GenericHttpService,
    private cookieService: CookieService,
    private exportExcelService: ExportExcelService,
    private storageService: StorageService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private userService: UserProfileService,
    private accountManagementService: AccountManagementService,
    private cdr: ChangeDetectorRef
  ) {
    this.onSearchTextChange.pipe(debounceTime(1500)).subscribe((value) => {
      this.estampFilters['certificate_number'] = value;
      this.getStampInventory();
    });
    this.estampFilters['account_id'] =
      this.storageService.getAccountId() || null;

    this.userRole = this.storageService.getRole() || null;
  }

  ngOnInit() {
    this.getStampInventory();
    this.getStates();
    this.getUserAccountData('');
  }

  gotoDashboard() {
    this.router.navigate(['doqfy/dashboard']);
  }

  export() {
    if (this.estampFilters) {
      this.exportExcelService
        .getStampInventory(this.estampFilters)
        .subscribe((res) => {
          this.exportExcelService.base64ToCSV(res['content'], res['message']);
        });
    }
    this.messageService.add({
      severity: 'success',
      summary: 'File downloaded successfully !',
      icon: 'pi-check-circle',
    });
  }

  onPageChange(event: any) {
    this.pageNo = event.first;
    this.rowsPerPage = event.rows;
    this.estampFilters['page_number'] = event.page + 1;
    this.estampFilters['page_size'] = event.rows;
    this.getStampInventory();
  }

  pageChange(page: number) {
    if (this.paginator) {
      this.paginator.changePage(page - 1);
    }
  }

  getStampInventory() {
    const parms = this.estampFilters;
    this.estampService.getStampInventory(parms).subscribe((resp) => {
      if (resp.status == 200) {
        if (resp.content.length != 0) {
          this.stampInventoryData = resp.content;
          this.totalRecords = resp.pagination.total_records;
          this.searchPageNumber = resp.pagination.page_number;
          this.numberoftables = Math.ceil(this.totalRecords / this.rowsPerPage);
        } else {
          this.stampInventoryData = resp.content;
          this.totalRecords = 10;
        }
      }
      this.cdr.detectChanges();
    });
  }

  getStates() {
    this.genericHttpService.getStates().subscribe((resp) => {
      if (resp.status == 200) {
        this.states = resp.content;
      }
    });
  }

  onSelectedAccount(event) {
    if (event.value !== null) {
      this.estampFilters['account_id'] = event.value;
    } else {
      delete this.estampFilters['account_id'];
    }
    this.getStampInventory();
  }

  onAccountFilter(event) {
    if (event.filter !== null) {
      this.getUserAccountData(event.filter);
    } else {
      this.getUserAccountData('');
    }
  }

  getUserAccountData(searchValue: string) {
    this.accountManagementService
      .getAccountPerUserInventory(searchValue)
      .subscribe((res) => {
        this.accountUserData = res['content'];
      });
  }

  getArticles(state_code?: any) {
    this.userService.getArticles(state_code).subscribe((resp: any) => {
      if (resp.status === 200) {
        this.articles = resp['content'];
      }
    });
  }

  onChangeSearchText(value) {
    this.onSearchTextChange.next(value);
  }

  clearPaginationFilter() {
    this.estampFilters['page_number'] = 1;
    this.estampFilters['page_size'] = 10;
    if (this.stampInventoryData.length != 0) this.paginator.changePage(0);
  }

  onStatusChange(event) {
    if (event.value !== null) {
      this.selectedState === null
        ? (this.estampFilters['state_code'] = '')
        : (this.estampFilters['state_code'] = this.selectedState);
      if (event.value == this.estampStatus[0]['code']) {
        this.estampFilters['is_expired'] = 'True';
        this.estampFilters['is_used'] = 'False';
      } else if (event.value == this.estampStatus[1]['code']) {
        this.estampFilters['is_used'] = 'True';
        this.estampFilters['is_expired'] = 'False';
      }
      if (event.value == this.estampStatus[2]['code']) {
        this.estampFilters['is_used'] = 'False';
        this.estampFilters['is_expired'] = 'False';
      }
    } else {
      delete this.estampFilters['is_used'];
      delete this.estampFilters['is_expired'];
    }

    this.getStampInventory();
  }

  onArticleNumberChange() {
    if (this.selectedArticle !== null) {
      this.estampFilters['article_code'] = this.selectedArticle;
    } else {
      this.estampFilters['article_code'] = '';
    }

    this.getStampInventory();
  }

  onChangeState() {
    if (this.selectedState !== null) {
      this.estampFilters['state_code'] = this.selectedState;
      this.getArticles(this.selectedState);
    } else {
      this.estampFilters['state_code'] = '';
      this.articles = [];
    }
    delete this.estampFilters['article_code'];
    this.getStampInventory();
  }

  getCertificateDetails(stampData, content) {
    let payloadData = {
      certificate_number: [stampData.certificate_number],
      certificate_view: true,
      certificate_id: stampData.id,
    };

    this.estampService.getCertificateDetails(payloadData).subscribe((resp) => {
      if (resp.status == 200) {
        this.stampView(content);
        const byteArray = new Uint8Array(
          atob(resp.content)
            .split('')
            .map((char) => char.charCodeAt(0))
        );
        const file = new Blob([byteArray], { type: 'application/pdf' });
        this.fileURL = URL.createObjectURL(file);
        const sanitizedURL: SafeResourceUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(this.fileURL);
        this.pdfSource = sanitizedURL;
      }
    });
  }

  stampView(content) {
    this.modalService
      .open(content, {
        size: 'lg',
        ariaLabelledBy: 'modal-basic-title',
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        (result) => {
          console.log(result);
        },
        (reason) => {
          console.log(reason);
        }
      );
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  calculateRowsPerPageOptions() {
    const options = [10, 20, 30, 50, 100];

    this.rowsPerPageOptions = options;
  }

  onRowsPerPageChange(rows: number) {
    this.rowsPerPage = rows;
  }

  back() {
    this.userRole === 'CLIENT'
      ? this.router.navigate(['doqfy/dashboard'])
      : this.router.navigate(['doqfy/admin-dashboard']);
  }

  getStampTypeValue(value) {
    if (value === 'PHYSTMAP' || value === 'PHYSTAMP') {
      return 'PHYSTAMP';
    } else if (value === 'ESTAMP') {
      return 'E-Stamp';
    } else if (value === 'ESBTR') {
      return 'eSBTR';
    } else if (value === 'ECHALLAN') {
      return 'eChallan';
    } else if (value === 'PRE_ESTAMP') {
      return 'Pre-Estamp';
    } else if (value === 'TRADITIONAL') {
      return 'Traditional';
    } else {
      return value;
    }
  }
}
