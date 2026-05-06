
import React, { useState, useMemo } from 'react';
import { COMMON_PRODUCTS } from '../constants';
import { Product } from '../types';
import { PlusIcon, MagnifyingGlassIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface ProductListProps {
  onAdd: (product: Product, quantity: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const categories = useMemo(() => {
    const cats = Array.from(new Set(COMMON_PRODUCTS.map(p => p.category)));
    return ['Todos', ...cats];
  }, []);

  const filteredProducts = useMemo(() => {
    return COMMON_PRODUCTS.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [id]: newValue };
    });
  };

  const getQuantity = (id: string) => quantities[id] || 1;

  const handleAddCustomProduct = () => {
    if (!customItemName.trim()) return;
    
    const newProduct: Product = {
        id: `custom-${Date.now()}`,
        name: customItemName.trim(),
        category: 'Personalizado'
    };
    
    onAdd(newProduct, 1);
    setCustomItemName('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full lg:max-h-[850px]">
      <div className="p-6 border-b border-slate-100 bg-white z-10 space-y-6">
        {/* Custom Product Input - More prominent now */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100 shadow-sm ring-1 ring-green-200/50">
             <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-600 text-white p-1 rounded-md">
                   <PlusIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-green-900 uppercase tracking-widest">Adicionar Item Personalizado</h3>
             </div>
             <div className="flex flex-col sm:flex-row gap-3">
                 <div className="relative flex-1">
                    <ShoppingBagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                    <input 
                        type="text" 
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        placeholder="Nome do produto (ex: Detergente X)..."
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-green-100 rounded-xl text-sm font-medium focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomProduct()}
                    />
                 </div>
                 <button 
                    onClick={handleAddCustomProduct}
                    disabled={!customItemName.trim()}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 active:scale-95"
                 >
                    Adicionar
                 </button>
             </div>
             <p className="text-[10px] text-green-600 font-bold mt-2 uppercase tracking-wide opacity-70">
                A IA pesquisará o preço assim que você adicionar.
             </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Ou escolha da lista</h2>
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="Pesquisar produtos comuns..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto p-4 flex-1 bg-slate-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] uppercase font-black tracking-[0.15em] text-slate-400 mb-1 block">
                    {product.category}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-green-700 transition-colors">
                    {product.name}
                  </h3>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-100">
                <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm p-0.5">
                  <button 
                    onClick={() => handleQuantityChange(product.id, -1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-black text-slate-700">
                    {getQuantity(product.id)}
                  </span>
                  <button 
                    onClick={() => handleQuantityChange(product.id, 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition"
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    onAdd(product, getQuantity(product.id));
                    setQuantities(prev => ({...prev, [product.id]: 1}));
                  }}
                  className="bg-white text-green-600 border-2 border-green-600 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  Adicionar
                </button>
              </div>
            </div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-16">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhum produto encontrado.</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-green-600 font-bold text-xs uppercase tracking-widest hover:underline"
              >
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
