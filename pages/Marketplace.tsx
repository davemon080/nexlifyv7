import React, { useEffect, useState } from 'react';
import { getProducts, logUserActivity, getCurrentUser, recordTransaction, sendNotification } from '../services/mockData';
import { Product, ProductCategory, User } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { useFeedback } from '../App';
import { Search, Filter, Download, ShoppingCart, Loader2, Eye, X, Share2, PackageOpen, LayoutGrid, CheckCircle, Clock, Smartphone, Monitor } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, showDialog } = useFeedback();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    setUser(getCurrentUser());
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId && products.length > 0) {
      const p = products.find(prod => prod.id === productId);
      if (p) setPreviewProduct(p);
    }
  }, [searchParams, products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let result = [...products];
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(lowSearch) || p.description.toLowerCase().includes(lowSearch));
    }
    setFilteredProducts(result);
  };

  const isPurchased = (productId: string) => user?.purchasedProducts?.includes(productId);

  const handleDownload = async (product: Product) => {
    const currentUser = getCurrentUser();
    if(currentUser) {
        logUserActivity(currentUser.id, 'Download', `Downloaded product: ${product.title}`, 'info');
        await sendNotification({
            userId: currentUser.id,
            title: 'File Downloaded',
            message: `You have successfully downloaded "${product.title}". Check your downloads folder.`,
            type: 'info'
        });
        showToast("Starting download...", 'info');
    }

    if (product.downloadUrl) {
      const link = document.createElement('a');
      link.href = product.downloadUrl;
      link.download = `${product.title.replace(/\s+/g, '_')}${product.category === 'Ebook' ? '.pdf' : '.zip'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePurchase = (product: Product, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const currentUser = getCurrentUser();
    if (!currentUser) { navigate('/login'); return; }
    
    const price = Number(product.price);
    if (price > 0) {
         const PaystackPop = (window as any).PaystackPop;
         if (!PaystackPop) { 
           showDialog({ title: 'Payment Unavailable', message: 'The payment system is currently unavailable. Please refresh or try again later.', onConfirm: () => {} });
           return; 
         }
         const paystackKey = 'pk_test_e9672a354a3fbf8d3e696c1265b29355181a3e11'; 
         try {
             const handler = PaystackPop.setup({
                 key: paystackKey, email: currentUser.email, amount: Math.ceil(price * 100), currency: 'NGN',
                 ref: `nex-prod-${Date.now()}`,
                 callback: function(response: any) {
                     recordTransaction(currentUser.id, 'product_purchase', product.id, price, response.reference).then(() => {
                        setUser(getCurrentUser());
                        handleDownload(product);
                        setPreviewProduct(null);
                        showToast("Purchase successful!", 'success');
                     });
                 },
                 onClose: () => {},
             });
             handler.openIframe();
         } catch (err: any) { 
           showToast("Could not initiate payment.", 'error'); 
         }
    } else {
         handleDownload(product);
         setPreviewProduct(null);
         showToast("Free asset added to library.", 'success');
    }
  };

  const handleShare = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/market?product=${product.id}`;
    if (navigator.share) { try { await navigator.share({ title: product.title, url }); } catch (error) {} } 
    else { navigator.clipboard.writeText(url); showToast("Link copied to clipboard.", 'success'); }
  };

  const categories = ['All', ...Object.values(ProductCategory)];

  return (
    <div className="min-h-screen pb-20 bg-[#0E0E0E]">
      <SEO title="Digital Marketplace | Nexlify" description="Premium digital assets, templates, and courses." />
      
      <div className="relative border-b border-[#444746] bg-[#1E1F20]/30 py-20 md:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#A8C7FA]/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <Badge color="purple" className="mb-6">Global Marketplace</Badge>
            <h1 className="text-5xl md:text-8xl font-bold text-[#E3E3E3] tracking-tighter mb-8">
              Digital <span className="text-[#A8C7FA]">Assets</span>
            </h1>
            <p className="text-[#C4C7C5] text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed">
              Curated premium resources, high-converting templates, and specialized digital tools.
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <Card className="p-4 mb-12 bg-[#1E1F20]/90 backdrop-blur-3xl border-[#444746] shadow-2xl rounded-[32px]">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8E918F]" />
              <input type="text" placeholder="Search templates, ebooks, guides..." className="w-full pl-14 pr-6 py-4 bg-[#131314] border border-[#444746] rounded-2xl text-[#E3E3E3] focus:border-[#A8C7FA] transition-all outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto no-scrollbar">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase transition-all duration-300 ${selectedCategory === cat ? 'bg-[#A8C7FA] text-[#062E6F] shadow-lg shadow-[#A8C7FA]/20' : 'bg-[#131314] text-[#C4C7C5] border border-[#444746] hover:border-[#8E918F]'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="w-12 h-12 text-[#A8C7FA] animate-spin" /><p className="text-[#8E918F] font-medium">Refreshing catalog...</p></div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center"><div className="w-20 h-20 bg-[#131314] rounded-full flex items-center justify-center mb-6"><PackageOpen className="w-10 h-10 text-[#5E5E5E]" /></div><h3 className="text-xl font-bold text-[#E3E3E3] mb-2">No matching items</h3><p className="text-[#8E918F]">Try adjusting your search or category filters.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => {
              const owned = isPurchased(product.id);
              return (
              <Card key={product.id} className="flex flex-col h-full group hover:shadow-2xl hover:shadow-[#A8C7FA]/10 transition-all duration-500 border-[#444746] hover:border-[#A8C7FA]/40 overflow-hidden rounded-[32px]">
                <div className="relative aspect-[16/11] bg-[#131314] cursor-pointer overflow-hidden" onClick={() => setPreviewProduct(product)}>
                  <img src={product.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                      <Button variant="secondary" size="sm" icon={Eye} onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}>View Preview</Button>
                      <button className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20 border border-white/20" onClick={(e) => handleShare(product, e)}><Share2 className="w-5 h-5" /></button>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    {owned ? <Badge color="green">Owned</Badge> : <Badge color="blue" className="bg-black/60 backdrop-blur-md border-white/10 font-bold">₦{Number(product.price).toLocaleString()}</Badge>}
                  </div>
                </div>
                <div className="p-7 flex-1 flex flex-col bg-gradient-to-b from-[#1E1F20] to-[#131314]">
                  <div className="text-[10px] text-[#A8C7FA] font-black uppercase tracking-widest mb-2">{product.category}</div>
                  <h3 className="text-xl font-bold text-[#E3E3E3] mb-3 line-clamp-1">{product.title}</h3>
                  <p className="text-[#8E918F] text-sm mb-8 line-clamp-2 leading-relaxed">{product.description}</p>
                  <Button className={`mt-auto w-full py-4 text-xs font-black uppercase tracking-widest ${owned ? 'bg-[#444746] text-[#E3E3E3]' : ''}`} icon={owned ? Download : ShoppingCart} onClick={() => owned ? handleDownload(product) : handlePurchase(product)}>{owned ? 'Download Asset' : 'Get for ₦' + Number(product.price).toLocaleString()}</Button>
                </div>
              </Card>
            )})}
          </div>
        )}
      </div>

      {previewProduct && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
              <div className="w-full max-w-7xl h-full bg-[#1E1F20] rounded-[48px] flex flex-col border border-[#444746] overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-center px-10 py-6 border-b border-[#444746] bg-[#131314]">
                      <div className="flex items-center gap-6">
                        <div className="p-3 bg-[#A8C7FA]/10 rounded-2xl"><Eye className="text-[#A8C7FA]" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-[#E3E3E3]">{previewProduct.title}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge color="blue" className="text-[10px]">{previewProduct.category}</Badge>
                                <span className="flex items-center gap-1 text-[10px] text-[#8E918F] font-bold"><Clock className="w-3 h-3" /> Live Preview v1.0</span>
                            </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setPreviewProduct(null)} className="p-3 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5] transition-all"><X className="w-8 h-8" /></button>
                      </div>
                  </div>
                  
                  <div className="flex-1 bg-[#000] flex items-center justify-center p-4">
                      <div className={`transition-all duration-500 ease-in-out bg-white rounded-2xl overflow-hidden shadow-2xl ${previewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'}`}>
                          {previewProduct.previewUrl ? (
                            <iframe src={previewProduct.previewUrl} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Live Preview" />
                          ) : (
                            <img src={previewProduct.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                          )}
                      </div>
                  </div>

                  <div className="px-10 py-8 bg-[#131314] border-t border-[#444746] flex items-center justify-between">
                        <div className="flex items-center gap-10">
                            <div>
                                <p className="text-[10px] text-[#8E918F] font-black uppercase mb-1">Status</p>
                                <div className="flex items-center gap-2 text-[#6DD58C] text-sm font-bold"><CheckCircle className="w-4 h-4" /> Ready for Download</div>
                            </div>
                            <div>
                                <p className="text-[10px] text-[#8E918F] font-black uppercase mb-1">Price</p>
                                <p className="text-xl font-bold text-[#E3E3E3]">₦{Number(previewProduct.price).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={(e) => handleShare(previewProduct, e)} className="flex items-center gap-2 px-8 py-4 border border-[#444746] rounded-2xl text-[#C4C7C5] font-bold text-sm hover:bg-[#2D2E30] transition-all"><Share2 className="w-5 h-5" /> Share</button>
                            <Button size="lg" className="px-12 py-5 text-sm font-black uppercase tracking-widest" icon={isPurchased(previewProduct.id) ? Download : ShoppingCart} onClick={() => isPurchased(previewProduct.id) ? handleDownload(previewProduct) : handlePurchase(previewProduct)}>{isPurchased(previewProduct.id) ? 'Download Now' : 'Buy Now'}</Button>
                        </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
