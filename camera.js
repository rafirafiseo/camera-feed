class Camera {
    constructor(videoElementId, svgElementId) {
        this.videoElement = document.getElementById(videoElementId);
        this.svgObject = document.getElementById(svgElementId);
        this.stream = null;
        this.photoIndex = 0;
        this.totalPhotoShoots = 0;
        this.language = localStorage.getItem("selectedLanguage") || "english";
        this.layout = localStorage.getItem("selectedLayout") || "Squarelayout1";
        this.aspectRatio = localStorage.getItem("selectedAspectRatio") || "square";
        this.zoomLevel = localStorage.getItem("selectedZoom") || "standard";
        this.timeLapseFrames = [];
        this.isRecordingTimeLapse = false;

        this.constraints = {
            video: {
                width: 1280,
                height: 720,
                facingMode: "user"
            }
        };

        if (this.zoomLevel === "closeup") {
            this.constraints.video.width = 1920;
            this.constraints.video.height = 1080;
        }

        this.initCamera();
    }

    async initCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.videoElement.srcObject = this.stream;
            console.log("📷 Camera initialized successfully.");

            this.svgObject.addEventListener("load", () => {
                console.log("✅ SVG Loaded Successfully.");
                this.applyClipPath();
            });

        } catch (error) {
            console.error("❌ Error accessing camera:", error);
        }
    }

    applyClipPath() {
        const svgDoc = this.svgObject.contentDocument;
        if (!svgDoc) {
            console.error("❌ SVG content not available.");
            return;
        }

        const clipPathID = "cameraClip"; 

        const shapeElement = svgDoc.getElementById(clipPathID);
        if (!shapeElement) {
            console.error(`❌ ClipPath ${clipPathID} not found inside SVG.`);
            return;
        }

        let bbox = shapeElement.getBoundingClientRect();

        // ✅ If the camera is already running (preloaded in Page 9B), just apply clipPath
        if (this.videoElement.srcObject) {
            console.log("✅ Camera already running from previous page.");
        } else {
            console.error("❌ Camera is not running. Make sure it is preloaded.");
        }

        this.videoElement.style.display = "block";
        this.videoElement.style.visibility = "visible";
        this.videoElement.style.position = `translate(${bbox.x}px, ${bbox.y}px)`;
        this.videoElement.style.left = `${bbox.x}px`;
        this.videoElement.style.top = `${bbox.y}px`;
        this.videoElement.style.width = `${bbox.width}px`;
        this.videoElement.style.height = `${bbox.height}px`;
        this.videoElement.style.objectFit = "contain";
        this.videoElement.style.clipPath = `url(${this.svgObject.data}#${clipPathID})`;

        console.log(`✅ Camera feed clipped to: ${clipPathID} with bbox:`, bbox);
    }

    capturePhoto() {
        if (!this.stream) {
            console.error("❌ Camera stream not available.");
            return;
        }

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/jpeg");

        window.electronAPI.send("save-photo", {
            imageData,
            language: this.language,
            aspectRatio: this.aspectRatio,
            layout: this.layout,
            photoIndex: this.photoIndex + 1
        });

        console.log(`📸 Captured Photo ${this.photoIndex + 1}`);

        this.photoIndex++;
        this.applyClipPath();
    }

    async startTimeLapse() {
        console.log("⏳ Starting time-lapse recording...");
        this.timeLapseFrames = [];
        this.isRecordingTimeLapse = true;

        for (let i = 0; i < 7; i++) {
            if (!this.isRecordingTimeLapse) break;
            this.captureTimeLapseFrame();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Capture every second
        }

        this.saveTimeLapse();
    }

    captureTimeLapseFrame() {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

        this.timeLapseFrames.push(canvas.toDataURL("image/jpeg"));
        console.log(`📽 Captured Time-Lapse Frame: ${this.timeLapseFrames.length}`);
    }

    saveTimeLapse() {
        console.log("💾 Saving time-lapse video...");
        window.electronAPI.send("save-time-lapse", {
            frames: this.timeLapseFrames,
            language: this.language,
            aspectRatio: this.aspectRatio,
            layout: this.layout
        });

        this.isRecordingTimeLapse = false;
        console.log("✅ Time-lapse saved successfully.");
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            console.log("⏹️ Camera stopped.");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const camera = new Camera("cameraFeed", "pageSvg");
    window.electronAPI.receive("capture-photo", () => camera.capturePhoto());
    window.electronAPI.receive("start-time-lapse", () => camera.startTimeLapse());
    window.addEventListener("beforeunload", () => camera.stopCamera());
});