import { ChangeDetectorRef, Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { CookieService } from 'ngx-cookie-service';
import { NotificationService } from 'src/app/services/notification.service';
import { StorageService } from 'src/app/services/storage.service';
import { constants } from 'src/constants';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { AnnouncementService } from 'src/app/services/announcement.service';
import { MsalService } from '@azure/msal-angular';
import { Dropdown } from 'bootstrap';
import { LoginService } from 'src/app/services/login.service';
import { MessageService } from 'primeng/api';
import {
  ABCLLoginUrl,
  LoginFlowConstants
} from 'src/app/models/user-login.model';

@Component({
    selector: 'app-header-nav',
    templateUrl: './header-nav.component.html',
    styleUrls: ['./header-nav.component.scss'],
    standalone: false
})
export class HeaderNavComponent implements OnInit {
  themeColor = constants.themeColor;
  items!: MenuItem[];
  admin: boolean = false;
  visibleSidebar2: boolean = false;
  notificatioData: any = [];
  formattedDate: string;
  currentDate = new Date();
  userRole: string;
  userName: string;
  totalNotificationCount = 0;
  branchData = [];
  selectedBranch;
  showSelectBranch = false;
  activeAccordion;
  activeState: any = [];
  showAvatar: boolean = false;
  isOpen: boolean[] = [];
  notificationIds: any[] = [];
  order_reviewer: any;
  otp_validation: any;
  account_id: string;
  previousUrl: string | null = null;
  private routerSubscription: Subscription;
  private accountChangeSubscription: Subscription;
  esign_webcam: any;
  order_payment: any;
  estamp_field_editable: any;
  showAnnouncement = false;
  isClosing = false;
  isDropdownOpen = false;
  isProfileDropdownOpen = false;
  aadhaar_validation: any;
  abclLoginUrl: ABCLLoginUrl = new ABCLLoginUrl();
  loginConstants: LoginFlowConstants = new LoginFlowConstants();
  isAxisFeature: boolean = false;
  private permissionsMap: { [key: string]: boolean } | null = null;
  //  is_wallet: boolean = false;

  constructor(
    private router: Router,
    private cookieService: CookieService,
    private announcementService: AnnouncementService,
    private loginService: LoginService,
    private renderer: Renderer2,
    private userService: UserProfileService,
    private location: Location,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private authService: MsalService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.userRole = this.storageService.getRole() || null;
    this.userName = this.storageService.getUser() || 'User';
    this.account_id = this.storageService.getAccountId() || null;
    this.initializeMenu();
    this.setOrderReviewer();
    //  this.is_wallet = this.storageService.getIsWallet();

    this.formattedDate = `${this.currentDate.getDate()} ${this.currentDate.toLocaleString(
      'en-US',
      { month: 'short' }
    )} ${this.currentDate.getFullYear()} | ${this.formatHours(
      this.currentDate.getHours()
    )}:${this.formatMinutes(
      this.currentDate.getMinutes()
    )} ${this.currentDate.getHours() >= 12 ? 'pm' : 'am'}`;
  }

  get userRoleLabel(): string {
    return (this.userRole || 'User')
      .replace(/[_-]+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  get userInitials(): string {
    return (this.userName || 'User')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((name) => name.charAt(0).toUpperCase())
      .join('');
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.showAvatar = window.innerWidth < 900;
  }

  ngOnInit(): void {
    this.showAnnouncement = !this.announcementService.getAnnouncementStatus();
    this.getNotifications();
    this.isOpen = this.notificatioData.map(() => false);
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.url;
        if (this.previousUrl !== null && this.previousUrl === currentUrl) {
          this.reloadCurrentPage();
        }
        this.previousUrl = currentUrl;
      }
    });

    this.accountChangeSubscription = this.userService.accountChanged$.subscribe(
      (accountId: string | null) => {
        if (accountId) {
          this.account_id = accountId;
          this.setOrderReviewer();
        }
      }
    );
  }

  ngAfterViewInit() {
    const dropdownToggle = document.getElementById('dropdownMenuButton1');
    if (dropdownToggle) {
      new Dropdown(dropdownToggle);
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.accountChangeSubscription) {
      this.accountChangeSubscription.unsubscribe();
    }
  }

  get is_wallet(): boolean {
    return this.storageService.getIsWallet();
  }

  reloadCurrentPage(): void {
    this.location.replaceState(this.router.url);
    window.location.reload();
  }

  setOrderReviewer() {
    this.userService.getOrderReviewConsent(this.account_id).subscribe((res) => {
      this.order_reviewer = res['content'].maker_checker;
      this.otp_validation = res['content'].esign_otp;
      this.esign_webcam = res['content'].esign_webcam;
      this.estamp_field_editable = res['content'].estamp_field_editable;
      this.aadhaar_validation = res['content'].aadhaar_validation;
      this.order_payment = res['content'].order_payment;
      this.isAxisFeature =
        res['content']?.additional_configuration?.bulk_catupload
          ?.bulk_catupload_enabled === true;
      this.storageService.setSqsGroupID(
        res['content']?.additional_configuration?.bulk_catupload?.sqs_group_id
      );
      this.storageService.setOrderReviewConsent(this.order_reviewer);
      this.storageService.setOrderPayment(this.order_payment);
      this.storageService.setOtpValidation(this.otp_validation);
      this.storageService.setSignatoryImageCapture(this.esign_webcam);
      this.storageService.setStampEdit(this.estamp_field_editable);
      this.storageService.setAdharEdit(this.aadhaar_validation);
      this.storageService.setSyncSecondPartyAndPrice(
        res['content']?.additional_configuration?.sync_second_party_and_price ?? false,
      );
      const permissionsArray = res['content']?.permissions;
      if (permissionsArray && permissionsArray.length > 0) {
        const matched = permissionsArray.find((p: any) => p.group?.name === this.userRole);
        if (matched?.permissions) {
          this.permissionsMap = {};
          for (const menuName of Object.keys(matched.permissions)) {
            this.permissionsMap[menuName] = matched.permissions[menuName].read === true;
          }
        } else {
          this.permissionsMap = null;
        }
      } else {
        this.permissionsMap = null;
      }
      this.initializeMenu();
      this.cdr.detectChanges();
    });
  }

  private navigateToService(routerLink: string, queryParams?: any): void {
    const selectedState = this.storageService.getState();
    if (!selectedState) {
      this.messageService.add({
        severity: 'warn',
        summary: 'State Not Selected',
        detail: 'Please select a state in the dashboard first before using the service.',
        life: 4000
      });
      return;
    }
    if (queryParams) {
      this.router.navigate([`doqfy/${routerLink}`], { queryParams });
    } else {
      this.router.navigate([`doqfy/${routerLink}`]);
    }
  }

  // ─── Build service items with state guard injected via `command` ─────────────
  private buildServiceItems(): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: 'Contract Upload',
        command: () => this.navigateToService('cat-execution')
      },
      {
        label: 'Contract Multi-Estamp',
        command: () => this.navigateToService('cat-execution', { service: 'multiple-stamp' })
      },
      {
        label: 'Contract Import',
        command: () => this.navigateToService('cat-import/form')
      },
      {
        label: 'Contract Edit',
        command: () => this.navigateToService('cat-edit')
      },
      {
        label: 'CAT Compose',
        command: () => this.navigateToService('cat-compose')
      },
      {
        label: 'E-Stamp',
        command: () => this.navigateToService('e-stamp')
      },
      {
        label: 'E-Sign',
        command: () => this.navigateToService('e-sign')
      }
    ];

    if (this.isAxisFeature) {
      items.push({
        label: 'Automated Bulk Upload',
        command: () => this.navigateToService('bulk-upload-estamp')
      });
    }

    return items;
  }

  // ─── Note: Contract Import routerLink differs per role (form vs no form) ─────
  private buildServiceItemsAdmin(): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: 'Contract Upload',
        command: () => this.navigateToService('cat-execution')
      },
      {
        label: 'Contract Multi-Estamp',
        command: () => this.navigateToService('cat-execution', { service: 'multiple-stamp' })
      },
      {
        label: 'Contract Import',
        command: () => this.navigateToService('cat-import')
      },
      {
        label: 'Contract Edit',
        command: () => this.navigateToService('cat-edit')
      },
      {
        label: 'CAT Compose',
        command: () => this.navigateToService('cat-compose')
      },
      {
        label: 'E-Stamp',
        command: () => this.navigateToService('e-stamp')
      },
      {
        label: 'E-Sign',
        command: () => this.navigateToService('e-sign')
      }
    ];

    if (this.isAxisFeature) {
      items.push({
        label: 'Automated Bulk Upload',
        command: () => this.navigateToService('bulk-upload-estamp')
      });
    }

    return items;
  }

  initializeMenu(): void {
    this.admin = this.userRole !== 'CLIENT';
    this.items = [
      {
        label: 'Pre-Procurement',
        routerLink: 'pre-procurement',
      },
      {
        label: 'Stamp Inventory',
        routerLink: 'inventory',
      },
    ];
    this.applyPermissionsFilter();
  }

  private applyPermissionsFilter(): void {
    if (!this.permissionsMap) return;
    this.items = this.items
      .map(item => {
        if (item.items) {
          const filteredSubs = item.items.filter(sub => {
            const perm = this.permissionsMap![sub.label!];
            return perm === undefined || perm === true;
          });
          return filteredSubs.length > 0 ? { ...item, items: filteredSubs } : null;
        }
        const perm = this.permissionsMap![item.label!];
        return (perm === undefined || perm === true) ? item : null;
      })
      .filter((item): item is MenuItem => item !== null);
  }

  setActive(index: any): void {
    this.isOpen[index] = !this.isOpen[index];
  }

  toggle(index: number) {
    this.isOpen[index] = !this.isOpen[index];
  }

  getNotifications() {
    this.notificationService.getNotifications().subscribe((resp: any) => {
      if (resp.status && resp['content'].length > 0) {
        this.notificatioData = resp.content;
        this.activeAccordion = this.notificatioData[0].title;
        this.totalNotificationCount = resp.pagination.total_records;
      }
    });
  }

  showUserMenu() {
    this.items = [
      {
        label: 'Services',
        items: this.buildServiceItems()   // ← CLIENT uses cat-import/form
      },
      {
        label: 'Order Details',
        routerLink: 'orders'
      },
      {
        label: 'Pre-Procurement',
        routerLink: 'pre-procurement'
      },
      {
        label: 'Stamp Inventory',
        routerLink: 'inventory'
      },
      {
        label: 'Summary',
        routerLink: 'reports'
      }
    ];
  }

  showAdminMenu() {
    this.items = [
      {
        label: 'Services',
        items: this.buildServiceItemsAdmin()   // ← Admin uses cat-import (no /form)
      },
      {
        label: 'Management',
        items: [
          {
            label: 'Account Management',
            routerLink: 'management/account-listing'
          },
          {
            label: 'Branch Management',
            routerLink: 'management/branch-listing'
          },
          { label: 'User Management', routerLink: 'management/user-listing' }
        ]
      },
      {
        label: 'Order Details',
        routerLink: 'orders'
      },
      {
        label: 'Pre-Procurement',
        routerLink: 'pre-procurement'
      },
      {
        label: 'Stamp Inventory',
        routerLink: 'inventory'
      },
      {
        label: 'Summary',
        routerLink: 'reports'
      }
    ];
  }

  showOperatorMenu() {
    this.items = [
      {
        label: 'Services',
        items: this.buildServiceItemsAdmin()
      },
      {
        label: 'Order Details',
        routerLink: 'orders'
      },
      {
        label: 'Pre-Procurement',
        routerLink: 'pre-procurement'
      },
      {
        label: 'Stamp Inventory',
        routerLink: 'inventory'
      },
      {
        label: 'Summary',
        routerLink: 'reports'
      }
    ];
  }

  showBranchAdminMenu() {
    this.items = [
      {
        label: 'Services',
        items: this.buildServiceItemsAdmin()
      },
      {
        label: 'Management',
        items: [
          {
            label: 'Account Management',
            routerLink: 'management/account-listing'
          },
          {
            label: 'Branch Management',
            routerLink: 'management/branch-listing'
          },
          { label: 'User Management', routerLink: 'management/user-listing' }
        ]
      },
      {
        label: 'Order Details',
        routerLink: 'orders'
      },
      {
        label: 'Pre-Procurement',
        routerLink: 'pre-procurement'
      },
      {
        label: 'Stamp Inventory',
        routerLink: 'inventory'
      },
      {
        label: 'Summary',
        routerLink: 'reports'
      }
    ];
  }

  showAccountAdminMenu() {
    this.items = [
      {
        label: 'Services',
        items: this.buildServiceItemsAdmin()
      },
      {
        label: 'Management',
        items: [
          {
            label: 'Account Management',
            routerLink: 'management/account-listing'
          },
          {
            label: 'Branch Management',
            routerLink: 'management/branch-listing'
          },
          { label: 'User Management', routerLink: 'management/user-listing' }
        ]
      },
      {
        label: 'Order Details',
        routerLink: 'orders'
      },
      {
        label: 'Pre-Procurement',
        routerLink: 'pre-procurement'
      },
      {
        label: 'Stamp Inventory',
        routerLink: 'inventory'
      },
      {
        label: 'Summary',
        routerLink: 'reports'
      }
    ];
  }

  gotoDashboard() {
    if (this.userRole === 'CLIENT') {
      this.router.navigate(['doqfy/dashboard']);
    } else {
      this.router.navigate(['doqfy/admin-dashboard']);
    }
  }

  formatHours(hours: number) {
    return hours % 12 || 12;
  }

  formatMinutes(minutes: { toString: () => string }) {
    return minutes.toString().padStart(2, '0');
  }

  logout() {
    this.isProfileDropdownOpen = false;
    this.loginService.logout().subscribe({
      next: (res) => {
        if (res.status === 200) {
          if (res.content?.redirect_url) {
            const token = this.storageService.getABCLToken();
            let redirectUrl = res.content.redirect_url;
            if (token) {
              redirectUrl = `${redirectUrl}${token}`;
            }
            window.location.replace(redirectUrl);
          } else {
            void this.router.navigateByUrl(this.abclLoginUrl.base_url);
          }
          this.cookieService.delete(this.loginConstants.role);
          this.cookieService.delete(this.loginConstants.accessToken);
          this.storageService.clearStorage();
          this.authService.instance.setActiveAccount(null);
        } else {
          this.messageService.add({
            severity: this.loginConstants.error,
            detail: this.loginConstants.wentWrongMessage
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Logout Failed',
          detail: error?.error?.message || this.loginConstants.wentWrongMessage
        });
      }
    });
  }

  onBranchChange() {}

  markAsRead(id, isRead) {
    if (isRead) return;
    else {
      this.notificationIds = [];
      this.notificationIds.push(id);
      this.notificationIds = Array.from(new Set(this.notificationIds));
      let payload = { notification_id: this.notificationIds };
      this.notificationService.notificationMarkRead(payload).subscribe((resp: any) => {
        if (resp.status === 200) {
          this.getNotifications();
        }
      });
    }
  }

  setAllMarkAsRead() {
    this.notificationIds = [];
    this.notificatioData.forEach((data: any) => {
      if (data.is_read === false) this.notificationIds.push(data.id);
    });
    this.notificationIds = Array.from(new Set(this.notificationIds));
    let payload = { notification_id: this.notificationIds };
    if (this.notificationIds.length > 0) {
      this.notificationService.notificationMarkRead(payload).subscribe((resp: any) => {
        if (resp.status === 200) {
          this.getNotifications();
        }
      });
    }
  }

  toggleAnnouncement() {
    if (this.showAnnouncement) {
      this.closeToggle();
    } else {
      this.showAnnouncement = true;
    }
    this.announcementService.setAnnouncementStatus(this.showAnnouncement);
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeToggle() {
    this.isClosing = true;
    setTimeout(() => {
      this.showAnnouncement = false;
      this.isClosing = false;
      this.announcementService.setAnnouncementStatus(this.showAnnouncement);
    }, 500);
  }

  navigateTo(route: string) {
    this.router.navigate([`doqfy/${route}`]);
  }
}