import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { MessageService } from 'primeng/api';
import { ExportExcelService } from 'src/app/services/export-excel.service';
import { PreProcurementService } from 'src/app/services/pre-procurement.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { CatUploadService } from 'src/app/services/cat-upload.service';

export function noSpacesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value && typeof control.value === 'string') {
      if (control.value.trim().length === 0) {
        return { noSpaces: true };
      }
    }
    return null;
  };
}

export function noScriptTagValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value && typeof control.value === 'string') {
      const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
      if (scriptPattern.test(control.value)) {
        return { scriptDetected: true };
      }
    }
    return null;
  };
}

@Component({
    selector: 'app-procurement-create',
    templateUrl: './procurement-create.component.html',
    styleUrls: ['./procurement-create.component.scss'],
    standalone: false
})
export class ProcurementCreateComponent implements OnInit {
  states: any;
  statesData: any;
  branchData: any = [];
  selectedState: any;
  amountbalance = '2.5cr';
  selectedDate: any;
  pageNo: number = 1;
  totalRecords: number = 10;
  displayBranch!: any;
  submitted: boolean = false;
  orderDetails: FormGroup;
  stateDetailsForm: FormArray;
  stampType: any = [];
  stamp_types = [
    { code: 'PHYSTMAP', name: 'physical', display: 'Physical' },
    { code: 'ESTAMP', name: 'estamp', display: 'Estamp(On the Fly)' },
    { code: 'ESBTR', name: 'esbtr', display: 'Esbtr' },
    { code: 'ECHALLAN', name: 'echallan', display: 'E-Challan' },
    {
      code: 'PRE_ESTAMP',
      name: 'pre_estamp',
      display: 'Pre Procurement Stamp',
    },
    { code: 'TRADITIONAL', name: 'traditional', display: 'Traditional' },
    { code: 'E_FRANKING', name: 'e_franking', display: 'E-Franking' },
  ];
  cessValues: any;
  showCess: any = [];
  articles: any = [];
  articleCodeData: string[] = [];
  account_id: any;
  accountUserData: any;
  selectedAccount: number | string;
  accountSelector = new FormControl(null);
  reviewDetails: FormGroup;
  reviewEmail: FormArray;
  userData: any;
  selectedReviewer: any;
  userName: any;
  zeroValue: boolean[] = [true];
  stampConvFee: any;
  isWallet: boolean = false;
  virtualAccountNo: string;
  billingType: any;
  constructor(
    private storageService: StorageService,
    private router: Router,
    private preProcurementService: PreProcurementService,
    private messageService: MessageService,
    private formBuilder: FormBuilder,
    private exportExcelService: ExportExcelService,
    private userDashboardService: UserDashboardService,
    private accountManagementService: AccountManagementService,
    private modalService: NgbModal,
    private catUploadService: CatUploadService
  ) {
    this.userDashboardService.getBranchList().subscribe((res: any) => {
      this.states = res['content'];
      this.displayBranch = this.storageService.getBranch() || null;
    });
    this.account_id = this.storageService.getAccountId() || null;
    this.selectedAccount = this.account_id;
    this.orderDetails = this.formBuilder.group({
      stateDetailsForm: this.formBuilder.array([]),
      totalAmount: [null, [Validators.required]],
      account_id: [this.selectedAccount],
    });
    this.reviewDetails = this.formBuilder.group({
      reviewEmail: this.formBuilder.array([]),
      reviewer: [null],
    });
    this.reviewDetails.reset();

    this.getUserAccountData('');
    this.getReviewerData();
    this.virtualAccountNo = this.storageService.getVirtualAccountNumber();
    this.isWallet = this.storageService.getIsWallet();
  }

  ngOnInit(): void {
     this.newStateDetails();
     if (this.selectedAccount) {
      this.getState();
    }
  this.addNewDetails();
    let organizationId = this.storageService.getOrganizationId() || null;
    this.catUploadService.getPricingDetails(organizationId).subscribe((res) => {
      this.stampConvFee = res.content.estamp;
      this.billingType = res.content.billing;
      // this.billingType = 'POSTPAID';
    });
  }

