import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MappingService } from '../../services/mapping.service';
import { MappingSession, DataQualityIssue } from '../../models/mapping.model';

@Component({
  selector: 'app-preview-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-data.component.html',
  styleUrl: './preview-data.component.css'
})
export class PreviewDataComponent implements OnInit {
  session: MappingSession | null = null;
  previewData: any[] = [];
  qualityIssues: DataQualityIssue[] = [];
  Math = Math;

  constructor(
    private mappingService: MappingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mappingService.currentSession$.subscribe(session => {
      this.session = session;
      if (session) {
        this.generatePreviewData();
      }
    });
  }

  generatePreviewData(): void {
    if (!this.session || !this.session.excelData) return;

    // Use processData to map real Excel data to IAh template
    const result = this.mappingService.processData(this.session.excelData);
    this.previewData = result.exportedData;
    // Map ExportError[] to DataQualityIssue[] for UI compatibility
    this.qualityIssues = (result.errors || []).map(err => ({
      row: err.row,
      field: err.field,
      message: err.error,
      severity: 'error',
      value: err.value
    }));
  }

  getTableHeaders(): string[] {
    if (!this.session) return [];
    
    return this.session.mappings
      .filter(mapping => mapping.excelColumn)
      .map(mapping => mapping.templateField.name);
  }

  getFieldDisplayName(fieldName: string): string {
    if (!this.session) return fieldName;
    
    const mapping = this.session.mappings.find(m => m.templateField.name === fieldName);
    return mapping?.templateField.displayName || fieldName;
  }

  isRequiredField(fieldName: string): boolean {
    if (!this.session) return false;
    
    const mapping = this.session.mappings.find(m => m.templateField.name === fieldName);
    return mapping?.templateField.required || false;
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '(empty)';
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    
    return String(value);
  }

  hasError(rowIndex: number, fieldName: string): boolean {
    return this.qualityIssues.some(issue => 
      issue.row === rowIndex + 1 && issue.field === fieldName
    );
  }

  getMappedFieldsCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.excelColumn).length;
  }

  getRequiredFieldsCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.templateField.required).length;
  }

  getCompletionRate(): number {
    if (!this.session || this.previewData.length === 0) return 0;
    
    const totalCells = this.previewData.length * this.getMappedFieldsCount();
    const emptyCells = this.qualityIssues.filter(issue => 
      issue.message.includes('empty') || issue.message.includes('missing')
    ).length;
    
    return Math.round(((totalCells - emptyCells) / totalCells) * 100);
  }

  proceedToExport(): void {
    this.router.navigate(['/export']);
  }

  goBackToMapping(): void {
    this.router.navigate(['/mapping']);
  }

  goToUpload(): void {
    this.router.navigate(['/upload']);
  }
}