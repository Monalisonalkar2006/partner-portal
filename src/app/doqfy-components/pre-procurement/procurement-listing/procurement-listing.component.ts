import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { PreProcurementService } from 'src/app/services/pre-procurement.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import moment from 'moment';
import { Subject, debounceTime } from 'rxjs';
import { Paginator } from 'primeng/paginator';
import { AccountManagementService } from 'src/app/services/account-management.service';
import {
  ConfirmationService,
  ConfirmEventType,
  MessageService,
} from 'primeng/api';
import { PaymentService } from 'src/app/services/payment.service';
import { StateService } from 'src/app/services/state.service';
import { DatePipe } from '@angular/common';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { TableColumn } from 'src/app/shared-components/data-table/data-table.component';

@Component({
    selector: 'app-procurement-listing',
    templateUrl: './procurement-listing.component.html',
    styleUrls: ['./procurement-listing.component.scss'],
    standalone: false
})
export class ProcurementListingComponent implements OnInit {
  readonly bulkColumns: TableColumn[] = [
    { field: 'order_id', header: 'Id' },
    { field: 'account_name', header: 'Account' },
    { field: 'order_by', header: 'Ordered By' },
    { field: 'order_date', header: 'Ordered Date', pipe: 'date' },
    { field: 'total_balance', header: 'Total Amount' },
    { field: 'status', header: 'Procurement Status' },
    { field: 'action', header: 'Action', toggleable: false },
  ];

  readonly individualColumns: TableColumn[] = [
    { field: 'id', header: 'Id' },
    { field: 'created_date', header: 'Date' },
    { field: 'state', header: 'State Name' },
    { field: 'article_code', header: 'Article', fallback: '--' },
    { field: 'first_party_name', header: 'First Party', fallback: '--' },
    { field: 'denomination', header: 'Denomination' },
    { field: 'no_of_stamps', header: 'No of Stamps' },
    { field: 'procured_stamps', header: 'Procured Stamps' },
    { field: 'to_be_procured_stamps', header: 'To be procured stamps' },
    { field: 'consumed_stamps', header: 'Consumed Stamps' },
    { field: 'available_stamps', header: 'Available Stamps' },
    { field: 'expired_stamps', header: 'Expired Stamps' },
    { field: 'blocked_stamps', header: 'Blocked Stamp' },
    { field: 'cess', header: 'Cess' },
    { field: 'balance', header: 'Total Amount' },
    { field: 'stamp_type', header: 'Stamp Type' },
    { field: 'status', header: 'Status' },
    { field: 'remarks', header: 'Description' },
    { field: 'action', header: 'Action', toggleable: false },
  ];

  readonly summaryColumns: TableColumn[] = [
    { field: 'id', header: 'Id', fallback: '--' },
    { field: 'state', header: 'State', fallback: '--' },
    { field: 'stamp_type', header: 'Stamp Type', fallback: '--' },
    { field: 'denomination', header: 'Denomination', accessorFn: (row) => row?.denomination || '--' },
    { field: 'no_of_stamps', header: 'No of Stamps', accessorFn: (row) => row?.no_of_stamps || '--' },
    { field: 'procured_stamps', header: 'Procured Stamps', accessorFn: (row) => row?.procured_stamps || '--' },
    {
      field: 'to_be_procured_stamps',
      header: 'To be procured stamps',
      accessorFn: (row) => row?.to_be_procured_stamps || '--',
    },
    { field: 'consumed_stamps', header: 'Consumed Stamps', accessorFn: (row) => row?.consumed_stamps || '--' },
    { field: 'available_stamps', header: 'Available Stamps', accessorFn: (row) => row?.available_stamps || '--' },
    { field: 'blocked_stamps', header: 'Blocked Stamp' },
    { field: 'cess', header: 'Cess', accessorFn: (row) => row?.cess || '--' },
    { field: 'balance', header: 'Amount', accessorFn: (row) => row?.balance || '--' },
    { field: 'remarks', header: 'Description', fallback: '--' },
  ];

  @ViewChild('paginatorComponent') paginator: Paginator;
  @ViewChild('individualPaginator') individualPaginator!: Paginator;

