function inject_and_propagate(images)
{
    let light_volume = [];
    const light_volume_dimention = 20;
    for(let i=0;i<light_volume_dimention*light_volume_dimention*light_volume_dimention;i++)
    {
        light_volume.push([0.0,0.0,0.0,0.0])
    }
    const num_of_samples = 30;
    for(let i=0;i<num_of_samples;i++)
    {
        const random_x=Math.random()*512;
        const random_y=Math.random()*512;
        const normal = [images.normalTexture[random_x%512*3+Math.floor(random_y/512*3)],images.normalTexture[random_x%512*3+Math.floor(random_y/512*3)+1,images.normalTexture[random_x%512*3+Math.floor(random_y/512*3)]+2]];

    }
}
async function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];

    const gl = canvasElement.getContext("webgl2", { antialias: false });

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

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
        "<p>Your device does is not capable!</p>";
    return;
      }
    //input logic
    const updateOnInput = initInputLogic(canvasElement);
    const getUniformMatrices = initViewProjectionMatrix(canvasElement);
    const updateGUIData = initGUIData();

    let sponzaDrawable = await loadGLTF(gl, ["sponza/Sponza.gltf"]);
    let sphereDrawable = await loadGLTF(gl, ["sphere/sphere.gltf"]);
    let cubeDrawble = getDrawbleShadowMapCube(gl);
    let quad = renderQuad(gl);

    loadingMessageElement.style.display = "none";

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    const cosine_weighed_sh = precompute_sh_cosineWeight(100000);
    console.log(cosine_weighed_sh);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    const loop = () => {
        let inputData = updateOnInput();
        let uniformMatrices = getUniformMatrices(
            inputData,
            sponzaDrawable.modelMatrix
        );

        const shadowMapUniforms = getShadowMapUniforms(updateGUIData());
        const shadowMap = sponzaDrawable.drawShadowMap(shadowMapUniforms);
        
        const rsm = sponzaDrawable.drawRSM(shadowMapUniforms);
        gl.viewport(
            0,
            0,
            canvasElement.offsetWidth,
            canvasElement.offsetHeight
        );

        canvasElement.width = canvasElement.offsetWidth;
        canvasElement.height = canvasElement.offsetHeight;
        sponzaDrawable.draw(uniformMatrices, shadowMapUniforms);
        cubeDrawble.draw(uniformMatrices, shadowMapUniforms);
        quad(rsm.fb.textures.normalTexture.texture);

        window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
    
}
window.onload = main;
