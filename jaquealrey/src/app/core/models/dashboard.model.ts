// Facturado y cobrado van separados a proposito.
//
// Antes el dashboard traia un solo ingresos_mes_actual que sumaba precio_total por
// created_at. Eso mezclaba dos preguntas distintas: cuanto se facturo y cuanto
// entro de verdad a la caja. Con un solo numero el hotel no podia saber si lo que
// le falta cobrar era una reserva sin pagar o una reserva de otro mes.
export interface DashboardData {
  reservas_activas: number;
  reservas_proximas_7_dias: number;
  // Total de las reservas confirmadas cuya estadia termina este mes.
  facturado_mes_actual: number;
  // Dinero efectivamente recibido este mes (pagos confirmados por fecha de pago).
  cobrado_mes_actual: number;
  // facturado - cobrado. Es la plata que hay que perseguir.
  a_cobrar_mes: number;
  total_clientes: number;
  habitaciones_activas: number;
}