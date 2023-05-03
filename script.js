async function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];

    const gl = canvasElement.getContext("webgl2", { antialias: false });

    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const loadingMessageElement = document.getElementById("loading-message");
    if (!gl) {
        loadingMessageElement.innerHTML =
            "<p>Your device does not support WebGL 2!</p>";
        return;
    }
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
        loadingMessageElement.innerHTML =
        "<p>Your device is not suitable!</p>";
    return;
      }
    //input logic
    const updateOnInput = initInputLogic(canvasElement);
    const getUniformMatrices = initViewProjectionMatrix(canvasElement);
    const updateGUIData = initGUIData();

    let sponzaDrawable = await loadSponza(gl);
    let cubeDrawble = getDrawbleShadowMapCube(gl);
    let quad = renderQuad(gl);

    loadingMessageElement.style.display = "none";

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    const loop = () => {
        let inputData = updateOnInput();
        let uniformMatrices = getUniformMatrices(
            inputData,
            sponzaDrawable.modelMatrix
        );

        const shadowMapUniforms = getShadowMapUniforms(updateGUIData());
        const shadowMap = sponzaDrawable.drawShadowMap(shadowMapUniforms);
        gl.viewport(
            0,
            0,
            canvasElement.offsetWidth,
            canvasElement.offsetHeight
        );

        canvasElement.width = canvasElement.offsetWidth;
        canvasElement.height = canvasElement.offsetHeight;
        sponzaDrawable.draw(uniformMatrices, shadowMap, shadowMapUniforms);
        cubeDrawble.draw(uniformMatrices, shadowMapUniforms);
        quad(shadowMap);

        window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
    
}
window.onload = main;
