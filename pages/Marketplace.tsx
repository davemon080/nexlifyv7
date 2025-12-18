import React, { useEffect, useState } from 'react';
import { getProducts, logUserActivity, getCurrentUser, recordTransaction, sendNotification } from '../services/mockData';
import { Product, ProductCategory, User } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { Search, Filter, Download, ShoppingCart, Loader2, Eye, X, Share2, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';

export const Marketplace: React.FC = () => {
  const navigate = useNavigate();
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

  const loadProducts = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setFilteredProducts(data);
    setLoading(false);
  };

  const filterProducts = () => {
    let result = products;
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (searchTerm) result = result.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
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
         if (!PaystackPop) { alert("Paystack not loaded."); return; }
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
                 onClose: () => alert('Transaction cancelled.'),
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
    if (navigator.share) { try { await navigator.share({ title: product.title, url }); } catch (error) {} } 
    else { navigator.clipboard.writeText(url); alert("Link copied!"); }
  };

  const categories = ['All', ...Object.values(ProductCategory)];

  return (
    <div className="min-h-screen pb-12">
      <SEO title="Digital Marketplace" description="Templates and Ebooks" />
      <div className="border-b border-[#444746] bg-[#1E1F20]/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Badge color="purple">Digital Store</Badge>
          <h1 className="text-3xl font-bold text-[#E3E3E3] mt-4">Marketplace</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <Card className="p-4 mb-12 bg-[#1E1F20] shadow-xl">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8E918F]" />
              <input type="text" placeholder="Search..." className="w-full pl-12 pr-4 py-3 bg-[#131314] border border-[#444746] rounded-full text-[#E3E3E3] outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto no-scrollbar">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[#A8C7FA] text-[#062E6F]' : 'bg-[#131314] text-[#C4C7C5] border border-[#444746]'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 text-[#A8C7FA] animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const owned = isPurchased(product.id);
              return (
              <Card key={product.id} className="flex flex-col h-full group">
                <div className="relative aspect-[4/3] bg-[#131314] cursor-pointer" onClick={() => setPreviewProduct(product)}>
                  <img src={product.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="secondary" size="sm" icon={Eye} onClick={() => setPreviewProduct(product)}>Preview</Button>
                      <button className="bg-[#1E1F20] text-[#E3E3E3] p-1.5 rounded-full" onClick={(e) => handleShare(product, e)}><Share2 className="w-4 h-4" /></button>
                  </div>
                  <div className="absolute top-3 right-3">
                    {owned ? <Badge color="green">Owned</Badge> : <Badge color="blue">{product.price === 0 ? 'FREE' : `₦${Number(product.price).toLocaleString()}`}</Badge>}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs text-[#A8C7FA] font-semibold mb-2 uppercase">{product.category}</div>
                  <h3 className="text-lg font-bold text-[#E3E3E3] mb-3 line-clamp-1">{product.title}</h3>
                  <p className="text-[#8E918F] text-sm mb-6 line-clamp-2">{product.description}</p>
                  <Button className="mt-auto" icon={owned || Number(product.price) === 0 ? Download : ShoppingCart} onClick={() => owned || Number(product.price) === 0 ? handleDownload(product) : handlePurchase(product)}>{owned ? 'Download' : Number(product.price) === 0 ? 'Get Free' : 'Buy Now'}</Button>
                </div>
              </Card>
            )})}
          </div>
        )}
      </div>

      {previewProduct && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-6xl h-[90vh] bg-[#1E1F20] rounded-2xl flex flex-col border border-[#444746] overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b border-[#444746] bg-[#131314]">
                      <h2 className="text-lg font-bold text-[#E3E3E3] truncate">{previewProduct.title}</h2>
                      <button onClick={() => setPreviewProduct(null)} className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="flex-1 bg-[#000]">
                      {previewProduct.previewUrl ? <iframe src={previewProduct.previewUrl} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" /> : <img src={previewProduct.imageUrl} className="w-full h-full object-contain" />}
                  </div>
                  <div className="p-4 border-t border-[#444746] flex justify-end">
                        <Button icon={isPurchased(previewProduct.id) ? Download : ShoppingCart} onClick={() => isPurchased(previewProduct.id) ? handleDownload(previewProduct) : handlePurchase(previewProduct)}>{isPurchased(previewProduct.id) ? 'Download' : 'Buy Now'}</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};