
import React, { useState, useCallback, useEffect } from 'react';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import { CartItem, Product } from './types';
import { estimateProductPrice } from './services/geminiService';
import { XMarkIcon, ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { COMMON_PRODUCTS } from './constants';

const API_URL = import.meta.env.DEV ? 'http://localhost:3005/api/items' : '/api/items';

const App: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'editing' | 'shopping'>('editing');

  // Load items from database on mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          setCartItems(data);
        }
      } catch (error) {
        console.error('Failed to fetch items from DB:', error);
      }
    };
    fetchItems();
  }, []);

  const handleToggleCollected = async (id: string) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const updatedItem = { ...item, isCollected: !item.isCollected };
    setCartItems(prev => prev.map(i => i.id === id ? updatedItem : i));
    await syncToDb(updatedItem);
  };

  // Helper to sync an item to the database
  const syncToDb = async (item: CartItem) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch (error) {
      console.error('Failed to sync item to DB:', error);
    }
  };

  const handleAddToCart = useCallback(async (productOrName: Product | string, quantity: number = 1) => {
    let product: Product;
    
    if (typeof productOrName === 'string') {
        product = {
            id: `custom-${Date.now()}`,
            name: productOrName,
            category: 'Personalizado',
            image: ''
        };
        setSearchTerm('');
    } else {
        product = productOrName;
    }

    const productId = product.id;
    let updatedItem: CartItem | null = null;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
        updatedItem = { ...existing, quantity: existing.quantity + quantity };
        return prev.map((item) => item.id === productId ? updatedItem! : item);
      }
      
      updatedItem = {
        ...product,
        id: productId,
        quantity,
        estimatedUnitPrice: null,
        isLoadingPrice: true,
        sources: []
      };
      return [...prev, updatedItem!];
    });

    if (updatedItem) {
        await syncToDb(updatedItem);
    }

    // Fetch price from Gemini
    const result = await estimateProductPrice(product.name);
    
    setCartItems((prev) => 
        prev.map(item => {
            if (item.id === productId) {
                // Fallback to suggested price if Gemini fails or returns 0
                const fallbackPrice = COMMON_PRODUCTS.find(p => p.name === product.name)?.suggestedPrice;
                const finalPrice = result.price || fallbackPrice || 0;
                const hasError = !result.price && !fallbackPrice;

                const updated = { 
                    ...item, 
                    estimatedUnitPrice: finalPrice, 
                    isLoadingPrice: false,
                    sources: result.sources,
                    error: hasError ? (result.error || 'Preço não encontrado') : undefined,
                    suggestedPrice: fallbackPrice
                };
                syncToDb(updated);
                return updated;
            }
            return item;
        })
    );
  }, []);

  const handleRemoveFromCart = useCallback(async (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete item from DB:', error);
    }
  }, []);

  const handleUpdateQuantity = useCallback(async (id: string, delta: number) => {
    setCartItems((prev) => 
      prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          const updated = { ...item, quantity: newQty };
          syncToDb(updated);
          return updated;
        }
        return item;
      })
    );
  }, []);

  const handleUpdatePrice = useCallback(async (id: string, newPrice: number) => {
    setCartItems((prev) => 
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, estimatedUnitPrice: newPrice, isLoadingPrice: false };
          syncToDb(updated);
          return updated;
        }
        return item;
      })
    );
  }, []);

  useEffect(() => {
    if (isMobileCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileCartOpen]);

  const totalCartItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalValue = cartItems.reduce((acc, item) => acc + (item.quantity * (item.estimatedUnitPrice || 0)), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (view === 'shopping') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Shopping Mode Header */}
        <header className="bg-slate-900 text-white p-6 sticky top-0 z-50 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => setView('editing')}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
            >
              Voltar
            </button>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Valor Total</p>
              <p className="text-xl font-black text-green-400">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h1 className="text-2xl font-black text-slate-900 mb-2">Checklist de Mercado</h1>
              <p className="text-sm text-slate-500 font-medium">Toque nos itens conforme for pegando no supermercado.</p>
            </div>

            <div className="divide-y divide-slate-100">
              {cartItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleToggleCollected(item.id)}
                  className={`p-4 sm:p-6 flex items-center gap-4 cursor-pointer transition-all ${
                    item.isCollected ? 'bg-green-50/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    item.isCollected 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    {item.isCollected && <span className="font-bold">✓</span>}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-bold transition-all ${
                      item.isCollected ? 'text-slate-400 line-through' : 'text-slate-900'
                    }`}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      {item.quantity}x • {item.category}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-extrabold ${
                      item.isCollected ? 'text-slate-400' : 'text-slate-900'
                    }`}>
                      {formatCurrency((item.estimatedUnitPrice || 0) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-lg">
        <h1 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBagIcon className="w-6 h-6 text-green-400" />
            <span className="text-green-400">Smart</span>Market
        </h1>
        <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="relative p-2"
        >
            <div className="w-6 h-6 flex flex-col gap-1 items-end justify-center">
                <span className="block w-6 h-0.5 bg-white"></span>
                <span className="block w-4 h-0.5 bg-white"></span>
                <span className="block w-5 h-0.5 bg-white"></span>
            </div>
            {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {totalCartItems}
                </span>
            )}
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-600 p-1.5 rounded-lg">
                 <ShoppingBagIcon className="w-5 h-5" />
              </span>
              O que você precisa hoje?
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Ex: Arroz 5kg, Leite Integral..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddToCart(searchTerm)}
                />
                <ShoppingCartIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={() => handleAddToCart(searchTerm)}
                disabled={!searchTerm}
                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 whitespace-nowrap"
              >
                Adicionar
              </button>
            </div>
          </div>

          <ProductList onAdd={handleAddToCart} />
        </div>

        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 h-fit sticky top-8">
          <div className="h-[calc(100vh-120px)] min-h-[600px]">
             <Cart 
               items={cartItems} 
               onRemove={handleRemoveFromCart}
               onUpdateQuantity={handleUpdateQuantity}
               onUpdatePrice={handleUpdatePrice}
               onFinalize={() => setView('shopping')}
             />
          </div>
        </div>
      </main>

      <button 
        onClick={() => setIsMobileCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2 group active:scale-95 transition-transform"
      >
        <div className="relative">
          <ShoppingCartIcon className="w-6 h-6" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">
              {cartItems.length}
            </span>
          )}
        </div>
        <span className="font-bold text-sm pr-2">Ver Carrinho</span>
      </button>

      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md flex flex-col bg-white shadow-2xl">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <h3 className="font-bold text-slate-800">Seu Carrinho</h3>
                <button 
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Cart 
                  items={cartItems} 
                  onRemove={handleRemoveFromCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdatePrice={handleUpdatePrice}
                  onFinalize={() => {
                    setIsMobileCartOpen(false);
                    setView('shopping');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
