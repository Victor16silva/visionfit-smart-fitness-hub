import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Search,
  Utensils,
  Target,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Edit,
  Trash2,
  Users,
  Apple,
} from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url: string | null;
  ingredients: string[];
  instructions: string;
  prep_time: number;
  created_at: string;
}

interface NutritionPlan {
  id: string;
  name: string;
  description: string;
  goal: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  meals: any[];
  created_at: string;
}

export default function NutritionAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"recipes" | "plans">("recipes");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Recipe state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    name: "",
    description: "",
    category: "Almoço",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    image_url: "",
    ingredients: "",
    instructions: "",
    prep_time: 30,
  });
  
  // Plan state
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NutritionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    goal: "Emagrecimento",
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 200,
    daily_fat: 70,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAccess();
  }, [user, navigate]);

  const checkAccess = async () => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id);

      const hasPermission = roles?.some(r => 
        r.role === "admin" || r.role === "master" || r.role === "personal"
      );
      
      setHasAccess(!!hasPermission);
      
      if (hasPermission) {
        loadData();
      } else {
        navigate("/dashboard");
        toast.error("Acesso negado");
      }
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/dashboard");
    }
  };

  const loadData = async () => {
    setLoading(true);
    // For now, we'll use mock data since nutrition tables don't exist yet
    // In future, this will load from nutrition_recipes and nutrition_plans tables
    setRecipes([
      {
        id: "1",
        name: "Salada de Frango Grelhado",
        description: "Salada proteica perfeita para o almoço",
        category: "Almoço",
        calories: 350,
        protein: 35,
        carbs: 15,
        fat: 18,
        image_url: null,
        ingredients: ["Frango", "Alface", "Tomate", "Azeite"],
        instructions: "Grelhe o frango e misture com os vegetais frescos.",
        prep_time: 20,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Smoothie Proteico",
        description: "Shake pós-treino energético",
        category: "Café da Manhã",
        calories: 280,
        protein: 25,
        carbs: 30,
        fat: 8,
        image_url: null,
        ingredients: ["Banana", "Whey", "Leite", "Aveia"],
        instructions: "Bata tudo no liquidificador até ficar homogêneo.",
        prep_time: 5,
        created_at: new Date().toISOString(),
      },
    ]);
    
    setPlans([
      {
        id: "1",
        name: "Plano Emagrecimento",
        description: "Déficit calórico para perda de gordura",
        goal: "Emagrecimento",
        daily_calories: 1800,
        daily_protein: 150,
        daily_carbs: 150,
        daily_fat: 60,
        meals: [],
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Plano Hipertrofia",
        description: "Superávit calórico para ganho de massa",
        goal: "Hipertrofia",
        daily_calories: 2800,
        daily_protein: 180,
        daily_carbs: 320,
        daily_fat: 90,
        meals: [],
        created_at: new Date().toISOString(),
      },
    ]);
    
    setLoading(false);
  };

  const handleSaveRecipe = () => {
    // Mock save - will integrate with database later
    toast.success(editingRecipe ? "Receita atualizada!" : "Receita criada!");
    setShowRecipeModal(false);
    setEditingRecipe(null);
    resetRecipeForm();
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
    toast.success("Receita removida!");
  };

  const handleSavePlan = () => {
    toast.success(editingPlan ? "Plano atualizado!" : "Plano criado!");
    setShowPlanModal(false);
    setEditingPlan(null);
    resetPlanForm();
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
    toast.success("Plano removido!");
  };

  const resetRecipeForm = () => {
    setRecipeForm({
      name: "",
      description: "",
      category: "Almoço",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      image_url: "",
      ingredients: "",
      instructions: "",
      prep_time: 30,
    });
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: "",
      description: "",
      goal: "Emagrecimento",
      daily_calories: 2000,
      daily_protein: 150,
      daily_carbs: 200,
      daily_fat: 70,
    });
  };

  const openEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      image_url: recipe.image_url || "",
      ingredients: recipe.ingredients.join(", "),
      instructions: recipe.instructions,
      prep_time: recipe.prep_time,
    });
    setShowRecipeModal(true);
  };

  const openEditPlan = (plan: NutritionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      goal: plan.goal,
      daily_calories: plan.daily_calories,
      daily_protein: plan.daily_protein,
      daily_carbs: plan.daily_carbs,
      daily_fat: plan.daily_fat,
    });
    setShowPlanModal(true);
  };

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.goal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const categories = ["Café da Manhã", "Almoço", "Jantar", "Lanche", "Pré-Treino", "Pós-Treino"];
  const goals = ["Emagrecimento", "Hipertrofia", "Manutenção", "Definição", "Saúde"];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 px-4 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Vision Nutri</h1>
            <p className="text-white/70 text-sm">Gerencie receitas e planos</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Utensils className="h-5 w-5 text-white mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{recipes.length}</p>
            <p className="text-xs text-white/70">Receitas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Target className="h-5 w-5 text-white mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{plans.length}</p>
            <p className="text-xs text-white/70">Planos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Users className="h-5 w-5 text-white mx-auto mb-1" />
            <p className="text-xl font-bold text-white">0</p>
            <p className="text-xs text-white/70">Alunos</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "recipes" | "plans")}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="recipes" className="flex-1">
              <Utensils className="h-4 w-4 mr-2" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex-1">
              <Target className="h-4 w-4 mr-2" />
              Planos
            </TabsTrigger>
          </TabsList>

          {/* Search & Add Button */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                if (activeTab === "recipes") {
                  resetRecipeForm();
                  setEditingRecipe(null);
                  setShowRecipeModal(true);
                } else {
                  resetPlanForm();
                  setEditingPlan(null);
                  setShowPlanModal(true);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-3">
            {filteredRecipes.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Apple className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma receita encontrada</p>
                  <Button
                    onClick={() => {
                      resetRecipeForm();
                      setShowRecipeModal(true);
                    }}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Receita
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{recipe.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {recipe.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{recipe.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditRecipe(recipe)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{recipe.calories}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Beef className="h-4 w-4 text-red-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{recipe.protein}g</p>
                        <p className="text-xs text-muted-foreground">Prot</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Wheat className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{recipe.carbs}g</p>
                        <p className="text-xs text-muted-foreground">Carb</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Droplet className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{recipe.fat}g</p>
                        <p className="text-xs text-muted-foreground">Gord</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-3">
            {filteredPlans.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum plano encontrado</p>
                  <Button
                    onClick={() => {
                      resetPlanForm();
                      setShowPlanModal(true);
                    }}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Plano
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPlans.map((plan) => (
                <Card key={plan.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{plan.name}</h3>
                          <Badge className="bg-green-600 text-white text-xs">
                            {plan.goal}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{plan.daily_calories}</p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Beef className="h-4 w-4 text-red-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{plan.daily_protein}g</p>
                        <p className="text-xs text-muted-foreground">Prot</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Wheat className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{plan.daily_carbs}g</p>
                        <p className="text-xs text-muted-foreground">Carb</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2">
                        <Droplet className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-sm font-bold">{plan.daily_fat}g</p>
                        <p className="text-xs text-muted-foreground">Gord</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Recipe Modal */}
      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecipe ? "Editar Receita" : "Nova Receita"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Receita</Label>
              <Input
                value={recipeForm.name}
                onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                placeholder="Ex: Salada Proteica"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={recipeForm.description}
                onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                placeholder="Breve descrição da receita"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={recipeForm.category}
                onValueChange={(v) => setRecipeForm({ ...recipeForm, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calorias (kcal)</Label>
                <Input
                  type="number"
                  value={recipeForm.calories}
                  onChange={(e) => setRecipeForm({ ...recipeForm, calories: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Tempo (min)</Label>
                <Input
                  type="number"
                  value={recipeForm.prep_time}
                  onChange={(e) => setRecipeForm({ ...recipeForm, prep_time: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Proteína (g)</Label>
                <Input
                  type="number"
                  value={recipeForm.protein}
                  onChange={(e) => setRecipeForm({ ...recipeForm, protein: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Carbos (g)</Label>
                <Input
                  type="number"
                  value={recipeForm.carbs}
                  onChange={(e) => setRecipeForm({ ...recipeForm, carbs: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  value={recipeForm.fat}
                  onChange={(e) => setRecipeForm({ ...recipeForm, fat: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Ingredientes (separados por vírgula)</Label>
              <Textarea
                value={recipeForm.ingredients}
                onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                placeholder="Frango, Alface, Tomate..."
              />
            </div>
            <div>
              <Label>Modo de Preparo</Label>
              <Textarea
                value={recipeForm.instructions}
                onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                placeholder="Instruções de preparo..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecipeModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRecipe} className="bg-green-600 hover:bg-green-700">
              {editingRecipe ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plano" : "Novo Plano Nutricional"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Plano</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="Ex: Plano Emagrecimento"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Descrição do plano"
              />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Select
                value={planForm.goal}
                onValueChange={(v) => setPlanForm({ ...planForm, goal: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((goal) => (
                    <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calorias/dia</Label>
                <Input
                  type="number"
                  value={planForm.daily_calories}
                  onChange={(e) => setPlanForm({ ...planForm, daily_calories: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Proteína (g)</Label>
                <Input
                  type="number"
                  value={planForm.daily_protein}
                  onChange={(e) => setPlanForm({ ...planForm, daily_protein: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Carbos (g)</Label>
                <Input
                  type="number"
                  value={planForm.daily_carbs}
                  onChange={(e) => setPlanForm({ ...planForm, daily_carbs: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  value={planForm.daily_fat}
                  onChange={(e) => setPlanForm({ ...planForm, daily_fat: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} className="bg-green-600 hover:bg-green-700">
              {editingPlan ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
