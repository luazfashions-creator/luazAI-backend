import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  secret: process.env.AUTH_SECRET || 'change-me-to-a-random-secret-at-least-32-chars',
  url: process.env.AUTH_URL || 'http://localhost:3000',
  session: {
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 4 * 60 * 60, // 4 hours
  },
  rateLimit: {
    maxAttempts: 10,
    windowSeconds: 60,
  },
}));
