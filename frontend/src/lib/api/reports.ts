import { apiClient as api } from '@/api/http';

export interface ReportEventSummary {
  id: string;
  name: string;
  sessions_total: number;
  sessions_taken: number;
  total_students: number;
  present_total: number;
  absent_total: number;
  attendance_rate: number;
  start_date: string;
  end_date: string;
}

export async function fetchReportEvents() {
  const { data } = await api.get('/api/reports/events');
  return data.events as ReportEventSummary[];
}

export interface ReportSessionRow {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  present: number;
  absent: number;
  attendance_taken: boolean;
}

export async function fetchEventSessions(eventId: string) {
  const { data } = await api.get(`/api/reports/event/${eventId}/sessions`);
  return data as { event: { id: string; name: string }; sessions: ReportSessionRow[]; batch_students: number };
}

export function sessionExportUrl(sessionId: string, filter: 'all'|'present'|'absent'='all') {
  return `${import.meta.env.VITE_API_BASE_URL || ''}/api/reports/session/${sessionId}/export?filter=${filter}`;
}

export function eventExportUrl(eventId: string, filter: 'all'|'present'|'absent'='all') {
  return `${import.meta.env.VITE_API_BASE_URL || ''}/api/reports/event/${eventId}/export?filter=${filter}`;
}

async function downloadBlob(url: string, filename: string) {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 0);
}

export async function downloadSessionPdf(sessionId: string, filter: 'all'|'present'|'absent'='all') {
  const url = `/api/reports/session/${sessionId}/export?filter=${filter}`;
  await downloadBlob(url, `attendance_session_${sessionId}_${filter}.pdf`);
}

export async function downloadEventPdf(eventId: string, filter: 'all'|'present'|'absent'='all') {
  const url = `/api/reports/event/${eventId}/export?filter=${filter}`;
  await downloadBlob(url, `attendance_event_${eventId}_${filter}.pdf`);
}
