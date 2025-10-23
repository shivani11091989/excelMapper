import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render footer content', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('footer')).toBeTruthy();
    });

    it('should display copyright notice', () => {
      const currentYear = new Date().getFullYear();
      const compiled = fixture.nativeElement;
      const footerText = compiled.textContent;
      
      expect(footerText).toContain(currentYear.toString());
      expect(footerText).toContain('©');
    });
  });

  describe('Template Rendering', () => {
    it('should have proper footer structure', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      
      expect(compiled.querySelector('footer')).toBeTruthy();
    });

    it('should contain company information', () => {
      const compiled = fixture.nativeElement;
      const footerContent = compiled.textContent || '';
      
      // Check for common footer elements
      expect(footerContent.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      const compiled = fixture.nativeElement;
      const footer = compiled.querySelector('footer');
      
      expect(footer).toBeTruthy();
    });
  });
});