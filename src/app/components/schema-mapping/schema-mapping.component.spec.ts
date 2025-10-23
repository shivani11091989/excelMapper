import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SchemaMappingComponent } from './schema-mapping.component';
import { MappingService } from '../../services/mapping.service';
import { MappingSession, ExcelColumn, TemplateField, ColumnMapping } from '../../models/mapping.model';

describe('SchemaMappingComponent', () => {
  let component: SchemaMappingComponent;
  let fixture: ComponentFixture<SchemaMappingComponent>;
  let mockMappingService: jasmine.SpyObj<MappingService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let sessionSubject: BehaviorSubject<MappingSession | null>;

  const mockTemplateFields: TemplateField[] = [
    {
      name: 'asset_name',
      displayName: 'Asset Name',
      dataType: 'string',
      required: true,
      description: 'Name of the asset'
    },
    {
      name: 'mac_address',
      displayName: 'MAC Address',
      dataType: 'string',
      required: true,
      description: 'MAC address of the asset'
    }
  ];

  const mockExcelColumns: ExcelColumn[] = [
    { name: 'Name', index: 0, dataType: 'string', sampleData: ['Device1', 'Device2'] },
    { name: 'MAC', index: 1, dataType: 'string', sampleData: ['00:11:22:33:44:55', '00:66:77:88:99:AA'] }
  ];

  const mockSession: MappingSession = {
    id: 'test-session',
    fileName: 'test.xlsx',
    uploadedAt: new Date(),
    excelColumns: mockExcelColumns,
    excelData: [
      { Name: 'Device1', MAC: '00:11:22:33:44:55' },
      { Name: 'Device2', MAC: '00:66:77:88:99:AA' }
    ],
    templateFields: mockTemplateFields,
    mappings: [
      { templateField: mockTemplateFields[0], excelColumn: null, isAiSuggested: false },
      { templateField: mockTemplateFields[1], excelColumn: null, isAiSuggested: false }
    ],
    aiSuggestions: [],
    status: 'uploaded'
  };

  beforeEach(async () => {
    sessionSubject = new BehaviorSubject<MappingSession | null>(mockSession);
    const mappingServiceSpy = jasmine.createSpyObj('MappingService', [
      'mapColumnToField',
      'clearFieldMapping',
      'clearAllMappings',
      'validateMappings',
      'updateMapping'
    ], {
      currentSession$: sessionSubject.asObservable()
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SchemaMappingComponent],
      providers: [
        { provide: MappingService, useValue: mappingServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaMappingComponent);
    component = fixture.componentInstance;
    mockMappingService = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockMappingService.validateMappings.and.returnValue({ isValid: true, errors: [] });
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with session data', () => {
      component.ngOnInit();
      
      expect(component.session).toBe(mockSession);
      expect(mockMappingService.validateMappings).toHaveBeenCalled();
    });

    it('should handle null session', () => {
      sessionSubject.next(null);
      
      component.ngOnInit();
      
      expect(component.session).toBeNull();
    });
  });

  describe('Drag and Drop Functionality', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle drag start event', () => {
      const mockColumn = mockExcelColumns[0];
      const mockDataTransfer = {
        setData: jasmine.createSpy('setData'),
        effectAllowed: ''
      };
      const dragEvent = new DragEvent('dragstart');
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: mockDataTransfer,
        writable: false
      });

      component.onDragStart(dragEvent, mockColumn);

      expect(mockDataTransfer.setData).toHaveBeenCalledWith('text/plain', JSON.stringify(mockColumn));
      expect(mockDataTransfer.effectAllowed).toBe('move');
    });

    it('should handle drag over event', () => {
      const mockField = mockTemplateFields[0];
      const mockDataTransfer = {
        dropEffect: ''
      };
      const dragEvent = new DragEvent('dragover');
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: mockDataTransfer,
        writable: false
      });
      spyOn(dragEvent, 'preventDefault');

      component.onDragOver(dragEvent, mockField);

      expect(dragEvent.preventDefault).toHaveBeenCalled();
      expect(mockDataTransfer.dropEffect).toBe('move');
      expect(component.dragOverField).toBe(mockField.name);
    });

    it('should handle drag leave event', () => {
      component.dragOverField = 'test-field';
      const dragEvent = new DragEvent('dragleave');

      component.onDragLeave(dragEvent);

      expect(component.dragOverField).toBeNull();
    });

    it('should handle drop event with valid data', () => {
      const mockColumn = mockExcelColumns[0];
      const mockField = mockTemplateFields[0];
      const mockDataTransfer = jasmine.createSpyObj('DataTransfer', ['getData']);
      mockDataTransfer.getData.and.returnValue(JSON.stringify(mockColumn));
      
      const dragEvent = new DragEvent('drop');
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: mockDataTransfer,
        writable: false
      });
      spyOn(dragEvent, 'preventDefault');

      component.onDrop(dragEvent, mockField);

      expect(dragEvent.preventDefault).toHaveBeenCalled();
      expect(mockMappingService.mapColumnToField).toHaveBeenCalledWith(mockColumn, mockField);
      expect(component.dragOverField).toBeNull();
    });

    it('should handle drop event with invalid JSON', () => {
      const mockField = mockTemplateFields[0];
      const mockDataTransfer = jasmine.createSpyObj('DataTransfer', ['getData']);
      mockDataTransfer.getData.and.returnValue('invalid json');
      
      const dragEvent = new DragEvent('drop');
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: mockDataTransfer,
        writable: false
      });
      spyOn(dragEvent, 'preventDefault');
      spyOn(console, 'error');

      component.onDrop(dragEvent, mockField);

      expect(dragEvent.preventDefault).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(component.dragOverField).toBeNull();
    });
  });

  describe('Field Click Functionality', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle field click', () => {
      const mockField = mockTemplateFields[0];

      component.onFieldClick(mockField);

      // This would typically trigger some UI interaction
      // The exact behavior would depend on the implementation
      expect(component.session).toBeTruthy();
    });
  });

  describe('Mapping Management', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should clear field mapping', () => {
      const mockField = mockTemplateFields[0];

      component.clearMapping(mockField);

      expect(mockMappingService.clearFieldMapping).toHaveBeenCalledWith(mockField);
    });

    it('should clear all mappings', () => {
      component.clearAllMappings();

      expect(mockMappingService.clearAllMappings).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should navigate to AI suggestions', () => {
      component.proceedToAiSuggestions();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/ai-suggestions']);
    });

    it('should navigate to preview when conditions are met', () => {
      spyOn(component, 'canProceed').and.returnValue(true);
      
      component.proceedToPreview();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/preview']);
    });

    it('should go back to upload', () => {
      component.goBackToUpload();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/upload']);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should validate mappings and show errors', () => {
      const validationErrors = ['MAC Address is required', 'Asset Name cannot be empty'];
      mockMappingService.validateMappings.and.returnValue({ isValid: false, errors: validationErrors });

      component.validateMappings();

      expect(component.validationErrors).toEqual(validationErrors);
    });

    it('should validate mappings and show no errors', () => {
      mockMappingService.validateMappings.and.returnValue({ isValid: true, errors: [] });

      component.validateMappings();

      expect(component.validationErrors).toEqual([]);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      // Create fresh session for each test to avoid interference
      const freshSession: MappingSession = {
        id: 'test-session',
        fileName: 'test.xlsx',
        uploadedAt: new Date(),
        excelColumns: mockExcelColumns,
        excelData: [
          { Name: 'Device1', MAC: '00:11:22:33:44:55' },
          { Name: 'Device2', MAC: '00:66:77:88:99:AA' }
        ],
        templateFields: mockTemplateFields,
        mappings: [
          { templateField: mockTemplateFields[0], excelColumn: null, isAiSuggested: false },
          { templateField: mockTemplateFields[1], excelColumn: null, isAiSuggested: false }
        ],
        aiSuggestions: [],
        status: 'uploaded'
      };
      component.session = freshSession;
      sessionSubject.next(freshSession);
      component.ngOnInit();
    });

    it('should check if field is mapped', () => {
      // Map one field by updating existing mapping
      component.session!.mappings[0].excelColumn = mockExcelColumns[0];

      const isMapped = component.isFieldMapped(mockTemplateFields[0]);
      const isNotMapped = component.isFieldMapped(mockTemplateFields[1]);

      expect(isMapped).toBeTrue();
      expect(isNotMapped).toBeFalse();
    });

    it('should get mapped column for field', () => {
      // Map one field by updating existing mapping
      component.session!.mappings[0].excelColumn = mockExcelColumns[0];

      const mappedColumn = component.getMappedColumn(mockTemplateFields[0]);
      const unmappedColumn = component.getMappedColumn(mockTemplateFields[1]);

      expect(mappedColumn).toBe(mockExcelColumns[0]);
      expect(unmappedColumn).toBeNull();
    });

    it('should check if all required fields are mapped', () => {
      // No mappings - should be false
      expect(component.canProceed()).toBeFalse();

      // Map one required field - should still be false since both fields are required
      component.session!.mappings[1].excelColumn = mockExcelColumns[1]; // mac_address is required
      expect(component.canProceed()).toBeFalse();

      // Map both required fields - should be true
      component.session!.mappings[0].excelColumn = mockExcelColumns[0]; // asset_name is also required
      expect(component.canProceed()).toBeTrue();
    });

    it('should get completion percentage', () => {
      expect(component.getCompletionPercentage()).toBe(0);

      // Map one field out of two total fields (50%)
      component.session!.mappings[1].excelColumn = mockExcelColumns[1];
      
      expect(component.getCompletionPercentage()).toBe(50);
    });

    it('should count mapped fields', () => {
      expect(component.getMappedCount()).toBe(0);

      // Map one field by updating existing mapping
      component.session!.mappings[0].excelColumn = mockExcelColumns[0];
      
      expect(component.getMappedCount()).toBe(1);
    });

    it('should count required fields', () => {
      const requiredCount = mockTemplateFields.filter(f => f.required).length;
      expect(component.getRequiredCount()).toBe(requiredCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle session update errors gracefully', () => {
      component.session = null;
      spyOn(console, 'warn');

      // These methods should handle null session gracefully
      expect(() => {
        component.validateMappings();
        component.isFieldMapped(mockTemplateFields[0]);
        component.getMappedColumn(mockTemplateFields[0]);
        component.canProceed();
        component.getCompletionPercentage();
        component.getMappedCount();
        component.getRequiredCount();
      }).not.toThrow();
    });
  });
});