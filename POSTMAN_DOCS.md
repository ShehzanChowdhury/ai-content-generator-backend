# Postman API Documentation

Complete API documentation for the AI-Powered Content Generator Backend.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: Update based on your deployment

## API Versioning

All API endpoints are versioned. The current version is **v1**.

**Base API Path**: `/api/v1/`

## Authentication

Most endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

### Token Types

- **Access Token**: Short-lived token (15 minutes default) used for API authentication
- **Refresh Token**: Long-lived token (7 days default) used to obtain new access tokens

When your access token expires, use the refresh token endpoint to get a new access token.

---

## 1. Authentication Endpoints

### 1.1 Register User

**Endpoint**: `POST /api/v1/auth/register`

**Description**: Register a new user account

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

### 1.2 Login User

**Endpoint**: `POST /api/v1/auth/login`

**Description**: Login with email and password

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 1.3 Refresh Token

**Endpoint**: `POST /api/v1/auth/refresh`

**Description**: Refresh access token using a valid refresh token. Returns a new access token and refresh token.

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

---

### 1.4 Get Current User

**Endpoint**: `GET /api/v1/auth/me`

**Description**: Get current authenticated user profile

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

---

### 1.5 Logout User

**Endpoint**: `POST /api/v1/auth/logout`

**Description**: Logout user and invalidate refresh token. Requires authentication.

**Headers**:
```
Authorization: Bearer <your-access-token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

---

## 2. Content Management Endpoints

### 2.1 Create Content (Queue AI Generation)

**Endpoint**: `POST /api/v1/content`

**Description**: Create new content and queue AI generation job with 1-minute delay

**Headers**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "topic": "TypeScript programming language basics",
  "contentType": "blog_post_outline"
}
```

**Note**: The `prompt` is automatically generated based on the `topic` and `contentType`.

**Content Types**:
- `blog_post_outline`
- `product_description`
- `social_media_caption`
- `article`
- `email`

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Content generation job queued successfully",
  "data": {
    "content": {
      "id": "507f1f77bcf86cd799439012",
      "topic": "TypeScript programming language basics",
      "contentType": "blog_post_outline",
      "jobId": "content-507f1f77bcf86cd799439012",
      "jobStatus": "queued",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "jobId": "content-507f1f77bcf86cd799439012",
    "expectedDelay": "1 minute"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Topic is required"
}
```

---

### 2.2 Get All Content

**Endpoint**: `GET /api/v1/content`

**Description**: Get paginated list of all user's content

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example**: `GET /api/v1/content?page=1&limit=10`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "507f1f77bcf86cd799439012",
        "topic": "TypeScript programming language basics",
        "contentType": "blog_post_outline",
        "generatedContent": "Generated content here...",
        "jobStatus": "completed",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:01:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### 2.3 Get Content by ID

**Endpoint**: `GET /api/v1/content/:id`

**Description**: Get single content item by ID

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
      "content": {
        "id": "507f1f77bcf86cd799439012",
        "topic": "TypeScript programming language basics",
        "contentType": "blog_post_outline",
        "prompt": "Create a comprehensive outline for a blog post about TypeScript",
        "generatedContent": "Generated content here...",
        "jobId": "content-507f1f77bcf86cd799439012",
        "jobStatus": "completed",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:01:00.000Z"
      }
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Content not found"
}
```

---

### 2.4 Update Content

**Endpoint**: `PUT /api/v1/content/:id`

**Description**: Update content fields (topic or generatedContent)

**Headers**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "topic": "Updated topic",
  "generatedContent": "Updated content"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Content updated successfully",
  "data": {
      "content": {
        "id": "507f1f77bcf86cd799439012",
        "topic": "Updated topic",
        "contentType": "blog_post_outline",
        "generatedContent": "Updated content",
        "jobStatus": "completed",
        "updatedAt": "2024-01-01T00:02:00.000Z"
      }
  }
}
```

---

### 2.5 Rollback Content

**Endpoint**: `POST /api/v1/content/:id/rollback`

**Description**: Rollback content to the AI-generated version, discarding any user edits

**Headers**:
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Content rolled back successfully",
  "data": {
    "content": {
      "id": "507f1f77bcf86cd799439012",
      "topic": "TypeScript programming language basics",
      "contentType": "blog_post_outline",
      "generatedContent": "Original AI-generated content...",
      "content": "Original AI-generated content...",
      "jobStatus": "completed",
      "updatedAt": "2024-01-01T00:03:00.000Z"
    }
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "No generated content available to rollback to"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Content not found"
}
```

---

### 2.6 Delete Content

