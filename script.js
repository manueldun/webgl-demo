async function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];

    canvasElement.width = 1280;
    canvasElement.style.width = 1280;
    canvasElement.height = 720;
    canvasElement.style.height = 720;

    const gl = canvasElement.getContext('webgl2', {antialias : false});

    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const loadingMessageElement = document.getElementById("loading-message");
    if (!gl) {
        loadingMessageElement.innerHTML = "Your device does not support WebGL 2!";
        return;
    }
    else {

        //input logic
        const updateOnInput = initInputLogic(canvasElement);
        const getUniformMatrices = initViewProjectionMatrix();
        const updateGUIData = initGUIData();

        let sponzaDrawable = await loadSponza(gl);
        let cubeDrawble = getDrawbleShadowMapCube(gl);
        let quad = renderQuad(gl);

        loadingMessageElement.style.display = "none";
        
        
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        const loop = () => {
            let inputData = updateOnInput();
            let uniformMatrices = getUniformMatrices(inputData, sponzaDrawable.modelMatrix);

            const shadowMapUniforms = getShadowMapUniforms(updateGUIData());
            const shadowMap = sponzaDrawable.drawShadowMap(shadowMapUniforms);
            sponzaDrawable.draw(uniformMatrices,shadowMap,shadowMapUniforms);
            cubeDrawble.draw(uniformMatrices,shadowMapUniforms);
            quad(shadowMap);

            window.requestAnimationFrame(loop);
        }
        window.requestAnimationFrame(loop)
    }

}
window.onload = main;