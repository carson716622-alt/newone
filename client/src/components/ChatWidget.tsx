import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Minimize2, Maximize2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessagingPanel } from "./MessagingPanel";
import { formatDistanceToNow } from "date-fns";

export function ChatWidget() {
  const { user, session } = useAuth();
  const currentUser = useMemo(() => user || session, [user, session]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  // 1. Unread count query (Global for widget icon)
  const unreadQuery = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    { 
      enabled: !!currentUser,
      refetchInterval: 60000, // 1 minute is plenty for unread count
      staleTime: 30000,
      retry: false
    }
  );

  // 2. Candidate Conversations Query
  const candidateQuery = trpc.messaging.getCandidateConversations.useQuery(
    undefined,
    { 
      enabled: currentUser?.type === "candidate" && isOpen,
      refetchInterval: 15000, 
      staleTime: 10000,
      retry: false
    }
  );

  // 3. Agency Conversations Query
  const agencyQuery = trpc.messaging.getAgencyConversations.useQuery(
    undefined,
    { 
      enabled: currentUser?.type === "agency" && isOpen,
      refetchInterval: 15000,
      staleTime: 10000,
      retry: false
    }
  );

  // Derived state to avoid recalculating on every render
  const conversations = useMemo(() => {
    if (currentUser?.type === "candidate") return candidateQuery.data ?? [];
    if (currentUser?.type === "agency") return agencyQuery.data ?? [];
    return [];
  }, [currentUser?.type, candidateQuery.data, agencyQuery.data]);

  const isLoading = currentUser?.type === "candidate" ? candidateQuery.isLoading : agencyQuery.isLoading;

  // Early return if no user
  if (!currentUser || (currentUser.type !== "candidate" && currentUser.type !== "agency")) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
  };

  // Render the collapsed bubble
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={toggleChat}
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-110 active:scale-95"
        >
          <MessageCircle className="h-7 w-7 text-primary-foreground" />
          {unreadQuery.data?.unreadCount ? (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
              {unreadQuery.data.unreadCount > 9 ? '9+' : unreadQuery.data.unreadCount}
            </span>
          ) : null}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 ease-in-out ${
        isMinimized ? 'h-14 w-64' : 'h-[550px] w-[400px]'
      }`}
    >
      <Card className="h-full flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-primary/20 overflow-hidden bg-background">
        {/* Header - Always visible */}
        <div className="p-3 bg-primary text-primary-foreground flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <div className="relative">
              <MessageCircle className="h-5 w-5" />
              {unreadQuery.data?.unreadCount && isMinimized ? (
                <div className="absolute -top-2 -right-2 h-3 w-3 bg-red-500 rounded-full border border-primary" />
              ) : null}
            </div>
            <span className="font-bold text-sm tracking-tight">Messages</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-white/20"
              onClick={() => setIsMinimized(prev => !prev)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-white/20"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content - Hidden when minimized */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            {selectedConversationId ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-2 border-b bg-background flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    ← Back
                  </Button>
                  <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                    Chat with {currentUser.type === "candidate" ? "Agency" : "Candidate"}
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  <MessagingPanel 
                    conversationId={selectedConversationId} 
                    otherUserName={currentUser.type === "candidate" ? "Agency" : "Candidate"}
                  />
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-3">
                {isLoading ? (
                  <div className="flex flex-col justify-center items-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    <p className="text-xs text-muted-foreground font-medium">Loading conversations...</p>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-20 px-6">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h4 className="text-sm font-semibold mb-1">No Messages Yet</h4>
                    <p className="text-xs text-muted-foreground">
                      {currentUser.type === "candidate" 
                        ? "Apply to jobs to start conversations with agencies." 
                        : "Start a conversation from an application."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className="w-full text-left p-4 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                            {currentUser.type === "candidate" ? "Agency" : "Candidate"}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate pr-4">
                          Click to view full conversation history
                        </p>
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
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
