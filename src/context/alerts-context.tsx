import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AREAS, type AreaId } from '@/constants/areas';
import { useAuth } from '@/context/auth-context';
import { formatTime } from '@/utils/date';

const JAZZSECURITY_URL = (process.env.EXPO_PUBLIC_JAZZSECURITY_URL ?? 'https://jazz-security.vercel.app').trim().replace(/\/+$/, '');
const REFRESH_INTERVAL_MS = 10_000;
const REQUEST_TIMEOUT_MS = 8_000;
const HISTORY_LIMIT = 100;

export type SensorKind = 'smoke' | 'motion';
export type SensorStatus = 'normal' | 'alert' | 'offline' | 'stale';
export type TelemetryStatus = 'connecting' | 'online' | 'offline' | 'unconfigured';

export type Sensor = {
  id: string;
  kind: SensorKind;
  index: number;
  label: string;
  location: string;
  areaId: AreaId | null;
  status: SensorStatus;
  active: boolean;
  startedAt: string | null;
  endedAt: string | null;
  lastEventAt: string | null;
  lastSeenAt?: string | null;
  value?: number | null;
};

export type SensorAlert = {
  active: boolean;
  startedAt: string | null;
  endedAt: string | null;
};

export type SensorRecord = {
  id: string;
  kind: SensorKind;
  sensorId: string;
  location: string;
  startedAt: string;
  eventType?: string;
  description?: string;
};

type ApiSensor = {
  id?: number | string | null;
  codigo?: string | null;
  nome?: string | null;
  tipo: string;
  localizacao_id?: string | null;
  localizacao?: string | null;
  estado_ativo?: boolean | null;
  valor?: number | null;
  movimento?: boolean | null;
  data_hora?: string | null;
  status?: string | null;
};

type ApiEvent = {
  id?: number | string | null;
  sensor_id?: number | string | null;
  sensor_codigo?: string | null;
  codigo_sensor?: string | null;
  codigo?: string | null;
  localizacao_id?: string | null;
  localizacao?: string | null;
  tipo_evento: string;
  descricao?: string | null;
  data_hora: string;
};

type AlertsContextType = {
  sensors: Sensor[];
  smokeSensors: Sensor[];
  motionSensors: Sensor[];
  smoke: SensorAlert;
  motion: SensorAlert;
  history: SensorRecord[];
  telemetryStatus: TelemetryStatus;
  telemetryError: string | null;
  lastSyncAt: string | null;
  refreshTelemetry: () => Promise<void>;
  /** Mantidos para compatibilidade com componentes antigos; a telemetria real é somente leitura. */
  activateSensor: (sensorId: string) => void;
  deactivateSensor: (sensorId: string) => void;
  registerSensor: (sensorId: string, areaId: AreaId) => void;
  unregisterSensor: (sensorId: string) => void;
  triggerRandom: (kind: SensorKind) => void;
  startAlert: (kind: SensorKind) => void;
  endAlert: (kind: SensorKind) => void;
  removeRecord: (id: string) => void;
  clearHistory: () => void;
};

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

class TelemetryRequestError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'TelemetryRequestError';
  }
}

