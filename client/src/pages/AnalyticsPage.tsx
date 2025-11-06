import { useEffect, useState } from "react";
import { conversationAPI } from "../api/client";
import { Card } from "../components/ui/card";
import { Loader2, MessageSquare, TrendingUp, Activity } from "lucide-react";
import AppLayout from "../components/AppLayout";

interface AnalyticsPageProps {
  onLogout?: () => void;
}

interface AnalyticsData {
  total_conversations: number;
  total_messages: number;
  active_conversations: number;
  ended_conversations: number;
  archived_conversations: number;
  avg_messages_per_conversation: number;
  conversations_last_7_days: number;
  conversations_last_30_days: number;
  messages_last_7_days: number;
  bookmarked_messages_count: number;
  user_message_count: number;
  ai_message_count: number;
  conversations_with_summaries: number;
  conversations_by_date: Array<{ date: string; count: number }>;
}

export default function AnalyticsPage({ onLogout }: AnalyticsPageProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await conversationAPI.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout onLogout={onLogout}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onLogout={onLogout}>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 border-border/50 hover:border-border transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg ">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Conversations</p>
                  <p className="text-2xl font-semibold">{analytics?.total_conversations || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 hover:border-border transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg ">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Messages</p>
                  <p className="text-2xl font-semibold">{analytics?.total_messages || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 hover:border-border transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg ">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Active</p>
                  <p className="text-2xl font-semibold">{analytics?.active_conversations || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 hover:border-border transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg ">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Messages</p>
                  <p className="text-2xl font-semibold">
                    {analytics?.avg_messages_per_conversation || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Last 7 Days</p>
              <p className="text-3xl font-semibold mb-1">{analytics?.conversations_last_7_days || 0}</p>
              <p className="text-xs text-muted-foreground">conversations</p>
            </Card>

            <Card className="p-6 border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Last 30 Days</p>
              <p className="text-3xl font-semibold mb-1">{analytics?.conversations_last_30_days || 0}</p>
              <p className="text-xs text-muted-foreground">conversations</p>
            </Card>

            <Card className="p-6 border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Bookmarked</p>
              <p className="text-3xl font-semibold mb-1">{analytics?.bookmarked_messages_count || 0}</p>
              <p className="text-xs text-muted-foreground">messages</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="p-6 border-border/50">
              <h3 className="text-sm font-semibold mb-4">Message Distribution</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">User Messages</span>
                    <span className="text-sm font-medium">{analytics?.user_message_count || 0}</span>
                  </div>
                  <div className="h-2  rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-foreground rounded-full" 
                      style={{
                        width: `${((analytics?.user_message_count || 0) / (analytics?.total_messages || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">AI Messages</span>
                    <span className="text-sm font-medium">{analytics?.ai_message_count || 0}</span>
                  </div>
                  <div className="h-2  rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-foreground/70 rounded-full" 
                      style={{
                        width: `${((analytics?.ai_message_count || 0) / (analytics?.total_messages || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50">
              <h3 className="text-sm font-semibold mb-4">Status Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active</span>
                  <span className="text-sm font-medium">{analytics?.active_conversations || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ended</span>
                  <span className="text-sm font-medium">{analytics?.ended_conversations || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Archived</span>
                  <span className="text-sm font-medium">{analytics?.archived_conversations || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">With Summaries</span>
                  <span className="text-sm font-medium">{analytics?.conversations_with_summaries || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 border-border/50">
            <h3 className="text-sm font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-2">
              {analytics?.conversations_by_date.slice(0, 15).map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground w-24">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="h-6  rounded-md relative overflow-hidden">
                      <div
                        className="h-full bg-foreground/80 rounded-md transition-all"
                        style={{
                          width: `${Math.min(
                            (item.count / Math.max(...(analytics?.conversations_by_date.map(d => d.count) || [1]))) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-medium w-8 text-right">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
