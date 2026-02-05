import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Circle, CircleAlert, Plus, Battery, Signal } from "lucide-react";
import type { Device } from "@shared/schema";

export default function DeviceManagementPanel() {
  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
    refetchInterval: 5000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <Circle className="w-3 h-3 text-accent fill-current" />;
      case "warning": return <CircleAlert className="w-3 h-3 text-yellow-400 fill-current" />;
      case "error": return <CircleAlert className="w-3 h-3 text-destructive fill-current" />;
      default: return <Circle className="w-3 h-3 text-muted-foreground fill-current" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-accent";
      case "warning": return "text-yellow-400";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "online": return "bg-accent/20";
      case "warning": return "bg-yellow-400/20";
      case "error": return "bg-destructive/20";
      default: return "bg-muted/20";
    }
  };

  const getDeviceIconColor = (status: string) => {
    switch (status) {
      case "online": return "text-accent bg-accent/20";
      case "warning": return "text-yellow-400 bg-yellow-400/20";
      case "error": return "text-destructive bg-destructive/20";
      default: return "text-muted-foreground bg-muted/20";
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
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
          style={{ height: `${8 + i * 2}px` }}
        />
      );
    }
    return bars;
  };

  return (
    <div data-testid="panel-device-management">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Cpu className="w-5 h-5 text-primary mr-3" />
        ESP32 Device Management
      </h2>
      
      <div className="space-y-4">
        {devices.map((device) => (
          <Card key={device.id} className="glass-card" data-testid={`device-${device.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDeviceIconColor(device.status)}`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground" data-testid={`text-device-name-${device.id}`}>
                      {device.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">MAC: {device.macAddress}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${getStatusBg(device.status)} ${getStatusColor(device.status)}`}>
                  {getStatusIcon(device.status)}
                  <span className="capitalize">{device.status}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Battery</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Battery className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 bg-muted/20 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          (device.batteryLevel || 0) > 50 ? 'bg-accent' : 
                          (device.batteryLevel || 0) > 20 ? 'bg-yellow-400' : 'bg-destructive'
                        }`}
                        style={{ width: `${device.batteryLevel || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-foreground" data-testid={`text-battery-${device.id}`}>
                      {device.batteryLevel || 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Signal</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Signal className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-end space-x-1">
                      {getSignalBars(device.signalStrength || 0)}
                    </div>
                    <span className="text-sm text-foreground ml-2" data-testid={`text-signal-${device.id}`}>
                      {device.signalStrength || 0} dBm
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <p className="text-sm text-foreground mt-1" data-testid={`text-uptime-${device.id}`}>
                    {formatUptime(device.uptime || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Packets</span>
                  <p className="text-sm text-foreground mt-1" data-testid={`text-packets-${device.id}`}>
                    {(device.packetsSent || 0).toLocaleString()} sent
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span 
                  className={`text-sm ${device.status === 'warning' ? 'text-yellow-400' : 'text-foreground'}`}
                  data-testid={`text-last-activity-${device.id}`}
                >
                  {formatTimeAgo(device.lastActivity!)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Add Device Button */}
        <Button 
          variant="ghost"
          className="w-full glass-card border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group p-6 h-auto"
          data-testid="button-add-device"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground">Add New Device</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
