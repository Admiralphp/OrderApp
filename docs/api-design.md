# API Design - OrderApp+

## Table of Contents
1. [User Service API](#1-user-service-api)
2. [Product Service API](#2-product-service-api)
3. [Order Service API](#3-order-service-api)
4. [Payment Service API](#4-payment-service-api)
5. [Notification Service API](#5-notification-service-api)
6. [Common Patterns](#6-common-patterns)

---

## 1. User Service API

**Base URL**: `/api` (Port: 3001)

### 1.1 Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "emailVerified": false,
      "createdAt": "2025-11-29T10:30:45.123Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful. Please verify your email."
}
```

**Error Responses**:
- 400: Validation error (missing fields, invalid email format)
- 409: Email already exists

---

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Login successful"
}
```

**Error Responses**:
- 400: Missing credentials
- 401: Invalid credentials
- 403: Account not active

---

#### GET /auth/me
Get current authenticated user information.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "USER",
    "emailVerified": true,
    "createdAt": "2025-11-29T10:30:45.123Z",
    "lastLogin": "2025-11-29T15:20:30.456Z"
  }
}
```

**Error Responses**:
- 401: Invalid or expired token

---

#### POST /auth/forgot-password
Request password reset email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
}
```

---

#### POST /auth/reset-password
Reset password using token from email.

**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

**Error Responses**:
- 400: Invalid or expired token
- 400: Weak password

---

### 1.2 User Management Endpoints

#### PUT /users/profile
Update user profile.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+9876543210"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+9876543210",
    "updatedAt": "2025-11-29T16:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

#### PUT /users/password
Change user password.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:
- 400: Current password incorrect
- 400: New password is weak

---

### 1.3 Admin Endpoints

#### GET /users
List all users (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)
- `role` (filter by role: USER, ADMIN)
- `search` (search by email or name)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "user1@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER",
        "isActive": true,
        "createdAt": "2025-11-29T10:30:45.123Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

## 2. Product Service API

**Base URL**: `/api` (Port: 3002)

### 2.1 Product Endpoints

#### GET /products
List products with filtering and pagination.

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category` (filter by category ID)
- `minPrice` (minimum price)
- `maxPrice` (maximum price)
- `available` (true/false)
- `sort` (price_asc, price_desc, name_asc, created_desc)
- `search` (search in name and description)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with 3 buttons",
        "sku": "MOUSE-001",
        "categoryId": 5,
        "categoryName": "Electronics",
        "price": 29.99,
        "discountPrice": 24.99,
        "stockQuantity": 150,
        "isAvailable": true,
        "images": [
          "https://cdn.example.com/products/mouse-001-1.jpg",
          "https://cdn.example.com/products/mouse-001-2.jpg"
        ],
        "attributes": {
          "color": "Black",
          "connectivity": "Bluetooth",
          "warranty": "1 year"
        },
        "tags": ["wireless", "ergonomic", "bluetooth"],
        "createdAt": "2025-11-20T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 250,
      "totalPages": 13
    }
  }
}
```

---

#### GET /products/:id
Get product details by ID.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with 3 buttons and adjustable DPI",
    "sku": "MOUSE-001",
    "categoryId": 5,
    "category": {
      "id": 5,
      "name": "Electronics",
      "slug": "electronics"
    },
    "price": 29.99,
    "discountPrice": 24.99,
    "stockQuantity": 150,
    "isAvailable": true,
    "images": [
      "https://cdn.example.com/products/mouse-001-1.jpg"
    ],
    "attributes": {
      "color": "Black",
      "connectivity": "Bluetooth",
      "warranty": "1 year",
      "dpi": "800-1600"
    },
    "tags": ["wireless", "ergonomic", "bluetooth"],
    "weight": 0.12,
    "dimensions": {
      "length": 10,
      "width": 6,
      "height": 4,
      "unit": "cm"
    },
    "createdAt": "2025-11-20T08:00:00.000Z",
    "updatedAt": "2025-11-28T12:00:00.000Z"
  }
}
```

**Error Responses**:
- 404: Product not found

---

#### POST /products
Create a new product (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Request Body**:
```json
{
  "name": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard with blue switches",
  "sku": "KB-RGB-001",
  "categoryId": 5,
  "price": 89.99,
  "discountPrice": 79.99,
  "stockQuantity": 50,
  "isAvailable": true,
  "images": [
    "https://cdn.example.com/products/keyboard-001.jpg"
  ],
  "attributes": {
    "switchType": "Blue",
    "backlighting": "RGB",
    "layout": "US QWERTY"
  },
  "tags": ["mechanical", "rgb", "gaming"],
  "weight": 0.95
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 251,
    "name": "Mechanical Keyboard",
    "sku": "KB-RGB-001",
    "price": 89.99,
    "createdAt": "2025-11-29T17:00:00.000Z"
  },
  "message": "Product created successfully"
}
```

**Error Responses**:
- 400: Validation error
- 409: SKU already exists
- 403: Forbidden (not admin)

---

#### PUT /products/:id
Update product (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Request Body**: (all fields optional)
```json
{
  "price": 84.99,
  "stockQuantity": 75,
  "isAvailable": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 251,
    "name": "Mechanical Keyboard",
    "price": 84.99,
    "stockQuantity": 75,
    "updatedAt": "2025-11-29T18:00:00.000Z"
  },
  "message": "Product updated successfully"
}
```

---

#### DELETE /products/:id
Delete product (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Error Responses**:
- 404: Product not found
- 409: Cannot delete product with pending orders

---

### 2.2 Category Endpoints

#### GET /categories
List all categories.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and accessories",
        "parentId": null,
        "isActive": true,
        "productCount": 120
      },
      {
        "id": 5,
        "name": "Computer Accessories",
        "slug": "computer-accessories",
        "parentId": 1,
        "isActive": true,
        "productCount": 45
      }
    ]
  }
}
```

