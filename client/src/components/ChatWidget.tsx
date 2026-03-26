import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Minimize2, Maximize2, Loader2, MessageSquarePlus, ChevronLeft, Building2, User2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessagingPanel } from "./MessagingPanel";
import { NewConversationDialog } from "./NewConversationDialog";
import { formatDistanceToNow } from "date-fns";

export function ChatWidget() {
  const { user, session } = useAuth();
  const currentUser = useMemo(() => user || session, [user, session]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [isStartingNew, setIsStartingNew] = useState(false);
  const [newChatAgency, setNewChatAgency] = useState<{ id: number; name: string } | null>(null);

  // 1. Unread count query
  const unreadQuery = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    { 
      enabled: !!currentUser,
      refetchInterval: 30000,
      staleTime: 15000,
    }
  );

  // 2. Candidate Conversations Query
  const candidateQuery = trpc.messaging.getCandidateConversations.useQuery(
    undefined,
    { 
      enabled: currentUser?.type === "candidate" && isOpen,
      refetchInterval: 15000, 
      staleTime: 10000,
    }
  );

  // 3. Agency Conversations Query
  const agencyQuery = trpc.messaging.getAgencyConversations.useQuery(
    undefined,
    { 
      enabled: currentUser?.type === "agency" && isOpen,
      refetchInterval: 15000,
      staleTime: 10000,
    }
  );

  // Start conversation mutation
  const startConversationMutation = trpc.messaging.startConversation.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.conversationId);
      setIsStartingNew(false);
      setNewChatAgency(null);
      if (currentUser?.type === "candidate") candidateQuery.refetch();
      else agencyQuery.refetch();
    }
  });

  const conversations = useMemo(() => {
    if (currentUser?.type === "candidate") return candidateQuery.data ?? [];
    if (currentUser?.type === "agency") return agencyQuery.data ?? [];
    return [];
  }, [currentUser?.type, candidateQuery.data, agencyQuery.data]);

  const isLoading = currentUser?.type === "candidate" ? candidateQuery.isLoading : agencyQuery.isLoading;

  if (!currentUser || (currentUser.type !== "candidate" && currentUser.type !== "agency")) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
    setIsStartingNew(false);
    setNewChatAgency(null);
  };

  const handleStartNew = async (agencyId: number, agencyName: string) => {
    try {
      await startConversationMutation.mutateAsync({ agencyId });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={toggleChat}
          size="icon"
          className="h-16 w-16 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-primary hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 border-2 border-white/20"
        >
          <MessageCircle className="h-8 w-8 text-primary-foreground" />
          {unreadQuery.data?.unreadCount ? (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-background animate-bounce shadow-lg">
              {unreadQuery.data.unreadCount > 9 ? '9+' : unreadQuery.data.unreadCount}
            </span>
          ) : null}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isMinimized ? 'h-14 w-72' : 'h-[600px] w-[420px]'
      }`}
    >
      <Card className="h-full flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border-white/10 overflow-hidden bg-background/95 backdrop-blur-sm">
        {/* Modern Header */}
        <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-none">ApplytoBlue Messenger</span>
              <span className="text-[10px] text-white/70 font-medium uppercase tracking-widest mt-1 block">Live Support</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/10 rounded-full"
              onClick={() => setIsMinimized(prev => !prev)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/10 rounded-full"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            {selectedConversationId ? (
              /* Chat View */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b bg-background flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {currentUser.type === "candidate" ? <Building2 className="h-4 w-4 text-primary" /> : <User2 className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-none">
                        {currentUser.type === "candidate" ? "Department Admin" : "Candidate Chat"}
                      </p>
                      <p className="text-[10px] text-green-500 font-bold uppercase mt-1">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0 bg-background">
                  <MessagingPanel 
                    conversationId={selectedConversationId} 
                    otherUserName={currentUser.type === "candidate" ? "Department" : "Candidate"}
                  />
                </div>
              </div>
            ) : isStartingNew ? (
              /* New Conversation Selection */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b bg-background flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => setIsStartingNew(false)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="font-bold text-xs uppercase tracking-wider">New Message</span>
                </div>
                <div className="flex-1 min-h-0">
                  <NewConversationDialog onSelect={handleStartNew} />
                </div>
              </div>
            ) : (
              /* Conversation List View */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 bg-white/50 border-b flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Recent Chats</h3>
                  {currentUser.type === "candidate" && (
                    <Button 
                      size="sm" 
                      className="h-8 gap-2 rounded-full px-4 text-[11px] font-bold"
                      onClick={() => setIsStartingNew(true)}
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      ASK A QUESTION
                    </Button>
                  )}
                </div>
                
                <ScrollArea className="flex-1 p-3">
                  {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-20 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                      <p className="text-xs text-muted-foreground font-medium">Updating Inbox...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-20 px-8">
                      <div className="bg-white shadow-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <MessageCircle className="h-10 w-10 text-primary/20" />
                      </div>
                      <h4 className="text-base font-bold text-foreground mb-2">No conversations yet</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentUser.type === "candidate" 
                          ? "Have a question for a department? Start a new chat to connect with hiring managers directly." 
                          : "You'll see messages here once candidates reach out or apply to your jobs."}
                      </p>
                      {currentUser.type === "candidate" && (
                        <Button 
                          variant="outline" 
                          className="mt-6 border-primary/20 text-primary hover:bg-primary/5 rounded-full font-bold text-xs"
                          onClick={() => setIsStartingNew(true)}
                        >
                          Message a Department
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversationId(conv.id)}
                          className="w-full text-left p-4 rounded-2xl bg-white border border-border/40 hover:border-primary/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              {currentUser.type === "candidate" ? <Building2 className="h-5 w-5 text-slate-400 group-hover:text-primary" /> : <User2 className="h-5 w-5 text-slate-400 group-hover:text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5">
                                <span className="font-bold text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
                                  {currentUser.type === "candidate" ? "Department Admin" : "Candidate Chat"}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                  {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate leading-none">
                                View message history
                              </p>
                            </div>
                          </div>
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
