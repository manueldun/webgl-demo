function getModelMatrix(gltfObj) {
    let modelMatrix = glMatrix.mat4.create();
    let scaleVector = glMatrix.vec3.fromValues(
        gltfObj.nodes[0].scale[0],
        gltfObj.nodes[0].scale[1],
        gltfObj.nodes[0].scale[2]
    );
    glMatrix.mat4.scale(modelMatrix, modelMatrix, scaleVector);
    return modelMatrix;
}

async function loadGLTF(gl, path, gltfObj) {
    console.log(gltfObj);
    let binFileBuffersPromises = gltfObj.buffers.map((buffer) => {
        return getBinaryFile(path, buffer.uri);
    });


    const rawBufferFiles = await Promise.all(binFileBuffersPromises);

    const bufferSlices = gltfObj.bufferViews.map((bufferView) => {

        let rawBuffferFile = rawBufferFiles[bufferView.buffer];
        let bufferSlice = rawBuffferFile.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);

        return bufferSlice;
    });


    let glTextures = gltfObj.images.map(async (image) => {


        const imageURI = image.uri;

        const colorImagePromise = new Promise((resolve, reject) => {
            let img = new Image()
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = path + imageURI;
        });

        const colorImage = await colorImagePromise;
        const glTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        if (image.mimeType === "image/png") {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorImage);
        }
        else if (image.mimeType === "image/jpeg") {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, colorImage);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        glTexture.uri = imageURI;
        glTexture.colorImage = colorImage;
        return glTexture;
    });
    glTextures = await Promise.all(glTextures);

    let drawblesPromises = gltfObj.meshes[0].primitives.map(async (primitive) => {

        const positionAttributeLocation = 0;
        const normalAttributeLocation = 1;
        const texCoordAttributeLocation = 2;
        const tangentAttributeLocation = 3;

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
        let offset = 0;        // start at the beginning of the buffer
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
        //gl.enableVertexAttribArray(normalAttributeLocation);
        const normalAccessorIndex = primitive.attributes.NORMAL;
        const normalAccessor = gltfObj.accessors[normalAccessorIndex];
        const normalBufferviewIndex = normalAccessor.bufferView;
        const normalBufferView = gltfObj.bufferViews[normalBufferviewIndex];
        const normalAttributeBuffer = bufferSlices[normalBufferView];
        //create normal buffer

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
        offset = normalBufferView.byteOffset;        // start at the beginning of the buffer
        gl.vertexAttribPointer(normalAttributeLocation, size, type, normalize, stride, offset);


        //tangent Attribute
        //gl.enableVertexAttribArray(tangentAttributeLocation);
        const tangentAccessorIndex = primitive.attributes.TANGENT;
        if (tangentAccessorIndex !== undefined) {

            const tangentAccessor = gltfObj.accessors[tangentAccessorIndex];
            const tangentBufferViewIndex = tangentAccessor.bufferView;
            const tangentBufferView = gltfObj.bufferViews[tangentBufferViewIndex];
            const tangentAttributeBuffer = bufferSlices[normalBufferView];

            //create tangentBuffer

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
            offset = tangentBufferView.byteOffset;        // start at the beginning of the buffer
            gl.vertexAttribPointer(tangentAttributeLocation, size, type, normalize, stride, offset);
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
        drawble.tangentAttributeLocation = tangentAttributeLocation;

        const materialIndex = primitive.material;
        const material = gltfObj.materials[materialIndex];
        const colorTextureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
        const imageIndex = gltfObj.textures[colorTextureIndex].source;

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
    //const samplerUniformLocation = gl.getUniformLocation(program, "color_sampler");
    gl.useProgram(program);


    return {
        modelMatrix: getModelMatrix(gltfObj),
        draw: function (mvp) {
            drawbles.map((drawble) => {


                gl.bindTexture(gl.TEXTURE_2D, drawble.glTexture);

                //gl.useProgram(program);

                gl.uniformMatrix4fv(mvpUniformLocation, false, mvp);

                gl.bindVertexArray(drawble.vao);

                gl.drawElements(gl.TRIANGLES, drawble.count, drawble.indiceType, 0);
            });
        }
    };
}
async function loadSponza(gl) {
    const objFile = JSON.parse(await getStringFile("/sponza/", "Sponza.gltf"));
    return loadGLTF(gl, "/sponza/", objFile);
}
