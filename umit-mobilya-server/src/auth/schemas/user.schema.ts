import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import type { HydratedDocument } from 'mongoose';
import { isEmail } from 'validator';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users' })
export class User {
  @Prop({
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid email'],
  })
  email!: string;

  @Prop({
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Minimum password length is 6 characters'],
  })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

/*
 * The `isModified` guard is new and load-bearing. The Express hook hashed on
 * every save, so saving a user document to change any unrelated field would
 * re-hash the already-hashed password and lock the account out. Nothing does
 * that today, which is the only reason it has not happened yet.
 */
UserSchema.pre<UserDocument>('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
