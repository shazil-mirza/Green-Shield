
import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
  _id: Types.ObjectId;
  id: string;
  
  name: string; 
  email: string;
  password?: string; 
  role: 'user' | 'admin';
  
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeSubscriptionStatus?: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | null;
  planType: 'free' | 'premium';
  detectionCount: number;

  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchemaOptions = {
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
};

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: { 
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  password: {
    type: String,
    required: false,
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, 
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true, 
  },
  stripeSubscriptionId: {
    type: String,
  },
  stripePriceId: {
    type: String,
  },
  stripeSubscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'incomplete', 'past_due', 'trialing', null],
    default: null,
  },
  planType: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  detectionCount: {
    type: Number,
    required: true,
    default: 0,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, userSchemaOptions);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;