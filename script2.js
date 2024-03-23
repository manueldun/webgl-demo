//const canvasElement = document.getElementsByTagName("canvas")[0];
//renderer = new Renderer(canvasElement);//TODO make static
function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];

        
    canvasElement.width = canvasElement.offsetWidth;
    canvasElement.height = canvasElement.offsetHeight;
        
    const renderer = new Renderer(canvasElement);//TODO make static

    const camera = new Camera(canvasElement);
    const drawblePromise = Drawble.AsyncDrawble(renderer.gl,"./sponza/Sponza.gltf");

    const mainShaderProgramPromise = ShaderProgram.loadShaderFiles(renderer.gl,"./shaders/shader.vs","./shaders/shader.fs");
    const gui = new GUI();
    Promise.all([drawblePromise,mainShaderProgramPromise])
    .then((result)=>
    {
        const drawble = result[0];
        const mainShaderProgram = result[1];
        let defaultRenderPass = new DefaultRenderPass(renderer.gl,mainShaderProgram,canvasElement.offsetWidth,canvasElement.offsetHeight);
        const shadowMapRenderPass = new ShadowmapRenderPass(renderer.gl,2048,2048);
        const rsmRenderPass= new RSMRenderPass(renderer.gl,512,512);
        const loop = ()=>{
            
            shadowMapRenderPass.shadowMapMatrix = gui.shadowMapMatrix;
            rsmRenderPass.shadowMapMatrix = gui.shadowMapMatrix;
            renderer.draw(drawble,shadowMapRenderPass);
            renderer.draw(drawble,rsmRenderPass);

            defaultRenderPass.projectionMatrix = camera.cameraMatrices.projectionMatrix;
            defaultRenderPass.cameraPosition = camera.cameraMatrices.cameraPosition;
            defaultRenderPass.viewMatrix = camera.cameraMatrices.viewMatrix;

            defaultRenderPass.shadowMap = shadowMapRenderPass.shadowMap;
            defaultRenderPass.rsm = rsmRenderPass.rsm;

            defaultRenderPass.shadowMapMatrix = shadowMapRenderPass.shadowMapMatrix;

            renderer.draw(drawble,defaultRenderPass);
            window.requestAnimationFrame(loop);
        };
        
        window.requestAnimationFrame(loop);
    })

}
window.onload = main;   