export const environment = {
  production: false,
  // Relativa a proposito: la resuelve el proxy de ng serve (proxy.conf.json).
  // Asi el front no depende del CORS del backend ni de un puerto/origen fijo.
  apiUrl: '/api',
};
