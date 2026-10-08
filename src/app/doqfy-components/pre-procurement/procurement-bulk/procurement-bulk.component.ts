import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, map, Observable } from 'rxjs';
import { AccountManagementService } from 'src/app/services/account-management.service';
import { PreProcurementService } from 'src/app/services/pre-procurement.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import * as XLSX from 'xlsx';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { TableColumn } from 'src/app/shared-components/data-table/data-table.component';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-procurement-bulk',
  standalone: false,
  templateUrl: './procurement-bulk.component.html',
  styleUrl: './procurement-bulk.component.scss',
})
export class ProcurementBulkComponent {
  selectedFile: File | null = null;
  excelData: any[] = [];
  previewData: any[] = [];
  showPreview: boolean = false;
  isCalculating: boolean = false;
  statesData: any;
  account_id: any;
  branchData: any[] = [];
  reviewDetails!: FormGroup;
  userData: any[] = [];
  selectedReviewer: any = null;
  validationErrors: string[] = [];
  hasValidationErrors: boolean = false;
  showValidationIssues: boolean = false;
  selectedReviewers: number[] = [];
  totalAmount: any;
  autoApprover: boolean = false;
  showUploadedTable = false;

  excelColumns: string[] = [
    'state_code',
    'number_of_stamps',
    'stamp_type',
    'denomination',
    'description',
    'article_number',
    'first_party_name',
    'second_party_name',
  ];

  private readonly numericExcelColumns = ['number_of_stamps', 'denomination'];

  readonly previewColumns: TableColumn[] = [
    { field: 's_no', header: '#' },
    ...this.excelColumns.map((column) =>
      this.numericExcelColumns.includes(column)
        ? { field: column, header: column, accessorFn: (row: any) => row[column] || '-' }
        : { field: column, header: column, fallback: '-' },
    ),
  ];

  constructor(
    private router: Router,
    private preProcurementService: PreProcurementService,
    private userDashboardService: UserDashboardService,
    private storageService: StorageService,
    private accountManagementService: AccountManagementService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private UserProfileSer: UserProfileService,
    private messageService: MessageService,
  ) {
    this.account_id = this.storageService.getAccountId();
    this.reviewDetails = this.formBuilder.group({
      reviewer: [[]],
    });
  }

  ngOnInit(): void {
    this.getAccountSettings();
    this.userDashboardService
      .getStatesProcurement(this.account_id)
      .subscribe((res: any) => {
        this.statesData = res.content || [];
        this.cdr.detectChanges();
      });
    this.getReviewers();
  }

  showToast(
    severity: 'success' | 'error' | 'info' | 'warn',
    message: string,
  ): void {
    this.messageService.add({
      severity: severity,
      summary: severity === 'success' ? 'Success' : 'Error',
      detail: message,
    });
  }

  getReviewers(): void {
    this.preProcurementService.getReviewerData(this.account_id).subscribe({
      next: (res: any) => {
        this.userData = (res?.content || []).map((user: any) => ({
          ...user,
          disabled: this.autoApprover && user.is_approver === true,
        }));

        const selectedApprovers = this.userData
          .filter((user: any) => user.is_approver === true)
          .map((user: any) => user.id);

        this.reviewDetails.patchValue({
          reviewer: selectedApprovers,
        });
      },
      error: (error: any) => {
        this.showToast('error', 'Something went wrong. Please try again.');
        this.userData = [];
      },
    });
  }

