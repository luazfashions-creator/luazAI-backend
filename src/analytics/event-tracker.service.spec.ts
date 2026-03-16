import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventTrackerService } from './event-tracker.service';
import { AnalyticsEvent } from './schemas/analytics-event.schema';

describe('EventTrackerService', () => {
  let service: EventTrackerService;

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    brandId: '507f1f77bcf86cd799439012',
    eventType: 'page_view',
    source: 'google',
    metric: 'views',
    value: 1,
    timestamp: new Date(),
  };

  const mockModel = {
    create: jest.fn().mockResolvedValue(mockEvent),
    insertMany: jest.fn().mockResolvedValue([mockEvent, mockEvent]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTrackerService,
        { provide: getModelToken(AnalyticsEvent.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<EventTrackerService>(EventTrackerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should track a single event', async () => {
    const result = await service.track({
      brandId: '507f1f77bcf86cd799439012',
      eventType: 'page_view',
      source: 'google',
      metric: 'views',
      value: 1,
    });

    expect(mockModel.create).toHaveBeenCalledTimes(1);
    expect(result._id).toBeDefined();
  });

  it('should track batch events', async () => {
    const count = await service.trackBatch([
      {
        brandId: '507f1f77bcf86cd799439012',
        eventType: 'page_view',
        source: 'google',
        metric: 'views',
        value: 1,
      },
      {
        brandId: '507f1f77bcf86cd799439012',
        eventType: 'click',
        source: 'google',
        metric: 'clicks',
        value: 1,
      },
    ]);

    expect(mockModel.insertMany).toHaveBeenCalledTimes(1);
    expect(count).toBe(2);
  });
});
