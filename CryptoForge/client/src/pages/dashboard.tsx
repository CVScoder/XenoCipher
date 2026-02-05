import { useState, useCallback } from "react";
import { useWebSocket, type WebSocketMessage } from "@/hooks/use-websocket";
import HealthDataPanel from "@/components/health-data-panel";
import HealthChartsPanel from "@/components/health-charts-panel";
import EncryptionPipelinePanel from "@/components/encryption-pipeline-panel";
import SecurityAlertsPanel from "@/components/security-alerts-panel";
import DeviceManagementPanel from "@/components/device-management-panel";
import SystemPerformancePanel from "@/components/system-performance-panel";
import KeyEvolutionPanel from "@/components/key-evolution-panel";
import { Button } from "@/components/ui/button";
import { Shield, Wifi, WifiOff } from "lucide-react";

export default function Dashboard() {
  const [encryptionMode, setEncryptionMode] = useState<"normal" | "zero-trust">("normal");
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log("Received WebSocket message:", message);
    setLastSync(new Date());
    
    // Handle different message types here
    switch (message.type) {
      case 'health-metrics':
        // Health metrics update will be handled by the HealthDataPanel component
        break;
      case 'encryption-pipeline':
        // Pipeline update will be handled by the EncryptionPipelinePanel component
        break;
      case 'security-alert':
        // Alert will be handled by the SecurityAlertsPanel component
        break;
      case 'device-update':
        // Device update will be handled by the DeviceManagementPanel component
        break;
      case 'key-evolution':
        // Key evolution will be handled by the KeyEvolutionPanel component
        break;
      case 'system-performance':
        // Performance update will be handled by the SystemPerformancePanel component
        break;
    }
  }, []);

  const { connected } = useWebSocket(handleWebSocketMessage);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">XenoCipher Secure Health Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Encryption Mode Toggle */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">Encryption Mode:</span>
                <div className="flex items-center space-x-2 bg-secondary rounded-lg p-1">
                  <Button
                    variant={encryptionMode === "normal" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setEncryptionMode("normal")}
                    className="px-3 py-1 text-sm"
                    data-testid="button-normal-mode"
                  >
                    Normal Mode
                  </Button>
                  <Button
                    variant={encryptionMode === "zero-trust" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setEncryptionMode("zero-trust")}
                    className="px-3 py-1 text-sm"
                    data-testid="button-zero-trust-mode"
                  >
                    Zero Trust Mode
                  </Button>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {connected ? (
                  <>
                    <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                    <Wifi className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Online</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <WifiOff className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Offline</span>
                  </>
                )}
              </div>
              
              {/* Last Sync */}
              <div className="text-sm text-muted-foreground" data-testid="text-last-sync">
                Last sync: <span className="text-foreground">{formatTimeAgo(lastSync)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Real-Time Health Data Panel */}
        <HealthDataPanel />

        {/* Health Data Analysis & Encryption Pipeline */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <HealthChartsPanel />
          </div>
          <div>
            <EncryptionPipelinePanel />
          </div>
        </div>

        {/* Security Alerts & Device Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SecurityAlertsPanel />
          <DeviceManagementPanel />
        </div>

        {/* System Performance & Key Evolution Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SystemPerformancePanel />
          <KeyEvolutionPanel />
        </div>
      </main>
    </div>
  );
}