**Endpoint**: `DELETE /api/v1/content/:id`

**Description**: Delete a content item

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Response** (204 No Content):
```
(No response body)
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Content not found"
}
```

---

### 2.7 Get Job Status

**Endpoint**: `GET /api/v1/content/job/:jobId/status`

**Description**: Poll job status for content generation

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "jobId": "content-507f1f77bcf86cd799439012",
    "jobStatus": {
      "state": "completed",
      "progress": 100,
      "failedReason": null
    },
    "content": {
      "id": "507f1f77bcf86cd799439012",
      "jobStatus": "completed",
      "generatedContent": "Generated content here..."
    }
  }
}
```

**Job States**:
- `queued` - Job has been queued and is waiting for the 1-minute delay
- `waiting` - Job is waiting in queue (BullMQ state)
- `active` - Job is being processed (BullMQ state)
- `processing` - Content generation is in progress
- `completed` - Job completed successfully
- `failed` - Job failed
- `delayed` - Job is delayed (1 minute delay) (BullMQ state)

**Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Job not found"
}
```

---

## 3. Health Check

### 3.1 Health Check

**Endpoint**: `GET /health`

**Description**: Check if server is running

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 4. WebSocket Events

### 4.1 Connect to WebSocket

**URL**: `ws://localhost:5000` (or `wss://` for production with SSL)

### 4.2 Subscribe to Job Updates

**Emit Event**: `subscribe-job`

**Payload**:
```json
"content-507f1f77bcf86cd799439012"
```

### 4.3 Receive Job Updates

**Listen Event**: `job-update`

**Payload**:
```json
{
  "jobId": "content-507f1f77bcf86cd799439012",
  "contentId": "507f1f77bcf86cd799439012",
  "status": "completed",
  "generatedContent": "Generated content here...",
  "timestamp": "2024-01-01T00:01:00.000Z"
}
```

### 4.4 Unsubscribe from Job Updates

**Emit Event**: `unsubscribe-job`

**Payload**:
```json
"content-507f1f77bcf86cd799439012"
```

---

## 5. Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message description"
}
```

**Common HTTP Status Codes**:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error (server errors)

---

## 6. Postman Collection Setup

### Environment Variables

Create a Postman environment with:

- `base_url`: `http://localhost:5000`
- `auth_token`: (will be set automatically after login/register/refresh)
- `refresh_token`: (will be set automatically after login/register/refresh)

### Collection Structure

1. **Authentication**
   - Register User
   - Login User
   - Refresh Token
   - Get Current User
   - Logout User

2. **Content Management**
   - Create Content
   - Get All Content
   - Get Content by ID
   - Update Content
   - Rollback Content
   - Delete Content
   - Get Job Status

3. **Health Check**
   - Health Check

### Auto-Set Token Scripts

The collection includes automatic token management scripts:

**For Register/Login requests:**
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("auth_token", jsonData.data.accessToken);
    pm.environment.set("refresh_token", jsonData.data.refreshToken);
    pm.environment.set("user_id", jsonData.data.user.id);
}
```

**For Refresh Token request:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("auth_token", jsonData.data.accessToken);
    pm.environment.set("refresh_token", jsonData.data.refreshToken);
}
```

Then use `{{auth_token}}` in the Authorization header for protected endpoints.

---

## 7. Example Workflow

1. **Register/Login** → Get access token and refresh token
2. **Create Content** → Receive jobId and contentId
3. **Poll Job Status** → Check `/api/v1/content/job/:jobId/status` every few seconds
4. **Get Content** → Once completed, fetch full content with `/api/v1/content/:id`
5. **Update/Delete** → Manage content as needed
6. **Refresh Token** → If access token expires, use refresh token to get new tokens
7. **Logout** → Invalidate refresh token when done

**Alternative with WebSocket**:
1. **Register/Login** → Get access token and refresh token
2. **Create Content** → Receive jobId
3. **Subscribe to Job** → Connect via WebSocket and subscribe to jobId
4. **Receive Update** → Get real-time notification when job completes
5. **Get Content** → Fetch full content with generated result
6. **Refresh Token** → If access token expires, use refresh token to get new tokens
7. **Logout** → Invalidate refresh token when done

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Access tokens expire after 15 minutes (configurable via `JWT_ACCESS_EXPIRES_IN`)
- Refresh tokens expire after 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- Use the refresh token endpoint to obtain new access tokens when they expire
- Logout invalidates the refresh token, requiring a new login
- Job delay is fixed at 1 minute (60000 milliseconds)
- Content generation jobs are retried up to 3 times on failure
- Maximum 5 jobs can be processed concurrently by the worker

