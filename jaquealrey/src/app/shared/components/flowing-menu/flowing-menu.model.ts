export interface FlowingMenuItem {
  link: string;
  text: string;
  image: string;

  /**
   * Accion en vez de navegacion (hoy, cerrar sesion).
   *
   * El item sigue renderizando un <a> porque el menu es visual, pero el click no
   * navega: el contenedor (el navbar) ve `accion` y hace la operacion. Sin esto
   * habria que meter un <button> dentro de un menu que solo sabe mostrar items.
   */
  accion?: 'logout';
}