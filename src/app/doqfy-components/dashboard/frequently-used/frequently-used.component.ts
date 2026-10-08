import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import SignaturePad from 'signature_pad';
import { ESignService } from 'src/app/services/e-sign.service';
import { ImageGeneratorService } from 'src/app/services/image-generator.service';
import { StorageService } from 'src/app/services/storage.service';
@Component({
    selector: 'app-frequently-used',
    templateUrl: './frequently-used.component.html',
    styleUrls: ['./frequently-used.component.scss'],
    standalone: false
})
export class FrequentlyUsedComponent implements OnInit {
  @ViewChild('signPadCanvas', { static: false })
  signaturePadElement: ElementRef;
  signatoryDetails: any = {};
  signOption: string = 'select';
  selectedStyle: string = "italic 70px 'Brush Script MT', cursive";
  selectedName: string;
  imageStyle: string | ArrayBuffer;
  signStyle = [
    { name: 'Comic Sans', code: "italic 10px 'Comic Sans MS', cursive" },
    { name: 'Brush Script', code: "italic 10px 'Brush Script MT', cursive" },
    {
      name: 'Lucida Calligraphy',
      code: "italic 10px 'Lucida Calligraphy', cursive",
    },
    { name: 'Apple Chancery', code: "italic 10px 'Apple Chancery', cursive" },
    { name: 'Arial', code: 'italic 10px Arial, sans-serif' },
    { name: 'Times New Roman', code: "italic 10px 'Times New Roman', serif" },
    { name: 'Cambria', code: 'italic 10px Cambria, serif' },
    { name: 'Fantasy', code: 'italic 10px Fantasy, sans-serif' },
    { name: 'Monospace', code: "italic 10px 'Courier New', monospace" },
    { name: 'Verdana', code: 'italic 10px Verdana, sans-serif' },
    { name: 'Georgia', code: 'italic 10px Georgia, serif' },
    { name: 'Helvetica', code: 'italic 10px Helvetica, sans-serif' },
    { name: 'Impact', code: 'italic 10px Impact, sans-serif' },
    { name: 'Lucida Console', code: "italic 10px 'Lucida Console', monospace" },
    { name: 'Palatino', code: "italic 10px 'Palatino Linotype', serif" },
    { name: 'Courier', code: "italic 10px 'Courier New', monospace" },
    { name: 'Garamond', code: "italic 10px 'Adobe Garamond Pro', serif" },
    { name: 'Bookman', code: "italic 10px 'Bookman Old Style', serif" },
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
  signatureResponse: any;
  addNewSignature: boolean;
  orderDetailsData: any;
  OrderData: any;
  totalOrders: any;
  constructor(
    private messageService: MessageService,
    private modalService: NgbModal,
    private storageService: StorageService,
    private spinner: NgxSpinnerService,
    private eSignService: ESignService,
    private router: Router,
    private imageGeneratorService: ImageGeneratorService,
    private cdr: ChangeDetectorRef
  ) {
    this.signatoryDetails.name = this.storageService.getUser();
    this.selectTextSign('Name', 'Brush Script MT');
  }
  selectTextSign(value: string, style: string) {
    this.selectedStyle = 'italic 70px ' + style + ', cursive';
    if (value === 'Name') {
      this.selectedName = this.signatoryDetails.name;
      this.textToImage(this.selectedName, this.selectedStyle);
    }
  }
  textToImage(textToConvert: any, style: string) {
    this.imageStyle = this.imageGeneratorService.generateImage(
      textToConvert,
      style
    );
  }
  getStyleType() {
    this.textToImage(this.selectedName, this.selectedStyle);
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
          this.base64Image = this.signatureResponse.content[0].signature;
        }
      }
      this.cdr.detectChanges();
    });
  }
  onFileChange(event: any) {
    let files = event.target.files;
    this.selectedFile = files[0];
    this.fileName = files[0].name;

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
    };
    this.eSignService.uploadServersideSign(payload).subscribe((res) => {
      if (res) {
        this.getSign();
        this.messageService.add({
          severity: 'success',
          summary: 'Signature',
          detail: 'User signature uploaded successfully',
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
  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterDate']) {
      this.orderDetailsData = changes['filterDate'].currentValue['orderData'];
      this.OrderData = this.orderDetailsData.order;
      this.totalOrders = this.OrderData.total_order.count;
    }
  }
}