  get isWalletPrepaid(): boolean {
    return this.isWallet && this.billingType === 'PREPAID';
  }

  changeAmount(i: any, evt) {
    const stateValue = this.stateDetailsArray().at(i).value;
    console.log('evt', evt);
    if (
      stateValue.denomination === 0 &&
      stateValue.no_of_stamps === 0 &&
      stateValue.stamp_type === 'ESTAMP'
    ) {
      const articleIdControl = this.stateDetailsArray().at(i).get('article_id');
      const first_party_nameControl = this.stateDetailsArray()
        .at(i)
        .get('first_party_name');
      const second_party_nameControl = this.stateDetailsArray()
        .at(i)
        .get('second_party_name');
      articleIdControl.clearValidators();
      first_party_nameControl.clearValidators();
      second_party_nameControl.clearValidators();
      // this.articleCodeData[i] = '';
      // articleIdControl.setValue('');
      second_party_nameControl.setValue(' ');

      const firstGroup = this.stateDetailsArray().at(i) as FormGroup;

      firstGroup.controls['cessAmount'].setValue(0);
      firstGroup.controls['cessPer'].setValue(0);
      firstGroup.controls['balance'].setValue(evt);
      this.orderDetails.controls['totalAmount'].setValue(evt);
    }
  }

  changeValue(i: any, value: any, evt) {
    const stateValue = this.stateDetailsArray().at(i).value;
    console.log('stateValue', stateValue);
    if (
      stateValue.denomination === 0 &&
      stateValue.no_of_stamps === 0 &&
      stateValue.stamp_type === 'ESTAMP' &&
      stateValue.article_id
    ) {
      this.zeroValue[i] = false;
    } else {
      this.zeroValue[i] = true;
    }
    if (
      stateValue.denomination &&
      stateValue.no_of_stamps &&
      stateValue.state_code != ''
    ) {
      this.getCessValue(i);
    } else {
      let amount = this.stateDetailsArray().at(i).get('amount').value;
      let totalAmount = this.orderDetails.controls['totalAmount'].value;
      this.orderDetails.controls['totalAmount'].setValue(totalAmount - amount);
      this.stateDetailsArray().at(i).get('amount').setValue('');
    }
  }

  getBranchDetails(id: number, i: number) {
    this.accountManagementService
      .getBranchPerUser(this.selectedAccount, id)
      .subscribe((res) => {
        this.branchData[i] = res['content'];
        this.branchData[i] = this.branchData[i].filter(
          (element) => element.is_active === true
        );
      });
  }
  getState() {
    this.stampType = [];
    this.userDashboardService
      .getStatesProcurement(this.selectedAccount)
      .subscribe((res: any) => {
        this.statesData = res['content'];
      });
  }

  getCessValue(index: number) {
    const stateValue = this.stateDetailsArray().at(index).value;

    if (
      stateValue.denomination &&
      stateValue.no_of_stamps &&
      stateValue.state_code != ''
    ) {
      if (stateValue.state_code.state_code === 'RJ') {
        this.showCess[index] = true;
      } else {
        this.showCess[index] = false;
      }

      let queryParams = `state_code=${stateValue.state_code.state_code}&denomination=${stateValue.denomination}&no_of_stamps=${stateValue.no_of_stamps}`;
      let totalConvFee =
        this.billingType === 'POSTPAID'
          ? 0
          : this.stampConvFee *
            this.stateDetailsArray().at(index).get('no_of_stamps').value;
      let GST = this.billingType === 'POSTPAID' ? 0 : totalConvFee * 0.18;
      this.preProcurementService
        .getCessDetails(queryParams)
        .subscribe((res) => {
          this.cessValues = res['content'];

          // Update the entire form group in the form array
          this.stateDetailsArray()
            .at(index)
            .patchValue({
              cessPer: this.cessValues.cess,
              cessAmount: this.cessValues.cess_amount,
              amount: this.isWallet
                ? this.cessValues.amount +
                  this.cessValues.cess_amount +
                  totalConvFee +
                  GST
                : this.cessValues.amount + this.cessValues.cess_amount,
              balance: this.isWallet
                ? this.cessValues.amount +
                  this.cessValues.cess_amount +
                  totalConvFee +
                  GST
                : this.cessValues.amount + this.cessValues.cess_amount,
              stamp_amount: this.cessValues.amount,
            });

          // Update the totalAmount control in the parent form
          const totalAmount = this.stateDetailsArray().value.reduce(
            (acc: any, curr: { balance: any }) => acc + curr.balance,
            0
          );

          this.orderDetails.controls['totalAmount'].setValue(totalAmount);
        });
    } else {
      this.messageService.add({
        severity: 'warn',
        detail: 'Please Enter State , denomination and No of stamps',
      });
    }
  }