---

#### POST /categories
Create category (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Request Body**:
```json
{
  "name": "Smart Home",
  "slug": "smart-home",
  "description": "Smart home devices and IoT products",
  "parentId": null
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Smart Home",
    "slug": "smart-home",
    "createdAt": "2025-11-29T19:00:00.000Z"
  },
  "message": "Category created successfully"
}
```

---

## 3. Order Service API

**Base URL**: `/api` (Port: 3003)

### 3.1 Cart Endpoints

#### GET /cart
Get current user's cart.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cartId": "cart-user-123",
    "userId": "507f1f77bcf86cd799439011",
    "items": [
      {
        "id": "item-1",
        "productId": 1,
        "productName": "Wireless Mouse",
        "productSku": "MOUSE-001",
        "unitPrice": 24.99,
        "quantity": 2,
        "subtotal": 49.98,
        "productImage": "https://cdn.example.com/products/mouse-001-1.jpg"
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": 49.98,
      "tax": 4.50,
      "shippingCost": 5.00,
      "discount": 0,
      "total": 59.48
    },
    "updatedAt": "2025-11-29T15:30:00.000Z"
  }
}
```

---

#### POST /cart/items
Add item to cart.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "itemId": "item-1",
    "productId": 1,
    "productName": "Wireless Mouse",
    "quantity": 2,
    "subtotal": 49.98
  },
  "message": "Item added to cart"
}
```

**Error Responses**:
- 400: Invalid quantity
- 404: Product not found
- 409: Insufficient stock

---

#### PUT /cart/items/:id
Update cart item quantity.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "quantity": 3
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "itemId": "item-1",
    "quantity": 3,
    "subtotal": 74.97
  },
  "message": "Cart item updated"
}
```

---

#### DELETE /cart/items/:id
Remove item from cart.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### 3.2 Order Endpoints

#### POST /orders
Create order from cart.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "customerNotes": "Please deliver after 5 PM",
  "paymentMethod": "STRIPE"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "orderId": 1001,
    "orderNumber": "ORD-20251129-1001",
    "userId": "507f1f77bcf86cd799439011",
    "status": "PENDING",
    "items": [
      {
        "productId": 1,
        "productName": "Wireless Mouse",
        "quantity": 2,
        "unitPrice": 24.99,
        "subtotal": 49.98
      }
    ],
    "subtotal": 49.98,
    "tax": 4.50,
    "shippingCost": 5.00,
    "total": 59.48,
    "currency": "USD",
    "shippingAddress": { /* ... */ },
    "paymentIntentId": "pi_abc123",
    "createdAt": "2025-11-29T16:00:00.000Z"
  },
  "message": "Order created successfully. Proceed to payment."
}
```

