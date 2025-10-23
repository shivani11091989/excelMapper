import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { MappingService } from '../../services/mapping.service';
import { MappingSession } from '../../models/mapping.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockMappingService: jasmine.SpyObj<MappingService>;
  let mockRouter: jasmine.Spy;
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
    status: 'mapped'
  };

  beforeEach(async () => {
    sessionSubject = new BehaviorSubject<MappingSession | null>(null);
    const mappingServiceSpy = jasmine.createSpyObj('MappingService', [
      'clearSession'
    ], {
      currentSession$: sessionSubject.asObservable()
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({}),
      queryParams: of({}),
      fragment: of(''),
      data: of({})
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: MappingService, useValue: mappingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    mockMappingService = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
    
    // Get the real Router from TestBed and spy on its navigate method
    const router = TestBed.inject(Router);
    mockRouter = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.session).toBeNull();
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should subscribe to session changes', () => {
      component.ngOnInit();
      sessionSubject.next(mockSession);
      
      expect(component.session).toBe(mockSession);
    });

    it('should handle null session', () => {
      component.ngOnInit();
      sessionSubject.next(null);
      
      expect(component.session).toBeNull();
    });
  });

  describe('Mobile Menu', () => {
    it('should toggle mobile menu', () => {
      expect(component.isMobileMenuOpen).toBeFalse();
      
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeTrue();
      
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should close mobile menu', () => {
      component.isMobileMenuOpen = true;
      
      component.closeMobileMenu();
      expect(component.isMobileMenuOpen).toBeFalse();
    });
  });

  describe('Navigation', () => {
    it('should navigate to upload', () => {
      component.navigateToUpload();
      
      expect(mockRouter).toHaveBeenCalledWith(['/upload']);
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should navigate to mapping when session exists', () => {
      component.session = mockSession;
      
      component.navigateToMapping();
      
      expect(mockRouter).toHaveBeenCalledWith(['/mapping']);
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should not navigate to mapping when no session', () => {
      component.session = null;
      
      component.navigateToMapping();
      
      expect(mockRouter).not.toHaveBeenCalled();
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should navigate to preview when conditions are met', () => {
      component.session = mockSession;
      spyOn(component, 'getCurrentStep').and.returnValue(2);
      
      component.navigateToPreview();
      
      expect(mockRouter).toHaveBeenCalledWith(['/preview']);
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should navigate to export when conditions are met', () => {
      component.session = mockSession;
      spyOn(component, 'getCurrentStep').and.returnValue(3);
      
      component.navigateToExport();
      
      expect(mockRouter).toHaveBeenCalledWith(['/export']);
      expect(component.isMobileMenuOpen).toBeFalse();
    });
  });

  describe('Step Management', () => {
    beforeEach(() => {
      component.session = mockSession;
    });

    it('should return correct step for uploaded status', () => {
      component.session!.status = 'uploaded';
      expect(component.getCurrentStep()).toBe(1);
    });

    it('should return correct step for mapped status', () => {
      component.session!.status = 'mapped';
      expect(component.getCurrentStep()).toBe(2);
    });

    it('should return correct step for previewed status', () => {
      component.session!.status = 'previewed';
      expect(component.getCurrentStep()).toBe(3);
    });

    it('should return correct step for exported status', () => {
      component.session!.status = 'exported';
      expect(component.getCurrentStep()).toBe(4);
    });

    it('should return 0 for no session', () => {
      component.session = null;
      expect(component.getCurrentStep()).toBe(0);
    });

    it('should return correct step names', () => {
      component.session!.status = 'uploaded';
      expect(component.getStepName()).toBe('File Uploaded');

      component.session!.status = 'mapped';
      expect(component.getStepName()).toBe('Schema Mapped');

      component.session!.status = 'previewed';
      expect(component.getStepName()).toBe('Data Previewed');

      component.session!.status = 'exported';
      expect(component.getStepName()).toBe('Export Complete');
    });

    it('should check if step is completed', () => {
      spyOn(component, 'getCurrentStep').and.returnValue(3);
      
      expect(component.isStepCompleted(1)).toBeTrue();
      expect(component.isStepCompleted(2)).toBeTrue();
      expect(component.isStepCompleted(3)).toBeFalse();
    });

    it('should check if step is active', () => {
      spyOn(component, 'getCurrentStep').and.returnValue(2);
      
      expect(component.isStepActive(1)).toBeFalse();
      expect(component.isStepActive(2)).toBeTrue();
      expect(component.isStepActive(3)).toBeFalse();
    });
  });

  describe('Session Management', () => {
    it('should clear session and navigate to upload', () => {
      component.clearSession();
      
      expect(mockMappingService.clearSession).toHaveBeenCalled();
      expect(mockRouter).toHaveBeenCalledWith(['/upload']);
      expect(component.isMobileMenuOpen).toBeFalse();
    });

    it('should check if has active session', () => {
      component.session = null;
      expect(component.hasActiveSession()).toBeFalse();

      component.session = mockSession;
      expect(component.hasActiveSession()).toBeTrue();
    });

    it('should return current session', () => {
      component.session = mockSession;
      expect(component.currentSession).toBe(mockSession);
    });

    it('should get mapped count', () => {
      component.session = mockSession;
      component.session.mappings = [{
        templateField: { name: 'field1', displayName: 'Field 1', required: false, dataType: 'string' },
        excelColumn: { name: 'col1', index: 0, dataType: 'string', sampleData: [] },
        confidence: 0.9,
        isAiSuggested: false
      }];
      
      expect(component.getMappedCount()).toBe(1);
    });

    it('should return 0 mapped count when no session', () => {
      component.session = null;
      expect(component.getMappedCount()).toBe(0);
    });
  });

  describe('Session Information', () => {
    beforeEach(() => {
      component.session = mockSession;
    });

    it('should get file name from session', () => {
      expect(component.session?.fileName).toBe('test.xlsx');
    });

    it('should handle null session', () => {
      component.session = null;
      expect(component.session).toBeNull();
    });

    it('should get current step number', () => {
      component.session!.status = 'mapped';
      expect(component.getCurrentStep()).toBe(2);
    });

    it('should return 0 for null session', () => {
      component.session = null;
      expect(component.getCurrentStep()).toBe(0);
    });

    it('should get step name for current status', () => {
      component.session!.status = 'mapped';
      expect(component.getStepName()).toBe('Schema Mapped');
    });

    it('should return Start for null session', () => {
      component.session = null;
      expect(component.getStepName()).toBe('Start');
    });
  });
});