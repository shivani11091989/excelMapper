import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MappingService } from '../../services/mapping.service';
import { MappingSession, ColumnMapping, ExcelColumn, TemplateField } from '../../models/mapping.model';

@Component({
  selector: 'app-schema-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schema-mapping.component.html',
  styleUrl: './schema-mapping.component.css'
})
export class SchemaMappingComponent implements OnInit {
  session: MappingSession | null = null;
  dragOverField: string | null = null;
  validationErrors: string[] = [];

  constructor(
    private mappingService: MappingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mappingService.currentSession$.subscribe(session => {
      this.session = session;
      this.validateMappings();
    });
  }

  onDragStart(event: DragEvent, column: ExcelColumn): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(column));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, templateField: TemplateField): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverField = templateField.name;
  }

  onDragLeave(event: DragEvent): void {
    this.dragOverField = null;
  }

  onDrop(event: DragEvent, templateField: TemplateField): void {
    event.preventDefault();
    this.dragOverField = null;
    
    const columnData = event.dataTransfer?.getData('text/plain');
    if (columnData) {
      try {
        const column: ExcelColumn = JSON.parse(columnData);
        this.mappingService.mapColumnToField(column, templateField);
        this.validateMappings();
      } catch (error) {
        console.error('Invalid column data:', error);
      }
    }
  }

  onFieldClick(templateField: TemplateField): void {
    // Toggle mapping or show options
    const mapping = this.getMappingForField(templateField);
    if (mapping?.excelColumn) {
      this.mappingService.clearFieldMapping(templateField);
    }
  }

  getMappingForField(templateField: TemplateField): ColumnMapping | undefined {
    return this.session?.mappings.find(m => m.templateField.name === templateField.name);
  }

  isFieldMapped(templateField: TemplateField): boolean {
    const mapping = this.getMappingForField(templateField);
    return mapping?.excelColumn !== null && mapping?.excelColumn !== undefined;
  }

  isColumnUsed(column: ExcelColumn): boolean {
    return this.session?.mappings.some(m => m.excelColumn?.name === column.name) || false;
  }

  getMappedColumn(templateField: TemplateField): ExcelColumn | null {
    const mapping = this.getMappingForField(templateField);
    return mapping?.excelColumn || null;
  }

  clearMapping(templateField: TemplateField): void {
    this.mappingService.clearFieldMapping(templateField);
    this.validateMappings();
  }

  clearAllMappings(): void {
    this.mappingService.clearAllMappings();
    this.validateMappings();
  }

  validateMappings(): void {
    if (!this.session) return;
    
    const validation = this.mappingService.validateMappings();
    this.validationErrors = validation.errors;
  }

  getMappedCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.excelColumn).length;
  }

  getRequiredCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.templateField.required).length;
  }

  getRequiredMappedCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.templateField.required && m.excelColumn).length;
  }

  getCompletionPercentage(): number {
    if (!this.session) return 0;
    const total = this.session.mappings.length;
    const mapped = this.getMappedCount();
    return total > 0 ? Math.round((mapped / total) * 100) : 0;
  }

  canProceed(): boolean {
    return this.validationErrors.length === 0 && this.getRequiredMappedCount() === this.getRequiredCount();
  }

  proceedToPreview(): void {
    if (this.canProceed()) {
      this.router.navigate(['/preview']);
    }
  }

  goBackToUpload(): void {
    this.router.navigate(['/upload']);
  }

  // Additional methods needed by the template
 isColumnMapped(column: any): boolean {
  if (!column || !column.name || !this.session || !this.session.mappings) return false;
  return this.session.mappings.some(m => m.excelColumn && m.excelColumn.name === column.name);
}

  getMappedFieldName(column: any): string {
    if (!this.session) return '';
    const mapping = this.session.mappings.find(m => m.excelColumn?.name === column.name);
    return mapping?.templateField.displayName || '';
  }

  clearColumnMapping(column: any): void {
    if (!this.session) return;
    const mapping = this.session.mappings.find(m => m.excelColumn?.name === column.name);
    if (mapping) {
      mapping.excelColumn = null;
    }
    this.validateMappings();
  }

  onDropdownChange(event: any, templateField: any): void {
    const selectedColumnName = event.target.value;
    if (!this.session) return;

    const mapping = this.session.mappings.find(m => m.templateField.name === templateField.name);
    if (mapping) {
      if (selectedColumnName) {
        const column = this.session.excelColumns.find(c => c.name === selectedColumnName);
        mapping.excelColumn = column || null;
      } else {
        mapping.excelColumn = null;
      }
    }
    this.validateMappings();
  }

  getAvailableColumns(mapping: any): any[] {
    if (!this.session) return [];
    
    return this.session.excelColumns.filter(column => {
      // Include unmapped columns and the currently mapped column for this field
      const isCurrentlyMapped = mapping.excelColumn?.name === column.name;
      const isMappedElsewhere = this.session!.mappings.some(m => 
        m !== mapping && m.excelColumn?.name === column.name
      );
      
      return isCurrentlyMapped || !isMappedElsewhere;
    });
  }

  isTypeCompatible(excelType: string, templateType: string): boolean {
    // Simple type compatibility check
    if (excelType === templateType) return true;
    
    const compatibilityMap: { [key: string]: string[] } = {
      'string': ['text', 'varchar', 'char'],
      'number': ['int', 'float', 'decimal', 'numeric'],
      'date': ['datetime', 'timestamp'],
      'boolean': ['bool', 'bit']
    };
    
    return compatibilityMap[excelType]?.includes(templateType) || false;
  }

  getUnmappedCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => !m.excelColumn).length;
  }

  proceedToAiSuggestions(): void {
    this.router.navigate(['/ai-suggestions']);
  }

  canProceedToPreview(): boolean {
    return this.canProceed();
  }

  getValidationMessages(): string[] {
    return this.validationErrors;
  }

  goToUpload(): void {
    this.goBackToUpload();
  }

  getAiSuggestions(): void {
    this.router.navigate(['/ai-suggestions']);
  }

  getColumnStats(column: any): string {
    if (!column.sampleData || column.sampleData.length === 0) {
      return 'No data';
    }
    
    const nonEmptyCount = column.sampleData.filter((value: any) => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    return `${nonEmptyCount}/${column.sampleData.length} filled`;
  }
}