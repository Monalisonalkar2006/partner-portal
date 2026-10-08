import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import { UserManagementService } from 'src/app/services/user-management.service';
import moment from 'moment';
import { ImageGeneratorService } from 'src/app/services/image-generator.service';
import { MessageService } from 'primeng/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import SignaturePad from 'signature_pad';
import { StorageService } from 'src/app/services/storage.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ESignService } from 'src/app/services/e-sign.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-frequently-used',
    templateUrl: './admin-frequently-used.component.html',
    styleUrls: ['./admin-frequently-used.component.scss'],
    standalone: false
})
export class AdminFrequentlyUsedComponent implements OnInit {
  @ViewChild('signPadCanvas', { static: false })
  signaturePadElement: ElementRef;
  OrderData: any = [];
  totalOrders: any;
  userDetails: any;
  userCount: number;
  currentDate = new Date();
  startDate: string;
  endDate: string;
  @Input() filterDate: any = [];
  orderDetailsData: any = [];
  signatoryDetails: any = {};
  originalSignatoryName: string | null = null;
  signOption: string = 'select';
  selectedStyle: string = "italic 70px 'Brush Script MT', cursive";
  selectedName: string;
  imageStyle: string | ArrayBuffer;
  signStyle = [
    { name: 'Comic Sans', code: "italic 50px 'Comic Sans MS', cursive" },
    { name: 'Brush Script', code: "italic 50px 'Brush Script MT', cursive" },
    {
      name: 'Lucida Calligraphy',
      code: "italic 50px 'Lucida Calligraphy', cursive",
    },
    { name: 'Apple Chancery', code: "italic 50px 'Apple Chancery', cursive" },
    { name: 'Arial', code: 'italic 50px Arial, sans-serif' },
    { name: 'Times New Roman', code: "italic 50px 'Times New Roman', serif" },
    { name: 'Cambria', code: 'italic 50px Cambria, serif' },
    { name: 'Fantasy', code: 'italic 50px Fantasy, sans-serif' },
    { name: 'Monospace', code: "italic 50px 'Courier New', monospace" },
    { name: 'Verdana', code: 'italic 50px Verdana, sans-serif' },
    { name: 'Georgia', code: 'italic 50px Georgia, serif' },
    { name: 'Helvetica', code: 'italic 50px Helvetica, sans-serif' },
    { name: 'Impact', code: 'italic 50px Impact, sans-serif' },
    { name: 'Lucida Console', code: "italic 50px 'Lucida Console', monospace" },
    { name: 'Palatino', code: "italic 50px 'Palatino Linotype', serif" },
    { name: 'Courier', code: "italic 50px 'Courier New', monospace" },
    { name: 'Garamond', code: "italic 50px 'Adobe Garamond Pro', serif" },
    { name: 'Bookman', code: "italic 50px 'Bookman Old Style', serif" },
  ];
  pdfSource: any;
  selectedFile: string;
  fileName: string = 'Upload Img';
  signImage: any;
  enableCaptureImage: boolean = true;
  showWebcam: boolean;
  signPad: any;
  signatoryId: string;
  numPdfPages: any;
  positionDetails: any = [];
  pageHeight: number;
  base64Image: any;
  savedSignatureName: string | null = null;
  signatureResponse: any;
  addNewSignature: boolean;
  constructor(
    private userDashboardService: UserDashboardService,
    private userManagementService: UserManagementService,
    private imageGeneratorService: ImageGeneratorService,
    private messageService: MessageService,
    private modalService: NgbModal,
    private storageService: StorageService,
    private spinner: NgxSpinnerService,
    private eSignService: ESignService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.signatoryDetails.name = this.storageService.getUser();
    this.originalSignatoryName = this.signatoryDetails.name;
    this.getUserData();
    this.startDate = moment(this.currentDate)
      .subtract(0, 'days')
      .format('YYYY-MM-DD');
    this.endDate = moment(this.currentDate).format('YYYY-MM-DD');
    this.selectTextSign('Name', 'Brush Script MT');
  }
  selectTextSign(value: string, style: string) {
    this.selectedStyle = 'italic 70px ' + style + ', cursive';
    if (value === 'Name') {
      this.selectedName = this.signatoryDetails.name;
      this.textToImage(this.selectedName, this.selectedStyle);
    }
  }
  getStyleType() {
    this.textToImage(this.selectedName, this.selectedStyle);
  }
  textToImage(textToConvert: any, style: string) {
    if (textToConvert && textToConvert.trim()) {
      const text = textToConvert.trim();
      let adjustedStyle = style;

      // Adjust font size based on text length
      if (text.length > 17) {
        // Calculate new font size based on text length
        const baseFontSize = 70;
        const maxLength = 17;
        const scaleFactor = Math.min(1, maxLength / text.length);
        const newFontSize = Math.max(30, baseFontSize * scaleFactor); // Minimum 30px

        // Replace the font size in the style string
        adjustedStyle = style.replace(/\d+px/, `${Math.floor(newFontSize)}px`);
      }

      this.imageStyle = this.imageGeneratorService.generateImage(
        text,
        adjustedStyle
      );
    } else {
      this.imageStyle = null;
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterDate'].currentValue) {
      this.orderDetailsData = changes['filterDate'].currentValue['orderData'];
      this.OrderData = this.orderDetailsData.order;
      this.totalOrders = this.OrderData.total_order.count;
    }
  }
  ngOnInit(): void {
    this.getSign();
  }
  getSign() {
    const user_id = this.storageService.getUserID();
    this.eSignService.getServerSideSign(user_id).subscribe((res: any) => {
      if (res) {
        if (res.message == 'No data found') {
          this.addNewSignature = true;
        } else {
          this.addNewSignature = false;
          this.signatureResponse = res;
          const savedSignature = this.signatureResponse.content[0];
          this.base64Image = savedSignature.signature;
          this.savedSignatureName = savedSignature.signatureName || null;
          if (this.signOption === 'saved' && this.savedSignatureName) {
            this.signatoryDetails.name = this.savedSignatureName;
            this.selectedName = this.savedSignatureName;
          }
        }
      }
      this.cdr.detectChanges();
    });
  }
  
