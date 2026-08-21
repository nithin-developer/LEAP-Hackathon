import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Activity,
  TrendingUp,
  Building2,
  User,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  FileCheck,
  Radio,
  Wifi,
  WifiOff,
  BarChart3,
  Layers3,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores/authStore";
import { fetchBatches, updateBatchStatus, Batch } from "@/api/batch";
import { fetchLiveSensorData, SensorDataPayload } from "@/api/iot";

import { Header } from "@/components/layout/header";
import { Search as SearchHeader } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role || "farmer";
  const userName = user?.full_name || user?.email?.split("@")[0] || "User";

  // Data States
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // IoT Live Sensor Telemetry State
  const [hasHardwareData, setHasHardwareData] = useState<boolean>(false);
  const [liveSensorData, setLiveSensorData] = useState<SensorDataPayload | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<SensorDataPayload[]>([]);

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchBatches({ page: 1, size: 100 });
      setBatches(res.items || []);
    } catch (err: any) {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll Live Telemetry every 2 seconds
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
    } catch {
      setHasHardwareData(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    pollIoTData();

    const interval = setInterval(() => {
      pollIoTData();
    }, 2000);

    return () => clearInterval(interval);
  }, [loadDashboardData, pollIoTData]);

  // Handle Quick Status Change
  const handleQuickStatusChange = async (batchId: string, newStatus: string) => {
    try {
      await updateBatchStatus(batchId, newStatus);
      toast.success(`Batch status updated to ${newStatus}`);
      loadDashboardData();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  // Aggregated Metric Calculations
  const pendingBatches = batches.filter((b) => b.status === "PENDING");
  const acceptedBatches = batches.filter((b) => b.status === "ACCEPTED");
  const inTransitBatches = batches.filter((b) => b.status === "IN_TRANSIT");
  const receivedBatches = batches.filter((b) => b.status === "RECEIVED");
  const rejectedBatches = batches.filter((b) => b.status === "REJECTED");

  const totalQuantityKg = batches.reduce((sum, b) => {
    const qty = Number(b.quantity) || 0;
    return sum + (b.unit === "qtl" ? qty * 100 : b.unit === "ton" ? qty * 1000 : qty);
  }, 0);

  // Status Chart Data
  const statusChartData = [
    { name: "Pending", count: pendingBatches.length, fill: "#f59e0b" },
    { name: "Accepted", count: acceptedBatches.length, fill: "#3b82f6" },
    { name: "In Transit", count: inTransitBatches.length, fill: "#9333ea" },
    { name: "Received", count: receivedBatches.length, fill: "#10b981" },
    { name: "Rejected", count: rejectedBatches.length, fill: "#ef4444" },
  ];

  return (
    <>
      {/* Top Header Navigation */}
      <Header>
        <SearchHeader />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 overflow-x-hidden">
        {/* Top Hero Banner - Role-Based Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back, {userName}!
              </h1>
              <Badge variant="outline" className="text-xs font-semibold uppercase px-2.5 py-0.5 bg-primary/10 text-primary border-primary/30">
                {userRole === "mandi_owner" ? "Mandi Owner" : userRole === "super_admin" ? "System Admin" : "Farmer"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {userRole === "farmer" && "Track your crop harvests, active transport shipments, and AI maturity recommendations."}
              {userRole === "mandi_owner" && "Manage incoming farmer crop batches, yard arrival verification, and mandi trade logistics."}
              {userRole === "super_admin" && "Complete administrative overview of system trade volume, mandi nodes, and IoT sensor network."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasHardwareData ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1.5 font-semibold animate-pulse">
                <Wifi className="h-4 w-4" /> Live Hardware Stream (2s)
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 px-3 py-1.5 font-medium">
                <WifiOff className="h-4 w-4" /> Sensor Hardware Standby
              </Badge>
            )}

            <Button variant="outline" size="sm" onClick={loadDashboardData} className="gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Sync
            </Button>
          </div>
        </div>

        {/* ── 1. ROLE-BASED METRIC CARDS ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
            {/* CARD 1 */}
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 shadow-sm">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-purple-500/20" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>{userRole === "mandi_owner" ? "Total Inbound Batches" : "Total Crop Batches"}</span>
                  <Package className="h-5 w-5 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{batches.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Volume: <strong className="text-foreground">{totalQuantityKg.toLocaleString()} kg</strong>
                </p>
              </CardContent>
            </Card>

            {/* CARD 2 */}
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:from-purple-950/30 dark:to-purple-900/20 shadow-sm border-purple-500/30">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-purple-500/20" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center justify-between">
                  <span>Active In-Transit</span>
                  <Truck className="h-5 w-5 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {inTransitBatches.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  En route to assigned Mandi yards
                </p>
              </CardContent>
            </Card>

            {/* CARD 3 */}
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/20 shadow-sm">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/20" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>{userRole === "mandi_owner" ? "Received at Yard" : "Accepted by Mandi"}</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {userRole === "mandi_owner" ? receivedBatches.length : acceptedBatches.length + receivedBatches.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Verified quality provenance
                </p>
              </CardContent>
            </Card>

            {/* CARD 4 */}
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-amber-50/50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/20 shadow-sm">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-500/20" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Pending Approvals</span>
                  <Clock className="h-5 w-5 text-amber-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {pendingBatches.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting Mandi verification
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 3. VISUAL CHARTS & LIVE INSIGHTS GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
          {/* Chart 1: Real-Time Hardware Telemetry Stream */}
          <Card className="lg:col-span-7 shadow-sm border min-w-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Real-Time IoT Hardware Telemetry Stream
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Live temperature (°C) & humidity (%) polled every 2 seconds from active ESP32 sensor node.
                  </CardDescription>
                </div>
                {hasHardwareData && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                    2s Live Sync
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full min-w-0">
                {telemetryHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetryHistory}>
                      <defs>
                        <linearGradient id="dashTempColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="dashHumColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="time" fontSize={11} />
                      <YAxis fontSize={11} domain={[15, 90]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#2563eb" fillOpacity={1} fill="url(#dashTempColor)" />
                      <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#06b6d4" fillOpacity={1} fill="url(#dashHumColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground p-6 bg-muted/20 rounded-xl border border-dashed">
                    <WifiOff className="h-8 w-8 text-amber-500 mb-2" />
                    <p className="font-bold text-foreground">Sensor Hardware Standby</p>
                    <p className="mt-1 max-w-sm">No live hardware packet stream received yet. Flash your ESP32 board to stream real-time IoT metrics.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Batch Status Distribution */}
          <Card className="lg:col-span-5 shadow-sm border min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Batch Status Breakdown
              </CardTitle>
              <CardDescription className="text-xs">
                Current distribution of crop shipments by supply chain lifecycle stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Batches" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 4. MANDI OWNER PENDING APPROVAL QUEUE OR FARMER SHIPMENTS ── */}
        <Card className="shadow-sm border min-w-0">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                {userRole === "mandi_owner" ? (
                  <>
                    <Building2 className="h-5 w-5 text-primary" /> Incoming Mandi Verification Queue
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5 text-primary" /> Active Crop Shipments
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {userRole === "mandi_owner"
                  ? "Batches pending your yard acceptance or currently in transit."
                  : "Recent registered crop batches and transport status."}
              </CardDescription>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigate("/batches")} className="gap-1 text-xs">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>

          <CardContent>
            {batches.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <Package className="h-8 w-8 text-muted mx-auto mb-2" />
                <p className="font-semibold text-foreground">No Crop Batches Found</p>
                <p className="mt-1">Create a new batch from the Harvest Advisor or Batches page.</p>
              </div>
            ) : (
              <div className="divide-y rounded-xl border overflow-hidden">
                {batches.slice(0, 5).map((b) => (
                  <div key={b.id} className="p-4 bg-card hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{b.crop_name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-medium">
                          {b.variety || "Standard"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            b.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : b.status === "ACCEPTED"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              : b.status === "IN_TRANSIT"
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/30 animate-pulse"
                              : b.status === "RECEIVED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-red-500/10 text-red-600 border-red-500/30"
                          }
                        >
                          {b.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Farmer: <strong>{b.farmer_name}</strong> ({b.farmer_location}) ➔ Mandi: <strong>{b.mandi_name}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-foreground">{b.quantity} {b.unit}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(b.harvest_date).toLocaleDateString()}</p>
                      </div>

                      {/* Mandi Owner Quick Actions */}
                      {userRole === "mandi_owner" && b.status === "PENDING" && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatusChange(b.id, "ACCEPTED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[11px] px-2.5"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleQuickStatusChange(b.id, "REJECTED")}
                            className="h-7 text-[11px] px-2.5"
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/batches/${b.id}`)}
                        className="h-7 text-[11px]"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
