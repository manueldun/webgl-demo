function initInputLogic(canvas) {
    let keyW = false;
    let keyS = false;
    let keyA = false;
    let keyD = false;

    window.addEventListener('keydown',
        function moveForward(e) {
            switch (e.code) {
                case 'KeyW':
                    keyW = true;
                    break;
                case 'KeyS':
                    keyS = true;
                    break;
                case 'KeyA':
                    keyA = true;
                    break;
                case 'KeyD':
                    keyD = true;
                    break;
                default:
            }
        });

    window.addEventListener('keyup',
        function moveForward(e) {
            switch (e.code) {
                case 'KeyW':
                    keyW = false;
                    break;
                case 'KeyS':
                    keyS = false;
                    break;
                case 'KeyA':
                    keyA = false;
                    break;
                case 'KeyD':
                    keyD = false;
                    break;
                default:
            }
        });
    let mouseDownX = 0.0;
    let mouseDownY = 0.0;
    clickedMouseButton = false;

    canvas.addEventListener('mousedown', function (e) {
        if (typeof e === 'object') {
            switch (e.button) {
                case 0:
                    clickedMouseButton = true;
                    mouseDownX = e.clientX;
                    mouseDownY = e.clientY;
                    break;
            }
        }
    });

    canvas.addEventListener('mouseup', function (e) {
        if (typeof e === 'object') {
            switch (e.button) {
                case 0:
                    clickedMouseButton = false;
                    break;
            }
        }
    });
    let deltaMouse = { x: 0, y: 0 };
    canvas.addEventListener('mousemove', mouseButtonUp);
    function mouseButtonUp(e) {
        if (clickedMouseButton === true) {
            deltaMouse.x = (e.clientX - mouseDownX) * 0.1;
            mouseDownX = e.clientX;
            deltaMouse.y = (mouseDownY - e.clientY) * 0.1;
            mouseDownY = e.clientY;
        }
    }
    let deltaPosition = { forward: 0, left: 0 };
    let inputData = { "deltaPosition": deltaPosition, "deltaMouse": deltaMouse }

    let lastTime = 0;
    let delta = 0;
    return function inputLogic() {

        if (lastTime <= 0) {
            lastTime = Date.now();
            delta = 0;
        }
        else {
            delta = Date.now() - lastTime;
            lastTime = Date.now();

        }
        const speedFactor = 0.01;
        if (keyW === true) {
            deltaPosition.forward = delta*speedFactor;
        }
        else if (keyS === true) {
            deltaPosition.forward = -delta*speedFactor;
        }
        else {
            deltaPosition.forward = 0;
        }

        if (keyD === true) {
            deltaPosition.left = delta*speedFactor;
        }
        else if (keyA === true) {
            deltaPosition.left = -delta*speedFactor;
        }
        else {
            deltaPosition.left = 0;
        }
        return inputData;
    };
}
function initGUIData()
{
    const shadowMapsGUI = {
        "position x":0.0,
        "position y":0.0,
        "position z":0.0,
        "vertical angle":0.0,
        "horizontal angle":0.0,
        "scale":1.0
    }
    
    const gui = new dat.GUI();
    gui.add(shadowMapsGUI,"position x").min(-10.0).max(10.0).step(0.1);
    gui.add(shadowMapsGUI,"position y").min(-10.0).max(10.0).step(0.1);
    gui.add(shadowMapsGUI,"position z").min(-10.0).max(10.0).step(0.1);
    gui.add(shadowMapsGUI,"vertical angle").min(0.0).max(360.0).step(0.1);
    gui.add(shadowMapsGUI,"horizontal angle").min(0.0).max(360.0).step(0.1);
    gui.add(shadowMapsGUI,"scale").min(0.0).max(50.0).step(0.1);
    return function(){
        return shadowMapsGUI;
    };
}