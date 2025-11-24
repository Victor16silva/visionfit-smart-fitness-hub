import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CartDrawer } from "@/components/CartDrawer";
import { ShopifyProduct, useCartStore } from "@/stores/cartStore";
import { fetchProductByHandle } from "@/lib/shopify";
import { Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    if (handle) {
      loadProduct();
    }
  }, [handle]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await fetchProductByHandle(handle!);
      setProduct(data);
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Erro ao carregar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
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

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Produto não encontrado</h2>
          <Button onClick={() => navigate("/shop")}>Voltar para a loja</Button>
        </div>
      </div>
    );
  }

  const images = product.node.images.edges;
  const price = product.node.priceRange.minVariantPrice;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/shop")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <CartDrawer />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-secondary/20">
              {images[selectedImage]?.node ? (
                <img
                  src={images[selectedImage].node.url}
                  alt={images[selectedImage].node.altText || product.node.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </Card>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer overflow-hidden ${
                    selectedImage === index ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <div className="aspect-square bg-secondary/20">
                    <img
                      src={image.node.url}
                      alt={image.node.altText || `${product.node.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.node.title}</h1>
            <p className="text-4xl font-bold text-primary">
              {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
            </p>
          </div>

          {product.node.description && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.node.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleAddToCart} size="lg" className="w-full">
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}
