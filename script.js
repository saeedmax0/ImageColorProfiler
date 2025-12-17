// ImageColorProfiler - Main Script
// Advanced color analysis tool for images

class ImageColorProfiler {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.imageData = null;
        this.dominantColors = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const imageInput = document.getElementById('imageInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const checkContrastBtn = document.getElementById('checkContrastBtn');
        const generateGradientBtn = document.getElementById('generateGradientBtn');
        const fgColorPicker = document.getElementById('fgColorPicker');
        const bgColorPicker = document.getElementById('bgColorPicker');
        const fgColorInput = document.getElementById('fgColorInput');
        const bgColorInput = document.getElementById('bgColorInput');
        const gradientType = document.getElementById('gradientType');

        imageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                analyzeBtn.disabled = false;
            }
        });

        analyzeBtn.addEventListener('click', () => this.loadAndAnalyzeImage());
        checkContrastBtn.addEventListener('click', () => this.checkContrast());
        generateGradientBtn.addEventListener('click', () => this.generateGradient());

        // Sync color pickers with text inputs
        fgColorPicker.addEventListener('input', (e) => {
            fgColorInput.value = e.target.value;
        });

        bgColorPicker.addEventListener('input', (e) => {
            bgColorInput.value = e.target.value;
        });

        fgColorInput.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                fgColorPicker.value = e.target.value;
            }
        });

        bgColorInput.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                bgColorPicker.value = e.target.value;
            }
        });

        gradientType.addEventListener('change', (e) => {
            const directionDiv = document.getElementById('gradientDirection');
            directionDiv.style.display = e.target.value === 'linear' ? 'block' : 'none';
        });
    }

    async loadAndAnalyzeImage() {
        const imageInput = document.getElementById('imageInput');
        const file = imageInput.files[0];
        
        if (!file) return;

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                // Set canvas size
                const maxWidth = 800;
                const scale = Math.min(1, maxWidth / img.width);
                this.canvas.width = img.width * scale;
                this.canvas.height = img.height * scale;

                // Draw image
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

                // Show preview
                document.getElementById('previewSection').classList.remove('hidden');

                // Perform analysis
                this.analyzeImage();
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    analyzeImage() {
        // Detect color profile
        this.detectColorProfile();

        // Extract dominant colors
        this.extractDominantColors();

        // Generate histograms
        this.generateHistograms();

        // Show all sections
        document.getElementById('profileSection').classList.remove('hidden');
        document.getElementById('paletteSection').classList.remove('hidden');
        document.getElementById('histogramSection').classList.remove('hidden');
        document.getElementById('contrastSection').classList.remove('hidden');
        document.getElementById('gradientSection').classList.remove('hidden');

        // Set default contrast colors from palette
        if (this.dominantColors.length >= 2) {
            const fg = this.dominantColors[0];
            const bg = this.dominantColors[this.dominantColors.length - 1];
            document.getElementById('fgColorInput').value = fg.hex;
            document.getElementById('fgColorPicker').value = fg.hex;
            document.getElementById('bgColorInput').value = bg.hex;
            document.getElementById('bgColorPicker').value = bg.hex;
        }
    }

    detectColorProfile() {
        const profileInfo = document.getElementById('profileInfo');
        let profileHTML = '';

        // Check for color space support
        const supportsP3 = window.matchMedia('(color-gamut: p3)').matches;
        const supportsRec2020 = window.matchMedia('(color-gamut: rec2020)').matches;

        profileHTML += `<div class="flex items-center space-x-2">
            <span class="font-semibold">Detected Profile:</span>
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">sRGB</span>
        </div>`;

        if (supportsP3) {
            profileHTML += `<div class="flex items-center space-x-2">
                <span class="font-semibold">Display Support:</span>
                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Display-P3 ✓</span>
            </div>`;
        }

        if (supportsRec2020) {
            profileHTML += `<div class="flex items-center space-x-2">
                <span class="font-semibold">Wide Gamut:</span>
                <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Rec.2020 ✓</span>
            </div>`;
        }

        profileHTML += `<div class="text-sm text-gray-600 mt-2">
            <span class="font-semibold">Image Size:</span> ${this.canvas.width} × ${this.canvas.height} pixels
        </div>`;

        profileInfo.innerHTML = profileHTML;
    }

    extractDominantColors() {
        const pixels = this.imageData.data;
        const sampleRate = 10; // Sample every 10th pixel for performance
        const colors = [];

        // Sample colors from the image
        for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
            colors.push({
                r: pixels[i],
                g: pixels[i + 1],
                b: pixels[i + 2]
            });
        }

        // Use k-means clustering to find dominant colors
        this.dominantColors = this.kMeansClustering(colors, 8);

        // Sort by luminance
        this.dominantColors.sort((a, b) => b.luminance - a.luminance);

        // Display palette
        this.displayPalette();
    }

    kMeansClustering(colors, k) {
        const maxIterations = 10;
        
        // Initialize centroids randomly
        let centroids = [];
        for (let i = 0; i < k; i++) {
            centroids.push(colors[Math.floor(Math.random() * colors.length)]);
        }

        for (let iter = 0; iter < maxIterations; iter++) {
            // Assign colors to nearest centroid
            const clusters = Array(k).fill(null).map(() => []);
            
            colors.forEach(color => {
                let minDist = Infinity;
                let clusterIndex = 0;
                
                centroids.forEach((centroid, i) => {
                    const dist = this.colorDistance(color, centroid);
                    if (dist < minDist) {
                        minDist = dist;
                        clusterIndex = i;
                    }
                });
                
                clusters[clusterIndex].push(color);
            });

            // Update centroids
            centroids = clusters.map(cluster => {
                if (cluster.length === 0) return centroids[0];
                
                const sum = cluster.reduce((acc, color) => ({
                    r: acc.r + color.r,
                    g: acc.g + color.g,
                    b: acc.b + color.b
                }), { r: 0, g: 0, b: 0 });

                return {
                    r: Math.round(sum.r / cluster.length),
                    g: Math.round(sum.g / cluster.length),
                    b: Math.round(sum.b / cluster.length)
                };
            });
        }

        // Convert to color objects with hex and other formats
        return centroids.map(color => ({
            r: color.r,
            g: color.g,
            b: color.b,
            hex: this.rgbToHex(color.r, color.g, color.b),
            hsl: this.rgbToHsl(color.r, color.g, color.b),
            luminance: this.getLuminance(color.r, color.g, color.b)
        }));
    }

    colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    }

    displayPalette() {
        const palette = document.getElementById('palette');
        palette.innerHTML = '';

        this.dominantColors.forEach((color, index) => {
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box cursor-pointer';
            colorBox.innerHTML = `
                <div class="h-32 rounded-t-lg shadow-md" style="background-color: ${color.hex}"></div>
                <div class="bg-gray-100 p-3 rounded-b-lg">
                    <div class="font-mono text-sm font-bold text-gray-800">${color.hex}</div>
                    <div class="text-xs text-gray-600 mt-1">RGB(${color.r}, ${color.g}, ${color.b})</div>
                    <div class="text-xs text-gray-600">HSL${color.hsl}</div>
                    <div class="flex gap-1 mt-2">
                        <button class="copy-btn flex-1 text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 transition" data-color="${color.hex}" data-format="hex">
                            Copy HEX
                        </button>
                    </div>
                </div>
            `;

            // Add click to copy functionality
            const copyBtn = colorBox.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => this.copyToClipboard(color.hex));

            palette.appendChild(colorBox);
        });
    }

    generateHistograms() {
        this.generateRGBHistogram();
        this.generateHSVHistogram();
    }

    generateRGBHistogram() {
        const canvas = document.getElementById('rgbHistogram');
        const ctx = canvas.getContext('2d');
        const pixels = this.imageData.data;

        // Initialize histogram bins
        const rHist = new Array(256).fill(0);
        const gHist = new Array(256).fill(0);
        const bHist = new Array(256).fill(0);

        // Count pixels
        for (let i = 0; i < pixels.length; i += 4) {
            rHist[pixels[i]]++;
            gHist[pixels[i + 1]]++;
            bHist[pixels[i + 2]]++;
        }

        // Normalize
        const maxCount = Math.max(...rHist, ...gHist, ...bHist);
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw histograms
        const barWidth = width / 256;

        // Red
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        rHist.forEach((count, i) => {
            const barHeight = (count / maxCount) * height;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
        });

        // Green
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        gHist.forEach((count, i) => {
            const barHeight = (count / maxCount) * height;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
        });

        // Blue
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        bHist.forEach((count, i) => {
            const barHeight = (count / maxCount) * height;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
        });
    }

    generateHSVHistogram() {
        const canvas = document.getElementById('hsvHistogram');
        const ctx = canvas.getContext('2d');
        const pixels = this.imageData.data;

        // Initialize histogram bins
        const hHist = new Array(360).fill(0);
        const sHist = new Array(100).fill(0);
        const vHist = new Array(100).fill(0);

        // Count pixels
        for (let i = 0; i < pixels.length; i += 4) {
            const hsv = this.rgbToHsv(pixels[i], pixels[i + 1], pixels[i + 2]);
            hHist[Math.floor(hsv.h)]++;
            sHist[Math.floor(hsv.s)]++;
            vHist[Math.floor(hsv.v)]++;
        }

        // Normalize
        const maxH = Math.max(...hHist);
        const maxS = Math.max(...sHist);
        const maxV = Math.max(...vHist);
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const thirdHeight = height / 3;

        // Draw Hue
        const hBarWidth = width / 360;
        hHist.forEach((count, i) => {
            const barHeight = (count / maxH) * thirdHeight;
            ctx.fillStyle = `hsl(${i}, 100%, 50%)`;
            ctx.fillRect(i * hBarWidth, thirdHeight - barHeight, hBarWidth, barHeight);
        });

        // Draw Saturation
        const sBarWidth = width / 100;
        sHist.forEach((count, i) => {
            const barHeight = (count / maxS) * thirdHeight;
            ctx.fillStyle = `hsl(0, ${i}%, 50%)`;
            ctx.fillRect(i * sBarWidth, thirdHeight * 2 - barHeight, sBarWidth, barHeight);
        });

        // Draw Value
        const vBarWidth = width / 100;
        vHist.forEach((count, i) => {
            const barHeight = (count / maxV) * thirdHeight;
            ctx.fillStyle = `hsl(0, 0%, ${i}%)`;
            ctx.fillRect(i * vBarWidth, height - barHeight, vBarWidth, barHeight);
        });

        // Add labels
        ctx.fillStyle = 'black';
        ctx.font = '12px sans-serif';
        ctx.fillText('Hue', 5, 15);
        ctx.fillText('Saturation', 5, thirdHeight + 15);
        ctx.fillText('Value', 5, thirdHeight * 2 + 15);
    }

    checkContrast() {
        const fgColor = document.getElementById('fgColorInput').value;
        const bgColor = document.getElementById('bgColorInput').value;

        if (!this.isValidHex(fgColor) || !this.isValidHex(bgColor)) {
            alert('Please enter valid hex color codes (e.g., #000000)');
            return;
        }

        const fgRgb = this.hexToRgb(fgColor);
        const bgRgb = this.hexToRgb(bgColor);

        const ratio = this.getContrastRatio(fgRgb, bgRgb);

        // WCAG levels
        const aaLargeText = ratio >= 3;
        const aaNormalText = ratio >= 4.5;
        const aaaLargeText = ratio >= 4.5;
        const aaaNormalText = ratio >= 7;

        const resultsDiv = document.getElementById('contrastResults');
        resultsDiv.innerHTML = `
            <div class="border border-gray-300 rounded-lg p-4">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded" style="background-color: ${fgColor}"></div>
                    <div class="text-2xl font-bold">vs</div>
                    <div class="w-16 h-16 rounded" style="background-color: ${bgColor}"></div>
                    <div class="flex-1">
                        <div class="text-3xl font-bold text-gray-800">${ratio.toFixed(2)} : 1</div>
                        <div class="text-sm text-gray-600">Contrast Ratio</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 rounded ${aaNormalText ? 'bg-green-100' : 'bg-red-100'}">
                        <div class="font-semibold ${aaNormalText ? 'text-green-800' : 'text-red-800'}">
                            ${aaNormalText ? '✓' : '✗'} WCAG AA Normal Text
                        </div>
                        <div class="text-sm text-gray-600">Requires 4.5:1</div>
                    </div>
                    <div class="p-3 rounded ${aaLargeText ? 'bg-green-100' : 'bg-red-100'}">
                        <div class="font-semibold ${aaLargeText ? 'text-green-800' : 'text-red-800'}">
                            ${aaLargeText ? '✓' : '✗'} WCAG AA Large Text
                        </div>
                        <div class="text-sm text-gray-600">Requires 3:1</div>
                    </div>
                    <div class="p-3 rounded ${aaaNormalText ? 'bg-green-100' : 'bg-red-100'}">
                        <div class="font-semibold ${aaaNormalText ? 'text-green-800' : 'text-red-800'}">
                            ${aaaNormalText ? '✓' : '✗'} WCAG AAA Normal Text
                        </div>
                        <div class="text-sm text-gray-600">Requires 7:1</div>
                    </div>
                    <div class="p-3 rounded ${aaaLargeText ? 'bg-green-100' : 'bg-red-100'}">
                        <div class="font-semibold ${aaaLargeText ? 'text-green-800' : 'text-red-800'}">
                            ${aaaLargeText ? '✓' : '✗'} WCAG AAA Large Text
                        </div>
                        <div class="text-sm text-gray-600">Requires 4.5:1</div>
                    </div>
                </div>
                <div class="mt-4 p-3 bg-gray-100 rounded">
                    <div class="font-semibold text-gray-800">Preview</div>
                    <div class="mt-2 p-3 rounded" style="background-color: ${bgColor}; color: ${fgColor}">
                        This is sample text with the selected colors
                    </div>
                </div>
            </div>
        `;
    }

    generateGradient() {
        if (this.dominantColors.length < 2) {
            alert('Please analyze an image first to generate a gradient');
            return;
        }

        const type = document.getElementById('gradientType').value;
        const direction = document.getElementById('directionSelect').value;
        const preview = document.getElementById('gradientPreview');
        const codeDiv = document.getElementById('gradientCode');

        // Create gradient CSS
        let gradientCSS;
        const colorStops = this.dominantColors.slice(0, 5).map(c => c.hex).join(', ');

        if (type === 'linear') {
            gradientCSS = `linear-gradient(${direction}, ${colorStops})`;
        } else {
            gradientCSS = `radial-gradient(circle, ${colorStops})`;
        }

        // Apply to preview
        preview.style.background = gradientCSS;

        // Display code
        codeDiv.innerHTML = `
            <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-semibold text-gray-800">CSS Code</span>
                    <button class="copy-gradient-btn px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition">
                        Copy CSS
                    </button>
                </div>
                <pre class="bg-white p-3 rounded border border-gray-200 overflow-x-auto"><code>background: ${gradientCSS};</code></pre>
            </div>
        `;

        // Add copy functionality
        const copyBtn = codeDiv.querySelector('.copy-gradient-btn');
        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(`background: ${gradientCSS};`);
        });
    }

    // Utility functions
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    isValidHex(hex) {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return `(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        const s = max === 0 ? 0 : d / max;
        const v = max;

        let h;
        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: h * 360,
            s: s * 100,
            v: v * 100
        };
    }

    getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    getContrastRatio(rgb1, rgb2) {
        const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            // Show a temporary success message
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-green-600');
            }, 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ImageColorProfiler();
});
