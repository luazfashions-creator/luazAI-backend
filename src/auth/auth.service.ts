import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { User, UserDocument } from './schemas/user.schema';
import { Session, SessionDocument } from './schemas/session.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateRandomToken } from '../shared/utils/crypto.util';

const scryptAsync = promisify(scrypt);

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly sessionMaxAge: number;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    private readonly config: ConfigService,
  ) {
    this.sessionMaxAge = this.config.get<number>('auth.session.maxAge', 86400);
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUser; token: string }> {
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
    });

    const token = await this.createSession(user);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; token: string }> {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.verifyPassword(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.createSession(user);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async logout(token: string): Promise<void> {
    await this.sessionModel.deleteOne({ token });
  }

  async getMe(token: string): Promise<AuthUser | null> {
    const session = await this.validateSession(token);
    if (!session) return null;

    const user = await this.userModel.findById(session.userId);
    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async refreshToken(oldToken: string): Promise<{ token: string }> {
    const session = await this.validateSession(oldToken);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    await this.sessionModel.deleteOne({ _id: session._id });

    const user = await this.userModel.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newToken = await this.createSession(user);
    return { token: newToken };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If an account exists, a reset email has been sent' };
    }

    // In production, send reset email. For now, log the token.
    const resetToken = generateRandomToken();
    this.logger.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If an account exists, a reset email has been sent' };
  }

  resetPassword(
    token: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _newPassword: string,
  ): Promise<{ message: string }> {
    // In production, validate the token against stored reset tokens
    // For now, this is a placeholder
    this.logger.log(
      `Password reset requested with token: ${token.substring(0, 8)}...`,
    );
    throw new NotFoundException(
      'Password reset flow not fully implemented yet',
    );
  }

  async validateSession(token: string): Promise<SessionDocument | null> {
    const session = await this.sessionModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });
    return session;
  }

  private async createSession(user: UserDocument): Promise<string> {
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + this.sessionMaxAge * 1000);

    await this.sessionModel.create({
      userId: user._id,
      token,
      expiresAt,
    });

    return token;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    stored: string,
  ): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const storedKey = Buffer.from(hash, 'hex');
    return timingSafeEqual(derivedKey, storedKey);
  }
}
