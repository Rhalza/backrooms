import * as THREE from 'three';

export let activeColliders = [];
const chunks = [];

const ROOM_SIZE = 2.5;
const CHUNK_CELLS = 4;
const CHUNK_SIZE = ROOM_SIZE * CHUNK_CELLS;
const WORLD_CHUNKS = 50;
const WORLD_CELLS = WORLD_CHUNKS * CHUNK_CELLS;

const hWalls = new Uint8Array(WORLD_CELLS * (WORLD_CELLS + 1));
const vWalls = new Uint8Array((WORLD_CELLS + 1) * WORLD_CELLS);
const pillars = new Uint8Array((WORLD_CELLS + 1) * (WORLD_CELLS + 1));

function setHWall(x, z, val) {
    if (x >= 0 && x < WORLD_CELLS && z >= 0 && z <= WORLD_CELLS) hWalls[z * WORLD_CELLS + x] = val;
}

function setVWall(x, z, val) {
    if (x >= 0 && x <= WORLD_CELLS && z >= 0 && z < WORLD_CELLS) vWalls[z * (WORLD_CELLS + 1) + x] = val;
}

function setPillar(x, z, val) {
    if (x >= 0 && x <= WORLD_CELLS && z >= 0 && z <= WORLD_CELLS) pillars[z * (WORLD_CELLS + 1) + x] = val;
}

function carveRoom(startX, startZ, w, d) {
    for (let x = startX; x < startX + w; x++) {
        for (let z = startZ; z < startZ + d; z++) {
            if (x < startX + w - 1) setVWall(x + 1, z, 0);
            if (z < startZ + d - 1) setHWall(x, z + 1, 0);
        }
    }
    const doors = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < doors; i++) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) {
            setHWall(startX + Math.floor(Math.random() * w), startZ, 0);
        } else if (edge === 1) {
            setHWall(startX + Math.floor(Math.random() * w), startZ + d, 0);
        } else if (edge === 2) {
            setVWall(startX, startZ + Math.floor(Math.random() * d), 0);
        } else {
            setVWall(startX + w, startZ + Math.floor(Math.random() * d), 0);
        }
    }
}

function generateLayout() {
    hWalls.fill(1);
    vWalls.fill(1);
    pillars.fill(0);

    for (let i = 0; i < 8; i++) {
        const w = 10 + Math.floor(Math.random() * 15);
        const d = 10 + Math.floor(Math.random() * 15);
        const sx = 5 + Math.floor(Math.random() * (WORLD_CELLS - w - 10));
        const sz = 5 + Math.floor(Math.random() * (WORLD_CELLS - d - 10));
        carveRoom(sx, sz, w, d);
        for (let px = sx + 2; px < sx + w - 1; px += 3) {
            for (let pz = sz + 2; pz < sz + d - 1; pz += 3) {
                setPillar(px, pz, 1);
            }
        }
    }

    for (let i = 0; i < 4; i++) {
        let sx = 10 + Math.floor(Math.random() * (WORLD_CELLS - 30));
        let sz = 10 + Math.floor(Math.random() * (WORLD_CELLS - 30));
        let w = 10 + Math.floor(Math.random() * 15);
        let d = 10 + Math.floor(Math.random() * 15);
        let isHoriz = Math.random() > 0.5;
        for (let x = sx; x < sx + w; x++) {
            for (let z = sz; z < sz + d; z++) {
                if (isHoriz) {
                    if (z % 2 === 0) setHWall(x, z, 0);
                    setVWall(x, z, 0);
                } else {
                    if (x % 2 === 0) setVWall(x, z, 0);
                    setHWall(x, z, 0);
                }
            }
        }
    }

    for (let i = 0; i < 4; i++) {
        let sx = 10 + Math.floor(Math.random() * (WORLD_CELLS - 30));
        let sz = 10 + Math.floor(Math.random() * (WORLD_CELLS - 30));
        let countX = 3 + Math.floor(Math.random() * 4);
        let countZ = 3 + Math.floor(Math.random() * 4);
        for (let cx = 0; cx < countX; cx++) {
            for (let cz = 0; cz < countZ; cz++) {
                carveRoom(sx + cx * 2, sz + cz * 2, 2, 2);
            }
        }
    }

    for (let i = 0; i < 150; i++) {
        const w = 2 + Math.floor(Math.random() * 5);
        const d = 2 + Math.floor(Math.random() * 5);
        const sx = 2 + Math.floor(Math.random() * (WORLD_CELLS - w - 4));
        const sz = 2 + Math.floor(Math.random() * (WORLD_CELLS - d - 4));
        carveRoom(sx, sz, w, d);
    }

    for (let i = 0; i < 60; i++) {
        let x = Math.floor(Math.random() * WORLD_CELLS);
        let z = Math.floor(Math.random() * WORLD_CELLS);
        const dir = Math.floor(Math.random() * 4);
        const length = 20 + Math.floor(Math.random() * 40);
        for (let j = 0; j < length; j++) {
            if (dir === 0) { setHWall(x, z, 0); z--; }
            if (dir === 1) { setHWall(x, z + 1, 0); z++; }
            if (dir === 2) { setVWall(x, z, 0); x--; }
            if (dir === 3) { setVWall(x + 1, z, 0); x++; }
            if (x < 1 || x >= WORLD_CELLS - 1 || z < 1 || z >= WORLD_CELLS - 1) break;
        }
    }

    for (let i = 0; i < 120; i++) {
        let x = Math.floor(Math.random() * WORLD_CELLS);
        let z = Math.floor(Math.random() * WORLD_CELLS);
        for (let j = 0; j < 250; j++) {
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0 && z > 1) { setHWall(x, z, 0); z--; }
            else if (dir === 1 && z < WORLD_CELLS - 2) { setHWall(x, z + 1, 0); z++; }
            else if (dir === 2 && x > 1) { setVWall(x, z, 0); x--; }
            else if (dir === 3 && x < WORLD_CELLS - 2) { setVWall(x + 1, z, 0); x++; }
        }
    }

    carveRoom(98, 98, 4, 4);
}

