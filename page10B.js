document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 Page 10B (Screen B) Loaded");

    // ✅ Ensure `window.electronAPI` is Available
    if (!window.electronAPI || typeof window.electronAPI.send !== "function") {
        console.error("❌ window.electronAPI is undefined. Ensure preload.js is correctly set up.");
        return;
    }

    const svgObject = document.getElementById("pageSvg");
    const cameraFeed = document.getElementById("cameraFeed");
    const language = localStorage.getItem("selectedLanguage") || "english";
    const selectedLayout = localStorage.getItem("selectedLayout") || "default";

    let totalPhotoShoots = 5; // Default value
    let currentPhotoCount = 0;
    let useAlternateSvg = false;

    // ✅ Fetch Correct SVG File
    fetch("../../config/assetsMap.json")
        .then(response => response.json())
        .then(data => {
            if (!data.screenB || !data.screenB[language]) {
                console.error(`❌ Screen B assets not found for language: ${language}`);
                return;
            }

            let svgPath = getSvgPath(data.screenB[language]);
            console.log(`✅ Selected SVG Path: ${svgPath}`);
            svgObject.setAttribute("data", svgPath);

            // ✅ Ensure the SVG is fully loaded before initialization
            svgObject.addEventListener("load", () => {
                console.log("✅ Page 10B SVG Loaded Successfully.");
                setTimeout(() => initializeCameraClipPath(svgObject), 100);
                updatePhotoCounter(currentPhotoCount);  // Ensure photo counter starts at 0
                startCountdown();
            });
        })
        .catch(error => console.error("❌ Error loading assetsMap.json:", error));

    // ✅ Determine the correct SVG path based on the layout
    function getSvgPath(languageData) {
        if (["Squarelayout1"].includes(selectedLayout)) {
            totalPhotoShoots = 5;
            return languageData["page10b_01"];
        } else if (["Squarelayout2", "Squarelayout5"].includes(selectedLayout)) {
            totalPhotoShoots = 8;
            return languageData["page10b_01"];
        } else if (["Squarelayout3"].includes(selectedLayout)) {
            totalPhotoShoots = 8;
            useAlternateSvg = true;
            return languageData["page10b_01"];
        } else if (["Squarelayout4"].includes(selectedLayout)) {
            totalPhotoShoots = 8;
            useAlternateSvg = true;
            return languageData["page10b_01"];
        } else if (["_4:5layout1"].includes(selectedLayout)) {
            totalPhotoShoots = 5;
            return languageData["page10b_02"];
        } else if (["_4:5layout3", "_4:5layout4"].includes(selectedLayout)) {
            totalPhotoShoots = 8;
            return languageData["page10b_02"];
        } else if (["_4:5layout5"].includes(selectedLayout)) {
            totalPhotoShoots = 6;
            return languageData["page10b_02"];
        } else if (["_4:5layout2", "_4:5layout6"].includes(selectedLayout)) {
            totalPhotoShoots = 6;
            return languageData["page10b_03"];
        }
    }

    // ✅ Function to Initialize Camera Placement
    function initializeCameraClipPath(svgObject) {
        const pageSVG = svgObject.contentDocument;
        if (!pageSVG) {
            console.error("❌ Failed to access SVG content.");
            return;
        }

        const clipPathID = "cameraClip"; // ✅ Always reference "cameraClip"

        const shapeElement = pageSVG.getElementById(clipPathID);
        if (!shapeElement) {
            console.error(`❌ ClipPath ${clipPathID} not found inside SVG.`);
            return;
        }

        let bbox = shapeElement.getBoundingClientRect();

        // ✅ Set camera feed size & position based on SVG clipPath
        cameraFeed.style.display = "block";
        cameraFeed.style.visibility = "visible";  // ✅ Ensures it's visible now
        cameraFeed.style.transform = `translate(${bbox.x}px, ${bbox.y}px)`;
        cameraFeed.style.left = `${bbox.x}px`;
        cameraFeed.style.top = `${bbox.y}px`;
        cameraFeed.style.width = `${bbox.width}px`;
        cameraFeed.style.height = `${bbox.height}px`;
        cameraFeed.style.objectFit = "contain";
        cameraFeed.style.clipPath = `url(${svgObject.data}#${clipPathID})`;

        console.log(`✅ Camera feed clipped to: ${clipPathID} with bbox:`, bbox);
    }

    // ✅ Function to Start Countdown from 7
    function startCountdown() {
        let timeLeft = 7;
        updateCountdown(timeLeft);

        function updateCountdown() {
            const pageSVG = svgObject.contentDocument;
            const countdownText = pageSVG?.getElementById("countdown")?.querySelector("tspan");
            if (!countdownText) return;

            countdownText.textContent = timeLeft;

            if (timeLeft === 0) {
                capturePhoto();
            } else {
                timeLeft--;
                setTimeout(updateCountdown, 1000);
            }
        }
    }

    // ✅ Function to Capture a Photo
    function capturePhoto() {
        console.log(`📸 Capturing photo ${currentPhotoCount + 1} / ${totalPhotoShoots}`);

        triggerFlashEffect();
        window.electronAPI.send("capture-photo");
        window.electronAPI.send("save-photo", { count: currentPhotoCount + 1 });
        updatePhotoCounter(currentPhotoCount + 1);

        if ((selectedLayout === "Squarelayout3" && currentPhotoCount === 4) || 
            (selectedLayout === "Squarelayout4" && currentPhotoCount === 5)) {
            console.log("🔄 Switching to alternate SVG...");
            svgObject.setAttribute("data", `../../assets/screenB/${language}/screenBpage10${language}-04.svg`);
        }

        currentPhotoCount++;
        if (currentPhotoCount < totalPhotoShoots) {
            setTimeout(startCountdown, 2000);
        } else {
            console.log("🎉 Photo session complete!");
            setTimeout(() => {
                window.electronAPI.send("navigate-screenA", "page11");
                window.electronAPI.send("navigate-screenB", "page11b");
            }, 3000);
        }
    }

    // ✅ Function to Update Photo Counter in SVG
    function updatePhotoCounter(count) {
        const pageSVG = svgObject.contentDocument;
        const counterText = pageSVG?.getElementById("photoCount")?.querySelector("tspan");
        if (!counterText) return;

        counterText.textContent = `${count}/${totalPhotoShoots}`;
    }

    // ✅ Function to Trigger Camera Flash Effect
    function triggerFlashEffect() {
        const flashEffect = document.getElementById("flashEffect");
        flashEffect.style.opacity = "1";
        setTimeout(() => {
            flashEffect.style.opacity = "0";
        }, 100);
    }
});