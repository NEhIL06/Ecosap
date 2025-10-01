import mongoose, { Document, Schema, Model } from "mongoose";
import users from "./users";

type SaplingDocument = Document & {
    _id: string;
    name: string;
    description: string;
    image: string;
    owner: typeof users;
    plantDate?: Date;
    area:number;
    createdAt: Date;
    updatedAt: Date;
}


const saplingSchema: Schema<SaplingDocument> = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    plantDate: { type: Date, default: Date.now },
    area: { type: Number, required: true }
}, { timestamps: true });

const saplings:Model<SaplingDocument> = mongoose.model<SaplingDocument>('saplings',saplingSchema);

export default saplings;
