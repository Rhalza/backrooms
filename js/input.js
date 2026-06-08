export const input = {
    keys: { w: false, a: false, s: false, d: false, space: false, c: false },
    mouse: { movementX: 0, movementY: 0 },
    touchMove: { x: 0, y: 0 },
    touchLook: { x: 0, y: 0 },
    isLocked: false,
    isTouch: false
};

export function initInput(onStart) {
    const startMenu = document.getElementById('start-menu');
    const mobileControls = document.getElementById('mobile-controls');
    const leftBase = document.getElementById('joystick-left-base');
    const leftKnob = document.getElementById('joystick-left-knob');
    const rightBase = document.getElementById('joystick-right-base');
    const rightKnob = document.getElementById('joystick-right-knob');
    
    let hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    startMenu.addEventListener('click', () => {
        if (hasTouch) {
            startMenu.style.display = 'none';
            mobileControls.style.display = 'block';
            input.isTouch = true;
            onStart();
        } else {
            document.body.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === document.body) {
            startMenu.style.display = 'none';
            input.isLocked = true;
            onStart();
        } else {
            startMenu.style.display = 'flex';
            input.isLocked = false;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') input.keys.w = true;
        if (e.code === 'KeyA') input.keys.a = true;
        if (e.code === 'KeyS') input.keys.s = true;
        if (e.code === 'KeyD') input.keys.d = true;
        if (e.code === 'Space') input.keys.space = true;
        if (e.code === 'KeyC') input.keys.c = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') input.keys.w = false;
        if (e.code === 'KeyA') input.keys.a = false;
        if (e.code === 'KeyS') input.keys.s = false;
        if (e.code === 'KeyD') input.keys.d = false;
        if (e.code === 'Space') input.keys.space = false;
        if (e.code === 'KeyC') input.keys.c = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!input.isLocked) return;
        input.mouse.movementX += e.movementX;
        input.mouse.movementY += e.movementY;
    });

    function handleJoystick(zoneId, baseElem, knobElem, outObj) {
        const zone = document.getElementById(zoneId);
        let activeId = null;
        let startX = 0;
        let startY = 0;

        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (activeId === null) {
                    const touch = e.changedTouches[i];
                    activeId = touch.identifier;
                    startX = touch.clientX;
                    startY = touch.clientY;
                    baseElem.style.display = 'block';
                    baseElem.style.left = startX + 'px';
                    baseElem.style.top = startY + 'px';
                    knobElem.style.transform = `translate(0px, 0px)`;
                    outObj.x = 0;
                    outObj.y = 0;
                }
            }
        });

        zone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === activeId) {
                    let dx = touch.clientX - startX;
                    let dy = touch.clientY - startY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 35;
                    if (dist > maxDist) {
                        dx = (dx / dist) * maxDist;
                        dy = (dy / dist) * maxDist;
                    }
                    knobElem.style.transform = `translate(${dx}px, ${dy}px)`;
                    outObj.x = dx / maxDist;
                    outObj.y = dy / maxDist;
                }
            }
        });

        const endFunc = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeId) {
                    activeId = null;
                    baseElem.style.display = 'none';
                    outObj.x = 0;
                    outObj.y = 0;
                }
            }
        };

        zone.addEventListener('touchend', endFunc);
        zone.addEventListener('touchcancel', endFunc);
    }

    handleJoystick('joystick-left-zone', leftBase, leftKnob, input.touchMove);
    handleJoystick('joystick-right-zone', rightBase, rightKnob, input.touchLook);
}
