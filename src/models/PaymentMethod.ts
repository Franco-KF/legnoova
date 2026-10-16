import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

/**
 * Saved payment method.
 *
 * The full card number (PAN) is encrypted with AES-256-GCM before storage and
 * is excluded from queries by default (`select: false`). Only trusted server
 * code that explicitly selects it — the admin panel — can decrypt it.
 */
const encryptedCardSchema = new Schema(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { _id: false }
);

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
      enum: [
        "visa",
        "mastercard",
        "amex",
        "discover",
        "diners",
        "jcb",
        "unknown",
      ],
      default: "unknown",
    },
    /** Last three digits only. Never the full card number. */
    last3: { type: String, required: true, minlength: 3, maxlength: 3 },
    /** Full PAN, AES-256-GCM encrypted. Hidden from queries unless requested. */
    card: { type: encryptedCardSchema, required: false, select: false },
    /** 3-digit CK key from the company's hard-copy user list. */
    ckNumber: { type: String, required: true, trim: true, minlength: 3, maxlength: 3 },
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