  openPreview(): void {
    const invalidState = this.excelData.find(
      (row: any) =>
        !this.statesData?.some(
          (item: any) =>
            item.state_code?.toString().trim() ===
            row.state_code?.toString().trim(),
        ),
    );

    if (invalidState) {
      this.validationErrors = [
        `Invalid state code ${invalidState.state_code}. Please enter a valid state code`,
      ];

      this.hasValidationErrors = true;
      this.showValidationIssues = true;

      this.cdr.detectChanges();
      return;
    }

    if (this.hasValidationErrors) {
      console.error(
        'Cannot open preview. Excel validation errors:',
        this.validationErrors,
      );
      return;
    }
    if (!this.statesData || !this.statesData.length) {
      this.showToast('error', 'State data is not available');
      return;
    }

    if (!this.excelData.length) {
      return;
    }
    const calculationPayload = this.excelData.map((row: any) => {
      const state = this.statesData.find(
        (item: any) =>
          item.state_code?.toString() === row.state_code?.toString(),
      );

      return {
        state_code: state?.state_code,
        denomination: Number(row.denomination),
        no_of_stamps: Number(row.number_of_stamps),
      };
    });

    this.isCalculating = true;
    this.cdr.detectChanges();

    this.preProcurementService
      .calculateAmountBulk(calculationPayload)
      .subscribe({
        next: (res: any) => {
          if (res.status !== 200) {
            this.isCalculating = false;
            return;
          }

          /*
           * Branch + Article API call
           * for every Excel row
           */
          const requests = this.excelData.map((row: any, index: number) => {
            const state = this.statesData.find(
              (item: any) =>
                item.state_code?.toString().trim().toLowerCase() ===
                row.state_code?.toString().trim().toLowerCase(),
            );
            if (!state) {
              this.validationErrors = [
                `Invalid state code ${row.state_code}. Please enter a valid state code`,
              ];

              this.hasValidationErrors = true;
              this.showValidationIssues = true;
              this.isCalculating = false;

              this.cdr.detectChanges();

              return null;
            }
            return forkJoin({
              branches: this.getBranchDetails(state.id),

              article: this.getArticleDetails(
                state.state_code,
                row.article_number,
              ),
            }).pipe(
              map((result: any) => {
                /*
                 * Find branch using Excel branch_name
                 */
                const branch = result.branches.find(
                  (item: any) =>
                    item.branch_name?.trim().toLowerCase() ===
                    row.branch_name?.trim().toLowerCase(),
                );

                /*
                 * Article response
                 */
                const article = result.article;
                return {
                  // Excel data
                  account: row.account,
                  state_name: row.state_name,
                  branch_name: row.branch_name,
                  stamp_type: row.stamp_type,
                  article_number: row.article_number,
                  first_party_name: row.first_party_name,
                  second_party_name: row.second_party_name,
                  description: row.description,

                  // State
                  state_code: state.state_code,

                  // Stamp
                  denomination: Number(res.content[index].denomination),

                  no_of_stamps: Number(res.content[index].no_of_stamps),

                  // Calculation
                  cessPer: res.content[index].cess,

                  cessAmount: res.content[index].cess_amount,

                  amount: res.content[index].amount,

                  balance: res.content[index].total_amount,

                  stamp_amount: res.content[index].amount,

                  // Account
                  account_id: Number(this.account_id),

                  // Branch
                  branch_id: branch?.id,

                  // Article
                  article_id: article?.id,

                  article_code: article?.article_code ?? null,

                  article_name: article?.article_name ?? null,
                };
              }),
            );
          });

          forkJoin(requests).subscribe({
            next: (data: any[]) => {
              this.isCalculating = false;

              this.previewData = data;
              this.totalAmount = this.previewData.reduce(
                (sum: number, item: any) => sum + Number(item.amount || 0),
                0,
              );
              this.showPreview = true;
              this.cdr.detectChanges();
            },

            error: (error: any) => {
              this.isCalculating = false;
              this.showToast(
                'error',
                'Something went wrong. Please try again.',
              );
            },
          });
        },
      });
  }
  closePreview(): void {
    this.showPreview = false;
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files?.[0] || null;
    this.validationErrors = [];
    this.hasValidationErrors = false;
    this.excelData = [];
  }