export function createWorld(scene) {
    generateLayout();

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

    for (let cx = 0; cx < WORLD_CHUNKS; cx++) {
        for (let cz = 0; cz < WORLD_CHUNKS; cz++) {
            const group = new THREE.Group();
            const chunkColliders = [];

            const worldX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
            const worldZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;

            const f = new THREE.Mesh(floorGeo, floorMat);
            f.position.set(worldX, -0.05, worldZ);
            group.add(f);

            const c = new THREE.Mesh(ceilGeo, ceilMat);
            c.position.set(worldX, 2.75, worldZ);
            group.add(c);

            for (let x = 0; x < CHUNK_CELLS; x++) {
                for (let z = 0; z < CHUNK_CELLS; z++) {
                    let gx = cx * CHUNK_CELLS + x;
                    let gz = cz * CHUNK_CELLS + z;

                    if (hWalls[gz * WORLD_CELLS + gx]) {
                        let px = gx * ROOM_SIZE + ROOM_SIZE / 2;
                        let pz = gz * ROOM_SIZE;
                        let m = new THREE.Mesh(hWallGeo, wallMat);
                        m.position.set(px, wHeight / 2, pz);
                        group.add(m);
                        chunkColliders.push(new THREE.Box3(
                            new THREE.Vector3(px - hwWidth / 2, 0, pz - wDepth / 2),
                            new THREE.Vector3(px + hwWidth / 2, wHeight, pz + wDepth / 2)
                        ));
                    }

                    if (gz === WORLD_CELLS - 1 && hWalls[(gz + 1) * WORLD_CELLS + gx]) {
                        let px = gx * ROOM_SIZE + ROOM_SIZE / 2;
                        let pz = (gz + 1) * ROOM_SIZE;
                        let m = new THREE.Mesh(hWallGeo, wallMat);
                        m.position.set(px, wHeight / 2, pz);
                        group.add(m);
                        chunkColliders.push(new THREE.Box3(
                            new THREE.Vector3(px - hwWidth / 2, 0, pz - wDepth / 2),
                            new THREE.Vector3(px + hwWidth / 2, wHeight, pz + wDepth / 2)
                        ));
                    }

                    if (vWalls[gz * (WORLD_CELLS + 1) + gx]) {
                        let px = gx * ROOM_SIZE;
                        let pz = gz * ROOM_SIZE + ROOM_SIZE / 2;
                        let m = new THREE.Mesh(vWallGeo, wallMat);
                        m.position.set(px, wHeight / 2, pz);
                        group.add(m);
                        chunkColliders.push(new THREE.Box3(
                            new THREE.Vector3(px - wDepth / 2, 0, pz - hwWidth / 2),
                            new THREE.Vector3(px + wDepth / 2, wHeight, pz + hwWidth / 2)
                        ));
                    }

                    if (gx === WORLD_CELLS - 1 && vWalls[gz * (WORLD_CELLS + 1) + (gx + 1)]) {
                        let px = (gx + 1) * ROOM_SIZE;
                        let pz = gz * ROOM_SIZE + ROOM_SIZE / 2;
                        let m = new THREE.Mesh(vWallGeo, wallMat);
                        m.position.set(px, wHeight / 2, pz);
                        group.add(m);
                        chunkColliders.push(new THREE.Box3(
                            new THREE.Vector3(px - wDepth / 2, 0, pz - hwWidth / 2),
                            new THREE.Vector3(px + wDepth / 2, wHeight, pz + hwWidth / 2)
                        ));
                    }

                    if (pillars[gz * (WORLD_CELLS + 1) + gx]) {
                        let px = gx * ROOM_SIZE;
                        let pz = gz * ROOM_SIZE;
                        let m = new THREE.Mesh(pillarGeo, wallMat);
                        m.position.set(px, wHeight / 2, pz);
                        group.add(m);
                        chunkColliders.push(new THREE.Box3(
                            new THREE.Vector3(px - 0.2, 0, pz - 0.2),
                            new THREE.Vector3(px + 0.2, wHeight, pz + 0.2)
                        ));
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