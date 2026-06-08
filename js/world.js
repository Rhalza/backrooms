import * as THREE from 'three';
import { generateMap, hWalls, vWalls, pillars, ceilings, MAP_CELLS } from './generator.js';

export let activeColliders = [];
const chunks = [];

export const ROOM_SIZE = 2.5;
export const CHUNK_CELLS = 5;
export const CHUNK_SIZE = ROOM_SIZE * CHUNK_CELLS;
const WORLD_CHUNKS = Math.floor(MAP_CELLS / CHUNK_CELLS);

export function createWorld(scene) {
    generateMap();

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x80755a });
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xd0d0b0 });
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xceb466 });

    const floorGeo = new THREE.BoxGeometry(CHUNK_SIZE, 0.1, CHUNK_SIZE);
    const ceilGeo = new THREE.BoxGeometry(CHUNK_SIZE, 0.1, CHUNK_SIZE);
    
    const hwWidth = ROOM_SIZE + 0.2;
    const wDepth = 0.2;
    const wHeight = 2.7;

    const hWallGeo = new THREE.BoxGeometry(hwWidth, wHeight, wDepth);
    const vWallGeo = new THREE.BoxGeometry(wDepth, wHeight, hwWidth);
    const pillarGeo = new THREE.BoxGeometry(0.4, wHeight, 0.4);
    const crawlGeo = new THREE.BoxGeometry(ROOM_SIZE, 1.5, ROOM_SIZE);

    for (let cx = 0; cx < WORLD_CHUNKS; cx++) {
        for (let cz = 0; cz < WORLD_CHUNKS; cz++) {
            const group = new THREE.Group();
            const chunkColliders = [];

            const chunkX = cx * CHUNK_SIZE;
            const chunkZ = cz * CHUNK_SIZE;
            group.position.set(chunkX, 0, chunkZ);

            const f = new THREE.Mesh(floorGeo, floorMat);
            f.position.set(CHUNK_SIZE / 2, -0.05, CHUNK_SIZE / 2);
            group.add(f);

            const c = new THREE.Mesh(ceilGeo, ceilMat);
            c.position.set(CHUNK_SIZE / 2, 2.75, CHUNK_SIZE / 2);
            group.add(c);

            const addMesh = (geo, mat, lx, lz, y) => {
                let m = new THREE.Mesh(geo, mat);
                m.position.set(lx, y, lz);
                group.add(m);
                const w = geo.parameters.width;
                const h = geo.parameters.height;
                const d = geo.parameters.depth;
                chunkColliders.push(new THREE.Box3(
                    new THREE.Vector3(chunkX + lx - w / 2, y - h / 2, chunkZ + lz - d / 2),
                    new THREE.Vector3(chunkX + lx + w / 2, y + h / 2, chunkZ + lz + d / 2)
                ));
            };

            for (let lx = 0; lx < CHUNK_CELLS; lx++) {
                for (let lz = 0; lz < CHUNK_CELLS; lz++) {
                    let gx = cx * CHUNK_CELLS + lx;
                    let gz = cz * CHUNK_CELLS + lz;

                    if (hWalls[gz * MAP_CELLS + gx]) {
                        addMesh(hWallGeo, wallMat, lx * ROOM_SIZE + ROOM_SIZE / 2, lz * ROOM_SIZE, wHeight / 2);
                    }

                    if (gz === MAP_CELLS - 1 && hWalls[(gz + 1) * MAP_CELLS + gx]) {
                        addMesh(hWallGeo, wallMat, lx * ROOM_SIZE + ROOM_SIZE / 2, (lz + 1) * ROOM_SIZE, wHeight / 2);
                    }

                    if (vWalls[gz * (MAP_CELLS + 1) + gx]) {
                        addMesh(vWallGeo, wallMat, lx * ROOM_SIZE, lz * ROOM_SIZE + ROOM_SIZE / 2, wHeight / 2);
                    }

                    if (gx === MAP_CELLS - 1 && vWalls[gz * (MAP_CELLS + 1) + (gx + 1)]) {
                        addMesh(vWallGeo, wallMat, (lx + 1) * ROOM_SIZE, lz * ROOM_SIZE + ROOM_SIZE / 2, wHeight / 2);
                    }

                    if (pillars[gz * MAP_CELLS + gx]) {
                        addMesh(pillarGeo, wallMat, lx * ROOM_SIZE + ROOM_SIZE / 2, lz * ROOM_SIZE + ROOM_SIZE / 2, wHeight / 2);
                    }

                    let ceilH = ceilings[gz * MAP_CELLS + gx];
                    if (ceilH < 2.7) {
                        addMesh(crawlGeo, ceilMat, lx * ROOM_SIZE + ROOM_SIZE / 2, lz * ROOM_SIZE + ROOM_SIZE / 2, ceilH + 1.5 / 2);
                    }
                }
            }

            group.visible = false;
            scene.add(group);
            chunks.push({ cx, cz, group, colliders: chunkColliders });
        }
    }
}

export function updateRenderDistance(playerPos) {
    const pX = Math.floor(playerPos.x / CHUNK_SIZE);
    const pZ = Math.floor(playerPos.z / CHUNK_SIZE);
    activeColliders.length = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const dx = chunk.cx - pX;
        const dz = chunk.cz - pZ;
        const distSq = dx * dx + dz * dz;

        if (distSq <= 25) {
            chunk.group.visible = true;
            for (let j = 0; j < chunk.colliders.length; j++) {
                activeColliders.push(chunk.colliders[j]);
            }
        } else {
            chunk.group.visible = false;
        }
    }
}