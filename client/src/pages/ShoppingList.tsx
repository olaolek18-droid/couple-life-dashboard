import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, CheckCircle2, Circle } from "lucide-react";

const SHOPPING_CATEGORIES = [
  "Frutas y verduras",
  "Carnes y pescados",
  "Lácteos",
  "Despensa",
  "Bebidas",
  "Higiene",
  "Limpieza",
  "Otros",
];

export default function ShoppingList() {
  const { user } = useAuth();
  const [itemForm, setItemForm] = useState({
    item: "",
    quantity: "",
    unit: "",
    category: "",
  });

  const addItemMutation = trpc.shoppingList.addItem.useMutation();
  const toggleItemMutation = trpc.shoppingList.toggleItem.useMutation();
  const itemsQuery = trpc.shoppingList.getItems.useQuery();

  const handleAddItem = async () => {
    if (!itemForm.item) {
      toast.error("Por favor ingresa un artículo");
      return;
    }

    try {
      await addItemMutation.mutateAsync({
        item: itemForm.item,
        quantity: itemForm.quantity,
        unit: itemForm.unit,
        category: itemForm.category,
      });

      setItemForm({
        item: "",
        quantity: "",
        unit: "",
        category: "",
      });

      toast.success("Artículo añadido a la lista");
      itemsQuery.refetch();
    } catch (error) {
      toast.error("Error al añadir el artículo");
    }
  };

  const handleToggleItem = async (itemId: number, completed: boolean) => {
    try {
      await toggleItemMutation.mutateAsync({
        itemId,
        completed: !completed,
      });
      itemsQuery.refetch();
    } catch (error) {
      toast.error("Error al actualizar el artículo");
    }
  };

  const completedItems = itemsQuery.data?.filter((item) => item.completed) || [];
  const pendingItems = itemsQuery.data?.filter((item) => !item.completed) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">🛒 Lista de la compra compartida</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add Item Form */}
          <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Añadir artículo</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="item" className="text-sm font-medium text-slate-700">
                  Artículo
                </Label>
                <Input
                  id="item"
                  type="text"
                  placeholder="Ej: Leche"
                  value={itemForm.item}
                  onChange={(e) => setItemForm({ ...itemForm, item: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                    Cantidad
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="2"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                    className="elegant-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="text-sm font-medium text-slate-700">
                    Unidad
                  </Label>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="L, kg, etc."
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="elegant-input mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                  Categoría
                </Label>
                <Select value={itemForm.category} onValueChange={(value) => setItemForm({ ...itemForm, category: value })}>
                  <SelectTrigger className="elegant-input mt-1">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOPPING_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddItem}
                disabled={addItemMutation.isPending}
                className="elegant-button w-full"
              >
                {addItemMutation.isPending ? "Añadiendo..." : "Añadir a la lista"}
              </Button>
            </div>
          </Card>

          {/* Shopping List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Items */}
            <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Por comprar ({pendingItems.length})
              </h2>
              {pendingItems.length > 0 ? (
                <div className="space-y-2">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                    >
                      <button
                        onClick={() => handleToggleItem(item.id, item.completed || false)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Circle className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{item.item}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity && `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`}
                            {item.category && ` • ${item.category}`}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-600">¡Nada que comprar! 🎉</p>
              )}
            </Card>

            {/* Completed Items */}
            {completedItems.length > 0 && (
              <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">
                  Comprado ({completedItems.length})
                </h2>
                <div className="space-y-2">
                  {completedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <button
                        onClick={() => handleToggleItem(item.id, item.completed || false)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="line-through font-medium text-slate-600">{item.item}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity && `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`}
                            {item.category && ` • ${item.category}`}
                          </p>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
