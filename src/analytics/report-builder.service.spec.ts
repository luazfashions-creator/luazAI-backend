import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReportBuilderService } from './report-builder.service';
import { AnalyticsEvent } from './schemas/analytics-event.schema';

describe('ReportBuilderService', () => {
  let service: ReportBuilderService;

  const mockAggregateResult = [
    { _id: 'page_view', totalValue: 1500, count: 1500 },
    { _id: 'click', totalValue: 300, count: 300 },
  ];

  const mockModel = {
    aggregate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAggregateResult),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportBuilderService,
        { provide: getModelToken(AnalyticsEvent.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<ReportBuilderService>(ReportBuilderService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return overview with metrics grouped by event type', async () => {
    const result = await service.getOverview('507f1f77bcf86cd799439012', '30d');

    expect(result.brandId).toBe('507f1f77bcf86cd799439012');
    expect(result.period).toBe('30d');
    expect(result.metrics).toHaveLength(2);
    expect(result.metrics[0].eventType).toBe('page_view');
  });

  it('should use correct period for 7d', async () => {
    const result = await service.getOverview('507f1f77bcf86cd799439012', '7d');

    expect(result.since.getTime()).toBeGreaterThan(
      Date.now() - 8 * 24 * 60 * 60 * 1000,
    );
  });
});