  selectSavedSignatureTab() {
    this.signOption = 'saved';
    this.getSign();
    if (this.savedSignatureName) {
      this.signatoryDetails.name = this.savedSignatureName;
      this.selectedName = this.savedSignatureName;
    }
  }

  selectSignatureTab(option: string) {
    this.signOption = option;
    this.signatoryDetails.name = this.originalSignatoryName;
    this.selectedName = this.originalSignatoryName;
    if (this.selectedStyle) {
      this.imageStyle = this.generateWrappedTextImage(
        this.signatoryDetails.name,
        this.selectedStyle,
      );
    }
  }

  getUserData() {
    const search = '';
    this.userManagementService.getUsersDetails(search).subscribe((res) => {
      this.userDetails = res['content'];
      this.userCount = res.pagination.total_records;
      this.cdr.detectChanges();
    });
  }
  onFileChange(event: any) {
    let files = event.target.files;
    this.selectedFile = files[0];
    // this.fileName = files[0].name;

    let fullFileName = files[0].name;
    this.fileName =
      fullFileName.length > 30
        ? fullFileName.substring(0, 30) + '...'
        : fullFileName;

    let selectedFile = files[0];
    let fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'bmp'];

    // Check if the file extension is valid
    if (allowedExtensions.indexOf(fileExtension) === -1) {
      this.messageService.add({
        severity: 'warning',
        summary: 'Image Type',
        detail: 'Invalid file type. Please select a JPEG, PNG, or BMP image.',
      });

      event.target.value = ''; // Clear the file input
      return;
    }

    const fileSize = files[0].size / 1024 / 1024;
    if (fileSize > 10) {
      this.messageService.add({
        severity: 'warning',
        summary: 'Image Type',
        detail: 'File should be less than 10MB in size',
      });

      const inputElement = <HTMLInputElement>(
        document.getElementById('upload_file')
      );
      inputElement.value = '';
      return;
    }

    let splitName = files[0].name.split('.');
    if (splitName.length > 2) {
      this.messageService.add({
        severity: 'warning',
        summary: 'Image Type',
        detail: 'File name should have only single extension',
      });

      const inputElement = <HTMLInputElement>(
        document.getElementById('upload_file')
      );
      inputElement.value = '';
      return;
    }

    let $img: any = document.querySelector('#upload_file');

