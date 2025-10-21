import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  MappingSession, 
  TemplateField, 
  ExcelColumn, 
  ColumnMapping, 
  AiSuggestion,
  ExportResult,
  ExportError,
  DataQualityIssue
} from '../models/mapping.model';

@Injectable({
  providedIn: 'root'
})
export class MappingService {
  private currentSessionSubject = new BehaviorSubject<MappingSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  private templateFields: TemplateField[] = [
    {
      name: 'mac_address',
      displayName: 'MAC address',
      dataType: 'string',
      required: true,
      description: 'MAC address of the asset'
    },
    {
      name: 'name',
      displayName: 'Configured asset name',
      dataType: 'string',
      required: false,
      description: 'the engineered name i.e hostname/profinet name'
    },
    {
      name: 'product_family',
      displayName: 'Device type',
      dataType: 'string',
      required: false,
      description: 'product_family eg. Scalanace 1500'
    },
    {
      name: 'description ',
      displayName: 'Description ',
      dataType: 'string',
      required: false,
      description: 'Description of the asset'
    },
    {
      name: 'serial_number',
      displayName: 'Serial number',
      dataType: 'string',
      required: false,
      description: 'Serial number of the asset'
    },
    {
      name: 'manufacturer',
      displayName: 'Manufacturer name',
      dataType: 'string',
      required: false,
      description: 'Asset manufacturer'
    },
    {
      name: 'product_version',
      displayName: 'Product version',
      dataType: 'string',
      required: false,
      description: 'Hardware version of the asset'
    },
    {
      name: 'firmware_version',
      displayName: 'Firmware version',
      dataType: 'string',
      required: false,
      description: 'Firmware version of the asset'
    },
    {
      name: 'network_mask',
      displayName: 'Subnet Mask',
      dataType: 'string',
      required: false,
      description: 'Subnet Mask of the asset'
    },
    {
      name: 'gateway',
      displayName: 'Gateway',
      dataType: 'string',
      required: false,
      description: 'Gateway IP address'
    },
    {
      name: 'ip_address',
      displayName: 'IPv4 Address',
      dataType: 'string',
      required: false,
      description: 'IPv4 Address of the asset'
    }
  ];

  createSession(fileName: string, excelColumns: ExcelColumn[], excelData: any[]): MappingSession {
    const session: MappingSession = {
      id: this.generateId(),
      fileName,
      uploadedAt: new Date(),
      excelColumns,
      excelData,
      templateFields: this.templateFields,
      mappings: this.initializeMappings(),
      aiSuggestions: [],
      status: 'uploaded'
    };

    this.currentSessionSubject.next(session);
    return session;
  }

  getCurrentSession(): MappingSession | null {
    return this.currentSessionSubject.value;
  }

  updateMapping(templateFieldName: string, excelColumn: ExcelColumn | null): void {
    const session = this.currentSessionSubject.value;
    if (!session) return;

    const mappingIndex = session.mappings.findIndex(m => m.templateField.name === templateFieldName);
    if (mappingIndex !== -1) {
      session.mappings[mappingIndex].excelColumn = excelColumn;
      session.mappings[mappingIndex].isAiSuggested = false;
      session.status = 'mapped';
      this.currentSessionSubject.next(session);
    }
  }



  acceptAiSuggestion(suggestion: AiSuggestion): void {
    const session = this.currentSessionSubject.value;
    if (!session) return;

    const mappingIndex = session.mappings.findIndex(m => m.templateField.name === suggestion.templateField.name);
    if (mappingIndex !== -1) {
      session.mappings[mappingIndex].excelColumn = suggestion.suggestedColumn;
      session.mappings[mappingIndex].isAiSuggested = true;
      session.mappings[mappingIndex].confidence = suggestion.confidence;
      this.currentSessionSubject.next(session);
    }
  }

