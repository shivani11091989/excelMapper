export interface ExcelColumn {
  name: string;
  index: number;
  dataType: string;
  sampleData: any[];
}

export interface TemplateField {
  name: string;
  displayName: string;
  dataType: string;
  required: boolean;
  description?: string;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range';
  value?: any;
  message: string;
}

export interface ColumnMapping {
  templateField: TemplateField;
  excelColumn: ExcelColumn | null;
  isAiSuggested: boolean;
  confidence?: number;
}

export interface AiSuggestion {
  templateField: TemplateField;
  suggestedColumn: ExcelColumn;
  confidence: number;
  reason: string;
}

export interface MappingSession {
  id: string;
  fileName: string;
  uploadedAt: Date;
  excelColumns: ExcelColumn[];
  excelData: any[];
  templateFields: TemplateField[];
  mappings: ColumnMapping[];
  aiSuggestions: AiSuggestion[];
  status: 'uploaded' | 'mapped' | 'previewed' | 'exported';
}

export interface ExportResult {
  recordsProcessed: number;
  errorsFound: number;
  successRate: number;
  exportedData: any[];
  errors: ExportError[];
}

export interface ExportError {
  row: number;
  field: string;
  error: string;
  value: any;
}

export interface DataQualityIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  value?: any;
}