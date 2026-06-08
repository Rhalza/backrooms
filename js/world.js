import * as THREE from 'three';

export let activeColliders = [];
const chunks = [];

const CHUNK_SIZE = 10;
const WORLD_SIZE = 50;

const connections = ['O', 'W', 'N', 'C'];
const allTemplates = [];

function addTemplateWithRotations(name, weight, c, walls) {
    let currentC = [...c];
    let currentWalls = JSON.parse(JSON.stringify(walls));

    for (let i = 0; i < 4; i++) {
        allTemplates.push({
            name: `${name}_R${i}`,
            w: weight / 4,
            c: [...currentC],
            walls: JSON.parse(JSON.stringify(currentWalls))
        });

        currentC = [currentC[3], currentC[2], currentC[0], currentC[1]];
        
        for (let wall of currentWalls) {
            let nx = -wall.z;
            let nz = wall.x;
            let nw = wall.d;
            let nd = wall.w;
            wall.x = nx;
            wall.z = nz;
            wall.w = nw;
            wall.d = nd;
        }
    }
}

addTemplateWithRotations('Open Room', 250, ['O','O','O','O'], []);
addTemplateWithRotations('Large Open Room', 100, ['O','O','O','O'], []);
addTemplateWithRotations('Wide Hallway', 150, ['W','C','W','C'], []);
addTemplateWithRotations('Narrow Hallway', 100, ['N','C','N','C'], []);
addTemplateWithRotations('Corner Hallway', 80, ['N','C','C','N'], []);
addTemplateWithRotations('T Junction', 80, ['N','N','C','N'], []);
addTemplateWithRotations('Cross Junction', 50, ['N','N','N','N'], []);
addTemplateWithRotations('Divider Room', 50, ['O','O','O','O'], [{x:0, z:0, w:6, d:0.4, h:2.7, y:1.35}]);
addTemplateWithRotations('Half Wall Room', 40, ['O','O','O','O'], [
    {x:0, z:0, w:6, d:0.4, h:1.35, y:0.675},
    {x:0, z:0, w:0.4, d:6, h:1.35, y:0.675}
]);
addTemplateWithRotations('Pillar Room', 40, ['O','O','O','O'], [
    {x:-2, z:-2, w:0.8, d:0.8, h:2.7, y:1.35},
    {x:2, z:-2, w:0.8, d:0.8, h:2.7, y:1.35},
    {x:-2, z:2, w:0.8, d:0.8, h:2.7, y:1.35},
    {x:2, z:2, w:0.8, d:0.8, h:2.7, y:1.35}
]);
addTemplateWithRotations('Niche Room', 30, ['N','C','C','C'], [
    {x:-4.8, z:2, w:0.4, d:2, h:2.7, y:1.35},
    {x:4.8, z:2, w:0.4, d:2, h:2.7, y:1.35}
]);
addTemplateWithRotations('Dead End Room', 20, ['N','C','C','C'], []);
addTemplateWithRotations('Crawlspace Room', 8, ['N','N','C','C'], [{x:0, z:0, w:10, d:0.4, h:1.7, y:1.85}]);
addTemplateWithRotations('Offset Room', 2, ['N','C','C','W'], [{x:-2, z:-2, w:0.4, d:4, h:2.7, y:1.35}]);

for (let n of connections) {
    for (let s of connections) {
        for (let e of connections) {
            for (let w of connections) {
                allTemplates.push({
                    name: 'Fallback',
                    w: 0.001,
                    c: [n, s, e, w],
                    walls: []
                });
            }
        }
    }
}

