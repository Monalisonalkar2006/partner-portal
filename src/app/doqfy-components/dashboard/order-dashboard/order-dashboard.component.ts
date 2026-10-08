import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { StorageService } from 'src/app/services/storage.service';
import { StateService } from 'src/app/services/state.service';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import moment from 'moment';
import { MessageService } from 'primeng/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { UserManagementService } from 'src/app/services/user-management.service';
import { UserProfileService } from 'src/app/services/user-profile.service';

@Component({
    selector: 'app-order-dashboard',
    templateUrl: './order-dashboard.component.html',
    styleUrls: ['./order-dashboard.component.scss'],
    standalone: false
})
export class OrderDashboardComponent implements OnInit {
  @ViewChild('calendar') calendar: any;
  @ViewChild('closeOption') closeOption: any;
  @Output() dateChange: EventEmitter<any> = new EventEmitter<[]>();

  branchData: any;
  selectedBranch: any;
  rangeDates: Date;
  selectedDate = new Date();
  totalOrders: number;
  inprogressOrders: number;
  completedOrders: number;
  canceledOrder: number;
  initiatedOrder: number;
  waitingOrder: number;
  totalOrdersPer: number;
  inprogressOrdersPer: number;
  completedOrdersPer: number;
  canceledOrderPer: number;
  incrementValue: boolean = true;
  OrderData: any = {};
  startDate: string = '';
  endDate: string = '';
  maxDate = new Date();
  stateData: any;
  selectedState: any;
  branchId: any;
  defaultBranchData: any;
  modalContent: any;
  orderDetailsData: any;
  accountUserData: any = [];
  selectedAccount: any = 'Select Account';
  defaultAccountId: any;
  userRole: any;
  userId: string;
  userData: any;
  userBranches: any;

  constructor(
    private cookieService: CookieService,
    private stateService: StateService,
    private messageService: MessageService,
    private userDashboardService: UserDashboardService,
    private storageService: StorageService,
    private accountManagementService: AccountManagementService,
    private modalService: NgbModal,
    private userManagementService: UserManagementService,
    private userProfileService: UserProfileService,
    private cdr: ChangeDetectorRef
  ) {
    this.getRefIdConsent();
    this.branchId = this.storageService.getBranchId() || null;
    if (this.branchId) {
      this.getDefaultBranchDetails();
    }
    this.defaultAccountId = this.storageService.getAccountId() || null;
    this.userRole = this.storageService.getRole() || null;
    this.userId = this.storageService.getUserID() || null;
    if (this.userId) {
      this.getUserDetails(this.userId);
    }
  }

  ngOnInit() {
    this.getUserAccountData();
  }

  getUserDetails(id) {
    this.userManagementService.getUsersDetailsById(id).subscribe((res: any) => {
      this.userData = res['content'][0];
      this.userBranches = this.userData.branches;
      this.cdr.detectChanges();
    });
  }

  getDefaultBranchDetails() {
    this.userDashboardService.getBranchList().subscribe((res: any) => {
      this.defaultBranchData = res['content'].filter(
        (element) => element.id === this.branchId
      );
      const account_id = this.storageService.getAccountId() || null;
      this.getStateDetails(account_id);
      this.cdr.detectChanges();
    });
  }

  getStateDetails(account_id: string) {
    this.stateService
      .getStatesWithBranches(account_id)
      .subscribe((res: any) => {
        this.stateData = res['content'];
        let defaultState = this.stateData.filter(
          (element) => element.id === this.defaultBranchData[0].state.id
        );
        this.selectedState = defaultState[0];
        this.storageService.setState(this.selectedState);
        this.getBranchList();
        this.cdr.detectChanges();
      });
  }

  getBranchList() {
    this.branchData = [];
    const account_id = this.storageService.getAccountId() || null;
    this.userDashboardService
      .getBranchListbyStateId(this.selectedState.id, account_id)
      .subscribe((res: any) => {
        this.branchData = res['content'];
        this.branchData = this.branchData.filter((branch) =>
          this.userBranches.includes(branch.id)
        );
        this.branchData = this.branchData.filter(
          (element) => element.is_active === true
        );
        this.storageService.setBranch(this.branchData[0]);
        this.selectedBranch = this.branchData[0];
        let branch: any = this.storageService.getBranch() || null;
        if (branch === null) {
          let defaultBranch = this.branchData.filter(
            (element) => element.id === this.branchId
          );
          this.selectedBranch = defaultBranch[0];
          this.storageService.setBranch(this.selectedBranch);
          this.storageService.setState(this.selectedState);
        }
        if (
          branch !== null &&
          typeof branch === 'object' &&
          this.selectedState.id !== branch.state.id
        ) {
          this.selectedBranch = this.branchData[0];
          this.storageService.setBranch(this.selectedBranch);
          this.storageService.setState(this.selectedState);
        }
        this.cdr.detectChanges();
      });
    this.selectedBranch = this.storageService.getBranch() || null;
  }

