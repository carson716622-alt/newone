import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MessageSquarePlus, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NewConversationDialogProps {
  onSelect: (agencyId: number, agencyName: string) => void;
}

export function NewConversationDialog({ onSelect }: NewConversationDialogProps) {
  const [search, setSearch] = useState("");
  
  const { data: agencies = [], isLoading } = trpc.jobs.getAgencies.useQuery();

  // Filter agencies based on search input, but show all if search is empty
  const filteredAgencies = agencies.filter(a => 
    a.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Search Header */}
      <div className="p-5 border-b border-white/5 bg-[#1e293b]/30">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search for a department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 bg-[#0f172a] border-white/5 text-white placeholder:text-white/10 focus-visible:ring-primary/20 rounded-xl font-medium"
          />
        </div>
      </div>
      
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#0f172a] custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Searching Directory</p>
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="text-center py-24 px-10">
            <div className="bg-[#1e293b] shadow-inner w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
              <Search className="h-10 w-10 text-white/10" />
            </div>
            <p className="text-sm font-bold text-white mb-2">No departments found</p>
            <p className="text-xs text-white/40 leading-relaxed font-medium italic">Try searching for a different name or location.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredAgencies.map((agency) => (
              <button
                key={agency.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(agency.id, agency.departmentName);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-[1.5rem] bg-[#1e293b]/40 border border-white/5 hover:border-primary/40 hover:bg-[#1e293b]/60 transition-all text-left group relative overflow-hidden shadow-sm cursor-pointer active:scale-[0.98]"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#0f172a] flex items-center justify-center border border-white/5 group-hover:bg-primary/20 transition-all">
                  <Building2 className="h-6 w-6 text-white/30 group-hover:text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{agency.departmentName}</p>
                  <p className="text-[11px] text-white/40 font-medium truncate mt-1 leading-none">{agency.address || 'Law Enforcement Agency'}</p>
                </div>
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                   <MessageSquarePlus className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-4 bg-[#1e293b]/20 border-t border-white/5 text-center">
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Showing {filteredAgencies.length} Available Departments</p>
      </div>
    </div>
  );
}