export function createWorld(scene) {
    const grid = [];
    for (let x = 0; x < WORLD_SIZE; x++) {
        grid[x] = [];
        for (let z = 0; z < WORLD_SIZE; z++) {
            let reqN = (z === 0) ? 'C' : grid[x][z-1].c[1];
            let reqW = (x === 0) ? 'C' : grid[x-1][z].c[2];

            let valid = allTemplates.filter(t => t.c[0] === reqN && t.c[3] === reqW);

            if (z === WORLD_SIZE - 1) valid = valid.filter(t => t.c[1] === 'C');
            if (x === WORLD_SIZE - 1) valid = valid.filter(t => t.c[2] === 'C');

            let totalWeight = valid.reduce((sum, t) => sum + t.w, 0);
            let r = Math.random() * totalWeight;
            let selected = valid[0];
            for (let t of valid) {
                r -= t.w;
                if (r <= 0) {
                    selected = t;
                    break;
                }
            }

            grid[x][z] = selected;
        }
    }

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x5a554a });
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xd0d0b0 });
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xc8c0a0 });
    
    const floorGeo = new THREE.BoxGeometry(CHUNK_SIZE, 0.1, CHUNK_SIZE);
    const ceilGeo = new THREE.BoxGeometry(CHUNK_SIZE, 0.1, CHUNK_SIZE);

    for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
            const group = new THREE.Group();
            const worldX = x * CHUNK_SIZE;
            const worldZ = z * CHUNK_SIZE;
            group.position.set(worldX, 0, worldZ);
            
            const chunkColliders = [];
            
            const addBox = (lx, lz, w, d, h, y) => {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
                mesh.position.set(lx, y, lz);
                group.add(mesh);
                
                const minX = worldX + lx - w/2;
                const maxX = worldX + lx + w/2;
                const minY = y - h/2;
                const maxY = y + h/2;
                const minZ = worldZ + lz - d/2;
                const maxZ = worldZ + lz + d/2;
                chunkColliders.push(new THREE.Box3(
                    new THREE.Vector3(minX, minY, minZ),
                    new THREE.Vector3(maxX, maxY, maxZ)
                ));
            };

            const f = new THREE.Mesh(floorGeo, floorMat);
            f.position.set(0, -0.05, 0);
            group.add(f);
            chunkColliders.push(new THREE.Box3(
                new THREE.Vector3(worldX - 5, -0.1, worldZ - 5),
                new THREE.Vector3(worldX + 5, 0, worldZ + 5)
            ));

            const c = new THREE.Mesh(ceilGeo, ceilMat);
            c.position.set(0, 2.75, 0);
            group.add(c);
            chunkColliders.push(new THREE.Box3(
                new THREE.Vector3(worldX - 5, 2.7, worldZ - 5),
                new THREE.Vector3(worldX + 5, 2.8, worldZ + 5)
            ));

            const template = grid[x][z];
            for (let wall of template.walls) {
                addBox(wall.x, wall.z, wall.w, wall.d, wall.h, wall.y);
            }

            let n = template.c[0];
            if (n === 'C') addBox(0, -5, 10, 0.2, 2.7, 1.35);
            else if (n === 'N') {
                addBox(-3, -5, 4, 0.2, 2.7, 1.35);
                addBox(3, -5, 4, 0.2, 2.7, 1.35);
                addBox(0, -5, 2, 0.2, 0.7, 2.35);
            } else if (n === 'W') {
                addBox(-3.5, -5, 3, 0.2, 2.7, 1.35);
                addBox(3.5, -5, 3, 0.2, 2.7, 1.35);
                addBox(0, -5, 4, 0.2, 0.7, 2.35);
            }

            let w = template.c[3];
            if (w === 'C') addBox(-5, 0, 0.2, 10, 2.7, 1.35);
            else if (w === 'N') {
                addBox(-5, -3, 0.2, 4, 2.7, 1.35);
                addBox(-5, 3, 0.2, 4, 2.7, 1.35);
                addBox(-5, 0, 0.2, 2, 0.7, 2.35);
            } else if (w === 'W') {
                addBox(-5, -3.5, 0.2, 3, 2.7, 1.35);
                addBox(-5, 3.5, 0.2, 3, 2.7, 1.35);
                addBox(-5, 0, 0.2, 4, 0.7, 2.35);
            }

            if (z === WORLD_SIZE - 1) addBox(0, 5, 10, 0.2, 2.7, 1.35);
            if (x === WORLD_SIZE - 1) addBox(5, 0, 0.2, 10, 2.7, 1.35);

            group.visible = false;
            scene.add(group);
            chunks.push({ x, z, group, colliders: chunkColliders });
        }
    }
}

export function updateRenderDistance(playerPos) {
    const pX = playerPos.x / CHUNK_SIZE;
    const pZ = playerPos.z / CHUNK_SIZE;
    activeColliders.length = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const dx = chunk.x - pX;
        const dz = chunk.z - pZ;
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