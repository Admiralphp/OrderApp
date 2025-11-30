# Product Service

Product catalog microservice for OrderApp+. Manages products, categories, inventory, and provides search/filtering capabilities.

## Features

- ✅ Product CRUD operations
- ✅ Category management
- ✅ Stock tracking
- ✅ Advanced filtering & search
- ✅ Pagination
- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation
- ✅ Prometheus metrics
- ✅ Health checks
- ✅ Structured logging
- ✅ Rate limiting
- ✅ Docker support

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Sequelize
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Metrics**: Prometheus (prom-client)
- **Testing**: Jest + Supertest

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 15
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations (if using migrations)
npm run migrate

# Seed database (optional)
npm run seed
```

## Running the Service

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Docker

```bash
# Build image
docker build -t product-service:latest .

# Run container
docker run -p 3002:3002 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/product_db \
  -e JWT_SECRET=your-secret \
  product-service:latest
```

## API Endpoints

### Public Endpoints

#### Get All Products
```http
GET /api/products?page=1&limit=20&category=1&minPrice=10&maxPrice=100&available=true&sort=price_asc&search=keyword
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): Filter by category ID
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `available` (optional): Filter by availability (true/false)
- `sort` (optional): Sort order (price_asc, price_desc, name_asc, name_desc, created_desc)
- `search` (optional): Search in name and description

#### Get Product by ID
```http
GET /api/products/:id
```

#### Get Product by SKU
```http
GET /api/products/sku/:sku
```

#### Get All Categories
```http
GET /api/categories
```

#### Get Category by ID
```http
GET /api/categories/:id
```

### Admin Endpoints (Require Authentication)

#### Create Product
```http
POST /api/products
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse",
  "sku": "MOUSE-001",
  "categoryId": 1,
  "price": 29.99,
  "discountPrice": 24.99,
  "stockQuantity": 100,
  "isAvailable": true,
  "images": ["https://example.com/image1.jpg"],
  "attributes": {"color": "black", "connectivity": "bluetooth"},
  "tags": ["wireless", "ergonomic"],
  "weight": 0.12
}
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "price": 27.99,
  "stockQuantity": 150
}
```

#### Update Product Stock
```http
PATCH /api/products/:id/stock
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "stockQuantity": 75
}
```

#### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <jwt-token>
```

#### Create Category
```http
POST /api/categories
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and accessories",
  "parentId": null
}
```

#### Update Category
```http
PUT /api/categories/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Consumer Electronics",
  "isActive": true
}
```

#### Delete Category
```http
DELETE /api/categories/:id
Authorization: Bearer <jwt-token>
```

### Health & Monitoring

#### Health Check
```http
GET /health
```

#### Readiness Probe
```http
GET /health/ready
```

#### Liveness Probe
```http
GET /health/live
```

#### Prometheus Metrics
```http
GET /metrics
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3002` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `product_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` |
| `REDIS_URL` | Redis connection string (optional) | `redis://localhost:6379` |
| `CACHE_TTL` | Cache TTL in seconds | `600` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## Database Schema

### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  images JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  tags VARCHAR(255)[],
  weight DECIMAL(10, 2),
  dimensions JSONB,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  slug VARCHAR(120) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
product-service/
├── src/
│   ├── config/
│   │   ├── index.js          # Configuration
│   │   ├── database.js       # Database connection
│   │   └── logger.js         # Winston logger
│   ├── controllers/
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── validation.js     # Joi validation
│   │   └── errorHandler.js   # Error handling
│   ├── models/
│   │   ├── Product.js        # Product model
│   │   ├── Category.js       # Category model
│   │   └── index.js          # Models index
│   ├── routes/
│   │   ├── products.js       # Product routes
│   │   ├── categories.js     # Category routes
│   │   └── health.js         # Health routes
│   ├── utils/
│   │   └── metrics.js        # Prometheus metrics
│   └── server.js             # Main server file
├── tests/
│   └── api.test.js           # API tests
├── .env.example              # Environment template
├── .gitignore
├── .dockerignore
├── Dockerfile                # Docker image
├── package.json
└── README.md
```

## Error Handling

All errors follow a standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-11-29T10:30:00.000Z",
    "path": "/api/products"
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Request validation failed
- `AUTH_TOKEN_MISSING`: No authentication token provided
- `AUTH_TOKEN_INVALID`: Invalid or expired token
- `AUTH_FORBIDDEN`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Resource not found
- `RESOURCE_CONFLICT`: Resource already exists
- `INTERNAL_ERROR`: Internal server error

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: HTTP request duration
- `nodejs_heap_size_used_bytes`: Node.js heap usage
- `nodejs_active_handles_total`: Active handles

## Logging

Structured JSON logs with Winston:

```json
{
  "timestamp": "2025-11-29 10:30:45",
  "level": "info",
  "service": "product-service",
  "message": "Product created",
  "productId": 123,
  "userId": 456
}
```

## Performance

- Average response time: < 200ms (P95)
- Database connection pooling
- Rate limiting: 100 requests / 15 minutes
- Request compression enabled
- Pagination for large datasets

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Input validation with Joi
- SQL injection prevention (Sequelize ORM)
- Helmet.js security headers
- Rate limiting
- CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Run tests and linting
6. Submit a pull request

## License

ISC

## Support

For issues and questions, please refer to the main OrderApp+ documentation.

---

**Version**: 1.0.0  
**Last Updated**: November 2025
