// Página de carga manual de una compra (paso 2). Server component: lee la lista
// de súpers de la base y se la pasa al formulario (client) para el desplegable.

import { getDb } from "@/lib/db";
import { listarSupers } from "@/lib/repo/supers";
import FormularioCompra from "./FormularioCompra";

export const dynamic = "force-dynamic";

export default function NuevaCompra() {
  const supers = listarSupers(getDb());

  return (
    <main>
      <h1>Registrar compra</h1>
      <p className="subtitulo">Cargá los productos y precios de un ticket a mano.</p>
      <FormularioCompra supers={supers} />
    </main>
  );
}
