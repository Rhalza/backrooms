import * as THREE from 'three';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.position = new THREE.Vector3(0, 0.1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.radius = 0.3;
        this.height = 1.8;
        this.yaw = 0;
        this.pitch = 0;
        this.isGrounded = false;
        this.aabb = new THREE.Box3();
    }

    updateAABB() {
        this.aabb.set(
            new THREE.Vector3(this.position.x - this.radius, this.position.y, this.position.z - this.radius),
            new THREE.Vector3(this.position.x + this.radius, this.position.y + this.height, this.position.z + this.radius)
        );
    }

    update(dt, input, colliders) {
        this.yaw -= input.mouse.movementX * 0.002;
        this.pitch -= input.mouse.movementY * 0.002;
        
        this.yaw -= input.touchLook.x * 2.0 * dt;
        this.pitch -= input.touchLook.y * 2.0 * dt;

        const PI_2 = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-PI_2, Math.min(PI_2, this.pitch));

        input.mouse.movementX = 0;
        input.mouse.movementY = 0;

        this.camera.rotation.set(this.pitch, this.yaw, 0);

        let targetHeight = 1.8;
        if (input.keys.c) {
            targetHeight = 0.8;
        } else {
            const standBox = new THREE.Box3(
                new THREE.Vector3(this.position.x - this.radius, this.position.y, this.position.z - this.radius),
                new THREE.Vector3(this.position.x + this.radius, this.position.y + 1.8, this.position.z + this.radius)
            );
            let blocked = false;
            for (let i = 0; i < colliders.length; i++) {
                if (standBox.intersectsBox(colliders[i])) {
                    blocked = true;
                    break;
                }
            }
            if (blocked) targetHeight = 0.8;
        }

        this.height += (targetHeight - this.height) * 10 * dt;

        const moveZ = (input.keys.s ? 1 : 0) - (input.keys.w ? 1 : 0) + input.touchMove.y;
        const moveX = (input.keys.d ? 1 : 0) - (input.keys.a ? 1 : 0) + input.touchMove.x;
        
        const moveDir = new THREE.Vector3(moveX, 0, moveZ);
        if (moveDir.lengthSq() > 1) moveDir.normalize();

        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

        const speed = targetHeight === 0.8 ? 0.8 : 1.8;
        
        const dx = moveDir.x * speed * dt;
        this.position.x += dx;
        this.updateAABB();
        for (let i = 0; i < colliders.length; i++) {
            if (this.aabb.intersectsBox(colliders[i])) {
                if (dx > 0) this.position.x = colliders[i].min.x - this.radius;
                else if (dx < 0) this.position.x = colliders[i].max.x + this.radius;
                this.updateAABB();
            }
        }

        const dz = moveDir.z * speed * dt;
        this.position.z += dz;
        this.updateAABB();
        for (let i = 0; i < colliders.length; i++) {
            if (this.aabb.intersectsBox(colliders[i])) {
                if (dz > 0) this.position.z = colliders[i].min.z - this.radius;
                else if (dz < 0) this.position.z = colliders[i].max.z + this.radius;
                this.updateAABB();
            }
        }

        if (this.isGrounded && input.keys.space) {
            this.velocity.y = 4;
        }

        this.velocity.y -= 15 * dt;
        const dy = this.velocity.y * dt;
        this.position.y += dy;
        this.updateAABB();
        
        this.isGrounded = false;
        for (let i = 0; i < colliders.length; i++) {
            if (this.aabb.intersectsBox(colliders[i])) {
                if (dy < 0) {
                    this.position.y = colliders[i].max.y;
                    this.isGrounded = true;
                    this.velocity.y = 0;
                } else if (dy > 0) {
                    this.position.y = colliders[i].min.y - this.height;
                    this.velocity.y = 0;
                }
                this.updateAABB();
            }
        }

        this.camera.position.set(this.position.x, this.position.y + this.height - 0.15, this.position.z);
    }
}