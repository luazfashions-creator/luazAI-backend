export interface AgentConfig {
  type: string;
  name: string;
  description: string;
  maxRetries: number;
  timeout: number;
  tools: string[];
}
