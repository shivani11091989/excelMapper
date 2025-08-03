#!/bin/bash

# Build script for ExcelMapperPro Frontend

echo "🚀 Building ExcelMapperPro Frontend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t excel-mapper-frontend:latest .

echo "✅ Build completed successfully!"
echo "🌐 To run the application:"
echo "   Development: npm start"
echo "   Docker: docker run -p 4200:80 excel-mapper-frontend:latest"