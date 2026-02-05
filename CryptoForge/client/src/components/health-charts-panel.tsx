import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import type { Device, HealthMetrics } from "@shared/schema";

export default function HealthChartsPanel() {
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("24");
  const [activeMetric, setActiveMetric] = useState<"heartRate" | "spO2" | "stepCount">("heartRate");

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { data: historyData = [] } = useQuery<HealthMetrics[]>({
    queryKey: ["/api/health-metrics/history", selectedDevice === "all" ? devices[0]?.id : selectedDevice, timeRange],
    enabled: !!(selectedDevice === "all" ? devices[0]?.id : selectedDevice),
    refetchInterval: 30000,
  });

  // Transform data for charts
  const chartData = historyData.map((metric, index) => ({
    time: new Date(metric.timestamp || 0).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    heartRate: metric.heartRate || 0,
    spO2: metric.spO2 || 0,
    stepCount: metric.stepCount || 0,
    index,
  }));

  // Calculate statistics
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1][activeMetric] : 0;
  const avgValue = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, d) => sum + d[activeMetric], 0) / chartData.length)
    : 0;
  const maxValue = chartData.length > 0 
    ? Math.max(...chartData.map(d => d[activeMetric]))
    : 0;
  const minValue = chartData.length > 0 
    ? Math.min(...chartData.map(d => d[activeMetric]))
    : 0;

  // Detect anomalies (simple threshold-based)
  const getAnomalies = () => {
    if (activeMetric === "heartRate") {
      return chartData.filter(d => d.heartRate > 100 || d.heartRate < 60);
    } else if (activeMetric === "spO2") {
      return chartData.filter(d => d.spO2 < 95);
    }
    return [];
  };

  const anomalies = getAnomalies();
  const latestAnomaly = anomalies.length > 0 ? anomalies[anomalies.length - 1] : null;

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case "heartRate": return "hsl(0, 84%, 60%)"; // Red
      case "spO2": return "hsl(217, 91%, 60%)"; // Blue
      case "stepCount": return "hsl(145, 63%, 49%)"; // Green
      default: return "hsl(191, 100%, 50%)"; // Primary
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "heartRate": return "BPM";
      case "spO2": return "SpO₂ %";
      case "stepCount": return "IR";
      default: return "";
    }
  };

  return (
    <div data-testid="panel-health-charts">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <TrendingUp className="w-5 h-5 text-primary mr-3" />
        Health Data Analysis
      </h2>
      
      <Card className="glass-card">
        <CardContent className="pt-6">
          {/* Chart Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40" data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last Hour</SelectItem>
                  <SelectItem value="6">Last 6 Hours</SelectItem>
                  <SelectItem value="24">Last 24 Hours</SelectItem>
                  <SelectItem value="168">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
              
              {devices.length > 1 && (
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="w-40" data-testid="select-device">
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    {devices.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={activeMetric === "heartRate" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveMetric("heartRate")}
                  data-testid="button-heart-rate"
                >
                  Heart Rate
                </Button>
                <Button
                  variant={activeMetric === "spO2" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveMetric("spO2")}
                  data-testid="button-spo2"
                >
                  SpO₂
                </Button>
                <Button
                  variant={activeMetric === "stepCount" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveMetric("stepCount")}
                  data-testid="button-IR"
                >
                  IR
                </Button>
              </div>
            </div>
            
            {latestAnomaly && (
              <div className="flex items-center space-x-2" data-testid="alert-anomaly">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-muted-foreground">
                  Anomaly detected at {latestAnomaly.time}
                </span>
              </div>
            )}
          </div>
          
          {/* Chart Area */}
          <div className="h-80 w-full" data-testid="chart-health-data">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getMetricColor(activeMetric)} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={getMetricColor(activeMetric)} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 20%)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(215, 20%, 65%)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(215, 20%, 65%)"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(222, 20%, 11%)",
                      border: "1px solid hsl(222, 20%, 20%)",
                      borderRadius: "8px",
                      color: "hsl(210, 40%, 98%)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetric}
                    stroke={getMetricColor(activeMetric)}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No health data available</p>
                  <p className="text-sm">Connect ESP32 devices to see real-time data</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Chart Statistics */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground" data-testid="text-current-value">
                  {currentValue}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current {getMetricLabel(activeMetric)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent" data-testid="text-average-value">
                  {avgValue}
                </div>
                <div className="text-sm text-muted-foreground">
                  Average {getMetricLabel(activeMetric)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive" data-testid="text-peak-value">
                  {maxValue}
                </div>
                <div className="text-sm text-muted-foreground">
                  Peak {getMetricLabel(activeMetric)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400" data-testid="text-min-value">
                  {minValue}
                </div>
                <div className="text-sm text-muted-foreground">
                  Min {getMetricLabel(activeMetric)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