  gotoDashboard() {
    this.router.navigate(['doqfy/adminDashboard']);
  }

  gotoListing() {
    this.router.navigate(['doqfy/pre-procurement/procurement-listing']);
  }

  saveDetails() {
    this.submitted = true;

    if (this.orderDetails.controls['stateDetailsForm'].valid) {
      let data: any;
      if (this.reviewDetails.value.reviewer) {
        const reviewIds = this.reviewDetails.value.reviewer.id;

        data = {
          order_reviewers: [{ reviewer_id: reviewIds }],
          pre_procurement: this.stateDetailsArray().value,
        };
      } else {
        data = { pre_procurement: this.stateDetailsArray().value };
      }

      data.pre_procurement.forEach((element) => {
        element.state_code = element.state_code.state_code;

        if (this.isWallet) {
          element.wallet_data = {
            virtual_account_no: this.virtualAccountNo,
            amount: element.amount,
            stamp_rate: this.billingType === 'POSTPAID' ? 0 : this.stampConvFee,
            stamp_bill: [
              {
                article_code: element.article_code,
                state_code: element.state_code,
                stamp_amount: element.stamp_amount,
                price: this.billingType === 'POSTPAID' ? 0 : this.stampConvFee,
                amount: element.amount,
                quantity: element.no_of_stamps,
                cess: element.cessAmount,
              },
            ],
          };
        }
      });
      console.log('reviewDetails', data);

      this.preProcurementService
        .createProcurmentOrder(data)
        .subscribe((res: any) => {
          if (res) {
            if (res.message == 'success') {
              this.messageService.add({
                severity: 'success',
                detail: 'New Order Created Successfully',
              });
            } else {
              this.messageService.add({
                severity: 'success',
                detail: res.message,
              });
            }

            this.closeModel();
            setTimeout(() => {
              this.router.navigate([
                'doqfy/pre-procurement/procurement-listing',
              ]);
            }, 1500);
          }
        });
    } else {
      this.messageService.add({
        severity: 'warn',
        detail: 'Please Check if all the Details are Filled',
      });
    }
  }

  newStateDetails() {
    if (this.orderDetails.controls['stateDetailsForm'].valid) {
      this.stateDetailsArray().push(this.initDetails());
    } else {
      this.submitted = true;
      this.messageService.add({
        severity: 'warn',
        detail: 'Please fill all the  details before adding New',
      });
    }
  }

  removeDetails(index: number) {
    let amount = this.stateDetailsArray().at(index).get('amount').value;
    let totalAmount = this.orderDetails.controls['totalAmount'].value - amount;
    if (totalAmount === 0)
      this.orderDetails.controls['totalAmount'].setValue('');
    else this.orderDetails.controls['totalAmount'].setValue(totalAmount);
    this.showCess[index] = false;
    this.stateDetailsArray().removeAt(index);
    this.branchData.splice(index, 1);
    this.articles.splice(index, 1);
  }

  stateDetailsArray(): FormArray {
    return this.orderDetails.get('stateDetailsForm') as FormArray;
  }

