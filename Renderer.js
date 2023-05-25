
class Framebuffer
{
    #framebuffer;
    constructor(gl,textures)
    {
        this.#framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
        for(const texture in textures)
        {
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, // target
                textures[texture].fbAttachmentPoint,//gl.DEPTH_ATTACHMENT, // attachment point
                gl.TEXTURE_2D, // texture target
                textures[texture].texture, // texture
                0 // mip level
            );
        }
    
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
        switch(gl.checkFramebufferStatus(gl.FRAMEBUFFER))
        {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            console.log("frame buffer incomplete attachment");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            console.log("frame buffer incomplete missing attachment");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                console.log("frame buffer incomplete dimansions");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
            console.log("frame buffer incomplete unsupported");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
            console.log("frame buffer incomplete multisample");
                break;
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //return {frameBuffer:fb,textures:textures};

    }
}
class DataTexture{
    #_texture;
    constructor(gl,data,width=1,height=1,numOfChannels=3)
    {

        this.#_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.#_texture);
        
        switch(numOfChannels)
        {
            case 3:
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGB,
                    width,
                    height,
                    0,
                    gl.RGB,
                    gl.UNSIGNED_BYTE,
                    data,
                    0
                );
                break;
            case 4:
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    width,
                    height,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    data,
                    0
                );
                break;
            default:
                throw new Error("Error numsber of channels not supported");
        }
    }
    
    get texture()
    {
        return this.#_texture;
    }
}
class Texture
{
    #gl;
    #_texture;
    constructor(gl,path,onLoad)
    {

        this.#gl = gl;
        this.#_texture = null;
        this.#loadImage(path).then((imageBlob)=>{
            this.#_texture = this.#loadTexture(imageBlob,path);
            onLoad();
        });
    }
    static AsyncTexture(gl,path)
    {
        return new Promise((resolve)=>{
            const texture = new Texture(gl,path,()=>{
                resolve(texture);
            })
        });
    }
    get texture()
    {
        return this.#_texture;
    }
    #loadTexture(imageBlob,path)//TODO sampler info
    {
        const gl = this.#gl;
        const glTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
            
        
        if (/^.*\.png/.test(path)) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                imageBlob
            );
        } else if (/^.*\.jpg/.test(path)) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGB,
                gl.RGB,
                gl.UNSIGNED_BYTE,
                imageBlob
            );
        }
    
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.generateMipmap(gl.TEXTURE_2D);
        return glTexture;
    }
    #loadImage(fileName, onProgress) {
        return new Promise((resolve, reject) => {
            Image.prototype.load = function (url, callback) {
                var thisImg = this,
                    xmlHTTP = new XMLHttpRequest();
    
                thisImg.completedPercentage = 0;
    
                xmlHTTP.open("GET", url, true);
                xmlHTTP.responseType = "arraybuffer";
    
                xmlHTTP.onload = function (e) {
                    var h = xmlHTTP.getAllResponseHeaders(),
                        m = h.match(/^Content-Type\:\s*(.*?)$/im),
                        mimeType = m[1] || "image/png";
    
                    var blob = new Blob([this.response], { type: mimeType });
                    thisImg.src = window.URL.createObjectURL(blob);
                    if (callback) callback(this);
                };
    
                xmlHTTP.onprogress = onProgress;
    
                xmlHTTP.onloadstart = function () {
                    thisImg.completedPercentage = 0;
                };
    
                xmlHTTP.onloadend = function () {
                    thisImg.completedPercentage = 100;
                };
    
                xmlHTTP.send();
            };
            var img = new Image();
            img.load(window.location.href + fileName);
    
            img.onload = () => resolve(img);
        });
    }
    
}

