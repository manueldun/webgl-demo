function getDrawbleShadowMapCube(gl) {
    const positionAttributeLocation = 0;
    const vaoBack = gl.createVertexArray();
    gl.bindVertexArray(vaoBack);
    gl.enableVertexAttribArray(positionAttributeLocation);
    const glBackBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glBackBuffer);
    const backPositionArray = [
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(backPositionArray), gl.STATIC_DRAW);
    {
        const size = 3;
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    }
    const indexBackBuffer = [0, 1, 2, 3];
    const glElementArrayBack = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glElementArrayBack);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBackBuffer), gl.STATIC_DRAW);


    const vaoMiddle = gl.createVertexArray();
    gl.bindVertexArray(vaoMiddle);
    gl.enableVertexAttribArray(positionAttributeLocation);
    const glMiddleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glMiddleBuffer);
    const middlePositionArray = [
        -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0,

        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        -1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(middlePositionArray), gl.STATIC_DRAW);

    {
        const size = 3;
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    }

    const indexMiddleBuffer = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const glElementArrayBackMiddle = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glElementArrayBackMiddle);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexMiddleBuffer), gl.STATIC_DRAW);


    const vaoFar = gl.createVertexArray();
    gl.bindVertexArray(vaoFar);
    gl.enableVertexAttribArray(positionAttributeLocation);
    const glFarBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glFarBuffer);
    const farPositionArray = [
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(farPositionArray), gl.STATIC_DRAW);
    {
        const size = 3;
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    }
    const indexFarBuffer = [0, 1, 2, 3];
    const glElementArrayFar = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glElementArrayFar);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexFarBuffer), gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    const vertexShaderSource =
        `#version 300 es
    #pragma vscode_glsllint_stage : vert

    layout(location = 0) in vec3 attrib_position;
    uniform mat3 cubeRotation;
    uniform vec3 cubePosition;
    uniform float cubeScale;
    uniform mat4 inverseCubeMatrix;

    uniform mat4 mvp;

    void main()
    {
        vec4 out_position= inverseCubeMatrix*vec4(attrib_position,1.0);
        gl_Position = mvp*out_position;
    }
    `;
    const fragmentShaderSource =
        `#version 300 es
    precision highp float;
    #pragma vscode_glsllint_stage : frag
    
    uniform vec3 color;


    out vec4 out_color;
    void main()
    {
        out_color = vec4(color,1.0);
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

    const colorUniformLocation = gl.getUniformLocation(program, "color");

    const rotationMatrixUnifromLocation = gl.getUniformLocation(program, "cubeRotation");
    const displacementUniformLocation = gl.getUniformLocation(program, "cubePosition");
    const scaleUniformLocation  = gl.getUniformLocation(program, "cubeScale");
    const inverseCubeMatrixUniform  = gl.getUniformLocation(program, "inverseCubeMatrix");

    const redColorUniform = glMatrix.vec3.fromValues(1.0, 0.0, 0.0);
    const greenColorUniform = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
    const blueColorUniform = glMatrix.vec3.fromValues(0.0, 0.0, 1.0);



    const mvpUniformLocation = gl.getUniformLocation(program, "mvp");
    return {
        draw: function (uniforms,cubeUniforms) {
            gl.useProgram(program);

            gl.bindVertexArray(vaoBack);

            gl.uniformMatrix3fv(rotationMatrixUnifromLocation, false, cubeUniforms.rotationMatrix);
            gl.uniformMatrix4fv(inverseCubeMatrixUniform, false, cubeUniforms.matrix);
            gl.uniform3fv(displacementUniformLocation, cubeUniforms.position);
            gl.uniform1f(scaleUniformLocation, cubeUniforms.scale);

            gl.uniform3fv(colorUniformLocation, redColorUniform);

            gl.uniformMatrix4fv(mvpUniformLocation, false, uniforms.mvpMatrix);

            gl.drawElements(gl.LINE_LOOP, 4, gl.UNSIGNED_SHORT, 0);

            gl.bindVertexArray(vaoMiddle);

            gl.uniformMatrix3fv(rotationMatrixUnifromLocation, false, cubeUniforms.rotationMatrix);
            gl.uniformMatrix4fv(inverseCubeMatrixUniform, false, cubeUniforms.matrix);
            gl.uniform3fv(displacementUniformLocation, cubeUniforms.position);
            gl.uniform1f(scaleUniformLocation, cubeUniforms.scale);


            gl.uniform3fv(colorUniformLocation, greenColorUniform);

            gl.uniformMatrix4fv(mvpUniformLocation, false, uniforms.mvpMatrix);

            gl.drawElements(gl.LINES, 8, gl.UNSIGNED_SHORT, 0);

            gl.bindVertexArray(vaoFar);

            gl.uniformMatrix3fv(rotationMatrixUnifromLocation, false, cubeUniforms.rotationMatrix);
            gl.uniformMatrix4fv(inverseCubeMatrixUniform, false, cubeUniforms.matrix);
            gl.uniform3fv(displacementUniformLocation, cubeUniforms.position);
            gl.uniform1f(scaleUniformLocation, cubeUniforms.scale);


            gl.uniform3fv(colorUniformLocation, blueColorUniform);

            gl.uniformMatrix4fv(mvpUniformLocation, false, uniforms.mvpMatrix);

            gl.drawElements(gl.LINE_LOOP, 4, gl.UNSIGNED_SHORT, 0);
        }
    };
}
