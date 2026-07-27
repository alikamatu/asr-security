import mongoose, { Schema, type Model } from 'mongoose';

// ============================================================
// User Model
// ============================================================
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'officer', 'supervisor', 'manager'], default: 'officer' },
    department: { type: String, default: 'Security' },
    signatureCode: { type: String },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// ============================================================
// Goods Entry Model
// ============================================================
const GoodsEntrySchema = new Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    itemDescription: { type: String, required: true },
    quantity: { type: Number, required: true },
    quantityUnit: { type: String, enum: ['pcs', 'kg', 'gallon', 'bag', 'pack'], default: 'pcs' },
    hasRemainder: { type: Boolean, default: false },
    remainder: { type: Number },
    departmentReceiving: { type: String, required: true },
    receivedBy: { type: String, required: true },
    storesPersonName: { type: String },
    securityOfficer: { type: String, required: true },
    signature: { type: String },
    status: { type: String, enum: ['Recorded', 'Approved', 'Remainder'], default: 'Recorded' },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    approvalSignature: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Visitor Model
// ============================================================
const VisitorSchema = new Schema(
  {
    date: { type: String, required: true },
    timeIn: { type: String, required: true },
    timeOut: { type: String },
    visitorName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    company: { type: String },
    personVisiting: { type: String, required: true },
    department: { type: String, required: true },
    purpose: { type: String, required: true },
    idType: { type: String, enum: ['national-id', 'passport', 'drivers-license', 'voter-id', 'other'] },
    idNumber: { type: String },
    vehicleNumber: { type: String },
    visitorPassNumber: { type: String, required: true },
    securityOfficer: { type: String, required: true },
    remarks: { type: String },
    status: { type: String, enum: ['inside', 'checked-out'], default: 'inside' },
    photo: { type: String },
    qrCode: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Tip Model
// ============================================================
const TipSchema = new Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    source: { type: String, enum: ['anonymous', 'staff', 'visitor', 'police', 'public'], required: true },
    tipCategory: { type: String, enum: ['theft', 'suspicious-person', 'fraud', 'safety', 'emergency', 'other'], required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    assignedTo: { type: String },
    status: { type: String, enum: ['open', 'investigating', 'closed'], default: 'open' },
    attachment: { type: String },
    officerRecording: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Playback Entry Model
// ============================================================
const PlaybackEntrySchema = new Schema(
  {
    dateRequested: { type: String, required: true },
    timeRequested: { type: String, required: true },
    cameraNumber: { type: String, required: true },
    cameraLocation: { type: String, required: true },
    incidentDate: { type: String, required: true },
    incidentTime: { type: String, required: true },
    requestedBy: { type: String, required: true },
    department: { type: String },
    reason: { type: String, required: true },
    footageDuration: { type: String },
    exportFormat: { type: String, enum: ['mp4', 'avi', 'mkv', 'other'], default: 'mp4' },
    storageLocation: { type: String },
    uploadedBy: { type: String },
    uploadDate: { type: String },
    evidenceNumber: { type: String, required: true },
    remarks: { type: String },
    playbackFile: { type: String },
    screenshot: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Incident Model
// ============================================================
const IncidentSchema = new Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    incidentType: { type: String, enum: ['theft', 'assault', 'fire', 'medical', 'vandalism', 'trespassing', 'accident', 'other'], required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    officerReporting: { type: String, required: true },
    actionTaken: { type: String },
    personsInvolved: { type: String },
    evidence: { type: String },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], default: 'open' },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Shift Handover Model
// ============================================================
const ShiftHandoverSchema = new Schema(
  {
    date: { type: String, required: true },
    outgoingOfficer: { type: String, required: true },
    incomingOfficer: { type: String, required: true },
    shift: { type: String, enum: ['morning', 'afternoon', 'night'], required: true },
    outstandingIssues: { type: String },
    equipmentStatus: { type: String },
    patrolNotes: { type: String },
    visitorsStillInside: { type: Number, default: 0 },
    goodsPendingCollection: { type: Number, default: 0 },
    signature: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Equipment Model
// ============================================================
const EquipmentSchema = new Schema(
  {
    dateIssued: { type: String, required: true },
    timeIssued: { type: String, required: true },
    itemName: { type: String, required: true },
    serialNumber: { type: String, required: true },
    issuedTo: { type: String, required: true },
    department: { type: String, required: true },
    purpose: { type: String, required: true },
    conditionOnIssue: { type: String, default: 'good' },
    remarks: { type: String },
    status: { type: String, default: 'issued' },
    timeReturned: { type: String },
    conditionOnReturn: { type: String },
    returnedTo: { type: String },
    issuedBy: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Vehicle Model
// ============================================================
const VehicleSchema = new Schema(
  {
    date: { type: String, required: true },
    timeIn: { type: String, required: true },
    timeOut: { type: String },
    registrationNumber: { type: String, required: true },
    vehicleType: { type: String, required: true },
    driverName: { type: String, required: true },
    company: { type: String },
    purpose: { type: String, required: true },
    destination: { type: String, required: true },
    remarks: { type: String },
    status: { type: String, default: 'on-premises' },
    officer: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Lost & Found Model
// ============================================================
const LostFoundSchema = new Schema(
  {
    dateFound: { type: String, required: true },
    timeFound: { type: String, required: true },
    itemDescription: { type: String, required: true },
    category: { type: String, required: true },
    locationFound: { type: String, required: true },
    foundBy: { type: String, required: true },
    finderContact: { type: String },
    storageLocation: { type: String, required: true },
    status: { type: String, default: 'unclaimed' },
    claimedBy: { type: String },
    claimantId: { type: String },
    claimantPhone: { type: String },
    dateClaimed: { type: String },
    receivingOfficer: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// OB Entry Model
// ============================================================
const OBEntrySchema = new Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    entry: { type: String, required: true },
    officer: { type: String, required: true },
    category: {
      type: String,
      enum: ['delivery', 'visitor', 'playback', 'goods', 'patrol', 'tip', 'shift', 'incident', 'equipment', 'vehicle', 'lost-found', 'general'],
      default: 'general',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// ============================================================
// Model Exports (with existing model check for hot reload)
// ============================================================
/* eslint-disable @typescript-eslint/no-explicit-any */
export const UserModel: Model<any> = mongoose.models.User || mongoose.model('User', UserSchema);
export const GoodsEntryModel: Model<any> = mongoose.models.GoodsEntry || mongoose.model('GoodsEntry', GoodsEntrySchema);
export const VisitorModel: Model<any> = mongoose.models.Visitor || mongoose.model('Visitor', VisitorSchema);
export const TipModel: Model<any> = mongoose.models.Tip || mongoose.model('Tip', TipSchema);
export const PlaybackEntryModel: Model<any> = mongoose.models.PlaybackEntry || mongoose.model('PlaybackEntry', PlaybackEntrySchema);
export const IncidentModel: Model<any> = mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);
export const ShiftHandoverModel: Model<any> = mongoose.models.ShiftHandover || mongoose.model('ShiftHandover', ShiftHandoverSchema);
export const EquipmentModel: Model<any> = mongoose.models.Equipment || mongoose.model('Equipment', EquipmentSchema);
export const VehicleModel: Model<any> = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
export const LostFoundModel: Model<any> = mongoose.models.LostFound || mongoose.model('LostFound', LostFoundSchema);
export const OBEntryModel: Model<any> = mongoose.models.OBEntry || mongoose.model('OBEntry', OBEntrySchema);
/* eslint-enable @typescript-eslint/no-explicit-any */
