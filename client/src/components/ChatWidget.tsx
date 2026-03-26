import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Minimize2, Maximize2, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessagingPanel } from "./MessagingPanel";
import { formatDistanceToNow } from "date-fns";

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  // Only show if user is logged in as candidate or agency
  if (!user || (user.type !== "candidate" && user.type !== "agency")) {
    return null;
  }

  // Fetch conversations based on user type
  const candidateQuery = trpc.messaging.getCandidateConversations.useQuery(
    undefined,
    { 
      enabled: user?.type === "candidate" && isOpen,
      refetchInterval: 10000,
      staleTime: 5000,
    }
  );

  const agencyQuery = trpc.messaging.getAgencyConversations.useQuery(
    undefined,
    { 
      enabled: user?.type === "agency" && isOpen,
      refetchInterval: 10000,
      staleTime: 5000,
    }
  );

  const conversations = (user?.type === "candidate" ? candidateQuery.data : agencyQuery.data) ?? [];
  const isLoading = user?.type === "candidate" ? candidateQuery.isLoading : agencyQuery.isLoading;

  // Get total unread count
  const unreadQuery = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    { 
      enabled: !!user,
      refetchInterval: 30000,
      staleTime: 10000,
    }
  );
  const unreadData = unreadQuery.data;

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-110"
        >
          <MessageCircle className="h-7 w-7 text-primary-foreground" />
          {unreadData?.unreadCount ? (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-background">
              {unreadData.unreadCount > 9 ? '9+' : unreadData.unreadCount}
            </span>
          ) : null}
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? 'h-14 w-64' : 'h-[500px] w-[380px]'}`}>
      <Card className="h-full flex flex-col shadow-2xl border-primary/20 overflow-hidden bg-background">
        {/* Header */}
        <div className="p-3 bg-primary text-primary-foreground flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold text-sm">Messages</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversationId ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-2 border-b flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    ← Back
                  </Button>
                  <span className="font-medium text-xs truncate">
                    {user.type === "candidate" ? "Agency Chat" : "Candidate Chat"}
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  <MessagingPanel 
                    conversationId={selectedConversationId} 
                    otherUserName={user.type === "candidate" ? "Agency" : "Candidate"}
                  />
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-2">
                {isLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {user.type === "candidate" ? "Agency" : "Candidate"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate line-clamp-1">
                          Click to open conversation
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
