import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const EXPENSE_CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Servicios",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Otros",
];

const COLORS = ["#f43f5e", "#ec4899", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6"];

export default function Finances() {
  const { user } = useAuth();
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const addExpenseMutation = trpc.finances.addExpense.useMutation();
  const savingsQuery = trpc.finances.getTotalSavings.useQuery();
  const expensesQuery = trpc.finances.getMonthlyExpenses.useQuery({
    month: new Date(),
  });

  const handleAddExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      await addExpenseMutation.mutateAsync({
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        date: new Date(expenseForm.date),
      });

      setExpenseForm({
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });

      toast.success("Gasto registrado exitosamente");
      expensesQuery.refetch();
      savingsQuery.refetch();
    } catch (error) {
      toast.error("Error al registrar el gasto");
    }
  };

  // Prepare data for charts
  const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    value:
      expensesQuery.data?.reduce((sum, exp) => {
        return exp.category === cat ? sum + Number(exp.amount) : sum;
      }, 0) || 0,
  })).filter((item) => item.value > 0);

  const totalExpenses = expensesQuery.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">💰 Gestión de Finanzas</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="stat-card">
            <p className="text-sm text-slate-600">Ahorros actuales</p>
            <p className="text-3xl font-bold text-rose-600">
              {savingsQuery.data ? `${(savingsQuery.data.savings / 1000).toFixed(1)}k€` : "0€"}
            </p>
            <p className="mt-2 text-xs text-slate-500">de 150k€</p>
          </Card>

          <Card className="stat-card">
            <p className="text-sm text-slate-600">Gastos este mes</p>
            <p className="text-3xl font-bold text-orange-600">{totalExpenses.toFixed(2)}€</p>
            <p className="mt-2 text-xs text-slate-500">Total registrado</p>
          </Card>

          <Card className="stat-card">
            <p className="text-sm text-slate-600">Ingresos mensuales</p>
            <p className="text-3xl font-bold text-green-600">2.600€</p>
            <p className="mt-2 text-xs text-slate-500">1.300€ cada uno</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add Expense Form */}
          <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Registrar gasto</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                  Categoría
                </Label>
                <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}>
                  <SelectTrigger className="elegant-input mt-1">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                  Cantidad (€)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
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
                  placeholder="Ej: Compra en Carrefour"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                  Fecha
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <Button
                onClick={handleAddExpense}
                disabled={addExpenseMutation.isPending}
                className="elegant-button w-full"
              >
                {addExpenseMutation.isPending ? "Guardando..." : "Registrar gasto"}
              </Button>
            </div>
          </Card>

          {/* Charts */}
          <div className="lg:col-span-2">
            {expensesByCategory.length > 0 ? (
              <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Gastos por categoría</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(2)}€`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${typeof value === 'number' ? value.toFixed(2) : value}€`} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-center text-slate-600">No hay gastos registrados este mes</p>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <Card className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Gastos recientes</h2>
          {expensesQuery.data && expensesQuery.data.length > 0 ? (
            <div className="space-y-2">
              {expensesQuery.data.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0">
                  <div>
                    <p className="font-medium text-slate-900">{expense.category}</p>
                    <p className="text-sm text-slate-600">{expense.description}</p>
                  </div>
                  <p className="font-bold text-slate-900">{Number(expense.amount).toFixed(2)}€</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-600">No hay gastos registrados</p>
          )}
        </Card>
      </main>
    </div>
  );
}
