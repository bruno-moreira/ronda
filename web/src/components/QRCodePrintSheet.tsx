import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Shield, MapPin } from 'lucide-react';

interface Checkpoint {
  id: string;
  nome: string;
  qrCodeHash: string;
  ordem: number;
  latitude: number;
  longitude: number;
}

interface Route {
  id: string;
  nome: string;
  checkpoints: Checkpoint[];
}

interface QRCodePrintSheetProps {
  route: Route;
  onClose: () => void;
}

export const QRCodePrintSheet: React.FC<QRCodePrintSheetProps> = ({ route, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 no-print mb-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
              <Printer className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Imprimir Folha de QR Codes</h2>
              <p className="text-sm text-slate-400">
                Rota: <strong className="text-blue-400">{route.nome}</strong> ({route.checkpoints?.length || 0} checkpoints)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Agora</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO */}
      <div
        id="printable-qr-sheet"
        className="bg-white text-slate-900 rounded-2xl p-8 w-full max-w-4xl shadow-2xl border border-slate-200"
      >
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              RONDA DE SEGURANÇA - CHECKPOINTS
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Rota: <span className="font-bold text-slate-900">{route.nome}</span> | Gerado em: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-3 py-1 bg-slate-900 text-white rounded-full uppercase">
              Patrol Sheet
            </span>
          </div>
        </div>

        {(!route.checkpoints || route.checkpoints.length === 0) ? (
          <p className="text-center text-slate-500 py-8">Nenhum checkpoint cadastrado nesta rota.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {route.checkpoints.map((cp, idx) => (
              <div
                key={cp.id}
                className="border-2 border-dashed border-slate-400 rounded-xl p-4 flex flex-col items-center justify-between text-center bg-slate-50 relative break-inside-avoid"
              >
                <div className="w-full flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Ponto #{cp.ordem ?? idx + 1}
                  </span>
                  <Shield className="w-4 h-4 text-slate-400" />
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm my-2">
                  <QRCodeSVG
                    value={cp.qrCodeHash}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-2">{cp.nome}</h3>

                <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-1 font-mono">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Lat: {cp.latitude.toFixed(5)}, Long: {cp.longitude.toFixed(5)}</span>
                </div>

                <p className="text-[9px] text-slate-400 font-mono mt-2 break-all max-w-[200px]">
                  HASH: {cp.qrCodeHash.substring(0, 16)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
