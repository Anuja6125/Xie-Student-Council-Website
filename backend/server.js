import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from "multer";
import path from "path";
import fs from "fs"; 
import nodemailer from 'nodemailer';
import cloudinary from 'cloudinary';
const cloudinaryV2 = cloudinary.v2;
import pkg from 'multer-storage-cloudinary';
const { CloudinaryStorage } = pkg;
import streamifier from 'streamifier';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Import Models
import { 
  TempUser, 
  Admin, 
  PendingAdmin, 
  Student,
  SubEvent,
  Galleries,
  Event,
  Winners 
} from './models.js';
 
 
dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. CONFIGURATIONS ---

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING",
});

// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- 2. STORAGE & MULTER SETUP ---

// Local Storage for Events (Your existing setup)
 

// Cloudinary Storage for Admin ID Cards (New)
const idCardStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: 'college_id_cards',
    resource_type: "image", // Critical for PDFs
    format: async (req, file) => 'pdf',
    access_mode: 'public',
  },
});
const uploadIdCard = multer({ storage: idCardStorage });

// Configuration for Event Banners (Images)
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: async (req, file) => {
    if (file.mimetype === "application/pdf") {
      return {
        folder: "events/pdfs",
        resource_type: "image",
        format: 'pdf',
        access_mode: 'public',
      };
    }

    return {
      folder: "events/images",
      resource_type: "image",
      access_mode: 'public',
    };
  },
});

const uploadToCloudinary = (fileBuffer, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryV2.uploader.upload_stream(
      { 
        folder: "events", 
        resource_type: resourceType // Ensures PDFs are handled correctly
      }, 
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// const result = await uploadToCloudinary(req.files.pdf.buffer, "auto");

// 3. Initialize the upload middleware
// THIS LINE FIXES THE REFERENCE ERROR
const upload = multer({ 
  storage : multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // keep under safe limit });
});

// 4. Now you can use it in your route 
const uploadGallery = multer({ storage: multer.memoryStorage() , limits: { fileSize: 10 * 1024 * 1024 } });

// --- 3. SIGNUP & OTP ROUTES ---

app.post("/signup", uploadIdCard.single('idCard'), async (req, res) => {
  try {
    const { name, email, password, dept, year, division, role, councilDept, councilRole } = req.body;

    const exists = await Student.findOne({ email }) || await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(password, 10);

    const tempUserData = {
      name, email, password: hash, dept, year, division, role, otp,
      councilDept: role === 'admin' ? councilDept : undefined,
      councilRole: role === 'admin' ? councilRole : undefined,
      idCard: (role === 'admin' && req.file) ? { public_id: req.file.filename, url: req.file.path } : undefined
    };

    await TempUser.create(tempUserData);

    await transporter.sendMail({
      from: '"College Portal" <noreply@college.edu>',
      to: email,
      subject: 'Your Verification Code',
      html: `<div style="text-align:center;"><h2>OTP: ${otp}</h2><p>Expires in 10 mins.</p></div>`
    });

    res.json({ message: "OTP sent to college email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const tempUser = await TempUser.findOne({ email, otp });

    if (!tempUser) return res.status(400).json({ message: "Invalid/Expired OTP" });

    const data = tempUser.toObject();
    delete data.otp;
    delete data._id;

    if (data.role === 'student') {
      await Student.create({
        ...data,
        isVerified: true // Set this to true now that OTP is correct!
      });
    } else {
      await PendingAdmin.create(data);
    }

    await TempUser.deleteOne({ email });
    res.json({ message: "Verified!", role: data.role });
  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
});

// --- 4. TEACHER APPROVAL ROUTES ---

app.get("/api/admin/pending-requests", async (req, res) => {
  try {
    const requests = await PendingAdmin.find().sort({ appliedAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ message: "Error fetching requests" }); }
});

app.post("/api/admin/approve/:id", async (req, res) => {
  try {
    const pending = await PendingAdmin.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: "Not found" });

    const data = pending.toObject();
    delete data._id;

    await Admin.create({ ...data, approvalDetails: { approvedBy: req.body.teacherName || "Teacher", approvedAt: new Date() } });
    await PendingAdmin.findByIdAndDelete(req.params.id);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Account Approved!',
      html: `<h3>Welcome ${data.name}!</h3><p>Your Admin account is now active.</p>`
    });

    res.json({ message: "Approved" });
  } catch (err) { res.status(500).json({ message: "Approval failed" }); }
});

app.post("/api/admin/reject/:id", async (req, res) => {
  try {
    const pending = await PendingAdmin.findById(req.params.id);
    if (pending?.idCard?.public_id) {
      await cloudinary.uploader.destroy(pending.idCard.public_id, { resource_type: 'image' });
    }
    await PendingAdmin.findByIdAndDelete(req.params.id);
    res.json({ message: "Rejected" });
  } catch (err) { res.status(500).json({ message: "Rejection failed" }); }
});

// --- 5. LOGIN & USER ROUTES ---

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;        
    const student = await Student.findOne({ email });
    if (student && await bcrypt.compare(password, student.password)) {
      return res.json({ role: "student", user: student });
    }
    const admin = await Admin.findOne({ email });
    if (admin && await bcrypt.compare(password, admin.password)) {
      return res.json({ role: "admin", user: admin });
    }
    res.status(401).json({ message: "Invalid credentials" });
  } catch (err) { res.status(500).json({ message: "Login failed" }); }
});

