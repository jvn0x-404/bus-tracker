export type AppRole = 'admin' | 'driver' | 'student';

export interface Profile {
  id: string;
  full_name: string | null;
  name: string | null;
  role: AppRole;
  is_active: boolean;
  student_id: string | null;
  phone: string | null;
  department: string | null;
}

export interface Bus {
  id: string;
  bus_number: string;
  registration_number: string | null;
  capacity: number | null;
  status: string;
  make_model: string | null;
}

export interface Trip {
  id: string;
  route_id: string;
  bus_id: string;
  driver_id: string;
  service_date: string;
  scheduled_start: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface BusLocation {
  bus_id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  accuracy_m: number | null;
  speed_mps: number | null;
  heading_degrees: number | null;
  measured_at: string;
  received_at: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  read_at: string | null;
  trip_id: string | null;
}

export interface Route {
  id: string;
  name: string;
  route_code: string | null;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface RouteStopRow {
  route_id: string;
  stop_id: string;
  stop_order: number;
  sequence_no: number;
  stops: Stop | null;
}

export interface MapSnapshot {
  trips: Trip[];
  buses: Bus[];
  routes: Route[];
  routeStops: RouteStopRow[];
  locations: BusLocation[];
}
