import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root',
})
export class ImageGeneratorService {
  // Blank frame for an authorized  Aadhaar/DSC signatory: "For: {name}" on
  // top, empty middle for the eventual emudhra signature, "Authorised
  // Signatory" on the bottom. Pixel size doesn't need to match the final
  // placement box — pdf-lib stretches it to fit when drawn onto the page.
  generateAuthorisedFrame(authorisedFor: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1a56db';

    ctx.font = 'bold 24px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText(`For ${authorisedFor}`, 5, 5);

    ctx.font = 'bold 22px Arial';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Authorised Signatory', 5, canvas.height - 5);

    return canvas.toDataURL('image/png');
  }

  generateAuthorisedFrameWithSignature(base64Image: string, authorisedFor: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 260;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Failed to get canvas context');
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const topLabelHeight = 32;
        const bottomLabelHeight = 32;
        const sideMargin = 5;
        const availableWidth = canvas.width - sideMargin * 2;
        const availableHeight = canvas.height - topLabelHeight - bottomLabelHeight;

        const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const drawX = (canvas.width - drawWidth) / 2;
        const drawY = topLabelHeight + (availableHeight - drawHeight) / 2;

        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        ctx.fillStyle = '#1a56db';
        ctx.textAlign = 'left';

      
        ctx.font = 'bold 34px Arial';
        ctx.textBaseline = 'top';
        ctx.fillText(`For ${authorisedFor}`, 5, 3);

        ctx.font = 'bold 32px Arial';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Authorised Signatory', 5, canvas.height - 3);

        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => {
        reject('Failed to load image');
      };

      image.src = base64Image;
    });
  }

  async mergeAuthorisedFramesIntoPdf(pdfBase64: string, parties: any[]): Promise<string> {
    const authorisedParties = (parties || []).filter(
      (party: any) =>
        party?.is_authorised &&
        party?.authorised_for &&
        ['AADHAAR', 'DSC'].includes((party.method || '').toUpperCase()),
    );

    if (authorisedParties.length === 0) {
      return pdfBase64;
    }

    // pdfBase64 sometimes arrives as a full `data:application/pdf;base64,...`
    // URI rather than raw base64, depending on the upload flow — strip the
    // prefix (and any stray whitespace) before decoding either way.
    const cleanedPdfBase64 = (pdfBase64.includes(',') ? pdfBase64.split(',').pop() : pdfBase64).replace(/\s/g, '');
    const pdfBytes = Uint8Array.from(atob(cleanedPdfBase64), (c) => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    for (const party of authorisedParties) {
      const frameDataUrl = this.generateAuthorisedFrame(party.authorised_for);
      const frameBytes = Uint8Array.from(
        atob(frameDataUrl.split(',')[1]),
        (c) => c.charCodeAt(0),
      );
      const embeddedImage = await pdfDoc.embedPng(frameBytes);

      for (const [pageKey, boxes] of Object.entries(party.position_details || {})) {
        const page = pages[Number(pageKey) - 1];
        if (!page || !Array.isArray(boxes)) continue;

        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();

        for (const box of boxes as any[]) {
          // One fixed absolute size for every placement type — Predefined
          // (~119x50pt) and Drag & Drop (fixed 75x45pt) boxes are naturally
          // different sizes, but the frame no longer scales with the box, so
          // both end up identical regardless of which one produced the box.
          let width = 140;
          let height = 65;

          const bottomPadding = 15;
          const x = box.x1;
          const y = box.y1 - bottomPadding;

          const fitScale = Math.min(
            1,
            (pageWidth - x) / width,
            (pageHeight - y) / height,
          );
          if (fitScale < 1) {
            width *= fitScale;
            height *= fitScale;
          }

          if (width > 0 && height > 0) {
            page.drawImage(embeddedImage, { x, y, width, height });
          }
        }
      }
    }

    return pdfDoc.saveAsBase64();
  }
  generateImage(
    text: string,
    style: string,
    width: number = 600,
    height: number = 250
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Set semi-transparent white background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.font = style;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Draw text with a margin of 20 pixels from the left
    ctx.fillText(text, 20, canvas.height / 2);

    // Convert the canvas content to a data URL in PNG format with the specified background and text color
    return canvas.toDataURL('image/png');
  }

  async addBordersAndText(
    base64Image: string,
    topText: string,
    bottomText: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 200;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Failed to get canvas context');
          return;
        }

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the signature image (leave space for text)
        const imageHeight = canvas.height - 80;
        ctx.drawImage(image, 0, 20, canvas.width, imageHeight);

        // Draw top text (no border)
        ctx.fillStyle = 'black';
        ctx.font = '30px Cambria';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(topText, 5, 0);

        // Draw left border only
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(0, imageHeight + 20);
        ctx.stroke();

        // Draw bottom text aligned to left border (no bottom border)
        ctx.textAlign = 'left';
        ctx.fillText(bottomText, 5, imageHeight + 25);

        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => {
        reject('Failed to load image');
      };

      image.src = base64Image;
    });
  }

  checkIfImageIsBlank(base64Image: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Image;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        let hasVisibleContent = false;
        for (let i = 0; i < pixels.length; i += 4) {
          const alpha = pixels[i + 3];
          if (alpha !== 0) {
            hasVisibleContent = true;
            break;
          }
        }

        resolve(!hasVisibleContent);
      };

      img.onerror = () => resolve(true);
    });
  }
  addSignature(base64Image: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Failed to get canvas context');
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height - 20);

        // Left border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(0, canvas.height - 20);
        ctx.stroke();

        // Bottom border
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 20);
        ctx.stroke();

        ctx.font = '20px Cambria';
        ctx.textAlign = 'right';

        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => {
        reject('Failed to load image');
      };

      image.src = base64Image;
    });
  }
}