app.get("/students", async (req, res) => {
  const students = await Student.find().sort({ created_at: -1 });
  res.json(students);
});

// --- 6. EVENT & GALLERY ROUTES (Your Existing Logic) ---
app.post("/events", async (req, res) => {
  console.log("\n==================== NEW REQUEST ====================");
  console.log("➡️ Request received at /events");

  const startTime = Date.now();

  // 🔹 STEP 1: Run multer manually
  const multerMiddleware = upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]);

  multerMiddleware(req, res, async (err) => {
    const multerTime = Date.now() - startTime;
    console.log(`⏱️ Multer finished in ${multerTime}ms`);

    // 🔴 CASE 1: Multer error
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(500).json({ stage: "multer", error: err.message });
    }

    console.log("✅ Multer completed successfully");

    try {
      // 🔹 STEP 2: Parse body
      const {
        event_name, event_type, event_category_name, description,
        venue, date_time, duration, status, year,
        facebook, instagram, twitter, linkedin,
        email, phone, whatsapp,
        registration_links
      } = req.body;

      console.log("➡️ Parsing fields...");

      let parsedLinks = [];
      if (registration_links) {
        try {
          parsedLinks = JSON.parse(registration_links);
        } catch (e) {
          console.error("❌ registration_links parse failed");
        }
      }

      // 🔹 STEP 3: File extraction (Fixed Array Indexing)
      let bannerData = null;
      let pdfData = null;

      // Accessing because upload.fields returns arrays
      if (req.files?.banner && req.files.banner) {
        console.log("📸 Uploading Banner to Cloudinary...");
        const result = await uploadToCloudinary(req.files.banner.buffer, "image");
        bannerData = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }

      if (req.files?.pdf && req.files.pdf) {
        console.log("📄 Uploading PDF to Cloudinary...");
        // Use "auto" so Cloudinary detects it as a PDF/Raw file
        const result = await uploadToCloudinary(req.files.pdf.buffer, "auto"); 
        pdfData = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }

      console.log("➡️ Creating DB object...");

      // 🔹 STEP 4: DB write
      const newEvent = new Event({
        event_name,
        event_type,
        event_category_name,
        description,
        venue,
        date_time: date_time ? new Date(date_time) : null,
        duration,
        status: status || "upcoming",
        year: !isNaN(parseInt(year)) ? parseInt(year) : new Date().getFullYear(),
        banner: bannerData,
        document: pdfData,
        socials: { facebook, instagram, twitter, linkedin },
        contact_details: { email, phone, whatsapp },
        registration_links: parsedLinks,
        created_by: "Admin",
        updated_at: Date.now(),
      });

      console.log("➡️ Saving to MongoDB...");

      const savedEvent = await newEvent.save();

      const totalTime = Date.now() - startTime;
      console.log(`✅ SUCCESS in ${totalTime}ms`);

      return res.status(201).json({
        stage: "complete",
        message: "Event created",
        id: savedEvent._id,
      });

    } catch (error) {
      console.error("❌ Error AFTER multer:", error);
      return res.status(500).json({
        stage: "handler",
        error: error.message,
      });
    }
  });
});

