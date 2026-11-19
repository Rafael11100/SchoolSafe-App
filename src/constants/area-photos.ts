import type { ImageProps } from 'expo-image';
import type { AreaId } from '@/constants/areas';

type AreaImageSource = NonNullable<ImageProps['source']>;

// Fotografias reais publicadas no Unsplash. Expo Image mantém cache local após o primeiro carregamento.
const HALLWAY = { uri: 'https://images.unsplash.com/photo-1762888568397-17827294d721?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1400' };
const CLASSROOM = { uri: 'https://images.unsplash.com/photo-1740635341299-3b8e3490f546?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=80&w=1200' };

export const AREA_PHOTOS: Partial<Record<AreaId, AreaImageSource>> = {
  CORREDOR: HALLWAY,
  SALA_01: CLASSROOM,
  MAKER: CLASSROOM,
};
