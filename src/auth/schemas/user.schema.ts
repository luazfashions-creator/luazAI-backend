import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../shared/constants/roles.constant';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: String, enum: Role, default: Role.OWNER })
  role: Role;

  @Prop()
  image?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
