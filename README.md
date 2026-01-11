# Admin CMS + Public Catalog API + Scheduled Publishing

A comprehensive Content Management System for educational content with multi-language support, scheduled publishing, and a public catalog API.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │ Publishing      │
│   React + Vite  │◄──►│ Express + Node  │◄──►│ Worker Service  │
│   Port: 3000    │    │   Port: 3001    │    │   Cron Jobs     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │ PostgreSQL DB   │              │
         └──────────────►│   Port: 5432    │◄─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Redis Cache   │
                        │   Port: 6379    │
                        └─────────────────┘
```

## Features

### Content Management
- **Hierarchical Structure**: Programs → Terms → Lessons
- **Multi-language Support**: Content and assets in multiple languages
- **Media Asset Management**: Posters, thumbnails with multiple variants
- **Role-based Access Control**: Admin, Editor, Viewer roles

### Publishing Workflow
- **Scheduled Publishing**: Schedule lessons for future release
- **Automated Publishing**: Background worker processes scheduled content
- **Status Management**: Draft, Scheduled, Published, Archived states
- **Validation**: Asset and content validation before publishing

### Public API
- **Catalog Endpoints**: Public API for published content
- **Filtering & Pagination**: Language, topic, and cursor-based pagination
- **Caching**: Redis caching with proper HTTP headers
- **Performance Optimized**: Database indexes and query optimization

## Technology Stack

### Backend
- **Node.js 18+** with Express.js framework
- **JavaScript ES6+** with JSDoc documentation
- **MongoDB 7+** for primary database
- **Redis 7+** for caching and session storage
- **Mongoose ODM** for database operations and modeling

### Frontend
- **React 18** with JavaScript
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling
- **React Query** for API state management

### Infrastructure
- **Docker & Docker Compose** for containerization
- **Nginx** for reverse proxy and SSL termination
- **Winston** for structured logging

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd admin-cms-catalog
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services with Docker**
   ```bash
   npm run docker:up
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017
   - Redis: localhost:6379

4. **Initialize the database**
   ```bash
   # The database will be automatically initialized with collections and indexes
   # Check the mongo-init.js script for details
   ```

5. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

6. **Access the application**
   - CMS Web App: http://localhost:3000
   - API Documentation: http://localhost:3001/api/docs
   - Health Check: http://localhost:3001/health

### Manual Setup (without Docker)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start MongoDB and Redis**
   ```bash
   # Using your preferred method (Docker, homebrew, apt, etc.)
   # MongoDB: mongodb://localhost:27017
   # Redis: redis://localhost:6379
   ```

3. **Run database setup**
   ```bash
   npm run seed
   ```

4. **Start all services**
   ```bash
   npm run dev
   ```

## Database Setup

### MongoDB Collections and Indexes
The system automatically creates the following collections with proper validation and indexes:
- **users** - User accounts with role-based access
- **topics** - Content categorization
- **programs** - Educational programs
- **terms** - Program terms/semesters  
- **lessons** - Individual lessons with multi-language content
- **programAssets** - Program posters and media
- **lessonAssets** - Lesson thumbnails and media

### Running Database Operations
```bash
# Seed database with sample data
npm run seed

# Connect to MongoDB shell
mongosh mongodb://cms_user:cms_password@localhost:27017/cms_db
```

## Seed Data

The seed script creates:
- **2 Programs** with multi-language content
- **2 Terms** across the programs
- **6 Lessons** with various statuses
- **Sample Assets** for all required variants
- **Test Users** for each role (admin, editor, viewer)
- **1 Scheduled Lesson** for worker demonstration

### Running Seed Script
```bash
npm run seed
```

## API Documentation

### Admin API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/admin/programs` - List programs with filtering
- `POST /api/admin/programs` - Create new program
- `GET /api/admin/programs/:id` - Get program details
- `PUT /api/admin/programs/:id` - Update program
- `DELETE /api/admin/programs/:id` - Delete program

### Public Catalog API
- `GET /catalog/programs` - List published programs
- `GET /catalog/programs/:id` - Get program with published lessons
- `GET /catalog/lessons/:id` - Get published lesson details

### Health Check
- `GET /health` - Service health and database connectivity

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Watch mode
cd backend && npm run test:watch
```

## Deployment

### Production Build
```bash
npm run build
```

### Production Deployment with Docker
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
Set these environment variables in your production environment:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Strong JWT secret key
- `API_URL` - Your API domain
- `FRONTEND_URL` - Your frontend domain

## Demo Flow

1. **Login as Editor**
   - Email: `editor@example.com`
   - Password: `password123`

2. **Create/Edit Lesson**
   - Navigate to Programs → Select Program → Terms → Lessons
   - Create new lesson or edit existing
   - Upload required assets (thumbnails)
   - Add content URLs

3. **Schedule Publication**
   - Set publish date/time in lesson editor
   - Click "Schedule" button
   - Lesson status changes to "Scheduled"

4. **Wait for Worker**
   - Worker runs every minute
   - Scheduled lessons are automatically published
   - Check lesson status changes to "Published"

5. **Verify Public Catalog**
   - Visit `/catalog/programs` endpoint
   - Verify newly published lesson appears
   - Check program is now published

## Monitoring and Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f worker
```

### Health Monitoring
- Backend: http://localhost:3001/health
- Database connectivity included in health check
- Worker status monitoring via logs

## Development

### Code Style
- ESLint configuration for consistent code style
- JSDoc documentation for all functions
- Prettier for code formatting

### Database Schema
- Prisma schema in `backend/prisma/schema.prisma`
- Migrations in `backend/prisma/migrations/`
- Seed data in `backend/src/scripts/seed.js`

### Project Structure
```
├── backend/          # Express.js API server
├── frontend/         # React web application
├── worker/           # Publishing worker service
├── nginx/            # Nginx configuration
├── docker-compose.yml # Development environment
└── README.md         # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.