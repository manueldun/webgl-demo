function getModelMatrix(gltfObj) {
    let modelMatrix = glMatrix.mat4.create();
    console.log(gltfObj);
    if (gltfObj.nodes[0].scale != undefined) {
        let scaleVector = glMatrix.vec3.fromValues(
            gltfObj.nodes[0].scale[0],
            gltfObj.nodes[0].scale[1],
            gltfObj.nodes[0].scale[2]
        );
        //glMatrix.mat4.scale(modelMatrix, modelMatrix, scaleVector);
    }
    return modelMatrix;
}

async function loadGLTF(gl, path, gltfObj) {
    console.log(gltfObj);
    const loadingMessageElement = document.getElementById("loading-message");
    let loadingModelProgress = 0;
    let totalTextureProgress = 0;
    let binFileBuffersPromises = gltfObj.buffers.map((buffer) => {
        return getBinaryFile(path, buffer.uri, (e) => {
            if (e.lengthComputable)
                loadingModelProgress = ((e.loaded / e.total) * 100).toFixed(2);


            loadingMessageElement.innerHTML = "Model: " + loadingModelProgress + " %" +
                "Textures: " + (totalTextureProgress / gltfObj.images.length).toFixed(2) + "%";
        });
    });




    let glTextures = gltfObj.images.map(async (image) => {

        image.loadingProgress = 0;
        const imageURI = image.uri;

        const colorImagePromise = loadImage(path, imageURI, (e) => {
            if (e.lengthComputable)
                image.loadingProgress = parseInt((e.loaded / e.total) * 100);

            totalTextureProgress = gltfObj.images.reduce((acumulator, current) => {
                return acumulator + current.loadingProgress;
            }, 0);

            loadingMessageElement.innerHTML = "Model: " + loadingModelProgress + " %" +
                "Textures: " + (totalTextureProgress / gltfObj.images.length).toFixed(2) + "%";

        });

        const colorImage = await colorImagePromise;
        const glTexture = gl.createTexture();
        glTexture.loadingTexturesProgress;
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        if (/^.*\.png/.test(image.uri)) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorImage);
        }
        else if (/^.*\.jpg/.test(image.uri)) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, colorImage);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        glTexture.uri = imageURI;
        glTexture.colorImage = colorImage;
        return glTexture;
    });
    glTextures = await Promise.all(glTextures);
    const rawBufferFiles = await Promise.all(binFileBuffersPromises);

    const bufferSlices = gltfObj.bufferViews.map((bufferView) => {

        let rawBufferFile = rawBufferFiles[bufferView.buffer];
        let bufferSlice = rawBufferFile.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);

        return bufferSlice;
    });

    const positionAttributeLocation = 0;
    const normalAttributeLocation = 1;
    const texCoordAttributeLocation = 2;
    const tangentAttributeLocation = 3;


    let drawblesPromises = gltfObj.meshes[0].primitives.map(async (primitive) => {

        let drawble = {};
        drawble.vao = gl.createVertexArray();

        gl.bindVertexArray(drawble.vao);

        //position Attribute
        gl.enableVertexAttribArray(positionAttributeLocation);

        const positionAccessorIndex = primitive.attributes.POSITION;
        const positionAccessor = gltfObj.accessors[positionAccessorIndex];
        const positionBufferviewIndex = positionAccessor.bufferView;
        const positionAttributeBuffer = bufferSlices[positionBufferviewIndex];


        const glPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionAttributeBuffer, gl.STATIC_DRAW);


        let size;//components per iteration
        switch (positionAccessor.type) {
            case "SCALAR":
                size = 1;
                break;
            case "VEC2":
                size = 2;
                break;
            case "VEC3":
                size = 3;
                break;
            case "VEC4":
                size = 4;
                break;
            default:
                size = 0;
                console.error("invalid type");
                break;
        }
        let type = gl.FLOAT;   // the data is 32bit floats
        let normalize = false; // don't normalize the data
        let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = positionAccessor.byteOffset;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);



        //texCoord Attribute
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        const texCoordAccessorIndex = primitive.attributes.TEXCOORD_0;
        const texCoordAccessor = gltfObj.accessors[texCoordAccessorIndex];
        const texCoordBufferViewIndex = texCoordAccessor.bufferView;
        const texCoordAttributeBuffer = bufferSlices[texCoordBufferViewIndex];


        const glTexCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoordAttributeBuffer, gl.STATIC_DRAW);


        switch (texCoordAccessor.type) {
            case "SCALAR":
                size = 1;
                break;
            case "VEC2":
                size = 2;
                break;
            case "VEC3":
                size = 3;
                break;
            case "VEC4":
                size = 4;
                break;
            default:
                size = 0;
                console.error("invalid type");
                break;
        }
        type = gl.FLOAT;   // the data is 32bit floats
        normalize = false; // don't normalize the data
        stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset);


        //normal Attribute
        gl.enableVertexAttribArray(normalAttributeLocation);
        const normalAccessorIndex = primitive.attributes.NORMAL;
        const normalAccessor = gltfObj.accessors[normalAccessorIndex];
        const normalBufferViewIndex = normalAccessor.bufferView;
        const normalAttributeBuffer = bufferSlices[normalBufferViewIndex];
        //create normal buffer


        const glNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normalAttributeBuffer, gl.STATIC_DRAW);
        switch (normalAccessor.type) {
            case "SCALAR":
                size = 1;
                break;
            case "VEC2":
                size = 2;
                break;
            case "VEC3":
                size = 3;
                break;
            case "VEC4":
                size = 4;
                break;
            default:
                size = 0;
                console.error("invalid type");
                break;
        }
        type = gl.FLOAT;   // the data is 32bit floats
        normalize = false; // don't normalize the data
        stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        offset = normalAccessor.byteOffset;        // start at the beginning of the buffer
        gl.vertexAttribPointer(normalAttributeLocation, size, type, normalize, stride, offset);


        //tangent Attribute
        //gl.enableVertexAttribArray(tangentAttributeLocation);
        const tangentAccessorIndex = primitive.attributes.TANGENT;
        
        drawble.tangentAttributeLocation = null;
        if (tangentAccessorIndex!=undefined) {

            const tangentAccessor = gltfObj.accessors[tangentAccessorIndex];
            const tangentBufferViewIndex = tangentAccessor.bufferView;
            const tangentBufferView = gltfObj.bufferViews[tangentBufferViewIndex];
            const tangentAttributeBuffer = bufferSlices[tangentBufferViewIndex];

            //create tangentBuffer

            const glTangentBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glTangentBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, tangentAttributeBuffer, gl.STATIC_DRAW);
            switch (tangentAccessor.type) {
                case "SCALAR":
                    size = 1;
                    break;
                case "VEC2":
                    size = 2;
                    break;
                case "VEC3":
                    size = 3;
                    break;
                case "VEC4":
                    size = 4;
                    break;
                default:
                    size = 0;
                    console.error("invalid type");
                    break;
            }
            type = gl.FLOAT;   // the data is 32bit floats
            normalize = false; // don't normalize the data
            stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            offset = tangentAccessor.byteOffset;        // start at the beginning of the buffer
            gl.vertexAttribPointer(tangentAttributeLocation, size, type, normalize, stride, offset);
            
            drawble.tangentAttributeLocation = tangentAttributeLocation;
        }
        //index Attribute


        const indexAccessorIndex = primitive.indices;
        const indexAccessor = gltfObj.accessors[indexAccessorIndex];
        const indexBufferViewIndex = indexAccessor.bufferView;
        const indexAttributeBuffer = bufferSlices[indexBufferViewIndex];

        const glElementArray = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glElementArray);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexAttributeBuffer, gl.STATIC_DRAW);



        drawble.count = indexAccessor.count;
        drawble.indiceType = indexAccessor.componentType;
        drawble.positionAttributeLocation = positionAttributeLocation;
        drawble.normalAttributeLocation = normalAttributeLocation;
        drawble.texCoordAttributeLocation = texCoordAttributeLocation;

        const materialIndex = primitive.material;
        const material = gltfObj.materials[materialIndex];

        const colorTextureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
        const imageIndex = gltfObj.textures[colorTextureIndex].source;

        if(material.normalTexture!=undefined)
        {
            const normalTextureIndex = material.normalTexture.index;
            const imageNormalIndex = gltfObj.textures[normalTextureIndex].source;
            drawble.glNormalTexture = glTextures[imageNormalIndex];
        }

        drawble.glTexture = glTextures[imageIndex];


        return drawble;

    });

    const drawbles = await Promise.all(drawblesPromises);
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const vertexShaderSource = await getStringFile("/shaders/", "shader.vs");
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    let success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    if (!success) {
        console.log(gl.getShaderInfoLog(vertexShader));
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    const fragmentShaderSource = await getStringFile("/shaders/", "shader.fs");
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

    const mvpUniformLocation = gl.getUniformLocation(program, "mvp");
    const rotationMatrixUniform = gl.getUniformLocation(program, "rotationMatrix");
    const colorSamplerUniformLocation = gl.getUniformLocation(program, "color_sampler");
    const normalSamplerUniformLocation = gl.getUniformLocation(program, "normal_sampler");
    const shadowMapSamplerUniformLocation = gl.getUniformLocation(program, "shadowMap_sampler");
    const projectedShadowMapMatrixUniformLocation = gl.getUniformLocation(program, "shadowMapMatrix");
    const lightOriginUniformLocation = gl.getUniformLocation(program, "shadowMapPosition");

    const depthTexture = gl.createTexture();
    const fb = gl.createFramebuffer();

    

    // bind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const depthTextureSize = 2048;
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    //gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // mip level
        gl.DEPTH_COMPONENT32F , // internal format
        depthTextureSize,   // width
        depthTextureSize,   // height
        0,                  // border
        gl.DEPTH_COMPONENT, // format
        gl.FLOAT,           // type
        null);              // data
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,       // target
        gl.DEPTH_ATTACHMENT,  // attachment point
        gl.TEXTURE_2D,        // texture target
        depthTexture,         // texture
        0);                   // mip level

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);




    let shadowMapProgram = gl.createProgram();
    {
        const vertexShaderSource =
            `#version 300 es
        #pragma vscode_glsllint_stage : vert

        layout(location = 0) in vec3 attrib_position;

        
        uniform mat4 shadowMapMatrix;

        void main()
        {
            gl_Position = shadowMapMatrix*vec4(attrib_position,1.0);
        }
        `;
        const fragmentShaderSource =
            `#version 300 es
        precision highp float;
        #pragma vscode_glsllint_stage : frag
        
        
        out vec4 out_color;
        void main()
        {
            out_color = vec4(0.0,0.0,0.0,1.0);
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

        gl.attachShader(shadowMapProgram, vertexShader);
        gl.attachShader(shadowMapProgram, fragmentShader);
        gl.linkProgram(shadowMapProgram);


        success = gl.getProgramParameter(shadowMapProgram, gl.LINK_STATUS);
        if (!success) {
            console.log(gl.getProgramInfoLog(shadowMapProgram));
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

    }

    const lightShadowMapPositionUniform = gl.getUniformLocation(shadowMapProgram, "shadowMapPosition");
    const rotationShadowMapMatrixUniform = gl.getUniformLocation(shadowMapProgram, "shadowMapRotation");
    const scaleShadowMapUniform = gl.getUniformLocation(shadowMapProgram, "shadowMapScale");
    const shadowMapMatrixUniform = gl.getUniformLocation(shadowMapProgram, "shadowMapMatrix");


    return {
        modelMatrix: getModelMatrix(gltfObj),
        drawShadowMap: function (uniforms) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            //gl.clearColor(1.0,1.0,1.0,1.0);
            //gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
            //gl.clearBufferuiv(gl.COLOR, 0, new Uint32Array([100, 0, 0, 0]));

            
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, depthTextureSize, depthTextureSize);
            gl.useProgram(shadowMapProgram);
            drawbles.map((drawble) => {

                //gl.bindTexture(gl.TEXTURE_2D, drawble.glTexture);
                //gl.uniform3fv(lightShadowMapPositionUniform, uniforms.position);
                //gl.uniformMatrix3fv(rotationShadowMapMatrixUniform, false, uniforms.rotationMatrix);
                
                gl.uniformMatrix4fv(shadowMapMatrixUniform, false, uniforms.inverse);
                //gl.uniform1f(scaleShadowMapUniform, uniforms.scale);

                gl.bindVertexArray(drawble.vao);

                gl.enableVertexAttribArray(positionAttributeLocation);
                gl.drawElements(gl.TRIANGLES, drawble.count, drawble.indiceType, 0);


            });


            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return depthTexture;
        },
        draw: function (uniformMatrices,shadowMap,shadowMapUniforms) {

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


            gl.useProgram(program);
            drawbles.map((drawble) => {
                gl.uniformMatrix3fv(rotationMatrixUniform, false, shadowMapUniforms.rotationMatrix);
                gl.uniformMatrix4fv(mvpUniformLocation, false, uniformMatrices.mvpMatrix);
                gl.uniformMatrix4fv(projectedShadowMapMatrixUniformLocation, false, shadowMapUniforms.inverse);

                gl.uniform3fv(lightOriginUniformLocation, shadowMapUniforms.position);
                
                gl.uniform1i(colorSamplerUniformLocation, 0);
                gl.uniform1i(shadowMapSamplerUniformLocation, 1);
                gl.uniform1i(normalSamplerUniformLocation, 2);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, drawble.glTexture);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, shadowMap);
                if(drawble.glNormalTexture!=undefined)
                {
                    gl.activeTexture(gl.TEXTURE2);
                    gl.bindTexture(gl.TEXTURE_2D, drawble.glNormalTexture);
                }

                gl.bindVertexArray(drawble.vao);

                gl.enableVertexAttribArray(positionAttributeLocation);
                gl.enableVertexAttribArray(texCoordAttributeLocation);
                gl.enableVertexAttribArray(normalAttributeLocation);
                if (drawble.tangentAttributeLocation!=null) {
                    gl.enableVertexAttribArray(drawble.tangentAttributeLocation);
                }

                gl.drawElements(gl.TRIANGLES, drawble.count, drawble.indiceType, 0);
            });
        }
    };
}
async function loadSponza(gl) {
    const objFile = JSON.parse(await getStringFile("sponza/", "Sponza.gltf"));
    return loadGLTF(gl, "sponza/", objFile);
}
