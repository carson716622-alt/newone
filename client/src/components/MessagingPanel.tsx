import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User2, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

interface MessagingPanelProps {
  conversationId: number;
  otherUserName: string;
  otherUserAvatar?: string;
}

export function MessagingPanel({
  conversationId,
  otherUserName,
  otherUserAvatar,
}: MessagingPanelProps) {
  const { user, session } = useAuth();
  const currentUser = user || session;
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messages = [], refetch: refetchMessages, isLoading: messagesLoading } = trpc.messaging.getMessages.useQuery(
    { conversationId },
    { refetchInterval: 3000 }
  );

  // Send message mutation
  const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId,
        content: messageInput.trim(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        <div className="space-y-6">
          {messagesLoading ? (
            <div className="flex flex-col justify-center items-center h-full py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
              <p className="text-xs text-muted-foreground font-medium">Loading history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 px-10">
              <div className="bg-white shadow-sm w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-primary/10" />
              </div>
              <p className="text-sm font-bold text-foreground">Start the conversation</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Send a message to introduce yourself or ask a question.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg, index) => {
                const isMe = msg.senderType === currentUser?.type;
                const showAvatar = index === 0 || messages[index-1].senderType !== msg.senderType;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${showAvatar ? 'bg-slate-200' : 'opacity-0'}`}>
                      {isMe ? <User2 className="h-3.5 w-3.5 text-slate-500" /> : <Building2 className="h-3.5 w-3.5 text-slate-500" />}
                    </div>
                    
                    {/* Bubble */}
                    <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                        }`}
                      >
                        <p className="break-words leading-relaxed">{msg.content}</p>
                      </div>
                      {showAvatar && (
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1 px-1">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div ref={scrollRef} className="h-2" />
      </ScrollArea>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          <Input
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm h-10 px-3"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !messageInput.trim()}
            size="icon"
            className={`h-10 w-10 rounded-xl transition-all shadow-md ${
              messageInput.trim() ? 'bg-primary hover:bg-primary/90 scale-100' : 'bg-slate-200 text-slate-400 scale-95'
            }`}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground mt-3 font-medium uppercase tracking-widest opacity-50">
          Encrypted & Secure Communication
        </p>
      </div>
    </div>
  );
}
