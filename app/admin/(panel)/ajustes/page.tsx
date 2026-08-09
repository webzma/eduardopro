import {
  IconCircleCheck,
  IconAlertTriangle,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { requireAdmin } from "../../../lib/auth";
import { getSettings } from "../../../lib/settings";
import { getRate } from "../../../lib/rate";
import { formatRate } from "../../../lib/money";
import { setRateAction } from "../../actions";
import { cn } from "@/app/lib/utils";
import { buttonVariants } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Caracas",
});

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireAdmin();
  const [settings, rate, params] = await Promise.all([
    getSettings(),
    getRate(),
    searchParams,
  ]);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tasa de cambio del panel.</p>
      </header>

      {params.ok ? (
        <p role="status" className="rounded-md border border-l-4 bg-card px-4 py-2 text-sm border-l-navy mb-6">
          <IconCircleCheck size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          Tasa de respaldo guardada.
        </p>
      ) : null}
      {params.error ? (
        <p role="alert" className="rounded-md border border-l-4 bg-card px-4 py-2 text-sm border-l-destructive text-destructive mb-6">
          <IconAlertTriangle size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          Escribe un número mayor que cero.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="text-base font-semibold">Tasa en uso</h2>
            {rate ? (
              <Badge variant={rate.source === "bcv" ? "secondary" : "outline"}>
                {rate.source === "bcv" ? "BCV, en vivo" : "Respaldo manual"}
              </Badge>
            ) : (
              <Badge variant="destructive">Sin tasa</Badge>
            )}
          </div>
          <div className="p-4">
            {rate ? (
              <>
                <p className="text-xl leading-tight font-semibold tracking-tight tabular-nums">
                  Bs {formatRate(rate.value)}
                  <span className="text-sm text-muted-foreground text-base font-normal"> / $1</span>
                </p>
                {rate.updatedAt ? (
                  <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                    Dato del {DATE.format(new Date(rate.updatedAt))}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                El BCV no responde y no hay respaldo. Sin tasa no se pueden
                registrar ventas.
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-xs leading-relaxed">
              La tasa se toma del BCV automáticamente y se refresca cada hora.
              Cada venta guarda la que se usó, así que cambiarla no altera el
              histórico.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="text-base font-semibold">Respaldo manual</h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4 text-xs leading-relaxed">
              Se usa solo si la API del BCV no responde. Conviene mantenerlo al
              día: es lo único que evita que el panel se quede sin poder
              facturar cuando el servicio se cae.
            </p>
            <form action={setRateAction}>
              <Label htmlFor="rate" className="mb-1 block">
                Bolívares por dólar
              </Label>
              <Input
                id="rate"
                name="rate"
                type="text"
                inputMode="decimal"
                required
                defaultValue={
                  settings.fallbackRate > 0
                    ? String(settings.fallbackRate)
                    : rate
                      ? String(rate.value)
                      : ""
                }
                placeholder="756,7083"
                aria-invalid={params.error ? true : undefined}
                className="max-w-48"
              />
              {settings.updatedAt ? (
                <p className="text-sm text-muted-foreground mt-2 text-xs">
                  Última vez: {DATE.format(new Date(settings.updatedAt))}
                </p>
              ) : null}
              <button
                type="submit"
                className={cn(buttonVariants(), "mt-3")}
              >
                <IconDeviceFloppy size={16} stroke={1.75} />
                Guardar respaldo
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
