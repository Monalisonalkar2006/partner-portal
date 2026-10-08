import { Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { OrderService } from 'src/app/services/order.service';
import { StorageService } from 'src/app/services/storage.service';
import { WalletService } from 'src/app/services/wallet.service';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { combineLatest, timer } from 'rxjs';
import { timeout, finalize, take } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-side-nav',
  templateUrl: './admin-side-nav.component.html',
  styleUrls: ['./admin-side-nav.component.scss'],
  standalone: false,
})
export class AdminSideNavComponent implements OnInit {
  accountId: any = '';
  today = new Date();
  currentBalance: number = 0;
  displayBalance!: any;
  tempBalance: any;
  accountNo: any;
  exactbalance: string = Number(this.currentBalance).toLocaleString();
  pendingOrderDetils: any;
  userName: string;
  totalRecords: number = 0;
  role: string;
  orderFilters: any = {};
  showRow: boolean = false;
  tabIndex: number = 0;
  inventoryBalance: any = 0;
  remInventoryBalance: any = 0;
  is_wallet: boolean = false;
  is_inventory: boolean = false;
  userAccount: any;
  justCopiedIfsc = false;
  justCopiedAccount = false;
  showAccountNumber = false;
  ifscCode: any = '';
  walletForm: FormGroup;
  showWalletModal: boolean = false;
  loading: boolean = false;
  isRefreshing = false;
  showAddMoney: boolean = false;
  private paymentCheckInterval: any;

  private profileName: string = '';
  private profileEmail: string = '';
  private profileContact: string = '';

  constructor(
    private orderService: OrderService,
    private router: Router,
    private renderer: Renderer2,
    private cookieService: CookieService,
    private storageService: StorageService,
    private walletService: WalletService,
    private accountManagementService: AccountManagementService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private userProfileService: UserProfileService
  ) {
    this.userName = this.storageService.getUser() || 'User';
    this.role = this.storageService.getRole() || null;
    this.getRecentActivity();
    this.accountId = this.storageService.getAccountId();
    this.is_wallet = this.storageService.getIsWallet();

    this.walletForm = this.fb.group({
      name: ['', [Validators.maxLength(50)]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      amount: ['', [Validators.required, Validators.min(1), Validators.max(100000000)]],
    });
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.showRow = window.innerWidth >= 400 && window.innerWidth < 985;
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.storageService.accountId$.subscribe((id) => {
      this.accountId = id;
      if (id) {
        this.getBalance(this.accountId);
        this.getAccountDetailsById();
        this.loadAddMoneyVisibility(id);
      }
    });
  }
  loadUserProfile(): void {
    this.userProfileService.getUserDetail().subscribe({
      next: (res: any) => {
        const detail = res['content'];
        this.profileName = `${detail.first_name || ''} ${detail.last_name || ''}`.trim();
        this.profileEmail = detail.email || '';
        this.profileContact = detail.contact_number || '';
        this.walletForm.patchValue({
          name: this.profileName,
          email: this.profileEmail,
          phone: this.profileContact,
        });
      },
      error: (err) => {
        console.error('Error loading user profile for wallet form:', err);
      },
    });
  }

  loadAddMoneyVisibility(accountId: string): void {
    this.userProfileService.getOrderReviewConsent(accountId).subscribe({
      next: (res: any) => {
        const config = res?.['content']?.additional_configuration;
        // to_show_add_money moved from additional_configuration.edit_cancel_reinitiate_esign
        // up to additional_configuration. Read the new location first and fall back to the
        // old one so the portal works against both API versions during rollout.
        const flag =
          config?.to_show_add_money ??
          config?.edit_cancel_reinitiate_esign?.to_show_add_money;

        this.showAddMoney = this.canShowAddMoney(flag);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading account settings for Add Money:', err);
        this.showAddMoney = false;
      },
    });
  }

  /**
   * to_show_add_money arrives either as a plain boolean feature flag (matching the other
   * top-level additional_configuration flags such as drop_box and edit_pdf) or as an array
   * of roles permitted to top up the wallet. Anything else hides the button.
   */
  private canShowAddMoney(flag: unknown): boolean {
    if (typeof flag === 'boolean') {
      return flag;
    }
    if (Array.isArray(flag)) {
      const currentRole = (this.role ?? '').trim().toLowerCase();
      return (
        !!currentRole &&
        flag.some(
          (allowedRole) =>
            String(allowedRole).trim().toLowerCase() === currentRole,
        )
      );
    }
    return false;
  }

  getAccountDetailsById() {
    this.accountManagementService
      .getAccountDetail(this.accountId)
      .subscribe((res) => {
        this.userAccount = res['content'][0];
        if (this.userAccount) {
          this.loadTransactionHeaderDetails(
            this.userAccount.virtual_account_no,
          );
        }
        this.storageService.setVirtualAccountNumber(
          this.userAccount.virtual_account_no,
        );
        this.storageService.setIsWallet(this.userAccount.is_wallet);
        this.is_wallet = this.userAccount.is_wallet;
        this.showAccountNumber = true;
        this.storageService.setWalletBank(this.userAccount.wallet_bank);
      });
  }
  loadTransactionHeaderDetails(virtual_account_no) {
    if (virtual_account_no) {

      this.walletService.getWalletClientDetails(virtual_account_no).subscribe(
        (data) => {
          this.displayBalance = data.content.current_balance;
          this.tempBalance = data.content.balance;
          this.accountNo = data.content.virtual_account_no;
          this.storageService.setWalletBalance(data.content.balance);
          this.showAccountNumber = true;
          this.is_inventory = true;
          this.ifscCode = data.content.ifsc;
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error loading transactions:', error);
        },
      );
    } else {
      this.displayBalance = this.userAccount.current_balance;
      this.tempBalance = this.userAccount.balance;
      this.is_inventory = false;
      this.storageService.setWalletBalance(0);
      this.cdr.detectChanges();
    }
  }

  refreshBalance(): void {
    if (this.isRefreshing || !this.userAccount?.virtual_account_no) return;

    this.isRefreshing = true;
    this.cdr.detectChanges();
    this.loading = false;
    this.walletForm.patchValue({
      name: this.profileName,
      email: this.profileEmail,
      phone: this.profileContact,
      amount: '',
    });
    this.walletForm.markAsUntouched();
    this.walletForm.markAsPristine();
    combineLatest([
      this.walletService
        .getWalletClientDetails(this.userAccount.virtual_account_no)
        .pipe(timeout(10000)),
      timer(700),
    ])
      .pipe(
        take(1),
        finalize(() => {
          this.isRefreshing = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: ([data]) => {
          this.displayBalance = data.content.current_balance;
          this.accountNo = data.content.virtual_account_no;
          this.storageService.setWalletBalance(data.content.current_balance);
        },
        error: (error) => {
          console.error('Error refreshing balance:', error);
        },
      });
  }

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent) {
    if (event.key === 'doqfy_payment_update') {
      this.closePaymentProcessing();
    }
  }

  closePaymentProcessing() {
    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
    }

    this.loading = false;
    this.showWalletModal = false;
    this.walletForm.patchValue({
      name: this.profileName,
      email: this.profileEmail,
      phone: this.profileContact,
      amount: '',
    });
    this.walletForm.markAsUntouched();
    this.walletForm.markAsPristine();
    this.refreshBalance();
    this.cdr.detectChanges();
  }