  initDetails() {
    this.submitted = false;

    return this.formBuilder.group({
      state_code: new FormControl('', [Validators.required]),
      denomination: new FormControl(null, [
        Validators.required,
        noScriptTagValidator(),
      ]),
      no_of_stamps: new FormControl(null, [
        Validators.required,
        noScriptTagValidator(),
      ]),
      cessPer: new FormControl(null, [Validators.required]),
      cessAmount: new FormControl(null, [Validators.required]),
      amount: new FormControl(null, [
        Validators.required,
        noScriptTagValidator(),
      ]),
      stamp_type: new FormControl('', [Validators.required]),
      remarks: new FormControl('', [
        Validators.maxLength(100),
        noScriptTagValidator(),
      ]),
      balance: new FormControl(null, [Validators.required]),
      stamp_amount: new FormControl(null, [Validators.required]),
      branch_id: new FormControl(null),
      article_id: new FormControl(''),
      account_id: [this.selectedAccount],
      article_code: new FormControl(''),

      first_party_name: new FormControl('', [
        noSpacesValidator(),
        Validators.maxLength(50),
        noScriptTagValidator(),
      ]),
      second_party_name: new FormControl('', [
        noSpacesValidator(),
        Validators.maxLength(50),
        noScriptTagValidator(),
      ]),
      branch_name: new FormControl(''),
      article_name: new FormControl(''),
    });
  }

  onPasteInput(event: ClipboardEvent, controlName: string, index: number) {
    const pastedText = event.clipboardData?.getData('text') || '';
    const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;

    if (scriptPattern.test(pastedText)) {
      event.preventDefault(); 
      this.messageService.add({
        severity: 'error',
        summary: 'Security Alert',
        detail: 'Malicious content detected. Script tags are not allowed.',
        life: 3000,
      });
    }
  }

