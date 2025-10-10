import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
    userid1: mongoose.Types.ObjectId;
    userid2: mongoose.Types.ObjectId;
    user1like: boolean;
    user2like: boolean;
    status: string;
}

const MatchSchema: Schema = new Schema({
    userid1: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    userid2: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    user1like: { type: Boolean, required: true },
    user2like: { type: Boolean, required: true },
    status: {type: String, required: true}
}, { timestamps: true });

export const Match = mongoose.model<IMatch>('Match', MatchSchema);