  get amountInWords(): string {
    const amount = this.walletForm.get('amount')?.value;
    if (!amount || amount <= 0) return '';
    if (amount > 100000000) return 'Amount exceeds the maximum limit.';
    return this.convertToIndianWords(amount);
  }

  onPayNow() {
    if (this.walletForm.invalid) {
      this.walletForm.markAllAsTouched();
      this.showValidationErrors();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const formVal = this.walletForm.value;
    const payload = {
      amount: formVal.amount.toString(),
      customer_id: this.userAccount.virtual_account_no,
      customer_email: formVal.email,
      customer_phone: formVal.phone,
    };

    this.walletService.createPaymentOrder(payload).subscribe({
      next: (res: any) => {
        if (res?.content?.payment_url) {
          const paymentWindow = window.open(res.content.payment_url, '_blank');

          if (paymentWindow) {
            this.paymentCheckInterval = setInterval(() => {
              if (paymentWindow.closed) {
                this.closePaymentProcessing();
              }
            }, 500);
          } else {
            this.closePaymentProcessing();
            console.warn('Popup blocked by browser.');
          }
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Payment Error:', err);
      },
    });
  }

  private showValidationErrors() {
    const controls = this.walletForm.controls;

    // if (controls['name'].errors) {
    //   const msg = controls['name'].errors['maxlength'] ? 'Name cannot exceed 50 characters.' : 'Name is required.';
    //   this.messageService.add({ severity: 'error', summary: 'Invalid Name', detail: msg });
    // }
    // if (controls['email'].errors) {
    //   this.messageService.add({ severity: 'error', summary: 'Invalid Email', detail: 'Please enter a valid email address.' });
    // }
    // if (controls['phone'].errors) {
    //   const msg = controls['phone'].errors['pattern'] ? 'Phone number must be exactly 10 digits.' : 'Phone number is required.';
    //   this.messageService.add({ severity: 'error', summary: 'Invalid Phone', detail: msg });
    // }
    if (controls['amount'].errors) {
      let msg = 'Amount is required.';
      if (controls['amount'].errors['max']) msg = 'Maximum amount allowed is ₹100,000,000.';
      if (controls['amount'].errors['min']) msg = 'Minimum amount allowed is ₹1.';
      this.messageService.add({ severity: 'error', summary: 'Invalid Amount', detail: msg });
    }
  }

  private convertToIndianWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
    };

    return convert(num).trim() + ' Rupees Only';
  }

