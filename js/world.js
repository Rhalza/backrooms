import * as THREE from 'three';

export const colliders = [];

export function createWorld(scene) {
    const floorGeo = new THREE.BoxGeometry(10, 0.1, 10);
    const ceilGeo = new THREE.BoxGeometry(10, 0.1, 10);
    const wallGeo = new THREE.BoxGeometry(2, 3, 2);
    const halfGeo = new THREE.BoxGeometry(2, 1.5, 2);
    const crawlGeo = new THREE.BoxGeometry(2, 2, 2);

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x5a554a });
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xd0d0b0 });
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xc8c0a0 });

    for (let cx = -2; cx <= 2; cx++) {
        for (let cz = -2; cz <= 2; cz++) {
            const f = new THREE.Mesh(floorGeo, floorMat);
            f.position.set(cx * 10, -0.05, cz * 10);
            scene.add(f);
            
            const cBox = new THREE.Box3().setFromObject(f);
            colliders.push(cBox);

            const c = new THREE.Mesh(ceilGeo, ceilMat);
            c.position.set(cx * 10, 3.05, cz * 10);
            scene.add(c);
            
            const cBox2 = new THREE.Box3().setFromObject(c);
            colliders.push(cBox2);

            for (let bx = 0; bx < 5; bx++) {
                for (let bz = 0; bz < 5; bz++) {
                    if (cx === 0 && cz === 0 && bx >= 1 && bx <= 3 && bz >= 1 && bz <= 3) continue;

                    let wx = (cx * 10) - 4 + (bx * 2);
                    let wz = (cz * 10) - 4 + (bz * 2);

                    let p = Math.abs((wx * 3 + wz * 5) % 7);

                    if (p === 1) {
                        let m = new THREE.Mesh(wallGeo, wallMat);
                        m.position.set(wx, 1.5, wz);
                        scene.add(m);
                        colliders.push(new THREE.Box3().setFromObject(m));
                    } else if (p === 2) {
                        let m = new THREE.Mesh(halfGeo, wallMat);
                        m.position.set(wx, 0.75, wz);
                        scene.add(m);
                        colliders.push(new THREE.Box3().setFromObject(m));
                    } else if (p === 3) {
                        let m = new THREE.Mesh(crawlGeo, wallMat);
                        m.position.set(wx, 2.0, wz);
                        scene.add(m);
                        colliders.push(new THREE.Box3().setFromObject(m));
                    }
                }
            }
        }
    }
}