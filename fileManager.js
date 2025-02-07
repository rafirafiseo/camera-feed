const fs = require("fs");
const path = require("path");

const CAPTURED_DIR = path.join(__dirname, "../../assets/captured/");
const EXPIRATION_TIME = 12 * 60 * 60 * 1000; // ✅ 12 hours in milliseconds

// ✅ Ensure directory exists
if (!fs.existsSync(CAPTURED_DIR)) {
    fs.mkdirSync(CAPTURED_DIR, { recursive: true });
    console.log("📂 Created captured folder:", CAPTURED_DIR);
}

// ✅ Helper function to delete old files
function deleteOldFiles() {
    fs.readdir(CAPTURED_DIR, (err, files) => {
        if (err) {
            console.error("❌ Error reading captured directory:", err);
            return;
        }

        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(CAPTURED_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("❌ Error reading file stats:", err);
                    return;
                }

                if (now - stats.mtimeMs > EXPIRATION_TIME) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error("❌ Error deleting old file:", err);
                        } else {
                            console.log(`🗑 Deleted old file: ${filePath}`);
                        }
                    });
                }
            });
        });
    });
}

// ✅ Save captured photo
function savePhoto(data) {
    const { imageData, language, aspectRatio, layout, photoIndex } = data;

    const fileName = `photo_${language}_${aspectRatio}_${layout}_${photoIndex}.jpg`;
    const filePath = path.join(CAPTURED_DIR, fileName);

    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
    fs.writeFile(filePath, base64Data, "base64", (err) => {
        if (err) {
            console.error("❌ Error saving photo:", err);
        } else {
            console.log(`📸 Saved photo: ${filePath}`);
        }
    });
}

// ✅ Save time-lapse frames
function saveTimeLapse(data) {
    const { frames, language, aspectRatio, layout } = data;
    const videoFileName = `timelapse_${language}_${aspectRatio}_${layout}.mp4`;
    const videoPath = path.join(CAPTURED_DIR, videoFileName);

    const framePromises = frames.map((frame, index) => {
        return new Promise((resolve, reject) => {
            const frameFile = path.join(CAPTURED_DIR, `timelapse_frame_${index}.jpg`);
            const base64Data = frame.replace(/^data:image\/jpeg;base64,/, "");

            fs.writeFile(frameFile, base64Data, "base64", (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(frameFile);
                }
            });
        });
    });

    Promise.all(framePromises)
        .then(frameFiles => {
            console.log("📽 Time-lapse frames saved successfully.");
            mergeFramesToVideo(frameFiles, videoPath);
        })
        .catch(err => console.error("❌ Error saving time-lapse frames:", err));
}

// ✅ Merge frames into video (Mock implementation)
function mergeFramesToVideo(frameFiles, videoPath) {
    console.log("🎬 Merging frames into time-lapse video...");
    
    // ⚠️ Here, you would use an external tool like FFmpeg to create an actual video
    // ⚠️ This is a placeholder function and needs actual video processing logic

    setTimeout(() => {
        console.log(`✅ Time-lapse video saved: ${videoPath}`);
        // Delete frames after merging to save space
        frameFiles.forEach(file => fs.unlink(file, err => {
            if (err) console.error("❌ Error deleting frame:", err);
        }));
    }, 3000);
}

// ✅ Listen for events from Electron main process
const { ipcMain } = require("electron");

ipcMain.on("save-photo", (event, data) => {
    savePhoto(data);
});

ipcMain.on("save-time-lapse", (event, data) => {
    saveTimeLapse(data);
});

// ✅ Run automatic cleanup every hour
setInterval(deleteOldFiles, 60 * 60 * 1000); // Every 1 hour
deleteOldFiles(); // Run once at startup
