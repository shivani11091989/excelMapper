import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// API Response Types based on OpenAPI spec
export interface UploadResponse {
  status: string;
  message: string;
  data_id: string;
}

export interface Suggestion {
  column_name: string;
  matched_schema_field: string;
  matcher_type: string;
  confidence_score: number;
}

export interface SuggestionsResponse {
  data_id: string;
  suggestions: Suggestion[];
}

export interface FeedbackItem {
  column_name: string;
  matched_schema_field: string;
  is_correct: boolean;
  correct_field?: string;
}

export interface FeedbackRequest {
  feedback: FeedbackItem[];
}

export interface ValidationRequest {
  validated_mappings: Array<{
    column_name: string;
    mapped_field: string;
  }>;
}

export interface ProcessedDataResponse {
  data_id: string;
  processed_data_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api/match-ai/v1'; // Mock AI Server URL
  private authToken: string | null = null;

  constructor(private http: HttpClient) {
    // Initialize with stored token if available
    this.authToken = localStorage.getItem('auth_token');
    console.log('API Service initialized with base URL:', this.baseUrl);
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (this.authToken) {
      headers = headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    return headers;
  }

  private getMultipartHeaders(): HttpHeaders {
    let headers = new HttpHeaders();

    if (this.authToken) {
      headers = headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    return headers;
  }

  /**
   * Upload data file to the server
   * POST /data/upload
   */
  uploadData(file: File, metadata?: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', metadata);
    }

    return this.http.post<UploadResponse>(
      `${this.baseUrl}/data/upload`,
      formData,
      { headers: this.getMultipartHeaders() }
    );
  }

  /**
   * Get AI suggestions for schema matching
   * GET /data/{data_id}/suggestions
   */
  getSuggestions(dataId: string): Observable<SuggestionsResponse> {
    return this.http.get<SuggestionsResponse>(
      `${this.baseUrl}/data/${dataId}/suggestions`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Submit feedback for schema matching suggestions
   * POST /data/{data_id}/feedback
   */
  submitFeedback(dataId: string, feedback: FeedbackRequest): Observable<{status: string, message: string}> {
    return this.http.post<{status: string, message: string}>(
      `${this.baseUrl}/data/${dataId}/feedback`,
      feedback,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Store validated schema mapping
   * POST /data/{data_id}/validate
   */
  validateMapping(dataId: string, validationRequest: ValidationRequest): Observable<{status: string, message: string}> {
    return this.http.post<{status: string, message: string}>(
      `${this.baseUrl}/data/${dataId}/validate`,
      validationRequest,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Helper method to check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.authToken = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Check AI server health status
   * GET /health
   */
  checkHealth(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/health`);
  }

  /**
   * Get data info for uploaded data
   * GET /data/{data_id}/info
   */
  getDataInfo(dataId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/data/${dataId}/info`,
      { headers: this.getHeaders() }
    );
  }
}