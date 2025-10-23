import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FileUploadComponent } from './file-upload.component';
import { ExcelService } from '../../services/excel.service';
import { MappingService } from '../../services/mapping.service';
import { ExcelColumn, MappingSession } from '../../models/mapping.model';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let mockExcelService: jasmine.SpyObj<ExcelService>;
  let mockMappingService: jasmine.SpyObj<MappingService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const excelServiceSpy = jasmine.createSpyObj('ExcelService', ['parseExcelFile']);
    const mappingServiceSpy = jasmine.createSpyObj('MappingService', ['createSession', 'setUploadedFile']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
      providers: [
        { provide: ExcelService, useValue: excelServiceSpy },
        { provide: MappingService, useValue: mappingServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    mockExcelService = TestBed.inject(ExcelService) as jasmine.SpyObj<ExcelService>;
    mockMappingService = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.selectedFile).toBeNull();
      expect(component.uploadedFile).toBeNull();
      expect(component.excelColumns).toEqual([]);
      expect(component.isDragOver).toBeFalse();
      expect(component.isProcessing).toBeFalse();
      expect(component.processingProgress).toBe(0);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should handle drag over event', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');

      component.onDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragOver).toBeTrue();
    });

    it('should handle drag leave event', () => {
      const event = new DragEvent('dragleave');
      spyOn(event, 'preventDefault');
      component.isDragOver = true;

      component.onDragLeave(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragOver).toBeFalse();
    });

    it('should handle drop event with valid file', () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      
      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');
      spyOn(component as any, 'handleFile');

      component.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragOver).toBeFalse();
      expect((component as any).handleFile).toHaveBeenCalledWith(mockFile);
    });

    it('should handle drop event without files', () => {
      const event = new DragEvent('drop');
      spyOn(event, 'preventDefault');
      spyOn(component as any, 'handleFile');

      component.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragOver).toBeFalse();
      expect((component as any).handleFile).not.toHaveBeenCalled();
    });
  });

  describe('File Selection', () => {
    it('should handle file selection from input', () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const event = { target: { files: [mockFile] } };
      spyOn(component as any, 'handleFile');

      component.onFileSelected(event);

      expect((component as any).handleFile).toHaveBeenCalledWith(mockFile);
    });

    it('should not handle file selection when no file provided', () => {
      const event = { target: { files: [] } };
      spyOn(component as any, 'handleFile');

      component.onFileSelected(event);

      expect((component as any).handleFile).not.toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('should accept valid Excel file (.xlsx)', () => {
      spyOn(component, 'processFile');
      const validFile = new File(['test'], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      (component as any).handleFile(validFile);

      expect(component.selectedFile).toBe(validFile);
      expect(component.errorMessage).toBe('');
      expect(component.processFile).toHaveBeenCalled();
    });

    it('should reject invalid file type', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      (component as any).handleFile(invalidFile);

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toContain('Please select a valid Excel file');
    });

    it('should reject file exceeding size limit', () => {
      // Mock the file size property
      const largeFile = new File(['test'], 'large.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024, writable: false });

      (component as any).handleFile(largeFile);

      expect(component.selectedFile).toBeNull();
      expect(component.errorMessage).toContain('File size must be less than 10MB');
    });
  });

  describe('File Processing', () => {
    beforeEach(() => {
      const mockFile = new File(['test'], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      component.selectedFile = mockFile;
    });

    it('should process file successfully', (done) => {
      const mockColumns: ExcelColumn[] = [
        { name: 'Column1', index: 0, dataType: 'string', sampleData: ['test1'] },
        { name: 'Column2', index: 1, dataType: 'number', sampleData: [123] }
      ];
      const mockData = [{ Column1: 'test1', Column2: 123 }];

      mockExcelService.parseExcelFile.and.returnValue(Promise.resolve({
        columns: mockColumns,
        data: mockData
      }));

      const mockSession: MappingSession = {
        id: 'session-id',
        fileName: 'test.xlsx',
        uploadedAt: new Date(),
        excelColumns: mockColumns,
        excelData: mockData,
        templateFields: [],
        mappings: [],
        aiSuggestions: [],
        status: 'uploaded'
      };

      mockMappingService.createSession.and.returnValue(mockSession);

      component.processFile();

      expect(component.isProcessing).toBeTrue();
      
      setTimeout(() => {
        expect(mockExcelService.parseExcelFile).toHaveBeenCalledWith(component.selectedFile!);
        expect(mockMappingService.createSession).toHaveBeenCalled();
        expect(mockMappingService.setUploadedFile).toHaveBeenCalled();
        done();
      }, 1000);
    });

    it('should handle file processing error', (done) => {
      const errorMessage = 'Failed to parse Excel file';
      mockExcelService.parseExcelFile.and.returnValue(Promise.reject(new Error(errorMessage)));

      component.processFile();

      expect(component.isProcessing).toBeTrue();
      
      setTimeout(() => {
        expect(component.errorMessage).toContain('Error processing file');
        expect(component.isProcessing).toBeFalse();
        done();
      }, 100);
    });

    it('should not process when no file is selected', () => {
      component.selectedFile = null;

      component.processFile();

      expect(mockExcelService.parseExcelFile).not.toHaveBeenCalled();
      expect(component.isProcessing).toBeFalse();
    });
  });

  describe('Utility Methods', () => {
    it('should format file size correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(component.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should get column count', () => {
      component.excelColumns = [
        { name: 'Col1', index: 0, dataType: 'string', sampleData: [] },
        { name: 'Col2', index: 1, dataType: 'number', sampleData: [] }
      ];

      expect(component.getColumnCount()).toBe(2);
    });

    it('should get row count', () => {
      component.excelColumns = [{ name: 'Col1', index: 0, dataType: 'string', sampleData: [] }];

      expect(component.getRowCount()).toBe(100);
    });

    it('should reset upload state', () => {
      component.selectedFile = new File(['test'], 'test.xlsx');
      component.uploadedFile = new File(['test'], 'test.xlsx');
      component.excelColumns = [{ name: 'Col1', index: 0, dataType: 'string', sampleData: [] }];
      component.isProcessing = true;
      component.processingProgress = 50;
      component.errorMessage = 'Error';

      component.resetUpload();

      expect(component.selectedFile).toBeNull();
      expect(component.uploadedFile).toBeNull();
      expect(component.excelColumns).toEqual([]);
      expect(component.isProcessing).toBeFalse();
      expect(component.processingProgress).toBe(0);
      expect(component.errorMessage).toBe('');
    });

    it('should navigate to mapping', () => {
      component.proceedToMapping();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/mapping']);
    });
  });
});