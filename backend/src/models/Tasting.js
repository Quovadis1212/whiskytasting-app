// models/Tasting.js
import mongoose from "mongoose";

const TastingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  host: { type: String, required: true },
  joinCode: { type: String, unique: true, index: true },
  whiskies: [{
    code: String,        
    nameHidden: String,   
    broughtBy: String
  }],
  isClosed: { type: Boolean, default: false },   
  releasedAt: { type: Date, default: null },     
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Tasting", TastingSchema);
