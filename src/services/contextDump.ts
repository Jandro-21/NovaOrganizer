import { useAlarmsStore } from '../stores/alarmStore';
import { useBoardStore } from '../stores/boardStore';
import { useTasksStore } from '../stores/taskStore';
import { buildToolsInstruction } from './toolService';

export function formatDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatTime(d: Date): string {
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

// Genera un volcado de texto con el estado global de la app
// (To-Do's, Notas del corcho y Alarmas) para inyectar en el system prompt.
// Así la IA responde con precisión a preguntas como "¿Qué tareas tengo hoy?"
export function buildGlobalContextDump(sysdate: Date = new Date()): string {
  const tasks = useTasksStore.getState().tasks;
  const notes = useBoardStore.getState().notes;
  const alarms = useAlarmsStore.getState().alarms;
  const categories = useTasksStore.getState().categories;
  const subcategories = useTasksStore.getState().subcategories;

  const lines: string[] = [];

  if (categories.length === 0) {
    lines.push('CATEGORIES: none defined.');
  } else {
    lines.push(`CATEGORIES (${categories.length}):`);
    categories.forEach((c) => {
      const subs = subcategories
        .filter((s) => s.categoryId === c.id)
        .map((s) => s.name)
        .join(', ');
      lines.push(`  "${c.name}"${subs ? ` — subcategories: ${subs}` : ''}`);
    });
  }

  const openTasks = tasks.filter((t) => !t.completed);
  const doneCount = tasks.length - openTasks.length;
  if (openTasks.length === 0) {
    lines.push('TASKS: none pending. (completed tasks: ' + doneCount + ')');
  } else {
    lines.push(`TASKS (${openTasks.length} pending, ${doneCount} completed):`);
    openTasks.forEach((t, i) => {
      const when = t.dueAt
        ? ` due ${formatDate(new Date(t.dueAt))} ${formatTime(new Date(t.dueAt))}`
        : ' (no due date)';
      const detail = t.notes ? ` — ${t.notes}` : '';
      const catName = t.categoryId
        ? categories.find((c) => c.id === t.categoryId)?.name
        : undefined;
      const subName = t.subcategoryId
        ? subcategories.find((s) => s.id === t.subcategoryId)?.name
        : undefined;
      const group =
        catName || subName
          ? ` [${catName ?? '?'}${subName ? ` / ${subName}` : ''}]`
          : '';
      lines.push(`  ${i + 1}. "${t.title}"${when}${detail}${group}`);
    });
  }

  if (notes.length === 0) {
    lines.push('BOARD NOTES: none.');
  } else {
    lines.push(`BOARD NOTES (${notes.length}):`);
    notes.forEach((n, i) => {
      lines.push(`  ${i + 1}. "${n.text}"`);
    });
  }

  if (alarms.length === 0) {
    lines.push('ALARMS: none scheduled.');
  } else {
    lines.push(`ALARMS (${alarms.length}):`);
    alarms.forEach((a, i) => {
      const date = new Date(a.date);
      lines.push(`  ${i + 1}. "${a.message}" at ${formatDate(date)} ${formatTime(date)}`);
    });
  }

  lines.push('Today is ' + formatDate(sysdate) + ' (device local time).');
  return lines.join('\n');
}

// System prompt del asistente con acceso al estado global de la app
// y las instrucciones de creación directa (tool calling).
export function buildSystemPrompt(): string {
  return [
    'You are Nova, the built-in AI assistant of a personal productivity app.',
    'You can answer questions about the user\'s own data using the CURRENT APP STATE below.',
    'Answer in the same language the user writes in, concisely and accurately.',
    'If the requested information is not in the app state, say so clearly.',
    '----- CURRENT APP STATE -----',
    buildGlobalContextDump(),
    '----- TOOL CALLING -----',
    buildToolsInstruction(),
  ].join('\n');
}