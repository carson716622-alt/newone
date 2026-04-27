import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Car, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CitizensVehicles() {
  const [civSearch, setCivSearch] = useState("");
  const [vehSearch, setVehSearch] = useState("");
  const [showCivForm, setShowCivForm] = useState(false);
  const [showVehForm, setShowVehForm] = useState(false);

  const { data: civilians, refetch: refetchCiv } = trpc.civilians.list.useQuery({ search: civSearch || undefined });
  const { data: vehicles, refetch: refetchVeh } = trpc.vehicles.list.useQuery({ search: vehSearch || undefined });

  const createCivilian = trpc.civilians.create.useMutation({ onSuccess: () => { refetchCiv(); setShowCivForm(false); toast.success("Civilian created"); } });
  const createVehicle = trpc.vehicles.create.useMutation({ onSuccess: () => { refetchVeh(); setShowVehForm(false); toast.success("Vehicle registered"); } });

  const [civForm, setCivForm] = useState({ firstName: "", lastName: "", dateOfBirth: "", gender: "male" as string, race: "", address: "", phone: "", licenseNumber: "", licenseStatus: "valid" as string });
  const [vehForm, setVehForm] = useState({ plate: "", make: "", model: "", year: "", color: "", vin: "", registrationStatus: "valid" as string, insuranceStatus: "valid" as string });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-foreground" />
            Citizens & Vehicles Database
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage civilian profiles and vehicle registrations</p>
        </div>

        <Tabs defaultValue="citizens" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="citizens">Citizens</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          </TabsList>

          {/* Citizens */}
          <TabsContent value="citizens" className="mt-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex gap-2 flex-1 max-w-md">
                <Input value={civSearch} onChange={e => setCivSearch(e.target.value)} placeholder="Search citizens..." className="data-field" />
                <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
              </div>
              <Dialog open={showCivForm} onOpenChange={setShowCivForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" /> Add Civilian</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Create Civilian Profile</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>First Name *</Label><Input value={civForm.firstName} onChange={e => setCivForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1" /></div>
                      <div><Label>Last Name *</Label><Input value={civForm.lastName} onChange={e => setCivForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Date of Birth *</Label><Input value={civForm.dateOfBirth} onChange={e => setCivForm(f => ({ ...f, dateOfBirth: e.target.value }))} placeholder="MM/DD/YYYY" className="mt-1 data-field" /></div>
                      <div>
                        <Label>Gender *</Label>
                        <Select value={civForm.gender} onValueChange={v => setCivForm(f => ({ ...f, gender: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Race</Label><Input value={civForm.race} onChange={e => setCivForm(f => ({ ...f, race: e.target.value }))} className="mt-1" /></div>
                      <div><Label>Phone</Label><Input value={civForm.phone} onChange={e => setCivForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 data-field" /></div>
                    </div>
                    <div><Label>Address</Label><Input value={civForm.address} onChange={e => setCivForm(f => ({ ...f, address: e.target.value }))} className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>License Number</Label><Input value={civForm.licenseNumber} onChange={e => setCivForm(f => ({ ...f, licenseNumber: e.target.value }))} className="mt-1 data-field" /></div>
                      <div>
                        <Label>License Status</Label>
                        <Select value={civForm.licenseStatus} onValueChange={v => setCivForm(f => ({ ...f, licenseStatus: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="valid">Valid</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="revoked">Revoked</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={() => createCivilian.mutate({ ...civForm, gender: civForm.gender as any, licenseStatus: civForm.licenseStatus as any })} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createCivilian.isPending}>Create Civilian</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!civilians || civilians.length === 0 ? (
              <Card className="bg-card border-border/50"><CardContent className="py-8 text-center text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>{civSearch ? "No results found" : "No civilians in database"}</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {civilians.map(civ => (
                  <Card key={civ.id} className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{civ.firstName} {civ.lastName}</p>
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground data-field">
                            <span>DOB: {civ.dateOfBirth}</span>
                            <span>Gender: {civ.gender}</span>
                            {civ.phone && <span>Phone: {civ.phone}</span>}
                          </div>
                          {civ.address && <p className="text-xs text-muted-foreground mt-1">{civ.address}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {civ.licenseNumber && <span className="text-xs text-muted-foreground data-field">DL: {civ.licenseNumber}</span>}
                          {civ.licenseStatus && (
                            <Badge variant={civ.licenseStatus === "valid" ? "default" : "destructive"} className="text-[10px]">
                              {civ.licenseStatus.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Vehicles */}
          <TabsContent value="vehicles" className="mt-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex gap-2 flex-1 max-w-md">
                <Input value={vehSearch} onChange={e => setVehSearch(e.target.value)} placeholder="Search by plate, make, model..." className="data-field" />
                <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
              </div>
              <Dialog open={showVehForm} onOpenChange={setShowVehForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" /> Register Vehicle</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Register Vehicle</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Plate *</Label><Input value={vehForm.plate} onChange={e => setVehForm(f => ({ ...f, plate: e.target.value }))} className="mt-1 data-field" /></div>
                      <div><Label>Color *</Label><Input value={vehForm.color} onChange={e => setVehForm(f => ({ ...f, color: e.target.value }))} className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><Label>Make *</Label><Input value={vehForm.make} onChange={e => setVehForm(f => ({ ...f, make: e.target.value }))} className="mt-1" /></div>
                      <div><Label>Model *</Label><Input value={vehForm.model} onChange={e => setVehForm(f => ({ ...f, model: e.target.value }))} className="mt-1" /></div>
                      <div><Label>Year</Label><Input value={vehForm.year} onChange={e => setVehForm(f => ({ ...f, year: e.target.value }))} className="mt-1 data-field" /></div>
                    </div>
                    <div><Label>VIN</Label><Input value={vehForm.vin} onChange={e => setVehForm(f => ({ ...f, vin: e.target.value }))} className="mt-1 data-field" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Registration</Label>
                        <Select value={vehForm.registrationStatus} onValueChange={v => setVehForm(f => ({ ...f, registrationStatus: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="valid">Valid</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="stolen">Stolen</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Insurance</Label>
                        <Select value={vehForm.insuranceStatus} onValueChange={v => setVehForm(f => ({ ...f, insuranceStatus: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="valid">Valid</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={() => createVehicle.mutate({ ...vehForm, year: vehForm.year ? parseInt(vehForm.year) : undefined, registrationStatus: vehForm.registrationStatus as any, insuranceStatus: vehForm.insuranceStatus as any })} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createVehicle.isPending}>Register Vehicle</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!vehicles || vehicles.length === 0 ? (
              <Card className="bg-card border-border/50"><CardContent className="py-8 text-center text-muted-foreground"><Car className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>{vehSearch ? "No results found" : "No vehicles in database"}</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {vehicles.map(veh => (
                  <Card key={veh.id} className="bg-card border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground data-field">{veh.plate}</p>
                          <p className="text-sm text-muted-foreground">{veh.year} {veh.color} {veh.make} {veh.model}</p>
                          {veh.vin && <p className="text-xs text-muted-foreground data-field mt-1">VIN: {veh.vin}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={veh.registrationStatus === "valid" ? "default" : "destructive"} className="text-[10px]">
                            REG: {veh.registrationStatus?.toUpperCase()}
                          </Badge>
                          <Badge variant={veh.insuranceStatus === "valid" ? "default" : "destructive"} className="text-[10px]">
                            INS: {veh.insuranceStatus?.toUpperCase()}
                          </Badge>
                        </div>
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
