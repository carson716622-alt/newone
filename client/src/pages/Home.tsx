import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Radio, Flame, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-blue-500" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              FiveM CAD/RMS
            </h1>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Shield className="h-16 w-16 text-blue-500" />
            <Radio className="h-12 w-12 text-amber-500" />
            <Flame className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Computer-Aided Dispatch
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional multi-department CAD & Records Management System for Law Enforcement, Fire/EMS, and Dispatch operations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-lg border border-blue-500/30 bg-blue-500/5">
              <Shield className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Law Enforcement</h3>
              <p className="text-sm text-muted-foreground">
                Person & vehicle lookups, warrants, BOLOs, arrest reports, and citation management.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-red-500/30 bg-red-500/5">
              <Flame className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Fire/EMS</h3>
              <p className="text-sm text-muted-foreground">
                Active calls, unit tracking, patient care reports, and fire incident logging.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <Radio className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Dispatch</h3>
              <p className="text-sm text-muted-foreground">
                Create calls, assign units, priority management, and real-time status tracking.
              </p>
            </div>
          </div>

          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="mt-10 bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            Access CAD System
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          FiveM CAD/RMS - Computer-Aided Dispatch & Records Management System
        </div>
      </footer>
    </div>
  );
}
