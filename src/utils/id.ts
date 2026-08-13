// Genera un identificador único, legible y compacto.
// Es la única fuente de IDs del proyecto (tareas, notas, mensajes, notificaciones).
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}