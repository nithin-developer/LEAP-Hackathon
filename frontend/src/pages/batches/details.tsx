import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  CheckCircle2,
  Clock,
  Truck,
  ShieldAlert,
  Thermometer,
  Droplets,
  Activity,
  Battery,
  QrCode,
  RefreshCw,
  Play,
  Pause,
  Building2,
  FileCheck,
  ShieldCheck,
  Zap,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchBatchById, updateBatchStatus, Batch } from "@/api/batch";

import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Recharts for Telemetry
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Simulated Telemetry Generator
const generateTelemetryData = (baseTemp = 21.5, baseHumidity = 63, baseShock = 0.12) => {
  const times = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "Live"];
  return times.map((t, idx) => {
    const tempOffset = Math.sin(idx) * 1.5 + (Math.random() * 0.4 - 0.2);
    const humOffset = Math.cos(idx) * 2.5 + (Math.random() * 0.8 - 0.4);
    const shockOffset = Math.random() * 0.08;
    return {
      time: t,
      temperature: parseFloat((baseTemp + tempOffset).toFixed(1)),
      humidity: Math.round(baseHumidity + humOffset),
      accelerometer: parseFloat((baseShock + shockOffset).toFixed(2)),
    };
  });
};

export default function BatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Page States
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [telemetryData, setTelemetryData] = useState(generateTelemetryData());
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(65);
  const [qrOpen, setQrOpen] = useState<boolean>(false);

  // Load Batch Details
  const loadBatch = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchBatchById(id);
      setBatch(data);
      if (data.status === "PENDING") setProgressPercent(15);
      else if (data.status === "ACCEPTED") setProgressPercent(35);
      else if (data.status === "IN_TRANSIT") setProgressPercent(70);
      else if (data.status === "RECEIVED") setProgressPercent(100);
      else if (data.status === "REJECTED") setProgressPercent(0);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to load batch details");
      navigate("/batches");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBatch();
  };

  // Live Telemetry Simulation Tick
  useEffect(() => {
    if (!isLiveTracking) return;
    const interval = setInterval(() => {
      setTelemetryData((prev) => {
        const newTemp = parseFloat((21.5 + (Math.random() * 1.2 - 0.6)).toFixed(1));
        const newHum = Math.min(80, Math.max(45, Math.round(63 + (Math.random() * 4 - 2))));
        const newShock = parseFloat((0.11 + Math.random() * 0.07).toFixed(2));

        const updated = [...prev.slice(1)];
        updated.push({
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temperature: newTemp,
          humidity: newHum,
          accelerometer: newShock,
        });
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveTracking]);

  // Status Change Handler
  const handleStatusChange = async (newStatus: string) => {
    if (!batch) return;
    try {
      const updated = await updateBatchStatus(batch.id, newStatus);
      setBatch(updated);
      toast.success(`Batch status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update status");
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 gap-1 px-3 py-1 font-medium">
            <Clock className="w-4 h-4" /> Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 px-3 py-1 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Accepted
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 px-3 py-1 font-medium animate-pulse">
            <Truck className="w-4 h-4" /> In Transit
          </Badge>
        );
      case "RECEIVED":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1 px-3 py-1 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Received
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 gap-1 px-3 py-1 font-medium">
            <ShieldAlert className="w-4 h-4" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const latestTelemetry = telemetryData[telemetryData.length - 1];

  return (
    <>
      {/* Top Header Navigation matching detail.tsx */}
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="container mx-auto p-6 space-y-6">
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
        ) : !batch ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-xl font-semibold">Batch Not Found</h3>
            <Button variant="outline" onClick={() => navigate("/batches")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Batches
            </Button>
          </div>
        ) : (
          <>
            {/* Header Section matching detail.tsx */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Batch: {batch.crop_name}
                    </h1>
                    {renderStatusBadge(batch.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Batch ID: <span className="font-mono text-xs">{batch.id}</span> | Variety: {batch.variety || "Standard"}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 md:mt-0 md:justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh"
                  className="shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>

                <Button variant="outline" onClick={() => navigate("/batches")}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Batches
                </Button>

                {/* QR Traceability Modal */}
                <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"  className="gap-1.5">
                      <QrCode className="h-4 w-4 text-primary" /> Traceability QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                      <DialogTitle className="text-center flex items-center justify-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" /> MandiTrace Blockchain QR
                      </DialogTitle>
                      <DialogDescription className="text-center">
                        Scan to verify crop authenticity and sensor telemetry log.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 gap-4">
                      <div className="p-4 bg-white rounded-xl shadow-inner border border-muted">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://manditrace.example.com/verify/${batch.id}`}
                          alt="Batch QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded w-full">
                        Hash: 0x8f4b...{batch.id.substring(batch.id.length - 8)}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Status Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                      Update Status <CheckCircle className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange("ACCEPTED")}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" /> Accept Batch
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("IN_TRANSIT")}>
                      <Truck className="h-4 w-4 mr-2 text-purple-600" /> Mark In Transit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("RECEIVED")}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Mark Received
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange("REJECTED")} className="text-red-600">
                      <ShieldAlert className="h-4 w-4 mr-2" /> Reject Batch
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ── Key Cards Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Crop Specifications */}
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-purple-500/20" />
                <CardHeader>
                  <CardTitle className="text-md font-semibold flex items-center gap-2">
                    <Package className="h-6 w-6 text-purple-600" /> Crop Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Quantity & Unit</span>
                    <span className="text-lg font-bold text-foreground">
                      {batch.quantity} <span className="text-xs font-normal text-muted-foreground">{batch.unit}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t pt-2">
                    <span className="text-muted-foreground">Variety</span>
                    <span className="font-medium">{batch.variety || "Standard Quality"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Harvest Date</span>
                    <span className="font-medium">{new Date(batch.harvest_date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Farmer Origin */}
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-green-500/20" />

                <CardHeader>
                  <CardTitle className="text-md font-semibold flex items-center gap-2">
                    <User className="h-6 w-6 text-green-600" /> Farmer Origin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Farmer Name</span>
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                      {batch.farmer_name} <ShieldCheck className="h-3.5 w-3.5 text-green-600 inline" />
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t pt-2">
                    <span className="text-muted-foreground">Farm Location</span>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {batch.farmer_location}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Contact Email</span>
                    <span className="font-mono text-muted-foreground">{batch.farmer_email}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Mandi Destination */}
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-amber-50/50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-500/20" />
                <CardHeader>
                  <CardTitle className="text-md font-semibold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-amber-600" /> Mandi Destination
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Target Mandi</span>
                    <span className="text-sm font-semibold text-foreground">{batch.mandi_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t pt-2">
                    <span className="text-muted-foreground">Mandi Location</span>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" /> {batch.mandi_location || "Central Mandi Yard"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Assignment Status</span>
                    <span className="font-medium text-green-600">Assigned & Registered</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs Section matching detail.tsx */}
            <Tabs defaultValue="journey" className="w-full space-y-4">
              <TabsList className="grid grid-cols-3 max-w-md">
                <TabsTrigger value="journey" className="gap-2">
                  <Truck className="h-4 w-4" /> Live Journey
                </TabsTrigger>
                <TabsTrigger value="sensors" className="gap-2">
                  <Activity className="h-4 w-4" /> Telemetry
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2">
                  <FileCheck className="h-4 w-4" /> Audit Log
                </TabsTrigger>
              </TabsList>

              {/* ── TAB 1: Live Interactive Transit Map ── */}
              <TabsContent value="journey" className="space-y-4">
                <Card className="shadow-sm border">
                  <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" /> Live GPS Transit Map
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Real-time GPS tracking from farm origin ({batch.farmer_location}) to Mandi ({batch.mandi_name})
                      </CardDescription>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLiveTracking(!isLiveTracking)}
                      className="gap-1.5 text-xs"
                    >
                      {isLiveTracking ? (
                        <>
                          <Pause className="h-3.5 w-3.5 text-amber-500" /> Pause Simulation
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 text-green-600" /> Live Updates
                        </>
                      )}
                    </Button>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* SVG Map Canvas */}
                    <div className="relative w-full h-72 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-6">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                      <div className="relative z-10 flex items-center justify-between bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="font-semibold text-emerald-400">GPS Tracker Active</span>
                          <span className="text-slate-400">| Vehicle #KA-09-EV-4092</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300 font-mono">
                          <span>Speed: <strong className="text-white">42 km/h</strong></span>
                          <span>Est. Arrival: <strong className="text-emerald-400">1 hr 15 mins</strong></span>
                        </div>
                      </div>

                      {/* Route Waypoints */}
                      <div className="relative z-10 w-full flex items-center justify-between px-8 my-auto">
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold text-white">{batch.farmer_location}</p>
                            <p className="text-[10px] text-slate-400">Harvest Origin</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-blue-500 flex items-center justify-center text-blue-400">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div className="text-xs">
                            <p className="font-medium text-slate-300">Quality Hub</p>
                            <p className="text-[10px] text-slate-400">Grade A Passed</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center gap-2 relative">
                          <div className="w-12 h-12 rounded-full bg-purple-500/30 border-2 border-purple-400 flex items-center justify-center text-purple-300 animate-pulse shadow-lg shadow-purple-500/40">
                            <Truck className="h-6 w-6" />
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold text-purple-300">NH-276 Transit</p>
                            <p className="text-[10px] text-slate-400">En Route</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-amber-500 flex items-center justify-center text-amber-400">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold text-white">{batch.mandi_name}</p>
                            <p className="text-[10px] text-slate-400">Mandi Gate 2</p>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 h-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="p-3 bg-muted/40 rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Current GPS Coordinates</p>
                        <p className="text-sm font-mono font-semibold mt-1">12.3021° N, 76.6432° E</p>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Total Distance</p>
                        <p className="text-sm font-semibold mt-1">84 km (58 km Covered)</p>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Carrier Vehicle</p>
                        <p className="text-sm font-semibold mt-1">E-Truck #KA-09-EV-4092</p>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">Driver Contact</p>
                        <p className="text-sm font-semibold mt-1">+91 98450 12345</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── TAB 2: Telemetry Sensors ── */}
              <TabsContent value="sensors" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 shadow-sm border border-blue-500/20 bg-blue-500/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Temperature</p>
                        <h3 className="text-2xl font-bold text-blue-600 mt-1">{latestTelemetry.temperature} °C</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Optimal: 18 - 24 °C</p>
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                        <Thermometer className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 shadow-sm border border-cyan-500/20 bg-cyan-500/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Relative Humidity</p>
                        <h3 className="text-2xl font-bold text-cyan-600 mt-1">{latestTelemetry.humidity} %</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Optimal: 60 - 70 %</p>
                      </div>
                      <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600">
                        <Droplets className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 shadow-sm border border-purple-500/20 bg-purple-500/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Shock / Accelerometer</p>
                        <h3 className="text-2xl font-bold text-purple-600 mt-1">{latestTelemetry.accelerometer} g</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Max Threshold: 0.50 g</p>
                      </div>
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                        <Activity className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 shadow-sm border border-green-500/20 bg-green-500/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">IoT Device Health</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">94 %</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Device: IOT-MD-8842 (4G)</p>
                      </div>
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                        <Battery className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-sm border">
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-blue-600" /> Temperature Log (°C)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={telemetryData}>
                            <defs>
                              <linearGradient id="tempColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="time" fontSize={11} />
                            <YAxis fontSize={11} domain={[15, 35]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#2563eb" fillOpacity={1} fill="url(#tempColor)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border">
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-600" /> Accelerometer Impact Log (g)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={telemetryData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="time" fontSize={11} />
                            <YAxis fontSize={11} domain={[0, 0.5]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="accelerometer" name="Shock (g)" stroke="#9333ea" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── TAB 3: Audit Log ── */}
              <TabsContent value="audit" className="space-y-4">
                <Card className="shadow-sm border">
                  <CardHeader className="py-4 px-6 border-b">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-green-600" /> Supply Chain Timeline Audit
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Immutable milestone trail from harvest registration to mandi arrival
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="relative border-l-2 border-green-600/30 ml-4 space-y-8 pl-6">
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-green-600 ring-4 ring-green-100 dark:ring-green-950" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-foreground">Crop Harvested & Batch Registered</h4>
                          <span className="text-xs text-muted-foreground">{new Date(batch.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registered by <strong>{batch.farmer_name}</strong> at farm origin ({batch.farmer_location}).
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded text-[11px] font-mono text-muted-foreground">
                          <Zap className="h-3 w-3 text-green-600" /> Block #10492 | Hash: 0xa4b9...192f
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-foreground">Quality Inspection & Sensor Tagging</h4>
                          <span className="text-xs text-muted-foreground">2 hours after harvest</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned IoT Sensor <strong>#IOT-MD-8842</strong>. Grade A Quality certification attached.
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded text-[11px] font-mono text-muted-foreground">
                          <Zap className="h-3 w-3 text-blue-600" /> Block #10498 | Hash: 0xc871...881a
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-purple-600 ring-4 ring-purple-100 dark:ring-purple-950" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-foreground">Dispatched & Live GPS Tracking Enabled</h4>
                          <span className="text-xs text-muted-foreground">En route to {batch.mandi_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Loaded into vehicle #KA-09-EV-4092. Destination: {batch.mandi_location || "Mandi Yard"}.
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded text-[11px] font-mono text-muted-foreground">
                          <Zap className="h-3 w-3 text-purple-600" /> Block #10512 | Hash: 0xe349...4012
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}
