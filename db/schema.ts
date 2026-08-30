import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  createdAt: text("created_at").notNull(),
});

export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  phone: text("phone").notNull().default(""),
  complaint: text("complaint").notNull(),
  symptoms: text("symptoms").notNull().default(""),
  history: text("history").notNull().default(""),
  allergies: text("allergies").notNull().default(""),
  medications: text("medications").notNull().default(""),
  heartRate: integer("heart_rate").notNull(),
  systolic: integer("systolic").notNull(),
  diastolic: integer("diastolic").notNull(),
  spo2: integer("spo2").notNull(),
  temperature: real("temperature").notNull(),
  pain: integer("pain").notNull(),
  esi: integer("esi").notNull(),
  confidence: integer("confidence").notNull(),
  explanation: text("explanation").notNull(),
  status: text("status").notNull().default("waiting"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by").notNull(),
  version: integer("version").notNull().default(1),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull(),
  event: text("event").notNull(),
  actorEmail: text("actor_email").notNull(),
  actorRole: text("actor_role").notNull(),
  detail: text("detail").notNull(),
  createdAt: text("created_at").notNull(),
});
