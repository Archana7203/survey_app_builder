import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  role: 'creator' | 'respondent';
  name?: string;
  oid?: string; // Azure AD Object ID for SSO users
  ssoAuth?: boolean; // Flag to indicate SSO authentication
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: false, // Optional for SSO users
  },
  role: {
    type: String,
    enum: ['creator', 'respondent'],
    default: 'respondent',
  },
  name: {
    type: String,
    trim: true,
  },
  oid: {
    type: String, // Azure AD Object ID for SSO users
    sparse: true,
  },
  ssoAuth: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);





