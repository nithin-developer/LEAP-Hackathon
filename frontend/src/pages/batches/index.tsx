import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  type FilterFn,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  fetchBatches,
  createBatch,
  updateBatchStatus,
  fetchMandiOptions,
  Batch,
  MandiOption,
  BatchCreateInput,
} from "@/api/batch";
import { Header } from "@/components/layout/header";
import { Search as SearchHeader } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/stores/authStore";
import { cn } from "@/utils/utils";
import { DataTablePagination } from "./components/data-table-pagination";
import {
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  ShieldAlert,
  Calendar as CalendarIcon,
  User,
  MapPin,
  X,
  MoreHorizontal,
  Building2,
} from "lucide-react";

export default function BatchesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;
  const isFarmer = user?.role === "farmer";
  const isMandiOwner = user?.role === "mandi_owner";

  // Data states
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Dialog & Form states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [mandiOptions, setMandiOptions] = React.useState<MandiOption[]>([]);

  const [formData, setFormData] = React.useState<BatchCreateInput>({
    crop_name: "",
    variety: "",
    quantity: 100,
    unit: "kg",
    farmer_location: "",
    mandi_owner_id: "",
    harvest_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Load Mandi Options for Farmer
  React.useEffect(() => {
    if (isFarmer) {
      fetchMandiOptions()
        .then((options) => {
          setMandiOptions(options);
          if (options.length > 0) {
            setFormData((prev) => ({ ...prev, mandi_owner_id: options[0].id }));
          }
        })
        .catch((err) => console.error("Failed to load mandi options:", err));
    }
  }, [isFarmer]);

  // Load Batches
  const load = React.useCallback(() => {
    setLoading(true);
    fetchBatches({ page: 1, size: 100 })
      .then((res) => setBatches(res.items))
      .catch(() => toast.error("Failed to load batches"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Handle Create Batch
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_name.trim()) {
      toast.error("Please enter a crop name");
      return;
    }
    if (!formData.mandi_owner_id) {
      toast.error("Please select a Mandi");
      return;
    }
    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await createBatch({
        ...formData,
        harvest_date: new Date(formData.harvest_date).toISOString(),
      });
      toast.success("Crop batch created and assigned successfully!");
      setIsCreateOpen(false);
      setFormData({
        crop_name: "",
        variety: "",
        quantity: 100,
        unit: "kg",
        farmer_location: "",
        mandi_owner_id: mandiOptions[0]?.id || "",
        harvest_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Status Change Handler
  const handleStatusChange = async (batchId: string, newStatus: string) => {
    try {
      await updateBatchStatus(batchId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Update failed");
    }
  };

  // Filter options for Mandi filter (for Farmers) or Farmer filter (for Mandi Owners)
  const filterOptions = React.useMemo(() => {
    if (isFarmer) {
      return Array.from(new Set(batches.map((b) => b.mandi_name).filter(Boolean))).sort();
    } else {
      return Array.from(new Set(batches.map((b) => b.farmer_name).filter(Boolean))).sort();
    }
  }, [batches, isFarmer]);

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 gap-1 font-medium">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Accepted
          </Badge>
        );
      case "IN_TRANSIT":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 font-medium">
            <Truck className="w-3 h-3" /> In Transit
          </Badge>
        );
      case "RECEIVED":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Received
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 gap-1 font-medium">
            <ShieldAlert className="w-3 h-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // TanStack Global Filter function
  const globalFilterFn: FilterFn<Batch> = React.useCallback((row, _col, value) => {
    const search = (value as string).toLowerCase();
    if (!search) return true;
    return ["crop_name", "variety", "farmer_name", "farmer_location", "mandi_name"].some((key) => {
      const v = row.getValue<any>(key);
      return v ? String(v).toLowerCase().includes(search) : false;
    });
  }, []);

  // TanStack Columns definition tailored to user role
  const columns = React.useMemo<ColumnDef<Batch>[]>(
    () => [
      {
        accessorKey: "crop_name",
        header: "Crop Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span
              className="font-medium hover:underline cursor-pointer"
              onClick={() => navigate(`/batches/${row.original.id}`)}
            >
              {row.original.crop_name}
            </span>
            {row.original.variety && (
              <span className="text-xs text-muted-foreground">Var: {row.original.variety}</span>
            )}
          </div>
        ),
        meta: { className: "min-w-[160px]" },
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.quantity}{" "}
            <span className="text-xs font-normal text-muted-foreground">{row.original.unit}</span>
          </span>
        ),
      },
      // If Mandi Owner, show Farmer Origin column
      ...(isMandiOwner || !isFarmer
        ? [
            {
              accessorKey: "farmer_name",
              header: "Farmer Origin",
              cell: ({ row }: any) => (
                <div className="flex flex-col text-xs">
                  <span className="font-medium flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" /> {row.original.farmer_name}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {row.original.farmer_location}
                  </span>
                </div>
              ),
              filterFn: (row: any, columnId: string, value: any) => {
                if (!value) return true;
                return row.getValue(columnId) === value;
              },
              meta: { className: "hidden md:table-cell" },
            } as ColumnDef<Batch>,
          ]
        : []),
      // If Farmer, show Assigned Mandi column
      ...(isFarmer
        ? [
            {
              accessorKey: "mandi_name",
              header: "Assigned Mandi",
              cell: ({ row }: any) => (
                <div className="flex flex-col text-xs">
                  <span className="font-medium flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" /> {row.original.mandi_name}
                  </span>
                  {row.original.mandi_location && (
                    <span className="text-muted-foreground">{row.original.mandi_location}</span>
                  )}
                </div>
              ),
              filterFn: (row: any, columnId: string, value: any) => {
                if (!value) return true;
                return row.getValue(columnId) === value;
              },
              meta: { className: "hidden lg:table-cell" },
            } as ColumnDef<Batch>,
          ]
        : []),
      {
        accessorKey: "harvest_date",
        header: "Harvest Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5" />
            {new Date(row.original.harvest_date).toLocaleDateString()}
          </div>
        ),
        meta: { className: "hidden sm:table-cell" },
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        cell: ({ row }) => renderStatusBadge(row.original.status),
        filterFn: (row, columnId, value) => {
          if (!value) return true;
          return row.getValue(columnId) === value;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/batches/${row.original.id}`)}
              className="gap-1"
            >
              <Eye className="h-3.5 w-3.5" /> Details
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange(row.original.id, "ACCEPTED")}
                  disabled={row.original.status === "ACCEPTED"}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-blue-600" /> Accept Batch
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(row.original.id, "IN_TRANSIT")}
                  disabled={row.original.status === "IN_TRANSIT"}
                >
                  <Truck className="h-3.5 w-3.5 mr-2 text-purple-600" /> Mark In Transit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(row.original.id, "RECEIVED")}
                  disabled={row.original.status === "RECEIVED"}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-600" /> Mark Received
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange(row.original.id, "REJECTED")}
                  disabled={row.original.status === "REJECTED"}
                  className="text-red-600 focus:text-red-600"
                >
                  <ShieldAlert className="h-3.5 w-3.5 mr-2" /> Reject Batch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 160,
        meta: { className: "text-right" },
      },
    ],
    [navigate, isFarmer, isMandiOwner]
  );

  const table = useReactTable({
    data: batches,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const secondaryFilterCol = isFarmer ? "mandi_name" : "farmer_name";
  const secondaryFilterVal = table.getColumn(secondaryFilterCol)?.getFilterValue() as string | undefined;
  const statusFilterVal = table.getColumn("status")?.getFilterValue() as string | undefined;
  const hasActiveFilters = !!globalFilter || !!secondaryFilterVal || !!statusFilterVal;

  const clearFilters = () => {
    setGlobalFilter("");
    table.getColumn(secondaryFilterCol)?.setFilterValue(undefined);
    table.getColumn("status")?.setFilterValue(undefined);
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

      <div className="container mx-auto p-6 space-y-6">
        {/* Title and Top Action Bar tailored per role */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isFarmer
                ? "My Crop Batches"
                : isMandiOwner
                ? "Mandi Incoming Batches"
                : "Crop Batches"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isFarmer
                ? "Manage and track your crop shipments assigned to Mandis."
                : isMandiOwner
                ? "Review and manage crop batches assigned to your Mandi yard."
                : "Directory of crop batches across farmers and Mandis."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            {isFarmer && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Batch
              </Button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {/* Table & Toolbar Section */}
        {!loading && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div
              className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
              role="toolbar"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
                <div className="flex-1 max-w-[260px]">
                  <Input
                    placeholder="Search batches..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Secondary Filter: Mandi (for Farmer) or Farmer (for Mandi Owner) */}
                  <Select
                    value={secondaryFilterVal ?? undefined}
                    onValueChange={(v) => {
                      if (v === "__all") table.getColumn(secondaryFilterCol)?.setFilterValue(undefined);
                      else table.getColumn(secondaryFilterCol)?.setFilterValue(v);
                    }}
                  >
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue placeholder={isFarmer ? "Mandi" : "Farmer"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{isFarmer ? "All Mandis" : "All Farmers"}</SelectItem>
                      {filterOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select
                    value={statusFilterVal ?? undefined}
                    onValueChange={(v) => {
                      if (v === "__all") table.getColumn("status")?.setFilterValue(undefined);
                      else table.getColumn("status")?.setFilterValue(v);
                    }}
                  >
                    <SelectTrigger className="h-9 w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                      <SelectItem value="RECEIVED">Received</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Reset Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-1" /> Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="group/row">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className={cn(
                            "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted whitespace-nowrap",
                            (header.column.columnDef.meta as any)?.className ?? ""
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="group/row cursor-pointer"
                        onClick={() => navigate(`/batches/${row.original.id}`)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted whitespace-nowrap text-xs sm:text-sm",
                              (cell.column.columnDef.meta as any)?.className ?? ""
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-28 text-center text-muted-foreground"
                      >
                        {hasActiveFilters
                          ? "No batches match the current filters."
                          : isFarmer
                          ? "No crop batches created yet. Click 'Add Batch' above to create one."
                          : "No incoming crop batches assigned to your Mandi yet."}
                        {hasActiveFilters && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                            >
                              Reset Filters
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <DataTablePagination table={table} />
          </div>
        )}
      </div>

      {/* Add Batch Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Batch</DialogTitle>
            <DialogDescription>
              Provide crop yield details and assign to a Mandi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="crop_name">Crop Name *</Label>
                <Input
                  id="crop_name"
                  placeholder="e.g. Organic Wheat"
                  value={formData.crop_name}
                  onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="variety">Variety</Label>
                <Input
                  id="variety"
                  placeholder="e.g. Sharbati / Lokwan"
                  value={formData.variety || ""}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="any"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(val) => setFormData({ ...formData, unit: val })}
                  disabled={submitting}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="quintal">Quintals (qtl)</SelectItem>
                    <SelectItem value="ton">Tons</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="mandi">Assign Mandi Owner *</Label>
                <Select
                  value={formData.mandi_owner_id}
                  onValueChange={(val) => setFormData({ ...formData, mandi_owner_id: val })}
                  disabled={submitting}
                >
                  <SelectTrigger id="mandi">
                    <SelectValue placeholder="Select Mandi" />
                  </SelectTrigger>
                  <SelectContent>
                    {mandiOptions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No registered Mandi Owners found
                      </SelectItem>
                    ) : (
                      mandiOptions.map((mandi) => (
                        <SelectItem key={mandi.id} value={mandi.id}>
                          {mandi.mandi_name} ({mandi.name} - {mandi.mandi_location})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="farmer_location">Farmer Location</Label>
                <Input
                  id="farmer_location"
                  placeholder="e.g. Mysuru, KA"
                  value={formData.farmer_location}
                  onChange={(e) => setFormData({ ...formData, farmer_location: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="harvest_date">Harvest Date *</Label>
                <Input
                  id="harvest_date"
                  type="date"
                  value={formData.harvest_date}
                  onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Moisture content 12%, stored in jute bags..."
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Create Batch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
