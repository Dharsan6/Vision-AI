# VISION AI: AI-Powered Image and Video Colorization and Enhancement Using Deep Learning

**VISION AI** is a professional, full-stack deep learning computer vision platform built for restoring natural colors in grayscale imagery and enhancing low-resolution video sequences using state-of-the-art pretrained deep neural networks.

---

## 1. Project Overview & Problem Statement

Monochrome photographs and vintage archival footage suffer from two core limitations: the absence of color and low spatial resolution. Converting grayscale luminance into plausible chrominance is a severely ill-posed inverse problem, as a single luminance intensity can correspond to a vast gamut of colors.

VISION AI resolves this challenge by pairing:
1. **DDColor (ICCV 2023)**: A dual-decoder transformer architecture with learned color queries operating in CIE Lab space.
2. **Real-ESRGAN x4plus (ICCVW 2021)**: A 23-block Residual-in-Residual Dense Block Network (RRDBNet) for sub-pixel super-resolution.
3. **Apple Silicon Acceleration (MPS)**: Zero-copy Metal Performance Shaders execution tailored for macOS M3 hardware.

---

## 2. System Architecture

```
VISION-AI/
│
├── frontend/                     # React 18 + Vite + Tailwind CSS Single Page Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── reactbits/        # PhotonKnot, ShinyText, DitherVeil, ScrollReveal, ScrollExpand, CircularCarousel
│   │   │   ├── comparison/       # Interactive Before/After slider
│   │   │   ├── navigation/       # Sidebar, Navbar
│   │   │   ├── progress/         # Real-time frame & step progress bars
│   │   │   └── upload/           # Drag-and-drop file uploader with demo sample loader
│   │   ├── pages/                # LandingPage, Dashboard, ImageColorization, VideoColorization, VideoEnhancement, History, About
│   │   ├── services/             # Axios API client with async job polling
│   │   └── main.jsx
│   ├── tailwind.config.js        # Deep black (#05070B) & Dark Navy (#080D16) palette
│   └── vite.config.js            # Reverse proxy for /api and /storage
│
├── backend/                      # High-performance Python FastAPI async server
│   ├── api/                      # status_routes, image_routes, video_routes, history_routes, media_routes
│   ├── core/                     # device_manager (MPS/CPU), frame_extractor, temporal_stabilizer, video_reconstructor, job_manager
│   ├── models/                   # ddcolor (ConvNeXt-T + Dual Decoder), realesrgan (RRDBNet), model_manager
│   ├── services/                 # image_service, video_colorization_service, super_resolution_service, history_service
│   ├── utils/                    # metrics (PSNR, SSIM, Throughput FPS), sample_generator
│   ├── tests/                    # test_pipeline.py automated test suite
│   ├── config.py
│   └── main.py
│
├── storage/                      # File persistence (excluded from Git)
│   ├── models/                   # ddcolor_paper_tiny.pth (210MB), RealESRGAN_x4plus.pth (64MB)
│   ├── uploads/                  # Temporary uploaded media
│   ├── outputs/                  # Rendered colorized and enhanced MP4 / PNG / JPG outputs
│   ├── history/                  # SQLite history.db audit trail
│   └── samples/                  # Benchmark test images and videos
│
└── README.md
```

---

## 3. Technologies Used

- **Deep Learning**: PyTorch 2.15 (with Apple Silicon `mps` acceleration & CPU fallback)
- **Computer Vision**: OpenCV 5.0, Pillow, NumPy, Scikit-Image (SSIM & PSNR calculation)
- **Video Processing & Codecs**: FFmpeg 9.0 (H.264 `yuv420p` universal web encoding, audio remuxing)
- **Backend Framework**: FastAPI 0.162, Uvicorn, Pydantic v2
- **Frontend Framework**: React 18, Vite 5, Tailwind CSS 3.4, React Router DOM v6
- **Animations & WebGL**: OGL (DitherVeil WebGL shader), GSAP (ScrollReveal), Canvas (Photon Knot)
- **Design Tokens**: Black and dark navy blue visual identity (`#05070B`, `#080D16`, `#0C1421`, `#101D2E`, `#1A2B40`, `#1769D2`, `#268BFF`, `#80BCFF`). Strictly free of violet/purple gradients.