**Error Responses**:
- 400: Cart is empty
- 409: Product out of stock

---

#### GET /orders
Get user's order history.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `status` (filter by status)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1001,
        "orderNumber": "ORD-20251129-1001",
        "status": "DELIVERED",
        "total": 59.48,
        "currency": "USD",
        "itemCount": 2,
        "createdAt": "2025-11-29T16:00:00.000Z",
        "deliveredAt": "2025-12-02T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

#### GET /orders/:id
Get order details.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "orderNumber": "ORD-20251129-1001",
    "userId": "507f1f77bcf86cd799439011",
    "status": "SHIPPED",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Wireless Mouse",
        "productSku": "MOUSE-001",
        "quantity": 2,
        "unitPrice": 24.99,
        "subtotal": 49.98,
        "productSnapshot": { /* full product details at time of order */ }
      }
    ],
    "subtotal": 49.98,
    "tax": 4.50,
    "shippingCost": 5.00,
    "discount": 0,
    "total": 59.48,
    "currency": "USD",
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "addressLine1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA",
      "phone": "+1234567890"
    },
    "billingAddress": { /* ... */ },
    "paymentId": "pay-123abc",
    "paymentStatus": "SUCCEEDED",
    "customerNotes": "Please deliver after 5 PM",
    "createdAt": "2025-11-29T16:00:00.000Z",
    "confirmedAt": "2025-11-29T16:05:00.000Z",
    "shippedAt": "2025-11-30T10:00:00.000Z",
    "estimatedDelivery": "2025-12-03T17:00:00.000Z"
  }
}
```

---

#### PATCH /orders/:id/cancel
Cancel order.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body** (optional):
```json
{
  "reason": "Changed my mind"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orderId": 1001,
    "status": "CANCELLED",
    "cancelledAt": "2025-11-29T17:00:00.000Z"
  },
  "message": "Order cancelled successfully. Refund will be processed."
}
```

**Error Responses**:
- 400: Order already shipped
- 404: Order not found

---

### 3.3 Admin Order Endpoints

#### GET /admin/orders
Get all orders (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Query Parameters**:
- `page`, `limit`, `status`, `fromDate`, `toDate`

**Response**: Similar to user orders with all users' data

---

#### PATCH /admin/orders/:id/status
Update order status (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Request Body**:
```json
{
  "status": "SHIPPED",
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "UPS",
  "adminNotes": "Shipped via express delivery"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orderId": 1001,
    "status": "SHIPPED",
    "shippedAt": "2025-11-30T10:00:00.000Z",
    "trackingInfo": {
      "number": "1Z999AA10123456784",
      "carrier": "UPS"
    }
  },
  "message": "Order status updated successfully"
}
```

---

## 4. Payment Service API

**Base URL**: `/api` (Port: 3004)

### 4.1 Payment Endpoints

#### POST /payments/intent
Create payment intent.

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "orderId": "1001",
  "amount": 59.48,
  "currency": "USD",
  "provider": "STRIPE",
  "paymentMethod": "card"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "paymentId": "pay-abc123xyz",
    "paymentIntentId": "pi_3AbC123xyz",
    "clientSecret": "pi_3AbC123xyz_secret_xyz",
    "provider": "STRIPE",
    "amount": 59.48,
    "currency": "USD",
    "status": "PENDING",
    "createdAt": "2025-11-29T16:05:00.000Z"
  },
  "message": "Payment intent created. Use client secret to complete payment."
}
```

---

#### GET /payments/:id
Get payment details.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "paymentId": "pay-abc123xyz",
    "orderId": "1001",
    "userId": "507f1f77bcf86cd799439011",
    "provider": "STRIPE",
    "amount": 59.48,
    "currency": "USD",
    "status": "SUCCEEDED",
    "paymentIntentId": "pi_3AbC123xyz",
    "externalTransactionId": "ch_3xyz789abc",
    "paymentMethod": "visa_4242",
    "metadata": {
      "cardBrand": "visa",
      "last4": "4242"
    },
    "createdAt": "2025-11-29T16:05:00.000Z",
    "processedAt": "2025-11-29T16:06:15.000Z"
  }
}
```

---

#### GET /payments/order/:orderId
Get payments for an order.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orderId": "1001",
    "payments": [
      {
        "paymentId": "pay-abc123xyz",
        "provider": "STRIPE",
        "amount": 59.48,
        "status": "SUCCEEDED",
        "createdAt": "2025-11-29T16:05:00.000Z"
      }
    ]
  }
}
```

