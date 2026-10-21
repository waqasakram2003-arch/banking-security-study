import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory (public folder)
const uploadDir = path.join(__dirname, "../../frontend-vulnerable/public/images/user-upload-images");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// === HIGHLY VULNERABLE STORAGE ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original name + extension (dangerous)
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const uniqueName = `${name}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    }
});

// **REMOVE FILE FILTER** - Allow ALL file types
// const fileFilter = (req, file, cb) => { ... }  ← delete this

export const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for bigger payloads
    // NO fileFilter → sab allow
});

// Keep helper functions
export function getImagePath(filename) {
    if (!filename) return null;
    return `/images/user-upload-images/${filename}`;
}

export function deleteImageFile(imagePath) {
    if (!imagePath) return;
    try {
        const filename = path.basename(imagePath);
        const filepath = path.join(uploadDir, filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch (e) {
        console.error("Delete error:", e.message);
    }
}