function parseTimestamp(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function displayTimestamp(value: unknown): string | null {
  const date = parseTimestamp(value);
  return date ? formatTime(date) : null;
}

async function fetchJson<T>(path: string, token: string): Promise<T> {
  if (!JAZZSECURITY_URL) {
    throw new TelemetryRequestError('Defina EXPO_PUBLIC_JAZZSECURITY_URL para conectar ao JazzSecurity.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(JAZZSECURITY_URL + path, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) throw new TelemetryRequestError('Sua sessão expirou. Entre novamente.', 401);
      if (response.status === 429) throw new TelemetryRequestError('Muitas consultas ao JazzSecurity. Aguarde um instante.', 429);
      throw new TelemetryRequestError('JazzSecurity retornou HTTP ' + response.status + ' em ' + path + '.', response.status);
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof TelemetryRequestError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TelemetryRequestError('A consulta ao JazzSecurity excedeu 8 segundos.');
    }
    throw new TelemetryRequestError('Não foi possível conectar ao JazzSecurity. Verifique a rede e a URL da API.');
  } finally {
    clearTimeout(timeoutId);
  }
}

function kindForSensorType(type: string): SensorKind | null {
  const normalized = type.trim().toUpperCase().replace(/[\s_]/g, '');
  if (normalized === 'MQ-2' || normalized === 'MQ2' || normalized === 'FUMACA') return 'smoke';
  if (normalized === 'PIR' || normalized === 'MOVIMENTO') return 'motion';
  return null;
}

function sensorUiId(record: ApiSensor, index: number): string {
  const identifier = record.codigo?.trim() || (record.id !== null && record.id !== undefined ? String(record.id) : '');
  return identifier || 'SENSOR_' + String(index + 1).padStart(2, '0');
}

function normalizeLocation(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const LOCATION_ALIASES: Record<string, AreaId> = {
  'wc masculino': 'WC_MASC',
  'banheiro masculino': 'WC_MASC',
  'wc masc': 'WC_MASC',
  'wc feminino': 'WC_FEM',
  'banheiro feminino': 'WC_FEM',
  'wc fem': 'WC_FEM',
};

function resolveAreaId(locationId?: string | null, locationName?: string | null): AreaId | null {
  const normalizedId = locationId?.trim().toUpperCase();
  if (normalizedId && Object.prototype.hasOwnProperty.call(AREAS, normalizedId)) {
    return normalizedId as AreaId;
  }

  const normalizedName = locationName ? normalizeLocation(locationName) : '';
  if (!normalizedName) return null;

  const alias = LOCATION_ALIASES[normalizedName];
  if (alias) return alias;

  const matchingArea = (Object.keys(AREAS) as AreaId[]).find((areaId) => {
    return normalizeLocation(AREAS[areaId].name.replace(/\n/g, ' ')) === normalizedName;
  });
  return matchingArea ?? null;
}

function locationForSensor(record: ApiSensor): { areaId: AreaId | null; location: string } {
  const areaId = resolveAreaId(record.localizacao_id, record.localizacao);
  const area = areaId ? AREAS[areaId] : null;
  return {
    areaId,
    location: record.localizacao?.trim() || (area ? area.name.replace(/\s*\n\s*/g, ' ').trim() : 'Não cadastrado'),
  };
}

function normalizeSensorsPayload(payload: unknown): ApiSensor[] {
  if (Array.isArray(payload)) return payload as ApiSensor[];

  if (payload && typeof payload === 'object' && 'sensores' in payload) {
    const sensors = (payload as { sensores?: unknown }).sensores;
    if (Array.isArray(sensors)) return sensors as ApiSensor[];
  }

  throw new TelemetryRequestError('O JazzSecurity retornou um formato inesperado em /sensores. Esperado: uma lista ou um objeto com a propriedade "sensores".');
}

function normalizeEventsPayload(payload: unknown): ApiEvent[] {
  if (Array.isArray(payload)) return payload as ApiEvent[];

  if (payload && typeof payload === 'object' && 'eventos' in payload) {
    const events = (payload as { eventos?: unknown }).eventos;
    if (Array.isArray(events)) return events as ApiEvent[];
  }

  throw new TelemetryRequestError('O JazzSecurity retornou um formato inesperado em /eventos. Esperado: uma lista ou um objeto com a propriedade "eventos".');
}

function eventMatchesSensor(event: ApiEvent, sensor: ApiSensor): boolean {
  const eventIdentifiers = [event.sensor_codigo, event.codigo_sensor, event.codigo, event.sensor_id]
    .filter((value) => value !== null && value !== undefined)
    .map(String);
  const sensorIdentifiers = [sensor.codigo, sensor.id]
    .filter((value) => value !== null && value !== undefined)
    .map(String);

  return eventIdentifiers.some((eventId) => sensorIdentifiers.includes(eventId));
}

function mapSensors(records: ApiSensor[], events: ApiEvent[]): Sensor[] {
  const counters: Record<SensorKind, number> = { smoke: 0, motion: 0 };

  return records.flatMap((record, recordIndex) => {
    const kind = kindForSensorType(record.tipo);
    if (!kind) return [];

    counters[kind] += 1;
    const index = counters[kind];
    const id = sensorUiId(record, recordIndex);
    const locationInfo = locationForSensor(record);
    const matchingEvents = events
      .filter((event) => eventMatchesSensor(event, record))
      .sort((a, b) => Date.parse(b.data_hora) - Date.parse(a.data_hora));
    const lastEvent = matchingEvents[0];
    const relevantAlert = matchingEvents.find((event) => event.tipo_evento !== 'NORMALIZACAO');
    const active = record.estado_ativo === true || record.movimento === true;
    const lastEventAt = displayTimestamp(lastEvent?.data_hora);
    const serverStatus = record.status?.trim().toLowerCase();

    return [{
      id,
      kind,
      index,
      label: record.nome?.trim() || record.codigo?.trim() || record.tipo + ' ' + String(index).padStart(2, '0'),
      location: locationInfo.location,
      areaId: locationInfo.areaId,
      status: serverStatus === 'indisponivel' || serverStatus === 'offline'
        ? 'offline'
        : serverStatus === 'desatualizado' || serverStatus === 'stale'
          ? 'stale'
          : active
            ? 'alert'
            : 'normal',
      active,
      startedAt: active
        ? displayTimestamp(relevantAlert?.data_hora) ?? displayTimestamp(record.data_hora)
        : null,
      endedAt: !active && lastEvent?.tipo_evento === 'NORMALIZACAO' ? lastEventAt : null,
      lastEventAt,
      lastSeenAt: record.data_hora ?? null,
      value: typeof record.valor === 'number' ? record.valor : null,
    }];
  });
}

function mapHistory(events: ApiEvent[], sensorRecords: ApiSensor[]): SensorRecord[] {
  return [...events]
    .sort((a, b) => Date.parse(b.data_hora) - Date.parse(a.data_hora))
    .map((event, eventIndex) => {
      const remoteSensor = sensorRecords.find((sensor) => eventMatchesSensor(event, sensor));
      const kindFromSensor = remoteSensor ? kindForSensorType(remoteSensor.tipo) : null;
      const kind: SensorKind = kindFromSensor
        ?? (event.tipo_evento === 'FUMACA_GAS' ? 'smoke' : 'motion');
      const areaId = remoteSensor
        ? locationForSensor(remoteSensor).areaId
        : resolveAreaId(event.localizacao_id, event.localizacao);
      const area = areaId ? AREAS[areaId] : null;
      const location = remoteSensor
        ? locationForSensor(remoteSensor).location
        : event.localizacao?.trim() || (area ? area.name.replace(/\s*\n\s*/g, ' ').trim() : 'Não cadastrado');
      const eventSensorId = event.sensor_codigo || event.codigo_sensor || (event.sensor_id !== null && event.sensor_id !== undefined ? String(event.sensor_id) : 'EVENT_' + eventIndex);

      return {
        id: 'jazz-' + String(event.id ?? eventIndex),
        kind,
        sensorId: remoteSensor ? sensorUiId(remoteSensor, sensorRecords.indexOf(remoteSensor)) : eventSensorId,
        location,
        startedAt: displayTimestamp(event.data_hora) ?? '—',
        eventType: event.tipo_evento,
        description: event.descricao ?? undefined,
      };
    });
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [history, setHistory] = useState<SensorRecord[]>([]);
  const [telemetryStatus, setTelemetryStatus] = useState<TelemetryStatus>(
    JAZZSECURITY_URL ? 'connecting' : 'unconfigured',
  );
  const [telemetryError, setTelemetryError] = useState<string | null>(
    JAZZSECURITY_URL ? null : 'JazzSecurity não está configurado.',
  );
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);

  const refreshTelemetry = useCallback(async () => {
    if (!session) return;
    if (!JAZZSECURITY_URL) {
      setTelemetryStatus('unconfigured');
      setTelemetryError('Defina EXPO_PUBLIC_JAZZSECURITY_URL para consultar os sensores.');
      return;
    }

    setTelemetryStatus((current) => current === 'online' ? current : 'connecting');
    try {
      const [sensorPayload, eventPayload] = await Promise.all([
        fetchJson<unknown>('/sensores', session.token),
        fetchJson<unknown>('/eventos?limit=' + HISTORY_LIMIT, session.token),
      ]);
      const sensorRecords = normalizeSensorsPayload(sensorPayload);
      const eventRecords = normalizeEventsPayload(eventPayload);

      setSensors(mapSensors(sensorRecords, eventRecords));
      setHistory(mapHistory(eventRecords, sensorRecords));
      setLoadedToken(session.token);
      setTelemetryStatus('online');
      setTelemetryError(null);
      setLastSyncAt(new Date().toISOString());
    } catch (cause) {
      if (cause instanceof TelemetryRequestError && cause.status === 401) {
        setTelemetryStatus('offline');
        setTelemetryError('Sua sessão expirou. Entre novamente.');
        await signOut();
        return;
      }
      setTelemetryStatus('offline');
      setSensors((current) => current.map((sensor) => ({ ...sensor, status: 'offline' })));
      setTelemetryError(cause instanceof Error ? cause.message : 'Não foi possível carregar os sensores.');
    }
  }, [session, signOut]);

  useEffect(() => {
    if (!session) return;
    const initialFetch = setTimeout(() => { void refreshTelemetry(); }, 0);
    const intervalId = setInterval(() => { void refreshTelemetry(); }, REFRESH_INTERVAL_MS);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(intervalId);
    };
  }, [session, refreshTelemetry]);

  const activateSensor = useCallback((_sensorId: string) => {
    // Telemetria real: sensores só mudam de estado quando o ESP reporta ao JazzSecurity.
  }, []);
  const deactivateSensor = useCallback((_sensorId: string) => {
    // Telemetria real é somente leitura no app.
  }, []);
  const registerSensor = useCallback((_sensorId: string, _areaId: AreaId) => {
    // A localização é lida diretamente de localizacao_id/localizacao enviados pelo backend.
  }, []);
  const unregisterSensor = useCallback((_sensorId: string) => {
    // A associação física de área permanece definida em constants/sensor-registry.ts.
  }, []);
  const triggerRandom = useCallback((_kind: SensorKind) => {
    // Não simular dados quando a fonte de verdade é o JazzSecurity.
  }, []);
  const startAlert = useCallback((_kind: SensorKind) => {}, []);
  const endAlert = useCallback((_kind: SensorKind) => {}, []);
  const removeRecord = useCallback((_id: string) => {
    // Eventos armazenados no backend não podem ser apagados localmente.
  }, []);
  const clearHistory = useCallback(() => {
    // O histórico persistente pertence ao SQLite do JazzSecurity.
  }, []);

  const hasSessionData = Boolean(session && loadedToken === session.token);
  const visibleSensors = useMemo(() => hasSessionData ? sensors : [], [hasSessionData, sensors]);
  const visibleHistory = useMemo(() => hasSessionData ? history : [], [hasSessionData, history]);
  const visibleTelemetryStatus: TelemetryStatus = !JAZZSECURITY_URL
    ? 'unconfigured'
    : !session
      ? 'offline'
      : hasSessionData
        ? telemetryStatus
        : 'connecting';
  const visibleTelemetryError = !JAZZSECURITY_URL
    ? 'Defina EXPO_PUBLIC_JAZZSECURITY_URL para consultar os sensores.'
    : session
      ? telemetryError
      : null;
  const visibleLastSyncAt = hasSessionData ? lastSyncAt : null;

  const smokeSensors = useMemo(() => visibleSensors.filter((sensor) => sensor.kind === 'smoke'), [visibleSensors]);
  const motionSensors = useMemo(() => visibleSensors.filter((sensor) => sensor.kind === 'motion'), [visibleSensors]);

  const smoke: SensorAlert = useMemo(() => {
    const active = smokeSensors.some((sensor) => sensor.active);
    return {
      active,
      startedAt: smokeSensors.find((sensor) => sensor.active)?.startedAt ?? null,
      endedAt: !active ? smokeSensors.find((sensor) => sensor.endedAt)?.endedAt ?? null : null,
    };
  }, [smokeSensors]);

  const motion: SensorAlert = useMemo(() => {
    const active = motionSensors.some((sensor) => sensor.active);
    return {
      active,
      startedAt: motionSensors.find((sensor) => sensor.active)?.startedAt ?? null,
      endedAt: !active ? motionSensors.find((sensor) => sensor.endedAt)?.endedAt ?? null : null,
    };
  }, [motionSensors]);

  const value = useMemo<AlertsContextType>(() => ({
    sensors: visibleSensors,
    smokeSensors,
    motionSensors,
    smoke,
    motion,
    history: visibleHistory,
    telemetryStatus: visibleTelemetryStatus,
    telemetryError: visibleTelemetryError,
    lastSyncAt: visibleLastSyncAt,
    refreshTelemetry,
    activateSensor,
    deactivateSensor,
    registerSensor,
    unregisterSensor,
    triggerRandom,
    startAlert,
    endAlert,
    removeRecord,
    clearHistory,
  }), [
    visibleSensors, smokeSensors, motionSensors, smoke, motion, visibleHistory, visibleTelemetryStatus, visibleTelemetryError,
    visibleLastSyncAt, refreshTelemetry, activateSensor, deactivateSensor, registerSensor, unregisterSensor,
    triggerRandom, startAlert, endAlert, removeRecord, clearHistory,
  ]);

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts(): AlertsContextType {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used within an AlertsProvider');
  return ctx;
}
