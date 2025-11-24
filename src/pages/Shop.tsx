import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CartDrawer } from "@/components/CartDrawer";
import { ShopifyProduct, useCartStore } from "@/stores/cartStore";
import { fetchProducts } from "@/lib/shopify";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function Shop() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0].node;
    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success("Produto adicionado ao carrinho!", {
      position: "top-center"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Loja</h1>
          <p className="text-muted-foreground">Suplementos, roupas e acessórios para seus treinos</p>
        </div>
        <CartDrawer />
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Nenhum produto encontrado</h2>
          <p className="text-muted-foreground mb-4">
            A loja ainda não possui produtos cadastrados.
          </p>
          <p className="text-sm text-muted-foreground">
            Crie produtos dizendo no chat o que você deseja adicionar, como por exemplo:<br/>
            "Adicione um whey protein sabor chocolate por R$120"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const image = product.node.images.edges[0]?.node;
            const price = product.node.priceRange.minVariantPrice;
            
            return (
              <Card 
                key={product.node.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/product/${product.node.handle}`)}
              >
                <div className="aspect-square overflow-hidden bg-secondary/20">
                  {image ? (
                    <img 
                      src={image.url} 
                      alt={image.altText || product.node.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.node.title}
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="w-full"
                  >
                    Adicionar ao Carrinho
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
