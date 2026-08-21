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
  Compass,
  Radio,
  Wifi,
  WifiOff,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { fetchBatchById, updateBatchStatus, Batch } from "@/api/batch";
import { fetchLiveSensorData, SensorDataPayload } from "@/api/iot";

import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveMap } from "@/components/ui/live-map";
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

// Recharts for Live Telemetry
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

export default function BatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Page & Batch States
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [qrOpen, setQrOpen] = useState<boolean>(false);

  // Live IoT Hardware Telemetry States
  const [hasHardwareData, setHasHardwareData] = useState<boolean>(false);
  const [liveSensorData, setLiveSensorData] = useState<SensorDataPayload | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<SensorDataPayload[]>([]);
  const [isPolling, setIsPolling] = useState<boolean>(true);

  // Load Batch Details
  const loadBatch = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetchBatchById(id);
      setBatch(res);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to load batch details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  // Poll IoT Sensor Data every 2 seconds (2000 ms)
  const pollIoTData = useCallback(async () => {
    try {
      const res = await fetchLiveSensorData();
      setHasHardwareData(res.has_data);
      if (res.has_data && res.data) {
        setLiveSensorData(res.data);
        setTelemetryHistory(res.telemetry_history || []);
      } else {
        setLiveSensorData(null);
      }
    } catch (err) {
      // Endpoint error or backend restarting
      setHasHardwareData(false);
    }
  }, []);

  useEffect(() => {
    pollIoTData();
    if (!isPolling) return;

    const interval = setInterval(() => {
      pollIoTData();
    }, 2000); // 2 seconds real-time update

    return () => clearInterval(interval);
  }, [pollIoTData, isPolling]);

  // Update Status Handler
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
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 px-3 py-1 font-medium">
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
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 px-3 py-1 font-medium">
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

  return (
    <>
      {/* Top Header Navigation */}
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-xl font-semibold">Batch Not Found</h3>
            <Button variant="outline" onClick={() => navigate("/batches")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Batches
            </Button>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/batches")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Batch: {batch.crop_name}
                    </h1>
                    {renderStatusBadge(batch.status)}

                    {/* Hardware Stream Status Indicator */}
                    {hasHardwareData ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1 font-semibold animate-pulse">
                        <Wifi className="h-3.5 w-3.5" /> ESP32 Live Hardware Stream Active (2s)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 px-3 py-1 font-medium">
                        <WifiOff className="h-3.5 w-3.5" /> No Hardware Device Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Batch ID: <span className="font-mono text-xs">{batch.id}</span> | Variety: {batch.variety || "Standard"}
                  </p>
                </div>
              </div>

              {/* Top Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setQrOpen(true)} className="gap-1 text-xs">
                  <QrCode className="h-4 w-4" /> Traceability QR
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="gap-1 text-xs bg-primary text-primary-foreground">
                      Update Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Change Batch Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusChange("ACCEPTED")}>
                      Set to ACCEPTED
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("IN_TRANSIT")}>
                      Set to IN_TRANSIT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("RECEIVED")}>
                      Set to RECEIVED
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange("REJECTED")} className="text-red-600">
                      Set to REJECTED
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Overview Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
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


              {/* Card 2: Farmer Details */}
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/20" />
                <CardHeader>
                  <CardTitle className="text-md font-semibold flex items-center gap-2">
                    <User className="h-6 w-6 text-emerald-600" /> Farmer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Farmer Name</span>
                    <span className="text-lg font-bold text-foreground truncate max-w-[150px]">{batch.farmer_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t pt-2">
                    <span className="text-muted-foreground">Farm Location</span>
                    <span className="font-medium truncate max-w-[150px]">{batch.farmer_location}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Account Status</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Verified Origin</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Assigned Mandi */}
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-blue-500/20" />
                <CardHeader>
                  <CardTitle className="text-md font-semibold flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600" /> Assigned Mandi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Mandi Name</span>
                    <span className="text-lg font-bold text-foreground truncate max-w-[150px]">{batch.mandi_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t pt-2">
                    <span className="text-muted-foreground">Yard Location</span>
                    <span className="font-medium truncate max-w-[150px]">{batch.mandi_location || "Central Mandi Yard"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Registration</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">Target Assigned</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Hardware Stream */}
              <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-amber-50/50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-500/20" />
                <CardHeader>
                  <CardTitle className="text-md font-semibold flex items-center gap-2">
                    <Radio className="h-6 w-6 text-amber-600" /> Hardware Stream
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">IoT Status</span>
                    <span className={`text-lg font-bold ${hasHardwareData ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {hasHardwareData ? "Live (2s)" : "Disconnected"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t pt-2">
                    <span className="text-muted-foreground">Last Sync Time</span>
                    <span className="font-medium">{hasHardwareData && liveSensorData ? liveSensorData.time : "Awaiting ESP32..."}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Sensor Box</span>
                    <span className="font-medium">ESP32 + GPS + MPU</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs Section */}
            <Tabs defaultValue="journey" className="w-full space-y-4">
              <TabsList className="w-fit inline-flex">
                <TabsTrigger value="journey" className="gap-2">
                  <Truck className="h-4 w-4" /> Live Journey
                </TabsTrigger>
                <TabsTrigger value="sensors" className="gap-2">
                  <Activity className="h-4 w-4" /> Telemetry Sensors
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-2">
                  <FileCheck className="h-4 w-4" /> Audit Log
                </TabsTrigger>
              </TabsList>

              {/* ── TAB 1: Live Interactive OpenStreetMap Transit Map ── */}
              <TabsContent value="journey" className="space-y-4">
                <Card className="shadow-sm border">
                  <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" /> OpenSource Live GPS Transit Map
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Real-time 60fps OpenStreetMap vehicle positioning from farm origin ({batch.farmer_location}) to Mandi ({batch.mandi_name}).
                      </CardDescription>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPolling(!isPolling)}
                      className="gap-1.5 text-xs"
                    >
                      {isPolling ? (
                        <>
                          <Pause className="h-3.5 w-3.5 text-amber-500" /> Pause Polling
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 text-emerald-600" /> Resume 2s Polling
                        </>
                      )}
                    </Button>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Live OpenStreetMap Leaflet Container */}
                    <LiveMap
                      latitude={liveSensorData?.latitude || 12.3052}
                      longitude={liveSensorData?.longitude || 76.6552}
                      gpsFix={liveSensorData?.gps_fix ?? false}
                      hasData={hasHardwareData}
                      speed={liveSensorData?.speed || 0}
                      satellites={liveSensorData?.satellites || 0}
                      altitude={liveSensorData?.altitude || 0}
                      farmerLocation={batch.farmer_location}
                      mandiName={batch.mandi_name}
                    />

                    {/* Live Navigation Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="p-3 bg-muted/40 rounded-xl border text-center">
                        <p className="text-xs text-muted-foreground font-medium">GPS Coordinates</p>
                        <p className="text-sm font-mono font-bold mt-1">
                          {hasHardwareData && liveSensorData?.gps_fix
                            ? `${liveSensorData.latitude.toFixed(4)}° N, ${liveSensorData.longitude.toFixed(4)}° E`
                            : "No GPS Fix"}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-xl border text-center">
                        <p className="text-xs text-muted-foreground font-medium">Transit Speed</p>
                        <p className="text-sm font-bold mt-1">
                          {hasHardwareData && liveSensorData ? `${liveSensorData.speed.toFixed(1)} km/h` : "-- km/h"}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-xl border text-center">
                        <p className="text-xs text-muted-foreground font-medium">Satellites & Altitude</p>
                        <p className="text-sm font-bold mt-1">
                          {hasHardwareData && liveSensorData
                            ? `${liveSensorData.satellites} Sats | ${liveSensorData.altitude.toFixed(0)}m`
                            : "--"}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-xl border text-center">
                        <p className="text-xs text-muted-foreground font-medium">Hardware Connection</p>
                        <p className="text-sm font-bold mt-1">
                          {hasHardwareData ? "🟢 Active Stream (2s)" : "🔴 Disconnected"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── TAB 2: Telemetry Sensors ── */}
              <TabsContent value="sensors" className="space-y-4">
                {/* Hardware Connection Alert Banner */}
                {!hasHardwareData && (
                  <Card className="p-4 border-amber-500/30 bg-amber-500/5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                        <WifiOff className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">No Hardware Device Connected</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Waiting for live ESP32 sensor data stream. Flash your ESP32 board and verify the API endpoint is receiving packets at <code>POST /api/sensor-data</code>.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* 4 Sensor Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 shadow-sm border border-blue-500/20 bg-blue-500/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">DHT & MPU Temperature</p>
                        <h3 className="text-2xl font-extrabold text-blue-600 mt-1">
                          {hasHardwareData && liveSensorData ? `${liveSensorData.temperature.toFixed(1)} °C` : "-- °C"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {hasHardwareData && liveSensorData ? `MPU Temp: ${liveSensorData.mpu_temperature.toFixed(1)} °C` : "Optimal: 18 - 26 °C"}
                        </p>
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
                        <h3 className="text-2xl font-extrabold text-cyan-600 mt-1">
                          {hasHardwareData && liveSensorData ? `${liveSensorData.humidity.toFixed(1)} %` : "-- %"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Optimal: 60 - 75 %</p>
                      </div>
                      <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600">
                        <Droplets className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 shadow-sm border border-purple-500/20 bg-purple-500/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">3-Axis Accelerometer</p>
                        <h3 className="text-2xl font-extrabold text-purple-600 mt-1">
                          {hasHardwareData && liveSensorData
                            ? `${(liveSensorData.composite_shock || Math.sqrt(liveSensorData.acceleration_x ** 2 + liveSensorData.acceleration_y ** 2 + liveSensorData.acceleration_z ** 2)).toFixed(2)} g`
                            : "-- g"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {hasHardwareData && liveSensorData
                            ? `X:${liveSensorData.acceleration_x.toFixed(2)} Y:${liveSensorData.acceleration_y.toFixed(2)} Z:${liveSensorData.acceleration_z.toFixed(2)}`
                            : "Max Threshold: 0.50 g"}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                        <Activity className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 shadow-sm border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Gyroscope Rotation</p>
                        <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
                          {hasHardwareData && liveSensorData
                            ? `${liveSensorData.gyro_x.toFixed(1)} deg/s`
                            : "-- deg/s"}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {hasHardwareData && liveSensorData
                            ? `Y:${liveSensorData.gyro_y.toFixed(1)} Z:${liveSensorData.gyro_z.toFixed(1)}`
                            : "Device: ESP32 Hardware"}
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                        <Compass className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recharts Live Graphs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temperature Stream Chart */}
                  <Card className="shadow-sm border">
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-blue-600" /> Temperature Stream Log (°C)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                      <div className="h-64 w-full">
                        {telemetryHistory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={telemetryHistory}>
                              <defs>
                                <linearGradient id="tempColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="time" fontSize={11} />
                              <YAxis fontSize={11} domain={[15, 45]} />
                              <Tooltip />
                              <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#2563eb" fillOpacity={1} fill="url(#tempColor)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground p-6">
                            <WifiOff className="h-8 w-8 text-muted shadow-none mb-2" />
                            <p className="font-semibold text-foreground">No Temperature Stream Data</p>
                            <p className="mt-1">Connect your ESP32 hardware device to view real-time temperature logs.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Accelerometer Shock Impact Chart */}
                  <Card className="shadow-sm border">
                    <CardHeader className="py-3 px-4 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-600" /> Accelerometer Impact Log (g)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 px-2">
                      <div className="h-64 w-full">
                        {telemetryHistory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={telemetryHistory}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="time" fontSize={11} />
                              <YAxis fontSize={11} domain={[0, 3]} />
                              <Tooltip />
                              <Line type="monotone" dataKey="composite_shock" name="Shock Impact (g)" stroke="#9333ea" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground p-6">
                            <WifiOff className="h-8 w-8 text-muted shadow-none mb-2" />
                            <p className="font-semibold text-foreground">No Accelerometer Impact Data</p>
                            <p className="mt-1">Connect your ESP32 hardware device to view 3-axis shock measurements.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── TAB 3: Audit Log ── */}
              <TabsContent value="audit" className="space-y-4">
                <Card className="shadow-sm border">
                  <CardHeader className="py-4 px-6 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-emerald-600" /> Supply Chain Timeline Audit
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Immutable milestone trail from harvest registration to mandi arrival
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="relative border-l-2 border-emerald-600/30 ml-4 space-y-8 pl-6">
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-foreground">Crop Harvested & Batch Registered</h4>
                          <span className="text-xs text-muted-foreground">{new Date(batch.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registered by <strong>{batch.farmer_name}</strong> at farm origin ({batch.farmer_location}).
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-foreground">Assigned to Mandi Destination</h4>
                          <span className="text-xs text-muted-foreground">{new Date(batch.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Target Yard: <strong>{batch.mandi_name}</strong> ({batch.mandi_location || "Central Yard"}).
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full bg-purple-600 ring-4 ring-purple-100 dark:ring-purple-950" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-foreground">Current Batch Status</h4>
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Status: <strong>{batch.status}</strong>. {batch.notes ? `Notes: ${batch.notes}` : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Batch Traceability QR Code
            </DialogTitle>
            <DialogDescription className="text-xs">
              Scan this QR code to view public provenance and telemetry logs for Batch #{batch?.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                window.location.href
              )}`}
              alt="Batch QR Code"
              className="w-48 h-48"
            />
            <p className="text-xs font-mono font-semibold text-black mt-3">BATCH ID: {batch?.id}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
