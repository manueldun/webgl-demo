function renderQuad(gl) {
    const vertexShaderSource = `#version 300 es
    #pragma vscode_glsllint_stage : vert

    out vec2 var_coords;
    /*
    const vec4 position[4]=vec4[](
        vec4(-0.5,-0.5,0.0,1.0),//left down
        vec4(0.5,-0.5,0.0,1.0),//right down
        vec4(-0.5,0.5,0.0,1.0),//left up
        vec4(0.5,0.5,0.0,1.0)//right up
    );*/
    const vec4 position[4]=vec4[](
        vec4(-1.0,0.75,0.0,1.0),
        vec4(-0.75,0.75,0.0,1.0),
        vec4(-1.0,1.0,0.0,1.0),
        vec4(-0.75,1.0,0.0,1.0)
    );
    const vec2 coords[4]=vec2[](
        vec2(0.0,0.0),
        vec2(1.0,0.0),
        vec2(0.0,1.0),
        vec2(1.0,1.0)
    );
    void main()
    {

        gl_Position = position[gl_VertexID];
        var_coords= coords[gl_VertexID];
    }
    `;
    const fragmentShaderSource = `#version 300 es
    precision highp float;
    precision highp usampler2D;
    #pragma vscode_glsllint_stage : frag
    
    uniform highp sampler2D color_sampler;

    in vec2 var_coords;
    out vec4 out_color;
    void main()
    {
        vec4 data = texture(color_sampler, var_coords.xy);
        out_color = data;

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
    return function (depthMap) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthMap);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.enable(gl.DEPTH_TEST);
    };
}
