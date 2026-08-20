import { Link } from "react-router-dom";
import { Package, ArrowRight, Truck, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CropJourney() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Live Crop Journey Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor environmental telemetry, IoT sensor logs, and live transit progress for all active crop batches.
          </p>
        </div>

        <Link to="/batches">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Package className="h-4 w-4" /> View All Crop Batches <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Feature Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 shadow-sm border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-600 text-white rounded-xl">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">GPS Live Transit</h3>
              <p className="text-xs text-muted-foreground">Real-time truck positioning & ETA calculations</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">IoT Sensor Telemetry</h3>
              <p className="text-xs text-muted-foreground">Temperature, humidity & shock impact graphs</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Blockchain Verification</h3>
              <p className="text-xs text-muted-foreground">Immutable audit logs and QR traceability codes</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed shadow-sm p-12 bg-muted/20 text-center gap-3">
        <div className="p-4 bg-primary/10 text-primary rounded-full">
          <Package className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Select a Batch to View Live Journey</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Explore individual crop shipments, view real-time environmental telemetry, and track transit routes directly from the Crop Batches directory.
        </p>
        <Link to="/batches" className="mt-2">
          <Button className="gap-2">
            Open Batches Directory <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
