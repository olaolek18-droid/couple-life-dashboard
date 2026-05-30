import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, TrendingDown, Store } from "lucide-react";
// Storage será manejado por el servidor tRPC

const STORES = [
  "Carrefour",
  "Mercadona",
  "Alcampo",
  "Lidl",
  "Aldi",
  "El Corte Inglés",
  "Dia",
  "Otros",
];

export default function Receipts() {
  const { user } = useAuth();
  const [receiptForm, setReceiptForm] = useState({
    store: "",
    totalAmount: "",
    date: new Date().toISOString().split("T")[0],
    photo: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  const addReceiptMutation = trpc.receipts.addReceipt.useMutation();
  const receiptsQuery = trpc.receipts.getReceipts.useQuery();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar 5MB");
        return;
      }
      setReceiptForm({ ...receiptForm, photo: file });
    }
  };

  const handleAddReceipt = async () => {
    if (!receiptForm.store || !receiptForm.photo) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64 for transmission
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Add receipt to database (server will handle storage)
        await addReceiptMutation.mutateAsync({
          store: receiptForm.store,
          photoUrl: base64,
          photoKey: `receipts/${Date.now()}-${receiptForm.photo!.name}`,
          totalAmount: receiptForm.totalAmount ? parseFloat(receiptForm.totalAmount) : undefined,
          date: new Date(receiptForm.date),
        });

        setReceiptForm({
          store: "",
          totalAmount: "",
          date: new Date().toISOString().split("T")[0],
          photo: null,
        });

        toast.success("Ticket guardado exitosamente");
        receiptsQuery.refetch();
        setUploading(false);
      };
      reader.readAsDataURL(receiptForm.photo);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el ticket");
      setUploading(false);
    }
  };

  // Group receipts by store
  const receiptsByStore = STORES.map((store) => ({
    store,
    receipts: receiptsQuery.data?.filter((r) => r.store === store) || [],
    total: receiptsQuery.data
      ?.filter((r) => r.store === store)
      .reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0) || 0,
  })).filter((item) => item.receipts.length > 0);

  const totalSpent = receiptsQuery.data?.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">🧾 Comparador de tickets</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Upload Form */}
          <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 h-fit">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Subir ticket</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="store" className="text-sm font-medium text-slate-700">
                  Supermercado
                </Label>
                <select
                  id="store"
                  value={receiptForm.store}
                  onChange={(e) => setReceiptForm({ ...receiptForm, store: e.target.value })}
                  className="elegant-input mt-1 w-full"
                >
                  <option value="">Selecciona un supermercado</option>
                  {STORES.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="totalAmount" className="text-sm font-medium text-slate-700">
                  Total (€)
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={receiptForm.totalAmount}
                  onChange={(e) => setReceiptForm({ ...receiptForm, totalAmount: e.target.value })}
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
                  value={receiptForm.date}
                  onChange={(e) => setReceiptForm({ ...receiptForm, date: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="photo" className="text-sm font-medium text-slate-700">
                  Foto del ticket
                </Label>
                <div className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-6">
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="photo" className="cursor-pointer text-center">
                    {receiptForm.photo ? (
                      <div>
                        <p className="text-sm font-medium text-slate-900">{receiptForm.photo.name}</p>
                        <p className="text-xs text-slate-500">Haz clic para cambiar</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-2 text-sm font-medium text-slate-900">Sube una foto</p>
                        <p className="text-xs text-slate-500">PNG, JPG hasta 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <Button
                onClick={handleAddReceipt}
                disabled={uploading || addReceiptMutation.isPending}
                className="elegant-button w-full"
              >
                {uploading || addReceiptMutation.isPending ? "Subiendo..." : "Guardar ticket"}
              </Button>
            </div>
          </Card>

          {/* Receipts Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total gastado</p>
                  <p className="text-3xl font-bold text-slate-900">{totalSpent.toFixed(2)}€</p>
                </div>
                <TrendingDown className="h-12 w-12 text-orange-500" />
              </div>
            </Card>

            {/* Receipts by Store */}
            {receiptsByStore.length > 0 ? (
              receiptsByStore.map((storeData) => (
                <Card key={storeData.store} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-rose-500" />
                      <h3 className="text-lg font-bold text-slate-900">{storeData.store}</h3>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{storeData.total.toFixed(2)}€</p>
                  </div>

                  <div className="space-y-3">
                    {storeData.receipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                      >
                        {receipt.photoUrl && (
                          <img
                            src={receipt.photoUrl}
                            alt="Receipt"
                            className="h-16 w-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(receipt.date).toLocaleDateString("es-ES")}
                          </p>
                          {receipt.totalAmount && (
                            <p className="text-sm text-slate-600">{Number(receipt.totalAmount).toFixed(2)}€</p>
                          )}
                        </div>
                        {receipt.photoUrl && (
                          <a
                            href={receipt.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-500 hover:text-rose-600 text-sm font-medium"
                          >
                            Ver
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-center">
                <p className="text-slate-600">Aún no hay tickets guardados. ¡Sube el primero!</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
