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
  };

  const handleStartNew = async (agencyId: number) => {
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
          className="h-16 w-16 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-primary hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 border border-white/10"
        >
          <MessageCircle className="h-8 w-8 text-primary-foreground" />
          {unreadQuery.data?.unreadCount ? (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-[#0f172a] animate-bounce shadow-lg">
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
        isMinimized ? 'h-14 w-72' : 'h-[700px] w-[480px]'
      }`}
    >
      <Card className="h-full flex flex-col shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] border-white/5 overflow-hidden bg-[#0f172a]/95 backdrop-blur-xl">
        {/* Dark Header */}
        <div className="p-5 bg-[#1e293b] text-white flex items-center justify-between shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block leading-none">ApplytoBlue Messenger</span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-none">Live & Secure</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/70 hover:bg-white/5 rounded-lg"
              onClick={() => setIsMinimized(prev => !prev)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/70 hover:bg-white/5 rounded-lg"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0f172a]">
            {selectedConversationId ? (
              /* Chat View */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-white/5 bg-[#1e293b]/50 flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full hover:bg-white/5 text-white/70"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                      {currentUser.type === "candidate" ? <Building2 className="h-5 w-5 text-primary" /> : <User2 className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white leading-none">
                        {currentUser.type === "candidate" ? "Department Admin" : "Candidate Chat"}
                      </p>
                      <p className="text-[10px] text-green-500 font-bold uppercase mt-1 tracking-wider">Active Now</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <MessagingPanel 
                    conversationId={selectedConversationId} 
                    otherUserName={currentUser.type === "candidate" ? "Department" : "Candidate"}
                  />
                </div>
              </div>
            ) : isStartingNew ? (
              /* New Conversation Selection (Showing Full List) */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b border-white/5 bg-[#1e293b]/50 flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full hover:bg-white/5 text-white/70"
                    onClick={() => setIsStartingNew(false)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="font-bold text-xs uppercase tracking-widest text-white/70">Select a Department</span>
                </div>
                <div className="flex-1 min-h-0">
                  <NewConversationDialog onSelect={handleStartNew} />
                </div>
              </div>
            ) : (
              /* Main Menu (Showing Message History) */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-5 bg-[#1e293b]/30 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-white/40">Recent Messages</h3>
                  {currentUser.type === "candidate" && (
                    <Button 
                      size="sm" 
                      className="h-9 gap-2 rounded-xl px-5 text-xs font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      onClick={() => setIsStartingNew(true)}
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                      NEW MESSAGE
                    </Button>
                  )}
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                      <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Updating Secure Inbox</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-24 px-10">
                      <div className="bg-[#1e293b] shadow-inner w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5 transform -rotate-3">
                        <MessageCircle className="h-12 w-12 text-primary/30" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-3 tracking-tight">No messages yet</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">
                        {currentUser.type === "candidate" 
                          ? "Have questions for a specific department? Start a direct conversation with hiring managers below." 
                          : "No candidate messages yet. New inquiries will appear here as candidates reach out."}
                      </p>
                      {currentUser.type === "candidate" && (
                        <Button 
                          variant="outline" 
                          className="mt-10 border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-xl font-bold text-xs py-6 px-8 tracking-widest uppercase"
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
                          className="w-full text-left p-5 rounded-[1.5rem] bg-[#1e293b]/40 border border-white/5 hover:border-primary/40 hover:bg-[#1e293b]/60 transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-[#0f172a] flex items-center justify-center group-hover:bg-primary/20 transition-all border border-white/5">
                              {currentUser.type === "candidate" ? <Building2 className="h-6 w-6 text-white/30 group-hover:text-primary" /> : <User2 className="h-6 w-6 text-white/30 group-hover:text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1.5">
                                <span className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate">
                                  {currentUser.type === "candidate" ? "Department Admin" : "Candidate Chat"}
                                </span>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">
                                  {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                </span>
                              </div>
                              <p className="text-xs text-white/40 truncate font-medium group-hover:text-white/60 transition-colors">
                                View full conversation history
                              </p>
                            </div>
                          </div>
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
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
