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
import { Shield, Search, User, Car, AlertTriangle, FileText, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function LeoPanel() {
  const [personSearch, setPersonSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [showWarrantForm, setShowWarrantForm] = useState(false);
  const [showBoloForm, setShowBoloForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const { data: civilians } = trpc.civilians.list.useQuery({ search: personSearch || undefined }, { enabled: personSearch.length > 0 });
  const { data: vehicles } = trpc.vehicles.list.useQuery({ search: vehicleSearch || undefined }, { enabled: vehicleSearch.length > 0 });
  const { data: warrants } = trpc.warrants.list.useQuery({ status: "active" });
  const { data: bolos } = trpc.bolos.list.useQuery({ status: "active" });

  const createWarrant = trpc.warrants.create.useMutation({ onSuccess: () => { setShowWarrantForm(false); toast.success("Warrant issued"); } });
  const createBolo = trpc.bolos.create.useMutation({ onSuccess: () => { setShowBoloForm(false); toast.success("BOLO issued"); } });
  const createReport = trpc.reports.create.useMutation({ onSuccess: () => { setShowReportForm(false); toast.success("Report filed"); } });

  const [warrantForm, setWarrantForm] = useState({ suspectName: "", charges: "", description: "" });
  const [boloForm, setBoloForm] = useState({ title: "", description: "", suspectName: "", suspectDescription: "", vehicleDescription: "", lastSeenLocation: "" });
  const [reportForm, setReportForm] = useState({ type: "arrest" as string, title: "", narrative: "", charges: "", location: "" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            LEO Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Law enforcement tools and records</p>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="search">Person Search</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle Search</TabsTrigger>
            <TabsTrigger value="warrants">Warrants</TabsTrigger>
            <TabsTrigger value="bolos">BOLOs</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Person Search */}
          <TabsContent value="search" className="mt-4">
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" /> Person / Name Lookup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={personSearch}
                    onChange={e => setPersonSearch(e.target.value)}
                    placeholder="Search by name or license number..."
                    className="data-field"
                  />
                  <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                </div>
                {civilians && civilians.length > 0 ? (
                  <div className="space-y-2">
                    {civilians.map(civ => (
                      <div key={civ.id} className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{civ.firstName} {civ.lastName}</p>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground data-field">
                              <span>DOB: {civ.dateOfBirth}</span>
                              <span>Gender: {civ.gender}</span>
                              {civ.licenseNumber && <span>DL: {civ.licenseNumber}</span>}
                            </div>
                            {civ.address && <p className="text-xs text-muted-foreground mt-1">{civ.address}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {civ.licenseStatus && (
                              <Badge variant={civ.licenseStatus === "valid" ? "default" : "destructive"} className="text-[10px]">
                                DL: {civ.licenseStatus}
                              </Badge>
                            )}
                            {civ.flags && <Badge variant="destructive" className="text-[10px]">FLAGGED</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : personSearch ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Enter a name or license number to search</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Search */}
          <TabsContent value="vehicle" className="mt-4">
            <Card className="bg-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-500" /> Vehicle / Plate Lookup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={vehicleSearch}
                    onChange={e => setVehicleSearch(e.target.value)}
                    placeholder="Search by plate, make, model, or VIN..."
                    className="data-field"
                  />
                  <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                </div>
                {vehicles && vehicles.length > 0 ? (
                  <div className="space-y-2">
                    {vehicles.map(veh => (
                      <div key={veh.id} className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground data-field">{veh.plate}</p>
                            <p className="text-sm text-muted-foreground">{veh.year} {veh.color} {veh.make} {veh.model}</p>
                            {veh.vin && <p className="text-xs text-muted-foreground data-field mt-1">VIN: {veh.vin}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={veh.registrationStatus === "valid" ? "default" : "destructive"} className="text-[10px]">
                              REG: {veh.registrationStatus}
                            </Badge>
                            {veh.registrationStatus === "stolen" && <Badge variant="destructive" className="text-[10px]">STOLEN</Badge>}
                            {veh.flags && <Badge variant="destructive" className="text-[10px]">FLAGGED</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : vehicleSearch ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Enter a plate number, make, model, or VIN to search</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Warrants */}
          <TabsContent value="warrants" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Active Warrants</h3>
              <Dialog open={showWarrantForm} onOpenChange={setShowWarrantForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" /> Issue Warrant</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Issue Warrant</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Suspect Name *</Label><Input value={warrantForm.suspectName} onChange={e => setWarrantForm(f => ({ ...f, suspectName: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Charges *</Label><Textarea value={warrantForm.charges} onChange={e => setWarrantForm(f => ({ ...f, charges: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Description</Label><Textarea value={warrantForm.description} onChange={e => setWarrantForm(f => ({ ...f, description: e.target.value }))} className="mt-1" /></div>
                    <Button onClick={() => createWarrant.mutate(warrantForm)} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createWarrant.isPending}>Issue Warrant</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {!warrants || warrants.length === 0 ? (
              <Card className="bg-card border-border/50"><CardContent className="py-8 text-center text-muted-foreground"><AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No active warrants</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {warrants.map(w => (
                  <Card key={w.id} className="bg-card border-border/50 border-l-2 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{w.suspectName}</p>
                          <p className="text-sm text-muted-foreground mt-1">{w.charges}</p>
                          {w.description && <p className="text-xs text-muted-foreground mt-1">{w.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-2 data-field">Issued: {new Date(w.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">ACTIVE</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* BOLOs */}
          <TabsContent value="bolos" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Active BOLOs</h3>
              <Dialog open={showBoloForm} onOpenChange={setShowBoloForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" /> Issue BOLO</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Issue BOLO</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Title *</Label><Input value={boloForm.title} onChange={e => setBoloForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Description *</Label><Textarea value={boloForm.description} onChange={e => setBoloForm(f => ({ ...f, description: e.target.value }))} className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Suspect Name</Label><Input value={boloForm.suspectName} onChange={e => setBoloForm(f => ({ ...f, suspectName: e.target.value }))} className="mt-1" /></div>
                      <div><Label>Last Seen Location</Label><Input value={boloForm.lastSeenLocation} onChange={e => setBoloForm(f => ({ ...f, lastSeenLocation: e.target.value }))} className="mt-1" /></div>
                    </div>
                    <div><Label>Suspect Description</Label><Textarea value={boloForm.suspectDescription} onChange={e => setBoloForm(f => ({ ...f, suspectDescription: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Vehicle Description</Label><Input value={boloForm.vehicleDescription} onChange={e => setBoloForm(f => ({ ...f, vehicleDescription: e.target.value }))} className="mt-1" /></div>
                    <Button onClick={() => createBolo.mutate(boloForm)} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createBolo.isPending}>Issue BOLO</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {!bolos || bolos.length === 0 ? (
              <Card className="bg-card border-border/50"><CardContent className="py-8 text-center text-muted-foreground"><AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No active BOLOs</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {bolos.map(b => (
                  <Card key={b.id} className="bg-card border-border/50 border-l-2 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{b.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
                          {b.suspectName && <p className="text-xs text-muted-foreground mt-1">Suspect: {b.suspectName}</p>}
                          {b.vehicleDescription && <p className="text-xs text-muted-foreground mt-1">Vehicle: {b.vehicleDescription}</p>}
                          {b.lastSeenLocation && <p className="text-xs text-muted-foreground mt-1">Last Seen: {b.lastSeenLocation}</p>}
                          <p className="text-[10px] text-muted-foreground mt-2 data-field">Issued: {new Date(b.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge className="bg-amber-600 text-white text-[10px]">BOLO</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">File Report</h3>
              <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" /> New Report</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>File Report</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Report Type</Label>
                        <select value={reportForm.type} onChange={e => setReportForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="arrest">Arrest Report</option>
                          <option value="citation">Citation</option>
                        </select>
                      </div>
                      <div><Label>Location</Label><Input value={reportForm.location} onChange={e => setReportForm(f => ({ ...f, location: e.target.value }))} className="mt-1" /></div>
                    </div>
                    <div><Label>Title *</Label><Input value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Charges</Label><Textarea value={reportForm.charges} onChange={e => setReportForm(f => ({ ...f, charges: e.target.value }))} className="mt-1" rows={2} /></div>
                    <div><Label>Narrative *</Label><Textarea value={reportForm.narrative} onChange={e => setReportForm(f => ({ ...f, narrative: e.target.value }))} className="mt-1" rows={4} /></div>
                    <Button onClick={() => createReport.mutate({ ...reportForm, type: reportForm.type as any })} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createReport.isPending}>Submit Report</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="bg-card border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Use the "New Report" button to file arrest reports or citations</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
