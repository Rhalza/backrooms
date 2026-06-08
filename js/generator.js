export const MAP_CELLS = 200;
export const hWalls = new Uint8Array(MAP_CELLS * (MAP_CELLS + 1));
export const vWalls = new Uint8Array((MAP_CELLS + 1) * MAP_CELLS);
export const pillars = new Uint8Array(MAP_CELLS * MAP_CELLS);
export const ceilings = new Float32Array(MAP_CELLS * MAP_CELLS);

export function generateMap() {
    hWalls.fill(0);
    vWalls.fill(0);
    pillars.fill(0);
    ceilings.fill(2.7);

    for (let i = 0; i < MAP_CELLS; i++) {
        hWalls[i] = 1;
        hWalls[MAP_CELLS * MAP_CELLS + i] = 1;
        vWalls[i * (MAP_CELLS + 1)] = 1;
        vWalls[i * (MAP_CELLS + 1) + MAP_CELLS] = 1;
    }

    let rects = [{x: 2, z: 2, w: MAP_CELLS - 4, d: MAP_CELLS - 4}];
    let rooms = [];
    const MIN_ROOM = 4;

    while (rects.length > 0) {
        let r = rects.shift();
        let splitH = Math.random() > 0.5;
        if (r.w > r.d * 1.5) splitH = false;
        else if (r.d > r.w * 1.5) splitH = true;

        let hallSize = Math.random() > 0.7 ? 2 : 1;
        if (Math.random() > 0.95) hallSize = 3;

        let split = false;
        if (splitH) {
            if (r.d >= MIN_ROOM * 2 + hallSize) {
                let maxSplit = r.d - MIN_ROOM - hallSize;
                let zSplit = MIN_ROOM + Math.floor(Math.random() * (maxSplit - MIN_ROOM + 1));
                rects.push({x: r.x, z: r.z, w: r.w, d: zSplit});
                rects.push({x: r.x, z: r.z + zSplit + hallSize, w: r.w, d: r.d - zSplit - hallSize});
                split = true;
            }
        } else {
            if (r.w >= MIN_ROOM * 2 + hallSize) {
                let maxSplit = r.w - MIN_ROOM - hallSize;
                let xSplit = MIN_ROOM + Math.floor(Math.random() * (maxSplit - MIN_ROOM + 1));
                rects.push({x: r.x, z: r.z, w: xSplit, d: r.d});
                rects.push({x: r.x + xSplit + hallSize, z: r.z, w: r.w - xSplit - hallSize, d: r.d});
                split = true;
            }
        }

        if (!split) {
            rooms.push(r);
        }
    }

    for (let r of rooms) {
        for (let x = r.x; x < r.x + r.w; x++) {
            hWalls[r.z * MAP_CELLS + x] = 1;
            hWalls[(r.z + r.d) * MAP_CELLS + x] = 1;
        }
        for (let z = r.z; z < r.z + r.d; z++) {
            vWalls[z * (MAP_CELLS + 1) + r.x] = 1;
            vWalls[z * (MAP_CELLS + 1) + r.x + r.w] = 1;
        }
    }

    for (let r of rooms) {
        let numDoors = Math.random() > 0.5 ? 2 : 1;
        if (r.w * r.d > 100) numDoors += 2;
        
        for (let i = 0; i < numDoors; i++) {
            let edge = Math.floor(Math.random() * 4);
            if (edge === 0) hWalls[r.z * MAP_CELLS + r.x + Math.floor(Math.random() * r.w)] = 0;
            else if (edge === 1) hWalls[(r.z + r.d) * MAP_CELLS + r.x + Math.floor(Math.random() * r.w)] = 0;
            else if (edge === 2) vWalls[(r.z + Math.floor(Math.random() * r.d)) * (MAP_CELLS + 1) + r.x] = 0;
            else if (edge === 3) vWalls[(r.z + Math.floor(Math.random() * r.d)) * (MAP_CELLS + 1) + r.x + r.w] = 0;
        }
    }

    for (let r of rooms) {
        let area = r.w * r.d;
        
        if (area > 150 && Math.random() > 0.4) {
            for (let x = r.x + 2; x < r.x + r.w - 2; x += 2) {
                for (let z = r.z + 2; z < r.z + r.d - 2; z += 2) {
                    if (Math.random() > 0.3) hWalls[z * MAP_CELLS + x] = 1;
                    if (Math.random() > 0.3) vWalls[z * (MAP_CELLS + 1) + x] = 1;
                    if (Math.random() > 0.8) pillars[z * MAP_CELLS + x] = 1;
                }
            }
        } else if (area > 60 && Math.random() > 0.5) {
            for (let x = r.x + 2; x < r.x + r.w - 1; x += 3) {
                for (let z = r.z + 2; z < r.z + r.d - 1; z += 3) {
                    pillars[z * MAP_CELLS + x] = 1;
                }
            }
        } else if (Math.random() > 0.7 && r.w > 4 && r.d > 4) {
            if (r.w > r.d) {
                let divZ = r.z + Math.floor(r.d / 2);
                for (let x = r.x + 1; x < r.x + r.w - 1; x++) {
                    if (Math.random() > 0.1) hWalls[divZ * MAP_CELLS + x] = 1;
                }
            } else {
                let divX = r.x + Math.floor(r.w / 2);
                for (let z = r.z + 1; z < r.z + r.d - 1; z++) {
                    if (Math.random() > 0.1) vWalls[z * (MAP_CELLS + 1) + divX] = 1;
                }
            }
        }

        if (area <= 25 && Math.random() > 0.85) {
            for (let x = r.x; x < r.x + r.w; x++) {
                for (let z = r.z; z < r.z + r.d; z++) {
                    ceilings[z * MAP_CELLS + x] = 1.2;
                }
            }
        }
    }
}