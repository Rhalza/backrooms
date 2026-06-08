import * as THREE from 'three';

export const wallColliders = [];

function pseudoRandom(x, z, seed) {
    let n = Math.sin(x * 12.9898 + z * 78.233 + seed * 45.123) * 43758.5453;
    return Math.abs(n - Math.floor(n));
}

export function createWorld(scene) {
    const floorGeo = new THREE.BoxGeometry(15, 0.1, 15);
    const ceilGeo = new THREE.BoxGeometry(15, 0.1, 15);

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x5a554a });
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xd0d0b0 });
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xc8c0a0 });

    const addWallCollider = (mesh) => {
        scene.add(mesh);
        wallColliders.push(new THREE.Box3().setFromObject(mesh));
    };

    const createWallSegment = (x, z, isXAxis, type) => {
        const wX = isXAxis ? 3.2 : 0.2;
        const wZ = isXAxis ? 0.2 : 3.2;
        
        if (type === 1) {
            let m = new THREE.Mesh(new THREE.BoxGeometry(wX, 2.7, wZ), wallMat);
            m.position.set(x, 1.35, z);
            addWallCollider(m);
        } else if (type === 2) {
            const sideW = isXAxis ? 1.1 : 0.2;
            const sideD = isXAxis ? 0.2 : 1.1;
            
            let m1 = new THREE.Mesh(new THREE.BoxGeometry(sideW, 2.7, sideD), wallMat);
            m1.position.set(x + (isXAxis ? -1.05 : 0), 1.35, z + (isXAxis ? 0 : -1.05));
            addWallCollider(m1);
            
            let m2 = new THREE.Mesh(new THREE.BoxGeometry(sideW, 2.7, sideD), wallMat);
            m2.position.set(x + (isXAxis ? 1.05 : 0), 1.35, z + (isXAxis ? 0 : 1.05));
            addWallCollider(m2);
            
            const headW = isXAxis ? 1.0 : 0.2;
            const headD = isXAxis ? 0.2 : 1.0;
            let head = new THREE.Mesh(new THREE.BoxGeometry(headW, 0.7, headD), wallMat);
            head.position.set(x, 2.35, z);
            addWallCollider(head);
        } else if (type === 3) {
            let m = new THREE.Mesh(new THREE.BoxGeometry(wX, 1.35, wZ), wallMat);
            m.position.set(x, 0.675, z);
            addWallCollider(m);
        } else if (type === 4) {
            const sideW = isXAxis ? 1.1 : 0.2;
            const sideD = isXAxis ? 0.2 : 1.1;
            
            let m1 = new THREE.Mesh(new THREE.BoxGeometry(sideW, 2.7, sideD), wallMat);
            m1.position.set(x + (isXAxis ? -1.05 : 0), 1.35, z + (isXAxis ? 0 : -1.05));
            addWallCollider(m1);
            
            let m2 = new THREE.Mesh(new THREE.BoxGeometry(sideW, 2.7, sideD), wallMat);
            m2.position.set(x + (isXAxis ? 1.05 : 0), 1.35, z + (isXAxis ? 0 : 1.05));
            addWallCollider(m2);
            
            const topW = isXAxis ? 1.0 : 0.2;
            const topD = isXAxis ? 0.2 : 1.0;
            let topM = new THREE.Mesh(new THREE.BoxGeometry(topW, 1.7, topD), wallMat);
            topM.position.set(x, 1.85, z);
            addWallCollider(topM);
        }
    };

    for (let cx = -2; cx <= 2; cx++) {
        for (let cz = -2; cz <= 2; cz++) {
            const f = new THREE.Mesh(floorGeo, floorMat);
            f.position.set(cx * 15, -0.05, cz * 15);
            scene.add(f);

            const c = new THREE.Mesh(ceilGeo, ceilMat);
            c.position.set(cx * 15, 2.75, cz * 15);
            scene.add(c);

            for (let bx = 0; bx < 5; bx++) {
                for (let bz = 0; bz < 5; bz++) {
                    let gx = cx * 5 + bx - 2;
                    let gz = cz * 5 + bz - 2;
                    
                    let wx = gx * 3;
                    let wz = gz * 3;

                    if (Math.abs(gx) <= 1 && Math.abs(gz) <= 1) continue;

                    let randX = pseudoRandom(gx, gz, 1);
                    let typeX = 0;
                    if (randX > 0.55) {
                        if (randX > 0.9) typeX = 2;
                        else if (randX > 0.8) typeX = 3;
                        else if (randX > 0.7) typeX = 4;
                        else typeX = 1;
                    }

                    let randZ = pseudoRandom(gx, gz, 2);
                    let typeZ = 0;
                    if (randZ > 0.55) {
                        if (randZ > 0.9) typeZ = 2;
                        else if (randZ > 0.8) typeZ = 3;
                        else if (randZ > 0.7) typeZ = 4;
                        else typeZ = 1;
                    }

                    if (typeX !== 0) {
                        createWallSegment(wx, wz - 1.5, true, typeX);
                    }

                    if (typeZ !== 0) {
                        createWallSegment(wx - 1.5, wz, false, typeZ);
                    }

                    let p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.7, 0.2), wallMat);
                    p.position.set(wx - 1.5, 1.35, wz - 1.5);
                    addWallCollider(p);
                }
            }
        }
    }
}