import { ChangeDetectorRef, Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { OrderService } from 'src/app/services/order.service';
import { StorageService } from 'src/app/services/storage.service';
import { WalletService } from 'src/app/services/wallet.service';

@Component({
    selector: 'app-side-nav',
    templateUrl: './side-nav.component.html',
    styleUrls: ['./side-nav.component.scss'],
    standalone: false
})
export class SideNavComponent implements OnInit {
  accountId: any = '';
  today = new Date();
  currentBalance: number = 0;
  totalRecords: number = 0;
  diaplybalance!: string;
  exactbalance: string = Number(this.currentBalance).toLocaleString();
  pendingOrderDetils: any;
  userName: string = 'User Name';
  orderId: any;
  role: string;
  orderFilters: any = {};
  showRow: boolean = false;
  tabIndex: number = 0;
  inventoryBalance: any;
  remInventoryBalance: any;
  is_wallet: boolean = false;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private renderer: Renderer2,
    private cookieService: CookieService,
    private storageService: StorageService,
    private walletService: WalletService,
    private accountManagementService: AccountManagementService,
    private cdr: ChangeDetectorRef
  ) {
    // this.userName = this.cookieService.get('userName');
    this.userName = this.storageService.getUser() || 'User';
    this.role = this.storageService.getRole() || null;
    this.diaplybalance = this.formatNumber(this.currentBalance);
    this.getRecentActivity();
    this.accountId = this.storageService.getAccountId();
    this.is_wallet = this.storageService.getIsWallet();
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.showRow = window.innerWidth >= 400 && window.innerWidth < 985;
  }

  ngOnInit(): void {
    this.storageService.accountId$.subscribe((id) => {
      this.accountId = id;
      this.getBalance(this.accountId);
    });
    this.getAccountDetailsById();
  }
  
  getAccountDetailsById() {
    this.accountManagementService
      .getAccountDetail(this.accountId)
      .subscribe((res) => {
        const userAccount = res['content'][0];
        if (userAccount) {
          this.loadTransactionHeaderDetails(userAccount.virtual_account_no);
        }
        this.storageService.setVirtualAccountNumber(
          userAccount.virtual_account_no
        );
        this.storageService.setIsWallet(userAccount.is_wallet)
        this.storageService.setWalletBank(userAccount.wallet_bank)
      });
  }
  loadTransactionHeaderDetails(virtual_account_no) {
    if(virtual_account_no){
      this.walletService.getWalletClientDetails(virtual_account_no).subscribe(
      (data) => {
        this.diaplybalance = data.content.balance;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error loading transactions:', error);
      });
    }
    else{
      this.storageService.setWalletBalance(0)
    }
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

  getRecentActivity() {
    this.pendingOrderDetils = [];
    const status = [
      'IN_PROGRESS',
      'WAITING_FOR_STAMP',
      'INITIATED',
      'WAITING_FOR_PAYMENT',
    ];
    this.orderFilters['status'] = status;
    //  this.orderFilters["action_type"] = 'individual';
    this.orderService.getOrders(this.orderFilters).subscribe((resp) => {
      if (resp.status == 200) {
        if (Object.keys(resp.content).length > 0) {
          this.pendingOrderDetils = resp.content;
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
      this.orderId = order.id;
    } else {
      this.orderService.orderType = 'Bulk';
      this.orderId = orderType;
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
      case 'Waiting For Stamp':
        status = 'WAITING_FOR_STAMP';
        break;
      case 'Waiting For Payment':
        status = 'WAITING_FOR_PAYMENT';
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
    this.router.navigate(['/doqfy/orders/orders-list'], {
      queryParams: {
        orderStatus: [status],
        serviceType: serviceType,
        branch: order.branch,
        id: this.orderId,
      },
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

  getBalance(id) {
    this.orderService.getBalance(id).subscribe((resp) => {
      if (resp.status == 200) {
        this.diaplybalance = resp.content.balance;
        this.inventoryBalance = resp.content.inventory_balance;
        this.remInventoryBalance = resp.content.remaining_inventory_balance;
      }
      this.cdr.detectChanges();
    });
  }
  viewMore() {
    this.router.navigate(['/doqfy/wallet/transaction-details']);
  }
  viewMoreInventory() {
    this.router.navigate(['/doqfy/inventory/stamp-inventory']);
  }
}