    if (typeof FileReader !== 'undefined') {
      let reader = new FileReader();

      reader.onload = (e: any) => {
        // Get the base64-encoded string

        this.pdfSource = e.target.result;
        this.cdr.detectChanges();
      };

      // Read the file as Data URL (base64)
      reader.readAsDataURL(files[0]);
    }
  }
  saveImage() {
    if (this.signOption === 'select') {
      this.saveStylingImage();
    } else if (this.signOption === 'draw') {
      this.saveSignPad();
    } else if (this.signOption === 'upload') {
      if (this.pdfSource) {
        this.saveUploadImage();
      } else {
        this.messageService.add({
          severity: 'warning',
          summary: 'SignIng',
          detail: 'Please Sign the document to Finish',
        });
        this.modalService.dismissAll();
      }
    } else if (this.signOption === 'saved') {
      if (!this.base64Image) {
        this.messageService.add({
          severity: 'warning',
          summary: 'SignIng',
          detail: 'No saved signature found',
        });
      }
      this.modalService.dismissAll();
    }
  }
  saveStylingImage() {
    this.signImage = this.imageStyle;
    this.getCodedImage(this.signImage);
  }
  saveSignPad() {
    const base64ImageData = this.signPad.toDataURL();
    if (base64ImageData) {
      this.getCodedImage(base64ImageData);
    } else {
      this.messageService.add({
        severity: 'warning',
        summary: 'SignIng',
        detail: 'Please Sign the document to Finish',
      });
      this.modalService.dismissAll();
    }
  }
  async getCodedImage(baseImage) {
    try {
      const modifiedImage = await this.imageGeneratorService.addSignature(baseImage);
      this.signImage = modifiedImage;
      this.SubmitSign(this.signImage);
    } catch (error) {
      console.error('Error generating signature image:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Signature',
        detail: 'Unable to process signature image. Please try again.',
      });
    }
  }
  saveUploadImage() {
    this.signImage = this.pdfSource;
    this.getCodedImage(this.signImage);
  }
  closeModel() {
    this.clearFile();
    this.modalService.dismissAll();
  }
  clearFile() {
    this.selectedFile = '';
    this.fileName = 'Upload Img';
    const inputElement = <HTMLInputElement>(
      document.getElementById('upload_file')
    );
    inputElement.value = null;
    this.pdfSource = null;
  }
  clearImage() {
    if (this.signOption === 'select') {
      this.clearStyle();
    } else if (this.signOption === 'draw') {
      this.clearSignPad();
    } else if (this.signOption === 'upload') {
      this.clearFile();
    }
  }
  clearStyle() {}
  clearSignPad() {
    this.signPad.clear();
  }

  ngAfterViewInit() {
    this.signPad = new SignaturePad(this.signaturePadElement.nativeElement);
  }
  SubmitSign(image) {
    let payload = {
      user_id: this.storageService.getUserID(),
      signature: image.replace(/^data:image\/png;base64,/, ''),
      signatureName: this.signatoryDetails.name,
    };
    this.eSignService.uploadServersideSign(payload).subscribe((res: any) => {
      if (res) {
        this.addNewSignature = false;
        this.base64Image = payload.signature;
        this.messageService.add({
          severity: 'success',
          summary: 'Signature',
          detail: res.message,
        });
      }
    });
  }
  getXandYCoordinates(item) {
    const exampleBoundary = document.querySelector('.example-boundary');
    const boundaryStyles = window.getComputedStyle(exampleBoundary);
    const boundaryHeight = parseFloat(boundaryStyles.height);
    const translateY = Math.floor(
      boundaryHeight - this.convertPtToPx(item.y1) - 180
    );
    if (this.pageHeight < 1100 && translateY < 0) {
      item.y1 = this.pageHeight - 350;
      item.y2 = this.pageHeight - 200;
    }
  }
  convertPtToPx(pt: number) {
    return (4 / 3) * pt;
  }
  onNameChange() {
  if (this.signatoryDetails.name) {
    this.signatoryDetails.name = this.signatoryDetails.name
      .replace(/[^A-Za-z0-9. ]/g, '')
      .substring(0, 30); 
  }
    this.selectedName = this.signatoryDetails.name;

    // Auto-update image if we're in select mode and have a selected style
    if (this.signOption === 'select' && this.selectedStyle) {
      // Use canvas-based text wrapping for better control
      this.imageStyle = this.generateWrappedTextImage(
        this.signatoryDetails.name,
        this.selectedStyle
      );
    }
  }
  generateWrappedTextImage(text: string, style: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // Set canvas dimensions to match your image preview
    canvas.width = 400;
    canvas.height = 100;

    // Set background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Extract font size and family from style
    const fontSizeMatch = style.match(/(\d+)px/);
    let fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 70;
    const fontFamilyMatch = style.match(/(?:italic\s+)?(?:\d+px\s+)?(.+)/);
    const fontFamily = fontFamilyMatch ? fontFamilyMatch[1] : 'cursive';

    // Set text properties
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate optimal font size for the text to fit
    const maxWidth = canvas.width - 20; // 50px padding on each side
    const maxHeight = canvas.height - 20; // 50px padding top and bottom

    // Function to wrap text
    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    // Adjust font size to fit text
    let lines: string[] = [];
    do {
      ctx.font = `italic ${fontSize}px ${fontFamily}`;
      lines = wrapText(text, maxWidth);

      // Check if text fits in height
      const totalHeight = lines.length * fontSize * 1.2; // 1.2 for line spacing
      if (totalHeight > maxHeight && fontSize > 20) {
        fontSize -= 2;
      } else {
        break;
      }
    } while (fontSize > 20);

    // Draw the wrapped text
    const lineHeight = fontSize * 1.2;
    const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      ctx.fillText(line, canvas.width / 2, y);
    });

    return canvas.toDataURL();
  }
}
