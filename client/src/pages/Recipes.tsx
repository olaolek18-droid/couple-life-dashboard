import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, Clock, Users } from "lucide-react";

export default function Recipes() {
  const { user } = useAuth();
  const [recipeForm, setRecipeForm] = useState({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
    prepTime: "",
    cookTime: "",
    servings: "",
  });

  const addRecipeMutation = trpc.recipes.addRecipe.useMutation();
  const toggleFavoriteMutation = trpc.recipes.toggleFavorite.useMutation();
  const recipesQuery = trpc.recipes.getRecipes.useQuery();

  const handleAddRecipe = async () => {
    if (!recipeForm.title) {
      toast.error("Por favor ingresa el nombre de la receta");
      return;
    }

    try {
      const ingredients = recipeForm.ingredients
        .split("\n")
        .filter((ing) => ing.trim());

      await addRecipeMutation.mutateAsync({
        title: recipeForm.title,
        description: recipeForm.description,
        ingredients,
        instructions: recipeForm.instructions,
        prepTime: recipeForm.prepTime ? parseInt(recipeForm.prepTime) : undefined,
        cookTime: recipeForm.cookTime ? parseInt(recipeForm.cookTime) : undefined,
        servings: recipeForm.servings ? parseInt(recipeForm.servings) : undefined,
      });

      setRecipeForm({
        title: "",
        description: "",
        ingredients: "",
        instructions: "",
        prepTime: "",
        cookTime: "",
        servings: "",
      });

      toast.success("Receta añadida exitosamente");
      recipesQuery.refetch();
    } catch (error) {
      toast.error("Error al añadir la receta");
    }
  };

  const handleToggleFavorite = async (recipeId: number, isFavorite: boolean) => {
    try {
      await toggleFavoriteMutation.mutateAsync({
        recipeId,
        isFavorite: !isFavorite,
      });
      recipesQuery.refetch();
    } catch (error) {
      toast.error("Error al actualizar la receta");
    }
  };

  const favoriteRecipes = recipesQuery.data?.filter((r) => r.isFavorite) || [];
  const allRecipes = recipesQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">👨‍🍳 Recetas compartidas</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add Recipe Form */}
          <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 h-fit">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Nueva receta</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Nombre de la receta
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ej: Pasta a la boloñesa"
                  value={recipeForm.title}
                  onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Descripción
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Breve descripción"
                  value={recipeForm.description}
                  onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ingredients" className="text-sm font-medium text-slate-700">
                  Ingredientes (uno por línea)
                </Label>
                <Textarea
                  id="ingredients"
                  placeholder="200g de pasta&#10;500g de carne picada&#10;..."
                  value={recipeForm.ingredients}
                  onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                  className="elegant-input mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="instructions" className="text-sm font-medium text-slate-700">
                  Instrucciones
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="Paso a paso..."
                  value={recipeForm.instructions}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  className="elegant-input mt-1"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="prepTime" className="text-sm font-medium text-slate-700">
                    Prep (min)
                  </Label>
                  <Input
                    id="prepTime"
                    type="number"
                    placeholder="15"
                    value={recipeForm.prepTime}
                    onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })}
                    className="elegant-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime" className="text-sm font-medium text-slate-700">
                    Cocción (min)
                  </Label>
                  <Input
                    id="cookTime"
                    type="number"
                    placeholder="30"
                    value={recipeForm.cookTime}
                    onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })}
                    className="elegant-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="servings" className="text-sm font-medium text-slate-700">
                    Raciones
                  </Label>
                  <Input
                    id="servings"
                    type="number"
                    placeholder="2"
                    value={recipeForm.servings}
                    onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })}
                    className="elegant-input mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddRecipe}
                disabled={addRecipeMutation.isPending}
                className="elegant-button w-full"
              >
                {addRecipeMutation.isPending ? "Guardando..." : "Guardar receta"}
              </Button>
            </div>
          </Card>

          {/* Recipes Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Favorite Recipes */}
            {favoriteRecipes.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-bold text-slate-900">❤️ Favoritas</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {favoriteRecipes.map((recipe) => (
                    <Card key={recipe.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-900">{recipe.title}</h3>
                        <button
                          onClick={() => handleToggleFavorite(recipe.id, recipe.isFavorite || false)}
                          className="text-rose-500 hover:text-rose-600"
                        >
                          <Heart className="h-5 w-5 fill-current" />
                        </button>
                      </div>
                      {recipe.description && (
                        <p className="text-sm text-slate-600 mb-3">{recipe.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-slate-500">
                        {recipe.prepTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.prepTime}m prep
                          </div>
                        )}
                        {recipe.cookTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.cookTime}m cocción
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {recipe.servings} raciones
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Recipes */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Todas las recetas ({allRecipes.length})
              </h2>
              {allRecipes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {allRecipes.map((recipe) => (
                    <Card key={recipe.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-900">{recipe.title}</h3>
                        <button
                          onClick={() => handleToggleFavorite(recipe.id, recipe.isFavorite || false)}
                          className={`${recipe.isFavorite ? "text-rose-500" : "text-slate-300"} hover:text-rose-600`}
                        >
                          <Heart className={`h-5 w-5 ${recipe.isFavorite ? "fill-current" : ""}`} />
                        </button>
                      </div>
                      {recipe.description && (
                        <p className="text-sm text-slate-600 mb-3">{recipe.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-slate-500">
                        {recipe.prepTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.prepTime}m prep
                          </div>
                        )}
                        {recipe.cookTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {recipe.cookTime}m cocción
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {recipe.servings} raciones
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-center">
                  <p className="text-slate-600">Aún no hay recetas. ¡Añade la primera!</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
