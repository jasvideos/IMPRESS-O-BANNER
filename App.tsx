
import React, { useState } from 'react';
import { PRINT_SIZES, MM_TO_INCH } from './constants.ts';
import { QualityStatus } from './types.ts';
import { 
  FileImage, 
  Printer, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Maximize, 
  Settings,
  X
} from 'lucide-react';

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(PRINT_SIZES[0]);
  const [orientation, setOrientation] = useState('portrait');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customDimensions, setCustomDimensions] = useState({ w: 210, h: 297 });

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Fix: Ensure result is treated as a string for Image source and dataUrl state
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        setSelectedImage({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          name: file.name,
          dataUrl: dataUrl
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const currentWidthMm = selectedSize.id === 'custom' ? customDimensions.w : (orientation === 'portrait' ? selectedSize.widthMm : selectedSize.heightMm);
  const currentHeightMm = selectedSize.id === 'custom' ? customDimensions.h : (orientation === 'portrait' ? selectedSize.heightMm : selectedSize.widthMm);

  const calculateDPI = () => {
    if (!selectedImage) return 0;
    const widthInches = currentWidthMm * MM_TO_INCH;
    const heightInches = currentHeightMm * MM_TO_INCH;
    const dpiX = selectedImage.width / widthInches;
    const dpiY = selectedImage.height / heightInches;
    return Math.round(Math.min(dpiX, dpiY));
  };

  const dpi = calculateDPI();

  const getQualityStatus = (dpiValue) => {
    if (dpiValue >= 300) return QualityStatus.EXCELLENT;
    if (dpiValue >= 150) return QualityStatus.GOOD;
    if (dpiValue >= 100) return QualityStatus.FAIR;
    return QualityStatus.POOR;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case QualityStatus.EXCELLENT: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case QualityStatus.GOOD: return 'text-blue-600 bg-blue-50 border-blue-200';
      case QualityStatus.FAIR: return 'text-amber-600 bg-amber-50 border-amber-200';
      case QualityStatus.POOR: return 'text-red-600 bg-red-50 border-red-200';
      default: return '';
    }
  };

  const status = getQualityStatus(dpi);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Printer className="text-indigo-600" />
            PrintMaster <span className="text-indigo-600">Pro</span>
          </h1>
          <p className="text-slate-500">Prepare suas imagens para a impressão perfeita.</p>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileImage size={20} className="text-indigo-500" />
              1. Selecione a Imagem
            </h2>
            <div className="relative group">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="border-2 border-dashed border-slate-300 group-hover:border-indigo-400 rounded-xl p-8 text-center transition-colors">
                {selectedImage ? (
                  <div className="space-y-2">
                    <p className="font-medium text-indigo-600 truncate">{selectedImage.name}</p>
                    <p className="text-xs text-slate-400">{selectedImage.width}x{selectedImage.height} px</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                      <FileImage size={24} />
                    </div>
                    <p className="text-sm text-slate-500">Clique para carregar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-indigo-500" />
              2. Configurações
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho</label>
                <select 
                  value={selectedSize.id}
                  onChange={(e) => setSelectedSize(PRINT_SIZES.find(s => s.id === e.target.value) || PRINT_SIZES[0])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  {PRINT_SIZES.map(size => (
                    <option key={size.id} value={size.id}>{size.name}</option>
                  ))}
                </select>
              </div>

              {selectedSize.id !== 'custom' && (
                <div className="flex gap-2">
                  <button onClick={() => setOrientation('portrait')} className={`flex-1 p-2 rounded-lg border text-xs font-medium ${orientation === 'portrait' ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>Retrato</button>
                  <button onClick={() => setOrientation('landscape')} className={`flex-1 p-2 rounded-lg border text-xs font-medium ${orientation === 'landscape' ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>Paisagem</button>
                </div>
              )}
            </div>
          </div>

          {selectedImage && (
            <div className={`p-6 rounded-2xl border-2 ${getStatusColor(status)}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold flex items-center gap-2">
                  {dpi >= 150 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  Qualidade
                </h3>
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/50 font-bold border border-current uppercase">
                  {status}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black">{dpi}</span>
                <span className="text-lg font-medium opacity-80">DPI</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-100 rounded-3xl p-8 min-h-[500px] flex items-center justify-center relative">
            <div 
              className="bg-white shadow-2xl relative transition-all overflow-hidden flex items-center justify-center"
              style={{
                width: orientation === 'portrait' ? 'auto' : '100%',
                maxWidth: '100%',
                aspectRatio: `${currentWidthMm} / ${currentHeightMm}`,
                height: orientation === 'portrait' ? '450px' : 'auto',
                maxHeight: '60vh',
              }}
            >
              {selectedImage ? (
                <img src={selectedImage.dataUrl} className="w-full h-full object-cover" />
              ) : (
                <Printer size={48} className="opacity-10" />
              )}
            </div>
          </div>

          <div className="flex gap-4">
             <button 
                disabled={!selectedImage}
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
             >
                <Printer size={20} /> Imprimir
             </button>
             <button 
                onClick={() => setIsPreviewOpen(true)}
                disabled={!selectedImage}
                className="bg-white border-2 border-slate-200 hover:border-indigo-500 px-8 rounded-2xl font-bold transition-all"
             >
                Preview Zoom
             </button>
          </div>
        </div>
      </main>

      {isPreviewOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 text-white"><X size={32} /></button>
          <div className="max-w-4xl w-full text-center space-y-4">
            <h2 className="text-white text-xl font-bold">Preview de Qualidade (Pixel Real)</h2>
            <div className="bg-white rounded-2xl overflow-hidden h-[60vh] relative">
              <div className="w-full h-full overflow-auto flex items-center justify-center p-8 bg-slate-200">
                <img src={selectedImage.dataUrl} style={{ minWidth: selectedImage.width }} className="max-w-none shadow-2xl" />
              </div>
            </div>
            <button onClick={() => setIsPreviewOpen(false)} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
