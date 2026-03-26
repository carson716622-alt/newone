import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessagingPanel } from "@/components/MessagingPanel";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AgencyMessages() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch agency conversations
  const { data: conversations = [], isLoading, refetch } = trpc.messaging.getAgencyConversations.useQuery(
    undefined,
    { refetchInterval: 5000 } // Refetch every 5 seconds
  );

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchQuery.toLowerCase();
    // You would need to add candidate name to the conversation object
    return true; // Placeholder - would filter by candidate name
  });

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Candidate Messages</h1>
          <p className="text-muted-foreground">
            Communicate with candidates about job opportunities and applications
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col bg-card border-border">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    No conversations yet. Candidates will message you when they apply!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversationId === conv.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Candidate Name</p>
                          <p className="text-xs opacity-75 truncate">Open conversation</p>
                        </div>
                        <span className="text-xs opacity-70 ml-2 whitespace-nowrap">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), {
                            addSuffix: false,
                          })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Messaging Panel */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <MessagingPanel
                conversationId={selectedConversation.id}
                otherUserName="Candidate Name"
                otherUserAvatar="https://via.placeholder.com/40"
              />
            ) : (
              <Card className="h-full flex items-center justify-center bg-card border-border">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
