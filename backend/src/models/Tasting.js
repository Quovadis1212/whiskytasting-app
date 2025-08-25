// models/Tasting.js
import mongoose from "mongoose";

const TastingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  host: { type: String, default: '' },
  released: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  organizerPinHash: { type: String, required: true },
  drams: { type: [DramSchema], default: [] },
  ratings: {
    type: Map,
    of: { type: Map, of: RatingSchema },
    default: {}
  },
  joinCode: { type: String, unique: true, index: true }
}, { timestamps: true });

export default mongoose.model("Tasting", TastingSchema);
