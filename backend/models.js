import mongoose from 'mongoose';

// Confidential Document
export const ConfidentialDoc = mongoose.model('ConfidentialDoc', new mongoose.Schema({
  file_id: String,
  is_active: { type: Boolean, default: true },
  expires_at: Date,
  max_views: Number,
  view_count: { type: Number, default: 0 },
  allowed_emails: [String],
  access_code: String,
  require_auth: Boolean
}));

// Access Logs
export const AccessLog = mongoose.model('AccessLog', new mongoose.Schema({
  document_id: mongoose.Schema.Types.ObjectId,
  accessed_by_email: String,
  accessed_by_name: String,
  access_type: String,
  access_granted: Boolean,
  denial_reason: String,
  ip_address: String,
  user_agent: String,
  created_at: { type: Date, default: Date.now }
}));

// Admin Requests
export const AdminRequest = mongoose.model('AdminRequest', new mongoose.Schema({
  auth_id: String,
  status: String,
  name: String,
  department: String,
  college_id: String,
  college_mail: String,
  gender: String,
  phone_no: String,
  email: String
}));

// Admins
export const TempUser = mongoose.model('TempUsers', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  dept: { type: String, required: true },
  year: { type: String, required: true },
  division: { type: String },
  role: { type: String, enum: ['student', 'admin'], required: true },

  // Admin specific (only if role is admin)
  councilDept: { type: String },
  councilRole: { type: String },
  idCard: {
    public_id: { type: String },
    url: { type: String },
  },

  // OTP Logic
  otp: { type: String, required: true },
  
  // TTL Index: This record automatically vanishes after 10 minutes
  createdAt: { type: Date, default: Date.now, expires: 600 }}));

export const PendingAdmin = mongoose.model('PendingAdmins', new mongoose.Schema({name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dept: { type: String, required: true },
  year: { type: String, required: true },
  division: { type: String }, 
  password: { type: String, required: true }, // Hashed

  // Council Specific Info
  councilDept: { 
    type: String, 
    enum: ['General', 'Cultural', 'Technical', 'Sports'], 
    required: true 
  },
  councilRole: { type: String, required: true },

  // Cloudinary PDF Storage
  idCard: {
    public_id: { type: String, required: true }, // Needed for deletion/management
    url: { type: String, required: true },       // The secure_url from Cloudinary
  },   
  appliedAt: { type: Date, default: Date.now }
}));


export const Admin = mongoose.model('Admins', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dept: { type: String, required: true },
  year: { type: String, required: true },
  division: { type: String },
  password: { type: String, required: true },

  councilDept: { 
    type: String, 
    enum: ['General', 'Cultural', 'Technical', 'Sports'], 
    required: true 
  },
  councilRole: { type: String, required: true },

  // Cloudinary PDF Storage (Carried over from Pending)
  idCard: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  }, // Teacher Approval Metadata
}));

// Students
export const Student = mongoose.model('Students', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // College email only
  dept: { type: String, required: true },
  year: { type: String, required: true },
  division: { type: String }, // Optional
  password: { type: String, required: true }, // Hashed
  role: { type: String, default: 'student' },
  isVerified: { type: Boolean, default: false }, // Becomes true after OTP
  createdAt: { type: Date, default: Date.now }
}));



export const SubEvent = mongoose.model('SubEvents', {
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  sub_event_name: {
    type: String,
    required: true
  },
  created_at: { type: Date, default: Date.now }
});
 

export const Event = mongoose.model('Events', {
  event_name: String,
  event_type: String,
  event_category_name: String,

  description: String,

  venue: String,
  date_time: Date,
  duration: String, 
  status: String,

  // ✅ Cloudinary Banner Storage
  banner: {
    public_id: { type: String}, // For management/deletion
    url: { type: String},       // Secure Cloudinary URL
    format: String,                             // e.g., 'jpg', 'png'
  },

  // ✅ Cloudinary PDF/Document Storage
  document: {
    public_id: String,
    url: String,
    filename: String
  },

  year: Number,

  socials: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },

  contact_details: {
    email: String,
    phone: String,
    whatsapp: String
  },

  registration_links: [
    {
      page: String,
      link: String
    }
  ],

  created_by: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Galleries = mongoose.model('Galleries', {
  image_url: { type: String, required: true },
  cloudinary_id: { type: String, required: true }, // Needed for deletions
  
  // Relations from your UI
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },
  sub_event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubEvent",
    default: null
  },
  event_category : { type: String, enum: ['Cultural', 'Technical', 'Sports', 'General'] },  
  event_name: String, // Useful for quick display without population
  sub_event_name: String, // Useful for quick display without population

  // Metadata from the form
  caption: { type: String, default: "" },
  uploaded_by: String, // Can be the Admin ID or Name
  
  uploaded_at: { type: Date, default: Date.now }
});

export const Winners = mongoose.model('Winners', new mongoose.Schema({
    sub_event_name: String,
    winner_email: String,
    position: String,
    prize: String,
    winner_image_url: String,
    event_id: mongoose.Schema.Types.ObjectId,
    created_at: { type: Date, default: Date.now }
}));

export const AdminRequests = mongoose.model('AdminRequests', new mongoose.Schema({
    name: String,
    status: String
}));

