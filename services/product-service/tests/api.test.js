const request = require('supertest');
const app = require('../src/server');
const { sequelize } = require('../src/models');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');

describe('Product Service - API Tests', () => {
  let adminToken;
  let testCategory;
  let testProduct;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });

    // Create test category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices',
    });

    // Mock admin token (in real scenario, get from User Service)
    adminToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Health Checks', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
    });

    it('should return readiness status', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.checks.database).toBe('connected');
    });
  });

  describe('GET /api/products', () => {
    beforeAll(async () => {
      // Create test products
      await Product.bulkCreate([
        {
          name: 'Laptop',
          sku: 'LAPTOP-001',
          description: 'Gaming laptop',
          categoryId: testCategory.id,
          price: 999.99,
          stockQuantity: 10,
          isAvailable: true,
        },
        {
          name: 'Mouse',
          sku: 'MOUSE-001',
          description: 'Wireless mouse',
          categoryId: testCategory.id,
          price: 29.99,
          stockQuantity: 50,
          isAvailable: true,
        },
      ]);
    });

    it('should return all products', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeInstanceOf(Array);
      expect(res.body.data.products.length).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      const res = await request(app).get(`/api/products?category=${testCategory.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.products.every(p => p.categoryId === testCategory.id)).toBe(true);
    });

    it('should filter products by price range', async () => {
      const res = await request(app).get('/api/products?minPrice=20&maxPrice=50');
      expect(res.status).toBe(200);
      expect(res.body.data.products.every(p => p.price >= 20 && p.price <= 50)).toBe(true);
    });

    it('should search products by name', async () => {
      const res = await request(app).get('/api/products?search=laptop');
      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBeGreaterThan(0);
    });

    it('should paginate products', async () => {
      const res = await request(app).get('/api/products?page=1&limit=1');
      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/products/:id', () => {
    beforeAll(async () => {
      testProduct = await Product.findOne();
    });

    it('should return product by ID', async () => {
      const res = await request(app).get(`/api/products/${testProduct.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testProduct.id);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/99999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories).toBeInstanceOf(Array);
    });
  });

  describe('Metrics', () => {
    it('should return Prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_requests_total');
      expect(res.text).toContain('http_request_duration_seconds');
    });
  });
});
