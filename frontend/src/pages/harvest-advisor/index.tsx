import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Wheat,
  Apple,
  Sprout,
  Sun,
  Truck,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Upload,
  Package,
  PlusCircle,
  Info,
  RefreshCw,
  MapPin,
  X,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import { Header } from "@/components/layout/header";
import { Search as SearchHeader } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  analyzeHarvest,
  HarvestAnalysisRequest,
  HarvestAnalysisResponse,
} from "@/api/harvest";
import { createBatch, fetchMandiOptions, MandiOption } from "@/api/batch";

// Hackathon Presets for quick demonstration
const CROP_PRESETS = [
  {
    name: "Alphonso Mango 🥭",
    category: "FRUIT" as const,
    crop_name: "Mango",
    variety: "Alphonso",
    transport_hours: 28,
    mandi_name: "Mysuru Mandi",
    current_price: 85,
    expected_price: 102,
    notes: "Full shoulder development, skin transitioning from deep green to light blush.",
  },
  {
    name: "Sharbati Wheat 🌾",
    category: "GRAIN" as const,
    crop_name: "Wheat",
    variety: "Sharbati",
    transport_hours: 18,
    mandi_name: "APMC Central Mandi",
    current_price: 2200,
    expected_price: 2480,
    notes: "Golden yellow panicles, seed moisture drying nicely in field.",
  },
  {
    name: "Desi Chickpea 🫘",
    category: "PULSE" as const,
    crop_name: "Chickpea",
    variety: "Desi (Bengal Gram)",
    transport_hours: 32,
    mandi_name: "Hubballi APMC",
    current_price: 5400,
    expected_price: 6100,
    notes: "Pods turning brown and dry. Rattling seeds inside pods.",
  },
  {
    name: "Roma Tomato 🍅",
    category: "FRUIT" as const,
    crop_name: "Tomato",
    variety: "Roma",
    transport_hours: 14,
    mandi_name: "Kolar Tomato Market",
    current_price: 32,
    expected_price: 44,
    notes: "Breaker stage turning pink. Ideal firm texture for transport.",
  },
];

