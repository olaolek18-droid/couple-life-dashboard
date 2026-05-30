import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Heart, TrendingUp, Users, Target } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";

/**
 * Dashboard principal - Minijuego de vida en pareja
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [couple, setCouple] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [happinessLevel, setHappinessLevel] = useState(50);

  // Fetch couple data
  const coupleQuery = trpc.couple.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const savingsQuery = trpc.finances.getTotalSavings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (coupleQuery.data) {
      setCouple(coupleQuery.data);
      setHappinessLevel(coupleQuery.data.happinessLevel || 50);
    }
  }, [coupleQuery.data]);

  useEffect(() => {
    if (savingsQuery.data) {
      setSavings(savingsQuery.data);
    }
  }, [savingsQuery.data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">
            💑 Couple Life Dashboard
          </h1>
          <p className="mb-8 text-lg text-slate-600">
            Gestiona vuestra vida en pareja, ahorrad juntos y alcanzad vuestro sueño de una casa en Sant Feliu de Guíxols
          </p>
          <a href={getLoginUrl()}>
            <Button className="elegant-button w-full">Iniciar sesión</Button>
          </a>
        </div>
      </div>
    );
  }

  const savingsPercentage = savings
    ? Math.min((savings.savings / savings.target) * 100, 100)
    : 0;

  const monthsToGoal = savings && savings.savings > 0
    ? Math.ceil((savings.target - savings.savings) / ((savings.savings / 1) || 1))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">
            💑 Couple Life Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.name}</span>
            <Button
              onClick={() => logout()}
              variant="outline"
              size="sm"
              className="elegant-button-secondary"
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section - Minijuego */}
        <div className="mb-12 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-slate-900">
              🏡 Objetivo: Casa en Sant Feliu de Guíxols
            </h2>
            <p className="text-lg text-slate-600">
              Meta de ahorro: <span className="font-bold text-rose-600">150.000€</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Progreso de ahorro</span>
              <span className="text-sm font-bold text-rose-600">
                {savings ? `${(savings.savings / 1000).toFixed(1)}k / 150k €` : "0 €"}
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${savingsPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {savingsPercentage.toFixed(1)}% completado
            </p>
          </div>

          {/* Happiness Meter */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Felicidad en pareja
              </p>
              <div className="happiness-meter flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {happinessLevel}%
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Savings Card */}
          <Card className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ahorros actuales</p>
                <p className="text-2xl font-bold text-slate-900">
                  {savings ? `${(savings.savings / 1000).toFixed(1)}k€` : "0€"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-rose-500" />
            </div>
          </Card>

          {/* Target Card */}
          <Card className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Meta de ahorro</p>
                <p className="text-2xl font-bold text-slate-900">150k€</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          {/* Monthly Income Card */}
          <Card className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ingresos mensuales</p>
                <p className="text-2xl font-bold text-slate-900">2.600€</p>
                <p className="text-xs text-slate-500">1.300€ cada uno</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          {/* Estimated Date Card */}
          <Card className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Estimado en meses</p>
                <p className="text-2xl font-bold text-slate-900">
                  {monthsToGoal || "∞"}
                </p>
                <p className="text-xs text-slate-500">Aproximadamente</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <a href="/finances">
            <Button className="elegant-button w-full">💰 Finanzas</Button>
          </a>
          <a href="/calendar">
            <Button className="elegant-button w-full">📅 Calendario</Button>
          </a>
          <Button className="elegant-button w-full" disabled>
            ⏳ Próximamente
          </Button>
          <a href="/shopping">
            <Button className="elegant-button w-full">🛒 Compra</Button>
          </a>
          <a href="/recipes">
            <Button className="elegant-button w-full">👨‍🍳 Recetas</Button>
          </a>
          <a href="/receipts">
            <Button className="elegant-button w-full">🧾 Tickets</Button>
          </a>
        </div>
      </main>
    </div>
  );
}
