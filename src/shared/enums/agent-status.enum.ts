export enum AgentStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DEAD = 'dead',
  WAITING_INPUT = 'waiting_input',
  WAITING_DEPENDENCY = 'waiting_dependency',
  CANCELLED = 'cancelled',
}
