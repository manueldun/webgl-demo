//const canvasElement = document.getElementsByTagName("canvas")[0];
//renderer = new Renderer(canvasElement);//TODO make static
function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];
    const renderer = new Renderer(canvasElement);//TODO make static

    const camera = new Camera(canvasElement);
    const drawblePromise = Drawble.AsyncDrawble(renderer.gl,"./sponza/Sponza.gltf");

    const mainShaderProgramPromise = ShaderProgram.loadShaderFiles(renderer.gl,"./shaders/shader.vs","./shaders/shader.fs");
    const input = initInputLogic(canvasElement);
    
    Promise.all([drawblePromise,mainShaderProgramPromise])
    .then((result)=>
    {
        const drawble = result[0];
        const mainShaderProgram = result[1];
        const loop = ()=>{
            
            renderer.viewMatrix = camera.cameraMatrices.viewMatrix;
            renderer.draw(drawble,mainShaderProgram);
            window.requestAnimationFrame(loop);
        };
        
        window.requestAnimationFrame(loop);
    })

}
window.onload = main;   