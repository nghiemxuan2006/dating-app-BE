import mongoose, { Schema, Document, Types } from 'mongoose';

// Account interface and schema
export interface IAccount extends Document {
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema: Schema = new Schema<IAccount>(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true }
    },
    { timestamps: true }
);

export const Account = mongoose.model<IAccount>('Account', AccountSchema);

// UserInfo interface and schema
export interface IUserInfo extends Document {
    account: Types.ObjectId;
    gender: 'male' | 'female' | 'other';
    gender_preference: 'male' | 'female' | 'other';
    age_range?: {
        min: number;
        max: number;
    };
    birthdate: Date;
    interests?: string[];
    photos?: string[];
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    location_string?: string; // For easier querying like "Dao Nguyen, An Khanh, Ha Noi"
    createdAt: Date;
    updatedAt: Date;
}

const UserInfoSchema: Schema = new Schema<IUserInfo>(
    {
        account: { type: Schema.Types.ObjectId, ref: 'Account', required: true, unique: true },
        gender: { type: String, enum: ['male', 'female', 'other'], required: true },
        gender_preference: { type: String, enum: ['male', 'female', 'other'], required: true },
        birthdate: { type: Date, required: true },
        interests: [{ type: String }],
        photos: [{ type: String }],
        age_range: {
            min: { type: Number },
            max: { type: Number }
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        location_string: { type: String } // e.g., "New York, NY"
    },
    { timestamps: true }
);

UserInfoSchema.index({ location: '2dsphere' });

export const UserInfo = mongoose.model<IUserInfo>('UserInfo', UserInfoSchema);