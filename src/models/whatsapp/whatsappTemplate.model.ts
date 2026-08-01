import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWhatsAppTemplate extends Document {
  instituteId: Types.ObjectId; // PEHLA FIELD HAMESHA
  name: string;
  category: "attendance" | "fee" | "exam" | "announcement";
  language: string;
  templateId: string;
  bodyText: string;
  variables: string[];
  metaStatus: "APPROVED" | "PENDING" | "REJECTED";
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const whatsappTemplateSchema = new Schema<IWhatsAppTemplate>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    name:        { type: String, required: true, trim: true },
    category:    { type: String, enum: ["attendance", "fee", "exam", "announcement"], default: "attendance" },
    language:    { type: String, default: "en_US" },
    templateId:  { type: String, required: true, trim: true },
    bodyText:    { type: String, required: true, trim: true },
    variables:   [{ type: String }],
    metaStatus:  { type: String, enum: ["APPROVED", "PENDING", "REJECTED"], default: "APPROVED" },
    status:      { type: String, enum: ["active", "deleted"], default: "active" },
  },
  { timestamps: true }
);

whatsappTemplateSchema.index({ instituteId: 1, category: 1 });

export const WhatsAppTemplate = mongoose.model<IWhatsAppTemplate>("WhatsAppTemplate", whatsappTemplateSchema);
