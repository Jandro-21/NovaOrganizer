import { useCallback, useEffect, useRef, useState } from 'react';
import { uid } from '../utils/id';

export interface StopwatchLap {
  id: string;
  duration: number;
  total: number;
}

// Hook de Cronómetro con control de vueltas (laps). Mantiene el estado
// interno en milisegundos y se refresca con un intervalo ligero mientras
// corre para no re-renderizar la pantalla en reposo.
export function useStopwatch() {
  const [running, setRunning] = useState(false);
  const [accumulated, setAccumulated] = useState(0);
  const [now, setNow] = useState(0);
  const [laps, setLaps] = useState<StopwatchLap[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const lastLapRef = useRef(0);

  const startedAt = startedAtRef.current;
  const elapsed = running && startedAt !== null ? accumulated + (now - startedAt) : accumulated;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (startedAtRef.current !== null) return;
    startedAtRef.current = Date.now();
    setNow(Date.now());
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (startedAtRef.current === null) return;
    setAccumulated((acc) => acc + (Date.now() - startedAtRef.current!));
    startedAtRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    setRunning(false);
    setAccumulated(0);
    setNow(0);
    setLaps([]);
    lastLapRef.current = 0;
  }, []);

  const lap = useCallback(() => {
    const total = elapsed;
    const duration = total - lastLapRef.current;
    lastLapRef.current = total;
    setLaps((ls) => [...ls, { id: uid(), duration, total }]);
  }, [elapsed]);

  return { elapsed, running, laps, start, pause, reset, lap };
}
