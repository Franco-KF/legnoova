import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

/**
 * Saved payment method (card metadata only).
 *
 * IMPORTANT: This model intentionally stores ONLY non-sensitive card metadata.
 * The full card number (PAN) and CVV are never accepted, transmitted to the
 * server, or persisted here — doing so is a PCI-DSS violation. To charge a
 * card for real, use a PCI-compliant processor and store its token instead.
 */
const paymentMethodSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    brand: {
      type: String,
      enum: ["visa", "mastercard", "amex", "discover", "unknown"],
      default: "unknown",
    },
    /** Last four digits only. Never the full card number. */
    last4: { type: String, required: true, minlength: 4, maxlength: 4 },
    expMonth: { type: Number, required: true, min: 1, max: 12 },
    expYear: { type: Number, required: true },
    name: { type: String, trim: true, maxlength: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ userId: 1, createdAt: -1 });

export type IPaymentMethod = InferSchemaType<typeof paymentMethodSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PaymentMethod: Model<IPaymentMethod> =
  (mongoose.models.PaymentMethod as Model<IPaymentMethod>) ||
  mongoose.model<IPaymentMethod>("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
