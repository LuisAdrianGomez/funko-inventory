import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import CameraCapture from '../components/Camera/CameraCapture';
import { readBarcodeFromImage } from '../utils/barcode';
import { useToast } from '../hooks/useToast';
import { searchProducts } from '../utils/inventory';
import ProductCard from '../components/Inventory/ProductCard';
import Spinner from '../components/UI/Spinner';
import ToastContainer from '../components/UI/Toast';

// step: 'idle' | 'camera' | 'reading' | 'not_found' | 'manual_barcode'
export default function Search() {
  const { inventory } = useInventory();
  const navigate = useNavigate();
  const { toasts, toast, dismiss } = useToast();

  const [query, setQuery] = useState('');
  const [step, setStep] = useState('idle');
  const [manualBarcode, setManualBarcode] = useState('');

  const products = inventory?.products ?? [];
  const results = query.trim().length > 0
    ? searchProducts(products, query)
    : [];

  async function handlePhotoCapture(base64) {
    setStep('reading');
    const result = await readBarcodeFromImage(base64);

    if (!result.success) {
      toast.error('No se detectó código. Intenta de nuevo.');
      setStep('manual_barcode');
      return;
    }

    resolveBarcode(result.value);
  }

  function resolveBarcode(barcode) {
    const found = products.find(p => p.barcode === barcode || p.id === barcode);
    if (found) {
      navigate(`/product/${found.id}`);
    } else {
      setStep('not_found');
      setManualBarcode(barcode);
      toast.info('Funko no encontrado en el inventario.');
    }
  }

  function handleManualBarcodeSubmit(e) {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    resolveBarcode(manualBarcode.trim());
  }

  if (step === 'camera') {
    return (
      <CameraCapture
        label="Foto de la base"
        hint="Enfoca el código de barras claramente"
        onCapture={handlePhotoCapture}
        onCancel={() => setStep('idle')}
      />
    );
  }

  return (
    <>
      <div className="px-4 pt-4 pb-24">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Buscar por nombre, línea, número..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <button
            onClick={() => setStep('camera')}
            title="Buscar por código de barras"
            className="flex-shrink-0 w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
              />
            </svg>
          </button>
        </div>

        {step === 'reading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Spinner />
            <p className="text-sm text-zinc-400">Leyendo código...</p>
          </div>
        )}

        {step === 'not_found' && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
            <p className="text-sm text-zinc-300 mb-1">
              Código <span className="font-mono text-zinc-400">{manualBarcode}</span> no está en el inventario.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate('/add', { state: { barcode: manualBarcode } })}
                className="flex-1 bg-white text-zinc-900 text-sm font-medium rounded-lg py-2 px-3"
              >
                Agregar Funko
              </button>
              <button
                onClick={() => { setStep('idle'); setManualBarcode(''); }}
                className="flex-1 bg-zinc-800 text-zinc-300 text-sm rounded-lg py-2 px-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === 'manual_barcode' && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
            <p className="text-sm text-zinc-400 mb-3">
              No se pudo leer el código automáticamente. Ingrésalo manualmente:
            </p>
            <form onSubmit={handleManualBarcodeSubmit} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="012345678901"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <button
                type="submit"
                className="bg-white text-zinc-900 text-sm font-medium rounded-lg py-2 px-4"
              >
                Buscar
              </button>
            </form>
            <button
              onClick={() => { setStep('idle'); setManualBarcode(''); }}
              className="mt-2 text-xs text-zinc-500 underline"
            >
              Cancelar
            </button>
          </div>
        )}

        {step === 'idle' && query.trim().length > 0 && (
          <>
            <p className="text-xs text-zinc-500 mb-3">
              {results.length} resultado{results.length !== 1 ? 's' : ''} para &quot;{query}&quot;
            </p>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm">Sin resultados</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {results.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}

        {step === 'idle' && query.trim().length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">Escribe para buscar o usa la cámara para escanear un código de barras</p>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
