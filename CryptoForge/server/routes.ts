import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertHealthMetricsSchema,
  insertEncryptionPipelineSchema,
  insertSecurityAlertSchema,
  insertKeyEvolutionSchema,
  insertSystemPerformanceSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time data streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast data to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // API Routes

  // Get all devices
  app.get("/api/devices", async (req, res) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  });

  // Get latest health metrics
  app.get("/api/health-metrics", async (req, res) => {
    try {
      const deviceId = req.query.deviceId as string;
      const metrics = await storage.getLatestHealthMetrics(deviceId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health metrics" });
    }
  });

  // Get health metrics history
  app.get("/api/health-metrics/history/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;
      const metrics = await storage.getHealthMetricsHistory(deviceId, hours);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health metrics history" });
    }
  });

  // Create health metrics (from ESP32)
  app.post("/api/health-metrics", async (req, res) => {
    try {
      const validatedData = insertHealthMetricsSchema.parse(req.body);
      const metrics = await storage.createHealthMetrics(validatedData);
      
      // Broadcast to WebSocket clients
      broadcast({
        type: 'health-metrics',
        data: metrics
      });
      
      res.json(metrics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create health metrics" });
      }
    }
  });

  // Get latest encryption pipeline status
  app.get("/api/encryption-pipeline", async (req, res) => {
    try {
      const pipeline = await storage.getLatestEncryptionPipeline();
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch encryption pipeline status" });
    }
  });

  // Update encryption pipeline status
  app.post("/api/encryption-pipeline", async (req, res) => {
    try {
      const validatedData = insertEncryptionPipelineSchema.parse(req.body);
      const pipeline = await storage.createEncryptionPipeline(validatedData);
      
      // Broadcast to WebSocket clients
      broadcast({
        type: 'encryption-pipeline',
        data: pipeline
      });
      
      res.json(pipeline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update encryption pipeline" });
      }
    }
  });

  // Get security alerts
  app.get("/api/security-alerts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const alerts = await storage.getSecurityAlerts(limit);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security alerts" });
    }
  });

  // Create security alert
  app.post("/api/security-alerts", async (req, res) => {
    try {
      const validatedData = insertSecurityAlertSchema.parse(req.body);
      const alert = await storage.createSecurityAlert(validatedData);
      
      // Broadcast to WebSocket clients
      broadcast({
        type: 'security-alert',
        data: alert
      });
      
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create security alert" });
      }
    }
  });

  // Resolve security alert
  app.patch("/api/security-alerts/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      const alert = await storage.resolveSecurityAlert(id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve security alert" });
    }
  });

  // Get key evolution history
  app.get("/api/key-evolution", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const evolution = await storage.getKeyEvolutionHistory(limit);
      res.json(evolution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch key evolution history" });
    }
  });

  // Create key evolution event
  app.post("/api/key-evolution", async (req, res) => {
    try {
      const validatedData = insertKeyEvolutionSchema.parse(req.body);
      const evolution = await storage.createKeyEvolution(validatedData);
      
      // Broadcast to WebSocket clients
      broadcast({
        type: 'key-evolution',
        data: evolution
      });
      
      res.json(evolution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create key evolution event" });
      }
    }
  });

  // Get system performance
  app.get("/api/system-performance", async (req, res) => {
    try {
      const performance = await storage.getLatestSystemPerformance();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system performance" });
    }
  });

  // Update system performance
  app.post("/api/system-performance", async (req, res) => {
    try {
      const validatedData = insertSystemPerformanceSchema.parse(req.body);
      const performance = await storage.createSystemPerformance(validatedData);
      
      // Broadcast to WebSocket clients
      broadcast({
        type: 'system-performance',
        data: performance
      });
      
      res.json(performance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update system performance" });
      }
    }
  });

  // Update device status
  app.patch("/api/devices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const device = await storage.updateDevice(id, updates);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      
      // Broadcast to WebSocket clients
      broadcast({
        type: 'device-update',
        data: device
      });
      
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: "Failed to update device" });
    }
  });

  return httpServer;
}
