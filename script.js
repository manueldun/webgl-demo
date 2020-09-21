function getStringFile(path, fileName) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path + fileName, true);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    })
}
function getBinaryFile(path, fileName) {
    return new Promise((resolve, reject) => {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", path + fileName, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response; // Note: not oReq.responseText
            if (arrayBuffer) {
                resolve(oReq.response)
            }
        };
        oReq.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        oReq.send(null);
    });
}
function loadMesh(mesh) {

}
async function loadGLTF(gl, path, gltfObj) {
    console.log(gltfObj);
    let binFileBuffersPromises = gltfObj.buffers.map((buffer) => {
        return getBinaryFile(path, buffer.uri);
    });


    const binBuffers = await Promise.all(binFileBuffersPromises);

    const glBuffers = binBuffers.map((binBuffer) => {
        const glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, binBuffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return glBuffer;
    });





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
        const positionBufferView = gltfObj.bufferViews[positionBufferviewIndex];
        const positionBufferIndex = positionBufferView.buffer;

        const attributeBuffer = glBuffers[positionBufferIndex];

        gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer);

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
        let stride = size * Float32Array.BYTES_PER_ELEMENT;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = positionBufferView.byteOffset;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);



        //texCoord Attribute
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        const texCoordAccessorIndex = primitive.attributes.TEXCOORD_0;
        const texCoordAccessor = gltfObj.accessors[texCoordAccessorIndex];
        const texCoordBufferViewIndex = texCoordAccessor.bufferView;
        const texCoordBufferView = gltfObj.bufferViews[texCoordBufferViewIndex];
        const texCoordBufferIndex = texCoordBufferView.buffer;
        const texCoordBuffer = glBuffers[texCoordBufferIndex];

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
        stride = size * Float32Array.BYTES_PER_ELEMENT;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        offset = texCoordBufferView.byteOffset;        // start at the beginning of the buffer
        gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset);


        //normal Attribute
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        const normalAccessorIndex = primitive.attributes.NORMAL;
        const normalAccessor = gltfObj.accessors[normalAccessorIndex];
        const normalBufferviewIndex = normalAccessor.bufferView;
        const normalBufferView = gltfObj.bufferViews[normalBufferviewIndex];
        const normalBufferIndex = normalBufferView.buffer;
        const normalBuffer = glBuffers[normalBufferIndex];

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
        stride = size * Float32Array.BYTES_PER_ELEMENT;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        offset = normalBufferView.byteOffset;        // start at the beginning of the buffer
        gl.vertexAttribPointer(normalAttributeLocation, size, type, normalize, stride, offset);


        //tangent Attribute
        gl.enableVertexAttribArray(texCoordAttributeLocation);
        const tangentAccessorIndex = primitive.attributes.TANGENT;
        if (tangentAccessorIndex !== undefined) {

            const tangentAccessor = gltfObj.accessors[tangentAccessorIndex];
            const tangentBufferViewIndex = tangentAccessor.bufferView;
            const tangentBufferView = gltfObj.bufferViews[tangentBufferViewIndex];
            const tangentBufferIndex = tangentBufferView.buffer;
            const tangentBuffer = glBuffers[tangentBufferIndex];

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
            stride = size * Float32Array.BYTES_PER_ELEMENT;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            offset = tangentBufferView.byteOffset;        // start at the beginning of the buffer
            gl.vertexAttribPointer(tangentAttributeLocation, size, type, normalize, stride, offset);
        }
        //index Attribute
        const indicesAccessor = gltfObj.accessors[primitive.indices];
        const indicesBufferviewIndex = indicesAccessor.bufferView;
        const indicesBufferView = gltfObj.bufferViews[indicesBufferviewIndex];
        const indicesBufferIndex = indicesBufferView.buffer;
        const indicesBuffer = binBuffers[indicesBufferIndex];

        drawble.count = indicesAccessor.count;
        drawble.indiceType = indicesAccessor.componentType;
        drawble.positionAttributeLocation = positionAttributeLocation;
        drawble.normalAttributeLocation = normalAttributeLocation;
        drawble.texCoordAttributeLocation = texCoordAttributeLocation;
        drawble.tangentAttributeLocation = tangentAttributeLocation;

        const glElementArray = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glElementArray);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesBuffer), gl.STATIC_DRAW,0,drawble.count);

        //materials
        const material = gltfObj.materials[primitive.material];
        const baseColorTextureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
        const textureIndex = gltfObj.textures[baseColorTextureIndex].source;
        const imageURI = gltfObj.images[textureIndex].uri;

        const colorImagePromise = new Promise((resolve, reject) => {
            let img = new Image()
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = path + imageURI;
        });

        const glTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        const colorImage = await colorImagePromise;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorImage);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindVertexArray(null);

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
    return function () {
        drawbles.map((drawble) => {

            gl.useProgram(program);

            gl.bindVertexArray(drawble.vao);

            
            gl.drawElements(gl.TRIANGLES, drawble.count, gl.UNSIGNED_SHORT, 0);
        });
    };
}
async function loadSponza(gl) {
    const objFile = JSON.parse(await getStringFile("cube/", "cube.gltf"));
    return loadGLTF(gl, "/cube/", objFile);
}

async function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];

    const gl = canvasElement.getContext('webgl2');

    const loadingMessageElement = document.getElementById("loading-message");
    if (!gl) {
        loadingMessageElement.innerHTML = "Your device does not support WebGL 2!";
        return;
    }
    else {
        let draw = await loadSponza(gl);
        loadingMessageElement.style.display = "none";
        const loop = () => {
            draw();
            window.requestAnimationFrame(loop);
        }
        window.requestAnimationFrame(loop)
    }

}
window.onload = main;