class ShaderProgram{
    #gl;
    #shaderProgram;
    #uniformMapLocationMap;
    constructor(gl,vertexShaderSource,fragmentShaderSource)
    {
        this.#gl = gl;
        this.#shaderProgram = this.#compileShaderProgram(gl,vertexShaderSource,fragmentShaderSource);
        this.#uniformMapLocationMap = new Map();
    }
    setUniform(uniformName,uniformType,uniformData)
    {
        const gl = this.#gl;//for ease of typing
        if(!this.#uniformMapLocationMap.has(uniformName))
        {
            const uniformLocation = gl.getUniformLocation(
                this.#shaderProgram,
                uniformName
                );
            this.#uniformMapLocationMap.set(uniformName,uniformLocation);
        }
        
        switch(uniformType)
        {
            case "float":
                gl.uniform1f(this.#uniformMapLocationMap.get(uniformName),uniformData);
                break;
            case "vec3":
                gl.uniform3fv(this.#uniformMapLocationMap.get(uniformName),uniformData);
                break;
            case "vec4":        
                gl.uniform4fv(this.#uniformMapLocationMap.get(uniformName),uniformData);
            break;
            case "texture":
                gl.uniform1i(this.#uniformMapLocationMap.get(uniformName),uniformData);
                break;
            case "mat4":
                gl.uniformMatrix4fv(
                    this.#uniformMapLocationMap.get(uniformName),
                    false,
                    uniformData
                );
                break;
                default:
                    throw new Error("Error: uniform type not supported");
        }
    }
    useProgram()
    {
        this.#gl.useProgram(this.#shaderProgram);
    }
    #compileShaderProgram(gl,vertexShaderSource,fragmentShaderSource)
    {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        let success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        if (!success) {
            //console.log(gl.getShaderInfoLog(vertexShader));
            throw new Error(gl.getShaderInfoLog(vertexShader));
        }
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
        if (!success) {
            //console.log(gl.getShaderInfoLog(fragmentShader));
            throw new Error(gl.getShaderInfoLog(fragmentShader));
        }
        
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!success) {
            //console.log(gl.getProgramInfoLog(program));
            throw new Error(gl.getShaderInfoLog(program));
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }
    static #loadTextFile(path)//TODO may be on Renderer as static
    {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText,
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText,
                });
            };
            xhr.send();
        });
    }
    static loadShaderFiles(gl,vertexShaderFilePath,fragmentShaderFilePath)
    {
        const vertexShaderProgramPromise = ShaderProgram.#loadTextFile(vertexShaderFilePath);
        const fragmentShaderProgramPromise = ShaderProgram.#loadTextFile(fragmentShaderFilePath);
        return Promise.all([vertexShaderProgramPromise,fragmentShaderProgramPromise])
            .then((shaderSources)=>{
                return new ShaderProgram(gl,shaderSources[0],shaderSources[1]);
            }).catch((reason)=>{
                throw new Error("Error loading text files for shaders: "+ reason);
            });
    }
}

