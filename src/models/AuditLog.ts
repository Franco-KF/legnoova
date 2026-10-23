import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

export type AuditLogSeverity = "low" | "medium" | "high" | "critical";

const auditLogSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, default: null },
    ip: { type: String, required: true },
    userAgent: { type: String, default: null },
    details: { type: Schema.Types.Mixed, default: {} },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
      index: true,
    },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ type: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

export type IAuditLog = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;

export async function recordSecurityEvent(input: {
  type: string;
  userId?: string | null;
  ip?: string;
  userAgent?: string | null;
  details?: Record<string, unknown>;
  severity?: AuditLogSeverity;
}) {
  await AuditLog.create({
    type: input.type,
    userId: input.userId ?? null,
    ip: input.ip ?? "unknown",
    userAgent: input.userAgent ?? null,
    details: input.details ?? {},
    severity: input.severity ?? "low",
  });
}
