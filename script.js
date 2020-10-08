

async function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];

    canvasElement.width = 1280;
    canvasElement.style.width = 1280;
    canvasElement.height = 720;
    canvasElement.style.height = 720;

    const gl = canvasElement.getContext('webgl2');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const loadingMessageElement = document.getElementById("loading-message");
    if (!gl) {
        loadingMessageElement.innerHTML = "Your device does not support WebGL 2!";
        return;
    }
    else {

        //input logic
        const updateOnInput = initInputLogic(canvasElement)
        const getViewProjectionMatrix = initViewProjectionMatrix();

        let drawwable = await loadSponza(gl);

        loadingMessageElement.style.display = "none";
        const loop = () => {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            let inputData = updateOnInput();
            let mvp = getViewProjectionMatrix(inputData, drawwable.modelMatrix);

            drawwable.draw(mvp);
            window.requestAnimationFrame(loop);
        }
        window.requestAnimationFrame(loop)
    }

}
window.onload = main;