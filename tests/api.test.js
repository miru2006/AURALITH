const request = require('supertest');
const app = require('../server');

describe('API Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.environment).toBeDefined();
  });
});

describe('Authentication Routes', () => {
  test('POST /api/auth/register should require valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: '123'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  test('POST /api/auth/login should require credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe('Protected Routes', () => {
  test('GET /api/tourist/profile should require authentication', async () => {
    const response = await request(app)
      .get('/api/tourist/profile')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('authorization');
  });
});
