import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  FileText,
  Sigma,
  AlertCircle,
  HelpCircle,
  Maximize2
} from 'lucide-react';

export type VisionCategory = 'diagram' | 'handwritten' | 'formula' | 'general';

export interface VisionImagePayload {
  data: string;       // base64 data without prefix
  dataUrl: string;    // full data:image/... url
  mimeType: string;
  name: string;
  category: VisionCategory;
  defaultPrompt?: string;
}

interface VisionCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (payload: VisionImagePayload) => void;
}

// Built-in sample academic visuals for instant testing
const SAMPLE_VISUALS: {
  id: string;
  name: string;
  category: VisionCategory;
  tag: string;
  prompt: string;
  svgDataUrl: string;
}[] = [
  {
    id: 'sample_circuit',
    name: 'Logic Circuit Diagram.png',
    category: 'diagram',
    tag: 'Architecture / Circuit',
    prompt: 'Analyze this logic circuit diagram. Identify each logic gate (AND, OR, NOT), compute the boolean output equation for Z in terms of inputs A and B, and write the truth table.',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340" style="background:#ffffff; font-family:sans-serif;">
        <rect width="600" height="340" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
        <text x="30" y="40" font-size="18" font-weight="bold" fill="#0f172a">Academic Circuit Diagram: Dual-Stage Logic Gate</text>
        <text x="30" y="65" font-size="12" fill="#64748b">Input Variables: A, B | Output: Z | Node 1: NAND, Node 2: XOR</text>
        
        <!-- Input lines -->
        <text x="50" y="130" font-size="14" font-weight="bold" fill="#1e293b">A (1)</text>
        <line x1="90" y1="125" x2="200" y2="125" stroke="#0284c7" stroke-width="3"/>
        <circle cx="140" cy="125" r="4" fill="#0284c7"/>
        <line x1="140" y1="125" x2="140" y2="235" stroke="#0284c7" stroke-width="3"/>
        <line x1="140" y1="235" x2="200" y2="235" stroke="#0284c7" stroke-width="3"/>

        <text x="50" y="170" font-size="14" font-weight="bold" fill="#1e293b">B (0)</text>
        <line x1="90" y1="165" x2="200" y2="165" stroke="#0284c7" stroke-width="3"/>
        <circle cx="160" cy="165" r="4" fill="#0284c7"/>
        <line x1="160" y1="165" x2="160" y2="265" stroke="#0284c7" stroke-width="3"/>
        <line x1="160" y1="265" x2="200" y2="265" stroke="#0284c7" stroke-width="3"/>

        <!-- Gate 1: AND Gate -->
        <rect x="200" y="110" width="80" height="70" rx="10" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
        <text x="225" y="150" font-size="14" font-weight="bold" fill="#0369a1">AND</text>
        <line x1="280" y1="145" x2="380" y2="145" stroke="#0284c7" stroke-width="3"/>
        <text x="310" y="135" font-size="11" fill="#475569">S1 = A·B</text>

        <!-- Gate 2: XOR Gate -->
        <rect x="200" y="220" width="80" height="70" rx="10" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <text x="225" y="260" font-size="14" font-weight="bold" fill="#b45309">XOR</text>
        <line x1="280" y1="255" x2="340" y2="255" stroke="#d97706" stroke-width="3"/>
        <line x1="340" y1="255" x2="340" y2="175" stroke="#d97706" stroke-width="3"/>
        <line x1="340" y1="175" x2="380" y2="175" stroke="#d97706" stroke-width="3"/>
        <text x="290" y="280" font-size="11" fill="#475569">S2 = A⊕B</text>

        <!-- Output Gate: OR Gate -->
        <rect x="380" y="130" width="80" height="70" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
        <text x="408" y="170" font-size="14" font-weight="bold" fill="#15803d">OR</text>
        <line x1="460" y1="165" x2="540" y2="165" stroke="#16a34a" stroke-width="3"/>
        <text x="550" y="170" font-size="16" font-weight="bold" fill="#15803d">Z</text>
        <text x="480" y="150" font-size="11" fill="#166534">Z = S1 + S2</text>
      </svg>
    `)}`
  },
  {
    id: 'sample_formula',
    name: 'Calculus_Derivation.png',
    category: 'formula',
    tag: 'Formula & Equation',
    prompt: 'Derive and solve this mathematical equation step-by-step. Identify the integration technique used, explain substitution bounds, and provide the final evaluated solution with verification.',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340" style="background:#ffffff; font-family:'JetBrains Mono', monospace, sans-serif;">
        <rect width="600" height="340" fill="#fafafa" stroke="#e5e5e5" stroke-width="4"/>
        <text x="30" y="45" font-size="18" font-weight="bold" fill="#171717" font-family="sans-serif">Student Handwritten Formula Sheet</text>
        <text x="30" y="70" font-size="12" fill="#737373" font-family="sans-serif">Topic: Definite Integration by Parts &amp; Differential Proof</text>
        
        <!-- Formula 1 -->
        <rect x="30" y="100" width="540" height="80" rx="8" fill="#ffffff" stroke="#d4d4d4" stroke-width="1.5"/>
        <text x="50" y="135" font-size="16" font-weight="bold" fill="#1e3a8a">∫ [0 to 1] x · e^(-2x) dx = ?</text>
        <text x="50" y="160" font-size="13" fill="#525252">Let u = x =&gt; du = dx ; dv = e^(-2x)dx =&gt; v = -1/2 e^(-2x)</text>

        <!-- Formula 2 -->
        <rect x="30" y="200" width="540" height="100" rx="8" fill="#ffffff" stroke="#d4d4d4" stroke-width="1.5"/>
        <text x="50" y="235" font-size="16" font-weight="bold" fill="#831843">Schrödinger Time-Independent 1D Wave Equation:</text>
        <text x="50" y="265" font-size="15" fill="#171717">- (ℏ² / 2m) · (d²ψ / dx²) + V(x)·ψ(x) = E·ψ(x)</text>
        <text x="50" y="285" font-size="12" fill="#737373">Where ℏ = h/(2π), m = particle mass, V(x) = potential, E = energy eigenvalue</text>
      </svg>
    `)}`
  },
  {
    id: 'sample_handwritten',
    name: 'Lecture_Notes_Page_4.png',
    category: 'handwritten',
    tag: 'Handwritten Notes',
    prompt: 'Transcribe these handwritten college lecture notes accurately. Summarize the core concepts, fix any missing steps or shorthand abbreviations, and explain the key takeaways for an exam.',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340" style="background:#fffbeb; font-family:'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif;">
        <rect width="600" height="340" fill="#fefce8" stroke="#fef08a" stroke-width="4"/>
        <line x1="80" y1="0" x2="80" y2="340" stroke="#f87171" stroke-width="1.5"/>
        <line x1="0" y1="90" x2="600" y2="90" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="0" y1="140" x2="600" y2="140" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="0" y1="190" x2="600" y2="190" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="0" y1="240" x2="600" y2="240" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="0" y1="290" x2="600" y2="290" stroke="#cbd5e1" stroke-width="1"/>

        <text x="95" y="65" font-size="20" font-weight="bold" fill="#1e3a5f">Lec 14: Gradient Descent &amp; Backprop</text>
        <text x="95" y="125" font-size="16" fill="#1e293b">- Loss J(w, b) = 1/m ∑ L(y_pred, y_true)</text>
        <text x="95" y="175" font-size="16" fill="#1e293b">- Weight update rule: w := w - α * (∂J / ∂w)</text>
        <text x="95" y="225" font-size="16" fill="#1e293b">- Learning rate α too large =&gt; diverges!</text>
        <text x="95" y="275" font-size="16" fill="#b91c1c">**EXAM ALERT: Always compute chain rule: ∂J/∂w = (∂J/∂a) * (∂a/∂z) * (∂z/∂w)</text>
      </svg>
    `)}`
  }
];

