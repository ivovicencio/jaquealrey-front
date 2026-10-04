/**
 * Servicio de Notificaciones Push vía Firebase (FCM).
 *
 * Este servicio permite enviar alertas al dueño/admin que llegan incluso
 * con el celular bloqueado gracias a la integración con Google Play Services.
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Intentamos cargar la llave de servicio de Firebase.
// El archivo debe estar en la raíz del backend como 'firebase-config.json'.
let firebaseApp;
try {
  const serviceAccount = require(path.join(__dirname, '..', 'firebase-config.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('[NotificationService] Firebase inicializado correctamente.');
} catch (e) {
  console.warn('[NotificationService] Firebase NO inicializado. Las notificaciones push no funcionarán hasta que se agregue firebase-config.json');
}

/**
 * Envía una notificación a un dispositivo específico.
 */
async function sendPushNotification(token, title, body, data = {}) {
  if (!firebaseApp) {
    console.warn('[NotificationService] Intento de enviar push sin Firebase configurado.');
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data, // Datos extra que la app puede leer en segundo plano
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[NotificationService] Notificación enviada exitosamente: ${response}`);
  } catch (error) {
    console.error('[NotificationService] Error enviando notificación push:', error);
  }
}

/**
 * Notifica a todos los administradores registrados.
 */
async function notifyAdmins(title, body, data = {}) {
  // En un sistema real, buscaríamos los tokens de los admins en la tabla 'UsuarioToken'
  // Aquí simulamos la búsqueda o enviamos a un token maestro si existe.
  // Para la implementación final, agregaremos una tabla 'DeviceTokens' a la DB.
  console.log(`[NotificationService] Notificando Admins: ${title} - ${body}`);

  // Lógica temporal: si no hay tokens en DB, solo logueamos.
  // Una vez implementada la tabla de tokens, aquí haremos el loop de envío.
}

module.exports = {
  sendPushNotification,
  notifyAdmins
};
