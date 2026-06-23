// @ts-nocheck
import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth';

// Mock dependencies
jest.mock('../src/db', () => {
  return {
    db: {
      select: jest.fn(),
      insert: jest.fn(),
    },
  };
});

jest.mock('../src/lib/jwt', () => ({
  signToken: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock drizzle-orm eq function
jest.mock('drizzle-orm', () => ({
  eq: (column: any, value: any) => ({ _column: column, _value: value }), // simple object placeholder
}));

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);

describe('Auth Routes', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: 'member',
  };

  const mockToken = 'fake-jwt-token';

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const db = require('../src/db').db;
      // Mock select to return empty array (no existing user)
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock bcrypt.hash
      (require('bcryptjs').hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Mock insert to return inserted user
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      // Mock signToken
      (require('../src/lib/jwt').signToken as jest.Mock).mockReturnValue(mockToken);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' })
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('token', mockToken);
      expect(res.body.data.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
      });
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' }) // missing password and name
        .expect(400);

      expect(res.body.error).toMatch(/email, password and name are required/);
    });

    it('should return 409 for duplicate email', async () => {
      const db = require('../src/db').db;
      // Mock select to return an existing user
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ email: 'test@example.com' }]),
          }),
        }),
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' })
        .expect(409);

      expect(res.body.error).toMatch(/Email already registered/);
    });
  });

  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      const db = require('../src/db').db;
      // Mock select to return user
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Mock bcrypt.compare
      (require('bcryptjs').compare as jest.Mock).mockResolvedValue(true);

      // Mock signToken
      (require('../src/lib/jwt').signToken as jest.Mock).mockReturnValue(mockToken);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('token', mockToken);
      expect(res.body.data.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const db = require('../src/db').db;
      // Mock select to return empty array (user not found)
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);

      expect(res.body.error).toMatch(/Invalid credentials/);
    });
  });
});