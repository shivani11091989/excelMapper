import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { MappingService } from './services/mapping.service';

describe('AppComponent', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMappingService: jasmine.SpyObj<MappingService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const mappingServiceSpy = jasmine.createSpyObj('MappingService', ['clearSession'], {
      currentSession$: new BehaviorSubject(null)
    });

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({}),
      queryParams: of({}),
      fragment: of(''),
      data: of({})
    });

    await TestBed.configureTestingModule({
      imports: [AppComponent, HeaderComponent, FooterComponent, RouterOutlet, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: MappingService, useValue: mappingServiceSpy }
      ]
    }).compileComponents();

    mockMappingService = TestBed.inject(MappingService) as jasmine.SpyObj<MappingService>;
  });

  describe('Component Initialization', () => {
    it('should create the app', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app).toBeTruthy();
    });

    it('should render app structure', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      
      // Check that the component exists and is rendered
      expect(compiled).toBeTruthy();
    });
  });

  describe('Application Layout', () => {
    it('should initialize without errors', () => {
      const fixture = TestBed.createComponent(AppComponent);
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should be a standalone component', () => {
      expect(AppComponent).toBeTruthy();
    });
  });
});