  numberOnly(event: any) {
    const pattern = /[0-9]/;
    let inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  //------------Get Stamp Type--------------------------------------//

  getStampType(event: any, i: number) {
    this.getBranchDetails(event.value.id, i);
    this.preProcurementService
      .getStampTypeByState(event.value.state_code)
      .subscribe((res) => {
        const stampType = res['content'][0];

        const trueKeys = [];
        for (const key in stampType) {
          if (stampType[key] === true) {
            trueKeys.push(key);
          }
        }
        this.stampType[i] = this.stamp_types.filter((stamp) =>
          trueKeys.includes(stamp.name)
        );
      });
  }

  getArticles(id, i) {
    let queryParams = { state_code: id };
    this.preProcurementService.getArticles(queryParams).subscribe((resp) => {
      if (resp.status) {
        // Transform the data to include a display field
        this.articles[i] = resp['content'].map((article) => ({
          ...article,
          displayText: `${article.article_code} - ${article.article_name}`,
        }));
      }
    });
  }

  getArticleIds(i: number, value: any, event: any) {
    const stateValue = this.stateDetailsArray().at(i).value;
    if (
      stateValue.denomination &&
      stateValue.no_of_stamps &&
      stateValue.state_code != ''
    ) {
      this.getCessValue(i);
    }

    this.getArticles(event.value.state_code, i);
  }

  onStampTypeChange(evt, index) {
    const articleIdControl = this.stateDetailsArray()
      .at(index)
      .get('article_id');
    const first_party_nameControl = this.stateDetailsArray()
      .at(index)
      .get('first_party_name');
    const second_party_nameControl = this.stateDetailsArray()
      .at(index)
      .get('second_party_name');

    if (evt.value === 'ESTAMP' || evt.value === 'PRE_ESTAMP') {
      articleIdControl.setValidators([Validators.required]);
      first_party_nameControl.setValidators([Validators.required]);
      second_party_nameControl.setValidators([Validators.required]);
    } else if (evt.value === 'E_FRANKING') {
      articleIdControl.setValidators([Validators.required]);
      first_party_nameControl.setValidators([Validators.required]);
      second_party_nameControl.clearValidators();
    } else if (evt.value === 'TRADITIONAL') {
      articleIdControl.clearValidators();
      first_party_nameControl.setValidators([Validators.required]);
    } else {
      articleIdControl.clearValidators();
      first_party_nameControl.clearValidators();
      second_party_nameControl.clearValidators();
    }
    this.articleCodeData[index] = '';
    articleIdControl.setValue('');
    articleIdControl.updateValueAndValidity();
    first_party_nameControl.updateValueAndValidity();
    second_party_nameControl.setValue('');
    second_party_nameControl.updateValueAndValidity();
  }

  openReviewTab(content) {
    if (
      this.stateDetailsArray().value.length === 0 ||
      !this.orderDetails.controls['stateDetailsForm'].valid
    ) {
      this.messageService.add({
        severity: 'warn',
        detail: 'Please fill the stamp details!',
      });
    } else {
      this.modalService
        .open(content, {
          size: 'xl',
          ariaLabelledBy: 'modal-basic-title',
          backdrop: 'static',
          keyboard: false,
        })
        .result.then(
          (result) => {},
          (reason) => {}
        );
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  onBranchChange(evt, index) {
    const branchData = this.branchData[index]; // Assuming branchData is an array of objects
    const selectedOption = branchData.find((option) => option.id === evt.value);

    if (selectedOption) {
      this.stateDetailsArray()
        .at(index)
        .get('branch_name')
        .setValue(selectedOption.name);
    } else {
    }
  }

  onArticleNumberChange(event, i) {
    const selectedArticleId = event.value;
    const selectedArticle = this.articles[i].find(
      (article) => article.id === selectedArticleId
    );

    if (selectedArticle && selectedArticle.amount) {
      const amount = selectedArticle.amount;

      // Check if it has fix_stamp_duty
      if (amount.fix_stamp_duty) {
        // Set denomination to fix_stamp_duty value
        this.stateDetailsArray()
          .at(i)
          .get('denomination')
          .setValue(amount.fix_stamp_duty);
      }
      // Check if it has min_stamp_duty (for variable stamp duty articles)
      else if (amount.min_stamp_duty) {
        // Set denomination to min_stamp_duty value by default
        this.stateDetailsArray()
          .at(i)
          .get('denomination')
          .setValue(amount.min_stamp_duty);
      }

      // Trigger the changeValue method to recalculate amounts
      this.changeValue(
        i,
        'denominations',
        this.stateDetailsArray().at(i).get('denomination').value
      );
    }
  }

  //---------------------------------------------Account Filter ------------------------------------------------//

  onSelectedAccount(event) {
    this.orderDetails.reset();
    if (event.value !== null) {
      this.selectedAccount = event.value;
    } else {
      this.selectedAccount = this.account_id;
    }
    this.orderDetails.reset();
    this.orderDetails.controls['account_id'].setValue(this.selectedAccount);
    const firstGroup = this.stateDetailsArray().at(0) as FormGroup;
    firstGroup.controls['account_id'].setValue(this.selectedAccount);
    this.getState();
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
  //--------------------------------------------------------------------------------//

  //---------------------------------Reviewer Pre-procurement ---------------------------------//

  getReviewerData() {
    let account_id = this.storageService.getAccountId();
    this.preProcurementService.getReviewerData(account_id).subscribe((res) => {
      this.userData = res['content'];
    });
  }

  removeDetailsReview(index: number) {
    this.reviewEmailArray().removeAt(index);
    this.reviewDetails.value.reviewer.splice(index, 1);
    this.userData = [...this.userData];
  }

  reviewEmailArray(): FormArray {
    return this.reviewDetails.get('reviewEmail') as FormArray;
  }

  addNewDetails() {
    this.reviewEmailArray().push(this.initDetailsReview());
  }

  initDetailsReview() {
    return this.formBuilder.group({
      email: new FormControl(null, [Validators.email]),
    });
  }

  selectReviewer() {
    this.selectedReviewer = this.reviewDetails.value.reviewer;
    this.reviewEmailArray().clear();

    this.addNewDetails();
    if (this.selectReviewer) {
      this.reviewEmailArray()
        .at(0)
        .get('email')
        .setValue(this.selectedReviewer.email);
    }
  }
  //------------------------------------------------------------------------------------------------//

}
