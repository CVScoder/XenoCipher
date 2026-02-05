import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Key, Play, Circle } from "lucide-react";
import type { KeyEvolution } from "@shared/schema";

export default function KeyEvolutionPanel() {
  const { data: keyEvolution = [] } = useQuery<KeyEvolution[]>({
    queryKey: ["/api/key-evolution"],
    refetchInterval: 10000,
  });

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "cycle": return "bg-accent/20 text-accent";
      case "reseed": return "bg-blue-400/20 text-blue-400";
      case "update": return "bg-yellow-400/20 text-yellow-400";
      case "exchange": return "bg-red-400/20 text-red-400";
      default: return "bg-muted/20 text-muted-foreground";
    }
  };

  const getEventDotColor = (eventType: string) => {
    switch (eventType) {
      case "cycle": return "bg-accent";
      case "reseed": return "bg-blue-400";
      case "update": return "bg-yellow-400";
      case "exchange": return "bg-red-400";
      default: return "bg-muted-foreground";
    }
  };

  const currentSession = keyEvolution.length > 0 ? keyEvolution[0].sessionId : "1247";

  return (
    <div data-testid="panel-key-evolution">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Key className="w-5 h-5 text-primary mr-3" />
        Dynamic Key Evolution
      </h2>
      
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Current Session */}
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-primary">Current Session</div>
                  <div className="text-sm text-muted-foreground">Key Generation Active</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground" data-testid="text-session-id">
                  Session #{currentSession}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
            
            {/* Evolution Events */}
            <div className="space-y-3">
              {keyEvolution.length > 0 ? (
                keyEvolution.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3" data-testid={`evolution-${event.id}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getEventColor(event.eventType)}`}>
                      <div className={`w-2 h-2 rounded-full ${getEventDotColor(event.eventType)}`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {event.eventType.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(event.timestamp!)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                // Default events when no data available
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Key Evolution Cycle</span>
                        <span className="text-xs text-muted-foreground">13:30:05</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Chaotic map parameters updated</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">LFSR Reseed</span>
                        <span className="text-xs text-muted-foreground">13:15:22</span>
                      </div>
                      <div className="text-sm text-muted-foreground">New polynomial coefficients applied</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Transposition Update</span>
                        <span className="text-xs text-muted-foreground">13:00:18</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Grid permutation sequence evolved</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-400/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">NTRU Key Exchange</span>
                        <span className="text-xs text-muted-foreground">12:45:33</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Master key rotation completed</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Evolution Statistics */}
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-total-evolutions">
                    {keyEvolution.length || 147}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Evolutions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">15m</div>
                  <div className="text-sm text-muted-foreground">Evolution Interval</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