  getRecentActivity() {
    const status = [
      'IN_PROGRESS',
      'WAITING_FOR_STAMP',
      'INITIATED',
      'WAITING_FOR_PAYMENT',
      'WAITING_FOR_APPROVAL',
    ];
    this.orderFilters['status'] = status;
    //this.orderFilters["action_type"] = 'individual';
    this.orderService.getOrders(this.orderFilters).subscribe((resp) => {
      if (resp.status == 200) {
        if (Object.keys(resp.content).length > 0) {
          this.pendingOrderDetils = resp.content;
          this.pendingOrderDetils.forEach((element) => {
            element.status === 'Waiting for Approval'
              ? (element.status = 'Approval Pending')
              : null;
          });
          this.totalRecords = resp.pagination.total_records;
        } else {
          this.pendingOrderDetils = [];
          this.totalRecords = 0;
        }
      }
      this.cdr.detectChanges();
    });
  }

  getOrderType(orderType, order) {
    if (orderType === null) {
      this.orderService.orderType = 'Individual';
    } else {
      this.orderService.orderType = 'Bulk';
    }
    this.gotoOrders(order);
  }

  gotoOrders(order) {
    var status = '';
    var serviceType = '';

    switch (order.status) {
      case 'Initiated':
        status = 'INITIATED';
        break;
      case 'Wating for Approval':
        status = 'WAITING_FOR_APPROVAL';
        break;
      case 'Approval Pending':
        status = 'WAITING_FOR_APPROVAL';
        break;
      case 'Waiting For Stamp':
        status = 'WAITING_FOR_STAMP';
        break;
      case 'Waiting For Payment':
        status = 'WAITING_FOR_PAYMENT';
        break;
      case 'In Progress':
        status = 'IN_PROGRESS';
        break;
      case 'Completed':
        status = 'COMPLETED';
        break;
      case 'Cancelled':
        status = 'CANCELLED';
        break;
      case 'Draft':
        status = 'DRAFT';
        break;
    }
    switch (order.order_type) {
      case 'Estamp':
        serviceType = 'ESTAMP';
        break;
      case 'ESIGN':
        serviceType = 'Esign';
        break;
      case 'Cat Upload':
        serviceType = 'CAT_UPLOAD';
        break;
      case 'Cat Edit':
        serviceType = 'CAT_EDIT';
        break;
    }
    let id;
    this.orderService.orderType === 'Individual'
      ? (id = order.id)
      : (id = order.bulk_order);
    this.router.navigate(['/doqfy/orders/orders-list'], {
      queryParams: {
        orderStatus: [status],
        serviceType: serviceType,
        branch: order.branch,
        id: id,
        createdOn: order.created,
      },
    });
  }

  navigateTo(route: string) {
    this.router.navigate([`doqfy/${route}`]);
  }

  formatNumber(number: number) {
    if (number >= 10000000) {
      return (number / 10000000).toFixed(1) + 'Cr';
    } else if (number >= 100000) {
      return (number / 100000).toFixed(1) + 'L';
    } else {
      return Number(number).toLocaleString();
    }
  }

  getBalance(id) {
    this.orderService.getBalance(id).subscribe((resp) => {
      if (resp.status == 200) {
        const rawBalance = resp.content.balance;
        this.inventoryBalance =
          rawBalance === 'N/A' ? 0 : resp.content.inventory_balance;
        this.displayBalance =
          rawBalance === 'N/A' ? 0 : resp.content.current_balance;
        this.remInventoryBalance =
          rawBalance === 'N/A' ? 0 : resp.content.remaining_inventory_balance;
        this.cdr.detectChanges();
      }
    });
  }

  gotoOrderListing() {
    const status = [
      'IN_PROGRESS',
      'WAITING_FOR_STAMP',
      'INITIATED',
      'WAITING_FOR_PAYMENT',
    ];
    this.router.navigate(['/doqfy/orders/orders-list'], {
      queryParams: {
        orderStatus: status,
      },
    });
  }

  onChangeTab(evt: any, index) {
    this.tabIndex = index;
    if (evt.index === 0) {
    }
  }
  viewMore() {
    this.router.navigate(['/doqfy/wallet/transaction-details']);
  }
  viewMoreInventory() {
    this.router.navigate(['/doqfy/inventory/stamp-inventory']);
  }

  copyAccountToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.justCopiedAccount = true;

        setTimeout(() => {
          this.justCopiedAccount = false;
        }, 1500);
      })
      .catch((err) => {
        this.justCopiedAccount = false;
        console.error('Could not copy text: ', err);
      });
  }

  copyIfscToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.justCopiedIfsc = true;

        setTimeout(() => {
          this.justCopiedIfsc = false;
        }, 1500);
      })
      .catch((err) => {
        this.justCopiedIfsc = false;
        console.error('Could not copy text: ', err);
      });
  }
}
