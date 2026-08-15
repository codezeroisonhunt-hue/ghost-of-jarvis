import { supabase } from "@/integrations/supabase/client";

// All demo data is SYNTHETIC. Names are fictional; no real people, no real
// identities and no real biometric data are used anywhere in this app.

const DEMO_ZONES = [
  { name: "Main Entrance", zone_type: "entrance", description: "Primary building access point", color: "#22d3ee" },
  { name: "Restricted Area", zone_type: "restricted", description: "Authorized personnel only", color: "#f43f5e" },
  { name: "Parking Area", zone_type: "parking", description: "Visitor and staff parking", color: "#eab308" },
  { name: "Server Room", zone_type: "restricted", description: "Critical infrastructure", color: "#f43f5e" },
  { name: "Warehouse", zone_type: "storage", description: "Goods handling and storage", color: "#22d3ee" },
  { name: "Perimeter", zone_type: "perimeter", description: "Outer fence line", color: "#a78bfa" },
];

const DEMO_CAMERAS = [
  { name: "Main Entrance Cam", camera_code: "CAM-01", location: "HQ North — Lobby", latitude: 12.9716, longitude: 77.5946, camera_type: "Dome", field_of_view: 110, status: "online", recording: true, zone: "Main Entrance" },
  { name: "Lobby Overview", camera_code: "CAM-02", location: "HQ North — Lobby", latitude: 12.9721, longitude: 77.5951, camera_type: "PTZ", field_of_view: 360, status: "online", recording: true, zone: "Main Entrance" },
  { name: "Server Room Cam", camera_code: "CAM-03", location: "HQ North — Level 2", latitude: 12.9709, longitude: 77.5939, camera_type: "Bullet", field_of_view: 90, status: "warning", recording: true, zone: "Server Room" },
  { name: "Warehouse North", camera_code: "CAM-04", location: "Depot East — North Gate", latitude: 12.9812, longitude: 77.6101, camera_type: "Bullet", field_of_view: 100, status: "alert", recording: true, zone: "Warehouse" },
  { name: "Parking Deck", camera_code: "CAM-05", location: "Depot East — Parking", latitude: 12.9805, longitude: 77.6088, camera_type: "Dome", field_of_view: 120, status: "online", recording: false, zone: "Parking Area" },
  { name: "Perimeter West", camera_code: "CAM-06", location: "Yard South — Fence Line", latitude: 12.9601, longitude: 77.5822, camera_type: "Thermal", field_of_view: 80, status: "offline", recording: false, zone: "Perimeter" },
];

const DEMO_PEOPLE = [
  { internal_id: "EMP-1001", name: "Alex Mercer", role: "Security Staff", organization: "Site Operations", permission_level: "elevated" },
  { internal_id: "EMP-1002", name: "Rhea Kapoor", role: "Facilities Manager", organization: "Site Operations", permission_level: "elevated" },
  { internal_id: "EMP-1003", name: "Daniel Osei", role: "Network Engineer", organization: "IT Infrastructure", permission_level: "restricted" },
  { internal_id: "EMP-1004", name: "Mei Tanaka", role: "Warehouse Lead", organization: "Logistics", permission_level: "standard" },
  { internal_id: "EMP-1005", name: "Tomas Iversen", role: "Night Supervisor", organization: "Site Operations", permission_level: "standard" },
];

