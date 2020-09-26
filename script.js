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

function initViewProjectionMatrix() {

    this.forwardDirection = glMatrix.vec4.fromValues(0.0, 0.0, -1.0);

    this.position = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);

    return (inputData) => {

        let leftDirection = glMatrix.vec3.create();
        glMatrix.vec3.cross(leftDirection, [0, 1, 0], this.forwardDirection);
        glMatrix.vec3.normalize(leftDirection, leftDirection);

        let upDirection = glMatrix.vec3.create();
        glMatrix.vec3.cross(upDirection, this.forwardDirection, leftDirection);
        glMatrix.vec3.normalize(upDirection, upDirection);


        let forwardDisplacement = glMatrix.vec3.create();
        glMatrix.vec3.mul(forwardDisplacement, this.forwardDirection,
            [inputData.deltaPosition.forward, inputData.deltaPosition.forward, inputData.deltaPosition.forward]);
        glMatrix.vec3.add(this.position, this.position, forwardDisplacement);

        let leftDisplacement = glMatrix.vec3.create();
        glMatrix.vec3.mul(leftDisplacement, leftDirection,
            [inputData.deltaPosition.left, inputData.deltaPosition.left, inputData.deltaPosition.left]);
        glMatrix.vec3.add(this.position, this.position, leftDisplacement);




        let horizontalRotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.rotate(horizontalRotationMatrix, horizontalRotationMatrix,
            inputData.deltaMouse.x * 0.05, upDirection);


        let forwardDirectionVec4 = glMatrix.vec4.fromValues(this.forwardDirection[0], this.forwardDirection[1], this.forwardDirection[2], 1.0);
        glMatrix.vec4.transformMat4(forwardDirectionVec4, forwardDirectionVec4, horizontalRotationMatrix);

        let verticalRotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.rotate(verticalRotationMatrix, verticalRotationMatrix,
            inputData.deltaMouse.y * 0.05, leftDirection);

        glMatrix.vec4.transformMat4(forwardDirectionVec4, forwardDirectionVec4, verticalRotationMatrix);

        this.forwardDirection = glMatrix.vec3.fromValues(forwardDirectionVec4[0], forwardDirectionVec4[1], forwardDirectionVec4[2]);

        inputData.deltaMouse.x = 0
        inputData.deltaMouse.y = 0
        let rotationMatrix = glMatrix.mat4.fromValues(
            -leftDirection[0], -leftDirection[1], -leftDirection[2], 0,
            upDirection[0], upDirection[1], upDirection[2], 0,
            forwardDirectionVec4[0], forwardDirectionVec4[1], forwardDirectionVec4[2], 0,
            0, 0, 0, 1
        );


        glMatrix.mat4.transpose(rotationMatrix, rotationMatrix);
        let translateMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(translateMatrix, translateMatrix, this.position);

        var viewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(viewMatrix, rotationMatrix, translateMatrix);


        let projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, 35 * (180 / Math.PI), 1280 / 720, 0.1, 1000);


        let mvpMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(mvpMatrix, projectionMatrix, viewMatrix);


        if (this.position[0] === NaN) {
            console.log(delta);
        }
        return mvpMatrix;
    }

}
function initInputLogic(canvas) {



    let keyW = false;
    let keyS = false;
    let keyA = false;
    let keyD = false;

    window.addEventListener('keydown',
        function moveForward(e) {
            switch (e.code) {
                case 'KeyW':
                    keyW = true;
                    break;
                case 'KeyS':
                    keyS = true;
                    break;
                case 'KeyA':
                    keyA = true;
                    break;
                case 'KeyD':
                    keyD = true;
                    break;
                default:
            }
        });

    window.addEventListener('keyup',
        function moveForward(e) {
            switch (e.code) {
                case 'KeyW':
                    keyW = false;
                    break;
                case 'KeyS':
                    keyS = false;
                    break;
                case 'KeyA':
                    keyA = false;
                    break;
                case 'KeyD':
                    keyD = false;
                    break;
                default:
            }
        });
    let mouseDownX = 0.0;
    let mouseDownY = 0.0;
    clickedMouseButton = false;

    canvas.addEventListener('mousedown', function (e) {
        if (typeof e === 'object') {
            switch (e.button) {
                case 0:
                    clickedMouseButton = true;
                    mouseDownX = e.clientX;
                    mouseDownY = e.clientY;
                    break;
            }
        }
    });

    canvas.addEventListener('mouseup', function (e) {
        if (typeof e === 'object') {
            switch (e.button) {
                case 0:
                    clickedMouseButton = false;
                    break;
            }
        }
    });
    let deltaMouse = { x: 0, y: 0 };
    canvas.addEventListener('mousemove', mouseButtonUp);
    function mouseButtonUp(e) {
        if (clickedMouseButton === true) {
            deltaMouse.x = (e.clientX - mouseDownX)*0.1;
            mouseDownX = e.clientX;
            deltaMouse.y = (mouseDownY - e.clientY)*0.1;
            mouseDownY = e.clientY;
        }
    }
    let deltaPosition = { forward: 0, left: 0 };
    let inputData = { "deltaPosition": deltaPosition, "deltaMouse": deltaMouse }

    let lastTime = 0;
    let delta = 0;
    return function inputLogic() {

        if (lastTime <= 0) {
            lastTime = Date.now();
            delta = 0;
        }
        else {
            delta = Date.now() - lastTime;
            lastTime = Date.now();
            
        }

        if (keyW === true) {
            deltaPosition.forward = delta;
        }
        else if (keyS === true) {
            deltaPosition.forward = -delta;
        }
        else {
            deltaPosition.forward = 0;
        }

        if (keyD === true) {
            deltaPosition.left = delta;
        }
        else if (keyA === true) {
            deltaPosition.left = -delta;
        }
        else {
            deltaPosition.left = 0;
        }
        return inputData;
    };
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

    let glColorTexturePromises = gltfObj.images.slice(0,2);
    glColorTexturePromises = glColorTexturePromises.map(async (image)=>
    {
         const imageURI = image.uri;
 
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
         glTexture.uri=imageURI;
        return glTexture;
    });
    let glColorTextures = await Promise.all(glColorTexturePromises);

    let drawblesPromises = gltfObj.meshes[0].primitives.slice(0, 1);

    drawblesPromises = drawblesPromises.map(async (primitive) => {

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
        let stride = positionAccessor.byteOffset;        // 0 = move forward size * sizeof(type) each iteration to get the next position
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
        stride = texCoordAccessor.byteOffset;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        offset = texCoordBufferView.byteOffset;        // start at the beginning of the buffer
        gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset);


        //normal Attribute
        //gl.enableVertexAttribArray(normalAttributeLocation);
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
            stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
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
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesBuffer), gl.STATIC_DRAW, 0, drawble.count);

        //materials
        const material = gltfObj.materials[primitive.material];
        const baseColorTextureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
        const textureIndex = gltfObj.textures[baseColorTextureIndex].source;
        drawble.colorTexture = glColorTextures[textureIndex];
        

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

    const mvpUniformLocation = gl.getUniformLocation(program, "mvp");

    return function (mvp) {
        drawbles.map((drawble) => {


            gl.bindTexture(gl.TEXTURE_2D,drawble.colorTexture);
            gl.activeTexture(gl.TEXTURE0)
            gl.useProgram(program);

            gl.uniformMatrix4fv(mvpUniformLocation, false, mvp);

            gl.bindVertexArray(drawble.vao);

            gl.drawElements(gl.TRIANGLES, drawble.count, drawble.indiceType, 0);
        });
    };
}
async function loadSponza(gl) {
    const objFile = JSON.parse(await getStringFile("sponza/", "sponza.gltf"));
    return loadGLTF(gl, "/sponza/", objFile);
}

async function main() {
    const canvasElement = document.getElementsByTagName("canvas")[0];

    canvasElement.width = 1280;
    canvasElement.style.width = 1280;
    canvasElement.height = 720;
    canvasElement.style.height = 720;

    const gl = canvasElement.getContext('webgl2');

    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const loadingMessageElement = document.getElementById("loading-message");
    if (!gl) {
        loadingMessageElement.innerHTML = "Your device does not support WebGL 2!";
        return;
    }
    else {

        //input logic
        const updateOnInput = initInputLogic(canvasElement)
        const getViewProjectionMatrix = initViewProjectionMatrix();

        let draw = await loadSponza(gl);
        loadingMessageElement.style.display = "none";
        const loop = () => {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            let inputData = updateOnInput();
            let mvp = getViewProjectionMatrix(inputData);

            draw(mvp);
            window.requestAnimationFrame(loop);
        }
        window.requestAnimationFrame(loop)
    }

}
window.onload = main;