import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    rateLimitRpm: parseInt(process.env.GEMINI_RATE_LIMIT_RPM || '60', 10),
  },
}));
