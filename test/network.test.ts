import * as assert from 'assert';
import { PlayerStateUpdate, WorldSync } from '../src/ts/network/messages';
import * as THREE from "three";
import NetworkClient from '../src/ts/network/NetworkClient';

class DummyCharacter {
    public name = '';
    public pos = { x: 0, y: 0, z: 0 };
    public rot = { x: 0, y: 0, z: 1 };
    setPosition(x: number, y: number, z: number): void { this.pos = { x, y, z }; }
    setOrientation(v: THREE.Vector3): void { this.rot = { x: v.x, y: v.y, z: v.z }; }
    addToWorld(world: any): void { world.characters.push(this); }
    removeFromWorld(world: any): void { world.characters = world.characters.filter((c: any) => c !== this); }
    update() {}
}

class DummyWorld {
    public characters: any[] = [];
    public sky = { phi: 0, theta: 0 };
    public params: any = { Sun_Elevation: 0, Sun_Rotation: 0 };
    add(entity: any): void { entity.addToWorld(this); }
    remove(entity: any): void { entity.removeFromWorld(this); }
}

describe('NetworkClient', () => {
    it('applies player updates', () => {
        const world = new DummyWorld();
        const factory = (_id: string, cb: (c: any) => void) => cb(new DummyCharacter());
        const client = new NetworkClient('ws://localhost', world as any, factory as any);
        (client as any).onMessage({ data: JSON.stringify({ type: 'PlayerStateUpdate', data: { id: '1', position: {x:1,y:2,z:3}, rotation: {x:0,y:0,z:1} }}) });
        client.update(0);
        assert.strictEqual(world.characters.length, 1);
        const char = world.characters[0];
        assert.deepStrictEqual(char.pos, {x:1,y:2,z:3});
    });

    it('applies world sync', () => {
        const world = new DummyWorld();
        const client = new NetworkClient('ws://localhost', world as any, (_id,cb)=>cb(new DummyCharacter() as any));
        (client as any).onMessage({ data: JSON.stringify({ type: 'WorldSync', data: { sunElevation: 10, sunRotation: 20 }}) });
        client.update(0);
        assert.strictEqual(world.params.Sun_Elevation, 10);
        assert.strictEqual(world.params.Sun_Rotation, 20);
    });
});
