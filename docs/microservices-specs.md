# Microservices Specifications

## Table of Contents
1. [User Service](#1-user-service)
2. [Product Service](#2-product-service)
3. [Order Service](#3-order-service)
4. [Payment Service](#4-payment-service)
5. [Notification Service](#5-notification-service)

---

## 1. User Service

### 1.1 Responsibility
- User authentication and authorization
- User account management
- Role-based access control (RBAC)
- JWT token generation and validation

### 1.2 Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt
- **Validation**: Joi

### 1.3 Data Model (MongoDB)

**Collection: users**
```javascript
{
  _id: ObjectId,
  email: String (unique, required, indexed),
  password: String (hashed with bcrypt, required),
  firstName: String (required),
  lastName: String (required),
  phone: String,
  role: String (enum: ['USER', 'ADMIN'], default: 'USER'),
  isActive: Boolean (default: true),
  emailVerified: Boolean (default: false),
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date (default: Date.now),
  updatedAt: Date,
  lastLogin: Date
}
```

**Indexes**:
- `email` (unique)
- `createdAt` (descending)
- `role` (non-unique)

### 1.4 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/refresh` | Refresh JWT token | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |
| PUT | `/api/users/password` | Change password | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| GET | `/api/users/:id` | Get user by ID (admin) | Yes (Admin) |
| GET | `/api/users` | List all users (admin) | Yes (Admin) |
| DELETE | `/api/users/:id` | Delete user (admin) | Yes (Admin) |

### 1.5 Environment Variables
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/user_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

### 1.6 External Dependencies
- None (standalone service)

---

## 2. Product Service

### 2.1 Responsibility
- Product catalog management (CRUD)
- Category management
- Stock tracking
- Product search and filtering
- Pagination and sorting

### 2.2 Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Sequelize
- **Validation**: Joi
- **Cache**: Redis (optional, for read-heavy endpoints)

### 2.3 Data Model (PostgreSQL)

**Table: categories**
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  slug VARCHAR(120) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

**Table: products**
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  discount_price DECIMAL(10, 2) CHECK (discount_price >= 0 AND discount_price < price),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available BOOLEAN DEFAULT true,
  images JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  tags VARCHAR(255)[],
  weight DECIMAL(10, 2),
  dimensions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_created ON products(created_at DESC);
```

### 2.4 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | List products (with filters) | No |
| GET | `/api/products/:id` | Get product by ID | No |
| GET | `/api/products/sku/:sku` | Get product by SKU | No |
| POST | `/api/products` | Create product | Yes (Admin) |
| PUT | `/api/products/:id` | Update product | Yes (Admin) |
| DELETE | `/api/products/:id` | Delete product | Yes (Admin) |
| PATCH | `/api/products/:id/stock` | Update stock | Yes (Admin) |
| GET | `/api/categories` | List categories | No |
| GET | `/api/categories/:id` | Get category by ID | No |
| POST | `/api/categories` | Create category | Yes (Admin) |
| PUT | `/api/categories/:id` | Update category | Yes (Admin) |
| DELETE | `/api/categories/:id` | Delete category | Yes (Admin) |
| GET | `/api/products/search` | Search products | No |

**Query Parameters for `/api/products`**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` (filter by category ID)
- `minPrice` (filter by minimum price)
- `maxPrice` (filter by maximum price)
- `available` (filter by availability: true/false)
- `sort` (e.g., "price_asc", "price_desc", "name_asc", "created_desc")
- `search` (search in name and description)

### 2.5 Environment Variables
```
PORT=3002
DATABASE_URL=postgresql://user:pass@localhost:5432/product_db
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
CACHE_TTL=600
```

### 2.6 External Dependencies
- User Service (for admin authentication validation)

---

## 3. Order Service

### 3.1 Responsibility
- Shopping cart management
- Order creation and lifecycle management
- Order status tracking
- Order history
- Integration with Product and User services

### 3.2 Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Sequelize
- **Validation**: Joi
- **HTTP Client**: Axios (for service-to-service calls)

### 3.3 Data Model (PostgreSQL)

**Table: orders**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  customer_notes TEXT,
  admin_notes TEXT,
  payment_id VARCHAR(100),
  payment_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  CONSTRAINT chk_status CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'))
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);
```

**Table: order_items**
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  product_snapshot JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

**Table: carts** (optional, for persistent carts)
```sql
CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_carts_user ON carts(user_id);
```

### 3.4 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get user's cart | Yes |
| POST | `/api/cart/items` | Add item to cart | Yes |
| PUT | `/api/cart/items/:id` | Update cart item quantity | Yes |
| DELETE | `/api/cart/items/:id` | Remove item from cart | Yes |
| DELETE | `/api/cart` | Clear cart | Yes |
| POST | `/api/orders` | Create order from cart | Yes |
| GET | `/api/orders` | Get user's orders | Yes |
| GET | `/api/orders/:id` | Get order details | Yes |
| PATCH | `/api/orders/:id/cancel` | Cancel order | Yes |
| GET | `/api/admin/orders` | Get all orders | Yes (Admin) |
| PATCH | `/api/admin/orders/:id/status` | Update order status | Yes (Admin) |

### 3.5 Environment Variables
```
PORT=3003
DATABASE_URL=postgresql://user:pass@localhost:5432/order_db
JWT_SECRET=your-secret-key
USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
PAYMENT_SERVICE_URL=http://payment-service:3004
```

### 3.6 External Dependencies
- User Service (validate user existence)
- Product Service (validate products, check stock)
- Payment Service (trigger payment after order creation)

---

## 4. Payment Service

### 4.1 Responsibility
- Payment intent creation
- Payment processing via Stripe/PayPal
- Webhook handling
- Payment reconciliation
- Refund management

### 4.2 Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Payment SDKs**: Stripe Node.js SDK, PayPal REST SDK
- **Validation**: Joi

### 4.3 Data Model (MongoDB)

**Collection: payments**
```javascript
{
  _id: ObjectId,
  paymentId: String (unique, indexed),
  orderId: String (required, indexed),
  userId: String (required, indexed),
  provider: String (enum: ['STRIPE', 'PAYPAL'], required),
  amount: Number (required),
  currency: String (default: 'USD'),
  status: String (enum: ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED'], default: 'PENDING'),
  paymentIntentId: String,
  externalTransactionId: String,
  paymentMethod: String,
  metadata: Object,
  errorMessage: String,
  refundId: String,
  refundAmount: Number,
  webhookEvents: Array,
  createdAt: Date (default: Date.now),
  updatedAt: Date,
  processedAt: Date,
  failedAt: Date,
  refundedAt: Date
}
```

**Indexes**:
- `paymentId` (unique)
- `orderId` (non-unique)
- `userId` (non-unique)
- `status` (non-unique)
- `createdAt` (descending)

### 4.4 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/intent` | Create payment intent | Yes |
| POST | `/api/payments/stripe/webhook` | Stripe webhook handler | No (verified) |
| POST | `/api/payments/paypal/webhook` | PayPal webhook handler | No (verified) |
| GET | `/api/payments/:id` | Get payment details | Yes |
| GET | `/api/payments/order/:orderId` | Get payments by order | Yes |
| POST | `/api/payments/:id/refund` | Refund payment | Yes (Admin) |
| GET | `/api/admin/payments` | List all payments | Yes (Admin) |

### 4.5 Environment Variables
```
PORT=3004
MONGODB_URI=mongodb://localhost:27017/payment_db
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox
ORDER_SERVICE_URL=http://order-service:3003
NOTIFICATION_SERVICE_URL=http://notification-service:3005
```

### 4.6 External Dependencies
- Stripe API (payment processing)
- PayPal API (payment processing)
- Order Service (update order status after payment)
- Notification Service (send payment confirmation)

---

## 5. Notification Service

### 5.1 Responsibility
- Email notifications
- SMS notifications (optional)
- Webhook notifications
- Template management
- Notification queue management

### 5.2 Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Queue**: Redis + Bull
- **Email**: Nodemailer + SMTP
- **SMS**: Twilio SDK (optional)
- **Templates**: Handlebars

### 5.3 Data Model (Redis)

**Queue: notification_queue**
```javascript
{
  jobId: String,
  type: String, // 'EMAIL', 'SMS', 'WEBHOOK'
  recipient: String,
  template: String,
  data: Object,
  priority: Number,
  attempts: Number,
  status: String,
  createdAt: Date,
  processedAt: Date
}
```

**Optional MongoDB for logging**:
```javascript
{
  _id: ObjectId,
  type: String,
  recipient: String,
  subject: String,
  status: String (enum: ['SENT', 'FAILED', 'PENDING']),
  errorMessage: String,
  metadata: Object,
  sentAt: Date,
  createdAt: Date
}
```

### 5.4 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/notifications/email` | Send email | Yes (Internal) |
| POST | `/api/notifications/sms` | Send SMS | Yes (Internal) |
| POST | `/api/notifications/webhook` | Send webhook | Yes (Internal) |
| GET | `/api/notifications/:id` | Get notification status | Yes |
| GET | `/api/notifications/user/:userId` | Get user notifications | Yes |

### 5.5 Notification Templates

**Email Templates**:
1. `order-confirmation` - Order placed successfully
2. `payment-success` - Payment processed
3. `order-shipped` - Order shipped
4. `order-delivered` - Order delivered
5. `order-cancelled` - Order cancelled
6. `password-reset` - Password reset link
7. `welcome` - Welcome new user

### 5.6 Environment Variables
```
PORT=3005
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@orderapp.com
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
JWT_SECRET=your-secret-key
```

### 5.7 External Dependencies
- SMTP server (Gmail, SendGrid, etc.)
- Twilio API (for SMS)
- Other services trigger notifications via REST API

---

## 6. Cross-Cutting Concerns

### 6.1 Health Checks

All services implement:
- **GET** `/health` - Simple health check
- **GET** `/health/ready` - Readiness probe (checks DB connection)
- **GET** `/health/live` - Liveness probe

### 6.2 Metrics

All services expose:
- **GET** `/metrics` - Prometheus metrics endpoint

**Standard Metrics**:
- `http_requests_total{method, route, status_code}`
- `http_request_duration_seconds{method, route}`
- `nodejs_heap_size_used_bytes`
- `nodejs_active_handles_total`

### 6.3 Logging

All services use structured logging:
```javascript
{
  timestamp: ISO8601,
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG',
  service: 'service-name',
  traceId: 'uuid',
  message: 'log message',
  metadata: {}
}
```

### 6.4 Error Handling

Standard error response:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "timestamp": "2025-11-29T10:30:45.123Z",
    "path": "/api/endpoint"
  }
}
```

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 500: Internal Server Error
- 503: Service Unavailable

### 6.5 Rate Limiting

All public endpoints:
- **Rate**: 100 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

Admin endpoints:
- **Rate**: 1000 requests per 15 minutes per IP

---

## 7. Service Communication

### 7.1 Synchronous (REST API)

**Order Service → Product Service**:
- Validate product existence
- Check stock availability
- Get product details

**Order Service → User Service**:
- Validate user existence
- Get user details

**Payment Service → Order Service**:
- Update order status after payment
- Notify order service of payment events

**Payment Service → Notification Service**:
- Send payment confirmation emails
- Send order status updates

### 7.2 Authentication Between Services

**Option 1: Shared JWT Secret**
- Services validate JWT tokens
- Extract user ID and role from token

**Option 2: Service-to-Service API Keys** (Recommended)
- Each service has a unique API key
- Passed in `X-API-Key` header
- Validated by receiving service

### 7.3 Circuit Breaker Pattern

Implement circuit breaker for external service calls:
- **Library**: `opossum` (Node.js)
- **Timeout**: 5 seconds
- **Error Threshold**: 50%
- **Reset Timeout**: 30 seconds

---

**Document Version**: 1.0  
**Last Updated**: November 29, 2025
