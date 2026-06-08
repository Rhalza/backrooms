import * as THREE from 'three';

export const wallColliders = [];

export function createWorld(scene) {
    const floorGeo = new THREE.BoxGeometry(10, 0.1, 10);
    const ceilGeo = new THREE.BoxGeometry(10, 0.1, 10);
    const wallGeoX = new THREE.BoxGeometry(2.2, 2.7, 0.2);
    const wallGeoZ = new THREE.BoxGeometry(0.2, 2.7, 2.2);
    const pillarGeo = new THREE.BoxGeometry(0.2, 2.7, 0.2);

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x5a554a });
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0xd0d0b0 });
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xc8c0a0 });

    for (let cx = -2; cx <= 2; cx++) {
        for (let cz = -2; cz <= 2; cz++) {
            const f = new THREE.Mesh(floorGeo, floorMat);
            f.position.set(cx * 10, -0.05, cz * 10);
            scene.add(f);

            const c = new THREE.Mesh(ceilGeo, ceilMat);
            c.position.set(cx * 10, 2.75, cz * 10);
            scene.add(c);

            for (let bx = 0; bx < 5; bx++) {
                for (let bz = 0; bz < 5; bz++) {
                    let wx = (cx * 10) - 4 + (bx * 2);
                    let wz = (cz * 10) - 4 + (bz * 2);

                    if (Math.abs(wx) < 3 && Math.abs(wz) < 3) continue;

                    let hash1 = Math.abs((Math.floor(wx * 17.13) + Math.floor(wz * 31.71)) % 7);
                    let hash2 = Math.abs((Math.floor(wx * 23.45) + Math.floor(wz * 13.89)) % 5);

                    if (hash1 < 4) {
                        let m = new THREE.Mesh(wallGeoZ, wallMat);
                        m.position.set(wx - 1, 1.35, wz);
                        scene.add(m);
                        wallColliders.push(new THREE.Box3().setFromObject(m));
                    }

                    if (hash2 < 3) {
                        let m = new THREE.Mesh(wallGeoX, wallMat);
                        m.position.set(wx, 1.35, wz - 1);
                        scene.add(m);
                        wallColliders.push(new THREE.Box3().setFromObject(m));
                    }

                    let p = new THREE.Mesh(pillarGeo, wallMat);
                    p.position.set(wx - 1, 1.35, wz - 1);
                    scene.add(p);
                    wallColliders.push(new THREE.Box3().setFromObject(p));
                }
            }
        }
    }
}