import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExcelService } from '../../services/excel.service';
import { MappingService } from '../../services/mapping.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.css'
})
export class FileUploadComponent {
  selectedFile: File | null = null;
  uploadedFile: File | null = null;
  excelColumns: any[] = [];
  isDragOver = false;
  isProcessing = false;
  processingProgress = 0;
  errorMessage = '';

  constructor(
    private excelService: ExcelService,
    private mappingService: MappingService,
    private router: Router
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.errorMessage = '';
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.errorMessage = 'Please select a valid Excel file (.xlsx or .xls)';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'File size must be less than 10MB';
      return;
    }

    this.selectedFile = file;
    this.processFile();
  }

  processFile(): void {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.processingProgress = 0;
    this.errorMessage = '';

    // Simulate progress
    const progressInterval = setInterval(() => {
      this.processingProgress += 10;
      if (this.processingProgress >= 90) {
        clearInterval(progressInterval);
      }
    }, 100);

    this.excelService.parseExcelFile(this.selectedFile)
      .then(result => {
        console.log('Parsed Excel Data:', result);
        clearInterval(progressInterval);
        this.processingProgress = 100;
        
        setTimeout(() => {
          this.uploadedFile = this.selectedFile;
          this.excelColumns = result.columns;
          this.isProcessing = false;
          
          // Store the uploaded file in mapping service for API upload
          this.mappingService.setUploadedFile(this.selectedFile!);
          
          // Create mapping session
          const session = this.mappingService.createSession(
            this.selectedFile!.name,
            result.columns,
            result.data
          );
        }, 500);
      })
      .catch(error => {
        clearInterval(progressInterval);
        this.isProcessing = false;
        this.processingProgress = 0;
        this.errorMessage = `Error processing file: ${error.message}`;
      });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getColumnCount(): number {
    return this.excelColumns.length;
  }

  getRowCount(): number {
    // This would typically come from the parsed Excel data
    // For now, return a placeholder value
    return this.excelColumns.length > 0 ? 100 : 0;
  }

  resetUpload(): void {
    this.selectedFile = null;
    this.uploadedFile = null;
    this.excelColumns = [];
    this.isProcessing = false;
    this.processingProgress = 0;
    this.errorMessage = '';
  }

  proceedToMapping(): void {
    this.router.navigate(['/mapping']);
  }
}