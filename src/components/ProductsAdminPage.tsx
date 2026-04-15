import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, ShoppingCart, Package, Search, MinusCircle, PlusCircle, ShoppingBag, History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, Product, ProductSale } from '../lib/database';

interface CartItem {
  product: Product;
  quantity: number;
}

interface EditSaleForm {
  quantity: string;
  unit_price: string;
  sold_at: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

const formatDateDisplay = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ProductsAdminPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'sell' | 'products' | 'history'>('sell');
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);

  const [sales, setSales] = useState<ProductSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const [historyMonth, setHistoryMonth] = useState<number>(0);
  const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [editingSale, setEditingSale] = useState<ProductSale | null>(null);
  const [editSaleForm, setEditSaleForm] = useState<EditSaleForm>({ quantity: '', unit_price: '', sold_at: '' });
  const [editSaleError, setEditSaleError] = useState('');
  const [editSaleSaving, setEditSaleSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await db.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const data = await db.getAllProductSales();
      setSales(data);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadSales();
  }, [activeTab, loadSales]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProducts = filteredProducts.filter(p => p.active);

  const filteredSales = sales
    .filter(s => {
      if (!(s.product_name || '').toLowerCase().includes(historySearch.toLowerCase())) return false;
      if (historyMonth !== 0) {
        const d = new Date(s.sold_at);
        if (d.getMonth() + 1 !== historyMonth || d.getFullYear() !== historyYear) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime();
      return sortDir === 'desc' ? -diff : diff;
    });

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE));
  const paginatedSales = filteredSales.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: product.stock != null ? String(product.stock) : ''
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { setFormError('O nome é obrigatório.'); return; }
    const price = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(price) || price < 0) { setFormError('Preço inválido.'); return; }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price,
        stock: formData.stock !== '' ? parseInt(formData.stock, 10) : null,
        active: editingProduct ? editingProduct.active : true
      };

      if (editingProduct) {
        await db.updateProduct(editingProduct.id, payload);
      } else {
        await db.createProduct(payload);
      }
      await loadProducts();
      setShowForm(false);
    } catch {
      setFormError('Erro ao guardar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await db.updateProduct(product.id, { active: !product.active });
      await loadProducts();
    } catch {
      console.error('Error toggling product active state');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Eliminar o produto "${product.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await db.deleteProduct(product.id);
      await loadProducts();
    } catch {
      alert('Erro ao eliminar produto. Pode haver vendas associadas.');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.product.id !== productId) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null as any;
        return { ...i, quantity: newQty };
      }).filter(Boolean)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    setSaleLoading(true);
    try {
      await db.recordProductSale(
        cart.map(i => ({ product_id: i.product.id, quantity: i.quantity, unit_price: i.product.price }))
      );
      setCart([]);
      setSaleSuccess(true);
      setTimeout(() => setSaleSuccess(false), 3000);
    } catch {
      alert('Erro ao registar venda. Tente novamente.');
    } finally {
      setSaleLoading(false);
    }
  };

  const openEditSale = (sale: ProductSale) => {
    setEditingSale(sale);
    setEditSaleForm({
      quantity: String(sale.quantity),
      unit_price: String(sale.unit_price),
      sold_at: toLocalInputValue(sale.sold_at)
    });
    setEditSaleError('');
  };

  const handleSaveEditSale = async () => {
    if (!editingSale) return;
    const qty = parseInt(editSaleForm.quantity, 10);
    const price = parseFloat(editSaleForm.unit_price.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) { setEditSaleError('Quantidade inválida.'); return; }
    if (isNaN(price) || price < 0) { setEditSaleError('Preço inválido.'); return; }
    if (!editSaleForm.sold_at) { setEditSaleError('Data inválida.'); return; }

    setEditSaleSaving(true);
    setEditSaleError('');
    try {
      await db.updateProductSale(editingSale.id, {
        quantity: qty,
        unit_price: price,
        sold_at: new Date(editSaleForm.sold_at).toISOString()
      });
      await loadSales();
      setEditingSale(null);
    } catch {
      setEditSaleError('Erro ao guardar alterações. Tente novamente.');
    } finally {
      setEditSaleSaving(false);
    }
  };

  const handleDeleteSale = async (sale: ProductSale) => {
    if (!confirm(`Eliminar esta venda de "${sale.product_name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await db.deleteProductSale(sale.id);
      await loadSales();
    } catch {
      alert('Erro ao eliminar venda. Tente novamente.');
    }
  };

  const tabClass = (tab: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
      activeTab === tab
        ? 'bg-amber-500 text-white shadow'
        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Produtos</h2>
          <p className="text-gray-600">Gerir produtos e registar vendas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('sell')} className={tabClass('sell')}>
            <ShoppingCart className="h-4 w-4" />
            Registar Venda
            {cart.length > 0 && (
              <span className="ml-1 bg-white text-amber-600 rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('products')} className={tabClass('products')}>
            <Package className="h-4 w-4" />
            Catálogo
          </button>
          <button onClick={() => setActiveTab('history')} className={tabClass('history')}>
            <History className="h-4 w-4" />
            Histórico
          </button>
        </div>
      </div>

      {activeTab === 'sell' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar produto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">A carregar produtos...</div>
            ) : activeProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum produto disponível</p>
                <p className="text-sm text-gray-400 mt-1">Adicione produtos no separador "Catálogo"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeProducts.map(product => {
                  const inCart = cart.find(i => i.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-amber-400 hover:shadow-md transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="bg-amber-50 rounded-lg p-2 group-hover:bg-amber-100 transition-colors">
                          <ShoppingBag className="h-5 w-5 text-amber-600" />
                        </div>
                        {inCart && (
                          <span className="text-xs font-bold bg-amber-500 text-white rounded-full px-2 py-0.5">
                            x{inCart.quantity}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-1">{product.description}</p>
                      )}
                      <p className="text-base font-bold text-amber-600">{formatCurrency(product.price)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl sticky top-6">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Venda</h3>
              </div>

              {saleSuccess && (
                <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-700">Venda registada com sucesso!</p>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <ShoppingCart className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Selecione produtos para adicionar à venda</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.product.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(item.product.price)} / un.</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => updateCartQty(item.product.id, -1)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <MinusCircle className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.product.id, 1)} className="text-gray-400 hover:text-amber-500 transition-colors">
                            <PlusCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => removeFromCart(item.product.id)} className="ml-1 text-gray-300 hover:text-red-400 transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button
                      onClick={handleFinalizeSale}
                      disabled={saleLoading}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {saleLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Finalizar Venda
                    </button>
                    <button onClick={() => setCart([])} className="w-full py-2 text-sm text-gray-400 hover:text-red-500 transition-colors">
                      Limpar carrinho
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar produto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Produto
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">A carregar produtos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">Nenhum produto encontrado</p>
              <button onClick={openCreateForm} className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                Adicionar primeiro produto
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[540px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{product.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900 text-sm">{formatCurrency(product.price)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {product.stock != null ? product.stock : <span className="text-gray-400">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            product.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {product.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(product)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por produto..."
                value={historySearch}
                onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={historyMonth}
              onChange={e => { setHistoryMonth(Number(e.target.value)); setHistoryPage(1); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm bg-white text-gray-700"
            >
              <option value={0}>Todos os meses</option>
              <option value={1}>Janeiro</option>
              <option value={2}>Fevereiro</option>
              <option value={3}>Março</option>
              <option value={4}>Abril</option>
              <option value={5}>Maio</option>
              <option value={6}>Junho</option>
              <option value={7}>Julho</option>
              <option value={8}>Agosto</option>
              <option value={9}>Setembro</option>
              <option value={10}>Outubro</option>
              <option value={11}>Novembro</option>
              <option value={12}>Dezembro</option>
            </select>
            {historyMonth !== 0 && (
              <select
                value={historyYear}
                onChange={e => { setHistoryYear(Number(e.target.value)); setHistoryPage(1); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm bg-white text-gray-700"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setHistoryPage(1); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
            >
              {sortDir === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              {sortDir === 'desc' ? 'Mais recentes' : 'Mais antigas'}
            </button>
          </div>

          {salesLoading ? (
            <div className="text-center py-12 text-gray-500">A carregar histórico...</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <History className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">Nenhuma venda registada</p>
              <p className="text-sm text-gray-400">As vendas finalizadas aparecerão aqui</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {filteredSales.length} {filteredSales.length === 1 ? 'venda' : 'vendas'}
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    Total: {formatCurrency(filteredSales.reduce((s, sale) => s + sale.total_price, 0))}
                  </p>
                </div>
                <table className="w-full min-w-[540px]">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qtd.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço Unit.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{sale.product_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{sale.quantity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{formatCurrency(sale.unit_price)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900 text-sm">{formatCurrency(sale.total_price)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">{formatDateDisplay(sale.sold_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditSale(sale)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar venda"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSale(sale)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar venda"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Página {historyPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setHistoryPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === historyPage
                            ? 'bg-amber-500 text-white'
                            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                      disabled={historyPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                  placeholder="Ex: Cera de Modelação"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                  placeholder="Descrição opcional do produto"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                    placeholder="—"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingProduct ? 'Guardar' : 'Criar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Editar Venda</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editingSale.product_name}</p>
              </div>
              <button
                onClick={() => setEditingSale(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {editSaleError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {editSaleError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editSaleForm.quantity}
                    onChange={e => setEditSaleForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unit. (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editSaleForm.unit_price}
                    onChange={e => setEditSaleForm(prev => ({ ...prev, unit_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e hora *</label>
                <input
                  type="datetime-local"
                  value={editSaleForm.sold_at}
                  onChange={e => setEditSaleForm(prev => ({ ...prev, sold_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                />
              </div>
              {editSaleForm.quantity && editSaleForm.unit_price && (
                <div className="bg-amber-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-amber-700 font-medium">Total calculado</span>
                  <span className="text-base font-bold text-amber-800">
                    {formatCurrency(parseFloat(editSaleForm.quantity || '0') * parseFloat(editSaleForm.unit_price.replace(',', '.') || '0'))}
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingSale(null)}
                disabled={editSaleSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditSale}
                disabled={editSaleSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-60"
              >
                {editSaleSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Guardar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsAdminPage;
