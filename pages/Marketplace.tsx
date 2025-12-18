import React, { useEffect, useState } from 'react';
import { getProducts, logUserActivity, getCurrentUser, recordTransaction, sendNotification } from '../services/mockData';
import { Product, ProductCategory, User } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { Search, Filter, Download, ShoppingCart, Loader2, Eye, X, Share2, PackageOpen, LayoutGrid } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  // Handle URL query for specific product preview
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
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowSearch) || 
        p.description.toLowerCase().includes(lowSearch)
      );
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
    }

    if (product.downloadUrl) {
      const link = document.createElement('a');
      link.href = product.downloadUrl;
      link.download = `${product.title.replace(/\s+/g, '_')}${product.category === 'Ebook' ? '.pdf' : '.zip'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Simulation: Downloading ${product.title}...`);
    }
  };

  const handlePurchase = (product: Product, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const currentUser = getCurrentUser();
    if (!currentUser) { navigate('/login'); return; }
    
    const price = Number(product.price);
    if (price > 0) {
         const PaystackPop = (window as any).PaystackPop;
         if (!PaystackPop) { alert("Payment system is temporarily unavailable. Please refresh."); return; }
         const paystackKey = 'pk_test_e9672a354a3fbf8d3e696c1265b29355181a3e11'; 
         try {
             const handler = PaystackPop.setup({
                 key: paystackKey,
                 email: currentUser.email,
                 amount: Math.ceil(price * 100),
                 currency: 'NGN',
                 ref: `nex-prod-${Date.now()}`,
                 callback: function(response: any) {
                     const processSuccess = async () => {
                         try {
                            await recordTransaction(currentUser.id, 'product_purchase', product.id, price, response.reference);
                            setUser(getCurrentUser());
                            handleDownload(product);
                            setPreviewProduct(null);
                         } catch (err) { console.error(err); }
                     };
                     processSuccess();
                 },
                 onClose: () => {},
             });
             handler.openIframe();
         } catch (err: any) { alert("Payment Error"); }
    } else {
         handleDownload(product);
         setPreviewProduct(null);
    }
  };

  const handleShare = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/market?product=${product.id}`;
    if (navigator.share) { 
      try { await navigator.share({ title: product.title, url }); } catch (error) {} 
    } else { 
      navigator.clipboard.writeText(url); 
      alert("Link copied to clipboard!"); 
    }
  };

  const categories = ['All', ...Object.values(ProductCategory)];

  return (
    <div className="min-h-screen pb-20 bg-[#0E0E0E]">
      <SEO title="Marketplace | Digital Assets & Templates" description="Browse our curated collection of high-quality digital templates, ebooks, and resources." />
      
      {/* Header / Hero */}
      <div className="relative border-b border-[#444746] bg-[#1E1F20]/30 py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#A8C7FA]/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#D0BCFF]/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <Badge color="purple" className="mb-4">Nexlify Store</Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-[#E3E3E3] tracking-tight mb-6">
              Digital <span className="text-[#A8C7FA]">Marketplace</span>
            </h1>
            <p className="text-[#C4C7C5] text-lg md:text-xl leading-relaxed">
              Curated high-quality templates, ebooks, and creative assets to accelerate your digital growth.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
        {/* Filter Bar */}
        <Card className="p-4 mb-10 bg-[#1E1F20]/90 backdrop-blur-xl border-[#444746] shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8E918F]" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full pl-12 pr-4 py-3.5 bg-[#131314] border border-[#444746] rounded-2xl text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all outline-none" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto no-scrollbar pb-1 lg:pb-0">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === cat 
                    ? 'bg-[#A8C7FA] text-[#062E6F] shadow-[0_0_20px_rgba(168,199,250,0.2)]' 
                    : 'bg-[#131314] text-[#C4C7C5] border border-[#444746] hover:border-[#8E918F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-2 text-[#8E918F] text-sm">
                <LayoutGrid className="w-4 h-4" />
                <span>Showing {filteredProducts.length} results</span>
            </div>
            {selectedCategory !== 'All' && (
                <button onClick={() => setSelectedCategory('All')} className="text-xs text-[#A8C7FA] hover:underline font-medium">Clear filters</button>
            )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-12 h-12 text-[#A8C7FA] animate-spin" />
            <p className="text-[#8E918F] animate-pulse">Loading catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#1E1F20]/50 rounded-[32px] border border-dashed border-[#444746]">
            <div className="w-20 h-20 bg-[#131314] rounded-full flex items-center justify-center mb-6">
                <PackageOpen className="w-10 h-10 text-[#5E5E5E]" />
            </div>
            <h3 className="text-xl font-bold text-[#E3E3E3] mb-2">No products found</h3>
            <p className="text-[#8E918F] max-w-sm">We couldn't find any items matching your current search or category filters.</p>
            <Button variant="outline" className="mt-8" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>Reset Catalog</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product) => {
              const owned = isPurchased(product.id);
              const isFree = Number(product.price) === 0;
              
              return (
              <Card key={product.id} className="flex flex-col h-full group hover:shadow-2xl hover:shadow-[#A8C7FA]/5 transition-all duration-500 border-[#444746] hover:border-[#A8C7FA]/30 overflow-hidden">
                {/* Image Section */}
                <div className="relative aspect-[16/10] bg-[#131314] cursor-pointer overflow-hidden" onClick={() => setPreviewProduct(product)}>
                  <img 
                    src={product.imageUrl} 
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="flex gap-2 w-full">
                        <Button variant="secondary" size="sm" icon={Eye} className="flex-1 backdrop-blur-md bg-white/10 border-white/20 text-white" onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}>
                          Quick Preview
                        </Button>
                        <button className="bg-white/10 backdrop-blur-md text-white p-2 rounded-xl border border-white/20 hover:bg-white/20 transition-colors" onClick={(e) => handleShare(product, e)}>
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3">
                    <Badge color="blue" className="bg-black/60 backdrop-blur-md border-white/10 text-[10px] uppercase font-bold py-0.5 px-2">
                      {product.category}
                    </Badge>
                  </div>
                  
                  <div className="absolute top-3 right-3">
                    {owned ? (
                      <Badge color="green" className="bg-[#0F5223]/80 backdrop-blur-md border-[#6DD58C]/20 shadow-lg">Owned</Badge>
                    ) : (
                      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-sm font-bold text-white">
                        {isFree ? 'FREE' : `₦${Number(product.price).toLocaleString()}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-6 flex-1 flex flex-col bg-[#1E1F20]">
                  <h3 className="text-lg font-bold text-[#E3E3E3] mb-2 line-clamp-1 group-hover:text-[#A8C7FA] transition-colors">{product.title}</h3>
                  <p className="text-[#8E918F] text-sm mb-6 line-clamp-2 leading-relaxed">{product.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-[#444746]/50 flex items-center justify-between gap-3">
                    <Button 
                      className={`flex-1 ${owned || isFree ? 'bg-[#444746] text-[#E3E3E3] hover:bg-[#5E5E5E]' : ''}`} 
                      icon={owned || isFree ? Download : ShoppingCart} 
                      onClick={() => owned || isFree ? handleDownload(product) : handlePurchase(product)}
                    >
                      {owned ? 'Download' : isFree ? 'Get Free' : 'Buy Now'}
                    </Button>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        )}
      </div>

      {/* Modern Product Preview Modal */}
      {previewProduct && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
              <div className="w-full max-w-6xl h-[90vh] bg-[#1E1F20] rounded-[32px] flex flex-col border border-[#444746] overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-center px-6 py-5 border-b border-[#444746] bg-[#131314]">
                      <div className="flex items-center gap-3 truncate">
                        <Badge color="blue" className="hidden sm:block">{previewProduct.category}</Badge>
                        <h2 className="text-xl font-bold text-[#E3E3E3] truncate">{previewProduct.title}</h2>
                      </div>
                      <button onClick={() => setPreviewProduct(null)} className="p-2.5 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5] transition-colors">
                        <X className="w-7 h-7" />
                      </button>
                  </div>
                  
                  <div className="flex-1 bg-[#000] relative group">
                      {previewProduct.previewUrl ? (
                        <iframe 
                          src={previewProduct.previewUrl} 
                          className="w-full h-full border-0" 
                          sandbox="allow-scripts allow-same-origin" 
                          title="Live Preview"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <img src={previewProduct.imageUrl} className="max-w-full max-h-full object-contain" alt="Preview" />
                        </div>
                      )}
                  </div>

                  <div className="p-6 bg-[#131314] border-t border-[#444746] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-left hidden sm:block">
                            <p className="text-[#8E918F] text-sm">Asset Price</p>
                            <p className="text-xl font-bold text-[#E3E3E3]">
                                {Number(previewProduct.price) === 0 ? 'Free Asset' : `₦${Number(previewProduct.price).toLocaleString()}`}
                            </p>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button 
                                onClick={(e) => handleShare(previewProduct, e)}
                                className="flex items-center justify-center gap-2 px-6 py-3 border border-[#444746] rounded-2xl text-[#C4C7C5] hover:bg-[#2D2E30] transition-all font-medium"
                            >
                                <Share2 className="w-5 h-5" /> Share
                            </button>
                            <Button 
                                size="lg"
                                className="flex-1 sm:flex-none px-10"
                                icon={isPurchased(previewProduct.id) || Number(previewProduct.price) === 0 ? Download : ShoppingCart} 
                                onClick={() => isPurchased(previewProduct.id) || Number(previewProduct.price) === 0 ? handleDownload(previewProduct) : handlePurchase(previewProduct)}
                            >
                                {isPurchased(previewProduct.id) ? 'Download Asset' : Number(previewProduct.price) === 0 ? 'Add to Library' : `Buy for ₦${Number(previewProduct.price).toLocaleString()}`}
                            </Button>
                        </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};