---

## 4. Pretrained Deep Learning Models

### A. DDColor (Image & Video Colorization)
- **Architecture**: ConvNeXt-Tiny encoder + MultiScaleColorDecoder + Pixel Decoder.
- **Color Representation**: CIE Lab color space. Predicts $a$ and $b$ chrominance channels while locking 100% of the input high-resolution lightness ($L$) channel.
- **Checkpoint**: `ddcolor_paper_tiny.pth` (210 MB).
- **Official Repository**: [https://github.com/piddnad/DDColor](https://github.com/piddnad/DDColor)

### B. Real-ESRGAN x4plus (Video Super-Resolution)
- **Architecture**: RRDBNet (Residual-in-Residual Dense Block Network) with 23 blocks and 64 features.
- **Scaling**: Native 4x sub-pixel upscaling and 2x area-downsampled scaling.
- **Memory Safety**: Overlapping 512px tiled inference to operate safely within 16GB unified memory on Apple Silicon.
- **Checkpoint**: `RealESRGAN_x4plus.pth` (64 MB).
- **Official Repository**: [https://github.com/xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)

---

## 5. Installation & Setup

### Prerequisites
- macOS on Apple Silicon (M1/M2/M3) or Linux/Windows
- Python 3.11 (`python3.11`)
- Node.js 18+ and npm
- FFmpeg (`brew install ffmpeg` on macOS)

### 1. Backend Setup
```bash
# From workspace root
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## 6. Running the Application

### 1. Launch FastAPI Backend
```bash
# Terminal 1 (from workspace root)
source .venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
*Backend runs on `http://localhost:8000`.*  
*Interactive Swagger docs available at `http://localhost:8000/docs`.*

### 2. Launch React Frontend
```bash
# Terminal 2 (from workspace root)
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 7. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status and service uptime |
| `GET` | `/api/system/status` | Real-time hardware, MPS device, and RAM telemetry |
| `GET` | `/api/models/status` | Model weights status and in-memory residency |
| `POST` | `/api/image/colorize` | Single-image DDColor inference with dimension preservation |
| `POST` | `/api/video/colorize` | Background sequential video colorization with stabilization |
| `POST` | `/api/video/enhance` | Background Real-ESRGAN 2x/4x super-resolution |
| `GET` | `/api/jobs/{job_id}` | Poll background progress, current frame, and step |
| `GET` | `/api/jobs/{job_id}/result` | Final job metadata, metrics, and output paths |
| `GET` | `/api/history` | List persistent history records from SQLite |
| `DELETE` | `/api/history/{id}` | Delete specific processing record |
| `GET` | `/api/media/output/{filename}` | Stream or view rendered output |
| `GET` | `/api/media/download/{filename}` | Trigger direct browser file download |

---

## 8. Verification & Testing

Run the automated test suite covering device detection, model loading, image colorization, video metadata, and Real-ESRGAN inference:
```bash
source .venv/bin/activate
python -m unittest backend/tests/test_pipeline.py
```
*Result: 5 tests run and passed in ~4.4s on Apple Silicon MPS.*

---

## 9. Known Limitations & Recommendations

1. **Extreme Video Lengths**: Processing long 4K videos frame-by-frame on CPU or low-memory devices is computationally intensive. On the MacBook Air M3 (16GB), use 480p or 720p target resolution or frame limits for fast turnaround times.
2. **Audio Compatibility**: The pipeline automatically preserves AAC, MP3, and WAV audio streams. For rare uncompressed audio codecs, FFmpeg re-encodes the audio track to AAC for universal browser playback.

