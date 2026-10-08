import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { GenericHttpService } from './generic-http.service';


@Injectable({
  providedIn: 'root'
})
export class ExportExcelService {

  constructor(public httpService: GenericHttpService) { }
 
 
   private readonly procurementMappings: { [key: string]: string } = {
    id: 'Pre-Procure Order No',
    state: 'State',
    stamp_type: 'Stamp Type',
    denomination: 'Denomination',
    no_of_stamps: 'Order Quantity',
    cess: 'cess',
    balance: 'Total Amount',
    remarks: 'Document',
    first_party_name: 'first_party_name',
    second_party_name: 'second_party_name',
    article_code: 'article_code',
    reviewer_data: 'reviewer_data',
    created_date: 'Pre-Procure Order Date',
    procured_stamps: 'Purchased Inventory',
    to_be_procured_stamps: 'to_be_procured_stamps',
    to_be_procured_stamps_amount: 'to_be_procured_stamps_amount',
    consumed_stamps: 'consumed_stamps',
    consumed_stamps_amount: 'consumed_stamps_amount',
    available_stamps: 'available_stamps',
    available_stamps_amount: 'available_stamps_amount',
    expired_stamps: 'expired_stamps'
  };

  exportToExcel(data: any[], sheetName: string, mappingType: 'procurement' | 'none' = 'none'): void {
    const transformedData = mappingType === 'procurement' 
      ? this.transformData(data, this.procurementMappings)
      : data;

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(fileData, `${sheetName}.xlsx`);
  }

  private transformData(data: any[], mappings: { [key: string]: string }): any[] {
    if (data.length === 0) return data;
    
    const firstItem = data[0];
    const originalKeys = Object.keys(firstItem);
    
    return data.map((item) => {
      const transformed: any = {};
      originalKeys.forEach((originalKey) => {
        if (item.hasOwnProperty(originalKey)) {
          const newKey = mappings[originalKey] || originalKey;
          transformed[newKey] = item[originalKey];
        }
      });
      return transformed;
    });
  }
  
  convertToExcel(data: any[], sheetName: string) {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { [sheetName]: worksheet }, SheetNames: [sheetName] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(fileData, `${sheetName}.xlsx`);
  }

  base64ToCSV(base64String: string, fileName: string) {
    const byteCharacters = atob(base64String);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
  
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, { type: 'application/csv' });
    const csvURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = csvURL;
    link.download = `${fileName}.csv`;
      link.click();
      URL.revokeObjectURL(csvURL);
  }

  getStampInventory(data:any){
    return this.httpService.Post(data,'/report/stamp-inventory/');
  }

  getbranchManagement(data:any){
    return this.httpService.Post(data,'/report/branch-details/');
  }

  getUserManagement(data:any){
    return this.httpService.Post(data,'/report/user-details/');
  }
  getAccountManagement(data:any){
    return this.httpService.Post(data,'/report/account-details/');
  }

  getOrderConsumption(data:any){
    return this.httpService.Post(data,'/report/order-consumption/');
  }

}