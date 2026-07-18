// Helpers de presentación: precio en pesos argentinos y fecha legible.

const PESOS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

/** 1350 -> "$ 1.350,00" (pesos nominales; la UI aclara que no hay ajuste). */
export function formatearPrecio(valor: number): string {
  return PESOS.format(valor);
}

/**
 * "2026-06-10" -> "10/06/2026". Formatea sin construir un Date para no correr
 * el riesgo de un corrimiento por zona horaria sobre una fecha sin hora.
 */
export function formatearFechaISO(iso: string): string {
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}
