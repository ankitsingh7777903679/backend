import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClass extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  name: string;
  timing?: string;
  shift?: "morning" | "evening";
  days?: string;
  description?: string;
  subjects?: string[];
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    name:        { type: String, required: true, trim: true },
    timing:      { type: String, trim: true },
    shift:       { type: String, enum: ["morning", "evening"], default: "morning" },
    days:        { type: String, trim: true, default: "Mon – Sat (Daily)" },
    description: { type: String, trim: true },
    subjects:    [{ type: String, trim: true }],
    status:      { type: String, enum: ["active", "inactive", "deleted"], default: "active" },
  },
  { timestamps: true }
);

classSchema.index({ instituteId: 1, status: 1 });
classSchema.index({ instituteId: 1, name: 1 });

export const Class = mongoose.model<IClass>("Class", classSchema);
