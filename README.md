# AI-Powered Content Generator Backend

## Table of Contents

- [a. Project Overview and Tech Stack Used](#a-project-overview-and-tech-stack-used)
- [b. Setup Instructions](#b-setup-instructions)
- [c. API Documentation](#c-api-documentation)
- [d. Architectural Decisions](#d-architectural-decisions)

## a. Project Overview and Tech Stack Used

A backend system for AI-powered content generation and management. The system handles user authentication, content CRUD operations, and asynchronous AI content generation using a queue-based architecture with a separate worker process.

**Tech Stack:**
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript (ES Modules)
- **Database**: MongoDB with Mongoose
- **Queue**: BullMQ with Redis
- **Authentication**: JWT (jsonwebtoken)
- **AI Service**: Google GenAI (@google/genai)
- **WebSocket**: Socket.IO
- **Validation**: Zod

### Folder Structure
```
backend/
├── src/
│   ├── config/          # Database and Redis configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth and error handling middleware
│   ├── models/          # MongoDB models (User, Content)
│   ├── queues/          # BullMQ queue setup
│   ├── routes/          # Express routes
│   ├── services/        # Business logic (auth, content, AI)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (JWT, WebSocket)
│   ├── server.ts        # Main Express server
│   └── worker.ts        # Separate worker process
├── Dockerfile           # Docker image for API server
├── Dockerfile.worker    # Docker image for worker process
├── docker-compose.yml   # Docker Compose configuration
├── package.json
├── tsconfig.json
└── .env.example         # Environment variables template
```

## b. Setup Instructions

### Prerequisites
- Node.js 20+ and npm
- MongoDB (local or cloud)
- Redis (local or cloud)
- Google GenAI API Key

### Local Development Setup

1. **Clone the git repository and navigate to backend directory:**
   ```bash
   git clone git@github.com:ShehzanChowdhury/ai-content-generator-backend.git
   cd ai-content-generator-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file from `.env.example`:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env` (see `.env.example` for reference):**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ai-content-generator
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   REDIS_HOST=localhost
   REDIS_PORT=6379
   GOOGLE_GENAI_API_KEY=your-google-genai-api-key
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Start MongoDB and Redis** (if running locally):
   ```bash
   # MongoDB
   mongod

   # Redis
   redis-server
   ```

6. **Start the API server:**
   ```bash
   npm run dev
   ```

7. **Start the worker process** (in a separate terminal):
   ```bash
   npm run worker
   ```

The API server will run on `http://localhost:5000` and the worker will process AI content generation jobs.

## c. API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user and receive JWT token
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `GET /api/v1/auth/me` - Get current user profile (protected)
- `POST /api/v1/auth/logout` - Logout user (protected)

### Content Management Endpoints
- `POST /api/v1/content` - Create new content and queue AI generation job
- `GET /api/v1/content` - Get all user's content (paginated)
- `GET /api/v1/content/:id` - Get single content by ID
- `PUT /api/v1/content/:id` - Update content
- `POST /api/v1/content/:id/rollback` - Rollback content to AI-generated version
- `DELETE /api/v1/content/:id` - Delete content
- `GET /api/v1/content/job/:jobId/status` - Get job status for content generation

### Health Check
- `GET /health` - Server health check

**Note:** All content endpoints require JWT authentication. For detailed API documentation including request/response schemas, see `POSTMAN_DOCS.md`.

## d. Architectural Decisions

1. **Separate Worker Process**: AI content generation runs in a dedicated worker process to prevent blocking the main API server and enable horizontal scaling.

2. **Queue-Based Job Processing**: BullMQ with Redis handles asynchronous job processing with a 1-minute delay before execution, allowing the API to respond immediately while processing happens in the background.

3. **Layered Architecture**: Clear separation of concerns with controllers (request handling), services (business logic), models (data layer), and middleware (cross-cutting concerns like authentication and error handling).

4. **WebSocket for Real-Time Updates**: Socket.IO provides real-time job status updates to clients, with Redis pub/sub pattern enabling communication between worker and API server.

5. **TypeScript with ES Modules**: Type safety throughout the codebase with modern ES module syntax for better tree-shaking and performance.

6. **JWT Authentication**: Stateless authentication using JWT tokens for scalability, with refresh token support for enhanced security.

7. **Input Validation**: Zod schema validation ensures type safety and data integrity at the API boundary.

8. **Error Handling**: Centralized error handling middleware provides consistent error responses across all endpoints.
