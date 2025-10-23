import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ExportResultsComponent } from './export-results.component';
import { MappingService } from '../../services/mapping.service';
import { ExcelService } from '../../services/excel.service';
import { MappingSession, ExportResult } from '../../models/mapping.model';

describe('ExportResultsComponent', () => {
  let component: ExportResultsComponent;
  let fixture: ComponentFixture<ExportResultsComponent>;
  let mockMappingService: jasmine.SpyObj<MappingService>;
  let mockExcelService: jasmine.SpyObj<ExcelService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let sessionSubject: BehaviorSubject<MappingSession | null>;

  const mockSession: MappingSession = {
    id: 'test-session',
    fileName: 'test.xlsx',
    uploadedAt: new Date(),
    excelColumns: [],
    excelData: [],
    templateFields: [],
    mappings: [],
    aiSuggestions: [],
    status: 'exported'
  };

  const mockExportResult: ExportResult = {
    recordsProcessed: 100,
    errorsFound: 5,
    successRate: 95,
    exportedData: [{ asset_name: 'Device1' }],
    errors: [
      { row: 1, field: 'mac_address', error: 'Invalid format', value: 'invalid-mac' }
    ]
  };

  beforeEach(async () => {
    sessionSubject = new BehaviorSubject<MappingSession | null>(mockSession);
    const mappingServiceSpy = jasmine.createSpyObj('MappingService', [
      'generateExportResult',
      'getColumnOrder',
      'clearSession'
    ], {
      currentSession$: sessionSubject.asObservable()
    });
    const excelServiceSpy = jasmine.createSpyObj('ExcelService', [
      'downloadAsCSV',
      'downloadAsXLSX',
      'downloadAsJSON'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ExportResultsComponent],
      providers: [
        { provide: MappingService, useValue: mappingServiceSpy },
        { provide: ExcelService, useValue: excelServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportResultsComponent);
    component = fixture.componentInstance;
    mockMappingService = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
    mockExcelService = TestBed.inject(ExcelService) as jasmine.SpyObj<ExcelService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default return values
    mockMappingService.generateExportResult.and.returnValue(mockExportResult);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.session).toBeNull();
      expect(component.exportResult).toBeNull();
      expect(component.isProcessing).toBeFalse();
      expect(component.processingStep).toBe('');
      expect(component.processingError).toBeNull();
    });

    it('should process export on session update', () => {
      spyOn(component, 'processExport');
      
      component.ngOnInit();
      
      expect(component.session).toBe(mockSession);
      expect(component.processExport).toHaveBeenCalled();
    });

    it('should handle null session', () => {
      sessionSubject.next(null);
      spyOn(component, 'processExport');
      
      component.ngOnInit();
      
      expect(component.session).toBeNull();
      expect(component.processExport).not.toHaveBeenCalled();
    });
  });

  describe('Export Processing', () => {
    beforeEach(() => {
      component.session = mockSession;
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should process export successfully', () => {
      component.processExport();

      expect(component.isProcessing).toBeTrue();
      expect(component.processingStep).toBe('Validating mappings...');

      // Fast forward through the timeouts
      jasmine.clock().tick(1000);
      expect(component.processingStep).toBe('Processing data...');

      jasmine.clock().tick(1000);
      expect(component.processingStep).toBe('Generating export...');

      jasmine.clock().tick(1000);
      expect(component.exportResult).toBe(mockExportResult);
      expect(component.isProcessing).toBeFalse();
    });

    it('should not process when no session exists', () => {
      component.session = null;

      component.processExport();

      expect(component.isProcessing).toBeFalse();
      expect(mockMappingService.generateExportResult).not.toHaveBeenCalled();
    });
  });

  describe('Download Functionality', () => {
    beforeEach(() => {
      component.session = mockSession;
      component.exportResult = mockExportResult;
      mockMappingService.getColumnOrder.and.returnValue(['asset_name']);
    });

    it('should download CSV', () => {
      component.downloadCSV();

      expect(mockExcelService.downloadAsCSV).toHaveBeenCalledWith(
        mockExportResult.exportedData,
        component.getExportFileName('csv'),
        ['asset_name']
      );
    });

    it('should download Excel', () => {
      component.downloadExcel();

      expect(mockExcelService.downloadAsXLSX).toHaveBeenCalledWith(
        mockExportResult.exportedData,
        component.getExportFileName('xlsx'),
        ['asset_name']
      );
    });

    it('should download JSON', () => {
      component.downloadJSON();

      expect(mockExcelService.downloadAsJSON).toHaveBeenCalledWith(
        mockExportResult.exportedData,
        component.getExportFileName('json')
      );
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      component.session = mockSession;
      component.exportResult = mockExportResult;
    });

    it('should generate correct export file name', () => {
      const csvName = component.getExportFileName('csv');
      const xlsxName = component.getExportFileName('xlsx');
      const jsonName = component.getExportFileName('json');

      expect(csvName).toContain('test');
      expect(csvName).toContain('.csv');
      expect(xlsxName).toContain('test');
      expect(xlsxName).toContain('.xlsx');
      expect(jsonName).toContain('test');
      expect(jsonName).toContain('.json');
    });

    it('should calculate success rate correctly', () => {
      const successRate = component.getSuccessRate();
      
      expect(successRate).toBe(95);
    });

    it('should calculate error rate correctly', () => {
      const errorRate = component.getErrorRate();
      
      expect(errorRate).toBe(5);
    });

    it('should handle null export result', () => {
      component.exportResult = null;

      expect(component.getSuccessRate()).toBe(0);
      expect(component.getErrorRate()).toBe(0);
    });
  });

  describe('Navigation', () => {
    it('should navigate to upload for new file', () => {
      component.startNewMapping();

      expect(mockMappingService.clearSession).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/upload']);
    });

    it('should navigate back to preview', () => {
      component.goBackToPreview();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/preview']);
    });

    it('should navigate back to mapping', () => {
      component.goBackToMapping();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/mapping']);
    });
  });

  describe('Export Statistics', () => {
    beforeEach(() => {
      component.exportResult = mockExportResult;
    });

    it('should display correct statistics', () => {
      expect(component.exportResult?.recordsProcessed).toBe(100);
      expect(component.exportResult?.errorsFound).toBe(5);
      expect(component.exportResult?.successRate).toBe(95);
    });

    it('should handle empty export result', () => {
      component.exportResult = null;

      expect(component.getSuccessRate()).toBe(0);
      expect(component.getErrorRate()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', () => {
      component.session = mockSession;
      component.processingError = 'Export failed';

      expect(component.processingError).toBe('Export failed');
      expect(component.isProcessing).toBeFalse();
    });

    it('should handle download errors gracefully', () => {
      component.session = mockSession;
      component.exportResult = null;

      expect(() => {
        component.downloadCSV();
        component.downloadExcel();
        component.downloadJSON();
      }).not.toThrow();
    });
  });
});