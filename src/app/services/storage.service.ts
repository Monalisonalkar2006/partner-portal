import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { GenericHttpService } from './generic-http.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private tokenKey = 'authToken';
  private branchName = 'branchName';
  private accountId = 'account_id';
  private branchId = 'id';
  private stateName = 'stateName';
  private userName = 'userName';
  private organizationName = 'organizationName';
  private organizationId = 'organizationId';
  private roleName = 'roleName';
  private refIdConsent = 'refIdConsent';
  private loginEmail = 'loginEmail';
  private orderReviewed = 'orderReviewed';
  private otpValidation = 'otpValidation';
  private estampDefault = 'estampDefault';
  private esignDefault = 'esignDefault';
  private ssoDefault = 'ssoDefault';
  private authenticationDefault = 'authenticationDefault';
  private imageCaptureToggle = 'imageCaptureToggle';
  private enableOrderPayment = 'enableOrderPayment';
  private stampSignToggle = 'stampSignToggle';
  private stampEditToggle = 'stampEditToggle';
  private aadharToggle = 'aadharToggle';
  private autoEsignToogle = 'autoEsignToogle';
  private aadhaarMatchPercentage = 'aadhaarMatchPercentage';
  private esignExpireValidity = 'esignExpireValidity';
  private paymentStatus = 'paymentStatus';
  private paymentOrderID = 'paymentOrderID';
  private user_id = 'user_id';
  private branchUserIds = 'branchUserIds';
  private signProvider = 'Doqfy';
  private stampPlace = 'Bangalore';
  private uploadDocxFile = 'uploadDocxFile';
  private contractType: string;
  private contractNumber: string = '001';
  private fileType = 'pdf';
  private virtual_account_no = 'virtual_account_number';
  private is_wallet: string = 'is_wallet';
  private wallet_bank: string = 'wallet_bank';
  private wallet_balance: string = 'wallet_balance';
  private abclToken: string = 'abcl_token';
  private abclLogoutUrl: string = 'abcl_logout_url';
  private dropBoxEnabled = 'drop_box_enabled';
  private inventoryPaymentKey = 'inventory_payment';
  private abclMidMarket = 'abcl_mid_market';
  private sqsGroupIDKey = 'sqs_group_id';
  private refIdFileNameValidationKey = 'reference_id_with_file_name_validation';
  private syncSecondPartyAndPriceKey = 'sync_second_party_and_price';

  private accountIdSubject = new BehaviorSubject<string | null>(
    this.getStoredAccountId()
  );
  accountId$ = this.accountIdSubject.asObservable();
  branchChange: Subject<any> = new Subject<any>();
  stateChange: Subject<any> = new Subject<any>();
  getSignerValue = new Subject<any>();
  getPaymentOrderDetails = new Subject<any>();
  selectedBranch: any;
  // added proceesType to handle the wallet flow
  private processTypeSubject = new BehaviorSubject<string>('');
  processType$ = this.processTypeSubject.asObservable();

  private hidePaymentMethodSubject = new BehaviorSubject<boolean>(false);
  hidePaymentMethod$ = this.hidePaymentMethodSubject.asObservable();
  private togglesSource = new BehaviorSubject<{
    estamp: boolean;
    esign: boolean;
  }>(null);
  toggles$ = this.togglesSource.asObservable();
  private draftData: any = null;

  private inventoryPaymentSubject = new BehaviorSubject<boolean>(
    this.getStoredInventoryPayment()
  );
  inventoryPayment$ = this.inventoryPaymentSubject.asObservable();

  private abclMidMarketSubject = new BehaviorSubject<boolean>(
    this.getStoredAbclMidMarket()
  );
  abclMidMarket$ = this.abclMidMarketSubject.asObservable();

  private providerSubject = new BehaviorSubject<string>('');
  provider$ = this.providerSubject.asObservable();
  

  private stampProcessTypeSource = new BehaviorSubject<string>('');
  selectedStampProcessType$ = this.stampProcessTypeSource.asObservable();
  private paymentProviders: string[] = [];
  private selectedPaymentProvider: string = '';

  private isDraftOrderSource = new BehaviorSubject<boolean>(false);
  isDraftOrder$ = this.isDraftOrderSource.asObservable();

  constructor(public httpService: GenericHttpService) {}

  private getStoredAccountId(): string | null {
  const item = localStorage.getItem(this.accountId);
  if (!item || item === 'undefined') {
    return null;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return null;
  }
}

  private getStoredInventoryPayment(): boolean {
    const item = localStorage.getItem(this.inventoryPaymentKey);
    if (!item || item === 'undefined') {
      return false;
    }
    return item ? JSON.parse(item) : false;
  }

  private isDocumentTypeSubject = new BehaviorSubject<string>('003'); // Default to 'None'
  isDocumentType$: Observable<string> =
    this.isDocumentTypeSubject.asObservable();

  setDocumentType(type: string) {
    this.isDocumentTypeSubject.next(type);
  }

  getDocumentType(): string {
    return this.isDocumentTypeSubject.value;
  }

  getAccountId(): string | null {
    return this.accountIdSubject.value;
  }

  setAccountId(id: string): void {
    localStorage.setItem(this.accountId, JSON.stringify(id));

    this.accountIdSubject.next(id);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  setUserID(id: string): void {
    localStorage.setItem(this.user_id, id);
  }

  getUserID(): string | null {
    const item = localStorage.getItem(this.user_id);
    return item ? JSON.parse(item) : null;
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  setOrganizationId(organizationId: string): void {
    localStorage.setItem(this.organizationId, JSON.stringify(organizationId));
  }

  getOrganizationId(): string | null {
    const item = localStorage.getItem(this.organizationId);
    return item ? JSON.parse(item) : null;
  }

  getBranch(): any | null {
    const item = localStorage.getItem(this.branchName);
    if (item) {
      return JSON.parse(item) || null;
    }
  }

  setBranch(branch: any): void {
    if (branch && typeof branch === 'object') {
      localStorage.setItem(this.branchName, JSON.stringify(branch));
      this.branchChange.next(branch);
      this.selectedBranch = branch;
      this.setBranchUser();
    }
  }

  getState(): any | null {
    const item = localStorage.getItem(this.stateName);
    return item ? JSON.parse(item) : null;
  }
  getStateId(): number | null {
    const state = this.getState();
    return state?.id || null;
  }

  setState(state: string): void {
    localStorage.setItem(this.stateName, JSON.stringify(state));
    this.stateChange.next(state);
  }

  setPaymentStatus(paymentState: string): void {
    localStorage.setItem(this.paymentStatus, JSON.stringify(paymentState));
  }

  getPaymentStatus(): any {
    const item = localStorage.getItem(this.paymentStatus);
    return item ? JSON.parse(item) : null;
  }

  setOrderId(orderId: string): void {
    localStorage.setItem(this.paymentOrderID, JSON.stringify(orderId));
  }

  getOrderId(): any {
    const item = localStorage.getItem(this.paymentOrderID);
    return item ? JSON.parse(item) : null;
  }

  sendDefaultBranch(data: any) {
    return this.httpService.Post(data, '/account/default-branch/');
  }

  setBranchUser() {
    if (this.selectedBranch && this.selectedBranch.id) {
      const data = { branch_id: this.selectedBranch.id };
      this.setBranchId(this.selectedBranch.id);
      this.sendDefaultBranch(data).subscribe((res) => {});
    }
  }

  getBranchChangeObservable() {
    return this.branchChange;
  }

  getStateChangeObservable() {
    return this.stateChange;
  }

  clearStorage(): void {
    localStorage.clear();
  }

  getBranchId(): string | null {
    const item = localStorage.getItem(this.branchId);
    return item ? JSON.parse(item) : null;
  }

  setBranchId(id: string): void {
    localStorage.setItem(this.branchId, JSON.stringify(id));
  }

  getLoginEmail(): any[] | null {
    const item = localStorage.getItem(this.loginEmail);
    return item ? JSON.parse(item) : null;
  }

  setLoginEmail(email: any): void {
    localStorage.setItem(this.loginEmail, JSON.stringify(email));
  }

  getUser(): string | null {
    const item = localStorage.getItem(this.userName);
    return item ? JSON.parse(item) : null;
  }

  setUser(user: string): void {
    localStorage.setItem(this.userName, JSON.stringify(user));
  }

  getOrganization(): string | null {
    const item = localStorage.getItem(this.organizationName);
    return item ? JSON.parse(item) : null;
  }

  setOrganization(organization: string): void {
    localStorage.setItem(this.organizationName, JSON.stringify(organization));
  }

  getRole(): string | null {
    const item = localStorage.getItem(this.roleName);
    return item ? JSON.parse(item) : null;
  }

  setRole(role: string): void {
    localStorage.setItem(this.roleName, JSON.stringify(role));
  }

  getRefIdConsent(): boolean | null {
    const item = localStorage.getItem(this.refIdConsent);
    return item ? JSON.parse(item) : null;
  }

  setRefIdConsent(ref: string): void {
    localStorage.setItem(this.refIdConsent, JSON.stringify(ref));
  }

  getOrderReviewConsent(): boolean | null {
    const item = localStorage.getItem(this.orderReviewed);
    return item ? JSON.parse(item) : null;
  }

  setOrderReviewConsent(review: string): void {
    localStorage.setItem(this.orderReviewed, JSON.stringify(review));
  }

  getOtpValidation(): boolean | null {
    const item = localStorage.getItem(this.otpValidation);
    return item ? JSON.parse(item) : null;
  }

  setOtpValidation(otpValidation: string): void {
    localStorage.setItem(this.otpValidation, JSON.stringify(otpValidation));
  }

  getEstampDefault(): any {
    const item = localStorage.getItem(this.estampDefault);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      return parsed;
    } catch (e) {
      return item === 'true';
    }
  }

  setEstampDefault(estampDefault: string): void {
    localStorage.setItem(this.estampDefault, JSON.stringify(estampDefault));
  }

  getEsignDefault(): any {
    const item = localStorage.getItem(this.esignDefault);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      return parsed;
    } catch (e) {
      return item === 'true';
    }
  }

  setEsignDefault(esignDefault: string): void {
    localStorage.setItem(this.esignDefault, JSON.stringify(esignDefault));
  }

  getSsoDefault(): boolean | null {
    const item = localStorage.getItem(this.ssoDefault);
    return item ? JSON.parse(item) : null;
  }

  setSsoDefault(ssoDefault: any): void {
    localStorage.setItem(this.ssoDefault, JSON.stringify(ssoDefault));
  }

  getAuthenticationDefault(): boolean | null {
    const item = localStorage.getItem(this.authenticationDefault);
    return item ? JSON.parse(item) : null;
  }
  setAuthenticationDefault(authenticationDefault: string) {
    localStorage.setItem(
      this.authenticationDefault,
      JSON.stringify(authenticationDefault)
    );
  }
  setUploadDocxFile(isUploadDocxFile: string) {
    localStorage.setItem(this.uploadDocxFile, JSON.stringify(isUploadDocxFile));
  }
  getUploadDocxFile() {
    const item = localStorage.getItem(this.uploadDocxFile);
    return item ? JSON.parse(item) : null;
  }
  getSignatoryImageCapture(): boolean | null {
    const item = localStorage.getItem(this.imageCaptureToggle);
    return item ? JSON.parse(item) : null;
  }

  setSignatoryImageCapture(imageCaptureToggle: string): void {
    localStorage.setItem(
      this.imageCaptureToggle,
      JSON.stringify(imageCaptureToggle)
    );
  }

  getOrderPayment(): boolean | null {
    const item = localStorage.getItem(this.enableOrderPayment);
    return item ? JSON.parse(item) : null;
  }

  setOrderPayment(enableOrderPayment: string): void {
    localStorage.setItem(
      this.enableOrderPayment,
      JSON.stringify(enableOrderPayment)
    );
  }

  getStampSignatory(): boolean | null {
    const item = localStorage.getItem(this.stampSignToggle);
    return item ? JSON.parse(item) : null;
  }

  setStampSignatory(stampSignToggle: string): void {
    localStorage.setItem(this.stampSignToggle, JSON.stringify(stampSignToggle));
  }

  getDocumentToBeStamped(): boolean | null {
    const item = localStorage.getItem('documentToBeStamped');
    return item ? JSON.parse(item) : null;
  }

  setDocumentToBeStamped(documentToBeStamped: boolean): void {
    localStorage.setItem(
      'documentToBeStamped',
      JSON.stringify(documentToBeStamped)
    );
  }

  getStampEdit(): boolean | null {
    const item = localStorage.getItem(this.stampEditToggle);
    return item ? JSON.parse(item) : null;
  }

  setStampEdit(stampEditToggle: string): void {
    localStorage.setItem(this.stampEditToggle, JSON.stringify(stampEditToggle));
  }

  setAdharEdit(aadharToggle: string): void {
    localStorage.setItem(this.aadharToggle, JSON.stringify(aadharToggle));
  }

  getAdharEdit(): boolean {
    const item = localStorage.getItem('aadharToggle');
    if (item) {
      try {
        return JSON.parse(item);
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  setAutoEsignEdit(autoEsignToogle: string) {
    localStorage.setItem(this.autoEsignToogle, JSON.stringify(autoEsignToogle));
  }

  setAadhaarMatchPercentage(aadhaarMatchPercentage: number) {
    localStorage.setItem(
      this.aadhaarMatchPercentage,
      JSON.stringify(aadhaarMatchPercentage)
    );
  }

  getAadhaarMatchPercentage() {
    const item = localStorage.getItem(this.aadhaarMatchPercentage);
    return item ? JSON.parse(item) : null;
  }

  setEsignExpireValidity(esignExpireValidity: number) {
    localStorage.setItem(
      this.esignExpireValidity,
      JSON.stringify(esignExpireValidity)
    );
  }

  getEsignExpireValidity() {
    const item = localStorage.getItem(this.esignExpireValidity);
    return item ? JSON.parse(item) : null;
  }

  getAutoEsignEdit(): boolean {
    const item = localStorage.getItem(this.autoEsignToogle);
    return item ? JSON.parse(item) : null;
  }
  //-------------------------------Sign Providers --------------------------------------------//

  getSignProvider(): any[] | null {
    const item = localStorage.getItem(this.signProvider);
    return item ? JSON.parse(item) : null;
  }

  setSignProvider(provider: any): void {
    localStorage.setItem(this.signProvider, JSON.stringify(provider));
  }

  getPlace(): any[] | null {
    const item = localStorage.getItem(this.stampPlace);
    return item ? JSON.parse(item) : null;
  }

  setPlace(place: any): void {
    localStorage.setItem(this.stampPlace, JSON.stringify(place));
  }

  //-----------------------------------------------------------------------------------------------------------------------//

  //---------------------------------Uploaded Doc
  getfileType(): any {
    return localStorage.getItem(this.fileType);
  }

  setfiletype(type: any): void {
    localStorage.setItem(this.fileType, type);
  }

  //-------------------------------------------------COntract type Upload -------------------------------------------------//

  getContractType(): boolean | null {
    const value = localStorage.getItem(this.contractType);
    return value === null ? null : value === 'true'; // Explicitly ensure the default is null
  }

  setContractType(type: boolean): void {
    localStorage.setItem(this.contractType, type.toString());
  }

  getContractNumber(): string {
    return localStorage.getItem(this.contractNumber); // Explicitly ensure the default is null
  }

  setContractNumbere(type: string): void {
    localStorage.setItem(this.contractNumber, type.toString());
  }

  setVirtualAccountNumber(virtual_account_no: string) {
    localStorage.setItem(this.virtual_account_no, virtual_account_no);
  }

  getVirtualAccountNumber(): string {
    return localStorage.getItem(this.virtual_account_no);
  }

  setIsWallet(is_wallet: boolean) {
    localStorage.setItem('is_wallet', is_wallet.toString());
  }

  getIsWallet(): boolean {
    const is_wallet = localStorage.getItem('is_wallet');
    if (is_wallet) {
      return JSON.parse(is_wallet);
    }
    return false;
  }

  setWalletBank(wallet_bank: string) {
    localStorage.setItem(this.wallet_bank, wallet_bank);
  }

  getWalletBank(): string {
    return localStorage.getItem(this.wallet_bank);
  }

  setWalletBalance(balance: any) {
    localStorage.setItem(this.wallet_balance, balance.toString());
  }

  getWalletBalance() {
    const balance = localStorage.getItem(this.wallet_balance);
    return JSON.parse(balance);
  }

  setProcessType(processType: string) {
    this.processTypeSubject.next(processType);
  }

  getProcessType(): string {
    return this.processTypeSubject.value;
  }

  setHidePaymentMethod(processType: boolean) {
    this.hidePaymentMethodSubject.next(processType);
  }

  getHidePaymentMethod(): boolean {
    return this.hidePaymentMethodSubject.value;
  }

  setInventoryPayment(inventoryPayment: boolean) {
    localStorage.setItem(
      this.inventoryPaymentKey,
      JSON.stringify(inventoryPayment)
    );
    this.inventoryPaymentSubject.next(inventoryPayment);
  }

  setAbclMidMarket(abclMidMarket: boolean) {
    localStorage.setItem(
      this.abclMidMarket,
      JSON.stringify(abclMidMarket)
    );
    this.abclMidMarketSubject.next(abclMidMarket);
  }
  private getStoredAbclMidMarket(): boolean {
    const item = localStorage.getItem(this.abclMidMarket);
    if (!item || item === 'undefined') {
      return false;
    }
    return item ? JSON.parse(item) : false;
  }

  getAbclMidMarket(): boolean {
    return this.abclMidMarketSubject.value;
  }

  getInventoryPayment(): boolean {
    return this.inventoryPaymentSubject.value;
  }

  setABCLToken(token: string): void {
    localStorage.setItem(this.abclToken, JSON.stringify(token));
  }
  getABCLToken(): string | null {
    const item = localStorage.getItem(this.abclToken);
    return item ? JSON.parse(item) : null;
  }
  setABCLLogoutUrl(logoutUrl: string): void {
    localStorage.setItem(this.abclLogoutUrl, JSON.stringify(logoutUrl));
  }
  getABCLLogoutUrl(): string | null {
    const item = localStorage.getItem(this.abclLogoutUrl);
    return item ? JSON.parse(item) : null;
  }

  //------------------------------------------------- dropBoxEnabled -------------------------------------------------//

  getDropBoxEnabled(): boolean {
    const value = localStorage.getItem(this.dropBoxEnabled);
    if (!value || value === 'undefined') {
      return false;
    }
    try {
      return JSON.parse(value);
    } catch {
      return false;
    }
  }

  setDropBoxEnabled(enabled: boolean): void {
    localStorage.setItem(this.dropBoxEnabled, JSON.stringify(enabled));
  }

  clearDropboxData(): void {
    localStorage.removeItem(this.dropBoxEnabled);
  }

  //------------------------------------------------- syncSecondPartyAndPrice -------------------------------------------------//

  getSyncSecondPartyAndPrice(): boolean {
    const value = localStorage.getItem(this.syncSecondPartyAndPriceKey);
    if (!value || value === 'undefined') {
      return false;
    }
    try {
      return JSON.parse(value);
    } catch {
      return false;
    }
  }

  setSyncSecondPartyAndPrice(enabled: boolean): void {
    localStorage.setItem(this.syncSecondPartyAndPriceKey, JSON.stringify(!!enabled));
  }

  setDraftData(data: any): void {
    this.draftData = data;
  }

  getDraftData(): any {
    return this.draftData;
  }

  clearDraftData(): void {
    this.draftData = null;
  }

  disableToggles() {
    this.togglesSource.next({ estamp: false, esign: false });
  }
  setSqsGroupID(sqsGroupID: string): void {
    localStorage.setItem(this.sqsGroupIDKey, JSON.stringify(sqsGroupID));
  }
  getSqsGroupID(): string | null {
    const item = localStorage.getItem(this.sqsGroupIDKey);
    return item ? JSON.parse(item) : null;
  }

  updateStampProcessType(type: string) {
    this.stampProcessTypeSource.next(type);
  }

  setEditPdf(value: any) {
    // If value is null, undefined, or false, it saves "false"
    const safeValue = value ? true : false; 
    localStorage.setItem('edit_pdf', JSON.stringify(safeValue));
  }

  getEditPdf(): boolean {
    const data = localStorage.getItem('edit_pdf');
    // If the key doesn't exist at all, return false
    if (!data) return false;
    
    try {
      return JSON.parse(data) === true;
    } catch (e) {
      return false; // Safety catch for malformed data
    }

  }

  setDraftMode(isDraft: boolean) {
    this.isDraftOrderSource.next(isDraft);
  }
  
  setPaymentProviders(providers: string[]) {
    this.paymentProviders = providers;
    localStorage.setItem('paymentProviders', JSON.stringify(providers));
  }

  getPaymentProviders(): string[] {
    const stored = localStorage.getItem('paymentProviders');
    return stored ? JSON.parse(stored) : [];
  }

  setSelectedProvider(provider: string) {
    this.providerSubject.next(provider);
    localStorage.setItem('selectedProvider', provider);
  }

  getSelectedProvider(): string {
    return this.providerSubject.getValue();
  }

  setCloudSign(value: boolean) {
  localStorage.setItem('cloud_sign', JSON.stringify(value));
}

  getCloudSign(): boolean {
    const val = localStorage.getItem('cloud_sign');
    return val ? JSON.parse(val) : false;
  }

  setAuthorisedSignature(value: boolean) {
    localStorage.setItem('is_authorized_signature', JSON.stringify(value));
  }

  getAuthorisedSignature(): boolean {
    const val = localStorage.getItem('is_authorized_signature');
    return val ? JSON.parse(val) : false;
  }

  setInfiniteCorp(value: boolean) {
    if (value === undefined || value === null) {
      localStorage.removeItem('default_esign');
      return;
    }
    localStorage.setItem('default_esign', JSON.stringify(value));
  }

  setRefIdWithFileNameValidation(value: boolean): void {
    localStorage.setItem(this.refIdFileNameValidationKey, JSON.stringify(value));
  }

  getRefIdWithFileNameValidation(): boolean {
    const item = localStorage.getItem(this.refIdFileNameValidationKey);
    if (!item || item === 'undefined') return false;
    try {
      return JSON.parse(item) === true;
    } catch { return false; }
  }

  getInfiniteCorp(): boolean {
    const value = localStorage.getItem('default_esign');
    if (!value || value === 'undefined' || value === 'null') {
      return false;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      return false;
    }
  }

}
