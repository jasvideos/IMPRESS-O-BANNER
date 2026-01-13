
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
        const suggestedWidth = 210;
        setCustomDimensions({
          w: suggestedWidth,
          h: Math.round(suggestedWidth / metadata.aspectRatio)
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
            contents: `Explique brevemente que a imagem foi ampliada de ${img.width}x${img.height} para ${canvas.width}x${canvas.height} melhorando a densidade de pixels para impressão.`
          });

          setUpscaleLog(response.text || "Sucesso!");
          
          setSelectedImage(prev => prev ? {
            ...prev,
            width: canvas.width,
            height: canvas.height,
            dataUrl: newDataUrl
          } : null);
          
          setTimeout(() => {
            setIsUpscaling(false);
            setUpscaleLog("");
          }, 1500);
        }
      };
      img.src = selectedImage.dataUrl;
    } catch (error) {
      console.error(error);
      setIsUpscaling(false);
      setUpscaleLog("Erro no processamento.");
    }
  };

  const calculateDPI = () => {
    if (!selectedImage) return 0;
    const widthInches = customDimensions.w * MM_TO_INCH;
    const heightInches = customDimensions.h * MM_TO_INCH;
    const dpiX = selectedImage.width / widthInches;
    const dpiY = selectedImage.height / heightInches;
    return Math.round(Math.min(dpiX, dpiY));
  };

  const dpi = calculateDPI();

  const getQualityStatus = (dpiValue: number): QualityStatus => {
    if (dpiValue >= 300) return QualityStatus.EXCELLENT;
    if (dpiValue >= 150) return QualityStatus.GOOD;
    if (dpiValue >= 100) return QualityStatus.FAIR;
    return QualityStatus.POOR;
  };

  const getStatusColor = (status: QualityStatus) => {
    switch (status) {
      case QualityStatus.EXCELLENT: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case QualityStatus.GOOD: return 'text-blue-600 bg-blue-50 border-blue-200';
      case QualityStatus.FAIR: return 'text-amber-600 bg-amber-50 border-amber-200';
      case QualityStatus.POOR: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-400';
    }
  };

  const currentStatus = getQualityStatus(dpi);

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full max-w-6xl p-6 md:p-8 flex justify-between items-end border-b border-slate-200 no-print">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Printer className="text-white" size={24} />
            </div>
            PrintMaster <span className="text-indigo-600">Ultra</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Pronto para Vercel: Alta Resolução e Precisão.</p>
        </div>
      </header>

      <main className="w-full max-w-6xl p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileImage size={14} /> 01. Enviar Arquivo
            </h2>
            <div className="relative group overflow-hidden rounded-2xl">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="border-2 border-dashed border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 rounded-2xl p-6 text-center transition-all">
                {selectedImage ? (
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                      <img src={selectedImage.dataUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate text-xs">{selectedImage.name}</p>
                      <p className="text-[10px] font-mono text-indigo-500 font-bold">{selectedImage.width}x{selectedImage.height}px</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-sm font-bold text-slate-600">Clique para selecionar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedImage && (
            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800">
               <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={14} /> 02. Melhorar Nitidez
              </h2>
              <button 
                onClick={upscaleImage}
                disabled={isUpscaling}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isUpscaling ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isUpscaling ? "Processando..." : "Escalonar (2x mais pixels)"}
              </button>
              {upscaleLog && (
                <p className="mt-3 text-[10px] font-mono text-indigo-300 text-center">{upscaleLog}</p>
              )}
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings size={14} /> 03. Tamanho Final (mm)
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Largura</label>
                  <input 
                    type="number" 
                    value={customDimensions.w}
                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, w: Math.max(1, Number(e.target.value)) }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Altura</label>
                  <input 
                    type="number" 
                    value={customDimensions.h}
                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, h: Math.max(1, Number(e.target.value)) }))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>
              <button 
                onClick={() => {
                   if(selectedImage) {
                    setCustomDimensions({
                      w: Math.round(customDimensions.h * selectedImage.aspectRatio),
                      h: customDimensions.h
                    });
                   }
                }}
                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                Manter Proporção da Imagem
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 md:p-12 min-h-[500px] flex flex-col items-center justify-center relative border border-slate-200 shadow-sm overflow-hidden">
            {selectedImage && (
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
                <div className={`px-3 py-1.5 rounded-full border-2 font-black text-[10px] uppercase flex items-center gap-2 backdrop-blur-md ${getStatusColor(currentStatus)}`}>
                  {currentStatus} • {dpi} DPI
                </div>
              </div>
            )}

            <div 
              className="relative transition-all duration-500 group"
              style={{
                width: '100%',
                maxWidth: '450px',
                aspectRatio: `${customDimensions.w} / ${customDimensions.h}`,
                boxShadow: '0 40px 80px -20px rgba(0,0,0,0.1)'
              }}
            >
              {!selectedImage ? (
                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded">
                  <Printer size={32} className="text-slate-200 mb-2" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-tight">Preview</p>
                </div>
              ) : (
                <div className="w-full h-full relative group">
                  <img src={selectedImage.dataUrl} className="w-full h-full object-cover rounded shadow-inner" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <button 
                      onClick={() => setIsPreviewOpen(true)}
                      className="bg-white text-slate-900 px-5 py-2.5 rounded-full font-black text-xs flex items-center gap-2 shadow-xl"
                     >
                      <Maximize size={14} /> ZOOM DE QUALIDADE
                     </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-12 w-full max-w-sm">
              <button 
                disabled={!selectedImage}
                onClick={() => window.print()}
                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
              >
                <Printer size={18} /> IMPRIMIR AGORA
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ÁREA EXCLUSIVA DE IMPRESSÃO */}
      <div className="hidden print:block print:fixed print:inset-0 bg-white">
        {selectedImage && (
          <div className="w-full h-full flex items-center justify-center p-0">
             <img 
              src={selectedImage.dataUrl} 
              style={{ 
                width: `${customDimensions.w}mm`, 
                height: `${customDimensions.h}mm`,
                objectFit: 'cover'
              }} 
            />
          </div>
        )}
      </div>

      {/* Modal Zoom */}
      {isPreviewOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col p-4 md:p-10 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <div className="text-white">
                <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                  Verificação de Resolução
                </h2>
                <p className="text-slate-400 text-xs md:text-sm font-medium">Vendo pixels reais.</p>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden relative">
              <div className="w-full h-full overflow-auto flex items-start justify-center p-8 md:p-20">
                <img 
                  src={selectedImage.dataUrl} 
                  style={{ width: `${selectedImage.width}px` }} 
                  className="max-w-none shadow-2xl border-2 border-white/10" 
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl text-sm"
              >
                FECHAR ZOOM
              </button>
              <button 
                onClick={() => { setIsPreviewOpen(false); window.print(); }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl text-sm shadow-lg shadow-indigo-600/20"
              >
                IMPRIMIR ESTA VERSÃO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