class Material{
    #gl;
    #_baseColorFactor;
    #_baseColorTexture;
    #_metallicRoughnessTexture;
    #_normalTexture;
    constructor(gl,baseColorFactor,baseColorTexture,metallicRoughnessTexture,normalTexture)
    {
        this.#gl = gl;
        if(!gl)
        {
            throw new Error("The device in not capable.");
        }
        if(baseColorFactor === undefined)
        {
            this.#_baseColorFactor = [1.0,1.0,1.0,1.0];
        }
        else
        {
            this.#_baseColorFactor = baseColorFactor;
        }

        this.#_baseColorTexture = baseColorTexture;
        this.#_metallicRoughnessTexture = metallicRoughnessTexture;
        this.#_normalTexture = normalTexture;
    }
    setUniforms(
        shader,
        modelMatrix,
        viewMatrix,
        projectionMatrix,
        modelViewProjectionMatrix,
        cameraPosition,
        shadowMapTexture,
        rsmColorTexture,
        rsmNormalTexture,
        rsmPositionTexture
        )
    {
        const gl = this.#gl;
        shader.setUniform("modelMatrix","mat4",modelMatrix);
        shader.setUniform("viewMatrix","mat4",viewMatrix);
        shader.setUniform("projectionMatrix","mat4",projectionMatrix);
        shader.setUniform("viewProjectionMatrix","mat4",modelViewProjectionMatrix);
        shader.setUniform("cameraPosition","vec3",cameraPosition);
        shader.setUniform("baseColorFactor","vec4",this.#_baseColorFactor);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,this.#_baseColorTexture.texture);
        shader.setUniform("baseColorTexture","texture",0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D,this.#_metallicRoughnessTexture.texture);
        shader.setUniform("metallicRoughnessTexture","texture",1);
        
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D,this.#_normalTexture.texture);
        shader.setUniform("normalTextureTexture","texture",2);
    
        //shader.setUniform("shadowMapTexture","texture",3);
        //shader.setUniform("rsmColorTexture","texture",4);
        //shader.setUniform("rsmNormalTexture","texture",5);
        //shader.setUniform("rsmPositionTexture","texture",6);

    }
    
    get baseColorFactor()
    {
        return this.#_baseColorFactor;
    }
    get baseColorTexture()
    {
        return this.#_baseColorTexture;
    }
    get metallicRoughnessTexture()
    {
        return this.#_metallicRoughnessTexture;
    }
    get normalTexture()
    {
        return this.#_normalTexture;
    }
    static #asyncCompileMainShaderProgram()
    {
        const vertexShaderSourcePromise = getStringFile("/shaders/shader.vs");
        const fragmentShaderSourcePromise = getStringFile("/shaders/shader.fs");
        return Promise.all([vertexShaderSourcePromise,fragmentShaderSourcePromise])
            .then((shaderSources)=>{
                return new ShaderProgram(this.#gl,shaderSources[0],shaderSources[1])
            })
    }
};
class Drawble{
    #gl;
    #gltfObj;
    #rawBuffers;
    #textures;
    #_rootNode;
    constructor(gl,path,onLoad)
    {
        if(!gl)
        {
            throw new Error("The device in not capable.");
        }
        this.#gl = gl;
        this.#rawBuffers = [];
        this.#textures = null;
        const currentDirectory = path.slice(0, path.lastIndexOf("/") + 1);
        const materials = [];//TODO erase line?
        this.#getStringFile(path).then((stringFile)=>{
            this.#gltfObj = JSON.parse(stringFile);
            return loadBuffers(this.#gltfObj.buffers,currentDirectory);//TODO include code into renderer.js
        }).then((buffers)=>{//TODO buffer and textures can be load in parallel
            this.#rawBuffers = loadBufferSlices(this.#gltfObj.bufferViews,buffers);
            return Promise.all(this.#gltfObj.images.map((image)=>{
                return Texture.AsyncTexture(gl,currentDirectory+image.uri)
            }));
        }).then((textures)=>{
            this.#textures = textures;
            this.#setUpVAOs();
            onLoad();
        });
    }
    static AsyncDrawble(gl,path)
    {
        return new Promise((resolve)=>{
            const drawble = new Drawble(gl,path,()=>{
                resolve(drawble);
            })
        });
    }
    get nodeRoot()
    {
        return this.#_rootNode;
    }
    #getStringFile(fileName) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", window.location.href + fileName, true);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText,
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText,
                });
            };
            xhr.send();
        });
    }
    #setUpVAOs(){
        const gl = this.#gl;
        console.log(this.#gltfObj);

        const rootNode = this.#gltfObj.nodes[this.#gltfObj.scenes[0].nodes[0]];//TODO just the first scene and node for now

        const recurse = (node,objectNode)=>{
            const scale = node.scale;
            const matrix = node.matrix;
            if(node.mesh!==undefined)
            {
                const meshIndex = node.mesh;
                const mesh = this.#gltfObj.meshes[meshIndex];
                objectNode.primitives = this.#evaluateMesh(mesh);
            }
            objectNode.scale = scale;
            objectNode.matrix = matrix;
            if(node.children!==undefined)
            {   
                objectNode.children = [];
                node.children.map((childIndex)=>{
                    let childNode = this.#gltfObj.nodes[childIndex];
                    let newObjectNode = {};
                    objectNode.children.push(newObjectNode);
                    
                    recurse(childNode,newObjectNode);
            
                });

            }

            return objectNode;
        };
        let scene = {};
        this.#_rootNode = recurse(rootNode,scene);
    }
    #evaluateMesh(mesh)
    {
        const gl = this.#gl;

        return mesh.primitives.map((primitive)=>{
            const vertexArrayBuffer = gl.createVertexArray();
            
            gl.bindVertexArray(vertexArrayBuffer);
            const attributeIndices = {POSITION:0,NORMAL:1,TEXCOORD_0:2,TANGENT:3};
            const bufferIndexMap = new Map();
            Object.keys(primitive.attributes).map((attribKey)=>{
                if(attribKey in attributeIndices)
                {

                    const accessorIndex = primitive.attributes[attribKey];
                    const accessor = this.#gltfObj.accessors[accessorIndex];
                    const bufferviewIndex = accessor.bufferView;
                    const bufferview = this.#gltfObj.bufferViews[bufferviewIndex];
                    const bufferSlice = this.#rawBuffers[bufferviewIndex];//TODO it could be several buffer files
                    if(!bufferIndexMap.has(bufferviewIndex))
                    {
                        const vbo = gl.createBuffer();
                        gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
                        gl.bufferData(
                            gl.ARRAY_BUFFER,
                            bufferSlice,
                            gl.STATIC_DRAW
                        );
                        bufferIndexMap.set(bufferviewIndex,vbo);
                    }
                    else
                    {
                        gl.bindBuffer(gl.ARRAY_BUFFER,bufferIndexMap.get(bufferviewIndex));
                    }
                    
                    let size;
                    switch (accessor.type) {
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
                    if(accessor.componentType != gl.FLOAT)
                    {
                        throw new Error("Error: there is not suport for attributes of this type: "+accessor.componentType);
                    }
                    gl.enableVertexAttribArray(attributeIndices[attribKey]);
                    gl.vertexAttribPointer(attributeIndices[attribKey],size,accessor.componentType ,gl.FALSE,0,accessor.byteOffset);

                }
                else{
                    throw Error("Error, attribute not supported");
                }
            });
            
            
            const indexAccessorIndex = primitive.indices;
            const indexAccessor = this.#gltfObj.accessors[indexAccessorIndex];
            const indexBufferViewIndex = indexAccessor.bufferView;
            const bufferView = this.#gltfObj.bufferViews[indexBufferViewIndex];
            const indexAttributeBuffer = this.#rawBuffers[indexBufferViewIndex];//TODO it could be several buffer files


            let indexElementCount;
            switch(indexAccessor.componentType)
            {
                case gl.UNSIGNED_SHORT:
                    indexElementCount = 2
                    break;
                default:
                    throw new Error("Error, index component size not supported");
            }
            
            const count = bufferView.byteLength/indexElementCount;

            const glElementArray = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glElementArray);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                indexAttributeBuffer,
                gl.STATIC_DRAW
            );

            const materialIndex = primitive.material;
            const material = this.#setUpMaterials(materialIndex);
            return {primitive:vertexArrayBuffer,accesorType:indexAccessor.componentType,count,material};
        });
    }
    #setUpMaterials(materialIndex){
        const materialGltf = this.#gltfObj.materials[materialIndex];
        const baseColorFactor = materialGltf.pbrMetallicRoughness.baseColorFactor;
        
        const baseColorTextureIndex = materialGltf.pbrMetallicRoughness.baseColorTexture.index;
        const baseColorTexture = this.#textures[baseColorTextureIndex];
        
        
        const metallicRoughnessGLTF = materialGltf.pbrMetallicRoughness.metallicRoughnessTexture;
        let metallicRoughnessTexture;
        if(metallicRoughnessGLTF === undefined)
        {
            metallicRoughnessTexture = new DataTexture(this.#gl,new Uint8Array([0,0,0]));
        }
        else
        {
            const metallicRoughnessIndex = metallicRoughnessGLTF.index;
            metallicRoughnessTexture = this.#textures[metallicRoughnessIndex];
        }

        let metallicFactor = materialGltf.pbrMetallicRoughness.metallicFactor;
        if(metallicFactor === undefined)
        {
            metallicFactor = 1.0;
        }

        const normalTextureGLTF = materialGltf.normalTexture;
        let normalTexture;
        if(normalTextureGLTF === undefined)
        {
            normalTexture = new DataTexture(this.#gl,new Uint8Array([128,128,255]));
        }
        else
        {
            const normalTextureIndex = normalTextureGLTF.index;
            normalTexture = this.#textures[normalTextureIndex];
        }
        
        return new Material(this.#gl,baseColorFactor,baseColorTexture,metallicRoughnessTexture,normalTexture);
    }
};
class Renderer
{
    #screenRatio
    #projectionMatrix
    #_gl;
    constructor(canvasElement)
    {

        this.#_gl = canvasElement.getContext("webgl2", { antialias: false });
        
        const ext = this.#_gl.getExtension("EXT_color_buffer_float");
        if (!this.#_gl && !ext) 
        {
            throw new Error("The device in not capable.");
        }
        
        this.#screenRatio = canvasElement.clientWidth / canvasElement.clientHeight;
        const gl = this.#_gl;//for ease of typing
        gl.clearColor(1.0,1.0,1.0,1.0);
        gl.viewport(
            0,
            0,
            canvasElement.offsetWidth,
            canvasElement.offsetHeight
            );
            
        canvasElement.width = canvasElement.offsetWidth;
        canvasElement.height = canvasElement.offsetHeight;
            
        gl.enable(gl.DEPTH_TEST);
        this.#projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(
            this.#projectionMatrix,
            10 * (180 / Math.PI),
            this.#screenRatio,
            0.1,
            10000
            );
        this.#_viewMatrix = glMatrix.mat4.create();
    }
    get gl()
    {
        return this.#_gl;
    }
    #_viewMatrix;
    set viewMatrix(viewMatrix)
    {
        this.#_viewMatrix = viewMatrix;
    }
    #drawNode(node,modelMatrix,shader)
    {
        const gl = this.#_gl;//for ease of typing
        const viewProjectionMatrix = glMatrix.mat4.create();//TODO put in constructor
        const cameraPosition = glMatrix.vec3.fromValues(0.0,0.0,0.0);//TODO put in constructor
        if(node.primitives!== undefined)
        {

            node.primitives.map((primitive)=>{
                primitive.material.setUniforms(
                    shader,
                    modelMatrix,
                    this.#_viewMatrix,
                    this.#projectionMatrix,
                    viewProjectionMatrix,
                    cameraPosition
                    );     
                gl.bindVertexArray(primitive.primitive);         
                gl.drawElements(
                    gl.TRIANGLES,
                    primitive.count,
                    primitive.accesorType,
                    0
                );
                        
            });
        }
    }
    #computeModelMatrix(node)
    {
        
        let modelMatrix = glMatrix.mat4.create();
        if(node.matrix === undefined)
        {
            let translateVec = glMatrix.vec3.fromValues(0.0,0.0,0.0);
            let rotationVec = glMatrix.vec4.fromValues(0.0,0.0,0.0,1.0);
            let scaleVec = glMatrix.vec3.fromValues(1.0,1.0,1.0);
            if(node.translation !== undefined)
            {
                translateVec = glMatrix.vec3.fromValues(...node.translation);
            }
            if(node.rotation !== undefined)
            {
                rotationVec = glMatrix.vec3.fromValues(...node.rotation);
            }
            if(node.scale !== undefined)
            {
                scaleVec = glMatrix.vec3.fromValues(...node.scale);
            }
            glMatrix.mat4.fromRotationTranslationScale(modelMatrix,rotationVec,translateVec,scaleVec);
        }
        else
        {
            modelMatrix = glMatrix.mat4.fromValues(...node.matrix);
        }
        return modelMatrix;
    }
    draw(drawble,shader)
    {
        const gl = this.#_gl;//for ease of typing
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        const stackData = [];
        let currentNode = drawble.nodeRoot;
        shader.useProgram();
        let translateVec = glMatrix.vec3.fromValues(0.5,0.5,0.5);
        let modelMatrix = this.#computeModelMatrix(currentNode);
        glMatrix.mat4.scale(modelMatrix,modelMatrix,translateVec);
        let currentData = {node:currentNode,currentModelMatrix:modelMatrix};
        stackData.push(currentData);
        do//TODO precompute model matrices to enable sorting (research)
        {
            this.#drawNode(currentData.node,modelMatrix,shader);
            
            if(currentData.node.children!==undefined)
            {
                for(let child of currentData.node.children)
                {
                    glMatrix.mat4.mul(modelMatrix,modelMatrix,this.#computeModelMatrix(child));
                    stackData.push({node:child,modelMatrix});
                    currentNode = child;
                }
                currentData = stackData.pop();
                continue;
            }
            currentData = stackData.pop();
        }while(stackData.length > 0);
    }    
};