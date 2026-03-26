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
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-5 bg-[#0f172a]">
        <div className="space-y-8">
          {messagesLoading ? (
            <div className="flex flex-col justify-center items-center h-full py-24 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Loading Conversation</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-24 px-12">
              <div className="bg-[#1e293b] shadow-inner w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                <Send className="h-10 w-10 text-primary/20" />
              </div>
              <p className="text-base font-bold text-white mb-2 tracking-tight">Begin Conversation</p>
              <p className="text-xs text-white/40 leading-relaxed font-medium italic">Your message will be sent directly to the department admin.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg, index) => {
                const isMe = msg.senderType === currentUser?.type;
                const showAvatar = index === 0 || messages[index-1].senderType !== msg.senderType;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/5 bg-[#1e293b] ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      {isMe ? <User2 className="h-4 w-4 text-white/30" /> : <Building2 className="h-4 w-4 text-white/30" />}
                    </div>
                    
                    {/* Bubble */}
                    <div className={`flex flex-col max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-5 py-3.5 rounded-2xl text-sm shadow-xl leading-relaxed ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-none font-medium"
                            : "bg-[#1e293b] text-white/90 border border-white/5 rounded-bl-none font-medium"
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                      </div>
                      {showAvatar && (
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2 px-1">
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
        <div ref={scrollRef} className="h-4" />
      </ScrollArea>

      {/* Input Bar */}
      <div className="p-5 bg-[#1e293b]/50 border-t border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3 bg-[#0f172a] border border-white/5 rounded-2xl p-2 focus-within:border-primary/40 focus-within:ring-8 focus-within:ring-primary/5 transition-all shadow-inner">
          <Input
            placeholder="Write a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm text-white h-11 px-4 placeholder:text-white/20"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !messageInput.trim()}
            size="icon"
            className={`h-11 w-11 rounded-xl transition-all shadow-xl ${
              messageInput.trim() ? 'bg-primary hover:bg-primary/90 scale-100 shadow-primary/20' : 'bg-[#1e293b] text-white/10 scale-95'
            }`}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-4 opacity-30">
          <div className="h-1 w-1 rounded-full bg-green-500" />
          <p className="text-[9px] font-bold text-white uppercase tracking-[0.2em]">
            Secure End-to-End Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
