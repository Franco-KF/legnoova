import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

/**
 * PAN, cardholder name, expiry, and Legnoova's company customer reference code
 * are encrypted at rest. Card security codes are never stored. Full values are
 * decrypted only by the authenticated admin data path.
 */
const encryptedValueSchema = new Schema(
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
      enum: ["visa", "mastercard", "amex", "discover", "diners", "jcb", "unknown"],
      default: "unknown",
    },
    card: { type: encryptedValueSchema, required: false, select: false },
    expMonthEncrypted: { type: encryptedValueSchema, select: false },
    expYearEncrypted: { type: encryptedValueSchema, select: false },
    nameEncrypted: { type: encryptedValueSchema, select: false },
    companyCodeEncrypted: { type: encryptedValueSchema, select: false },
    /** Legacy plaintext fields are retained only for the migration reader. */
    expMonth: { type: Number, min: 1, max: 12, select: false },
    expYear: { type: Number, select: false },
    name: { type: String, trim: true, maxlength: 100, select: false },
    last4: { type: String, required: true, minlength: 4, maxlength: 4 },
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
