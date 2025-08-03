import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ExcelColumn } from '../models/mapping.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  parseExcelFile(file: File): Promise<{ columns: ExcelColumn[], data: any[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }
          
          // Extract headers (first row)
          const headers = jsonData[0] as string[];
          // Filter out empty rows (no data for any column)
          const dataRows = (jsonData.slice(1) as any[][]).filter((row) => {
            if (!row) return false;
            // A row is empty if all cells are undefined, null, or empty string
            return row.some(cell => cell !== undefined && cell !== null && cell !== '');
          });
          
          // Create column definitions
          const columns: ExcelColumn[] = headers.map((header, index) => {
            const columnData = dataRows.map(row => (row as any[])[index]).filter(val => val !== undefined && val !== null);
            const dataType = this.inferDataType(columnData);
            
            return {
              name: header || `Column ${index + 1}`,
              index,
              dataType,
              sampleData: columnData.slice(0, 5) // First 5 samples
            };
          });
          
          // Convert data to objects
          const objectData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header || `Column ${index + 1}`] = (row as any[])[index];
            });
            return obj;
          });
          
          resolve({ columns, data: objectData });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private inferDataType(data: any[]): string {
    if (data.length === 0) return 'string';
    
    const sample = data.filter(val => val !== undefined && val !== null);
    if (sample.length === 0) return 'string';
    
    // Check if all values are numbers
    if (sample.every(val => !isNaN(Number(val)) && isFinite(Number(val)))) {
      return 'number';
    }
    
    // Check if all values are dates
    if (sample.every(val => !isNaN(Date.parse(val)))) {
      return 'date';
    }
    
    // Check if all values are booleans
    if (sample.every(val => typeof val === 'boolean' || val === 'true' || val === 'false' || val === 'TRUE' || val === 'FALSE')) {
      return 'boolean';
    }
    
    return 'string';
  }

  exportToExcel(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapped Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  exportToCSV(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  exportToJSON(data: any[], filename: string): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, `${filename}.json`, 'application/json');
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Additional methods expected by components
  downloadAsCSV(data: any[], filename: string): void {
    this.exportToCSV(data, filename.replace('.csv', ''));
  }

  downloadAsXLSX(data: any[], filename: string): void {
    this.exportToExcel(data, filename.replace('.xlsx', ''));
  }

  downloadAsJSON(data: any[], filename: string): void {
    this.exportToJSON(data, filename.replace('.json', ''));
  }
}