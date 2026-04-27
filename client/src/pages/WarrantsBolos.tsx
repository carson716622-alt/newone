import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, Shield, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WarrantsBolos() {
  const [warrantFilter, setWarrantFilter] = useState("active");
  const [boloFilter, setBoloFilter] = useState("active");
  const [showWarrantForm, setShowWarrantForm] = useState(false);
  const [showBoloForm, setShowBoloForm] = useState(false);

  const { data: warrants, refetch: refetchWarrants } = trpc.warrants.list.useQuery({ status: warrantFilter });
  const { data: bolos, refetch: refetchBolos } = trpc.bolos.list.useQuery({ status: boloFilter });

  const createWarrant = trpc.warrants.create.useMutation({ onSuccess: () => { refetchWarrants(); setShowWarrantForm(false); toast.success("Warrant issued"); } });
  const updateWarrant = trpc.warrants.update.useMutation({ onSuccess: () => { refetchWarrants(); toast.success("Warrant updated"); } });
  const createBolo = trpc.bolos.create.useMutation({ onSuccess: () => { refetchBolos(); setShowBoloForm(false); toast.success("BOLO issued"); } });
  const updateBolo = trpc.bolos.update.useMutation({ onSuccess: () => { refetchBolos(); toast.success("BOLO updated"); } });

  const [warrantForm, setWarrantForm] = useState({ suspectName: "", charges: "", description: "" });
  const [boloForm, setBoloForm] = useState({ title: "", description: "", suspectName: "", suspectDescription: "", vehicleDescription: "", lastSeenLocation: "" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Warrants & BOLOs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage warrants and be-on-the-lookout alerts</p>
        </div>

        <Tabs defaultValue="warrants" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="warrants">Warrants</TabsTrigger>
            <TabsTrigger value="bolos">BOLOs</TabsTrigger>
          </TabsList>

          {/* Warrants */}
          <TabsContent value="warrants" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {["active", "served", "recalled", "all"].map(s => (
                  <Button key={s} size="sm" variant={warrantFilter === s ? "default" : "outline"} onClick={() => setWarrantFilter(s)} className={warrantFilter === s ? "bg-red-600 text-white" : ""}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
              <Dialog open={showWarrantForm} onOpenChange={setShowWarrantForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"><Plus className="h-4 w-4 mr-1" /> Issue Warrant</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Issue Warrant</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Suspect Name *</Label><Input value={warrantForm.suspectName} onChange={e => setWarrantForm(f => ({ ...f, suspectName: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Charges *</Label><Textarea value={warrantForm.charges} onChange={e => setWarrantForm(f => ({ ...f, charges: e.target.value }))} className="mt-1" rows={3} /></div>
                    <div><Label>Description</Label><Textarea value={warrantForm.description} onChange={e => setWarrantForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} /></div>
                    <Button onClick={() => createWarrant.mutate(warrantForm)} className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={createWarrant.isPending}>Issue Warrant</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!warrants || warrants.length === 0 ? (
              <Card className="bg-card border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><Shield className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No warrants found</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {warrants.map(w => (
                  <Card key={w.id} className="bg-card border-border/50 border-l-2 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{w.suspectName}</p>
                            <Badge variant={w.status === "active" ? "destructive" : "default"} className="text-[10px]">
                              {w.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{w.charges}</p>
                          {w.description && <p className="text-xs text-muted-foreground mt-1">{w.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-2 data-field">Issued: {new Date(w.createdAt).toLocaleString()}</p>
                        </div>
                        {w.status === "active" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateWarrant.mutate({ id: w.id, status: "served" })}>Serve</Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 text-amber-400" onClick={() => updateWarrant.mutate({ id: w.id, status: "recalled" })}>Recall</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* BOLOs */}
          <TabsContent value="bolos" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {["active", "cleared", "all"].map(s => (
                  <Button key={s} size="sm" variant={boloFilter === s ? "default" : "outline"} onClick={() => setBoloFilter(s)} className={boloFilter === s ? "bg-amber-600 text-white" : ""}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
              <Dialog open={showBoloForm} onOpenChange={setShowBoloForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white"><Plus className="h-4 w-4 mr-1" /> Issue BOLO</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Issue BOLO</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Title *</Label><Input value={boloForm.title} onChange={e => setBoloForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Description *</Label><Textarea value={boloForm.description} onChange={e => setBoloForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Suspect Name</Label><Input value={boloForm.suspectName} onChange={e => setBoloForm(f => ({ ...f, suspectName: e.target.value }))} className="mt-1" /></div>
                      <div><Label>Last Seen Location</Label><Input value={boloForm.lastSeenLocation} onChange={e => setBoloForm(f => ({ ...f, lastSeenLocation: e.target.value }))} className="mt-1" /></div>
                    </div>
                    <div><Label>Suspect Description</Label><Textarea value={boloForm.suspectDescription} onChange={e => setBoloForm(f => ({ ...f, suspectDescription: e.target.value }))} className="mt-1" rows={2} /></div>
                    <div><Label>Vehicle Description</Label><Input value={boloForm.vehicleDescription} onChange={e => setBoloForm(f => ({ ...f, vehicleDescription: e.target.value }))} className="mt-1" /></div>
                    <Button onClick={() => createBolo.mutate(boloForm)} className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={createBolo.isPending}>Issue BOLO</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!bolos || bolos.length === 0 ? (
              <Card className="bg-card border-border/50"><CardContent className="py-12 text-center text-muted-foreground"><Eye className="h-10 w-10 mx-auto mb-3 opacity-50" /><p>No BOLOs found</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {bolos.map(b => (
                  <Card key={b.id} className="bg-card border-border/50 border-l-2 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{b.title}</p>
                            <Badge className={`text-[10px] ${b.status === "active" ? "bg-amber-600 text-white" : ""}`}>
                              {b.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {b.suspectName && <p className="text-xs text-muted-foreground"><span className="font-medium">Suspect:</span> {b.suspectName}</p>}
                            {b.lastSeenLocation && <p className="text-xs text-muted-foreground"><span className="font-medium">Last Seen:</span> {b.lastSeenLocation}</p>}
                            {b.suspectDescription && <p className="text-xs text-muted-foreground"><span className="font-medium">Description:</span> {b.suspectDescription}</p>}
                            {b.vehicleDescription && <p className="text-xs text-muted-foreground"><span className="font-medium">Vehicle:</span> {b.vehicleDescription}</p>}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 data-field">Issued: {new Date(b.createdAt).toLocaleString()}</p>
                        </div>
                        {b.status === "active" && (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-green-400" onClick={() => updateBolo.mutate({ id: b.id, status: "cleared" })}>Clear</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
