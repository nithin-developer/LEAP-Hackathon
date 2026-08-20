import { apiClient } from "@/api/http";

export interface Batch {
  id: string;
  crop_name: string;
  variety?: string;
  quantity: number;
  unit: string;
  farmer_id: string;
  farmer_name: string;
  farmer_email: string;
  farmer_location: string;
  mandi_owner_id: string;
  mandi_name: string;
  mandi_location?: string;
  status: "PENDING" | "ACCEPTED" | "IN_TRANSIT" | "RECEIVED" | "REJECTED";
  harvest_date: string;
  created_at: string;
  notes?: string;
}

export interface BatchCreateInput {
  crop_name: string;
  variety?: string;
  quantity: number;
  unit: string;
  farmer_location: string;
  mandi_owner_id: string;
  harvest_date: string;
  notes?: string;
}

export interface BatchPaginatedResponse {
  items: Batch[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface MandiOption {
  id: string;
  name: string;
  mandi_name: string;
  mandi_location?: string;
}

export async function fetchMandiOptions(): Promise<MandiOption[]> {
  const res = await apiClient.get("/api/mandis");
  return res.data;
}

export async function createBatch(data: BatchCreateInput): Promise<Batch> {
  const res = await apiClient.post("/api/batches", data);
  return res.data;
}

export async function fetchBatches(params?: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
}): Promise<BatchPaginatedResponse> {
  const res = await apiClient.get("/api/batches", { params });
  return res.data;
}

export async function fetchBatchById(id: string): Promise<Batch> {
  const res = await apiClient.get(`/api/batches/${id}`);
  return res.data;
}

export async function updateBatchStatus(
  batchId: string,
  status: string,
  notes?: string
): Promise<Batch> {
  const res = await apiClient.patch(`/api/batches/${batchId}/status`, {
    status,
    notes,
  });
  return res.data;
}