  @ViewChild('calendar') calendar: any;
  states: any;
  selectedState: any;
  selectedDate: any;
  orderList: any = [];
  pageNo: number = 1;
  totalRecords: number = 10;
  displayBranch!: any;
  rangeDates: Date | null;
  maxDate = new Date();
  searchText: string = '';
  orderFilters = {
    page_number: 1,
    page_size: 10,
    start_date: '',
    end_date: '',
  };
  preProcurementCount: any;
  onSearchTextChange: Subject<string> = new Subject<string>();
  onIndividualSearchTextChange: Subject<string> = new Subject<string>();
  rowsPerPageOptions: number[];
  rowsPerPage: number = 10;
  searchPageNumber: number = 1;
  numberoftables: number;
  summaryDetails: any = [];
  summaryData: any = [];
  userRole: string;
  account_id: any;
  accountUserData: any;
  selectedAccount: any;
  userName: any;
  isClient: boolean = false;
  procurementbase64String: string = '';
  orderOption = {
    tabIndex: 0,
  };

  readonly procurementTabs = [
    { label: 'Bulk', icon: 'pi pi-copy' },
    { label: 'Individual', icon: 'pi pi-user' },
  ];
  individualProcurementList: any[] = [];
  statusOptions = [
    { name: 'Is Expired', code: 'IS_EXPIRED' },
    { name: 'Is Used', code: 'IS_USED' },
    { name: 'Is Available', code: 'AVAILABLE' },
  ];

  selectedStatus: string = '';
  individualProcurementIdSearch: string = '';
  originalIndividualProcurementList: any[] = [];
  individualPageNo: number = 0;
  individualRowsPerPage: number = 10;
  individualTotalRecords: number = 0;
  individualNumberOfTables: number = 1;
  individualSearchPageNumber: number = 1;
  individualRangeDates: Date[] | null = null;
  individualOrderFilters: any = {};
  orderDetails: any = [];
  start_date_filter: Date;
  end_date_filter: Date;
  isDateRangeValid: boolean = false;

