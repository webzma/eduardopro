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
      <header className="mb-(--space-md)">
        <h1 className="crm-h1">Ajustes</h1>
        <p className="crm-muted mt-0.5">Tasa de cambio del panel.</p>
      </header>

      {params.ok ? (
        <p role="status" className="crm-note crm-note--ok mb-(--space-md)">
          <IconCircleCheck size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          Tasa de respaldo guardada.
        </p>
      ) : null}
      {params.error ? (
        <p role="alert" className="crm-note crm-note--bad mb-(--space-md)">
          <IconAlertTriangle size={16} stroke={1.75} className="inline align-text-bottom" />{" "}
          Escribe un número mayor que cero.
        </p>
      ) : null}

      <div className="grid gap-(--space-md) lg:grid-cols-2 lg:items-start">
        <div className="crm-card">
          <div className="crm-card__head">
            <h2 className="crm-h2">Tasa en uso</h2>
            {rate ? (
              <span
                className={`crm-badge ${rate.source === "bcv" ? "crm-badge--navy" : "crm-badge--warn"}`}
              >
                {rate.source === "bcv" ? "BCV, en vivo" : "Respaldo manual"}
              </span>
            ) : (
              <span className="crm-badge crm-badge--signal">Sin tasa</span>
            )}
          </div>
          <div className="crm-card__body">
            {rate ? (
              <>
                <p className="crm-kpi__value">
                  Bs {formatRate(rate.value)}
                  <span className="crm-muted text-base font-normal"> / $1</span>
                </p>
                {rate.updatedAt ? (
                  <p className="crm-kpi__sub">
                    Dato del {DATE.format(new Date(rate.updatedAt))}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="crm-muted">
                El BCV no responde y no hay respaldo. Sin tasa no se pueden
                registrar ventas.
              </p>
            )}
            <p className="crm-muted mt-(--space-sm) text-xs leading-relaxed">
              La tasa se toma del BCV automáticamente y se refresca cada hora.
              Cada venta guarda la que se usó, así que cambiarla no altera el
              histórico.
            </p>
          </div>
        </div>

        <div className="crm-card">
          <div className="crm-card__head">
            <h2 className="crm-h2">Respaldo manual</h2>
          </div>
          <div className="crm-card__body">
            <p className="crm-muted mb-(--space-sm) text-xs leading-relaxed">
              Se usa solo si la API del BCV no responde. Conviene mantenerlo al
              día: es lo único que evita que el panel se quede sin poder
              facturar cuando el servicio se cae.
            </p>
            <form action={setRateAction}>
              <label htmlFor="rate" className="crm-label">
                Bolívares por dólar
              </label>
              <input
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
                className="crm-field max-w-48"
              />
              {settings.updatedAt ? (
                <p className="crm-muted mt-(--space-2xs) text-xs">
                  Última vez: {DATE.format(new Date(settings.updatedAt))}
                </p>
              ) : null}
              <button
                type="submit"
                className="crm-btn crm-btn--primary mt-(--space-sm)"
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