export async function seedDemoData() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  // Zones
  const { data: zones } = await supabase
    .from("security_zones")
    .insert(DEMO_ZONES.map((z) => ({ ...z, is_demo: true, created_by: uid })))
    .select();

  const zoneMap = new Map((zones ?? []).map((z) => [z.name, z.id]));

  // Cameras
  const { data: cameras } = await supabase
    .from("security_cameras")
    .insert(
      DEMO_CAMERAS.map(({ zone, ...c }) => ({
        ...c,
        zone_id: zoneMap.get(zone) ?? null,
        is_demo: true,
        created_by: uid,
        last_heartbeat: c.status === "offline" ? new Date(Date.now() - 42 * 60000).toISOString() : new Date().toISOString(),
      }))
    )
    .select();

  // People
  const { data: people } = await supabase
    .from("authorized_people")
    .insert(DEMO_PEOPLE.map((p) => ({ ...p, is_demo: true, created_by: uid })))
    .select();

  // Events
  const camList = cameras ?? [];
  const peopleList = people ?? [];
  const now = Date.now();

  const eventSpecs = [
    { type: "intrusion", severity: "critical", cam: 3, person: null, conf: 0.94, mins: 4 },
    { type: "person", severity: "info", cam: 0, person: 0, conf: 0.96, mins: 11 },
    { type: "vehicle", severity: "low", cam: 4, person: null, conf: 0.91, mins: 18 },
    { type: "tampering", severity: "high", cam: 5, person: null, conf: 0.88, mins: 27 },
    { type: "loitering", severity: "medium", cam: 1, person: null, conf: 0.79, mins: 35 },
    { type: "person", severity: "info", cam: 2, person: 2, conf: 0.93, mins: 46 },
    { type: "package", severity: "low", cam: 0, person: null, conf: 0.85, mins: 58 },
    { type: "crowd", severity: "medium", cam: 1, person: null, conf: 0.82, mins: 72 },
    { type: "animal", severity: "info", cam: 5, person: null, conf: 0.74, mins: 95 },
    { type: "motion", severity: "info", cam: 4, person: null, conf: 0.9, mins: 110 },
    { type: "person", severity: "info", cam: 0, person: 1, conf: 0.97, mins: 130 },
    { type: "vehicle", severity: "info", cam: 4, person: null, conf: 0.89, mins: 155 },
  ];

  const { data: events } = await supabase
    .from("security_events")
    .insert(
      eventSpecs.map((e) => ({
        camera_id: camList[e.cam]?.id ?? null,
        zone_id: camList[e.cam]?.zone_id ?? null,
        person_id: e.person !== null ? peopleList[e.person]?.id ?? null : null,
        event_type: e.type,
        severity: e.severity,
        confidence: e.conf,
        details: {
          simulation: true,
          label: e.person !== null ? "Authorized person detected" : "Unclassified detection",
          ...(e.type === "vehicle" ? { vehicle_class: "van", plate: "SIMULATED" } : {}),
        } as never,
        occurred_at: new Date(now - e.mins * 60000).toISOString(),
        is_demo: true,
      }))
    )
    .select();

  // Alerts from the notable events
  const evList = events ?? [];
  const alertFrom = [
    { i: 0, title: "CRITICAL SECURITY EVENT", message: "Unauthorized person detected in Restricted Zone.", severity: "critical" },
    { i: 3, title: "CAMERA TAMPERING", message: "Possible tampering detected on Perimeter West.", severity: "high" },
    { i: 4, title: "LOITERING DETECTED", message: "Subject stationary in lobby for over 6 minutes.", severity: "medium" },
    { i: 2, title: "VEHICLE ENTRY", message: "Vehicle entered Parking Area outside scheduled hours.", severity: "low" },
  ];

  await supabase.from("security_alerts").insert(
    alertFrom
      .filter((a) => evList[a.i])
      .map((a) => ({
        event_id: evList[a.i].id,
        title: a.title,
        message: a.message,
        severity: a.severity,
        is_demo: true,
      }))
  );

  return { zones: zones?.length ?? 0, cameras: camList.length, people: peopleList.length, events: evList.length };
}

export async function clearDemoData() {
  await supabase.from("security_alerts").delete().eq("is_demo", true);
  await supabase.from("security_events").delete().eq("is_demo", true);
  await supabase.from("security_cameras").delete().eq("is_demo", true);
  await supabase.from("authorized_people").delete().eq("is_demo", true);
  await supabase.from("security_zones").delete().eq("is_demo", true);
}
