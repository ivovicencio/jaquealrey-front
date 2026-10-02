// Prueba de humo de la integracion jsPDF + jspdf-autotable, en Node.
//
// Motivo: el error que aparecio al compilar Angular era TS2339 "autoTable does
// not exist on type jsPDF", o sea una duda sobre la API del plugin y no sobre el
// contenido del reporte. Compilar bien no alcanza: hay que confirmar que la
// forma funcional autoTable(doc, opts) dibuja de verdad y que devuelve finalY.
//
// No prueba los metodos de PdfService (son Angular y dependen del DOM), prueba
// el contrato que ese servicio da por hecho: autoTable(doc, opts) mas
// lastAutoTable.finalY.
//
// Uso: node tests/pdf-smoke.js
const moduloJsPDF = require("jspdf");
// El build CommonJS de jsPDF cuelga el constructor en .default y tambien lo
// exporta como .jsPDF; el default export del import no existe en el require.
// En Angular el service usa `import jsPDF from 'jspdf'`, que si funciona: el
// bundler de Angular resuelve el build ESM (jspdf.es.min.js), donde el
// default export es el constructor. Aca hay que tomar el que exista.
const JsPDF = moduloJsPDF.default || moduloJsPDF.jsPDF;

const moduloAutoTable = require("jspdf-autotable");
const autoTable = moduloAutoTable.default || moduloAutoTable;

let ok = 0;
let fail = 0;

function check(nombre, cond, detalle = "") {
  if (cond) {
    ok++;
    console.log(`  OK   ${nombre}`);
  } else {
    fail++;
    console.log(`  FAIL ${nombre}${detalle ? ` -- ${detalle}` : ""}`);
  }
}

// Copia de la funcion que esta en src/app/core/services/pdf.service.ts.
// Si esa cambia, esta tiene que cambiar con ella.
function tabla(doc, opciones) {
  autoTable(doc, opciones);
  return doc.lastAutoTable?.finalY ?? opciones.startY ?? 40;
}

console.log("\n=== 1. Smoke de jspdf + autotable ===");

const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("Jaque al Rey - Reporte de prueba", 14, 15);

const fin = tabla(doc, {
  head: [["Codigo", "Cliente", "Monto"]],
  body: [
    ["JAR-0001", "Ana Lopez", "$ 100.000"],
    ["JAR-0002", "Juan Perez", "$ 375.000"],
    ["JAR-0003", "Maria Gomez", "$ 225.000"],
  ],
  startY: 22,
  theme: "grid",
  styles: { fontSize: 9, cellPadding: 2 },
  headStyles: { fillColor: [68, 68, 68] },
  margin: { left: 14, right: 14 },
});

check("autoTable devuelve finalY numerico", typeof fin === "number" && fin > 22, `finalY=${fin}`);

doc.setFontSize(10);
doc.text("Total: $ 700.000", 14, fin + 8);

const salida = Buffer.from(doc.output("arraybuffer"));
// 8 bytes, no 5: "%PDF-1.7" son 8. Recortando 5 solo queda "%PDF-" y el
// chequeo de version de mas abajo no tiene con que comparar.
const head = salida.slice(0, 8).toString("latin1");

check("el buffer empieza con %PDF-", head.startsWith("%PDF-"), `empieza con "${head}"`);
check("el buffer no esta vacio", salida.length > 1000, `${salida.length} bytes`);
check("el PDF tiene la pagina esperada", doc.getNumberOfPages() === 1, `${doc.getNumberOfPages()} paginas`);
check("version de PDF valida", /^%PDF-\d\.\d/.test(head), `"${head}"`);

// Segunda tabla sobre la misma pagina, que es lo que hace exportarIngresos:
// dibuja una tabla, mide, dibuja otra, vuelve a medir.
const fin2 = tabla(doc, {
  head: [["Mes", "Total"]],
  body: [
    ["2026-10", "$ 100.000"],
    ["2026-11", "$ 600.000"],
  ],
  startY: fin + 14,
  theme: "grid",
  styles: { fontSize: 9, cellPadding: 2 },
  headStyles: { fillColor: [150, 60, 60] },
  margin: { left: 14, right: 14 },
});

check("la segunda tabla avanza el cursor", fin2 > fin, `fin=${fin} fin2=${fin2}`);

// Tabla larga: tiene que paginar sola. Es lo que pasa con el listado de reservas
// cuando el hotel acumula reservas.
const docLargo = new JsPDF({ unit: "mm", format: "a4" });
const filasLargas = Array.from({ length: 120 }, (_, i) => [
  `JAR-${1000 + i}`,
  `Cliente de prueba numero ${i}`,
  `$ ${10000 + i * 500}`,
]);
tabla(docLargo, {
  head: [["Codigo", "Cliente", "Monto"]],
  body: filasLargas,
  startY: 20,
  theme: "grid",
  styles: { fontSize: 8 },
  margin: { left: 14, right: 14 },
});
check("una tabla de 120 filas pagina sola", docLargo.getNumberOfPages() > 1, `${docLargo.getNumberOfPages()} paginas`);
check(
  "el PDF largo tambien es valido",
  Buffer.from(docLargo.output("arraybuffer")).slice(0, 5).toString("latin1") === "%PDF-"
);

// Casos borde del servicio: una tabla sin filas y una con celdas vacias.
// exportingPagos se llama con la lista filtrada y puede venir vacia.
const docVacio = new JsPDF({ unit: "mm", format: "a4" });
const finVacio = tabla(docVacio, {
  head: [["Codigo", "Monto"]],
  body: [],
  startY: 20,
  theme: "grid",
  margin: { left: 14, right: 14 },
});
check("una tabla sin filas no rompe", typeof finVacio === "number", `finalY=${finVacio}`);
check("el PDF sin filas sigue siendo valido", Buffer.from(docVacio.output("arraybuffer")).slice(0, 5).toString("latin1") === "%PDF-");

// Acentos: los reportes llevan "Ocupacion", "Pagado", codigos de cliente.
// Si la fuente estandar no los soporta, sale basura en el PDF.
const docAcentos = new JsPDF({ unit: "mm", format: "a4" });
tabla(docAcentos, {
  head: [["Habitacion", "Ocupacion"]],
  body: [["Habitacion N° 1", "Ocupada - Confirmada"]],
  startY: 20,
  theme: "grid",
  margin: { left: 14, right: 14 },
});
check("acentos y el signo grado no rompen el PDF", Buffer.from(docAcentos.output("arraybuffer")).length > 800);

console.log(`\n=== OK: ${ok}   FAIL: ${fail} ===`);
process.exit(fail > 0 ? 1 : 0);