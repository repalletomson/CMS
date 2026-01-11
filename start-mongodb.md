# Starting the CMS with MongoDB

## Prerequisites

1. **MongoDB**: Make sure MongoDB is running on `mongodb://localhost:27017`
   - Install MongoDB Community Server
   - Start MongoDB service
   - Or use MongoDB Compass to connect to `mongodb://localhost:27017`

## Setup Steps

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies  
cd ../frontend
npm install
```

### 2. Environment Configuration

The `.env` file is already configured for MongoDB:
```
MONGODB_URI=mongodb://localhost:27017/cms_db
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This will create:
- Sample users (admin, editor, viewer)
- Sample programs and lessons
- Sample topics and terms
- Sample assets

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Login Credentials

After seeding, you can login with:

- **Admin**: `admin@example.com` / `password123`
- **Editor**: `editor@example.com` / `password123`  
- **Viewer**: `viewer@example.com` / `password123`

## Features Available

✅ **Asset Upload System** - Real file upload functionality
✅ **User Management** - Admin user creation/editing  
✅ **Publishing Workflow** - Scheduled publishing system
✅ **Public Catalog API** - Consumer-facing endpoints

## API Endpoints

### Admin API (Protected)
- `GET /api/admin/programs` - Get all programs
- `POST /api/admin/programs` - Create program
- `PUT /api/admin/programs/:id` - Update program
- `DELETE /api/admin/programs/:id` - Delete program
- `POST /api/admin/programs/:id/assets` - Upload program assets
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create user (admin only)

### Public Catalog API
- `GET /catalog/programs` - Get published programs
- `GET /catalog/programs/:id` - Get single program with lessons
- `GET /catalog/lessons` - Get published lessons
- `GET /catalog/lessons/:id` - Get single lesson
- `GET /catalog/topics` - Get topics with content counts
- `GET /catalog/search?q=query` - Search content

### Publishing API
- `POST /api/admin/programs/:id/publish` - Publish/schedule program
- `GET /api/admin/publishing/scheduled` - Get scheduled content
- `GET /api/admin/publishing/published` - Get published content
- `GET /api/admin/publishing/drafts` - Get draft content

## Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB is running: `mongod --version`
2. Check connection: `mongo mongodb://localhost:27017/cms_db`
3. Verify port 27017 is not blocked

### CSS Issues
If you see CSS class errors, the Tailwind config is set up to use standard colors:
- `primary-*` → `blue-*`
- `secondary-*` → `purple-*`  
- `accent-*` → `green-*`

### Port Conflicts
- Backend runs on port 3001
- Frontend runs on port 3000
- MongoDB runs on port 27017

Make sure these ports are available.