import React, { useEffect, useState } from 'react';
import { getProducts, logUserActivity, getCurrentUser, recordTransaction } from '../services/mockData';
import { Product, ProductCategory, User } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { Search, Filter, Download, ShoppingCart, Loader2, Eye, X, Share2, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      result = result.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    setFilteredProducts(result);
  };

  const isPurchased = (productId: string) => {
      if(!user) return false;
      return user.purchasedProducts?.includes(productId);
  };

  const handleDownload = (product: Product) => {
    const currentUser = getCurrentUser();
    if(currentUser) logUserActivity(currentUser.id, 'Download', `Downloaded product: ${product.title}`, 'info');

    if (product.downloadUrl) {
      // Create a temporary link to download the file (which is a data URI)
      const link = document.createElement('a');
      link.href = product.downloadUrl;
      link.download = `${product.title.replace(/\s+/g, '_')}${product.category === 'Ebook' ? '.pdf' : '.zip'}`; // Guess extension based on category
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Simulation: Downloading ${product.title}...`);
    }
  };

  const handlePurchase = (product: Product) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("You must be logged in to purchase products.");
        navigate('/login');
        return;
    }

    if (product.price > 0) {
         const PaystackPop = (window as any).PaystackPop;
         if (!PaystackPop) {
             alert("Payment system is loading, please try again in a moment. Check your internet connection.");
             return;
         }

         try {
             const handler = PaystackPop.setup({
                 key: 'pk_test_e9672a354a3fbf8d3e696c1265b29355181a3e11', // Explicitly set public key
                 email: currentUser.email,
                 amount: product.price * 100, // Amount in kobo
                 currency: 'NGN',
                 ref: ''+Math.floor((Math.random() * 1000000000) + 1),
                 callback: async function(response: any) {
                     await recordTransaction(currentUser.id, 'product_purchase', product.id, product.price, response.reference);
                     await logUserActivity(currentUser.id, 'Purchase', `Purchased product: ${product.title} for ₦${product.price}`, 'success');
                     
                     // Refresh user state to reflect purchase immediately
                     const updatedUser = getCurrentUser();
                     setUser(updatedUser);

                     alert("Payment successful! Downloading your file...");
                     handleDownload(product);
                 },
                 onClose: function() {
                     alert('Transaction was not completed.');
                 },
             });
             handler.openIframe();
         } catch (error) {
             console.error("Paystack Error:", error);
             alert("An error occurred initializing payment. Please try again.");
         }
    } else {
         // Free product logic
         handleDownload(product);
    }
  };

  const handleShare = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simulate a deep link
    const url = `${window.location.origin}${window.location.pathname}#/market?product=${product.id}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: product.title,
                text: `Check out ${product.title} on Nexlify!`,
                url: url,
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    } else {
        handleCopyLink(url);
    }
  };

  const handleCopyLink = (url: string) => {
      navigator.clipboard.writeText(url).then(() => {
          alert("Product link copied to clipboard!");
      });
  };

  const categories = ['All', ...Object.values(ProductCategory)];

  return (
    <div className="min-h-screen pb-12">
      <div className="border-b border-[#444746] bg-[#1E1F20]/50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge color="purple">Digital Store</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-[#E3E3E3] mt-4 mb-4">Marketplace</h1>
          <p className="text-[#C4C7C5] max-w-2xl text-lg">
            Discover premium resources to accelerate your growth. From ebooks to website templates, find everything you need in one place.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <Card className="p-4 mb-12 bg-[#1E1F20] shadow-xl">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8E918F]" />
              <input
                type="text"
                placeholder="Search templates, ebooks..."
                className="w-full pl-12 pr-4 py-3 bg-[#131314] border border-[#444746] rounded-full text-[#E3E3E3] focus:ring-2 focus:ring-[#A8C7FA] focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar touch-pan-x">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#A8C7FA] text-[#062E6F]'
                      : 'bg-[#131314] text-[#C4C7C5] border border-[#444746] hover:border-[#8E918F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 text-[#A8C7FA] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product) => {
              const owned = isPurchased(product.id);
              return (
              <Card key={product.id} className="flex flex-col h-full hoverEffect group">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#131314] border-b border-[#444746] cursor-pointer" onClick={() => setPreviewProduct(product)}>
                  <img 
                    src={product.imageUrl} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="secondary" size="sm" icon={Eye} onClick={(e) => { e.stopPropagation(); setPreviewProduct(product); }}>
                          Preview
                      </Button>
                      <button 
                        className="bg-[#1E1F20] text-[#E3E3E3] p-1.5 rounded-full hover:bg-[#A8C7FA] hover:text-[#062E6F] transition-colors"
                        onClick={(e) => handleShare(product, e)}
                        title="Share Product"
                      >
                          <Share2 className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="absolute top-3 right-3">
                    {owned ? (
                        <Badge color="green"><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Owned</div></Badge>
                    ) : (
                        <Badge color={product.price === 0 ? 'green' : 'blue'}>
                          {product.price === 0 ? 'FREE' : `₦${product.price.toLocaleString()}`}
                        </Badge>
                    )}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs text-[#A8C7FA] font-semibold mb-2 uppercase tracking-wide">
                    {product.category}
                  </div>
                  <h3 className="text-lg font-bold text-[#E3E3E3] mb-3 line-clamp-1" title={product.title}>
                    {product.title}
                  </h3>
                  <p className="text-[#8E918F] text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    {owned ? (
                        <Button 
                            className="flex-1 bg-[#0F5223] text-[#C4EED0] hover:bg-[#136C2E]" 
                            icon={Download}
                            onClick={() => handleDownload(product)}
                        >
                            Download
                        </Button>
                    ) : (
                        <Button 
                            className="flex-1" 
                            variant={product.price === 0 ? 'secondary' : 'primary'}
                            icon={product.price === 0 ? Download : ShoppingCart}
                            onClick={() => product.price === 0 ? handleDownload(product) : handlePurchase(product)}
                        >
                            {product.price === 0 ? 'Get' : 'Buy'}
                        </Button>
                    )}
                  </div>
                </div>
              </Card>
            )})}
          </div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 text-[#8E918F]">
            <Filter className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <p className="text-xl font-medium mb-2">No products found</p>
            <p className="mb-8">Try adjusting your filters or search terms</p>
            <Button variant="outline" onClick={() => {setSearchTerm(''); setSelectedCategory('All');}}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewProduct && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-6xl h-[90vh] bg-[#1E1F20] rounded-2xl flex flex-col border border-[#444746] shadow-2xl overflow-hidden relative">
                  <div className="flex justify-between items-center p-4 border-b border-[#444746] bg-[#131314]">
                      <h2 className="text-lg font-bold text-[#E3E3E3] truncate">{previewProduct.title} - Preview</h2>
                      <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyLink(`${window.location.origin}${window.location.pathname}#/market?product=${previewProduct.id}`)}
                            className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5] hover:text-[#E3E3E3] transition-colors"
                            title="Copy Link"
                          >
                              <Copy className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setPreviewProduct(null)}
                            className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5] hover:text-[#E3E3E3] transition-colors"
                          >
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                  </div>
                  <div className="flex-1 bg-[#000] overflow-hidden relative">
                      {previewProduct.previewUrl ? (
                          <iframe 
                            src={previewProduct.previewUrl} 
                            title="Template Preview"
                            className="w-full h-full border-0"
                            sandbox="allow-scripts allow-same-origin"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#131314]">
                             <img src={previewProduct.imageUrl} className="max-w-full max-h-full object-contain" alt="Preview" />
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-[#444746] bg-[#1E1F20] flex justify-between items-center">
                        <div className="text-sm text-[#8E918F] hidden sm:block">
                            {previewProduct.description}
                        </div>
                        
                        {isPurchased(previewProduct.id) ? (
                            <Button 
                                className="bg-[#0F5223] text-[#C4EED0] hover:bg-[#136C2E]" 
                                icon={Download}
                                onClick={() => handleDownload(previewProduct)}
                            >
                                Download Owned Item
                            </Button>
                        ) : (
                            <Button 
                                variant={previewProduct.price === 0 ? 'secondary' : 'primary'}
                                icon={previewProduct.price === 0 ? Download : ShoppingCart}
                                onClick={() => {
                                    if (previewProduct.price === 0) {
                                        handleDownload(previewProduct);
                                    } else {
                                        handlePurchase(previewProduct);
                                        setPreviewProduct(null); // Close modal on purchase flow
                                    }
                                }}
                            >
                                {previewProduct.price === 0 ? 'Download Template' : `Buy Template (₦${previewProduct.price.toLocaleString()})`}
                            </Button>
                        )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};