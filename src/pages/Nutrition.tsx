import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionHeader from "@/components/SectionHeader";
import BottomNav from "@/components/BottomNav";

// Import meal images
import mealSalad1 from "@/assets/meal-salad1.jpg";
import mealSalad2 from "@/assets/meal-salad2.jpg";

interface MealPlan {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
}

const mealPlans: MealPlan[] = [
  {
    id: "1",
    name: "Salada Proteica de Frango",
    category: "Almoço",
    calories: 420,
    protein: 38,
    carbs: 25,
    fat: 18,
    imageUrl: mealSalad1,
  },
  {
    id: "2",
    name: "Bowl de Quinoa e Salmão",
    category: "Jantar",
    calories: 520,
    protein: 42,
    carbs: 35,
    fat: 22,
    imageUrl: mealSalad2,
  },
  {
    id: "3",
    name: "Smoothie de Proteína",
    category: "Café da Manhã",
    calories: 280,
    protein: 28,
    carbs: 32,
    fat: 8,
    imageUrl: mealSalad1,
  },
  {
    id: "4",
    name: "Wrap de Atum",
    category: "Lanche",
    calories: 320,
    protein: 32,
    carbs: 28,
    fat: 12,
    imageUrl: mealSalad2,
  },
];

const categories = ["Todos", "Café da Manhã", "Almoço", "Jantar", "Lanche"];

export default function Nutrition() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filteredMeals = mealPlans.filter((meal) => {
    const matchesSearch = meal.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "Todos" || meal.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Daily macros summary
  const dailyMacros = {
    calories: { current: 1450, target: 2000 },
    protein: { current: 98, target: 150 },
    carbs: { current: 120, target: 200 },
    fat: { current: 48, target: 70 },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-black">Nutrição</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Daily Summary */}
        <Card className="p-4 bg-card border-border">
          <h3 className="font-bold text-foreground mb-4">Resumo do Dia</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-orange/20 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {dailyMacros.calories.current}
              </p>
              <p className="text-xs text-muted-foreground">/{dailyMacros.calories.target} kcal</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center mx-auto mb-2">
                <Beef className="w-5 h-5 text-purple" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {dailyMacros.protein.current}g
              </p>
              <p className="text-xs text-muted-foreground">/{dailyMacros.protein.target}g</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center mx-auto mb-2">
                <Wheat className="w-5 h-5 text-lime" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {dailyMacros.carbs.current}g
              </p>
              <p className="text-xs text-muted-foreground">/{dailyMacros.carbs.target}g</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue/20 flex items-center justify-center mx-auto mb-2">
                <Droplets className="w-5 h-5 text-blue" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {dailyMacros.fat.current}g
              </p>
              <p className="text-xs text-muted-foreground">/{dailyMacros.fat.target}g</p>
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar refeições..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              className={activeCategory === category ? "bg-lime text-black" : ""}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Meal Plans */}
        <div>
          <SectionHeader title="Planos de Refeição" subtitle="Refeições balanceadas" />
          
          <div className="space-y-3">
            {filteredMeals.map((meal) => (
              <Card 
                key={meal.id}
                className="flex overflow-hidden rounded-2xl bg-card border-border cursor-pointer hover:border-lime/50 transition-all"
                onClick={() => navigate(`/nutrition/${meal.id}`)}
              >
                <div className="w-24 h-24 flex-shrink-0">
                  <img 
                    src={meal.imageUrl} 
                    alt={meal.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3">
                  <span className="text-xs text-lime font-medium">{meal.category}</span>
                  <h4 className="font-bold text-foreground line-clamp-1">{meal.name}</h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>G: {meal.fat}g</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
