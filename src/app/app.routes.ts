import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { 
    path: 'upload', 
    loadComponent: () => import('./components/file-upload/file-upload.component').then(m => m.FileUploadComponent)
  },
  { 
    path: 'mapping', 
    loadComponent: () => import('./components/schema-mapping/schema-mapping.component').then(m => m.SchemaMappingComponent)
  },
  { 
    path: 'ai-suggestions', 
    loadComponent: () => import('./components/ai-suggestions/ai-suggestions.component').then(m => m.AiSuggestionsComponent)
  },
  { 
    path: 'preview', 
    loadComponent: () => import('./components/preview-data/preview-data.component').then(m => m.PreviewDataComponent)
  },
  { 
    path: 'export', 
    loadComponent: () => import('./components/export-results/export-results.component').then(m => m.ExportResultsComponent)
  },
  { path: '**', redirectTo: '/upload' }
];