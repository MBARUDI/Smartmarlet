
import React from 'react';
import { CartItem } from '../types';
import { TrashIcon, ShoppingCartIcon, ArrowPathIcon, ExclamationCircleIcon, LinkIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface CartProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
  onFinalize: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onRemove, onUpdateQuantity, onUpdatePrice, onFinalize }) => {
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + (item.quantity * (item.estimatedUnitPrice || 0)), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCartIcon className="w-6 h-6 text-green-400" />
            Carrinho
          </h2>
          <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-green-500/30">
            {items.length} Tipos
          </span>
        </div>

        <div className="flex flex-col">
           <span className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">Total Estimado</span>
           <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black text-white tracking-tighter">
               {formatCurrency(totalPrice)}
             </span>
             <span className="text-sm text-slate-400 font-medium">({totalQuantity} un)</span>
           </div>
           <div className="flex items-center gap-1.5 mt-3 text-[10px] text-teal-300 font-semibold bg-teal-400/10 w-fit px-2 py-1 rounded border border-teal-400/20">
             <SparklesIcon className="w-3 h-3" />
             Preços em tempo real via IA
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-12">
             <div className="p-4 bg-slate-100 rounded-full">
                <ShoppingCartIcon className="w-12 h-12 opacity-20" />
             </div>
             <p className="font-medium text-sm">Seu carrinho está vazio.</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all hover:border-green-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate text-base">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>
                </div>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition"
                      >
                        +
                      </button>
                   </div>
                   
                   <div className="h-6 w-px bg-slate-200"></div>

                   <div className="flex flex-col group">
                     {item.isLoadingPrice ? (
                       <div className="flex items-center gap-1.5 text-blue-500 animate-pulse">
                         <ArrowPathIcon className="w-3 h-3 animate-spin" />
                         <span className="text-[10px] font-bold uppercase">Buscando...</span>
                       </div>
                     ) : (
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                           <div className="relative flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
                             <span className="text-[10px] font-bold text-slate-400 mr-1">R$</span>
                             <input 
                               type="number"
                               step="0.01"
                               value={item.estimatedUnitPrice || ''}
                               onChange={(e) => {
                                 const val = parseFloat(e.target.value);
                                 if (!isNaN(val)) onUpdatePrice(item.id, val);
                               }}
                               className="w-16 text-sm font-black text-slate-800 outline-none bg-transparent"
                               placeholder="0.00"
                             />
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">/un</span>
                         </div>
                         
                         {item.suggestedPrice && !item.error && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider w-fit border border-blue-100">
                              Valor de Referência
                            </span>
                         )}

                         {item.error && (
                           <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 w-fit">
                              <ExclamationCircleIcon className="w-3 h-3" />
                              <span className="text-[9px] font-bold uppercase tracking-tighter">
                                {item.error}
                              </span>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                </div>

                <div className="text-right">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Subtotal</p>
                   {item.isLoadingPrice ? (
                     <div className="h-5 w-16 bg-slate-100 rounded animate-pulse"></div>
                   ) : (
                      <span className="font-extrabold text-slate-900 text-lg">
                        {formatCurrency((item.estimatedUnitPrice || 0) * item.quantity)}
                      </span>
                   )}
                </div>
              </div>

              {/* Grounding Sources */}
              {item.sources && item.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Fontes de Pesquisa
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.sources.slice(0, 3).map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded border border-slate-200 transition truncate max-w-[150px]"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <button 
          onClick={onFinalize}
          disabled={items.length === 0}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
        >
          <ShoppingCartIcon className="w-5 h-5" />
          Finalizar Compra
        </button>
      </div>
      
      <div className="p-3 bg-slate-900 text-center shrink-0">
        <p className="text-[9px] text-slate-400 leading-tight uppercase font-bold tracking-widest">
          Os preços mostrados são estimativas baseadas em dados públicos de mercado.
        </p>
      </div>
    </div>
  );
};

export default Cart;
