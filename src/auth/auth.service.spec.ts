import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { Session } from './schemas/session.schema';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let sessionModel: any;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockSessionModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, unknown> = {
        'auth.session.maxAge': 86400,
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Session.name), useValue: mockSessionModel },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    sessionModel = module.get(getModelToken(Session.name));

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      userModel.findOne.mockResolvedValueOnce(null);
      userModel.create.mockResolvedValueOnce({
        _id: { toString: () => 'user-id-1' },
        name: 'Test',
        email: 'test@example.com',
        role: 'owner',
      });
      sessionModel.create.mockResolvedValueOnce({});

      const result = await service.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'StrongP@ss1',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(userModel.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email exists', async () => {
      userModel.findOne.mockResolvedValueOnce({ email: 'test@example.com' });

      await expect(
        service.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'StrongP@ss1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid email', async () => {
      userModel.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(
        service.login({ email: 'wrong@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException for invalid session', async () => {
      sessionModel.findOne.mockResolvedValueOnce(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
