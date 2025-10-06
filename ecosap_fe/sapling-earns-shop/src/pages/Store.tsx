import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { ShoppingCart, Leaf, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  credits: number;
  icon: string;
}

const products: Product[] = [
  {
    id: "1",
    name: "Organic Fertilizer",
    description: "Premium organic fertilizer for healthier plants and soil enrichment",
    credits: 100,
    icon: "🌾",
  },
  {
    id: "2",
    name: "Drip Irrigation Kit",
    description: "Water-efficient irrigation system for sustainable farming",
    credits: 250,
    icon: "💧",
  },
  {
    id: "3",
    name: "Soil Testing Kit",
    description: "Comprehensive kit to analyze soil health and nutrients",
    credits: 150,
    icon: "🔬",
  },
  {
    id: "4",
    name: "Seed Packets (Vegetables)",
    description: "Assorted vegetable seeds for your garden",
    credits: 50,
    icon: "🌱",
  },
  {
    id: "5",
    name: "Compost Bin",
    description: "Eco-friendly composting solution for organic waste",
    credits: 200,
    icon: "♻️",
  },
];

const Store = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (product: Product) => {
    if (!user) return;

    if (user.ecocredits < product.credits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${product.credits - user.ecocredits} more credits to purchase this item.`,
        variant: "destructive",
      });
      return;
    }

    setPurchasing(product.id);
    try {
      const newCredits = user.ecocredits - product.credits;
      await updateUser({ ecocredits: newCredits });
      
      toast({
        title: `${product.icon} Purchase Successful!`,
        description: `You bought ${product.name}! Remaining credits: ${newCredits}`,
      });
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">EcoStore 🛒</h1>
          <p className="text-muted-foreground">
            Spend your eco-credits on farming supplies and equipment
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-eco">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-semibold">Your Balance:</span>
            <span className="text-xl font-bold text-primary">{user?.ecocredits || 0} credits</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const canAfford = (user?.ecocredits || 0) >= product.credits;
            return (
              <Card
                key={product.id}
                className={`gradient-card shadow-eco transition-smooth hover:shadow-glow ${
                  !canAfford ? "opacity-75" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-5xl mb-2">{product.icon}</div>
                    <Badge
                      variant={canAfford ? "default" : "secondary"}
                      className="gap-1"
                    >
                      <Leaf className="h-3 w-3" />
                      {product.credits}
                    </Badge>
                  </div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    variant={canAfford ? "eco" : "outline"}
                    className="w-full"
                    onClick={() => handlePurchase(product)}
                    disabled={!canAfford || purchasing === product.id}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {purchasing === product.id
                      ? "Processing..."
                      : canAfford
                      ? "Purchase"
                      : "Insufficient Credits"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 gradient-card shadow-eco">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Products are delivered to your registered address within 5-7 business days</p>
            <p>• Credits are deducted immediately upon purchase</p>
            <p>• All products are eco-friendly and support sustainable farming</p>
            <p>• Upload more sapling images to earn credits faster!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Store;
