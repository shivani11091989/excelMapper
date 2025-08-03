import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MappingService } from '../../services/mapping.service';
import { MappingSession, AiSuggestion } from '../../models/mapping.model';

@Component({
  selector: 'app-ai-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-suggestions.component.html',
  styleUrl: './ai-suggestions.component.css'
})
export class AiSuggestionsComponent implements OnInit {
  session: MappingSession | null = null;
  suggestions: AiSuggestion[] = [];
  isLoading = false;

  constructor(
    private mappingService: MappingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mappingService.currentSession$.subscribe(session => {
      this.session = session;
      if (session) {
        this.generateSuggestions();
      }
    });
  }

  generateSuggestions(): void {
    if (!this.session) return;

    this.isLoading = true;
    
    // Simulate AI processing delay
    setTimeout(() => {
      this.suggestions = this.mappingService.generateAiSuggestions(this.session!);
      this.isLoading = false;
    }, 1500);
  }

  acceptSuggestion(suggestion: AiSuggestion): void {
    this.mappingService.acceptAiSuggestion(suggestion);
    this.suggestions = this.suggestions.filter(s => s !== suggestion);
  }

  rejectSuggestion(suggestion: AiSuggestion): void {
    this.suggestions = this.suggestions.filter(s => s !== suggestion);
  }

  acceptAllSuggestions(): void {
    this.suggestions.forEach(suggestion => {
      this.mappingService.acceptAiSuggestion(suggestion);
    });
    this.suggestions = [];
  }

  rejectAllSuggestions(): void {
    this.suggestions = [];
  }

  acceptHighConfidenceSuggestions(): void {
    const highConfidenceSuggestions = this.suggestions.filter(s => s.confidence >= 80);
    highConfidenceSuggestions.forEach(suggestion => {
      this.mappingService.acceptAiSuggestion(suggestion);
    });
    this.suggestions = this.suggestions.filter(s => s.confidence < 80);
  }

  getConfidenceLevel(confidence: number): string {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'var(--success-color)';
    if (confidence >= 60) return 'var(--warning-color)';
    return 'var(--error-color)';
  }

  getSuggestionsCount(): number {
    return this.suggestions.length;
  }

  getHighConfidenceCount(): number {
    return this.suggestions.filter(s => s.confidence >= 80).length;
  }

  getMediumConfidenceCount(): number {
    return this.suggestions.filter(s => s.confidence >= 60 && s.confidence < 80).length;
  }

  getLowConfidenceCount(): number {
    return this.suggestions.filter(s => s.confidence < 60).length;
  }

  refreshSuggestions(): void {
    this.generateSuggestions();
  }

  regenerateSuggestions(): void {
    this.generateSuggestions();
  }

  isAccepted(suggestion: AiSuggestion): boolean {
    if (!this.session) return false;
    
    const mapping = this.session.mappings.find(m => 
      m.templateField.name === suggestion.templateField.name
    );
    
    return mapping?.excelColumn?.name === suggestion.suggestedColumn.name;
  }

  overrideSuggestion(suggestion: AiSuggestion): void {
    // This would open a modal or form to manually override the suggestion
    console.log('Override suggestion:', suggestion);
  }

  goBackToMapping(): void {
    this.router.navigate(['/mapping']);
  }

  get allAccepted(): boolean {
    return this.suggestions.every(suggestion => this.isAccepted(suggestion));
  }

  proceedToPreview(): void {
    this.router.navigate(['/preview']);
  }

  goToUpload(): void {
    this.router.navigate(['/upload']);
  }
}