app.patch('/events/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // 1. Add/Update the updated_at timestamp
    updateData.updated_at = new Date();

    // 2. Find by ID and update
    // { new: true } returns the document AFTER the update is applied
    // { runValidators: true } ensures the update respects your schema constraints
    const updatedEvent = await Event.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

app.get("/events", async (req, res) => {
  const events = await Event.find().sort({ date_time: -1 });
  res.json(events);
});

app.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Use Mongoose to find by ID and remove
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Status 200 triggers the 'res.ok' in your frontend fetch
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

app.post("/gallery/upload", uploadGallery.array("images", 10), async (req, res) => {
  console.log("Route hit");
  try {
    const { event_id, sub_event_id, event_category, event_name, sub_event_name, caption, uploaded_by } = req.body;
    console.log("Received data:", { event_id, sub_event_id, event_category, event_name, sub_event_name, caption, uploaded_by });
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Process all uploads in parallel
  const uploadPromises = req.files.map(async (file, index) => {
    console.log(`Uploading file ${index}`);

  const cloudinaryResult = await uploadToCloudinary(file.buffer);

  console.log(`Uploaded file ${index}`);

  const newImage = new Galleries({
    image_url: cloudinaryResult.secure_url,
    cloudinary_id: cloudinaryResult.public_id,
    event_id,
    sub_event_id: sub_event_id || null,
    event_name: event_name || "",
    sub_event_name: sub_event_name || "",
    event_category: event_category || "General",
    caption: caption || "",
    uploaded_by: uploaded_by || "Admin",
    uploaded_at: new Date()
  });

  return await newImage.save();
});

    const savedImages = await Promise.all(uploadPromises);

    res.json({ 
      message: `${savedImages.length} images uploaded to Cloudinary successfully`, 
      images: savedImages 
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Cloudinary upload failed", error: err.message });
  }
});

// 1. GET ALL GALLERY IMAGES (Needed to show images in the UI)
app.get("/gallery", async (req, res) => {
  try {
    const images = await Galleries.find().sort({ uploaded_at: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: "Error fetching gallery" });
  }
});

// 2. GET SUB-EVENTS FOR DROPDOWN (Needed for the filter in the UI)
app.get("/sub-events/:eventId", async (req, res) => {
  try {
    const subs = await SubEvent.find({ event_id: req.params.eventId });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching sub-events" });
  }
});

// 3. DELETE GALLERY IMAGE (Needed for the Trash icon in the UI)
app.delete("/gallery/:id", async (req, res) => {
  try {
    const image = await Galleries.findById(req.params.id);
    if (!image) return res.status(404).json({ message: "Image not found" });

    // Remove from Cloudinary using the stored ID
    await cloudinary.uploader.destroy(image.cloudinary_id);
    
    // Remove from MongoDB
    await Galleries.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted from Cloudinary and Database" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// --- 7. DASHBOARD & MISC ---

app.get("/api/dashboard", async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalEvents = await Event.countDocuments();
    res.json({ totalStudents, totalEvents });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

app.get("/", (req, res) => res.send("Server Running"));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Connection error:", err));

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));