import * as THREE from 'three';
import { World } from '../world/World';
import { Character } from '../characters/Character';
import { LoadingManager } from '../core/LoadingManager';
import { PlayerStateUpdate, WorldSync } from './messages';

/**
 * Simple WebSocket client used to synchronise remote characters and world state.
 */
export class NetworkClient {
    public updateOrder: number = 0;

    private world: World;
    private socket: WebSocket | undefined;
    private remoteCharacters: Map<string, Character> = new Map();
    private pendingPlayerUpdates: PlayerStateUpdate[] = [];
    private pendingWorldSync: WorldSync[] = [];
    private characterFactory: (id: string, onLoad: (c: Character) => void) => void;

    constructor(url: string, world: World,
                characterFactory?: (id: string, onLoad: (c: Character) => void) => void,
                socket?: WebSocket) {
        this.world = world;
        this.characterFactory = characterFactory || this.defaultCharacterFactory.bind(this);
        this.socket = socket || (typeof WebSocket !== 'undefined' ? new WebSocket(url) : undefined);
        if (this.socket) {
            this.socket.onmessage = (e) => this.onMessage(e);
        }
    }

    private defaultCharacterFactory(id: string, onLoad: (c: Character) => void): void {
        const manager = new LoadingManager(this.world);
        manager.loadGLTF('build/assets/boxman.glb', (gltf) => {
            const char = new Character(gltf);
            char.name = id;
            onLoad(char);
        });
    }

    private onMessage(event: MessageEvent): void {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
            case 'PlayerStateUpdate':
                this.pendingPlayerUpdates.push(msg.data as PlayerStateUpdate);
                break;
            case 'WorldSync':
                this.pendingWorldSync.push(msg.data as WorldSync);
                break;
        }
    }

    private applyPlayerStateUpdate(update: PlayerStateUpdate): void {
        let char = this.remoteCharacters.get(update.id);
        if (!char) {
            this.characterFactory(update.id, (c) => {
                this.remoteCharacters.set(update.id, c);
                this.world.add(c);
                c.setPosition(update.position.x, update.position.y, update.position.z);
                c.setOrientation(new THREE.Vector3(update.rotation.x, update.rotation.y, update.rotation.z), true);
            });
            return;
        }

        char.setPosition(update.position.x, update.position.y, update.position.z);
        char.setOrientation(new THREE.Vector3(update.rotation.x, update.rotation.y, update.rotation.z));
    }

    private applyWorldSync(sync: WorldSync): void {
        if (sync.sunElevation !== undefined) {
            this.world.params.Sun_Elevation = sync.sunElevation;
            this.world.sky.phi = sync.sunElevation;
        }
        if (sync.sunRotation !== undefined) {
            this.world.params.Sun_Rotation = sync.sunRotation;
            this.world.sky.theta = sync.sunRotation;
        }
        if (sync.despawnPlayers) {
            sync.despawnPlayers.forEach((id) => {
                const char = this.remoteCharacters.get(id);
                if (char) {
                    this.world.remove(char);
                    this.remoteCharacters.delete(id);
                }
            });
        }
    }

    public update(_timestep: number): void {
        const playerUpdates = this.pendingPlayerUpdates.splice(0);
        playerUpdates.forEach((u) => this.applyPlayerStateUpdate(u));

        const worldUpdates = this.pendingWorldSync.splice(0);
        worldUpdates.forEach((u) => this.applyWorldSync(u));
    }
}

export default NetworkClient;
