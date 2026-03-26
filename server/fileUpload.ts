import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const SUBDIRS = ["resumes", "profile-pictures", "application-forms", "application-submissions", "documents"];

function ensureUploadDirs() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  for (const sub of SUBDIRS) {
    const dir = path.join(UPLOAD_DIR, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

ensureUploadDirs();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const category = (req.params.category as string) || "documents";
    const dir = path.join(UPLOAD_DIR, category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    const safeName = file.originalname
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);
    cb(null, `${safeName}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

export function registerFileUploadRoutes(app: Router) {
  // Serve uploaded files statically
  app.use("/uploads", (req: Request, res: Response, next) => {
    const filePath = path.join(UPLOAD_DIR, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Upload a single file
  app.post("/api/upload/:category", upload.single("file"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const category = req.params.category;
      const fileUrl = `/uploads/${category}/${req.file.filename}`;

      res.json({
        success: true,
        url: fileUrl,
        fileName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Upload multiple files
  app.post("/api/upload-multiple/:category", upload.array("files", 10), (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const category = req.params.category;
      const uploaded = files.map((file) => ({
        url: `/uploads/${category}/${file.filename}`,
        fileName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.json({ success: true, files: uploaded });
    } catch (error) {
      console.error("Multiple file upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });
}