  validateMappings(): { isValid: boolean; errors: string[] } {
    const session = this.currentSessionSubject.value;
    if (!session) return { isValid: false, errors: ['No active session'] };

    const errors: string[] = [];
    
    session.mappings.forEach(mapping => {
      if (mapping.templateField.required && !mapping.excelColumn) {
        errors.push(`Required field "${mapping.templateField.displayName}" is not mapped`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  processData(excelData: any[]): ExportResult {
    const session = this.currentSessionSubject.value;
    if (!session) {
      return {
        recordsProcessed: 0,
        errorsFound: 0,
        successRate: 0,
        exportedData: [],
        errors: []
      };
    }

    const exportedData: any[] = [];
    const errors: ExportError[] = [];
    let recordsProcessed = 0;

    // Separate mapped and unmapped fields for ordered processing
    const mappedFields = session.mappings.filter(m => m.excelColumn);
    const unmappedTemplateFields = session.mappings.filter(m => !m.excelColumn);
    
    // Find Excel columns that are not mapped to any template field
    const mappedExcelColumnNames = mappedFields.map(m => m.excelColumn!.name);
    const unmappedExcelColumns = session.excelColumns.filter(col => 
      !mappedExcelColumnNames.includes(col.name)
    );

    excelData.forEach((row, rowIndex) => {
      const mappedRow: any = {};
      let hasError = false;

      // Process mapped fields first (template fields with mapped Excel columns)
      mappedFields.forEach(mapping => {
        const value = row[mapping.excelColumn!.name];
        
        // Validate required fields
        if (mapping.templateField.required && (value === undefined || value === null || value === '')) {
          errors.push({
            row: rowIndex + 1,
            field: mapping.templateField.displayName,
            error: 'Required field is empty',
            value
          });
          hasError = true;
        }

        // Data type conversion and validation
        try {
          mappedRow[mapping.templateField.name] = this.convertValue(value, mapping.templateField.dataType);
        } catch (error) {
          errors.push({
            row: rowIndex + 1,
            field: mapping.templateField.displayName,
            error: `Data type conversion failed: ${error}`,
            value
          });
          hasError = true;
        }
      });

      // Process unmapped template fields - only check for required field errors, don't add to result
      unmappedTemplateFields.forEach(mapping => {
        if (mapping.templateField.required) {
          errors.push({
            row: rowIndex + 1,
            field: mapping.templateField.displayName,
            error: 'Required field is not mapped',
            value: null
          });
          hasError = true;
        }
        // Note: Unmapped template fields are NOT added to the result
      });

      // Process unmapped Excel columns - add their actual data
      unmappedExcelColumns.forEach(column => {
        const value = row[column.name];
        // Use Excel column name as key for unmapped Excel data
        mappedRow[`excel_${column.name}`] = value !== undefined ? value : null;
      });

      if (!hasError) {
        exportedData.push(mappedRow);
      }
      recordsProcessed++;
    });

    const result: ExportResult = {
      recordsProcessed,
      errorsFound: errors.length,
      successRate: recordsProcessed > 0 ? ((recordsProcessed - errors.length) / recordsProcessed) * 100 : 0,
      exportedData,
      errors
    };

    session.status = 'exported';
    // this.currentSessionSubject.next(session);

    return result;
  }

  private initializeMappings(): ColumnMapping[] {
    return this.templateFields.map(field => ({
      templateField: field,
      excelColumn: null,
      isAiSuggested: false
    }));
  }

  private findBestMatch(templateField: TemplateField, excelColumns: ExcelColumn[]): { column: ExcelColumn; confidence: number; reason: string } | null {
    let bestMatch: { column: ExcelColumn; confidence: number; reason: string } | null = null;

    excelColumns.forEach(excelColumn => {
      const confidence = this.calculateSimilarity(templateField, excelColumn);
      if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          column: excelColumn,
          confidence: confidence * 100,
          reason: this.generateMatchReason(templateField, excelColumn, confidence)
        };
      }
    });

    return bestMatch;
  }

  private calculateSimilarity(templateField: TemplateField, excelColumn: ExcelColumn): number {
    let score = 0;

    // Name similarity
    const nameScore = this.stringSimilarity(templateField.name.toLowerCase(), excelColumn.name.toLowerCase());
    const displayNameScore = this.stringSimilarity(templateField.displayName.toLowerCase(), excelColumn.name.toLowerCase());
    score += Math.max(nameScore, displayNameScore) * 0.6;

    // Data type compatibility
    if (this.isDataTypeCompatible(templateField.dataType, excelColumn.dataType)) {
      score += 0.4;
    }

    return Math.min(score, 1);
  }

  private stringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private isDataTypeCompatible(templateType: string, excelType: string): boolean {
    if (templateType === excelType) return true;
    
    const compatibilityMap: { [key: string]: string[] } = {
      'string': ['string', 'number', 'date', 'boolean'],
      'number': ['number', 'string'],
      'date': ['date', 'string'],
      'boolean': ['boolean', 'string']
    };
    
    return compatibilityMap[templateType]?.includes(excelType) || false;
  }

  private generateMatchReason(templateField: TemplateField, excelColumn: ExcelColumn, confidence: number): string {
    if (confidence > 0.8) {
      return `High similarity in column name and data type`;
    } else if (confidence > 0.6) {
      return `Good match based on column name similarity`;
    } else {
      return `Moderate match based on data type compatibility`;
    }
  }

  private convertValue(value: any, targetType: string): any {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error(`Cannot convert "${value}" to number`);
        return num;
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error(`Cannot convert "${value}" to date`);
        return date.toISOString();
      case 'boolean':
        if (typeof value === 'boolean') return value;
        const str = String(value).toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(str)) return true;
        if (['false', '0', 'no', 'n'].includes(str)) return false;
        throw new Error(`Cannot convert "${value}" to boolean`);
      default:
        return value;
    }
  }

  getColumnOrder(): string[] {
    const session = this.currentSessionSubject.value;
    if (!session) return [];

    // Mapped template fields first
    const mappedFields = session.mappings
      .filter(m => m.excelColumn)
      .map(m => m.templateField.name);
    
    // Skip unmapped template fields - they are not included in the result

    // Unmapped Excel columns second (columns not mapped to any template field)
    const mappedExcelColumnNames = session.mappings
      .filter(m => m.excelColumn)
      .map(m => m.excelColumn!.name);
    
    const unmappedExcelColumns = session.excelColumns
      .filter(col => !mappedExcelColumnNames.includes(col.name))
      .map(col => `excel_${col.name}`);

    return [...mappedFields, ...unmappedExcelColumns];
  }

  getUnmappedExcelColumns(): string[] {
    const session = this.currentSessionSubject.value;
    if (!session) return [];

    const mappedExcelColumnNames = session.mappings
      .filter(m => m.excelColumn)
      .map(m => m.excelColumn!.name);
    
    return session.excelColumns
      .filter(col => !mappedExcelColumnNames.includes(col.name))
      .map(col => col.name);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Additional methods needed by components
  mapColumnToField(column: ExcelColumn, templateField: TemplateField): void {
    this.updateMapping(templateField.name, column);
  }

  clearFieldMapping(templateField: TemplateField): void {
    this.updateMapping(templateField.name, null);
  }

  clearAllMappings(): void {
    const session = this.currentSessionSubject.value;
    if (!session) return;

    session.mappings.forEach(mapping => {
      mapping.excelColumn = null;
      mapping.isAiSuggested = false;
      mapping.confidence = undefined;
    });

    this.currentSessionSubject.next(session);
  }

  clearSession(): void {
    this.currentSessionSubject.next(null);
  }

  generateAiSuggestions(session: MappingSession): AiSuggestion[] {
    if (!session) return [];

    const suggestions: AiSuggestion[] = [];

    session.templateFields.forEach(templateField => {
      const bestMatch = this.findBestMatch(templateField, session.excelColumns);
      if (bestMatch) {
        suggestions.push({
          templateField,
          suggestedColumn: bestMatch.column,
          confidence: bestMatch.confidence,
          reason: bestMatch.reason
        });
      }
    });

    return suggestions;
  }

  generateExportResult(session: MappingSession): any {
    if (!session || !session.excelData) return null;

    // Use processData to generate export result from real Excel data
    const result = this.processData(session.excelData);
    return {
      exportedData: result.exportedData,
      recordsProcessed: result.recordsProcessed,
      successRate: Math.round(((result.recordsProcessed - result.errorsFound) / result.recordsProcessed) * 100),
      errorsFound: result.errorsFound,
      errors: result.errors
    };
  }

  private generateMockValue(dataType: string, index: number): any {
    switch (dataType) {
      case 'string':
        return `Sample ${dataType} ${index + 1}`;
      case 'number':
        return (index + 1) * 100;
      case 'date':
        return new Date(2024, 0, index + 1).toISOString().split('T')[0];
      case 'boolean':
        return index % 2 === 0;
      default:
        return `Value ${index + 1}`;
    }
  }
}