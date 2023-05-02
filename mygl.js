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
function createTexture(gl,width,height,internalFormat,format,type)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    //gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(
        gl.TEXTURE_2D, // target
        0, // mip level
        internalFormat,//gl.DEPTH_COMPONENT32F, // internal format
        width, // width
        height, // height
        0, // border
        format,//gl.DEPTH_COMPONENT, // format
        type, //gl.FLOAT// type
        null // data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return {width:width,height:height,texture:texture};
}
function createDepthTextureFramebuffer(gl,width,height)
{
    const vertexShaderShadowMap = `#version 300 es
    #pragma vscode_glsllint_stage : vert

    layout(location = 0) in vec3 attrib_position;

    
    uniform mat4 shadowMapMatrix;

    void main()
    {
        gl_Position = shadowMapMatrix*vec4(attrib_position,1.0);
    }
    `;
    const fragmentShaderShadowMap = `#version 300 es
    precision highp float;
    #pragma vscode_glsllint_stage : frag
    
    
    out vec4 out_color;
    void main()
    {
        out_color = vec4(0.0,0.0,0.0,1.0);
    }
    `;
    const shadowMapProgram = compileShaderProgram(gl,vertexShaderShadowMap,fragmentShaderShadowMap);
    const texture = createTexture(gl,width,height,gl.DEPTH_COMPONENT32F,gl.DEPTH_COMPONENT,gl.FLOAT);
    return {
        ...createFramebuffer(gl,texture,gl.DEPTH_ATTACHMENT),
        program:shadowMapProgram}; 
}
function createFramebuffer(gl,texture,attachmentPoint){
    const fb = gl.createFramebuffer();
    console.log({texture});
    // bind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, // target
        attachmentPoint,//gl.DEPTH_ATTACHMENT, // attachment point
        gl.TEXTURE_2D, // texture target
        texture.texture, // texture
        0 // mip level
    );

    const completeness = gl.checkFramebufferStatus(fb);
    if(completeness!=gl.COMPLETE)
    {
        console.log("frame buffer incomplete");
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {frameBuffer:fb,texture:texture};

}
function compileShaderProgram(gl,vertexShaderSource,fragmentShaderSource)
{    

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
    return program;
    
}
async function loadGLTF(gl, path) {
    const currentDirectory = path.slice(0, path.lastIndexOf("/") + 1);
    const gltfObj = JSON.parse(await getStringFile(path));
    const loadingMessageElement = document.getElementById("loading-message");
    let loadingModelProgress = 0;
    let totalTextureProgress = 0;
    let binFileBuffersPromises = gltfObj.buffers.map((buffer) => {
        return getBinaryFile(currentDirectory + buffer.uri, (e) => {
            if (e.lengthComputable)
                loadingModelProgress = ((e.loaded / e.total) * 100).toFixed(2);

            loadingMessageElement.innerHTML =
                "<p>Model: " +
                loadingModelProgress +
                " % <br>" +
                "Textures: " +
                (totalTextureProgress / gltfObj.images.length).toFixed(2) +
                "%</p>";
        });
    });

    let glTextures = gltfObj.images.map(async (image) => {
        image.loadingProgress = 0;
        const imageURI = image.uri;

        const colorImagePromise = loadImage(
            currentDirectory + imageURI,
            (e) => {
                if (e.lengthComputable)
                    image.loadingProgress = parseInt(
                        (e.loaded / e.total) * 100
                    );

                totalTextureProgress = gltfObj.images.reduce(
                    (acumulator, current) => {
                        return acumulator + current.loadingProgress;
                    },
                    0
                );

                loadingMessageElement.innerHTML =
                    "<p>Model: " +
                    loadingModelProgress +
                    " % <br>" +
                    "Textures: " +
                    (totalTextureProgress / gltfObj.images.length).toFixed(2) +
                    "%</p>";
            }
        );

        const colorImage = await colorImagePromise;
        const glTexture = gl.createTexture();
        glTexture.loadingTexturesProgress;
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        if (/^.*\.png/.test(image.uri)) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                colorImage
            );
        } else if (/^.*\.jpg/.test(image.uri)) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGB,
                gl.RGB,
                gl.UNSIGNED_BYTE,
                colorImage
            );
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
        let bufferSlice = rawBufferFile.slice(
            bufferView.byteOffset,
            bufferView.byteOffset + bufferView.byteLength
        );

        return bufferSlice;
    });

    const positionAttributeLocation = 0;
    const normalAttributeLocation = 1;
    const texCoordAttributeLocation = 2;
    const tangentAttributeLocation = 3;

    let drawblesPromises = gltfObj.meshes[0].primitives.map(
        async (primitive) => {
            let drawble = {};
            drawble.vao = gl.createVertexArray();

            gl.bindVertexArray(drawble.vao);

            //position Attribute
            gl.enableVertexAttribArray(positionAttributeLocation);

            const positionAccessorIndex = primitive.attributes.POSITION;
            const positionAccessor = gltfObj.accessors[positionAccessorIndex];
            const positionBufferviewIndex = positionAccessor.bufferView;
            const positionAttributeBuffer =
                bufferSlices[positionBufferviewIndex];

            const glPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glPositionBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                positionAttributeBuffer,
                gl.STATIC_DRAW
            );

            let size; //components per iteration
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
            let type = gl.FLOAT; // the data is 32bit floats
            let normalize = false; // don't normalize the data
            let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
            let offset = positionAccessor.byteOffset; // start at the beginning of the buffer
            gl.vertexAttribPointer(
                positionAttributeLocation,
                size,
                type,
                normalize,
                stride,
                offset
            );

            //texCoord Attribute
            gl.enableVertexAttribArray(texCoordAttributeLocation);
            const texCoordAccessorIndex = primitive.attributes.TEXCOORD_0;
            const texCoordAccessor = gltfObj.accessors[texCoordAccessorIndex];
            const texCoordBufferViewIndex = texCoordAccessor.bufferView;
            const texCoordAttributeBuffer =
                bufferSlices[texCoordBufferViewIndex];

            const glTexCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glTexCoordBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                texCoordAttributeBuffer,
                gl.STATIC_DRAW
            );

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
            type = gl.FLOAT; // the data is 32bit floats
            normalize = false; // don't normalize the data
            stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
            offset = 0; // start at the beginning of the buffer
            gl.vertexAttribPointer(
                texCoordAttributeLocation,
                size,
                type,
                normalize,
                stride,
                offset
            );

            //normal Attribute
            gl.enableVertexAttribArray(normalAttributeLocation);
            const normalAccessorIndex = primitive.attributes.NORMAL;
            const normalAccessor = gltfObj.accessors[normalAccessorIndex];
            const normalBufferViewIndex = normalAccessor.bufferView;
            const normalAttributeBuffer = bufferSlices[normalBufferViewIndex];
            //create normal buffer

            const glNormalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, glNormalBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                normalAttributeBuffer,
                gl.STATIC_DRAW
            );
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
            type = gl.FLOAT; // the data is 32bit floats
            normalize = false; // don't normalize the data
            stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
            offset = normalAccessor.byteOffset; // start at the beginning of the buffer
            gl.vertexAttribPointer(
                normalAttributeLocation,
                size,
                type,
                normalize,
                stride,
                offset
            );

            //tangent Attribute
            //gl.enableVertexAttribArray(tangentAttributeLocation);
            const tangentAccessorIndex = primitive.attributes.TANGENT;

            drawble.tangentAttributeLocation = null;
            if (tangentAccessorIndex != undefined) {
                const tangentAccessor = gltfObj.accessors[tangentAccessorIndex];
                const tangentBufferViewIndex = tangentAccessor.bufferView;
                const tangentBufferView =
                    gltfObj.bufferViews[tangentBufferViewIndex];
                const tangentAttributeBuffer =
                    bufferSlices[tangentBufferViewIndex];

                //create tangentBuffer

                const glTangentBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, glTangentBuffer);
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    tangentAttributeBuffer,
                    gl.STATIC_DRAW
                );
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
                type = gl.FLOAT; // the data is 32bit floats
                normalize = false; // don't normalize the data
                stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
                offset = tangentAccessor.byteOffset; // start at the beginning of the buffer
                gl.vertexAttribPointer(
                    tangentAttributeLocation,
                    size,
                    type,
                    normalize,
                    stride,
                    offset
                );

                drawble.tangentAttributeLocation = tangentAttributeLocation;
            }
            //index Attribute

            const indexAccessorIndex = primitive.indices;
            const indexAccessor = gltfObj.accessors[indexAccessorIndex];
            const indexBufferViewIndex = indexAccessor.bufferView;
            const indexAttributeBuffer = bufferSlices[indexBufferViewIndex];

            const glElementArray = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glElementArray);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                indexAttributeBuffer,
                gl.STATIC_DRAW
            );

            drawble.count = indexAccessor.count;
            drawble.indiceType = indexAccessor.componentType;
            drawble.positionAttributeLocation = positionAttributeLocation;
            drawble.normalAttributeLocation = normalAttributeLocation;
            drawble.texCoordAttributeLocation = texCoordAttributeLocation;

            const materialIndex = primitive.material;
            const material = gltfObj.materials[materialIndex];

            const colorTextureIndex =
                material.pbrMetallicRoughness.baseColorTexture.index;
            const imageIndex = gltfObj.textures[colorTextureIndex].source;

            if (material.normalTexture != undefined) {
                const normalTextureIndex = material.normalTexture.index;
                const imageNormalIndex =
                    gltfObj.textures[normalTextureIndex].source;
                drawble.glNormalTexture = glTextures[imageNormalIndex];
            }

            drawble.glAlbedoTexture = glTextures[imageIndex];

            if (
                material.pbrMetallicRoughness.metallicRoughnessTexture !=
                undefined
            ) {
                const metallicRoughnessTextureIndex =
                    material.pbrMetallicRoughness.metallicRoughnessTexture
                        .index;
                drawble.glMetallicRoughnessTexture =
                    glTextures[metallicRoughnessTextureIndex];
            }

            return drawble;
        }
    );

    const drawbles = await Promise.all(drawblesPromises);
    const vertexShaderSource = await getStringFile("/shaders/shader.vs");

    const fragmentShaderSource = await getStringFile("/shaders/shader.fs");

    const program = compileShaderProgram(gl,vertexShaderSource,fragmentShaderSource);


    const normalSamplerUniformLocation = gl.getUniformLocation(
        program,
        "normal_sampler"
    );
    const shadowMapSamplerUniformLocation = gl.getUniformLocation(
        program,
        "shadowMap_sampler"
    );
    const projectedShadowMapMatrixUniformLocation = gl.getUniformLocation(
        program,
        "shadowMapMatrix"
    );
    const lightOriginUniformLocation = gl.getUniformLocation(
        program,
        "shadowMapPosition"
    );
    const rotationMatrixUniform = gl.getUniformLocation(
        program,
        "rotationMatrix"
    );
    const colorSamplerUniformLocation = gl.getUniformLocation(
        program,
        "color_sampler"
    );
    const cameraPositionUniformLocation = gl.getUniformLocation(
        program,
        "cameraPosition"
    );
    const mvpUniformLocation = gl.getUniformLocation(program, "mvp");
    const metallicRoughnessUniformLocation = gl.getUniformLocation(
        program,
        "metallicRoughness"
    );

    
    const depthTextureSize = 2048;
    const shadowFramebuffer = createDepthTextureFramebuffer(gl,depthTextureSize,depthTextureSize);


    const lightShadowMapPositionUniform = gl.getUniformLocation(
        shadowFramebuffer.program,
        "shadowMapPosition"
    );
    const rotationShadowMapMatrixUniform = gl.getUniformLocation(
        shadowFramebuffer.program,
        "shadowMapRotation"
    );
    const scaleShadowMapUniform = gl.getUniformLocation(
        shadowFramebuffer.program,
        "shadowMapScale"
    );
    const shadowMapMatrixUniform = gl.getUniformLocation(
        shadowFramebuffer.program,
        "shadowMapMatrix"
    );
    console.log(shadowFramebuffer);
    return {
        modelMatrix: getModelMatrix(gltfObj),
        drawShadowMap: function (uniforms) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer.frameBuffer);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, shadowFramebuffer.texture.height, shadowFramebuffer.texture.width);
            gl.useProgram(shadowFramebuffer.program);
            drawbles.map((drawble) => {
                gl.uniformMatrix4fv(
                    shadowMapMatrixUniform,
                    false,
                    uniforms.inverse
                );

                gl.bindVertexArray(drawble.vao);

                gl.enableVertexAttribArray(positionAttributeLocation);
                gl.drawElements(
                    gl.TRIANGLES,
                    drawble.count,
                    drawble.indiceType,
                    0
                );
            });

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return shadowFramebuffer.texture.texture;
        },
        drawNormal:function(){
            
        },
        draw: function (uniformMatrices, shadowMap, shadowMapUniforms) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(program);
            drawbles.map((drawble) => {
                gl.uniform1i(normalSamplerUniformLocation, 2);
                gl.uniform1i(shadowMapSamplerUniformLocation, 1);
                gl.uniformMatrix4fv(
                    projectedShadowMapMatrixUniformLocation,
                    false,
                    shadowMapUniforms.inverse
                );
                gl.uniform3fv(
                    lightOriginUniformLocation,
                    shadowMapUniforms.position
                );
                gl.uniformMatrix3fv(
                    rotationMatrixUniform,
                    false,
                    shadowMapUniforms.rotationMatrix
                );
                gl.uniform1i(colorSamplerUniformLocation, 0);
                gl.uniform3fv(
                    cameraPositionUniformLocation,
                    uniformMatrices.cameraPosition
                );
                gl.uniformMatrix4fv(
                    mvpUniformLocation,
                    false,
                    uniformMatrices.mvpMatrix
                );
                gl.uniform1i(metallicRoughnessUniformLocation, 3);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, drawble.glAlbedoTexture);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, shadowFramebuffer.texture.texture);
                if (drawble.glNormalTexture != undefined) {
                    gl.activeTexture(gl.TEXTURE2);
                    gl.bindTexture(gl.TEXTURE_2D, drawble.glNormalTexture);
                }

                if (drawble.glNormalTexture != undefined) {
                    gl.activeTexture(gl.TEXTURE3);
                    gl.bindTexture(
                        gl.TEXTURE_2D,
                        drawble.glMetallicRoughnessTexture
                    );
                }
                gl.bindVertexArray(drawble.vao);

                gl.enableVertexAttribArray(positionAttributeLocation);
                gl.enableVertexAttribArray(texCoordAttributeLocation);
                gl.enableVertexAttribArray(normalAttributeLocation);
                if (drawble.tangentAttributeLocation != null) {
                    gl.enableVertexAttribArray(
                        drawble.tangentAttributeLocation
                    );
                }

                gl.drawElements(
                    gl.TRIANGLES,
                    drawble.count,
                    drawble.indiceType,
                    0
                );
            });
        },
    };
}
async function loadSponza(gl) {
    return loadGLTF(gl, "sponza/Sponza.gltf");
}
