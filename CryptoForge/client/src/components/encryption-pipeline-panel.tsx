import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Settings, Waves, Shuffle, CheckCircle, Gauge } from "lucide-react";
import type { EncryptionPipeline } from "@shared/schema";

export default function EncryptionPipelinePanel() {
  const { data: pipeline } = useQuery<EncryptionPipeline>({
    queryKey: ["/api/encryption-pipeline"],
    refetchInterval: 5000,
  });

  const formatParams = (params: any) => {
    if (!params) return "N/A";
    if (typeof params === 'object') {
      return Object.entries(params).map(([key, value]) => `${key}=${value}`).join(', ');
    }
    return String(params);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-accent";
      case "warning": return "text-yellow-400";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "active": return "bg-accent/20";
      case "warning": return "bg-yellow-400/20";
      case "error": return "bg-destructive/20";
      default: return "bg-muted/20";
    }
  };

  return (
    <div data-testid="panel-encryption-pipeline">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Lock className="w-5 h-5 text-primary mr-3" />
        XenoCipher Pipeline
      </h2>
      
      <div className="space-y-4">
        {/* Pipeline Stage Cards */}
        <Card className="glass-card" data-testid="card-lfsr">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">LFSR Stream</span>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${getStatusBg(pipeline?.lfsrStatus || "active")} ${getStatusColor(pipeline?.lfsrStatus || "active")}`}>
                {pipeline?.lfsrStatus || "Active"}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">16-bit Linear Feedback Shift Register</div>
            <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
              <div className="encryption-flow h-full"></div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Seed: {pipeline?.lfsrSeed || "0xACE1"} | {pipeline?.lfsrBitsGenerated || 96} bits generated
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="card-tinkerbell">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Waves className="w-4 h-4 text-accent" />
                </div>
                <span className="font-medium">Tinkerbell Map</span>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${getStatusBg(pipeline?.tinkerbellStatus || "active")} ${getStatusColor(pipeline?.tinkerbellStatus || "active")}`}>
                {pipeline?.tinkerbellStatus || "Active"}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">Chaotic Nonlinear Transformation</div>
            <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
              <div className="encryption-flow h-full" style={{ animationDelay: "0.5s" }}></div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Parameters: {formatParams(pipeline?.tinkerbellParams) || "a=-0.7, b=-0.6, c=2.0, d=0.9"}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="card-transposition">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center">
                  <Shuffle className="w-4 h-4 text-blue-400" />
                </div>
                <span className="font-medium">Transposition</span>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${getStatusBg(pipeline?.transpositionStatus || "active")} ${getStatusColor(pipeline?.transpositionStatus || "active")}`}>
                {pipeline?.transpositionStatus || "Active"}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">Advanced Grid Permutation</div>
            <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
              <div className="encryption-flow h-full" style={{ animationDelay: "1s" }}></div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Grid: {pipeline?.transpositionGrid || "4×3"} | {pipeline?.transpositionOps || 6} swap operations
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card" data-testid="card-hmac">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-400/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-red-400" />
                </div>
                <span className="font-medium">HMAC</span>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full ${getStatusBg(pipeline?.hmacStatus || "active")} ${getStatusColor(pipeline?.hmacStatus || "active")}`}>
                {pipeline?.hmacStatus || "Active"}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mb-2">SHA-256 Message Authentication</div>
            <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
              <div className="encryption-flow h-full" style={{ animationDelay: "1.5s" }}></div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">8-byte truncated MAC</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pipeline Performance */}
      <Card className="glass-card mt-6" data-testid="card-performance">
        <CardContent className="p-4">
          <h3 className="font-medium mb-4 flex items-center">
            <Gauge className="w-4 h-4 text-primary mr-2" />
            Performance Metrics
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Encryption Time</span>
              <span className="text-sm text-foreground" data-testid="text-encryption-time">
                {pipeline?.encryptionTime?.toFixed(1) || "2.3"}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CPU Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-muted/20 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${pipeline?.cpuUsage || 35}%` }}
                  />
                </div>
                <span className="text-xs text-foreground">{pipeline?.cpuUsage || 35}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Memory Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-muted/20 rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${pipeline?.memoryUsage || 42}%` }}
                  />
                </div>
                <span className="text-xs text-foreground">{pipeline?.memoryUsage || 42}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Throughput</span>
              <span className="text-sm text-foreground" data-testid="text-throughput">
                {pipeline?.throughput || 156} msgs/sec
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
