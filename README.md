# ExcelMapperPro Frontend

A modern Angular-based web application for mapping Excel files to predefined schemas for industrial asset management systems.

## Features

- **File Upload**: Drag-and-drop or click-to-upload Excel files (.xlsx format)
- **Schema Mapping**: Visual side-by-side mapping interface with dropdown selectors
- **AI-Powered Suggestions**: Server-based intelligent column mapping with confidence scores
- **Smart Fallback**: Automatic fallback to local suggestions if AI server is unavailable
- **Data Preview**: Table-based preview of mapped data with validation and quality checks
- **Export Options**: Download results in CSV, XLSX, or JSON formats
- **Responsive Design**: Works on desktop and mobile devices
- **Docker Support**: Easy deployment with Docker containers

## Technology Stack

- **Frontend**: Angular 17 with standalone components
- **Styling**: SCSS with custom CSS variables
- **Excel Processing**: SheetJS (xlsx library)
- **Build Tool**: Angular CLI
- **Container**: Docker with Nginx

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd excel-mapper-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start AI Server (Optional)**
   ```bash
   # Start the AI server on port 3000 for intelligent suggestions
   # If not available, the app will use local suggestions
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open browser**
   Navigate to `http://localhost:4200`

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t excel-mapper-frontend .
   ```

2. **Run container**
   ```bash
   docker run -p 4200:80 excel-mapper-frontend
   ```

3. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

## Application Workflow

1. **File Upload**: Users upload Excel files through drag-and-drop interface
2. **Schema Mapping**: Map Excel columns to predefined template fields
3. **AI Suggestions**: Review and accept/override AI-generated mapping suggestions
4. **Data Preview**: Preview mapped data in table format with validation
5. **Export Results**: Download processed data in preferred format

## Project Structure

```
src/
├── app/
│   ├── components/          # Feature components
│   │   ├── file-upload/     # File upload interface
│   │   ├── schema-mapping/  # Column mapping interface
│   │   ├── ai-suggestions/  # AI suggestions panel
│   │   ├── preview-data/    # Data preview table
│   │   ├── export-results/  # Export summary
│   │   ├── header/          # Navigation header
│   │   └── footer/          # Footer component
│   ├── services/            # Business logic services
│   │   ├── excel.service.ts # Excel file processing
│   │   └── mapping.service.ts # Mapping logic
│   ├── models/              # TypeScript interfaces
│   └── app.component.ts     # Root component
├── styles.scss              # Global styles
└── index.html              # Main HTML template
```

## Configuration

### Template Schema

The application uses a predefined schema for industrial asset management. You can modify the template fields in `src/app/services/mapping.service.ts`:

```typescript
private templateFields: TemplateField[] = [
  {
    name: 'assetId',
    displayName: 'Asset ID',
    dataType: 'string',
    required: true,
    description: 'Unique identifier for the asset'
  },
  // Add more fields as needed
];
```

### Styling

Custom CSS variables are defined in `src/styles.scss` for easy theme customization:

```scss
:root {
  --primary-color: #1a1a2e;
  --secondary-color: #16213e;
  --accent-color: #0f3460;
  // Modify colors as needed
}
```

## AI Server Integration

The application integrates with an AI server for intelligent column mapping suggestions. The AI server should be running on `http://localhost:3000` and provides the following endpoints:

### AI Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/match-ai/v1/data/upload` | POST | Upload Excel file for AI processing |
| `/api/match-ai/v1/data/{data_id}/suggestions` | GET | Get AI-generated mapping suggestions |
| `/api/match-ai/v1/data/{data_id}/feedback` | POST | Submit user feedback on suggestions |
| `/api/match-ai/v1/data/{data_id}/validate` | POST | Store validated mapping configuration |
| `/api/match-ai/v1/data/{data_id}/info` | GET | Get information about uploaded data |
| `/api/match-ai/v1/health` | GET | Check AI server health status |

### AI Server Setup

1. **Start the AI Server**
   ```bash
   # Make sure the AI server is running on port 3000
   # The application will automatically check server health
   ```

2. **Server Health Check**
   - The application automatically checks if the AI server is available
   - If the server is unavailable, it falls back to local suggestions
   - Health status is logged in the browser console

3. **AI Suggestions Workflow**
   - Upload Excel file to AI server for analysis
   - Receive intelligent mapping suggestions with confidence scores
   - Accept/reject suggestions with user feedback
   - Store final validated mappings

### Configuration

The AI server URL can be configured in `src/app/services/api.service.ts`:

```typescript
export class ApiService {
  private baseUrl = 'http://localhost:3000/api/match-ai/v1';
  // Update this URL to match your AI server deployment
}
```

### Fallback Behavior

If the AI server is not available, the application will:
- Show a warning in the console
- Generate local suggestions based on string similarity
- Continue normal operation without server-dependent features

### Troubleshooting AI Server

**Check Server Status:**
```bash
# Verify AI server is running
curl http://localhost:3000/api/match-ai/v1/health

# Expected response: {"status": "healthy"}
```

**Common Issues:**
- **Connection refused**: Ensure AI server is running on port 3000
- **CORS errors**: AI server must allow requests from `http://localhost:4200`
- **404 errors**: Verify AI server endpoints match the expected API structure

**Console Logging:**
- Open browser developer tools to see AI server communication logs
- Health check results are logged when accessing AI Suggestions

## API Integration

The application is designed to work with backend APIs. To integrate:

1. Update `src/app/services/mapping.service.ts` to call your API endpoints
2. Modify the data processing logic to match your backend schema
3. Update the export functionality to use your preferred data formats

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Large Excel files (>10MB) are rejected to prevent memory issues
- Data processing is limited to prevent browser freezing
- Lazy loading is used for route components
- Gzip compression is enabled in production

## Security Features

- File type validation (only .xlsx files accepted)
- File size limits (10MB maximum)
- XSS protection headers
- Content Security Policy headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## Changelog

### Version 1.0.0
- Initial release
- File upload functionality
- Schema mapping interface
- AI suggestions panel
- Data preview and export
- Docker support