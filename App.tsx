
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PrintSize, ImageMetadata, QualityStatus } from './types';
import { PRINT_SIZES, MM_TO_INCH } from './constants';
import { 
  FileImage, 
  Printer, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Maximize, 
  Crop, 
  Settings,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [selectedSize, setSelectedSize] = useState<PrintSize>(PRINT_SIZES[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customDimensions, setCustomDimensions] = useState({ w: 210, h: 297 });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSelectedImage({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          name: file.name,
          dataUrl: e.target?.result as string
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const currentWidthMm = selectedSize.id === 'custom' ? customDimensions.w : (orientation === 'portrait' ? selectedSize.widthMm : selectedSize.heightMm);
  const currentHeightMm = selectedSize.id === 'custom' ? customDimensions.h : (orientation === 'portrait' ? selectedSize.heightMm : selectedSize.widthMm);

  const calculateDPI = () => {
    if (!selectedImage) return 0;
    // Calculate DPI based on actual pixel size vs target physical size
    // DPI = Pixels / Inches
    const widthInches = currentWidthMm * MM_TO_INCH;
    const heightInches = currentHeightMm * MM_TO_INCH;
    
    // We assume the image will be fit/stretched to the canvas. 
    // In a real scenario, we'd account for cropping.
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
        {/* Lado Esquerdo: Configurações */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileImage size={20} className="text-indigo-500" />
              1. Selecione a Imagem
            </h2>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
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
                    <p className="text-sm text-slate-500">Clique ou arraste para carregar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-indigo-500" />
              2. Configurações de Impressão
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho do Papel</label>
                <select 
                  value={selectedSize.id}
                  onChange={(e) => setSelectedSize(PRINT_SIZES.find(s => s.id === e.target.value) || PRINT_SIZES[0])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  {PRINT_SIZES.map(size => (
                    <option key={size.id} value={size.id}>{size.name}</option>
                  ))}
                </select>
              </div>

              {selectedSize.id !== 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Orientação</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setOrientation('portrait')}
                      className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${orientation === 'portrait' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="w-4 h-6 border-2 border-current rounded-sm"></div>
                      <span className="text-xs font-medium">Retrato</span>
                    </button>
                    <button 
                      onClick={() => setOrientation('landscape')}
                      className={`flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${orientation === 'landscape' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="w-6 h-4 border-2 border-current rounded-sm"></div>
                      <span className="text-xs font-medium">Paisagem</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedSize.id === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Largura (mm)</label>
                    <input 
                      type="number" 
                      value={customDimensions.w}
                      onChange={(e) => setCustomDimensions(prev => ({ ...prev, w: Number(e.target.value) }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Altura (mm)</label>
                    <input 
                      type="number" 
                      value={customDimensions.h}
                      onChange={(e) => setCustomDimensions(prev => ({ ...prev, h: Number(e.target.value) }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metrics Card */}
          {selectedImage && (
            <div className={`p-6 rounded-2xl border-2 transition-all ${getStatusColor(status)}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold flex items-center gap-2">
                  {dpi >= 150 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  Qualidade da Impressão
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-white/50 font-bold border border-current uppercase">
                  {status}
                </span>
              </div>
              
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black">{dpi}</span>
                <span className="text-lg font-medium opacity-80 mb-1">DPI</span>
              </div>

              <div className="text-sm space-y-2 opacity-90">
                <div className="flex justify-between">
                  <span>Recomendado:</span>
                  <span className="font-semibold">300 DPI</span>
                </div>
                <p className="text-xs leading-relaxed mt-2 border-t border-black/10 pt-2 italic">
                  {dpi < 100 
                    ? "⚠️ ATENÇÃO: A imagem ficará pixelada e sem nitidez neste tamanho."
                    : dpi < 250 
                    ? "Pode haver perda leve de detalhes finos."
                    : "Excelente! Nitidez máxima garantida."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Visualização */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-100 rounded-3xl p-4 md:p-12 min-h-[500px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4 text-xs font-mono text-slate-400 bg-white/50 px-2 py-1 rounded">
              Canvas Virtual (Preview Realístico)
            </div>
            
            {/* O Papel Digital */}
            <div 
              className="bg-white shadow-2xl relative transition-all duration-500 overflow-hidden flex items-center justify-center"
              style={{
                width: orientation === 'portrait' ? 'auto' : '100%',
                maxWidth: '100%',
                aspectRatio: `${currentWidthMm} / ${currentHeightMm}`,
                height: orientation === 'portrait' ? '500px' : 'auto',
                maxHeight: '70vh',
              }}
            >
              {!selectedImage ? (
                <div className="text-slate-300 text-center space-y-2">
                  <Printer size={64} className="mx-auto opacity-20" />
                  <p className="text-sm font-medium italic">Aguardando imagem...</p>
                </div>
              ) : (
                <>
                  <img 
                    src={selectedImage.dataUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 group">
                    <button 
                      onClick={() => setIsPreviewOpen(true)}
                      className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform"
                    >
                      <Maximize size={18} />
                      Ver em Tamanho Real
                    </button>
                  </div>
                </>
              )}

              {/* Dimensões Label */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-400">
                {currentWidthMm}mm
              </div>
              <div className="absolute -right-12 top-1/2 -translate-y-1/2 rotate-90 text-sm font-bold text-slate-400">
                {currentHeightMm}mm
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex gap-4">
             <button 
                disabled={!selectedImage || dpi < 50}
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-slate-200"
             >
                <Printer size={20} />
                Imprimir Agora
             </button>
             <button 
                onClick={() => setIsPreviewOpen(true)}
                disabled={!selectedImage}
                className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 disabled:border-slate-100 disabled:text-slate-300 font-bold px-8 rounded-2xl transition-all"
             >
                Simular Textura
             </button>
          </div>
        </div>
      </main>

      {/* Modal de Preview de Resolução */}
      {isPreviewOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setIsPreviewOpen(false)}
            className="absolute top-6 right-6 text-white hover:text-indigo-400 transition-colors"
          >
            <X size={32} />
          </button>

          <div className="max-w-4xl w-full space-y-4">
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold">Preview de Resolução (Zoom 100%)</h2>
              <p className="text-slate-400">Assim é como os pixels aparecerão na impressão física final.</p>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden aspect-video relative">
              <div className="absolute top-4 left-4 z-10 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                <Info size={14} />
                {status === QualityStatus.POOR ? "AVISO: Baixa definição detectada" : "Nitidez Detectada"}
              </div>
              
              <div className="w-full h-full overflow-auto flex items-center justify-center bg-slate-200">
                <div 
                  className="flex-shrink-0"
                  style={{
                    width: `${selectedImage.width}px`,
                    height: `${selectedImage.height}px`,
                    backgroundImage: `url(${selectedImage.dataUrl})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    transform: 'scale(1)', // Simulating pixel to pixel
                  }}
                >
                  <img src={selectedImage.dataUrl} alt="Real zoom" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white">
                <span className="block text-xs uppercase opacity-50 mb-1">DPI Calculado</span>
                <span className="text-xl font-bold">{dpi} DPI</span>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white">
                <span className="block text-xs uppercase opacity-50 mb-1">Tamanho Físico</span>
                <span className="text-xl font-bold">{currentWidthMm}x{currentHeightMm} mm</span>
              </div>
              <div className="bg-white/10 border border-white/20 p-4 rounded-2xl text-white">
                <span className="block text-xs uppercase opacity-50 mb-1">Veredito</span>
                <span className={`text-xl font-bold ${dpi < 150 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {status}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition-all"
            >
              Voltar e Ajustar
            </button>
          </div>
        </div>
      )}

      {/* Hidden print stylesheet helper */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root main img, .print-canvas, .print-canvas * { visibility: visible; }
          #root main { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
