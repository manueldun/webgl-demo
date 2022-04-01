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

    
    canvas.addEventListener('touchstart', (e)=>{

        e.preventDefault();
        const touches = e.changedTouches;
        clickedMouseButton = true;
        mouseDownX = touches[0].pageX;
        mouseDownY = touches[0].pageY;
    }

    );
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

    canvas.addEventListener('touchend', (e)=>{
        
        e.preventDefault();
        clickedMouseButton = false;
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
    
    canvas.addEventListener('touchmove', (e)=>{
        
        e.preventDefault();
        
        const touches = e.changedTouches;
        if (clickedMouseButton === true) {
            deltaMouse.x = (touches[0].pageX - mouseDownX) * 0.1;
            mouseDownX = touches[0].pageX;
            deltaMouse.y = (mouseDownY - touches[0].pageY) * 0.1;
            mouseDownY = touches[0].pageY;
        }
    });
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
        const speedFactor = 1;
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
        "vertical angle":73.46,
        "horizontal angle":54.25,
        "scale":1900.0
    }
    
    const gui = new dat.GUI();
    gui.add(shadowMapsGUI,"vertical angle").min(0.0).max(180.0).step(0.0001);
    gui.add(shadowMapsGUI,"horizontal angle").min(0.0).max(180.0).step(0.0001);
    return function(){
        return shadowMapsGUI;
    };
}