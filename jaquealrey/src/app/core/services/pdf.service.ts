import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

// jspdf no trae el motor de tablas: es un plugin aparte.
//
// Se usa la forma funcional autoTable(doc, opciones) y no doc.autoTable(...).
// Las dos hacen lo mismo en runtime, pero los tipos del plugin no augmented el
// jsPDFDocument (lo tipan como `any`), asi que la forma de metodo no compila en
// modo estricto. La funcional viene bien tipada y no necesita ningun truco de
// tipos.
function tabla(doc: jsPDF, opciones: UserOptions): number {
  autoTable(doc, opciones);
  // Devuelve la Y donde termino la tabla, que sirve para seguir escribiendo
  // (totales, etc.) sin adivinar el alto que ocupo.
  return (doc as any).lastAutoTable?.finalY ?? opciones.startY ?? 40;
}

// Genera los PDF del panel del admin.
//
// Todo se arma en el cliente: el backend devuelve los datos y el navegador los
// dibuja. Para un hotel de este tamaño es la opcion correcta, porque evita
// sumar un servicio de render en el servidor (que para pdfkit hay que instalar,
// actualizar y monitorear) y los archivos salen sin salir de la maquina.
//
// El PDF no es un comprobante fiscal. Es un resumen interno para el hotel.
@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly MARGEN = 14;

  // Cambiar a 'paisaje' el PDF cuando la tabla tenga muchas columnas, porque en
  // vertical la tabla de reservas queda ilegible.
  private nuevo(orientacion: 'portada' | 'paisaje' = 'portada'): jsPDF {
    const doc = new jsPDF({
      orientation: orientacion === 'paisaje' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    return doc;
  }

  private encabezado(doc: jsPDF, titulo: string, subtitulo: string): number {
    const ancho = doc.internal.pageSize.getWidth();

    doc.setFillColor(41, 37, 36);
    doc.rect(0, 0, ancho, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HOTEL JAQUE AL REY', this.MARGEN, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(titulo, this.MARGEN, 15.5);

    doc.setTextColor(41, 37, 36);
    doc.setFontSize(10);
    let y = 32;

    if (subtitulo) {
      doc.setFontSize(9);
      doc.setTextColor(115, 115, 115);
      doc.text(subtitulo, this.MARGEN, y);
      y += 6;
    }

    return y;
  }

  private pie(doc: jsPDF): void {
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const paginas = doc.getNumberOfPages();

    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Generado el ${new Date().toLocaleString('es-AR')} - Pagina ${doc.getCurrentPageInfo().pageNumber} de ${paginas}`,
      this.MARGEN,
      alto - 8
    );
    doc.text('Documento interno, no es comprobante fiscal', ancho - this.MARGEN, alto - 8, {
      align: 'right',
    });
  }

  private dinero(v: number | string): string {
    return '$' + Number(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  }

  // ---------------------------------------------------------------
  // Listado de reservas
  // ---------------------------------------------------------------
  exportarReservas(
    reservas: any[],
    filtros: { estado?: string; desde?: string; hasta?: string } = {}
  ): void {
    const doc = this.nuevo('paisaje');

    const partes: string[] = [];
    if (filtros.estado) partes.push(`Estado: ${filtros.estado}`);
    if (filtros.desde || filtros.hasta) {
      partes.push(`Fechas: ${filtros.desde || 'inicio'} a ${filtros.hasta || 'hoy'}`);
    }
    let y = this.encabezado(doc, 'Listado de reservas', partes.join(' - '));

    const columnas = [
      { titulo: 'Codigo', ancho: 24, campo: 'codigo' },
      { titulo: 'Cliente', ancho: 46, campo: 'cliente' },
      { titulo: 'Hab.', ancho: 14, campo: 'hab' },
      { titulo: 'Entrada', ancho: 22, campo: 'entrada' },
      { titulo: 'Salida', ancho: 22, campo: 'salida' },
      { titulo: 'Huesp.', ancho: 14, campo: 'huespedes' },
      { titulo: 'Total', ancho: 26, campo: 'total', align: 'right' as const },
      { titulo: 'Pagado', ancho: 24, campo: 'pagado', align: 'right' as const },
      { titulo: 'Saldo', ancho: 24, campo: 'saldo', align: 'right' as const },
      { titulo: 'Estado', ancho: 24, campo: 'estado' },
    ];

    const filas = reservas.map((r) => [
      r.codigo ?? '',
      `${r.cliente_nombre ?? ''} ${r.cliente_apellido ?? ''}`.trim(),
      r.habitacion_numero ?? '',
      r.fecha_entrada ?? '',
      r.fecha_salida ?? '',
      r.huespedes ?? '',
      this.dinero(r.precio_total),
      this.dinero(r.pagado),
      this.dinero(r.saldo),
      r.estado ?? '',
    ]);

    const totalFilas = filas.length;
    const facturado = reservas.reduce((a, r) => a + Number(r.precio_total || 0), 0);
    const cobrado = reservas.reduce((a, r) => a + Number(r.pagado || 0), 0);

    const finTabla = tabla(doc, {
      head: [columnas.map((c) => c.titulo)],
      body: filas,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      headStyles: { fillColor: [68, 68, 68], fontSize: 7.5 },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      columnStyles: columnas.reduce(
        (acc, c, i) => {
          acc[i] = { cellWidth: c.ancho, halign: c.align ?? 'left' };
          return acc;
        },
        {} as Record<number, any>
      ),
      margin: { left: this.MARGEN, right: this.MARGEN },
    });

    y = finTabla + 6;

    // Si la tabla se comio la pagina, salto antes de escribir los totales.
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(41, 37, 36);
    doc.text(`Reservas listadas: ${totalFilas}`, this.MARGEN, y);
    doc.text(`Facturado: ${this.dinero(facturado)}`, 120, y);
    doc.text(`Cobrado: ${this.dinero(cobrado)}`, 175, y);
    doc.text(`Saldo: ${this.dinero(facturado - cobrado)}`, 225, y);

    this.pie(doc);
    doc.save(`reservas-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ---------------------------------------------------------------
  // Reporte de ingresos
  // ---------------------------------------------------------------
  exportarIngresos(data: any): void {
    const doc = this.nuevo('portada');
    let y = this.encabezado(doc, 'Reporte de ingresos', 'Facturado por mes de estadia vs cobrado por mes de pago');

    // Los tres numeros que resumen el estado de la caja.
    const tarjetas = [
      { etiqueta: 'Facturado total', valor: this.dinero(data.facturado_total) },
      { etiqueta: 'Cobrado total', valor: this.dinero(data.cobrado_total) },
      { etiqueta: 'A cobrar', valor: this.dinero(data.a_cobrar_total) },
      { etiqueta: 'Pendiente de confirmar', valor: this.dinero(data.pendiente_confirmar) },
    ];

    const ancho = doc.internal.pageSize.getWidth();
    const anchoTarjeta = (ancho - this.MARGEN * 2 - 6) / 4;

    tarjetas.forEach((t, i) => {
      const x = this.MARGEN + i * (anchoTarjeta + 2);
      doc.setFillColor(245, 245, 245);
      doc.rect(x, y, anchoTarjeta, 18, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text(t.etiqueta, x + 3, y + 6);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 37, 36);
      doc.text(t.valor, x + 3, y + 13);
      doc.setFont('helvetica', 'normal');
    });

    y += 26;

    // Facturado mes a mes.
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 37, 36);
    doc.text('Facturado por mes de estadia', this.MARGEN, y);
    y += 3;

    y = tabla(doc, {
      head: [['Mes', 'Reservas', 'Total']],
      body: (data.por_mes_facturado ?? []).map((m: any) => [
        m.mes,
        String(m.reservas ?? 0),
        this.dinero(m.total),
      ]),
      startY: y,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [68, 68, 68] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: this.MARGEN, right: this.MARGEN },
    }) + 8;

    // Cobrado mes a mes.
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Cobrado por mes', this.MARGEN, y);
    y += 3;

    y = tabla(doc, {
      head: [['Mes', 'Cantidad de pagos', 'Total']],
      body: (data.por_mes_cobrado ?? []).map((m: any) => [
        m.mes,
        String(m.cantidad ?? 0),
        this.dinero(m.total),
      ]),
      startY: y,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [68, 68, 68] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 45, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
      },
      margin: { left: this.MARGEN, right: this.MARGEN },
    }) + 8;

    // Las facturas con saldo son lo mas accionable del reporte.
    const saldo = data.saldo_por_reserva ?? [];
    if (saldo.length) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Reservas con saldo pendiente', this.MARGEN, y);
      y += 3;

      tabla(doc, {
        head: [['Codigo', 'Entrada', 'Salida', 'Total', 'Pagado', 'Saldo']],
        body: saldo.map((r: any) => [
          r.codigo,
          r.fecha_entrada,
          r.fecha_salida,
          this.dinero(r.precio_total),
          this.dinero(r.pagado),
          this.dinero(r.saldo),
        ]),
        startY: y,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.8 },
        headStyles: { fillColor: [150, 60, 60] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 24 },
          2: { cellWidth: 24 },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 28, halign: 'right' },
        },
        margin: { left: this.MARGEN, right: this.MARGEN },
      });
    }

    this.pie(doc);
    doc.save(`ingresos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ---------------------------------------------------------------
  // Listado de pagos
  // ---------------------------------------------------------------
  exportarPagos(pagos: any[]): void {
    const doc = this.nuevo('paisaje');
    let y = this.encabezado(doc, 'Historial de pagos', `${pagos.length} pagos`);

    tabla(doc, {
      head: [['Fecha', 'Reserva', 'Cliente', 'Metodo', 'Referencia', 'Monto', 'Estado']],
      body: pagos.map((p) => [
        p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-AR') : '-',
        p.reserva_codigo ?? '',
        `${p.cliente_nombre ?? ''} ${p.cliente_apellido ?? ''}`.trim(),
        p.metodo ?? '',
        p.referencia ?? '-',
        this.dinero(p.monto),
        p.estado ?? '',
      ]),
      startY: y,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.8 },
      headStyles: { fillColor: [68, 68, 68] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 28 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 40 },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 26 },
      },
      margin: { left: this.MARGEN, right: this.MARGEN },
    });

    const total = pagos
      .filter((p) => p.estado === 'Confirmado')
      .reduce((a, p) => a + Number(p.monto || 0), 0);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Total confirmado: ${this.dinero(total)}`, this.MARGEN, y);

    this.pie(doc);
    doc.save(`pagos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ---------------------------------------------------------------
  // Comprobante de una reserva puntual
  // ---------------------------------------------------------------
  exportarComprobanteReserva(reserva: any, pagos: any[]): void {
    const doc = this.nuevo('portada');
    let y = this.encabezado(doc, `Reserva ${reserva.codigo}`, 'Detalle de la estadia');

    const datos: [string, string][] = [
      ['Cliente', `${reserva.cliente_nombre ?? ''} ${reserva.cliente_apellido ?? ''}`.trim()],
      ['Email', reserva.cliente_email ?? '-'],
      ['Telefono', reserva.cliente_telefono ?? '-'],
      ['Habitacion', `${reserva.habitacion_numero ?? ''} - ${reserva.habitacion_nombre ?? ''}`],
      ['Entrada', reserva.fecha_entrada ?? '-'],
      ['Salida', reserva.fecha_salida ?? '-'],
      ['Huespedes', String(reserva.huespedes ?? '-')],
      ['Estado', reserva.estado ?? '-'],
      ['Total', this.dinero(reserva.precio_total)],
    ];

    datos.forEach(([k, v]) => {
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(k, this.MARGEN, y);
      doc.setFontSize(10);
      doc.setTextColor(41, 37, 36);
      doc.text(v, this.MARGEN + 45, y);
      y += 6;
    });

    y += 4;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Pagos registrados', this.MARGEN, y);
    y += 3;

    if (!pagos.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text('Todavia no hay pagos registrados para esta reserva.', this.MARGEN, y);
    } else {
      y = tabla(doc, {
        head: [['Fecha', 'Metodo', 'Referencia', 'Monto', 'Estado']],
        body: pagos.map((p) => [
          p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-AR') : '-',
          p.metodo ?? '',
          p.referencia ?? '-',
          this.dinero(p.monto),
          p.estado ?? '',
        ]),
        startY: y,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2 },
        headStyles: { fillColor: [68, 68, 68] },
        margin: { left: this.MARGEN, right: this.MARGEN },
      }) + 6;
    }

    const pagado = pagos
      .filter((p) => p.estado === 'Confirmado')
      .reduce((a, p) => a + Number(p.monto || 0), 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(41, 37, 36);
    doc.text(`Pagado: ${this.dinero(pagado)}`, this.MARGEN, y);
    doc.text(`Saldo: ${this.dinero(Number(reserva.precio_total || 0) - pagado)}`, 120, y);

    this.pie(doc);
    doc.save(`reserva-${reserva.codigo}.pdf`);
  }
}