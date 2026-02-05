import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, TriangleAlert } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SecurityAlert } from "@shared/schema";

export default function SecurityAlertsPanel() {
  const queryClient = useQueryClient();
  
  const { data: alerts = [] } = useQuery<SecurityAlert[]>({
    queryKey: ["/api/security-alerts"],
    refetchInterval: 10000,
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest("PATCH", `/api/security-alerts/${alertId}/resolve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-alerts"] });
    },
  });

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === "error") {
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    } else if (severity === "warning") {
      return <TriangleAlert className="w-4 h-4 text-yellow-400" />;
    } else if (type === "security" || type === "encryption") {
      return <CheckCircle className="w-4 h-4 text-accent" />;
    } else {
      return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "error": return "border-destructive/20 bg-destructive/10";
      case "warning": return "border-yellow-400/20 bg-yellow-400/10";
      case "info": return "border-primary/20 bg-primary/10";
      default: return "border-accent/20 bg-accent/10";
    }
  };

  const getAlertTextColor = (severity: string) => {
    switch (severity) {
      case "error": return "text-destructive";
      case "warning": return "text-yellow-400";
      case "info": return "text-primary";
      default: return "text-accent";
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "health": return "bg-red-400/20 text-red-400";
      case "security": return "bg-accent/20 text-accent";
      case "network": return "bg-yellow-400/20 text-yellow-400";
      case "encryption": return "bg-primary/20 text-primary";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);

  return (
    <div data-testid="panel-security-alerts">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <AlertTriangle className="w-5 h-5 text-destructive mr-3" />
        Security Alerts & Events
      </h2>
      
      <Card className="glass-card">
        <CardContent className="p-6">
          {unresolvedAlerts.length > 0 ? (
            <div className="space-y-4">
              {unresolvedAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start space-x-4 p-4 border rounded-lg ${getAlertColor(alert.severity)}`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="w-8 h-8 bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${getAlertTextColor(alert.severity)}`}>
                        {alert.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(alert.timestamp!)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getBadgeColor(alert.type)}`}>
                          {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                        </span>
                        {alert.deviceId && (
                          <span className="text-xs text-muted-foreground">Device ID: {alert.deviceId}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={resolveAlertMutation.isPending}
                        data-testid={`button-resolve-${alert.id}`}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active security alerts</p>
                <p className="text-sm">All systems operating normally</p>
              </div>
            </div>
          )}
          
          {alerts.length > 4 && (
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                className="w-full text-primary hover:text-primary/80"
                data-testid="button-view-all-alerts"
              >
                View All Alerts ({alerts.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
