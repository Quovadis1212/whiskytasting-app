import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
  points: { type: Number, min: 0, max: 100, default: 50 },
  notes: { type: String, default: '' },
  aromas: { type: [String], default: [] }
}, { _id: false });

const DramSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  name: { type: String, default: '' },       // erst nach Freigabe sichtbar
  broughtBy: { type: String, default: '' }   // erst nach Freigabe sichtbar
}, { _id: false });

const TastingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  host: { type: String, default: '' },
  released: { type: Boolean, default: false },
  // Speichere nur Hash der PIN, nie im Klartext
  organizerPinHash: { type: String, required: true },
  drams: { type: [DramSchema], default: [] },
  // ratings[participant][order] = Rating
  ratings: {
    type: Map,
    of: {
      type: Map,
      of: RatingSchema
    },
    default: {}
  }
}, { timestamps: true });

export default mongoose.model('Tasting', TastingSchema);
