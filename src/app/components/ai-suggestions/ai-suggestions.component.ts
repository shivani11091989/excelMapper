import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MappingService } from '../../services/mapping.service';
import { MappingSession, AiSuggestion } from '../../models/mapping.model';

@Component({
  selector: 'app-ai-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-suggestions.component.html',
  styleUrl: './ai-suggestions.component.css'
})
export class AiSuggestionsComponent implements OnInit, OnDestroy {
  session: MappingSession | null = null;
  suggestions: AiSuggestion[] = [];
  isLoading = false;
  error: string | null = null;
  acceptedSuggestions: AiSuggestion[] = [];
  rejectedSuggestions: AiSuggestion[] = [];
  private subscriptions = new Subscription();

  constructor(
    private mappingService: MappingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.mappingService.currentSession$.subscribe(session => {
        this.session = session;
        if (session) {
          this.checkServerHealth();
          this.generateSuggestions();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  generateSuggestions(): void {
    if (!this.session) return;

    this.isLoading = true;
    this.error = null;
    
    // First try to upload file to server if not already uploaded
    const dataId = this.mappingService.getDataId();
    
    if (!dataId) {
      // Upload file first, then get suggestions
      this.subscriptions.add(
        this.mappingService.uploadFileToServer().subscribe({
          next: (uploadedDataId) => {
            console.log('File uploaded with data_id:', uploadedDataId);
            this.getSuggestionsFromServer();
          },
          error: (error) => {
            console.error('Error uploading file:', error);
            this.handleError('Failed to upload file to server. Using local suggestions.', error);
            this.generateLocalSuggestions();
          }
        })
      );
    } else {
      // Data already uploaded, get suggestions
      this.getSuggestionsFromServer();
    }
  }

  private getSuggestionsFromServer(): void {
    this.subscriptions.add(
      this.mappingService.getAiSuggestionsFromServer().subscribe({
        next: (suggestions) => {
          this.suggestions = suggestions;
          this.isLoading = false;
          console.log('Received AI suggestions from server:', suggestions);
        },
        error: (error) => {
          console.error('Error getting AI suggestions:', error);
          this.handleError('Failed to get AI suggestions from server. Using local suggestions.', error);
          this.generateLocalSuggestions();
        }
      })
    );
  }

  private generateLocalSuggestions(): void {
    // Fallback to local suggestions
    if (this.session) {
      this.suggestions = this.mappingService.generateLocalAiSuggestions(this.session);
    }
    this.isLoading = false;
  }

  private handleError(message: string, error: any): void {
    this.error = message;
    console.error(message, error);
  }

  private checkServerHealth(): void {
    this.subscriptions.add(
      this.mappingService.checkServerHealth().subscribe({
        next: (health: any) => {
          console.log('AI Server is healthy:', health);
        },
        error: (error: any) => {
          console.warn('AI Server health check failed:', error);
          console.log('Will fallback to local suggestions if server calls fail');
        }
      })
    );
  }

  acceptSuggestion(suggestion: AiSuggestion): void {
    this.mappingService.acceptAiSuggestion(suggestion);
    this.acceptedSuggestions.push(suggestion);
    this.suggestions = this.suggestions.filter(s => s !== suggestion);
    this.sendFeedbackToServer();
  }

  rejectSuggestion(suggestion: AiSuggestion): void {
    this.rejectedSuggestions.push(suggestion);
    this.suggestions = this.suggestions.filter(s => s !== suggestion);
    this.sendFeedbackToServer();
  }

  acceptAllSuggestions(): void {
    this.suggestions.forEach(suggestion => {
      this.mappingService.acceptAiSuggestion(suggestion);
      this.acceptedSuggestions.push(suggestion);
    });
    this.suggestions = [];
    this.sendFeedbackToServer();
  }

  rejectAllSuggestions(): void {
    this.rejectedSuggestions.push(...this.suggestions);
    this.suggestions = [];
    this.sendFeedbackToServer();
  }

  private sendFeedbackToServer(): void {
    if (this.acceptedSuggestions.length > 0 || this.rejectedSuggestions.length > 0) {
      this.subscriptions.add(
        this.mappingService.submitFeedbackToServer(this.acceptedSuggestions, this.rejectedSuggestions).subscribe({
          next: (response) => {
            console.log('Feedback sent successfully:', response);
          },
          error: (error) => {
            console.error('Error sending feedback:', error);
            // Continue without blocking the UI
          }
        })
      );
    }
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
    this.error = null;
    this.acceptedSuggestions = [];
    this.rejectedSuggestions = [];
    this.generateSuggestions();
  }

  regenerateSuggestions(): void {
    this.error = null;
    this.acceptedSuggestions = [];
    this.rejectedSuggestions = [];
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
    // Validate mappings with server before proceeding
    this.subscriptions.add(
      this.mappingService.validateMappingsWithServer().subscribe({
        next: (response) => {
          console.log('Mappings validated successfully:', response);
          this.router.navigate(['/preview']);
        },
        error: (error) => {
          console.error('Error validating mappings:', error);
          // Proceed anyway since validation is optional
          this.router.navigate(['/preview']);
        }
      })
    );
  }

  goToUpload(): void {
    this.router.navigate(['/upload']);
  }
}