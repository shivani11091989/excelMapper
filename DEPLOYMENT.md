# ExcelMapperPro - Deployment Guide

## 🚀 Quick Start

### Development Environment

1. **Prerequisites**
   ```bash
   Node.js 18+ (LTS recommended)
   npm 9+
   ```

2. **Install Dependencies**
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```
   Application will be available at: `http://localhost:4200`

4. **Build for Production**
   ```bash
   npm run build
   ```

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t excel-mapper-frontend:latest .
   ```

2. **Run Container**
   ```bash
   docker run -p 4200:80 excel-mapper-frontend:latest
   ```

3. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

## 🏗️ Application Architecture

### Component Structure
```
src/app/
├── components/
│   ├── file-upload/          # Excel file upload with drag-and-drop
│   ├── schema-mapping/       # Side-by-side column mapping interface
│   ├── ai-suggestions/       # AI-powered mapping suggestions
│   ├── preview-data/         # Table-based data preview
│   ├── export-results/       # Export summary and download options
│   ├── header/              # Navigation header
│   └── footer/              # Application footer
├── services/
│   ├── excel.service.ts     # Excel file processing (SheetJS)
│   └── mapping.service.ts   # Mapping logic and AI suggestions
└── models/
    └── mapping.model.ts     # TypeScript interfaces
```

### Key Features Implemented

✅ **File Upload**
- Drag-and-drop interface
- File validation (.xlsx only)
- Size limits (10MB max)
- Progress indicators

✅ **Schema Mapping**
- Side-by-side column view
- Drag-and-drop mapping
- Dropdown selection
- Required field validation

✅ **AI Suggestions**
- String similarity matching
- Data type compatibility
- Confidence scoring
- Accept/override options

✅ **Data Preview**
- Table-based display (as requested)
- Data validation
- Quality issue detection
- Statistics overview

✅ **Export Options**
- CSV, XLSX, JSON formats
- Error reporting
- Success metrics
- Download functionality

## 🎨 UI/UX Features

### Design System
- **Dark theme** with professional color scheme
- **Responsive design** for desktop and mobile
- **Material Design** inspired components
- **Accessibility** features included

### User Experience
- **Progressive workflow** with clear navigation
- **Visual feedback** for all actions
- **Error handling** with helpful messages
- **Non-technical user friendly** interface

## 🔧 Configuration

### Template Schema Customization

Edit `src/app/services/mapping.service.ts` to modify the asset management schema:

```typescript
private templateFields: TemplateField[] = [
  {
    name: 'assetId',
    displayName: 'Asset ID',
    dataType: 'string',
    required: true,
    description: 'Unique identifier for the asset'
  },
  // Add your custom fields here
];
```

### Styling Customization

Modify CSS variables in `src/styles.scss`:

```scss
:root {
  --primary-color: #1a1a2e;    // Main background
  --secondary-color: #16213e;   // Secondary background
  --accent-color: #0f3460;      // Accent color
  --text-color: #ffffff;        // Primary text
  --text-secondary: #b0b0b0;    // Secondary text
}
```

## 🐳 Docker Configuration

### Dockerfile Features
- **Multi-stage build** for optimized image size
- **Nginx** for production serving
- **Gzip compression** enabled
- **Security headers** configured

### Production Optimizations
- **Bundle optimization** with Angular CLI
- **Lazy loading** for route components
- **Tree shaking** for unused code elimination
- **Asset caching** with proper headers

## 🔒 Security Features

- **File type validation** (only .xlsx accepted)
- **File size limits** to prevent DoS
- **XSS protection** headers
- **Content Security Policy** headers
- **Input sanitization** for all user data

## 📊 Performance Considerations

- **Large file handling** with progress indicators
- **Memory management** for Excel processing
- **Lazy loading** for better initial load times
- **Optimized bundle sizes** with code splitting

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run e2e
```

### Build Verification
```bash
npm run build
npm run test:prod
```

## 🚀 Production Deployment

### Environment Variables
Create `.env.production` file:
```
NODE_ENV=production
API_BASE_URL=https://your-api-domain.com
MAX_FILE_SIZE=10485760
```

### Nginx Configuration
The included `nginx.conf` provides:
- **SPA routing** support
- **Gzip compression**
- **Security headers**
- **Asset caching**

### Health Checks
Docker health check endpoint: `http://localhost/`

## 📈 Monitoring

### Application Metrics
- File upload success rates
- Mapping completion rates
- Export success rates
- User session duration

### Performance Metrics
- Bundle size monitoring
- Load time tracking
- Memory usage optimization
- Error rate monitoring

## 🔄 CI/CD Pipeline

### Build Pipeline
```yaml
# Example GitHub Actions workflow
name: Build and Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: docker build -t excel-mapper .
```

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+ required)
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

2. **Memory Issues**
   - Increase Node.js memory: `node --max-old-space-size=4096`
   - Reduce file size limits in configuration

3. **Docker Issues**
   - Check Docker daemon is running
   - Verify port 4200 is available
   - Check Docker logs: `docker logs <container-id>`

### Support Channels
- GitHub Issues for bug reports
- Documentation wiki for guides
- Development team contact for urgent issues

## 📝 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for Industrial Asset Management**