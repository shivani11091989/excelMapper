import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AiSuggestionsComponent } from './ai-suggestions.component';
import { MappingService } from '../../services/mapping.service';
import { MappingSession, AiSuggestion, ExcelColumn, TemplateField } from '../../models/mapping.model';

describe('AiSuggestionsComponent', () => {
  let component: AiSuggestionsComponent;
  let fixture: ComponentFixture<AiSuggestionsComponent>;
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

  const mockAiSuggestions: AiSuggestion[] = [
    {
      templateField: mockTemplateFields[0],
      suggestedColumn: mockExcelColumns[0],
      confidence: 95,
      reason: 'High similarity between field names'
    },
    {
      templateField: mockTemplateFields[1],
      suggestedColumn: mockExcelColumns[1],
      confidence: 65,
      reason: 'Pattern matching suggests MAC address format'
    }
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
    mappings: [],
    aiSuggestions: mockAiSuggestions,
    status: 'uploaded'
  };

  beforeEach(async () => {
    sessionSubject = new BehaviorSubject<MappingSession | null>(mockSession);
    const mappingServiceSpy = jasmine.createSpyObj('MappingService', [
      'getDataId',
      'uploadFileToServer',
      'getAiSuggestionsFromServer',
      'generateLocalAiSuggestions',
      'acceptAiSuggestion',
      'checkServerHealth',
      'submitFeedbackToServer',
      'validateMappingsWithServer'
    ], {
      currentSession$: sessionSubject.asObservable()
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [AiSuggestionsComponent],
      providers: [
        { provide: MappingService, useValue: mappingServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AiSuggestionsComponent);
    component = fixture.componentInstance;
    mockMappingService = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with session data and generate suggestions', () => {
      mockMappingService.checkServerHealth.and.returnValue(of(true));
      mockMappingService.getDataId.and.returnValue('test-data-id');
      mockMappingService.getAiSuggestionsFromServer.and.returnValue(of(mockAiSuggestions));

      component.ngOnInit();
      
      expect(component.session).toBe(mockSession);
    });

    it('should handle null session', () => {
      sessionSubject.next(null);
      
      component.ngOnInit();
      
      expect(component.session).toBeNull();
    });

    it('should cleanup subscriptions on destroy', () => {
      spyOn(component['subscriptions'], 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
    });
  });

  describe('AI Suggestions Generation', () => {
    beforeEach(() => {
      component.session = mockSession;
    });

    it('should generate suggestions from server when data ID exists', () => {
      mockMappingService.getDataId.and.returnValue('existing-data-id');
      mockMappingService.getAiSuggestionsFromServer.and.returnValue(of(mockAiSuggestions));
      
      component.generateSuggestions();
      
      expect(mockMappingService.getAiSuggestionsFromServer).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse(); // Loading completes synchronously with of()
      expect(component.suggestions).toEqual(mockAiSuggestions);
    });

    it('should upload file first when no data ID exists', () => {
      mockMappingService.getDataId.and.returnValue(null);
      mockMappingService.uploadFileToServer.and.returnValue(of('new-data-id'));
      mockMappingService.getAiSuggestionsFromServer.and.returnValue(of(mockAiSuggestions));
      
      component.generateSuggestions();
      
      expect(mockMappingService.uploadFileToServer).toHaveBeenCalled();
    });

    it('should fallback to local suggestions on server error', () => {
      mockMappingService.getDataId.and.returnValue('data-id');
      mockMappingService.getAiSuggestionsFromServer.and.returnValue(throwError(() => new Error('Server error')));
      mockMappingService.generateLocalAiSuggestions.and.returnValue(mockAiSuggestions);
      
      component.generateSuggestions();
      
      expect(mockMappingService.generateLocalAiSuggestions).toHaveBeenCalledWith(mockSession);
    });

    it('should not generate suggestions when no session exists', () => {
      component.session = null;
      
      component.generateSuggestions();
      
      expect(mockMappingService.getDataId).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Suggestion Management', () => {
    beforeEach(() => {
      component.session = mockSession;
      component.suggestions = [...mockAiSuggestions];
    });

    it('should accept a suggestion', () => {
      const suggestion = mockAiSuggestions[0];
      mockMappingService.submitFeedbackToServer.and.returnValue(of({}));
      
      component.acceptSuggestion(suggestion);
      
      expect(mockMappingService.acceptAiSuggestion).toHaveBeenCalledWith(suggestion);
      expect(component.acceptedSuggestions).toContain(suggestion);
      expect(component.suggestions).not.toContain(suggestion);
    });

    it('should reject a suggestion', () => {
      const suggestion = mockAiSuggestions[0];
      mockMappingService.submitFeedbackToServer.and.returnValue(of({}));
      
      component.rejectSuggestion(suggestion);
      
      expect(component.rejectedSuggestions).toContain(suggestion);
      expect(component.suggestions).not.toContain(suggestion);
    });

    it('should accept all suggestions', () => {
      mockMappingService.submitFeedbackToServer.and.returnValue(of({}));
      
      component.acceptAllSuggestions();
      
      expect(component.acceptedSuggestions.length).toBe(mockAiSuggestions.length);
      expect(component.suggestions.length).toBe(0);
    });

    it('should reject all suggestions', () => {
      mockMappingService.submitFeedbackToServer.and.returnValue(of({}));
      
      component.rejectAllSuggestions();
      
      expect(component.rejectedSuggestions.length).toBe(mockAiSuggestions.length);
      expect(component.suggestions.length).toBe(0);
    });

    it('should accept high confidence suggestions', () => {
      component.suggestions = [
        { ...mockAiSuggestions[0], confidence: 85 },
        { ...mockAiSuggestions[1], confidence: 65 }
      ];
      
      component.acceptHighConfidenceSuggestions();
      
      expect(mockMappingService.acceptAiSuggestion).toHaveBeenCalledTimes(1);
      expect(component.suggestions.length).toBe(1);
    });
  });

  describe('Confidence Level Methods', () => {
    it('should return correct confidence level', () => {
      expect(component.getConfidenceLevel(85)).toBe('high');
      expect(component.getConfidenceLevel(75)).toBe('medium');
      expect(component.getConfidenceLevel(45)).toBe('low');
    });

    it('should return correct confidence color', () => {
      expect(component.getConfidenceColor(85)).toBe('var(--success-color)');
      expect(component.getConfidenceColor(75)).toBe('var(--warning-color)');
      expect(component.getConfidenceColor(45)).toBe('var(--error-color)');
    });

    it('should count suggestions correctly', () => {
      component.suggestions = [
        { ...mockAiSuggestions[0], confidence: 85 },
        { ...mockAiSuggestions[1], confidence: 75 },
        { ...mockAiSuggestions[0], confidence: 45 }
      ];
      
      expect(component.getSuggestionsCount()).toBe(3);
      expect(component.getHighConfidenceCount()).toBe(1);
      expect(component.getMediumConfidenceCount()).toBe(1);
      expect(component.getLowConfidenceCount()).toBe(1);
    });
  });

  describe('UI Helper Methods', () => {
    beforeEach(() => {
      component.session = mockSession;
    });

    it('should check if suggestion is accepted', () => {
      const suggestion = mockAiSuggestions[0];
      
      // Mock session mapping
      component.session!.mappings = [{
        templateField: suggestion.templateField,
        excelColumn: suggestion.suggestedColumn,
        confidence: suggestion.confidence,
        isAiSuggested: true
      }];
      
      expect(component.isAccepted(suggestion)).toBeTrue();
    });

    it('should handle override suggestion', () => {
      const suggestion = mockAiSuggestions[0];
      spyOn(console, 'log');
      
      component.overrideSuggestion(suggestion);
      
      expect(console.log).toHaveBeenCalledWith('Override suggestion:', suggestion);
    });

    it('should check if all suggestions are accepted', () => {
      component.suggestions = [mockAiSuggestions[0]];
      component.session!.mappings = [{
        templateField: mockAiSuggestions[0].templateField,
        excelColumn: mockAiSuggestions[0].suggestedColumn,
        confidence: mockAiSuggestions[0].confidence,
        isAiSuggested: true
      }];
      
      expect(component.allAccepted).toBeTrue();
    });
  });

  describe('Navigation', () => {
    it('should navigate to mapping', () => {
      component.goBackToMapping();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/mapping']);
    });

    it('should navigate to upload', () => {
      component.goToUpload();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/upload']);
    });

    it('should navigate to preview with validation', () => {
      mockMappingService.validateMappingsWithServer.and.returnValue(of({}));
      
      component.proceedToPreview();
      
      expect(mockMappingService.validateMappingsWithServer).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/preview']);
    });

    it('should navigate to preview even if validation fails', () => {
      mockMappingService.validateMappingsWithServer.and.returnValue(throwError(() => new Error('Validation failed')));
      
      component.proceedToPreview();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/preview']);
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh suggestions', () => {
      component.error = 'Previous error';
      component.acceptedSuggestions = [mockAiSuggestions[0]];
      component.rejectedSuggestions = [mockAiSuggestions[1]];
      spyOn(component, 'generateSuggestions');
      
      component.refreshSuggestions();
      
      expect(component.error).toBeNull();
      expect(component.acceptedSuggestions.length).toBe(0);
      expect(component.rejectedSuggestions.length).toBe(0);
      expect(component.generateSuggestions).toHaveBeenCalled();
    });

    it('should regenerate suggestions', () => {
      component.error = 'Previous error';
      spyOn(component, 'generateSuggestions');
      
      component.regenerateSuggestions();
      
      expect(component.error).toBeNull();
      expect(component.generateSuggestions).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', () => {
      const errorMessage = 'Server connection failed';
      spyOn(console, 'error');
      
      component['handleError']('AI server error', new Error(errorMessage));
      
      expect(component.error).toBe('AI server error');
      expect(console.error).toHaveBeenCalled();
    });
  });
});