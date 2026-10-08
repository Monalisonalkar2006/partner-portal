import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ExportExcelService } from 'src/app/services/export-excel.service';
import { PreProcurementService } from 'src/app/services/pre-procurement.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import { Paginator } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { TableColumn } from 'src/app/shared-components/data-table/data-table.component';

@Component({
  selector: 'app-procurement-view',
  templateUrl: './procurement-view.component.html',
  styleUrls: ['./procurement-view.component.scss'],
  standalone: false,
})
export class ProcurementViewComponent implements OnInit {
  readonly columns: TableColumn[] = [
    { field: 'id', header: 'Procurement Id' },
    { field: 'state', header: 'State Name' },
    { field: 'article_code', header: 'Article', fallback: '--' },
    { field: 'first_party_name', header: 'First Party' },
    { field: 'second_party_name', header: 'Second Party' },
    { field: 'denomination', header: 'Denomination' },
    { field: 'no_of_stamps', header: 'No. of Stamps' },
    { field: 'procured_stamps', header: 'Procured Stamps' },
    { field: 'to_be_procured_stamps', header: 'To be procured stamps' },
    { field: 'consumed_stamps', header: 'Consumed Stamps' },
    { field: 'available_stamps', header: 'Available Stamps' },
    { field: 'blocked_stamps', header: 'Blocked Stamp' },
    { field: 'cess', header: 'Cess %' },
    { field: 'balance', header: 'Total Amount' },
    { field: 'stamp_type', header: 'Stamp Type' },
    { field: 'status', header: 'Status' },
    { field: 'remarks', header: 'Description' },
  ];

  states: any;
  selectedState: any;
  amountbalance: string;
  selectedDate: any;
  orderDetails: any = [];
  pageNo: number = 1;
  totalRecords: number = 10;
  displayBranch!: any;
  orderId: any;
  createdOn: any;
  orderFilters = {
    id: null,
    page_number: 1,
    page_size: 10,
  };
  rowsPerPageOptions: number[];
  rowsPerPage: any = 10;
  numberoftables: number;
  @ViewChild('paginatorComponent') paginator: Paginator;
  searchPageNumber: number = 1;
  reviewDetails: any;
  showApproval: boolean = false;
  showMessage: boolean = false;
  userName: any[];
  approverEmail: any;
  approverEmails: string[] = [];
  showApproverEmails: boolean = false;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private exportExcelService: ExportExcelService,
    private activatedRouter: ActivatedRoute,
    private userDashboardService: UserDashboardService,
    private cookieService: CookieService,
    private preProcurementService: PreProcurementService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.activatedRouter.queryParams.subscribe((queryParams) => {
      this.orderId = queryParams?.orderId;
      this.amountbalance = queryParams?.totalAmount;
      this.createdOn = queryParams?.createdOn;
      this.orderFilters['id'] = this.orderId;
    });

    this.displayBranch = this.storageService.getBranch() || null;
  }

  ngOnInit(): void {
    this.getOrderDetails(this.orderFilters);
  }

  gotoDashboard() {
    this.router.navigate(['doqfy/adminDashboard']);
  }

  gotoListing() {
    this.router.navigate(['doqfy/pre-procurement/procurement-listing']);
  }

  getOrderDetails(params) {
    this.preProcurementService.getProcurementById(params).subscribe((res) => {
      this.orderDetails = res['content'];
      this.totalRecords = this.orderDetails.length;
      this.numberoftables = Math.ceil(this.totalRecords / this.rowsPerPage);
      this.userName = this.storageService.getLoginEmail() || null;

      const reviewerData = this.orderDetails[0]?.reviewer_data || [];

      if (reviewerData.length > 0) {
        this.showMessage = true;

        this.approverEmails = reviewerData
          .map((reviewer: any) => reviewer.reviewer)
          .filter((email: string) => !!email);

        this.approverEmail = this.approverEmails[0];
      } else {
        this.showMessage = false;
        this.approverEmails = [];
        this.approverEmail = null;
      }
      const isAnyActionTaken = reviewerData.some(
        (reviewer: any) => reviewer.approved || reviewer.rejected,
      );

      if (isAnyActionTaken) {
        this.showApproval = false;
      } else {
        const isCurrentUserApprover = reviewerData.some(
          (reviewer: any) => reviewer.reviewer === this.userName,
        );

        this.showApproval = isCurrentUserApprover;
      }

      this.cdr.detectChanges();
    });
  }

  export() {
    this.exportExcelService.exportToExcel(
      this.orderDetails,
      'orderDetails',
      'procurement',
    );
  }

  onPageChange(event: any) {
    if (event) {
      this.pageNo = event.first;
      this.orderFilters['page_number'] = event.page + 1;
      this.orderFilters['page_size'] = event.rows;
      this.getOrderDetails(this.orderFilters);
    }
  }
  getSelected() {
    this.cookieService.set('BranchName', this.selectedState);
    this.storageService.setBranch(this.selectedState);
  }

  calculateRowsPerPageOptions() {
    const options = [10, 20, 30, 50, 100];

    // Calculate additional options based on totalRecords
    if (this.totalRecords > 100) {
      options.push(this.totalRecords);
    }
    this.rowsPerPageOptions = options.sort((a, b) => a - b);
  }

  onRowsPerPageChange(rows: number) {
    this.rowsPerPage = rows;
  }

  pageChange(page: number) {
    if (this.paginator) {
      this.paginator.changePage(page - 1);
    }
  }

  approve() {
    const data = {
      bulk_pre_procurement_id: this.orderId,
      reviewer_email: this.orderDetails[0].reviewer_data[0].reviewer,
      action: 'approve',
      comment: '',
    };
    this.preProcurementService.getApproveOrder(data).subscribe((res) => {
      this.messageService.add({
        severity: 'info',
        summary: 'Confirmed',
        detail: 'You have Approved the Order',
      });
      this.getOrderDetails(this.orderFilters);
    });
  }

  reject() {
    const data = {
      bulk_pre_procurement_id: this.orderId,
      reviewer_email: this.orderDetails[0].reviewer_data[0].reviewer,
      action: 'reject',
      comment: '',
    };
    this.preProcurementService.getApproveOrder(data).subscribe((res) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Rejected',
        detail: 'You have rejected the Order',
      });
      this.getOrderDetails(this.orderFilters);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!target.closest('.approver-email-wrapper')) {
      this.showApproverEmails = false;
    }
  }
}
