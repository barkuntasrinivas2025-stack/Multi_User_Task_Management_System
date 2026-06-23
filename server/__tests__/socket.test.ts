// @ts-nocheck
// Mock dependencies before importing the server logic
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

// We need to mock the io instance creation; we'll create a mock io and inject it.
let ioMock: any;
jest.mock('socket.io', () => {
  return class {
    constructor(httpServer: any, options: any) {
      ioMock = {
        use: jest.fn((fn: any) => {
          this._middleware = fn;
        }),
        to: (room: string) => ({
          emit: jest.fn((event: string, data: any) => {}),
        }),
        on: (event: string, callback: (socket: any) => void) => {
          if (event === 'connection') {
            const mockSocket = {
              id: 'socket-id',
              handshake: { auth: { token: 'fake-token' } },
              join: jest.fn(),
              leave: jest.fn(),
              emit: jest.fn(),
              on: jest.fn((ev: string, cb: any) => {
                if (ev === 'board:join') {
                  this._boardJoinHandler = cb;
                } else if (ev === 'board:leave') {
                  this._boardLeaveHandler = cb;
                } else if (ev === 'card:edit:start') {
                  this._cardEditStartHandler = cb;
                } else if (ev === 'card:edit:stop') {
                  this._cardEditStopHandler = cb;
                } else if (ev === 'disconnect') {
                  this._disconnectHandler = cb;
                }
              }),
            };
            this._middleware(mockSocket, () => {
              callback(mockSocket);
            });
          }
        },
      };
    }
  };
});

import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';

let app: express.Express;
let httpServer: any;
let io: any;

beforeAll(() => {
  app = express();
  httpServer = createServer(app);
});

afterAll(() => {
  if (httpServer) {
    httpServer.close();
  }
});

describe('Socket.IO Logic', () => {
  // NOTE: Full integration mocking of Socket.IO connection lifecycle is
  // scaffolded above but not yet wired into individual test bodies.
  // Marked as todo — core auth and route behavior is already covered
  // by auth.test.ts. These will be implemented next.

  it.todo('should authenticate a valid token and allow connection');
  it.todo('should reject connection with invalid token');
  it.todo('should handle board:join event and make socket join the room');
  it.todo('should handle board:leave event and make socket leave the room');
  it.todo('should broadcast card:edit:start to the room');
  it.todo('should not broadcast card:edit:start to other rooms');
});