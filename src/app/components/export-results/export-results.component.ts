import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MappingService } from '../../services/mapping.service';
import { ExcelService } from '../../services/excel.service';
import { MappingSession, ExportResult } from '../../models/mapping.model';

@Component({
  selector: 'app-export-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-results.component.html',
  styleUrl: './export-results.component.css'
})
export class ExportResultsComponent implements OnInit {
  session: MappingSession | null = null;
  exportResult: ExportResult | null = null;
  isProcessing = false;
  processingStep = '';
  processingError: string | null = null;
  Math = Math;

  constructor(
    private mappingService: MappingService,
    private excelService: ExcelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mappingService.currentSession$.subscribe(session => {
      this.session = session;
      if (session) {
        this.processExport();
      }
    });
  }

  processExport(): void {
    if (!this.session) return;

    this.isProcessing = true;
    this.processingStep = 'Validating mappings...';

    // Simulate processing steps
    setTimeout(() => {
      this.processingStep = 'Processing data...';
      
      setTimeout(() => {
        this.processingStep = 'Generating export...';
        
        setTimeout(() => {
          this.exportResult = this.mappingService.generateExportResult(this.session!);
          this.isProcessing = false;
        }, 1000);
      }, 1000);
    }, 1000);
  }

  downloadCSV(): void {
    if (this.exportResult) {
      const columnOrder = this.mappingService.getColumnOrder();
      this.excelService.downloadAsCSV(this.exportResult.exportedData, this.getExportFileName('csv'), columnOrder);
    }
  }

  downloadExcel(): void {
    if (this.exportResult) {
      const columnOrder = this.mappingService.getColumnOrder();
      this.excelService.downloadAsXLSX(this.exportResult.exportedData, this.getExportFileName('xlsx'), columnOrder);
    }
  }

  downloadJSON(): void {
    if (this.exportResult) {
      this.excelService.downloadAsJSON(this.exportResult.exportedData, this.getExportFileName('json'));
    }
  }

  getExportFileName(extension: string): string {
    if (!this.session) return `export.${extension}`;
    
    const baseName = this.session.fileName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${baseName}_mapped_${timestamp}.${extension}`;
  }

  getSuccessRate(): number {
    if (!this.exportResult) return 0;
    return this.exportResult.successRate;
  }

  getErrorRate(): number {
    if (!this.exportResult) return 0;
    return 100 - this.exportResult.successRate;
  }

  hasErrors(): boolean {
    return !!(this.exportResult?.errors && this.exportResult.errors.length > 0);
  }

  getVisibleErrors(): any[] {
    if (!this.exportResult?.errors) return [];
    return this.exportResult.errors.slice(0, 10);
  }

  getRemainingErrorsCount(): number {
    if (!this.exportResult?.errors) return 0;
    return Math.max(0, this.exportResult.errors.length - 10);
  }

  getPreviewData(): any[] {
    if (!this.exportResult?.exportedData) return [];
    return this.exportResult.exportedData.slice(0, 5);
  }

  getTableHeaders(): string[] {
    if (!this.exportResult?.exportedData || this.exportResult.exportedData.length === 0) return [];
    return this.mappingService.getColumnOrder();
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && value.length > 30) {
      return value.substring(0, 30) + '...';
    }
    return String(value);
  }

  startNewMapping(): void {
    this.mappingService.clearSession();
    this.router.navigate(['/upload']);
  }

  goBackToPreview(): void {
    this.router.navigate(['/preview']);
  }

  goBackToMapping(): void {
    this.router.navigate(['/mapping']);
  }

  downloadXLSX(): void {
    this.downloadExcel();
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString();
  }

  getMappedColumnsCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.excelColumn).length;
  }

  getUnmappedColumnsCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => !m.excelColumn).length;
  }

  getTotalColumnsCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.length;
  }

  getRequiredFieldsCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.templateField.required).length;
  }

  getExportedFields(): string[] {
    return this.getTableHeaders();
  }

  getFieldDisplayName(fieldName: string): string {
    if (!this.session) return fieldName;
    
    // Check if this is an unmapped Excel column (prefixed with 'excel_')
    if (fieldName.startsWith('excel_')) {
      const originalColumnName = fieldName.replace('excel_', '');
      return `${originalColumnName} (Excel Column)`;
    }
    
    const mapping = this.session.mappings.find(m => m.templateField.name === fieldName);
    return mapping?.templateField.displayName || fieldName;
  }

  getUnmappedFields(): string[] {
    if (!this.session) return [];
    return this.session.mappings
      .filter(m => !m.excelColumn)
      .map(m => m.templateField.displayName);
  }

  getMappedFields(): string[] {
    if (!this.session) return [];
    return this.session.mappings
      .filter(m => m.excelColumn)
      .map(m => m.templateField.displayName);
  }

  getUnmappedExcelColumns(): string[] {
    return this.mappingService.getUnmappedExcelColumns();
  }

  getUnmappedExcelColumnsCount(): number {
    return this.getUnmappedExcelColumns().length;
  }

  retryProcessing(): void {
    this.processingError = null;
    this.processExport();
  }

  goToUpload(): void {
    this.startNewMapping();
  }

  formatValue(value: any): string {
    return this.formatCellValue(value);
  }
}