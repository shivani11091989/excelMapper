import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MappingService } from '../../services/mapping.service';
import { MappingSession } from '../../models/mapping.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  session: MappingSession | null = null;
  isMobileMenuOpen = false;

  constructor(
    private mappingService: MappingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mappingService.currentSession$.subscribe(session => {
      this.session = session;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  getCurrentStep(): number {
    if (!this.session) return 0;
    
    switch (this.session.status) {
      case 'uploaded': return 1;
      case 'mapped': return 2;
      case 'previewed': return 3;
      case 'exported': return 4;
      default: return 0;
    }
  }

  getStepName(): string {
    if (!this.session) return 'Start';
    
    switch (this.session.status) {
      case 'uploaded': return 'File Uploaded';
      case 'mapped': return 'Schema Mapped';
      case 'previewed': return 'Data Previewed';
      case 'exported': return 'Export Complete';
      default: return 'Start';
    }
  }

  isStepCompleted(step: number): boolean {
    return this.getCurrentStep() > step;
  }

  isStepActive(step: number): boolean {
    return this.getCurrentStep() === step;
  }

  clearSession(): void {
    this.mappingService.clearSession();
    this.router.navigate(['/upload']);
    this.closeMobileMenu();
  }

  navigateToUpload(): void {
    this.router.navigate(['/upload']);
    this.closeMobileMenu();
  }

  navigateToMapping(): void {
    if (this.session) {
      this.router.navigate(['/mapping']);
    }
    this.closeMobileMenu();
  }

  navigateToPreview(): void {
    if (this.session && this.getCurrentStep() >= 2) {
      this.router.navigate(['/preview']);
    }
    this.closeMobileMenu();
  }

  navigateToExport(): void {
    if (this.session && this.getCurrentStep() >= 3) {
      this.router.navigate(['/export']);
    }
    this.closeMobileMenu();
  }

  hasActiveSession(): boolean {
    return this.session !== null;
  }

  get currentSession(): MappingSession | null {
    return this.session;
  }

  getMappedCount(): number {
    if (!this.session) return 0;
    return this.session.mappings.filter(m => m.excelColumn).length;
  }
}