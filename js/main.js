import * as THREE from 'three';
import { createWorld, updateRenderDistance, activeColliders, ROOM_SIZE } from './world.js';
import { MAP_CELLS, hWalls, vWalls } from './generator.js';
import { Player } from './player.js';
import { input, initInput } from './input.js';

let scene, camera, renderer, player;
let lastTime = performance.now();
let gameStarted = false;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 5, 25);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.rotation.order = 'YXZ';

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    createWorld(scene);

    let spawnX = Math.floor(MAP_CELLS / 2);
    let spawnZ = Math.floor(MAP_CELLS / 2);
    while (vWalls[spawnZ * (MAP_CELLS + 1) + spawnX] || hWalls[spawnZ * MAP_CELLS + spawnX]) {
        spawnX++;
        if (spawnX >= MAP_CELLS) {
            spawnX = 0;
            spawnZ++;
        }
    }

    const startWorldX = spawnX * ROOM_SIZE + ROOM_SIZE / 2;
    const startWorldZ = spawnZ * ROOM_SIZE + ROOM_SIZE / 2;

    player = new Player(camera, startWorldX, startWorldZ);
    updateRenderDistance(player.position);

    window.addEventListener('resize', onWindowResize);

    initInput(() => {
        gameStarted = true;
    });

    renderer.setAnimationLoop(animate);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if (gameStarted) {
        updateRenderDistance(player.position);
        player.update(dt, input, activeColliders);
    }

    renderer.render(scene, camera);
}

init();