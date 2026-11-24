import type { AreaId } from '@/constants/areas';

/**
 * Metadados de localização para sensores que já existem no backend.
 * Este arquivo NÃO cadastra sensores nem cria cartões; a lista de dispositivos
 * exibida pelo aplicativo vem exclusivamente de GET /sensores.
 */
export const SENSOR_AREA_BY_REMOTE_ID: Partial<Record<number, AreaId>> = {
  2: 'WC_MASC',
};
