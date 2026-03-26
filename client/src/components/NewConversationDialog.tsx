import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MessageSquarePlus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NewConversationDialogProps {
  onSelect: (agencyId: number, agencyName: string) => void;
}

export function NewConversationDialog({ onSelect }: NewConversationDialogProps) {
  const [search, setSearch] = useState("");
  
  const { data: agencies = [], isLoading } = trpc.jobs.getAgencies.useQuery();

  const filteredAgencies = agencies.filter(a => 
    a.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">No departments found.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAgencies.map((agency) => (
              <button
                key={agency.id}
                onClick={() => onSelect(agency.id, agency.departmentName)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquarePlus className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{agency.departmentName}</p>
                  <p className="text-xs text-muted-foreground truncate">{agency.address || 'Law Enforcement Agency'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
