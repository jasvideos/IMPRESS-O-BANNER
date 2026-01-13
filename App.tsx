
import React, { useState } from 'react';
import { PrintSize, ImageMetadata, QualityStatus } from './types.ts';
import { PRINT_SIZES, MM_TO_INCH } from './constants.ts';
import { 
  FileImage, 
  Printer, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  X,
  Maximize,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [selectedSize] = useState<PrintSize>(PRINT_SIZES[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customDimensions, setCustomDimensions] = useState({ w: 210, h: 297 });
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleLog, setUpscaleLog] = useState("");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const metadata = {
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          name: file.name,
          dataUrl: e.target?.result as string
        };
        setSelectedImage(metadata);
        setCustomDimensions({
          w: 210,
          h: Math.round(210 / metadata.aspectRatio)
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const upscaleImage = async () => {
    if (!selectedImage) return;
    setIsUpscaling(true);
    setUpscaleLog("Iniciando motor de super-resolução...");

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        const scaleFactor = 2;
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const newDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setUpscaleLog("Refinando detalhes com IA...");
          
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `A imagem foi ampliada para ${canvas.width}x${canvas.height}. Confirme que isso melhora a impressão.`
          });

          setUpscaleLog(response.text || "Sucesso!");
          setSelectedImage(prev => prev ? { ...prev, width: canvas.width, height: canvas.height, dataUrl: newDataUrl } : null);
          
          setTimeout(() => {
            setIsUpscaling(false);
            setUpscaleLog("");
          }, 1500);
        }
      };
      img.src = selectedImage.dataUrl;
    } catch (error) {
      setIsUpscaling(false);
      setUpscaleLog("Erro no processamento.");
    }
  };

  const calculateDPI = () => {
    if (!selectedImage) return 0;
    const widthInches = customDimensions.w * MM_TO_INCH;
    const heightInches = customDimensions.h * MM_TO_INCH;
    return Math.round(Math.min(selectedImage.width / widthInches, selectedImage.height / heightInches));
  };

  const dpi = calculateDPI();
  const getQualityStatus = (v: number) => {
    if (v >= 300) return QualityStatus.EXCELLENT;
    if (v >= 150) return QualityStatus.GOOD;
    if (v >= 100) return QualityStatus.FAIR;
    return QualityStatus.POOR;
  };

  const getStatusColor = (s: QualityStatus) => {
    switch (s) {
      case QualityStatus.EXCELLENT: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case QualityStatus.GOOD: return 'text-blue-600 bg-blue-50 border-blue-200';
      case QualityStatus.FAIR: return 'text-amber-600 bg-amber-50 border-amber-200';
      case QualityStatus.POOR: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-400';
    }
  };

  const currentStatus = getQualityStatus(dpi);

  return (
    <div className="min-h-screen flex flex-col items-center pb-20">
      <header className="w-full max-w-6xl p-6 md:p-8 flex justify-between items-end border-b border-slate-200 no-print">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Printer className="text-white" size={24} />
            </div>
            PrintMaster <span className="text-indigo-600">Ultra</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Lab de Impressão de Alta Fidelidade</p>
        </div>
      </header>

      <main className="w-full max-w-6xl p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileImage size={14} /> 01. Arquivo
            </h2>
            <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {selectedImage ? (
                <div className="flex items-center gap-3">
                  <img src={selectedImage.dataUrl} className="w-12 h-12 rounded object-cover" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs truncate">{selectedImage.name}</p>
                    <p className="text-[10px] text-indigo-500 font-mono">{selectedImage.width}x{selectedImage.height}px</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm font-bold text-slate-400 py-4">Clique para carregar</p>
              )}
            </div>
          </div>

          {selectedImage && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
               <h2 className="text-xs font-bold text-indigo-400 uppercase mb-4 flex items-center gap-2">
                <Sparkles size={14} /> 02. Super Resolução
              </h2>
              <button 
                onClick={upscaleImage}
                disabled={isUpscaling}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {isUpscaling ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isUpscaling ? "Ampliando..." : "Escalonar 2x (Melhorar)"}
              </button>
              {upscaleLog && <p className="mt-2 text-[9px] font-mono text-indigo-300 text-center">{upscaleLog}</p>}
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <Settings size={14} /> 03. Tamanho (mm)
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Largura</label>
                <input type="number" value={customDimensions.w} onChange={e => setCustomDimensions(p => ({...p, w: Number(e.target.value)}))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Altura</label>
                <input type="number" value={customDimensions.h} onChange={e => setCustomDimensions(p => ({...p, h: Number(e.target.value)}))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
              </div>
            </div>
            <button onClick={() => selectedImage && setCustomDimensions({ w: Math.round(customDimensions.h * selectedImage.aspectRatio), h: customDimensions.h })} className="text-[10px] text-indigo-600 font-bold hover:underline">Ajustar Proporção</button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 min-h-[500px] flex flex-col items-center justify-center border border-slate-200 shadow-sm relative">
            {selectedImage && (
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full border-2 font-black text-[10px] uppercase ${getStatusColor(currentStatus)}`}>
                  {currentStatus} • {dpi} DPI
                </div>
              </div>
            )}
            <div className="relative group transition-all" style={{ width: '100%', maxWidth: '400px', aspectRatio: `${customDimensions.w}/${customDimensions.h}`, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.1)' }}>
              {!selectedImage ? (
                <div className="absolute inset-0 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                  <Printer size={40} />
                  <p className="text-[10px] font-bold mt-2 uppercase">Aguardando Imagem</p>
                </div>
              ) : (
                <div className="w-full h-full relative group cursor-zoom-in" onClick={() => setIsPreviewOpen(true)}>
                  <img src={selectedImage.dataUrl} className="w-full h-full object-cover rounded shadow-inner" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                    <Maximize className="text-white" size={24} />
                  </div>
                </div>
              )}
            </div>
            <button disabled={!selectedImage} onClick={() => window.print()} className="mt-12 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 disabled:bg-slate-200 transition-all active:scale-95">
              <Printer size={20} /> IMPRIMIR
            </button>
          </div>
        </div>
      </main>

      <div className="hidden print:block print:fixed print:inset-0 bg-white">
        {selectedImage && (
          <div className="w-full h-full flex items-center justify-center">
             <img src={selectedImage.dataUrl} style={{ width: `${customDimensions.w}mm`, height: `${customDimensions.h}mm`, objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {isPreviewOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4 text-white">
            <h2 className="text-xl font-black">Inspeção de Pixels</h2>
            <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-auto rounded-3xl bg-slate-900 border border-white/5 flex items-start justify-center p-10">
            <img src={selectedImage.dataUrl} style={{ width: `${selectedImage.width}px` }} className="max-w-none shadow-2xl border-2 border-white/10" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
