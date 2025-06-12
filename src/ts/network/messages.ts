export interface PlayerStateUpdate {
    id: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
}

export interface WorldSync {
    sunElevation?: number;
    sunRotation?: number;
    despawnPlayers?: string[];
}
