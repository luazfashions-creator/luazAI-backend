import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrandService } from './brand.service';
import { BrandRepository } from './brand.repository';

describe('BrandService', () => {
  let service: BrandService;

  const mockRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findByOwner: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, unknown> = {
        'redis.host': 'localhost',
        'redis.port': 6379,
        'redis.password': undefined,
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        { provide: BrandRepository, useValue: mockRepo },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<BrandService>(BrandService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a brand with auto-generated slug', async () => {
      mockRepo.findBySlug.mockResolvedValueOnce(null);
      mockRepo.create.mockResolvedValueOnce({
        _id: 'brand-1',
        name: 'Test Brand',
        slug: 'test-brand',
        ownerId: 'user-1',
      });

      const result = await service.create({ name: 'Test Brand' }, 'user-1');

      expect(result.slug).toBe('test-brand');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'test-brand' }),
      );
    });

    it('should throw ConflictException if slug exists', async () => {
      mockRepo.findBySlug.mockResolvedValueOnce({ slug: 'test-brand' });

      await expect(
        service.create({ name: 'Test Brand' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException for non-existent brand', async () => {
      mockRepo.findById.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for non-owner', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ownerId: { toString: () => 'user-2' },
      });

      await expect(service.findOne('brand-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException for non-owner', async () => {
      mockRepo.findById.mockResolvedValueOnce({
        ownerId: { toString: () => 'user-2' },
      });

      await expect(service.delete('brand-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
