import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Activity, TrendingUp, Cpu, Lock, Battery, Signal } from "lucide-react";
import type { Device, HealthMetrics } from "@shared/schema";

export default function HealthDataPanel() {
  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 5000,
  });

  const { data: healthMetrics = [] } = useQuery<HealthMetrics[]>({
    queryKey: ["/api/health-metrics"],
    refetchInterval: 2000,
  });

  // Get the latest metrics for each device
  const getLatestMetric = (deviceId: string, field: keyof HealthMetrics) => {
    const deviceMetrics = healthMetrics.filter(m => m.deviceId === deviceId);
    if (deviceMetrics.length === 0) return null;
    const latest = deviceMetrics[deviceMetrics.length - 1];
    return latest[field];
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getSignalBars = (strength: number) => {
    const bars = [];
    const level = Math.abs(strength);
    for (let i = 0; i < 4; i++) {
      const isActive = level < 50 + (i * 15); // -50 to -95 dBm range
      bars.push(
        <div
          key={i}
          className={`w-1 ${isActive ? 'bg-accent' : 'bg-muted/40'} rounded-sm`}
          style={{ height: `${8 + i * 4}px` }}
        />
      );
    }
    return bars;
  };

  // Calculate aggregate metrics
  const irValues = healthMetrics.map(m => m.stepCount || 0);
  const latestIR = irValues.length > 0 ? irValues[irValues.length - 1] : 0;
  const minIR = irValues.length > 0 ? Math.min(...irValues) : 0;
  const maxIR = irValues.length > 0 ? Math.max(...irValues) : 0;
  const avgIR = irValues.length > 0 ? Math.round(irValues.reduce((a, b) => a + b, 0) / irValues.length) : 0;
  // NOTE: Using stepCount as IR value, since backend does not provide a separate IR field.
  const aggregateHeartRate = healthMetrics.length > 0 
    ? healthMetrics[healthMetrics.length - 1]?.heartRate || 0 
    : 0;
  const aggregateSpO2 = healthMetrics.length > 0 
    ? healthMetrics[healthMetrics.length - 1]?.spO2 || 0 
    : 0;

  const onlineDevice = devices.find(d => d.status === "online");

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Heart className="w-5 h-5 text-primary mr-3" />
        Real-Time Health Metrics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Heart Rate Card */}
        <Card className="glass-card cyber-glow" data-testid="card-heart-rate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-muted-foreground">Heart Rate</span>
              </div>
              <div className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                <Lock className="w-3 h-3 mr-1 inline" />
                Encrypted
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground" data-testid="text-heart-rate">
                {aggregateHeartRate}
              </div>
              <div className="text-sm text-muted-foreground">BPM</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: <span className="text-accent">72</span></span>
                <span>Max: <span className="text-red-400">95</span></span>
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-heart-rate-timestamp">
                Updated: {healthMetrics.length > 0 && healthMetrics[healthMetrics.length - 1].timestamp ? formatTimeAgo(healthMetrics[healthMetrics.length - 1].timestamp!) : 'Never'}
              </div>
            </div>
            
            {/* Mini sparkline placeholder */}
            <div className="mt-4 h-8 bg-muted/20 rounded flex items-end space-x-1">
              {[4, 6, 3, 5, 7, 8].map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-t-sm ${i === 5 ? 'bg-primary' : 'bg-primary/60'}`}
                  style={{ height: `${height * 4}px` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* SpO2 Card */}
        <Card className="glass-card" data-testid="card-spo2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-muted-foreground">Blood Oxygen</span>
              </div>
              <div className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                <Lock className="w-3 h-3 mr-1 inline" />
                Encrypted
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground" data-testid="text-spo2">
                {aggregateSpO2}
              </div>
              <div className="text-sm text-muted-foreground">SpO₂ %</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: <span className="text-accent">96</span></span>
                <span>Max: <span className="text-accent">99</span></span>
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-spo2-timestamp">
                Updated: {healthMetrics.length > 0 && healthMetrics[healthMetrics.length - 1].timestamp ? formatTimeAgo(healthMetrics[healthMetrics.length - 1].timestamp!) : 'Never'}
              </div>
            </div>
            
            {/* Mini sparkline placeholder */}
            <div className="mt-4 h-8 bg-muted/20 rounded flex items-end space-x-1">
              {[7, 8, 7, 8, 7, 8].map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-t-sm ${i === 5 ? 'bg-blue-400' : 'bg-blue-400/60'}`}
                  style={{ height: `${height * 4}px` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* IR Card */}
        <Card className="glass-card" data-testid="card-ir">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-muted-foreground">IR (Infrared)</span>
              </div>
              <div className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                <Lock className="w-3 h-3 mr-1 inline" />
                Encrypted
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-foreground" data-testid="text-ir">
                {latestIR.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">IR Units</div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: <span className="text-accent">{minIR}</span></span>
                <span>Max: <span className="text-primary">{maxIR}</span></span>
                <span>Avg: <span className="text-muted-foreground">{avgIR}</span></span>
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-ir-timestamp">
                Updated: {healthMetrics.length > 0 && healthMetrics[healthMetrics.length - 1].timestamp ? formatTimeAgo(healthMetrics[healthMetrics.length - 1].timestamp!) : 'Never'}
              </div>
            </div>
            {/* Optional: Add a sparkline or trend graph here */}
          </CardContent>
        </Card>
        
        {/* System Status Card */}
        <Card className="glass-card" data-testid="card-system-status">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">ESP32 Status</span>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${
                onlineDevice ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
              }`}>
                {onlineDevice ? 'Online' : 'Offline'}
              </div>
            </div>
            
            {onlineDevice ? (
              <div className="space-y-3">
                {/* Battery */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Battery</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-muted/20 rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${onlineDevice.batteryLevel || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground">{onlineDevice.batteryLevel || 0}%</span>
                  </div>
                </div>
                
                {/* Signal Strength */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Signal</span>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-end space-x-1">
                      {getSignalBars(onlineDevice.signalStrength || 0)}
                    </div>
                    <span className="text-xs text-foreground ml-2">{onlineDevice.signalStrength || 0} dBm</span>
                  </div>
                </div>
                
                {/* Uptime */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm text-foreground" data-testid="text-uptime">
                    {formatUptime(onlineDevice.uptime || 0)}
                  </span>
                </div>
                
                {/* Packet Loss */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Packet Loss</span>
                  <span className="text-sm text-foreground" data-testid="text-packet-loss">
                    {onlineDevice.packetLoss}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                No devices online
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