---

#### POST /payments/:id/refund
Refund payment (Admin only).

**Headers**:
```
Authorization: Bearer <admin-token>
```

**Request Body**:
```json
{
  "amount": 59.48,
  "reason": "Customer request"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "paymentId": "pay-abc123xyz",
    "refundId": "re_abc123",
    "refundAmount": 59.48,
    "status": "REFUNDED",
    "refundedAt": "2025-11-29T18:00:00.000Z"
  },
  "message": "Payment refunded successfully"
}
```

---

### 4.2 Webhook Endpoints

#### POST /payments/stripe/webhook
Stripe webhook handler.

**Headers**:
```
Stripe-Signature: t=xxx,v1=yyy
```

**Request Body**: Stripe event object

**Response** (200 OK):
```json
{
  "received": true
}
```

---

#### POST /payments/paypal/webhook
PayPal webhook handler.

**Headers**:
```
Paypal-Transmission-Id: xxx
Paypal-Transmission-Sig: yyy
```

**Request Body**: PayPal event object

**Response** (200 OK):
```json
{
  "received": true
}
```

---

## 5. Notification Service API

**Base URL**: `/api` (Port: 3005)

### 5.1 Notification Endpoints

#### POST /notifications/email
Send email notification (Internal API).

**Headers**:
```
X-API-Key: <service-api-key>
```

**Request Body**:
```json
{
  "recipient": "user@example.com",
  "template": "order-confirmation",
  "data": {
    "orderNumber": "ORD-20251129-1001",
    "customerName": "John Doe",
    "orderTotal": 59.48,
    "orderItems": [
      {
        "name": "Wireless Mouse",
        "quantity": 2,
        "price": 24.99
      }
    ],
    "orderDate": "2025-11-29T16:00:00.000Z"
  },
  "priority": "normal"
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "notificationId": "notif-abc123",
    "jobId": "job-xyz789",
    "status": "QUEUED"
  },
  "message": "Email notification queued for delivery"
}
```

---

#### POST /notifications/sms
Send SMS notification (Internal API).

**Headers**:
```
X-API-Key: <service-api-key>
```

**Request Body**:
```json
{
  "recipient": "+1234567890",
  "message": "Your order ORD-20251129-1001 has been shipped!",
  "priority": "high"
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "notificationId": "notif-sms-123",
    "status": "QUEUED"
  },
  "message": "SMS notification queued for delivery"
}
```

---

#### GET /notifications/:id
Get notification status.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notificationId": "notif-abc123",
    "type": "EMAIL",
    "recipient": "user@example.com",
    "status": "SENT",
    "sentAt": "2025-11-29T16:01:30.000Z",
    "createdAt": "2025-11-29T16:00:45.000Z"
  }
}
```

---

## 6. Common Patterns

### 6.1 Standard Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error details */ },
    "timestamp": "2025-11-29T16:00:00.000Z",
    "path": "/api/endpoint"
  }
}
```

### 6.2 Common Headers

**Request Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-API-Key: <service-api-key> (for service-to-service)
X-Request-ID: <uuid> (for tracing)
```

**Response Headers**:
```
Content-Type: application/json
X-Request-ID: <uuid>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701270000
```

### 6.3 HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 202 | Accepted | Request accepted for async processing |
| 204 | No Content | Successful DELETE with no response body |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate, state error) |
| 422 | Unprocessable Entity | Semantic validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Service temporarily unavailable |

### 6.4 Pagination Format

**Request Query**:
```
?page=2&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```

### 6.5 Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | JWT token has expired |
| `AUTH_TOKEN_INVALID` | JWT token is malformed or invalid |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource already exists |
| `INSUFFICIENT_STOCK` | Product out of stock |
| `PAYMENT_FAILED` | Payment processing failed |
| `ORDER_INVALID_STATE` | Order cannot be modified in current state |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Internal server error |

---

**Document Version**: 1.0  
**Last Updated**: November 29, 2025
