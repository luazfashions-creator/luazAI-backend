import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AgentStateService } from './agent-state.service';
import { AgentState } from './schemas/agent-state.schema';
import { AgentStatus } from '../shared/enums/agent-status.enum';

describe('AgentStateService', () => {
  let service: AgentStateService;

  const mockState = {
    taskId: '507f1f77bcf86cd799439011',
    currentStatus: AgentStatus.PENDING,
    transitions: [],
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockModel = {
    create: jest.fn().mockResolvedValue({
      taskId: '507f1f77bcf86cd799439011',
      currentStatus: AgentStatus.PENDING,
      transitions: [],
    }),
    findOne: jest
      .fn()
      .mockReturnValue(Promise.resolve({ ...mockState, save: mockState.save })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentStateService,
        { provide: getModelToken(AgentState.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<AgentStateService>(AgentStateService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create initial state as PENDING', async () => {
    const result = await service.createState('507f1f77bcf86cd799439011');
    expect(result.currentStatus).toBe(AgentStatus.PENDING);
  });

  it('should allow PENDING → QUEUED transition', async () => {
    mockModel.findOne.mockResolvedValueOnce({
      ...mockState,
      currentStatus: AgentStatus.PENDING,
      transitions: [],
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    });

    const result = await service.transition(
      '507f1f77bcf86cd799439011',
      AgentStatus.QUEUED,
    );
    expect(result.currentStatus).toBe(AgentStatus.QUEUED);
  });

  it('should allow QUEUED → RUNNING transition', async () => {
    mockModel.findOne.mockResolvedValueOnce({
      ...mockState,
      currentStatus: AgentStatus.QUEUED,
      transitions: [],
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    });

    const result = await service.transition(
      '507f1f77bcf86cd799439011',
      AgentStatus.RUNNING,
    );
    expect(result.currentStatus).toBe(AgentStatus.RUNNING);
  });

  it('should reject invalid transition PENDING → RUNNING', async () => {
    mockModel.findOne.mockResolvedValueOnce({
      ...mockState,
      currentStatus: AgentStatus.PENDING,
      transitions: [],
      save: jest.fn(),
    });

    await expect(
      service.transition('507f1f77bcf86cd799439011', AgentStatus.RUNNING),
    ).rejects.toThrow('Invalid transition');
  });

  it('should reject transition from terminal state COMPLETED', async () => {
    mockModel.findOne.mockResolvedValueOnce({
      ...mockState,
      currentStatus: AgentStatus.COMPLETED,
      transitions: [],
      save: jest.fn(),
    });

    await expect(
      service.transition('507f1f77bcf86cd799439011', AgentStatus.RUNNING),
    ).rejects.toThrow('Invalid transition');
  });

  it('should allow FAILED → QUEUED retry transition', async () => {
    mockModel.findOne.mockResolvedValueOnce({
      ...mockState,
      currentStatus: AgentStatus.FAILED,
      transitions: [],
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    });

    const result = await service.transition(
      '507f1f77bcf86cd799439011',
      AgentStatus.QUEUED,
    );
    expect(result.currentStatus).toBe(AgentStatus.QUEUED);
  });
});