  onBranchChange() {
    this.cookieService.set('BranchName', this.selectedBranch);
    this.storageService.setBranch(this.selectedBranch);
    const param =
      '?state_code=' +
      this.selectedState.state_code +
      '&branch_id=' +
      this.selectedBranch.id +
      '&account_id=' +
      this.selectedAccount;
    this.getApiFilter(param);
  }

  onStateChange(content) {
    this.modalContent = content;
    this.storageService.setState(this.selectedState);
    this.getBranchList();
    setTimeout(() => {
      if (this.branchData.length === 0)
        this.openNoBranchDataNotifyModal(content);
    }, 1000);
    const param =
      '?state_code=' +
      this.selectedState.state_code +
      '&account_id=' +
      this.selectedAccount;
    this.getApiFilter(param);
  }

  getOrdersCountForDashboard(id) {
    const param = '?start_date=' + '' + '&end_date=' + '' + '&account_id=' + id;
    const dateData = {
      startDate: '',
      endDate: '',
      state: this.selectedState,
      branch: this.selectedBranch,
      orderData: [],
    };
    this.userDashboardService
      .getOrdersCountForDashboard(param)
      .subscribe((res: any) => {
        this.orderDetailsData = res['content'];
        dateData.orderData = this.orderDetailsData;
        this.dateChange.emit(dateData);
        this.OrderData = res['content'].order;
        this.totalOrders = this.OrderData.total_order.count;
        this.inprogressOrders = this.OrderData.in_progress_order.count;
        this.completedOrders = this.OrderData.complete_order.count;
        this.canceledOrder = this.OrderData.cancel_order.count;
        this.initiatedOrder = this.OrderData.initiated_order.count;
        this.waitingOrder = this.OrderData.waiting_order.count;
        this.totalOrdersPer = this.OrderData.total_order.delta;
        this.inprogressOrdersPer = this.OrderData.in_progress_order.delta;
        this.completedOrdersPer = this.OrderData.complete_order.delta;
        this.canceledOrderPer = this.OrderData.cancel_order.delta;
        this.cdr.detectChanges();
      });
  }

  filterState(startDate: any, endDate: any) {
    if (this.selectedState && this.selectedBranch && this.selectedAccount) {
      const param =
        '?start_date=' +
        startDate +
        '&end_date=' +
        endDate +
        '&state_code=' +
        this.selectedState.state_code +
        '&branch_id=' +
        this.selectedBranch.id +
        '&account_id=' +
        this.selectedAccount;
      this.getApiFilter(param);
    } else {
      const param =
        '?start_date=' +
        startDate +
        '&end_date=' +
        endDate +
        '&account_id=' +
        this.selectedAccount;
      this.getApiFilter(param);
    }
  }

  getApiFilter(param) {
    this.userDashboardService.getFilterOrderDetails(param).subscribe((res) => {
      this.orderDetailsData = res['content'];
      const dateData = {
        startDate: this.startDate,
        endDate: this.endDate,
        state: this.selectedState,
        branch: this.selectedBranch,
        orderData: [],
      };
      dateData.orderData = this.orderDetailsData;
      this.dateChange.emit(dateData);
      this.OrderData = res['content'].order;
      this.totalOrders = this.OrderData.total_order.count;
      this.inprogressOrders = this.OrderData.in_progress_order.count;
      this.completedOrders = this.OrderData.complete_order.count;
      this.canceledOrder = this.OrderData.cancel_order.count;
      this.initiatedOrder = this.OrderData.initiated_order.count;
      this.waitingOrder = this.OrderData.waiting_order.count;
      this.totalOrdersPer = this.OrderData.total_order.delta;
      this.inprogressOrdersPer = this.OrderData.in_progress_order.delta;
      this.completedOrdersPer = this.OrderData.complete_order.delta;
      this.canceledOrderPer = this.OrderData.cancel_order.delta;
      this.cdr.detectChanges();
    });
  }

