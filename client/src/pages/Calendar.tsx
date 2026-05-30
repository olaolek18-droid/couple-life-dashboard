import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, Bell } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    type: "reminder" as const,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notifyBefore: "1440", // 1 day before
  });

  const addEventMutation = trpc.calendar.addEvent.useMutation();
  const eventsQuery = trpc.calendar.getEvents.useQuery();

  const handleAddEvent = async () => {
    if (!eventForm.title) {
      toast.error("Por favor ingresa el título del evento");
      return;
    }

    try {
      await addEventMutation.mutateAsync({
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type,
        startDate: new Date(eventForm.startDate),
        endDate: eventForm.endDate ? new Date(eventForm.endDate) : undefined,
        notifyBefore: eventForm.notifyBefore ? parseInt(eventForm.notifyBefore) : undefined,
      });

      setEventForm({
        title: "",
        description: "",
        type: "reminder",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        notifyBefore: "1440",
      });

      toast.success("Evento añadido exitosamente");
      eventsQuery.refetch();
    } catch (error) {
      toast.error("Error al añadir el evento");
    }
  };

  // Get events for selected month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return eventsQuery.data?.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    }) || [];
  };

  const typeLabels = {
    savings_goal: "Meta de ahorro",
    milestone: "Hito importante",
    couple_event: "Evento de pareja",
    task: "Tarea",
    reminder: "Recordatorio",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">📅 Calendario compartido</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add Event Form */}
          <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 h-fit">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Nuevo evento</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Título
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ej: Visita a Sant Feliu"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="type" className="text-sm font-medium text-slate-700">
                  Tipo
                </Label>
                <Select value={eventForm.type} onValueChange={(value: any) => setEventForm({ ...eventForm, type: value })}>
                  <SelectTrigger className="elegant-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Recordatorio</SelectItem>
                    <SelectItem value="savings_goal">Meta de ahorro</SelectItem>
                    <SelectItem value="milestone">Hito importante</SelectItem>
                    <SelectItem value="couple_event">Evento de pareja</SelectItem>
                    <SelectItem value="task">Tarea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  placeholder="Detalles del evento..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="elegant-input mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                  Fecha de inicio
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="text-sm font-medium text-slate-700">
                  Fecha de fin (opcional)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                  className="elegant-input mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notifyBefore" className="text-sm font-medium text-slate-700">
                  Notificar (minutos antes)
                </Label>
                <Select value={eventForm.notifyBefore} onValueChange={(value) => setEventForm({ ...eventForm, notifyBefore: value })}>
                  <SelectTrigger className="elegant-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="1440">1 día</SelectItem>
                    <SelectItem value="10080">1 semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddEvent}
                disabled={addEventMutation.isPending}
                className="elegant-button w-full"
              >
                {addEventMutation.isPending ? "Guardando..." : "Añadir evento"}
              </Button>
            </div>
          </Card>

          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              {/* Month Navigation */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {format(selectedDate, "MMMM yyyy", { locale: es })}
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    variant="outline"
                    size="sm"
                    className="elegant-button-secondary"
                  >
                    ← Anterior
                  </Button>
                  <Button
                    onClick={() => setSelectedDate(new Date())}
                    variant="outline"
                    size="sm"
                    className="elegant-button-secondary"
                  >
                    Hoy
                  </Button>
                  <Button
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    variant="outline"
                    size="sm"
                    className="elegant-button-secondary"
                  >
                    Siguiente →
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sab", "Dom"].map((day) => (
                  <div key={day} className="text-center font-bold text-slate-600 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-24 rounded-lg border p-2 ${
                        isCurrentDay
                          ? "border-rose-400 bg-rose-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className={`text-sm font-bold ${isCurrentDay ? "text-rose-600" : "text-slate-900"}`}>
                        {format(day, "d")}
                      </p>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="truncate rounded bg-rose-100 px-1 py-0.5 text-xs font-medium text-rose-700"
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <p className="text-xs text-slate-500">+{dayEvents.length - 2} más</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Próximos eventos</h3>
              {eventsQuery.data && eventsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {eventsQuery.data
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .slice(0, 5)
                    .map((event) => (
                      <div key={event.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-b-0">
                        <div className="mt-1">
                          <Calendar className="h-5 w-5 text-rose-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{event.title}</p>
                          <p className="text-sm text-slate-600">
                            {format(new Date(event.startDate), "d MMM yyyy", { locale: es })}
                          </p>
                          {event.description && (
                            <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {typeLabels[event.type as keyof typeof typeLabels]}
                          </p>
                        </div>
                        {event.notifyBefore && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Bell className="h-4 w-4" />
                            {event.notifyBefore}m
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-slate-600">No hay eventos próximos</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