export const VisionCaptureModal: React.FC<VisionCaptureModalProps> = ({
  isOpen,
  onClose,
  onSelectImage
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'sample'>('camera');
  const [selectedCategory, setSelectedCategory] = useState<VisionCategory>('diagram');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedFileName, setCapturedFileName] = useState<string>('camera_capture.jpg');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize and stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (facing: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser. Please use the Upload option.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(err.message || 'Unable to access camera. Please grant camera permission or use file upload.');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeMode === 'camera' && !capturedDataUrl) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, facingMode, capturedDataUrl]);

  if (!isOpen) return null;

  // Snap photo from live video feed
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);
    setCapturedFileName(`Diagram_Capture_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.jpg`);
    stopCamera();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedDataUrl(null);
    if (activeMode === 'camera') {
      startCamera(facingMode);
    }
  };

  // Flip camera between front and environment back
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
  };

  // Handle uploaded file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedDataUrl(result);
      setCapturedFileName(file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Pick sample visual
  const handlePickSample = (sample: typeof SAMPLE_VISUALS[0]) => {
    setCapturedDataUrl(sample.svgDataUrl);
    setCapturedFileName(sample.name);
    setSelectedCategory(sample.category);
  };

  // Confirm image payload to parent AITutorView
  const handleConfirmImage = (customPrompt?: string) => {
    if (!capturedDataUrl) return;

    const base64Prefix = 'base64,';
    const idx = capturedDataUrl.indexOf(base64Prefix);
    const data = idx !== -1 ? capturedDataUrl.substring(idx + base64Prefix.length) : capturedDataUrl;

    let mimeType = 'image/jpeg';
    if (capturedDataUrl.startsWith('data:image/png')) mimeType = 'image/png';
    else if (capturedDataUrl.startsWith('data:image/svg+xml')) mimeType = 'image/svg+xml';
    else if (capturedDataUrl.startsWith('data:image/webp')) mimeType = 'image/webp';

    onSelectImage({
      data,
      dataUrl: capturedDataUrl,
      mimeType,
      name: capturedFileName,
      category: selectedCategory,
      defaultPrompt: customPrompt
    });

    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-950 flex items-center gap-2">
                Gemini Flash Vision Scanner
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Multimodal
                </span>
              </h3>
              <p className="text-xs text-neutral-500">
                Snap or upload diagrams, handwritten notes, and formulas for instant AI breakdown
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        {!capturedDataUrl && (
          <div className="flex border-b border-neutral-200 px-5 pt-3 gap-2 bg-neutral-50/30">
            <button
              onClick={() => {
                setActiveMode('camera');
                setCapturedDataUrl(null);
              }}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeMode === 'camera'
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Live Camera Capture</span>
            </button>
            <button
              onClick={() => {
                setActiveMode('upload');
                stopCamera();
              }}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeMode === 'upload'
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image File</span>
            </button>
            <button
              onClick={() => {
                setActiveMode('sample');
                stopCamera();
              }}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeMode === 'sample'
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-neutral-900" />
              <span>Sample Diagrams &amp; Notes</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Active Preview if captured */}
          {capturedDataUrl ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 aspect-video flex items-center justify-center">
                <img
                  src={capturedDataUrl}
                  alt="Captured work"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  onClick={handleRetake}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-neutral-950/80 hover:bg-neutral-950 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md shadow-md cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake / Change</span>
                </button>
              </div>

              {/* Tag / Vision Category Selection */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-2">
                  Select Visual Category (Guides Gemini Flash Vision's focus):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('diagram')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedCategory === 'diagram'
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Layers className="w-4 h-4" />
                      <span>Diagram &amp; Architecture</span>
                    </div>
                    <span className="text-[10px] opacity-75">Circuits, flowcharts, biological systems</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('handwritten')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedCategory === 'handwritten'
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <FileText className="w-4 h-4" />
                      <span>Handwritten Notes</span>
                    </div>
                    <span className="text-[10px] opacity-75">Lecture scribble, blackboard photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory('formula')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedCategory === 'formula'
                        ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Sigma className="w-4 h-4" />
                      <span>Formula &amp; Proof</span>
                    </div>
                    <span className="text-[10px] opacity-75">Calculus, physics equations, unit derivations</span>
                  </button>
                </div>
              </div>

              {/* Quick Action Prompt Shortcuts */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-2">
                  Quick Question Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory === 'diagram' && (
                    <>
                      <button
                        onClick={() => handleConfirmImage('Explain this diagram step-by-step and describe how each component works together.')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Explain components &amp; flow →
                      </button>
                      <button
                        onClick={() => handleConfirmImage('Identify any design flaws or potential bottlenecks in this system architecture diagram.')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Analyze bottlenecks &amp; flaws →
                      </button>
                    </>
                  )}
                  {selectedCategory === 'handwritten' && (
                    <>
                      <button
                        onClick={() => handleConfirmImage('Transcribe these handwritten notes, fix any shorthand notation, and highlight the main exam points.')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Transcribe &amp; clarify notes →
                      </button>
                      <button
                        onClick={() => handleConfirmImage('Are there any conceptual errors or mistaken formulas written down in these student notes?')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Find errors in notes →
                      </button>
                    </>
                  )}
                  {selectedCategory === 'formula' && (
                    <>
                      <button
                        onClick={() => handleConfirmImage('Solve and derive this mathematical formula step-by-step, explaining each substitution and law used.')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Solve step-by-step →
                      </button>
                      <button
                        onClick={() => handleConfirmImage('Perform dimensional and unit analysis on this formula, defining every variable and constant.')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Dimensional &amp; unit analysis →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Camera Viewfinder */}
              {activeMode === 'camera' && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
                      <p className="text-sm font-semibold text-red-900">{cameraError}</p>
                      <p className="text-xs text-red-700">
                        You can still upload images from your device or test with our sample academic diagrams below.
                      </p>
                      <button
                        onClick={() => setActiveMode('upload')}
                        className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-semibold cursor-pointer"
                      >
                        Switch to File Upload
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-950 aspect-video flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Optical Grid overlay */}
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10">
                        <div className="border-r border-b border-white/10" />
                        <div className="border-r border-b border-white/10" />
                        <div className="border-b border-white/10" />
                        <div className="border-r border-b border-white/10" />
                        <div className="border-r border-b border-white/10" />
                        <div className="border-b border-white/10" />
                        <div className="border-r border-white/10" />
                        <div className="border-r border-white/10" />
                        <div />
                      </div>

                      {/* Viewfinder Target Framing */}
                      <div className="absolute inset-10 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex items-center justify-center">
                        <span className="text-white/60 text-xs font-medium px-2 py-1 bg-black/40 rounded-md backdrop-blur-xs">
                          Align formula, diagram, or notes here
                        </span>
                      </div>

                      {/* Controls Bar overlay */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={handleFlipCamera}
                          className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer"
                          title="Flip camera"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={handleSnapPhoto}
                          className="w-16 h-16 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-xl ring-4 ring-white/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Capture photo"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-neutral-950 flex items-center justify-center">
                            <Camera className="w-6 h-6" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Drag & Drop View */}
              {activeMode === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-neutral-950 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-neutral-50/50 hover:bg-neutral-50 flex flex-col items-center justify-center gap-3 min-h-[260px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-neutral-900">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-950">Click or drag &amp; drop to upload visual work</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Supports PNG, JPG, JPEG, WEBP, or SVG (Up to 15MB)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-lg shadow-2xs">
                      Diagrams &amp; Circuits
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-lg shadow-2xs">
                      Handwritten Notes
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 text-[11px] font-medium rounded-lg shadow-2xs">
                      Formulas &amp; Proofs
                    </span>
                  </div>
                </div>
              )}

              {/* Sample Visuals */}
              {activeMode === 'sample' && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-500">
                    Select a built-in college diagram or handwritten sheet to test Gemini Flash Vision right now:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_VISUALS.map(sample => (
                      <div
                        key={sample.id}
                        onClick={() => handlePickSample(sample)}
                        className="rounded-2xl border border-neutral-200 bg-white hover:border-neutral-950 p-3 flex flex-col justify-between transition-all cursor-pointer shadow-2xs group"
                      >
                        <div className="space-y-2">
                          <div className="h-28 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200/80 flex items-center justify-center">
                            <img
                              src={sample.svgDataUrl}
                              alt={sample.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800">
                              {sample.tag}
                            </span>
                            <p className="text-xs font-bold text-neutral-900 mt-1 truncate">{sample.name}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mt-3 w-full py-1.5 px-2 bg-neutral-950 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Select Sample</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
            <span>Processed securely via Gemini Flash Vision in backend</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-neutral-700 hover:bg-neutral-200/60 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {capturedDataUrl && (
              <button
                type="button"
                onClick={() => handleConfirmImage()}
                className="px-5 py-2 rounded-xl bg-neutral-950 hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Analyze with Gemini Flash Vision</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
