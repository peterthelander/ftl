import type * as THREE from 'three';

export type NavigationTarget = {
  name: string;
  object: THREE.Object3D;
  radiusKm: number;
};

export type SystemPlanet = {
  name: string;
  radiusKm: number;
  orbitKm: number;
  phase: number;
  source: 'catalog' | 'generated';
  radiusEstimated: boolean;
  orbitEstimated: boolean;
  periodDays: number | null;
};
export type SystemDefinition = {
  name: string;
  source: 'catalog' | 'generated' | 'solar';
  archiveHost?: string;
  planets: SystemPlanet[];
  outerRadiusKm: number;
};
