import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Server } from "lucide-react";
import type { SystemPerformance } from "@shared/schema";

export default function SystemPerformancePanel() {
  const { data: performance } = useQuery<SystemPerformance>({
    queryKey: ["/api/system-performance"],
    refetchInterval: 5000,
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const createCircleProgress = (percentage: number, color: string) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          stroke="hsl(222, 20%, 20%)" 
          strokeWidth="8" 
          fill="none"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          stroke={color} 
          strokeWidth="8" 
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    );
  };

  return (
    <div data-testid="panel-system-performance">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Server className="w-5 h-5 text-primary mr-3" />
        System Performance
      </h2>
      
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* CPU Usage Gauge */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                {createCircleProgress(performance?.cpuUsage || 30, "hsl(191, 100%, 50%)")}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground" data-testid="text-cpu-usage">
                    {performance?.cpuUsage || 30}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">CPU Usage</div>
            </div>
            
            {/* Memory Usage Gauge */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                {createCircleProgress(performance?.memoryUsage || 45, "hsl(145, 63%, 49%)")}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground" data-testid="text-memory-usage">
                    {performance?.memoryUsage || 45}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Memory Usage</div>
            </div>
          </div>
          
          <div className="space-y-4 mt-6">
            {/* Server Stats */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Latency</span>
              <span className="text-sm text-foreground" data-testid="text-latency">
                {performance?.averageLatency?.toFixed(0) || "12"}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Connections</span>
              <span className="text-sm text-foreground" data-testid="text-connections">
                {performance?.activeConnections || 2} devices
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Messages/sec</span>
              <span className="text-sm text-foreground" data-testid="text-messages-per-sec">
                {performance?.messagesPerSecond || 156}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encryption Ops/sec</span>
              <span className="text-sm text-foreground" data-testid="text-encryption-ops">
                {performance?.encryptionOpsPerSecond || 432}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Server Uptime</span>
              <span className="text-sm text-foreground" data-testid="text-server-uptime">
                {performance ? formatUptime(performance.serverUptime) : "7d 12h 34m"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
