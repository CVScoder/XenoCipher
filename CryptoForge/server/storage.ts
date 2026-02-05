import { 
  type User, 
  type InsertUser, 
  type Device, 
  type InsertDevice,
  type HealthMetrics,
  type InsertHealthMetrics,
  type EncryptionPipeline,
  type InsertEncryptionPipeline,
  type SecurityAlert,
  type InsertSecurityAlert,
  type KeyEvolution,
  type InsertKeyEvolution,
  type SystemPerformance,
  type InsertSystemPerformance
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Device management
  getDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined>;
  
  // Health metrics
  getLatestHealthMetrics(deviceId?: string): Promise<HealthMetrics[]>;
  getHealthMetricsHistory(deviceId: string, hours: number): Promise<HealthMetrics[]>;
  createHealthMetrics(metrics: InsertHealthMetrics): Promise<HealthMetrics>;
  
  // Encryption pipeline
  getLatestEncryptionPipeline(): Promise<EncryptionPipeline | undefined>;
  createEncryptionPipeline(pipeline: InsertEncryptionPipeline): Promise<EncryptionPipeline>;
  
  // Security alerts
  getSecurityAlerts(limit?: number): Promise<SecurityAlert[]>;
  createSecurityAlert(alert: InsertSecurityAlert): Promise<SecurityAlert>;
  resolveSecurityAlert(id: string): Promise<SecurityAlert | undefined>;
  
  // Key evolution
  getKeyEvolutionHistory(limit?: number): Promise<KeyEvolution[]>;
  createKeyEvolution(evolution: InsertKeyEvolution): Promise<KeyEvolution>;
  
  // System performance
  getLatestSystemPerformance(): Promise<SystemPerformance | undefined>;
  createSystemPerformance(performance: InsertSystemPerformance): Promise<SystemPerformance>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private devices: Map<string, Device>;
  private healthMetrics: HealthMetrics[];
  private encryptionPipeline: EncryptionPipeline[];
  private securityAlerts: SecurityAlert[];
  private keyEvolution: KeyEvolution[];
  private systemPerformance: SystemPerformance[];

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.healthMetrics = [];
    this.encryptionPipeline = [];
    this.securityAlerts = [];
    this.keyEvolution = [];
    this.systemPerformance = [];
    
    // Initialize with some devices
    this.initializeData();
  }

  private initializeData() {
    const device1: Device = {
      id: randomUUID(),
      name: "ESP32-Node1",
      macAddress: "24:6F:28:AE:B2:C4",
      status: "online",
      batteryLevel: 78,
      signalStrength: -67,
      uptime: 15780, // 4h 23m
      packetsSent: 1247,
      packetLoss: 0.2,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    const device2: Device = {
      id: randomUUID(),
      name: "ESP32-Node2",
      macAddress: "30:AE:A4:15:C8:DC",
      status: "warning",
      batteryLevel: 23,
      signalStrength: -84,
      uptime: 8100, // 2h 15m
      packetsSent: 743,
      packetLoss: 3.2,
      lastActivity: new Date(Date.now() - 15000),
      createdAt: new Date(),
    };

    this.devices.set(device1.id, device1);
    this.devices.set(device2.id, device2);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: string): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = randomUUID();
    const device: Device = { 
      name: insertDevice.name,
      macAddress: insertDevice.macAddress,
      status: insertDevice.status || "offline",
      batteryLevel: insertDevice.batteryLevel || 0,
      signalStrength: insertDevice.signalStrength || 0,
      uptime: insertDevice.uptime || 0,
      packetsSent: insertDevice.packetsSent || 0,
      packetLoss: insertDevice.packetLoss || 0.0,
      id, 
      createdAt: new Date(),
      lastActivity: insertDevice.lastActivity || new Date()
    };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...updates };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async getLatestHealthMetrics(deviceId?: string): Promise<HealthMetrics[]> {
    let metrics = this.healthMetrics;
    if (deviceId) {
      metrics = metrics.filter(m => m.deviceId === deviceId);
    }
    return metrics.slice(-10).reverse(); // Latest 10 entries
  }

  async getHealthMetricsHistory(deviceId: string, hours: number): Promise<HealthMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.healthMetrics
      .filter(m => m.deviceId === deviceId && m.timestamp && m.timestamp >= cutoff)
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async createHealthMetrics(insertMetrics: InsertHealthMetrics): Promise<HealthMetrics> {
    const id = randomUUID();
    const metrics: HealthMetrics = { 
      deviceId: insertMetrics.deviceId,
      heartRate: insertMetrics.heartRate || null,
      spO2: insertMetrics.spO2 || null,
      stepCount: insertMetrics.stepCount || null,
      id, 
      timestamp: new Date()
    };
    this.healthMetrics.push(metrics);
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.healthMetrics.length > 1000) {
      this.healthMetrics = this.healthMetrics.slice(-1000);
    }
    
    return metrics;
  }

  async getLatestEncryptionPipeline(): Promise<EncryptionPipeline | undefined> {
    return this.encryptionPipeline[this.encryptionPipeline.length - 1];
  }

  async createEncryptionPipeline(insertPipeline: InsertEncryptionPipeline): Promise<EncryptionPipeline> {
    const id = randomUUID();
    const pipeline: EncryptionPipeline = { 
      lfsrStatus: insertPipeline.lfsrStatus || "active",
      lfsrSeed: insertPipeline.lfsrSeed,
      lfsrBitsGenerated: insertPipeline.lfsrBitsGenerated || null,
      tinkerbellStatus: insertPipeline.tinkerbellStatus || "active",
      tinkerbellParams: insertPipeline.tinkerbellParams,
      transpositionStatus: insertPipeline.transpositionStatus || "active",
      transpositionGrid: insertPipeline.transpositionGrid,
      transpositionOps: insertPipeline.transpositionOps || null,
      hmacStatus: insertPipeline.hmacStatus || "active",
      encryptionTime: insertPipeline.encryptionTime || null,
      cpuUsage: insertPipeline.cpuUsage || null,
      memoryUsage: insertPipeline.memoryUsage || null,
      throughput: insertPipeline.throughput || null,
      id, 
      timestamp: new Date()
    };
    this.encryptionPipeline.push(pipeline);
    
    // Keep only last 100 entries
    if (this.encryptionPipeline.length > 100) {
      this.encryptionPipeline = this.encryptionPipeline.slice(-100);
    }
    
    return pipeline;
  }

  async getSecurityAlerts(limit: number = 50): Promise<SecurityAlert[]> {
    return this.securityAlerts
      .slice(-limit)
      .reverse();
  }

  async createSecurityAlert(insertAlert: InsertSecurityAlert): Promise<SecurityAlert> {
    const id = randomUUID();
    const alert: SecurityAlert = { 
      type: insertAlert.type,
      severity: insertAlert.severity,
      title: insertAlert.title,
      description: insertAlert.description,
      deviceId: insertAlert.deviceId || null,
      resolved: insertAlert.resolved || false,
      id, 
      timestamp: new Date()
    };
    this.securityAlerts.push(alert);
    
    // Keep only last 200 entries
    if (this.securityAlerts.length > 200) {
      this.securityAlerts = this.securityAlerts.slice(-200);
    }
    
    return alert;
  }

  async resolveSecurityAlert(id: string): Promise<SecurityAlert | undefined> {
    const alert = this.securityAlerts.find(a => a.id === id);
    if (alert) {
      alert.resolved = true;
    }
    return alert;
  }

  async getKeyEvolutionHistory(limit: number = 20): Promise<KeyEvolution[]> {
    return this.keyEvolution
      .slice(-limit)
      .reverse();
  }

  async createKeyEvolution(insertEvolution: InsertKeyEvolution): Promise<KeyEvolution> {
    const id = randomUUID();
    const evolution: KeyEvolution = { 
      ...insertEvolution, 
      id, 
      timestamp: new Date()
    };
    this.keyEvolution.push(evolution);
    
    // Keep only last 100 entries
    if (this.keyEvolution.length > 100) {
      this.keyEvolution = this.keyEvolution.slice(-100);
    }
    
    return evolution;
  }

  async getLatestSystemPerformance(): Promise<SystemPerformance | undefined> {
    return this.systemPerformance[this.systemPerformance.length - 1];
  }

  async createSystemPerformance(insertPerformance: InsertSystemPerformance): Promise<SystemPerformance> {
    const id = randomUUID();
    const performance: SystemPerformance = { 
      ...insertPerformance, 
      id, 
      timestamp: new Date()
    };
    this.systemPerformance.push(performance);
    
    // Keep only last 100 entries
    if (this.systemPerformance.length > 100) {
      this.systemPerformance = this.systemPerformance.slice(-100);
    }
    
    return performance;
  }
}

export const storage = new MemStorage();
