import { useAlarmsStore } from '../stores/alarmStore';
import { useBoardStore } from '../stores/boardStore';
import { useTasksStore } from '../stores/taskStore';
import { BOARD_PALETTE } from '../theme/colors';
import { scheduleAlarm } from './notificationService';

// ---------------------------------------------------------------
// Tool Calling / Context Actions para el Chat.
// La IA indica una acción de creación con una línea "@nova_tool {json}".
// Este servicio la extrae de la respuesta y la ejecuta contra los
// stores globales (Zustand) creando el elemento en la BD local.
// ---------------------------------------------------------------

const TOOL_PREFIX = '@nova_tool';

export type RawToolCall = { type?: string } & Record<string, unknown>;
export interface ToolExecutionResult {
  ok: boolean;
  message: string;
}

const VALID_NOTE_COLORS = new Set(BOARD_PALETTE);

function parseDate(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const trimmed = value.trim();
  // Fecha ISO completa (con hora).
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return undefined;
  // Sin hora: "2026-08-14" se interpreta en hora local a las 09:00.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, day] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, day, 9, 0, 0).getTime();
  }
  return d.getTime();
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveCategory(name?: unknown): { id: string; name: string } | null {
  const trimmed = str(name);
  if (!trimmed) return null;
  const store = useTasksStore.getState();
  const existing = store.categories.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return { id: existing.id, name: existing.name };
  const created = store.addCategory({ name: trimmed });
  return { id: created.id, name: created.name };
}

function resolveSubcategory(categoryId: string | undefined, name?: unknown): { id: string; name: string } | null {
  const trimmed = str(name);
  if (!trimmed || !categoryId) return null;
  const store = useTasksStore.getState();
  const existing = store.subcategories.find(
    (s) => s.categoryId === categoryId && s.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return { id: existing.id, name: existing.name };
  const created = store.addSubcategory({ categoryId, name: trimmed });
  return { id: created.id, name: created.name };
}

function createTask(raw: RawToolCall): ToolExecutionResult {
  const title = str(raw.title);
  if (!title) return { ok: false, message: 'Task creation requires a title.' };

  const category = resolveCategory(raw.category);
  const subcategory = resolveSubcategory(category?.id, raw.subcategory);

  useTasksStore.getState().addTask({
    title,
    notes: str(raw.notes) ?? '',
    dueAt: parseDate(raw.dueAt),
    categoryId: category?.id,
    subcategoryId: subcategory?.id,
  });

  const parts = [title];
  if (category) parts.push(`category "${category.name}"`);
  if (subcategory) parts.push(`subcategory "${subcategory.name}"`);
  if (raw.dueAt !== null && raw.dueAt !== undefined) {
    const date = parseDate(raw.dueAt);
    if (date) parts.push(`due ${new Date(date).toLocaleDateString()}`);
  }
  return { ok: true, message: `Task created: ${parts.join(' · ')}` };
}

function createNote(raw: RawToolCall): ToolExecutionResult {
  const text = str(raw.text);
  if (!text) return { ok: false, message: 'Note creation requires text.' };

  let color = str(raw.color);
  if (!color || !color.startsWith('#') || !VALID_NOTE_COLORS.has(color.toUpperCase())) {
    color = BOARD_PALETTE[0];
  }

  useBoardStore.getState().addNote({ x: 0, y: 0, text, color, size: 'medium' });
  return { ok: true, message: `Note created on the board: "${text}"` };
}

function createAlarm(raw: RawToolCall): ToolExecutionResult {
  const message = str(raw.message);
  const date = parseDate(raw.date);
  if (!message) return { ok: false, message: 'Alarm creation requires a message.' };
  if (!date) return { ok: false, message: 'Alarm creation requires a valid date.' };
  if (date <= Date.now()) {
    return { ok: false, message: 'The alarm date must be in the future.' };
  }

  // Registra la alarma y, como mejor esfuerzo, programa la notificación
  // en segundo plano (si el permiso está concedido) actualizando su id.
  const alarm = useAlarmsStore.getState().addAlarm({ message, date });
  scheduleAlarm({ message, date: new Date(date) }).then((id) => {
    if (id) useAlarmsStore.getState().updateAlarm(alarm.id, { notificationId: id });
  });

  return {
    ok: true,
    message: `Alarm created: "${message}" on ${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  };
}

export function executeToolCall(raw: RawToolCall): ToolExecutionResult {
  switch (raw.type) {
    case 'task':
      return createTask(raw);
    case 'note':
      return createNote(raw);
    case 'alarm':
      return createAlarm(raw);
    default:
      return { ok: false, message: `Unknown tool call "${String(raw.type)}"` };
  }
}

// Busca la línea "@nova_tool {json}" en la respuesta del modelo. Devuelve
// el tool call parseado y el texto restante (respuesta conversacional).
export function extractToolCall(content: string): { call: RawToolCall; rest: string } | null {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].trim().startsWith(TOOL_PREFIX)) continue;
    const jsonPart = lines[i].slice(TOOL_PREFIX.length).trim();
    const open = jsonPart.indexOf('{');
    const close = jsonPart.lastIndexOf('}');
    if (open === -1 || close === -1 || close <= open) continue;
    try {
      const call = JSON.parse(jsonPart.slice(open, close + 1)) as RawToolCall;
      const rest = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n').trim();
      return { call, rest };
    } catch {
      // Línea mal formada: se ignora y se sigue buscando.
    }
  }
  return null;
}

// Instrucciones de creación directa que se inyectan en el system prompt.
export function buildToolsInstruction(): string {
  return [
    'TOOL CALLING (create items directly):',
    'If the user asks you to create a task, a board note (sticky idea) or an alarm, first output a single line with the prefix @nova_tool followed by a JSON object, and then reply conversationally confirming what was created. Never output the prefix otherwise.',
    '',
    'Task:  @nova_tool {"type":"task","title":"...","notes":null,"dueAt":"<ISO date, optional>","category":"<name or null>","subcategory":"<name or null>"}',
    'Note:  @nova_tool {"type":"note","text":"...","color":"#RRGGBB"}',
    'Alarm: @nova_tool {"type":"alarm","message":"...","date":"<ISO date and time>"}',
    '',
    'Rules:',
    '- Compute absolute ISO dates from today\'s date shown above ("tomorrow", "next monday", "in 2 hours"...). Include the time (default 09:00).',
    '- Use existing category/subcategory names when possible; otherwise provide the desired name and it will be created automatically.',
    '- Note colors must be one of: #FFD166 (yellow), #9BE8A8 (green), #8ECDFB (blue), #F8A5B8 (pink), #FFB77C (orange), #C9A8F5 (purple). Use null for the default.',
  ].join('\n');
}