import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  macAddress: text("mac_address").notNull().unique(),
  status: text("status").notNull().default("offline"), // online, offline, warning, error
  batteryLevel: integer("battery_level").default(0),
  signalStrength: integer("signal_strength").default(0),
  uptime: integer("uptime").default(0), // in seconds
  packetsSent: integer("packets_sent").default(0),
  packetLoss: real("packet_loss").default(0.0),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const healthMetrics = pgTable("health_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").references(() => devices.id).notNull(),
  heartRate: integer("heart_rate"),
  spO2: integer("sp_o2"),
  stepCount: integer("step_count"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const encryptionPipeline = pgTable("encryption_pipeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lfsrStatus: text("lfsr_status").notNull().default("active"),
  lfsrSeed: text("lfsr_seed").notNull(),
  lfsrBitsGenerated: integer("lfsr_bits_generated").default(0),
  tinkerbellStatus: text("tinkerbell_status").notNull().default("active"),
  tinkerbellParams: jsonb("tinkerbell_params").notNull(),
  transpositionStatus: text("transposition_status").notNull().default("active"),
  transpositionGrid: text("transposition_grid").notNull(),
  transpositionOps: integer("transposition_ops").default(0),
  hmacStatus: text("hmac_status").notNull().default("active"),
  encryptionTime: real("encryption_time").default(0.0),
  cpuUsage: integer("cpu_usage").default(0),
  memoryUsage: integer("memory_usage").default(0),
  throughput: integer("throughput").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const securityAlerts = pgTable("security_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // health, security, network, encryption
  severity: text("severity").notNull(), // info, warning, error
  title: text("title").notNull(),
  description: text("description").notNull(),
  deviceId: varchar("device_id").references(() => devices.id),
  resolved: boolean("resolved").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const keyEvolution = pgTable("key_evolution", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(), // cycle, reseed, update, exchange
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const systemPerformance = pgTable("system_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cpuUsage: integer("cpu_usage").notNull(),
  memoryUsage: integer("memory_usage").notNull(),
  averageLatency: real("average_latency").notNull(),
  activeConnections: integer("active_connections").notNull(),
  messagesPerSecond: integer("messages_per_second").notNull(),
  encryptionOpsPerSecond: integer("encryption_ops_per_second").notNull(),
  serverUptime: integer("server_uptime").notNull(), // in seconds
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
});

export const insertHealthMetricsSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertEncryptionPipelineSchema = createInsertSchema(encryptionPipeline).omit({
  id: true,
  timestamp: true,
});

export const insertSecurityAlertSchema = createInsertSchema(securityAlerts).omit({
  id: true,
  timestamp: true,
});

export const insertKeyEvolutionSchema = createInsertSchema(keyEvolution).omit({
  id: true,
  timestamp: true,
});

export const insertSystemPerformanceSchema = createInsertSchema(systemPerformance).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

export type InsertHealthMetrics = z.infer<typeof insertHealthMetricsSchema>;
export type HealthMetrics = typeof healthMetrics.$inferSelect;

export type InsertEncryptionPipeline = z.infer<typeof insertEncryptionPipelineSchema>;
export type EncryptionPipeline = typeof encryptionPipeline.$inferSelect;

export type InsertSecurityAlert = z.infer<typeof insertSecurityAlertSchema>;
export type SecurityAlert = typeof securityAlerts.$inferSelect;

export type InsertKeyEvolution = z.infer<typeof insertKeyEvolutionSchema>;
export type KeyEvolution = typeof keyEvolution.$inferSelect;

export type InsertSystemPerformance = z.infer<typeof insertSystemPerformanceSchema>;
export type SystemPerformance = typeof systemPerformance.$inferSelect;
