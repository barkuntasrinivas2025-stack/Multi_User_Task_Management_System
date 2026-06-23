// @ts-nocheck
import request from 'supertest';
import express from 'express';
import cardsRouter from '../src/routes/cards';

// Mock dependencies
jest.mock('../src/db', () => {
  return {
    db: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
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

const app = express();
app.use(express.json());
app.use('/api/v1/boards/:boardId/cards', cardsRouter);

describe('Cards Routes', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
  };

  const mockToken = 'fake-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    // NOTE: Full DB chain mocking (board membership check + card query)
    // requires mocking two sequential db.select() calls with different
    // return shapes. Scaffolded but not yet implemented — marked as todo.
    it.todo('should return active cards for a board');
  });

  describe('POST /', () => {
    it.todo('should create a new card');
  });

  describe('DELETE /:id', () => {
    it.todo('should soft-delete a card instead of removing it');
  });
});