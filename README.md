# AI-Powered Content Generator Backend

A complete backend system for AI-powered content generation and management built with Express.js, TypeScript, MongoDB, JWT Authentication, Redis Queue (BullMQ), and a separate Worker process.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📝 **Content CRUD Operations** - Full Create, Read, Update, Delete for content
- 🤖 **AI Content Generation** - Integration with Google GenAI for content generation
- ⏱️ **Delayed Job Processing** - 1-minute delayed job execution using BullMQ
- 👷 **Separate Worker Process** - Background job processing
- 📡 **WebSocket Support** - Real-time job status updates (bonus feature)
- 🔄 **Status Polling** - REST API endpoint for job status checking
- 🐳 **Docker Support** - Complete Docker setup with docker-compose

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript (ES Modules)
- **Database**: MongoDB with Mongoose
- **Queue**: BullMQ with Redis
- **Authentication**: JWT (jsonwebtoken)
- **AI**: Google GenAI (@google/genai)
- **WebSocket**: Socket.IO
- **Validation**: Zod

## Project Structure

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
└── tsconfig.json
```

## Prerequisites

- Node.js 20+ and npm
- MongoDB (local or cloud)
- Redis (local or cloud)
- Google GenAI API Key

## Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ai-content-generator
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   REDIS_HOST=localhost
   REDIS_PORT=6379
   GOOGLE_GENAI_API_KEY=your-google-genai-api-key
   CORS_ORIGIN=http://localhost:3001
   ```

## Running the Application

### Development Mode

1. **Start MongoDB and Redis** (if running locally):
   ```bash
   # MongoDB
   mongod

   # Redis
   redis-server
   ```

2. **Start the API server:**
   ```bash
   npm run dev
   ```

3. **Start the worker process** (in a separate terminal):
   ```bash
   npm run worker
   ```

### Production Mode

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start the API server:**
   ```bash
   npm start
   ```

3. **Start the worker:**
   ```bash
   npm run worker:prod
   ```

### Docker Compose

1. **Create `.env` file with all required variables**

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile (protected)

### Content Management

- `POST /api/v1/content` - Create new content and queue AI generation job
- `GET /api/v1/content` - Get all user's content (paginated)
- `GET /api/v1/content/:id` - Get single content by ID
- `PUT /api/v1/content/:id` - Update content
- `POST /api/v1/content/:id/rollback` - Rollback content to AI-generated version
- `DELETE /api/v1/content/:id` - Delete content
- `GET /api/v1/content/job/:jobId/status` - Get job status for content generation

### Health Check

- `GET /health` - Server health check

## Queue System

The system uses BullMQ with Redis for job queue management:

1. **Job Creation**: When a user requests content generation, the job is added to the queue with a 1-minute delay
2. **Job Processing**: The worker process picks up jobs after the delay and processes them
3. **Status Updates**: Job status is updated in the database and can be polled via API or received via WebSocket

## WebSocket Events

The server supports WebSocket connections for real-time updates:

- **Connect**: `socket.connect()`
- **Subscribe to job**: `socket.emit('subscribe-job', jobId)`
- **Unsubscribe from job**: `socket.emit('unsubscribe-job', jobId)`
- **Receive updates**: `socket.on('job-update', (data) => {...})`

## Content Types

Supported content types for AI generation:

- `blog_post_outline` - Blog post outline
- `product_description` - Product description
- `social_media_caption` - Social media caption
- `article` - Full article
- `email` - Professional email

## Job Status

Job status values:

- `queued` - Job has been created and queued (initial status)
- `processing` - Job is being processed by worker
- `completed` - Job completed successfully
- `failed` - Job failed

## Error Handling

The application includes comprehensive error handling:

- Validation errors (Zod)
- Authentication errors
- Database errors
- AI service errors
- Queue errors

All errors are returned in a consistent format:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Protected routes require valid JWT token
- CORS configuration for frontend access
- Input validation using Zod

## Testing

Use the provided Postman collection to test all endpoints. See `POSTMAN_DOCS.md` for detailed API documentation.

## License

ISC