export default function HarvestAdvisorPage() {
  const navigate = useNavigate();

  // Form State
  const [category, setCategory] = useState<"FRUIT" | "GRAIN" | "PULSE" | "OILSEED">("FRUIT");
  const [cropName, setCropName] = useState<string>("Mango");
  const [variety, setVariety] = useState<string>("Alphonso");
  const [transportHours, setTransportHours] = useState<number>(28);
  const [selectedMandiId, setSelectedMandiId] = useState<string>("");
  const [destinationMandiName, setDestinationMandiName] = useState<string>("Mysuru Mandi");
  const [notes, setNotes] = useState<string>("Shoulder development complete. Transitioning to maturity.");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Mandis Options State
  const [mandiOptions, setMandiOptions] = useState<MandiOption[]>([]);
  const [loadingMandis, setLoadingMandis] = useState<boolean>(false);

  // Analysis Result State
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<HarvestAnalysisResponse | null>(null);

  // Batch Creation Dialog State
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);
  const [batchQuantity, setBatchQuantity] = useState<number>(500);
  const [batchUnit, setBatchUnit] = useState<string>("kg");
  const [creatingBatch, setCreatingBatch] = useState<boolean>(false);

  // Fetch Mandi options on mount
  useEffect(() => {
    setLoadingMandis(true);
    fetchMandiOptions()
      .then((options) => {
        setMandiOptions(options);
        if (options.length > 0) {
          setSelectedMandiId(options[0].id);
          setDestinationMandiName(options[0].mandi_name);
        }
      })
      .catch(() => {
        console.log("Using default mandi list fallback");
      })
      .finally(() => setLoadingMandis(false));
  }, []);

  // Handle Mandi Selection
  const handleMandiChange = (mandiId: string) => {
    setSelectedMandiId(mandiId);
    const selected = mandiOptions.find((m) => m.id === mandiId);
    if (selected) {
      setDestinationMandiName(selected.mandi_name);
    }
  };

  // Load Presets
  const applyPreset = (preset: typeof CROP_PRESETS[0]) => {
    setCategory(preset.category);
    setCropName(preset.crop_name);
    setVariety(preset.variety);
    setTransportHours(preset.transport_hours);
    setDestinationMandiName(preset.mandi_name);
    setNotes(preset.notes);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
  };

  // Run AI Analysis
  const handleRunAnalysis = async () => {
    if (!cropName.trim()) {
      toast.error("Please enter a crop name");
      return;
    }

    setLoading(true);
    try {
      const matchedPreset = CROP_PRESETS.find(
        (p) => p.crop_name.toLowerCase() === cropName.toLowerCase()
      );
      const curPrice = matchedPreset ? matchedPreset.current_price : 85;
      const expPrice = matchedPreset ? matchedPreset.expected_price : 102;

      const req: HarvestAnalysisRequest = {
        crop_category: category,
        crop_name: cropName,
        variety: variety,
        transport_hours: Number(transportHours),
        destination_mandi: destinationMandiName || "Local Mandi",
        current_price: curPrice,
        expected_price: expPrice,
        expected_price_days: 3,
        temperature: 29,
        humidity: 70,
        rain_forecast: "LOW",
        image_base64: previewImage?.startsWith("data:image") ? previewImage : undefined,
        notes: notes.trim() || undefined,
      };

      const res = await analyzeHarvest(req);
      setResult(res);
      toast.success("AI Harvest Analysis complete!");
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to complete AI harvest analysis");
    } finally {
      setLoading(false);
    }
  };

  // Create Batch from AI Recommendation
  const handleCreateBatchFromAI = async () => {
    if (!result) return;
    const mandiIdToUse = selectedMandiId || (mandiOptions.length > 0 ? mandiOptions[0].id : "");

    if (!mandiIdToUse) {
      toast.error("Please select a target Mandi");
      return;
    }

    setCreatingBatch(true);
    try {
      await createBatch({
        crop_name: result.crop_analysis.crop,
        variety: result.crop_analysis.variety,
        quantity: batchQuantity,
        unit: batchUnit,
        farmer_location: "Farm Yard #1",
        mandi_owner_id: mandiIdToUse,
        harvest_date: result.recommendation.recommended_harvest_date,
        notes: `AI Recommendation (${result.recommendation.action}): ${result.recommendation.summary}`,
      });

      toast.success(`Crop Batch created for ${result.recommendation.recommended_harvest_date}!`);
      setBatchModalOpen(false);
      navigate("/batches");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create batch");
    } finally {
      setCreatingBatch(false);
    }
  };

  return (
    <>
      {/* Top Header Layout */}
      <Header>
        <SearchHeader />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 overflow-x-hidden">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              AI Harvest Advisor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Determine optimal harvest timing using computer vision maturity, transport logistics, and mandi trade data.
            </p>
          </div>

          {/* Quick Presets */}
          {/* <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Presets:</span>
            {CROP_PRESETS.map((p, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(p)}
                className="text-xs gap-1 hover:border-primary hover:text-primary transition-colors"
              >
                {p.name}
              </Button>
            ))}
          </div> */}
        </div>

        {/* 1. Full-Width Simplified Crop & Mandi Selection Form */}
        <Card className="shadow-sm border border-border w-full">
          <CardHeader>
            <div>
              <CardTitle className="text-lg font-bold">
                Crop & Destination Parameters
              </CardTitle>
              <CardDescription>
                Upload crop photo (optional), choose category, select target Mandi, and run AI maturity analysis.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Image Drag & Drop Placeholder Area */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Crop Sample Photo
              </Label>
              {previewImage ? (
                <div className="relative w-full h-58 rounded-xl overflow-hidden border shadow-sm bg-black/5 flex items-center justify-center group">
                  <img src={previewImage} alt="Crop sample" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Label htmlFor="crop-image-input" className="cursor-pointer bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow">
                      <Upload className="h-4 w-4" /> Change Photo
                    </Label>
                    <Button type="button" variant="destructive" size="sm" onClick={removeImage} className="gap-1 text-xs">
                      <X className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Label htmlFor="crop-image-input" className="cursor-pointer">
                  <div className="w-full h-36 rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all group">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-full mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Click or drag crop photo to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload a photo for computer vision maturity analysis, or leave blank to analyze using agricultural models</p>
                  </div>
                </Label>
              )}
              <input id="crop-image-input" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Crop Category Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Crop Category</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["FRUIT", "GRAIN", "PULSE", "OILSEED"] as const).map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={category === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(cat)}
                    className="py-3 h-auto flex items-center justify-center gap-2 font-medium text-xs"
                  >
                    {cat === "FRUIT" && <Apple className="h-4 w-4" />}
                    {cat === "GRAIN" && <Wheat className="h-4 w-4" />}
                    {cat === "PULSE" && <Sprout className="h-4 w-4" />}
                    {cat === "OILSEED" && <Sun className="h-4 w-4" />}
                    <span>{cat}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium">Crop Name</Label>
                <Input value={cropName} onChange={(e) => setCropName(e.target.value)} placeholder="e.g. Mango" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium">Variety</Label>
                <Input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. Alphonso" />
              </div>

              {/* Select Mandi Dropdown */}
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Select Target Mandi
                </Label>
                {mandiOptions.length > 0 ? (
                  <Select value={selectedMandiId} onValueChange={handleMandiChange}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue placeholder="Select Mandi" />
                    </SelectTrigger>
                    <SelectContent>
                      {mandiOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.mandi_name} ({m.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={destinationMandiName}
                    onChange={(e) => setDestinationMandiName(e.target.value)}
                    placeholder="e.g. Mysuru Mandi"
                    className="h-9 text-xs"
                  />
                )}
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" /> Transit Duration (Hours)
                </Label>
                <Input type="number" value={transportHours} onChange={(e) => setTransportHours(Number(e.target.value))} className="h-9 text-xs" />
              </div>
            </div>

            {/* Farmer Field Observations (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <span>Farmer Field Observations</span>
                <span className="text-[11px] text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs"
                placeholder="Optional notes e.g. flowering date, pod rattle, skin blush..."
              />
            </div>

            {/* Submit Button (Compact Small Width) */}
            <div className="flex justify-start pt-1">
              <Button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 h-auto text-sm shadow gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Evaluating Harvest Opportunity...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Run AI Harvest Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Full-Width AI Analysis Dashboard Results */}
        {result && (
          <div id="results-section" className="space-y-6 pt-4 border-t w-full overflow-x-hidden">
            {/* Primary Action Banner */}
            <Card className="border-2 border-primary/40 bg-primary/5 shadow-sm w-full">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4 border-border/60">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      PRIMARY HARVEST RECOMMENDATION
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <h2 className="text-3xl font-extrabold tracking-tight text-primary">
                        {result.recommendation.action === "WAIT"
                          ? `🌾 WAIT ${result.recommendation.wait_days} DAYS`
                          : "✂️ HARVEST NOW"}
                      </h2>
                      <Badge className="bg-primary/15 text-primary border-primary/30 font-bold text-xs px-3 py-1">
                        {result.recommendation.confidence}% Confidence
                      </Badge>
                    </div>
                  </div>

                  <Button onClick={() => setBatchModalOpen(true)} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow">
                    <PlusCircle className="h-4 w-4" /> Create Batch from Recommendation
                  </Button>
                </div>

                {/* Timetable Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-background/80 rounded-xl p-4 border border-border/80 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg mt-0.5 shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Recommended Harvest Date</p>
                      <p className="font-bold text-sm truncate">{result.recommendation.recommended_harvest_date}</p>
                      <p className="text-xs text-muted-foreground">Around {result.recommendation.recommended_harvest_time} AM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg mt-0.5 shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Target Mandi Arrival</p>
                      <p className="font-bold text-sm truncate">{result.recommendation.target_arrival_date}</p>
                      <p className="text-xs text-muted-foreground">At {result.recommendation.target_arrival_time} AM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-lg mt-0.5 shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Predicted Arrival Condition</p>
                      <p className="font-bold text-sm truncate">{result.recommendation.target_maturity}</p>
                      <p className="text-xs text-primary font-medium">Optimal Commercial Quality</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm mt-4 text-foreground font-medium leading-relaxed">
                  {result.recommendation.summary}
                </p>
              </CardContent>
            </Card>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
              {/* Opportunity Score Gauge Card */}
              <Card className="lg:col-span-6 shadow-sm border min-w-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">Harvest Opportunity Score</CardTitle>
                    <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/30">
                      {result.opportunity_score.grade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-primary bg-primary/5 shadow-inner shrink-0">
                      <span className="text-3xl sm:text-4xl font-black text-primary">
                        {result.opportunity_score.overall_score}
                      </span>
                      <span className="absolute bottom-2 text-[10px] text-muted-foreground font-bold uppercase">
                        / 100
                      </span>
                    </div>
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Crop Maturity</span>
                          <span>{result.opportunity_score.crop_maturity_score}%</span>
                        </div>
                        <Progress value={result.opportunity_score.crop_maturity_score} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Market Opportunity</span>
                          <span>{result.opportunity_score.market_opportunity_score}%</span>
                        </div>
                        <Progress value={result.opportunity_score.market_opportunity_score} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Transport Safety</span>
                          <span>{result.opportunity_score.transport_safety_score}%</span>
                        </div>
                        <Progress value={result.opportunity_score.transport_safety_score} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <span>Spoilage Risk</span>
                          <span>{result.opportunity_score.spoilage_risk_score}%</span>
                        </div>
                        <Progress value={result.opportunity_score.spoilage_risk_score} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Crop Visual & Maturity Card */}
              <Card className="lg:col-span-6 shadow-sm border min-w-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">Crop Maturity Analysis</CardTitle>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {result.crop_analysis.category} Mode
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs min-w-0">
                    <div className="p-3 bg-muted/40 rounded-xl border min-w-0">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Maturity Stage</span>
                      <span className="font-bold text-sm text-foreground mt-0.5 block truncate">{result.crop_analysis.current_maturity_stage}</span>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border min-w-0">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        {result.crop_analysis.category === "GRAIN" || result.crop_analysis.category === "PULSE"
                          ? "Est. Moisture %"
                          : "Est. Ripeness"}
                      </span>
                      <span className="font-bold text-sm text-primary mt-0.5 block truncate">
                        {result.crop_analysis.category === "GRAIN" || result.crop_analysis.category === "PULSE"
                          ? `${result.crop_analysis.estimated_moisture}%`
                          : `${result.crop_analysis.estimated_ripeness}%`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Visual Maturity Indicators</span>
                    <div className="flex flex-wrap gap-2">
                      {result.crop_analysis.visual_indicators.map((ind, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-medium py-1 px-2.5 bg-background">
                          ✓ {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 28-Hour Journey Timeline */}
            <Card className="shadow-sm border w-full min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <span>Harvest ➔ Transit ➔ Mandi Journey Timeline</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Sequential timeline to ensure target market-ready arrival at {destinationMandiName}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
                  {result.journey_timeline.map((step, idx) => (
                    <div key={idx} className="flex flex-col p-4 bg-muted/30 rounded-xl border space-y-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                          Step {idx + 1} • {step.stage}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">{step.time}</span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground truncate">{step.title}</h4>
                      <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>
                      <div className="pt-2 border-t text-[11px] font-medium text-muted-foreground flex justify-between mt-auto">
                        <span>Date:</span>
                        <span className="font-bold text-foreground">{step.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Intelligence & Decision Factors */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
              {/* Market Intelligence Card */}
              <Card className="lg:col-span-6 shadow-sm border bg-primary/5 border-primary/20 min-w-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                    <TrendingUp className="h-5 w-5" /> Market Price Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background rounded-xl border">
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Current Price</span>
                      <span className="text-xl font-extrabold">₹{result.market_analysis.current_price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block font-medium">Expected Price</span>
                      <span className="text-xl font-extrabold text-primary">₹{result.market_analysis.expected_price}</span>
                    </div>
                    <div className="pl-4 border-l text-center">
                      <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                        +{result.market_analysis.price_change_percent}%
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3.5 bg-background rounded-xl border space-y-1">
                    <span className="text-xs font-bold text-foreground block">Economic Upside</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.market_analysis.economic_recommendation}
                    </p>
                    <p className="text-xs font-bold text-primary mt-1">
                      +₹{result.market_analysis.estimated_extra_value_per_unit} per unit additional value
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Decision Factors */}
              <Card className="lg:col-span-6 shadow-sm border min-w-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" /> Decision Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {result.decision_factors.map((factor, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs p-2 bg-muted/20 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground font-medium leading-normal">{factor}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Harvest Window & Risk Chart */}
            <Card className="shadow-sm border w-full min-w-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Harvest Window & Risk Curve</CardTitle>
                    <CardDescription className="text-xs">
                      5-day projection mapping crop maturity against transport spoilage risk over time.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    5-Day Horizon
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.harvest_window_chart}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="maturity_percent"
                        name="Crop Maturity (%)"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="spoilage_risk_percent"
                        name="Spoilage Risk (%)"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Farmer Action Steps */}
            <Card className="shadow-sm border bg-muted/20 w-full min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Recommended Farmer Field Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                  {result.farmer_action.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-background rounded-xl border text-xs font-medium min-w-0">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-foreground truncate">{act}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mandi Batch Creation Dialog Modal */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Package className="h-5 w-5 text-primary" /> Create Batch from Recommendation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign this harvest batch directly to a Mandi for live tracking.
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/30 space-y-1">
                <div className="flex justify-between font-bold text-primary">
                  <span>{result.crop_analysis.crop} ({result.crop_analysis.variety})</span>
                  <span>{result.recommendation.action}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Scheduled Harvest Date: <strong>{result.recommendation.recommended_harvest_date} at {result.recommendation.recommended_harvest_time} AM</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Mandi Destination</Label>
                {mandiOptions.length > 0 ? (
                  <Select value={selectedMandiId} onValueChange={handleMandiChange}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Choose Mandi Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {mandiOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.mandi_name} ({m.name}) — {m.mandi_location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={destinationMandiName} onChange={(e) => setDestinationMandiName(e.target.value)} className="text-xs" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Quantity</Label>
                  <Input
                    type="number"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Unit</Label>
                  <Select value={batchUnit} onValueChange={setBatchUnit}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="qtl">qtl</SelectItem>
                      <SelectItem value="crates">crates</SelectItem>
                      <SelectItem value="ton">tonnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBatchFromAI}
              disabled={creatingBatch}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {creatingBatch ? "Creating Batch..." : "Create Crop Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
