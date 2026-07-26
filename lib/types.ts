// ============================================================
// Aqua Safari Security — Control Room Management System
// Type Definitions
// ============================================================

// ---------- Common ----------
export interface BaseRecord {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ---------- Auth & Users ----------
export type UserRole = 'admin' | 'officer' | 'supervisor' | 'manager';

export interface User extends BaseRecord {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  signatureCode?: string;
  department?: string;
}

export interface AuthSession {
  user: Pick<User, '_id' | 'name' | 'email' | 'role' | 'avatar' | 'signatureCode'>;
  token: string;
}

// ---------- Module 2: Received Goods ----------
export type GoodsCondition = 'good' | 'damaged';

export interface GoodsEntry extends BaseRecord {
  date: string;
  time: string;
  itemDescription: string;
  quantity: number;
  quantityUnit?: string;
  departmentReceiving: string;
  receivedBy: string;
  storesPersonName?: string;
  securityOfficer: string;
  signature?: string;
}

// ---------- Module 3: Day Visitors ----------
export type VisitorStatus = 'inside' | 'checked-out';
export type IDType = 'national-id' | 'passport' | 'drivers-license' | 'voter-id' | 'other';

export interface Visitor extends BaseRecord {
  date: string;
  timeIn: string;
  timeOut?: string;
  visitorName: string;
  phoneNumber: string;
  company: string;
  personVisiting: string;
  department: string;
  purpose: string;
  idType: IDType;
  idNumber: string;
  vehicleNumber?: string;
  visitorPassNumber: string;
  securityOfficer: string;
  remarks?: string;
  status: VisitorStatus;
  photo?: string;
  qrCode?: string;
}

// ---------- Module 4: Tips Received ----------
export type TipSource = 'anonymous' | 'staff' | 'visitor' | 'police' | 'public';
export type TipCategory = 'theft' | 'suspicious-person' | 'fraud' | 'safety' | 'emergency' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TipStatus = 'open' | 'investigating' | 'closed';

export interface Tip extends BaseRecord {
  date: string;
  time: string;
  source: TipSource;
  tipCategory: TipCategory;
  description: string;
  location: string;
  priority: Priority;
  assignedTo: string;
  status: TipStatus;
  attachment?: string;
  officerRecording: string;
}

// ---------- Module 5: Playback Upload ----------
export type ExportFormat = 'mp4' | 'avi' | 'mkv' | 'other';

export interface PlaybackEntry extends BaseRecord {
  dateRequested: string;
  timeRequested: string;
  cameraNumber: string;
  cameraLocation: string;
  incidentDate: string;
  incidentTime: string;
  requestedBy: string;
  department: string;
  reason: string;
  footageDuration: string;
  exportFormat: ExportFormat;
  storageLocation: string;
  uploadedBy?: string;
  uploadDate?: string;
  evidenceNumber: string;
  remarks?: string;
  playbackFile?: string;
  screenshot?: string;
}

// ---------- Module 6: Incident Log ----------
export type IncidentType = 'theft' | 'assault' | 'fire' | 'medical' | 'vandalism' | 'trespassing' | 'accident' | 'other';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Incident extends BaseRecord {
  date: string;
  time: string;
  incidentType: IncidentType;
  location: string;
  description: string;
  officerReporting: string;
  actionTaken: string;
  personsInvolved: string;
  evidence?: string;
  status: IncidentStatus;
}

// ---------- Module 7: Shift Handover ----------
export type ShiftType = 'morning' | 'afternoon' | 'night';

export interface ShiftHandover extends BaseRecord {
  date: string;
  outgoingOfficer: string;
  incomingOfficer: string;
  shift: ShiftType;
  outstandingIssues: string;
  equipmentStatus: string;
  patrolNotes: string;
  visitorsStillInside: number;
  goodsPendingCollection: number;
  signature?: string;
}

// ---------- Module 8: Equipment Register ----------
export interface EquipmentEntry extends BaseRecord {
  dateIssued: string;
  timeIssued: string;
  itemName: string;
  serialNumber: string;
  issuedTo: string;
  department: string;
  purpose: string;
  conditionOnIssue: string;
  remarks?: string;
  status: string;
  timeReturned?: string;
  conditionOnReturn?: string;
  returnedTo?: string;
  issuedBy: string;
}

// ---------- Module 9: Vehicle Register ----------
export interface VehicleEntry extends BaseRecord {
  date: string;
  timeIn: string;
  timeOut?: string;
  registrationNumber: string;
  vehicleType: string;
  driverName: string;
  company?: string;
  purpose: string;
  destination: string;
  remarks?: string;
  status: string;
  officer: string;
}

// ---------- Module 10: Lost & Found ----------
export interface LostFoundEntry extends BaseRecord {
  dateFound: string;
  timeFound: string;
  itemDescription: string;
  category: string;
  locationFound: string;
  foundBy: string;
  finderContact?: string;
  storageLocation: string;
  status: string;
  claimedBy?: string;
  claimantId?: string;
  claimantPhone?: string;
  dateClaimed?: string;
  receivingOfficer: string;
}

// ---------- Module 11: Daily Occurrence Book ----------
export type OBCategory = 'delivery' | 'visitor' | 'playback' | 'goods' | 'patrol' | 'tip' | 'shift' | 'incident' | 'equipment' | 'vehicle' | 'lost-found' | 'general';

export interface OBEntry extends BaseRecord {
  date: string;
  time: string;
  entry: string;
  officer: string;
  category: OBCategory;
  priority: Priority;
}

// ---------- Module 13: Notifications ----------
export type NotificationType = 'visitor-overstay' | 'high-priority-tip' | 'incident-created' | 'playback-pending' | 'shift-handover-due' | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

// ---------- Dashboard Stats ----------
export interface DashboardStats {
  totalVisitorsToday: number;
  goodsReceivedToday: number;
  tipsReceived: number;
  playbackRequests: number;
  pendingIncidents: number;
  staffOnDuty: number;
}

// ---------- Reports ----------
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'visitor' | 'goods' | 'playback' | 'incident' | 'tips' | 'officer-activity';
export type ExportType = 'pdf' | 'excel';

// ---------- Settings ----------
export interface AppSettings {
  shiftTimes: {
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
    night: { start: string; end: string };
  };
  departments: string[];
  locations: string[];
  visitorOverstayMinutes: number;
}

// ---------- Navigation ----------
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
  roles?: UserRole[];
}
