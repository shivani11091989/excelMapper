import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  version = '1.0.0';

  features = [
    'Drag & Drop File Upload',
    'AI-Powered Column Mapping',
    'Real-time Data Preview',
    'Multiple Export Formats',
    'Data Quality Validation'
  ];

  techStack = [
    'Angular 17',
    'TypeScript',
    'SheetJS',
    'RxJS',
    'CSS Grid'
  ];

  socialLinks = [
    { name: 'GitHub', url: '#', icon: 'fab fa-github' },
    { name: 'LinkedIn', url: '#', icon: 'fab fa-linkedin' },
    { name: 'Twitter', url: '#', icon: 'fab fa-twitter' }
  ];

  quickLinks = [
    { name: 'Upload File', url: '/upload' },
    { name: 'Documentation', url: '#' },
    { name: 'API Reference', url: '#' },
    { name: 'Support', url: '#' }
  ];

  legalLinks = [
    { name: 'Privacy Policy', url: '#' },
    { name: 'Terms of Service', url: '#' },
    { name: 'Cookie Policy', url: '#' }
  ];
}