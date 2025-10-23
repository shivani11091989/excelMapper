import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PreviewDataComponent } from './preview-data.component';
import { MappingService } from '../../services/mapping.service';
import { MappingSession } from '../../models/mapping.model';

describe('PreviewDataComponent', () => {
  let component: PreviewDataComponent;
  let fixture: ComponentFixture<PreviewDataComponent>;
  let mockMappingService: jasmine.SpyObj<MappingService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let sessionSubject: BehaviorSubject<MappingSession | null>;

  const mockSession: MappingSession = {
    id: 'test-session',
    fileName: 'test.xlsx',
    uploadedAt: new Date(),
    excelColumns: [
      { name: 'Name', index: 0, dataType: 'string', sampleData: ['Device1'] },
      { name: 'MAC', index: 1, dataType: 'string', sampleData: ['00:11:22:33:44:55'] }
    ],
    excelData: [
      { Name: 'Device1', MAC: '00:11:22:33:44:55' },
      { Name: 'Device2', MAC: '00:66:77:88:99:AA' }
    ],
    templateFields: [
      {
        name: 'asset_name',
        displayName: 'Asset Name',
        dataType: 'string',
        required: true,
        description: 'Name of the asset'
      }
    ],
    mappings: [
      {
        templateField: {
          name: 'asset_name',
          displayName: 'Asset Name',
          dataType: 'string',
          required: true,
          description: 'Name of the asset'
        },
        excelColumn: { name: 'Name', index: 0, dataType: 'string', sampleData: ['Device1', 'Device2'] },
        isAiSuggested: false
      }
    ],
    aiSuggestions: [],
    status: 'previewed'
  };

  beforeEach(async () => {
    sessionSubject = new BehaviorSubject<MappingSession | null>(mockSession);
    const mappingServiceSpy = jasmine.createSpyObj('MappingService', [
      'processData',
      'getColumnOrder'
    ], {
      currentSession$: sessionSubject.asObservable()
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PreviewDataComponent],
      providers: [
        { provide: MappingService, useValue: mappingServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewDataComponent);
    component = fixture.componentInstance;
    mockMappingService = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default return values
    mockMappingService.processData.and.returnValue({
      recordsProcessed: 1,
      errorsFound: 0,
      successRate: 100,
      exportedData: [{ asset_name: 'Device1' }],
      errors: []
    });
    mockMappingService.getColumnOrder.and.returnValue(['asset_name']);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.session).toBeNull();
      expect(component.previewData).toEqual([]);
      expect(component.qualityIssues).toEqual([]);
    });

    it('should handle session updates and generate preview data', () => {
      component.ngOnInit();
      
      expect(component.session).toBe(mockSession);
      expect(mockMappingService.processData).toHaveBeenCalledWith(mockSession.excelData);
    });

    it('should handle null session', () => {
      sessionSubject.next(null);
      
      component.ngOnInit();
      
      expect(component.session).toBeNull();
      expect(mockMappingService.processData).not.toHaveBeenCalled();
    });
  });

  describe('Preview Data Generation', () => {
    beforeEach(() => {
      component.session = mockSession;
    });

    it('should generate preview data successfully', () => {
      const mockResult = {
        recordsProcessed: 2,
        errorsFound: 0,
        successRate: 100,
        exportedData: [
          { asset_name: 'Device1', mac_address: '00:11:22:33:44:55' },
          { asset_name: 'Device2', mac_address: '00:66:77:88:99:AA' }
        ],
        errors: []
      };
      mockMappingService.processData.and.returnValue(mockResult);

      component.generatePreviewData();

      expect(component.previewData).toEqual(mockResult.exportedData);
      expect(component.qualityIssues).toEqual([]);
    });

    it('should handle errors in preview data generation', () => {
      const mockResult = {
        recordsProcessed: 1,
        errorsFound: 1,
        successRate: 0,
        exportedData: [{ asset_name: 'Device1' }],
        errors: [
          { row: 1, field: 'mac_address', error: 'Missing required field', value: null }
        ]
      };
      mockMappingService.processData.and.returnValue(mockResult);

      component.generatePreviewData();

      expect(component.previewData).toEqual(mockResult.exportedData);
      expect(component.qualityIssues.length).toBe(1);
      expect(component.qualityIssues[0].severity).toBe('error');
    });

    it('should not generate preview data when no session exists', () => {
      component.session = null;

      component.generatePreviewData();

      expect(mockMappingService.processData).not.toHaveBeenCalled();
    });
  });

  describe('Table Headers', () => {
    beforeEach(() => {
      component.session = mockSession;
    });

    it('should get table headers from mapping service', () => {
      const expectedHeaders = ['asset_name', 'mac_address'];
      mockMappingService.getColumnOrder.and.returnValue(expectedHeaders);

      const headers = component.getTableHeaders();

      expect(headers).toEqual(expectedHeaders);
      expect(mockMappingService.getColumnOrder).toHaveBeenCalled();
    });

    it('should return empty array when no session exists', () => {
      component.session = null;

      const headers = component.getTableHeaders();

      expect(headers).toEqual([]);
    });
  });

  describe('Field Information Methods', () => {
    beforeEach(() => {
      component.session = mockSession;
    });

    it('should get field display name', () => {
      const displayName = component.getFieldDisplayName('asset_name');
      
      expect(displayName).toBe('Asset Name');
    });

    it('should return field name if display name not found', () => {
      const displayName = component.getFieldDisplayName('unknown_field');
      
      expect(displayName).toBe('unknown_field');
    });

    it('should check if field is required', () => {
      expect(component.isRequiredField('asset_name')).toBeTrue();
      expect(component.isRequiredField('unknown_field')).toBeFalse();
    });

    it('should check if field is mapped', () => {
      component.session!.mappings = [{
        templateField: mockSession.templateFields[0],
        excelColumn: mockSession.excelColumns[0],
        isAiSuggested: false
      }];

      expect(component.isFieldMapped('asset_name')).toBeTrue();
      expect(component.isFieldMapped('unknown_field')).toBeFalse();
    });
  });

  describe('Data Formatting', () => {
    it('should format cell values correctly', () => {
      expect(component.formatCellValue('test')).toBe('test');
      expect(component.formatCellValue(123)).toBe('123');
      expect(component.formatCellValue(null)).toBe('(empty)');
      expect(component.formatCellValue(undefined)).toBe('(empty)');
      expect(component.formatCellValue('')).toBe('(empty)');
    });

    it('should check for errors in cells', () => {
      component.qualityIssues = [
        {
          row: 1, // Row numbers are 1-based in quality issues
          field: 'asset_name',
          message: 'Invalid value',
          severity: 'error'
        }
      ];

      expect(component.hasError(0, 'asset_name')).toBeTrue(); // rowIndex 0 looks for row 1
      expect(component.hasError(0, 'other_field')).toBeFalse();
      expect(component.hasError(1, 'asset_name')).toBeFalse(); // rowIndex 1 looks for row 2
    });
  });

  describe('Navigation', () => {
    it('should navigate back to mapping', () => {
      component.goBackToMapping();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/mapping']);
    });

    it('should navigate to export', () => {
      component.proceedToExport();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/export']);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing session gracefully', () => {
      component.session = null;

      expect(() => {
        component.getTableHeaders();
        component.getFieldDisplayName('test');
        component.isRequiredField('test');
        component.isFieldMapped('test');
        component.generatePreviewData();
      }).not.toThrow();
    });
  });
});