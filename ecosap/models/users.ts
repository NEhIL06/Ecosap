import mongoose, { Document, Schema, Model } from "mongoose";

type UserDocument = Document & {
    _id: string;
    username: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    aadhar_number: string;
    signature: string;
    ecocredits: number;
    createdAt: Date;
    updatedAt: Date;
}


const userSchema: Schema<UserDocument> = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    aadhar_number: { type: String, required: true, unique: true },
    signature: { type: String, required: true },
    ecocredits: { type: Number, default: 0 }
}, { timestamps: true });

const users: Model<UserDocument> = mongoose.model<UserDocument>('users', userSchema);

export default users;