  uploadExcel(): void {
    this.validationErrors = [];
    this.hasValidationErrors = false;
    this.excelData = [];

    if (!this.selectedFile) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: 'array',
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        });

        this.excelData = rows.filter((row: any) =>
          Object.values(row).some((value) => value !== ''),
        );

        // Blank Excel
        if (this.excelData.length === 0) {
          this.validationErrors = [
            'Excel file is empty. Please upload a file with data.',
          ];
          this.hasValidationErrors = true;
          this.showValidationIssues = true;
          this.cdr.detectChanges();

          return;
        }
        // Header check
        const uploadedColumns = Object.keys(this.excelData[0]);

        const missingColumns = this.excelColumns.filter(
          (column) => !uploadedColumns.includes(column),
        );

        if (missingColumns.length > 0) {
          this.validationErrors = [
            'Invalid Excel format. Please upload the sample file.',
          ];
          this.hasValidationErrors = true;
          this.showValidationIssues = true;
          this.excelData = [];
          this.cdr.detectChanges();
          return;
        }

        // Row validation
        this.validationErrors = [];
        this.hasValidationErrors = false;
        const validRows = this.validateRows(this.excelData);
        if (this.validationErrors.length > 0) {
          this.hasValidationErrors = true;
          this.showValidationIssues = true;
          this.excelData = [];

          this.cdr.detectChanges();

          return;
        }

        this.excelData = validRows;
         this.showUploadedTable = true;

        this.cdr.detectChanges();
      } catch (error) {
        this.validationErrors = [
          'Invalid Excel file. Please upload a valid sample file.',
        ];

        this.hasValidationErrors = true;
        this.showValidationIssues = true;
        this.excelData = [];

        this.cdr.detectChanges();

        console.error('Excel read error:', error);
      }
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }

  goBack(): void {
       if (this.showPreview) {
    this.showPreview = false;
    return;
  }

  if (this.showUploadedTable) {
    this.showUploadedTable = false;
    return;
  }
    this.router.navigate(['/doqfy/pre-procurement/procurement-listing']);
  }

  saveBulkOrder(): void {
    const selectedReviewer = this.reviewDetails.get('reviewer')?.value || [];
    const orderReviewers = selectedReviewer.map((id: number) => ({
      reviewer_id: id,
    }));
    const data: any = {
      order_reviewers: orderReviewers,

      pre_procurement: this.previewData.map((row: any) => ({
        state_code: row.state_code,
        denomination: Number(row.denomination),
        no_of_stamps: Number(row.no_of_stamps ?? row.number_of_stamps),
        cessPer: row.cessPer,
        cessAmount: row.cessAmount,
        amount: row.amount,
        stamp_type: row.stamp_type,
        remarks: row.remarks ?? row.description,
        balance: row.balance,
        stamp_amount: row.stamp_amount,
        branch_id: Number(row.branch_id),
        article_id: Number(row.article_id),
        account_id: Number(row.account_id),
        article_code: row.article_code ?? null,
        first_party_name: row.first_party_name,
        second_party_name: row.second_party_name,
        branch_name: row.branch_name,
        article_name: row.article_name ?? null,
      })),
    };

   this.preProcurementService.createProcurmentOrder(data).subscribe({
  next: (res: any) => {
    if (res?.message === 'success') {
      this.showToast(
        'success',
        'New Order Created Successfully'
      );

      this.showPreview = false;

      setTimeout(() => {
        this.router.navigate([
          'doqfy/pre-procurement/procurement-listing'
        ]);
      }, 1500);
    } else {
      this.showToast(
        'error',
        res?.message || 'Something went wrong. Please try again.'
      );

      setTimeout(() => {
        this.router.navigate([
          'doqfy/pre-procurement/procurement-listing'
        ]);
      }, 1500);
    }
  }
});
    ;
  }

  getArticleDetails(stateCode: string, articleNumber: string): Observable<any> {
    return this.preProcurementService
      .getArticles({
        state_code: stateCode,
      })
      .pipe(
        map((res: any) => {
          const articles = res?.content || [];

          return articles.find(
            (article: any) =>
              article.article_code?.trim().toLowerCase() ===
              articleNumber?.trim().toLowerCase(),
          );
        }),
      );
  }

  getBranchDetails(stateId: number): Observable<any> {
    return this.accountManagementService
      .getBranchPerUser(this.account_id, stateId)
      .pipe(
        map((res: any) => {
          return (res?.content || []).filter(
            (branch: any) => branch.is_active === true,
          );
        }),
      );
  }

  onSaveBulkOrder(): void {
    this.saveBulkOrder();
  }

  private validateRows(rows: any[]): any[] {
    const validRows: any[] = [];

    rows.forEach((row: any, index: number) => {
      const rowNumber = index + 2;
      const errors: string[] = [];

      const stampType = row.stamp_type?.toString().trim().toUpperCase();
      const stateExists = this.statesData?.some(
        (item: any) =>
          item.state_code?.toString().trim() ===
          row.state_code?.toString().trim(),
      );

      if (!stateExists) {
        errors.push(
          `Row ${rowNumber}: Invalid state code ${row.state_code}. Please enter a valid state code`,
        );
      }
      if (
        row.denomination === null ||
        row.denomination === undefined ||
        row.denomination === '' ||
        Number(row.denomination) <= 0
      ) {
        errors.push(`Row ${rowNumber}: Please enter a valid denomination`);
      }
      // Number of stamps required
      if (
        (row.number_of_stamps === null ||
          row.number_of_stamps === undefined ||
          row.number_of_stamps.toString().trim() === '') &&
        !(
          row.stamp_type?.toString().trim().toUpperCase() === 'ESTAMP' &&
          Number(row.denomination) === 0 &&
          Number(row.number_of_stamps) === 0
        )
      ) {
        errors.push(`Row ${rowNumber}: number_of_stamps is required`);
      }

      // Stamp type required
      if (!stampType) {
        errors.push(`Row ${rowNumber}: stamp_type is required`);
      }

      // Allowed stamp types
      const validStampTypes = [
        'PHYSTMAP',
        'ESTAMP',
        'ESBTR',
        'ECHALLAN',
        'PRE_ESTAMP',
        'TRADITIONAL',
        'E_FRANKING',
      ];

      if (stampType && !validStampTypes.includes(stampType)) {
        errors.push(`Row ${rowNumber}: Invalid stamp_type ${stampType}`);
      }

      // ESTAMP / PRE_ESTAMP
      if (stampType === 'ESTAMP' || stampType === 'PRE_ESTAMP') {
        if (!row.article_number?.toString().trim()) {
          errors.push(
            `Row ${rowNumber}: article_number is required for ${stampType}`,
          );
        }

        if (!row.first_party_name?.toString().trim()) {
          errors.push(
            `Row ${rowNumber}: first_party_name is required for ${stampType}`,
          );
        }

        if (!row.second_party_name?.toString().trim()) {
          errors.push(
            `Row ${rowNumber}: second_party_name is required for ${stampType}`,
          );
        }
      }

      // E_FRANKING
      if (stampType === 'E_FRANKING') {
        if (!row.article_number?.toString().trim()) {
          errors.push(
            `Row ${rowNumber}: article_number is required for E_FRANKING`,
          );
        }

        if (!row.first_party_name?.toString().trim()) {
          errors.push(
            `Row ${rowNumber}: first_party_name is required for E_FRANKING`,
          );
        }

        // second_party_name is optional
      }

      // TRADITIONAL
      if (stampType === 'TRADITIONAL') {
        if (!row.first_party_name?.toString().trim()) {
          errors.push(
            `Row ${rowNumber}: first_party_name is required for TRADITIONAL`,
          );
        }

        // second_party_name is optional
        // article_number is optional
      }
      // Store validation errors
      if (errors.length > 0) {
        this.validationErrors.push(...errors);
      } else {
        validRows.push({
          ...row,
          stamp_type: stampType,
        });
      }
    });

    return validRows;
  }

  selectReviewer(user: any) {
    if (this.selectedReviewers.includes(user.id)) {
      this.selectedReviewers = this.selectedReviewers.filter(
        (id) => id !== user.id,
      );
    } else {
      this.selectedReviewers.push(user.id);
    }
  }

  template() {
    const base = document.baseURI;
    const fileUrl = new URL(
      'assets/Sample_Files_Bulk_Upload/bulk_pre_procurement.xlsx',
      base,
    ).href;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'bulk_pre_procurement.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  getStateName(stateCode: string): string {
    const state = this.statesData.find(
      (item: any) =>
        item.state_code?.toString().toLowerCase() ===
        stateCode?.toString().toLowerCase(),
    );

    return state?.state_name || stateCode;
  }

  getAccountSettings() {
    this.UserProfileSer.getOrderReviewConsent(this.account_id).subscribe(
      (res: any) => {
        this.autoApprover = res?.content?.auto_approver;
        if (!this.autoApprover) {
          this.getReviewers();
        }
        this.cdr.detectChanges();
      },
    );
  }
  removeFile(): void {
    this.selectedFile = null;
    this.excelData = [];
    this.validationErrors = [];
    this.hasValidationErrors = false;
  }
}
