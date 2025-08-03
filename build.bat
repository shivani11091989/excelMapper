@echo off
echo 🚀 Building ExcelMapperPro Frontend...

echo 📦 Installing dependencies...
call npm install

echo 🔨 Building application...
call npm run build

echo 🐳 Building Docker image...
docker build -t excel-mapper-frontend:latest .

echo ✅ Build completed successfully!
echo 🌐 To run the application:
echo    Development: npm start
echo    Docker: docker run -p 4200:80 excel-mapper-frontend:latest