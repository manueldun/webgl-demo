function renderQuad(gl)
{
    const vertexShaderSource =
        `#version 300 es
    #pragma vscode_glsllint_stage : vert

    out vec2 var_coords;
    void main()
    {
        if(gl_VertexID==0)
        {
            gl_Position = vec4(-1.0,0.75,0.0,1.0);
            var_coords= vec2(0.0,0.0);
        }
        if(gl_VertexID==1)
        {
            gl_Position = vec4(-1.0,1.0,0.0,1.0);
            var_coords= vec2(0.0,1.0);
        }
        if(gl_VertexID==2)
        {
            gl_Position = vec4(-0.75,0.75,0.0,1.0);
            var_coords= vec2(1.0,0.0);
        }
        if(gl_VertexID==3)
        {
            gl_Position = vec4(-0.75,1.0,0.0,1.0);
            var_coords= vec2(1.0,1.0);
        }
    }
    `;
    const fragmentShaderSource =
        `#version 300 es
    precision highp float;
    precision highp usampler2D;
    #pragma vscode_glsllint_stage : frag
    
    uniform highp usampler2D color_sampler;

    in vec2 var_coords;
    out vec4 out_color;
    void main()
    {
        vec4 data = vec4(texture(color_sampler, var_coords.xy));
        out_color = vec4(data.r/255.0,0.0,0.0,1.0);

    }
    `;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    let success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    if (!success) {
        console.log(gl.getShaderInfoLog(vertexShader));
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    if (!success) {
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);


    success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.log(gl.getProgramInfoLog(program));
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return function(depthMap)
    {
        gl.viewport(0,0,1280,720);   
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(program);
        gl.bindTexture(gl.TEXTURE_2D, depthMap);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        gl.enable(gl.DEPTH_TEST);
    };
}
