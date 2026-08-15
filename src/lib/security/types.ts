export type Severity = "info" | "low" | "medium" | "high" | "critical";
export type CameraStatus = "online" | "offline" | "warning" | "alert";
export type AppRole = "admin" | "operator" | "viewer";

export interface Camera {
  id: string;
  name: string;
  camera_code: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  camera_type: string;
  field_of_view: number | null;
  zone_id: string | null;
  status: string;
  recording: boolean;
  last_heartbeat: string | null;
  stream_url: string | null;
  preview_url: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  description: string | null;
  zone_type: string;
  polygon: unknown;
  rules: unknown;
  color: string | null;
  is_demo: boolean;
}

export interface Person {
  id: string;
  internal_id: string;
  name: string;
  role: string | null;
  organization: string | null;
  permission_level: string;
  photo_url: string | null;
  active: boolean;
  enrolled_at: string;
  is_demo: boolean;
}

export interface SecurityEvent {
  id: string;
  camera_id: string | null;
  zone_id: string | null;
  person_id: string | null;
  event_type: string;
  severity: string;
  confidence: number | null;
  snapshot_url: string | null;
  details: Record<string, unknown> | null;
  occurred_at: string;
  is_demo: boolean;
}

export interface Alert {
  id: string;
  event_id: string | null;
  title: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const SEVERITY_ORDER: Severity[] = ["info", "low", "medium", "high", "critical"];

export const DETECTION_TYPES = [
  "person",
  "vehicle",
  "animal",
  "package",
  "motion",
  "intrusion",
  "loitering",
  "crowd",
  "tampering",
] as const;

export const severityClass = (s: string) => {
  switch (s) {
    case "critical":
      return "text-accent border-accent/50 bg-accent/10";
    case "high":
      return "text-orange-400 border-orange-400/50 bg-orange-400/10";
    case "medium":
      return "text-yellow-400 border-yellow-400/50 bg-yellow-400/10";
    case "low":
      return "text-primary border-primary/50 bg-primary/10";
    default:
      return "text-muted-foreground border-border bg-muted/30";
  }
};

export const statusColor = (s: string) => {
  switch (s) {
    case "online":
      return "#22c55e";
    case "warning":
      return "#eab308";
    case "alert":
      return "#f43f5e";
    default:
      return "#6b7280";
  }
};