  reportFilters: any = {
    state_code: null,
    st_status: null,
    stamp_procure_start_date: '',
    stamp_procure_end_date: '',
    certificate_number: '',
    pre_procurement_id: '',
  };
  reportProcuredDates: Date[] | null = null;
  showReportDialog: boolean = false;
  reportRangeDates: Date[] | null = null;
  reportStartDate: string = '';
  reportEndDate: string = '';
 selectedReviewer: any;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private userDashboardService: UserDashboardService,
    private accountManagementService: AccountManagementService,
    private cookieService: CookieService,
    private preProcurementService: PreProcurementService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private paymentService: PaymentService,
    private stateService: StateService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private analyticsService: AnalyticsService
  ) {
    this.onSearchTextChange.pipe(debounceTime(1500)).subscribe((value) => {
      this.orderFilters['order_id'] = value;
      this.getDetails(this.orderFilters);
    });

    this.onIndividualSearchTextChange.pipe(debounceTime(1500)).subscribe((value) => {
      this.individualOrderFilters['pre_procurement_id'] = value?.trim() || '';
      this.individualOrderFilters['page_number'] = 1;
      this.individualPageNo = 0;
      this.individualSearchPageNumber = 1;
      this.loadIndividualProcurementDataWithFilters();
    });

    this.userRole = this.storageService.getRole() || null;
    this.account_id = this.storageService.getAccountId() || null;
    this.userName = this.storageService.getLoginEmail() || null;

    this.selectedAccount = this.account_id;
    if (this.account_id) {
      this.orderFilters['account_id'] = this.account_id;
    }
    this.getDetails(this.orderFilters);
    this.getUserAccountData('');
    if (this.userRole === 'CLIENT' || this.userRole === 'BRANCH-ADMIN') {
      this.isClient = true;
    } else {
      this.isClient = false;
    }
  }

  ngOnInit() {
    this.getAccountIdFromLocalStorage();
    this.loadAccountData();
    this.getStates();
    setTimeout(() => {
      if (this.account_id) {
        this.individualOrderFilters = {
          page_number: 1,
          page_size: 10,
          account_id: this.account_id,
        };
        this.loadIndividualProcurementDataWithFilters();
      }
    }, 100);
  }

  // ─── FIX: page number input (enter key) ───────────────────────────────────
  individualPageChange(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > this.individualNumberOfTables) return;
    this.individualSearchPageNumber = pageNumber;
    this.individualPageNo = (pageNumber - 1) * this.individualRowsPerPage;
    this.individualOrderFilters['page_number'] = pageNumber;
    this.individualOrderFilters['page_size'] = this.individualRowsPerPage;
    this.loadIndividualProcurementDataWithFilters();
    if (this.individualPaginator) {
      this.individualPaginator.changePage(pageNumber - 1);
    }
  }

  // ─── FIX: p-paginator page arrow clicks ───────────────────────────────────
  individualOnPageChange(event: any) {
    this.individualPageNo = event.first;
    this.individualRowsPerPage = event.rows;
    const pageNumber = Math.floor(event.first / event.rows) + 1;
    this.individualSearchPageNumber = pageNumber;
    this.individualOrderFilters['page_number'] = pageNumber;
    this.individualOrderFilters['page_size'] = event.rows;
    this.loadIndividualProcurementDataWithFilters();
  }

  // ─── FIX: rows-per-page dropdown change ───────────────────────────────────
  individualOnRowsPerPageChange(rows: number) {
    this.individualRowsPerPage = rows;
  }

  individualDateRangeChange(evt: any) {
    if (evt === null || evt[0] === null) {
      this.individualOrderFilters['start_date'] = '';
      this.individualOrderFilters['end_date'] = '';
      this.isDateRangeValid = false;
    } else {
      this.individualOrderFilters['start_date'] = this.formatDateLocal(evt[0]);
      this.individualOrderFilters['end_date'] = evt[1]
        ? this.formatDateLocal(evt[1])
        : this.formatDateLocal(evt[0]);
      if (this.individualOrderFilters['start_date'] && this.individualOrderFilters['end_date']) {
        const start = new Date(this.individualOrderFilters['start_date']);
        const end = new Date(this.individualOrderFilters['end_date']);
        this.start_date_filter = start;
        this.end_date_filter = end;

        const timeDiff = Math.abs(end.getTime() - start.getTime());
        const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        this.isDateRangeValid = dayDiff <= 31;
      } else {
        this.isDateRangeValid = false;
      }
    }

    this.individualOrderFilters['page_number'] = 1;
    this.individualPageNo = 0;
    this.individualSearchPageNumber = 1;
    this.loadIndividualProcurementDataWithFilters();
  }

  formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadIndividualProcurementDataWithFilters() {
    if (!this.individualOrderFilters?.account_id) {
      return;
    }
    const simpleParams: any = {
      page_number: this.individualOrderFilters.page_number || 1,
      page_size: this.individualRowsPerPage,
      account_id: this.individualOrderFilters.account_id,
    };

    if (this.selectedState) {
      simpleParams.state_code = this.selectedState;
    }

    if (this.individualOrderFilters.start_date) {
      simpleParams.start_date = this.individualOrderFilters.start_date;
    }
    if (this.individualOrderFilters.end_date) {
      simpleParams.end_date = this.individualOrderFilters.end_date;
    }
    if (this.individualOrderFilters.pre_procurement_id?.trim()) {
      simpleParams.pre_procurement_id = this.individualOrderFilters.pre_procurement_id.trim();
    }
    if (this.selectedStatus) {
      simpleParams.status = this.selectedStatus;
    }

    this.paymentService.getProcurementById(simpleParams).subscribe({
      next: (response: any) => {
        this.individualProcurementList = response.content || [];
        this.individualTotalRecords =
          response.pagination?.total_records ?? this.individualProcurementList.length;
        this.individualNumberOfTables = Math.ceil(
          this.individualTotalRecords / this.individualRowsPerPage,
        );
        this.originalIndividualProcurementList = this.individualProcurementList;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.individualProcurementList = [];
        this.originalIndividualProcurementList = [];
        this.cdr.detectChanges();
      },
    });
  }

  onIndividualProcurementSearch(searchText: string) {
    this.individualProcurementIdSearch = searchText;
    this.onIndividualSearchTextChange.next(searchText);
  }

  getStates() {
    this.stateService.getState().subscribe((res: any) => {
      this.states = res['content'];
    });
  }

  onStateChange(event: any) {
    this.selectedState = event.value;
    this.individualOrderFilters['state_code'] = this.selectedState || '';
    this.individualOrderFilters['page_number'] = 1;
    this.individualPageNo = 0;
    this.individualSearchPageNumber = 1;
    this.loadIndividualProcurementDataWithFilters();
  }

  onStatusChange(event: any) {
    this.selectedStatus = event.value;
    this.individualPageNo = 0;
    this.individualSearchPageNumber = 1;
    this.individualOrderFilters['page_number'] = 1;
    this.loadIndividualProcurementDataWithFilters();
  }

  loadAccountData() {
    this.getUserAccountData('');
  }

  getAccountIdFromLocalStorage() {
    const storedAccountId = localStorage.getItem('account_id');
    this.account_id = storedAccountId ? +storedAccountId : null;
    if (this.account_id) {
      this.selectedAccount = this.account_id;
      this.orderFilters['account_id'] = this.account_id;
    }
  }

  loadIndividualProcurementData() {
    if (!this.orderFilters['account_id']) return;

    this.paymentService
      .getProcurementById(this.orderFilters['account_id'])
      .subscribe({
        next: (response: any) => {
          this.originalIndividualProcurementList = (
            response.content || []
          ).reverse();
          this.individualTotalRecords =
            this.originalIndividualProcurementList.length;
          this.clearIndividualFilters();
        },
        error: (error) => {
          console.error('Error loading procurement data:', error);
          this.individualProcurementList = [];
          this.originalIndividualProcurementList = [];
        },
      });
  }

  clearIndividualFilters() {
    this.individualProcurementIdSearch = '';
    this.selectedStatus = null;
    this.individualRangeDates = null;
    this.individualPageNo = 0;
    this.individualSearchPageNumber = 1;
  }

  export() {
    const params: any = {};

    if (this.individualOrderFilters.account_id) {
      params.account_id = this.individualOrderFilters.account_id;
    }
    if (this.selectedState) {
      params.state_code = this.selectedState;
    }
    if (this.individualOrderFilters.start_date) {
      params.start_date = this.individualOrderFilters.start_date;
    }
    if (this.individualOrderFilters.end_date) {
      params.end_date = this.individualOrderFilters.end_date;
    }

    this.paymentService.getProcurementDetailsReport(params).subscribe((resp: any) => {
      const csvContent = atob(resp.content);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'individual_procurement_report.csv';
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    });
  }

  exportIndividualProcurement(item: any) {
    const preProcurementId = item.id;

    if (preProcurementId == null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Export failed',
        detail: 'Unable to identify the pre-procurement record for this report.',
      });
      return;
    }

    const data = {
      pre_procurement_id: preProcurementId,
    };

    this.preProcurementService
      .ExportProcurmentReport(data)
      .subscribe({
        next: (resp: any) => {
          if (!resp?.content) {
            this.messageService.add({
              severity: 'error',
              summary: 'Export failed',
              detail: 'The procurement report was empty and could not be downloaded.',
            });
            return;
          }

          this.procurementbase64String = resp.content;
          this.exportProcurementExcel(preProcurementId);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Export failed',
            detail: 'Unable to download the procurement report. Please try again.',
          });
        },
      });
  }

  onChangeTab(event: any) {
    const eventName = event.index === 0 
    ? 'click_bulk_preprocurement' 
    : 'click_individual_preprocurement';

    const clickedLabel = this.procurementTabs[event.index]?.label;

    this.analyticsService.trackEvent(eventName, {
      tab_label: clickedLabel,
      tab_index: event.index
    });

    this.orderOption.tabIndex = event.index;
    this.isDateRangeValid = false;
  }

  gotoDashboard() {
    this.router.navigate(['doqfy/adminDashboard']);
  }

  getDetails(parms: any) {
    this.preProcurementService.getProcurmentDetails(parms).subscribe((res) => {
      this.orderList = res['content'];
      this.totalRecords = res.pagination.total_records;
      this.searchPageNumber = res.pagination.page_number;
      this.numberoftables = Math.ceil(this.totalRecords / this.rowsPerPage);
      this.cdr.detectChanges();
    });
  }

  viewDetails(order: any ) {
    this.analyticsService.trackEvent('click_view_order_preprocurement', {
      order_id: order.order_id || order.id,
      account_name: order.account_name || order.account,
      status: order.status
    });

    this.router.navigate(['/doqfy/pre-procurement/procurement-view'], {
      queryParams: {
        orderId: order.order_id,
        totalAmount: order.total_balance,
        createdOn: order.order_date,
      },
    });
  }

  onPageChange(event: any) {
    if (event) {
      this.pageNo = event.first;
      this.orderFilters['page_number'] = event.page + 1;
      this.orderFilters['page_size'] = event.rows;
      this.getDetails(this.orderFilters);
    }
    this.rowsPerPage = event.rows;
  }

  pageChange(page: number) {
    if (this.paginator) {
      this.paginator.changePage(page - 1);
    }
  }

  onSelect() {
    if (this.rangeDates[1]) {
      this.orderFilters['start_date'] = moment(this.rangeDates[0]).format(
        'YYYY-MM-DD',
      );
      this.orderFilters['end_date'] = moment(this.rangeDates[1]).format(
        'YYYY-MM-DD',
      );
      if (this.orderFilters['start_date'] && this.orderFilters['end_date']) {
        const start = new Date(this.orderFilters['start_date']);
        const end = new Date(this.orderFilters['end_date']);
        this.start_date_filter = start;
        this.end_date_filter = end;

        const timeDiff = Math.abs(end.getTime() - start.getTime());
        const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        this.isDateRangeValid = dayDiff <= 31;
      } else {
        this.isDateRangeValid = false;
      }
      this.calendar.overlayVisible = false;
      this.getDetails(this.orderFilters);
    }
  }

  onChangeSearchText(value) {
    this.searchText = value.toString();
    this.onSearchTextChange.next(value);
  }

  onDateRangeChange(evt) {
    if (evt === null) {
      this.orderFilters['start_date'] = '';
      this.orderFilters['end_date'] = '';
      this.getDetails(this.orderFilters);
    }
  }

  calculateRowsPerPageOptions() {
    const options = [10, 20, 30, 50, 100];
    if (this.totalRecords > 100) {
      options.push(this.totalRecords);
    }
    this.rowsPerPageOptions = options.sort((a, b) => a - b);
  }

  onRowsPerPageChange(rows: number) {
    this.rowsPerPage = rows;
  }

  getProcurmentSummary(data: any) {
    this.orderFilters['id'] = data.order_id;
    this.summaryData = data;
    this.preProcurementService
      .getProcurementById(this.orderFilters)
      .subscribe((res) => {
        this.summaryDetails = res['content'];
     
       if (this.summaryDetails && this.summaryDetails.length > 0) {
        const order = this.summaryDetails[0];

        this.analyticsService.trackEvent('click_view_order_preprocurement', {
          order_id: this.summaryData.order_id, 
          account_name: order.account_name || order.account,
          status: order.status
        });
      }

        this.summaryDetails.forEach((element) => {
          const statusValue = {
            initiated: 0,
            waiting_for_stamp: 0,
            completed: 0,
          };
          if (element.status === undefined) {
            element.status = statusValue;
          }
        });
      });
    this.getPreProcurmentCount();
  }

  back() {
    this.userRole === 'CLIENT'
      ? this.router.navigate(['doqfy/dashboard'])
      : this.router.navigate(['doqfy/admin-dashboard']);
  }

  onSelectedAccount(event: any) {
    if (event.value !== null) {
      this.orderFilters['account_id'] = event.value;
      this.selectedAccount = event.value;
    } else {
      this.selectedAccount = this.account_id;
      this.orderFilters['account_id'] = this.account_id;
    }
    this.getDetails(this.orderFilters);
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

  // approveOrderStatus(order) {
  //   console.log('order', order);

  //   const reviewerEmail = order.reviewer_info[0].reviewer;
  //   const isApproved = order.reviewer_info[0].approved;
  //   const isRejected = order.reviewer_info[0].rejected;
  //   const reviewComment = order.reviewer_info[0].comment;

  //   if (isApproved) {
  //     this.messageService.add({
  //       severity: 'info',
  //       summary: 'Approved',
  //       detail: `Already Approved By ${reviewerEmail}`,
  //     });
  //     return;
  //   }

  //   if (isRejected) {
  //     this.messageService.add({
  //       severity: 'info',
  //       summary: 'Rejected',
  //       detail: `Already Rejected By ${reviewerEmail}`,
  //     });
  //     return;
  //   }

  //   if (this.userName === reviewerEmail) {
  //     if (!isApproved && !isRejected) {
  //       this.confirm1(order);
  //     }
  //   } else {
  //     this.messageService.add({
  //       severity: 'info',
  //       summary: 'Reviewer',
  //       detail: `Need to be Approved By ${reviewerEmail}`,
  //     });
  //   }
  // }



  approveOrderStatus(order) {
  const currentReviewer = order.reviewer_info.find(
    (reviewer: any) => reviewer.reviewer === this.userName
  );
  const approvedReviewer = order.reviewer_info.find(
  (reviewer: any) => reviewer.approved === true
);

if (approvedReviewer) {
  this.messageService.add({
    severity: 'info',
    summary: 'Already Approved',
    detail: `${approvedReviewer.reviewer} approved this order`,
  });
  return;
}
  this.selectedReviewer = currentReviewer;

  if (!currentReviewer) {
    this.messageService.add({
      severity: 'info',
      summary: 'Reviewer',
      detail: 'You are not assigned as reviewer for this order',
    });
    return;
  }

  const reviewerEmail = currentReviewer.reviewer;
  const isApproved = currentReviewer.approved;
  const isRejected = currentReviewer.rejected;
  const reviewComment = currentReviewer.comment;

  if (isApproved) {
    this.messageService.add({
      severity: 'info',
      summary: 'Approved',
      detail: `Already Approved By ${reviewerEmail}`,
    });
    return;
  }

  if (isRejected) {
    this.messageService.add({
      severity: 'info',
      summary: 'Rejected',
      detail: `Already Rejected By ${reviewerEmail}`,
    });
    return;
  }

  this.confirm1(order);
}

  confirm1(order) {
    this.confirmationService.confirm({
      message: 'Do you want to Approve the Pre-procurement Order ?',
      header: 'Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.approveOrder(order);
      },
      reject: (type) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.rejectOrder(order);
            break;
          case ConfirmEventType.CANCEL:
            break;
        }
      },
    });
  }

  approveOrder(order) {
    const data = {
      bulk_pre_procurement_id: order.order_id,
      reviewer_email: this.selectedReviewer.reviewer,
      action: 'approve',
      comment: '',
    };
    this.preProcurementService.getApproveOrder(data).subscribe((res) => {
      this.messageService.add({
        severity: 'info',
        summary: 'Confirmed',
        detail: 'You have Approved the Order',
      });
      this.getDetails(this.orderFilters);
    });
  }

  rejectOrder(order) {
    const data = {
      bulk_pre_procurement_id: order.order_id,
      reviewer_email: this.selectedReviewer.reviewer,
      action: 'reject',
      comment: '',
    };
    this.preProcurementService.getApproveOrder(data).subscribe((res) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Rejected',
        detail: 'You have rejected the Order',
      });
      this.getDetails(this.orderFilters);
    });
  }

  getPreProcurmentCount() {
    this.preProcurementService
      .getPreProcurmentCount({
        bulk_pre_procurement_id: this.summaryData.order_id,
      })
      .subscribe((resp: any) => {
        this.preProcurementCount = resp.content;
      });
  }

  exportProcurmentReport(order) {
    this.analyticsService.trackEvent('click_download_preprocurement_report', {
    order_id: order.order_id,
    account_name: order.account_name,
    status: order.status
  });

    const data = {
      bulk_pre_procurement_id: order.order_id,
    };

    this.preProcurementService
      .ExportProcurmentReport(data)
      .subscribe({
        next: (resp: any) => {
          if (!resp?.content) {
            this.messageService.add({
              severity: 'error',
              summary: 'Export failed',
              detail: 'The procurement report was empty and could not be downloaded.',
            });
            return;
          }

          this.procurementbase64String = resp.content;
          this.exportProcurementExcel(order.order_id);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Export failed',
            detail: 'Unable to download the procurement report. Please try again.',
          });
        },
      });
  }

  getSelectedOrderCsv() {
    const data = {
      start_date: this.datePipe.transform(this.start_date_filter, 'yyyy-MM-dd'),
      end_date: this.datePipe.transform(this.end_date_filter, 'yyyy-MM-dd'),
    };
    this.preProcurementService
      .ExportProcurmentReport(data)
      .subscribe((resp: any) => {
        this.procurementbase64String = resp.content;
        this.exportProcurementExcel(`from ${data.start_date} to ${data.end_date}`);
        this.individualRangeDates = null;
        this.rangeDates = null;
        this.isDateRangeValid = false;
      });
  }

  openReportModal() {
    const modalEl = document.getElementById('reportModal');
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }

  closeReportModal() {
    const modalEl = document.getElementById('reportModal');
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    this.resetReportForm();
  }

  resetReportForm() {
    this.reportFilters = {
      state_code: null,
      st_status: null,
      stamp_procure_start_date: '',
      stamp_procure_end_date: '',
      certificate_number: '',
      pre_procurement_id: '',
    };
    this.reportProcuredDates = null;
  }

  onReportProcuredDateChange(evt: Date[] | null) {
    if (!evt || !evt[0]) {
      this.reportFilters.stamp_procure_start_date = '';
      this.reportFilters.stamp_procure_end_date = '';
    } else {
      this.reportFilters.stamp_procure_start_date = this.formatDateLocal(evt[0]);
      this.reportFilters.stamp_procure_end_date = evt[1]
        ? this.formatDateLocal(evt[1])
        : this.formatDateLocal(evt[0]);
    }
  }

  downloadProcurementReport() {
    if (!this.reportFilters.state_code) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please select a State.' });
      return;
    }
    if (!this.reportFilters.stamp_procure_start_date || !this.reportFilters.stamp_procure_end_date) {
      this.messageService.add({ severity: 'warn', summary: 'Required', detail: 'Please select a Procured Date Range.' });
      return;
    }

    const params: any = {};
    if (this.reportFilters.state_code) params.state_code = this.reportFilters.state_code;
    if (this.reportFilters.st_status) {
      const statusMap: Record<string, string> = {
        IS_USED: 'consumed',
        AVAILABLE: 'available',
        IS_EXPIRED: 'expired',
      };
      params.st_status = statusMap[this.reportFilters.st_status] ?? this.reportFilters.st_status;
    }
    if (this.reportFilters.stamp_procure_start_date) params.stamp_procure_start_date = this.reportFilters.stamp_procure_start_date;
    if (this.reportFilters.stamp_procure_end_date) params.stamp_procure_end_date = this.reportFilters.stamp_procure_end_date;
    if (this.reportFilters.certificate_number?.trim()) params.certificate_number = this.reportFilters.certificate_number.trim();
    if (this.reportFilters.pre_procurement_id?.trim()) params.pre_procurement_id = this.reportFilters.pre_procurement_id.trim();

    this.preProcurementService.ExportProcurmentReport(params).subscribe((resp: any) => {
      this.procurementbase64String = resp.content;
      this.exportProcurementExcel('procurement_report');
      this.closeReportModal();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Procurement report downloaded successfully',
      });
    });
  }

  exportProcurementExcel(id) {
    const fileName = `pre_procurement_report_${id}.xlsx`;
    const byteCharacters = atob(this.procurementbase64String);
    const byteNumbers = new Array(byteCharacters.length)
      .fill(0)
      .map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const fileData: Blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    const blobUrl = window.URL.createObjectURL(fileData);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(blobUrl);
  }

  openReportDialog() {
    this.showReportDialog = true;
  }

  closeReportDialog() {
    this.showReportDialog = false;
    this.reportFilters = {
      pre_procurement_id: '',
      certificate_number: '',
      state_code: null,
      st_status: null,
    };
    this.reportRangeDates = null;
    this.reportStartDate = '';
    this.reportEndDate = '';
  }

  onReportDateRangeChange(evt: any) {
    if (!evt || evt[0] === null) {
      this.reportStartDate = '';
      this.reportEndDate = '';
    } else {
      this.reportStartDate = this.formatDateLocal(evt[0]);
      this.reportEndDate = evt[1] ? this.formatDateLocal(evt[1]) : this.formatDateLocal(evt[0]);
    }
  }

  openBulkUpload(): void {
  this.router.navigate(['/doqfy/pre-procurement/bulk-upload']);
}

}