  onSelect() {
    if (this.rangeDates[1]) {
      this.startDate = moment(this.rangeDates[0]).format('YYYY-MM-DD');
      this.endDate = moment(this.rangeDates[1]).format('YYYY-MM-DD');
      this.calendar.overlayVisible = false;
      this.filterState(this.startDate, this.endDate);
    }
  }

  onDateRangeChange(evt) {
    if (evt === null) {
      this.filterState('', '');
    }
  }

  getRefIdConsent() {
    this.userDashboardService
      .getRefIdConsent('reference_number')
      .subscribe((res: any) => {
        this.storageService.setRefIdConsent(res.content.consent);
      });
  }

  openNoBranchDataNotifyModal(content) {
    this.modalService
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        backdrop: 'static',
        keyboard: false,
      })
      .result.then(
        (result) => { console.log(result); },
        (reason) => { console.log(reason); }
      );
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  getUserAccountData() {
    this.accountManagementService.getAccountPerUser().subscribe((res) => {
      this.accountUserData = res['content'].map(account => ({
        ...account,
        account_display_name: account.active_status === false || account.active_status === 0
          ? `${account.account_name} (Inactive)`
          : account.account_name,
        is_inactive: account.active_status === false || account.active_status === 0
      }));
      this.getOrdersCountForDashboard(this.defaultAccountId);
      this.getAccountDetailsById();
      this.cdr.detectChanges();
    });
  }

  getAccountDetailsById() {
    this.accountManagementService
      .getAccountDetail(this.defaultAccountId)
      .subscribe((res) => {
        const userAccount = res['content'][0];
        const exists = this.accountUserData.some(
          (element) => element.account_id === userAccount.id
        );
        if (!exists) {
          userAccount.id = userAccount.account_id;
          this.accountUserData.push(userAccount);
        }
        this.selectedAccount = userAccount.id;
        this.getSelectedAccount(this.defaultAccountId);
        this.storageService.setVirtualAccountNumber(userAccount.virtual_account_no);
        this.storageService.setIsWallet(userAccount.is_wallet);
        this.storageService.setWalletBank(userAccount.wallet_bank);
        this.cdr.detectChanges();
      });
  }

  onSelectedAccount(event: any): void {
    const selectedAccountData = this.accountUserData.find(
      account => account.account_id === event.value
    );

    if (selectedAccountData && selectedAccountData.is_inactive) {
      this.messageService.add({
        severity: 'error',
        detail: 'This account is inactive and cannot be selected.',
      });
      this.selectedAccount = null;
      return;
    }

    this.stateData = [];
    const account = event.value;

    this.storageService.setAccountId(account);
    this.setUserAccountSetting(account);
    this.getSelectedAccount(account);
    this.filterState(this.startDate, this.endDate);
    this.getStateDetails(account);

    // ✅ Emit account change so HeaderNavComponent can react
    this.userProfileService.emitAccountChange(account);
  }

  getSelectedAccount(id) {
    if (this.selectedState) {
      this.accountManagementService
        .getBranchPerUser(id, this.selectedState.id)
        .subscribe((res) => {
          this.branchData = res['content'];
          this.branchData = this.branchData.filter((branch) =>
            this.userBranches.includes(branch.id)
          );
          this.cdr.detectChanges();
        });
    }
  }

  setUserAccountSetting(account_id) {
    this.userProfileService.getOrderReviewConsent(account_id).subscribe((res) => {
      this.storageService.setEstampDefault(res['content'].estamp_default);
      this.storageService.setEsignDefault(res['content'].esign_default);
      this.storageService.setStampEdit(res['content'].estamp_field_editable);
      this.storageService.setAdharEdit(res['content'].aadhaar_validation);
      this.storageService.setAutoEsignEdit(res['content'].auto_esign);
      this.storageService.setOrderPayment(res['content'].order_payment);
      this.storageService.setDropBoxEnabled(res['content']?.additional_configuration?.drop_box);
      this.storageService.setSyncSecondPartyAndPrice(res['content']?.additional_configuration?.sync_second_party_and_price ?? false);
      this.storageService.setAuthenticationDefault(res['content'].authentication_default);
      this.storageService.setInventoryPayment(res['content'].additional_configuration?.inventory_payment);
      this.storageService.setAbclMidMarket(res['content'].additional_configuration?.abcl_mid_market);
      this.storageService.setUploadDocxFile(res['content'].upload_docx_file);
      const editPdfStatus = !!res['content']?.additional_configuration?.edit_pdf;
      this.storageService.setEditPdf(editPdfStatus);
      this.storageService.setPaymentProviders(res['content'].payment_providers);
    });
  }
}