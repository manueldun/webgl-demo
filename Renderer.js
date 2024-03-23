class ShaderUniform
{
    constructor(name,type,data)
    {
        this.uniformName = name;
        this.uniformType = type;
        this.uniformData = data;
    }
}
class RenderPass{
    constructor(gl,framebuffer,shader)
    {
        this.gl = gl;
        this.framebuffer = framebuffer;
        this.shader = shader;
    }
    bind()
    {
        this.framebuffer.bind();
        this.shader.useProgram();
    }


}
class DefaultRenderPass extends RenderPass
{
    constructor(gl,shader,width,height)
    {
        const framebuffer = new DefaultFrameBuffer(gl);
        super(gl,framebuffer,shader);
        this.#_shadowMap;
        this.#_shadowMapMatrix = glMatrix.mat4.create();
        this.#_width = width;
        this.#_height = height;
        this.#_viewMatrix = glMatrix.mat4.create();
        this.#_projectionMatrix = glMatrix.mat4.create();
        this.#_cameraPosition = glMatrix.vec3.create();
        this.#_rsm;
    }
    bind()
    {
        super.bind();
        
        this.gl.viewport(0.0,0.0,this.width,this.height);
        
    }
    #_width;
    get width()
    {
        return this.#_width;
    }
    #_height;
    get height()
    {
        return this.#_height;
    }
    #_shadowMap;
    set shadowMap(shadowMap)
    {
        this.#_shadowMap = shadowMap.texture;
    }
    #_rsm;
    set rsm(rsm)
    {
        this.#_rsm = rsm;
    }
    setUniforms()
    {
        this.shader.setUniform("viewMatrix","mat4",this.#_viewMatrix);
        this.shader.setUniform("projectionMatrix","mat4",this.#_projectionMatrix);
        this.shader.setUniform("shadowMapMatrix","mat4",this.#_shadowMapMatrix);
        this.shader.setUniform("cameraPosition","vec3",this.#_cameraPosition);
        this.shader.setTexture("shadowMapTexture",this.#_shadowMap,3);
        this.shader.setTexture("albedoRSM",this.#_rsm.albedoTexture,4);
        this.shader.setTexture("normalRSM",this.#_rsm.normalTexture,5);
        this.shader.setTexture("positionRSM",this.#_rsm.positionTexture,6);
    }
    #_projectionMatrix;
    set projectionMatrix(matrix)
    {
        this.#_projectionMatrix = matrix;
    }
    #_shadowMapMatrix;
    set shadowMapMatrix(matrix)
    {
        this.#_shadowMapMatrix = matrix;
    }
    #_viewMatrix;
    set viewMatrix(matrix)
    {
        this.#_viewMatrix = matrix;
    }
    #_cameraPosition;
    set cameraPosition(position)
    {
        this.#_cameraPosition = position;
    }
    clear()
    {
        
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    }
}
class ShadowmapRenderPass extends RenderPass
{
    constructor(gl,width,height){
        const vertexShaderShadowMap = `#version 300 es
        #pragma vscode_glsllint_stage : vert
        
        layout(location = 0) in vec3 attrib_position;
        
        
        uniform mat4 shadowMapMatrix;
        uniform mat4 modelMatrix;
        
        void main()
        {
            gl_Position = shadowMapMatrix*modelMatrix*vec4(attrib_position,1.0);
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
        const shader = new ShaderProgram(gl,vertexShaderShadowMap,fragmentShaderShadowMap);    
        const depthTexture = new DepthTexture(gl,width,height);
        const framebuffer = new ShadowMapFrameBuffer(gl,depthTexture);
        super(gl,framebuffer,shader);
        this.#_width = width;
        this.#_height = height;
        this.#_shadowmap = depthTexture;
        this.#_shadowMapMatrix = glMatrix.mat4.create();
        this.#_modelMatrix = glMatrix.mat4.create();
    }
    #_modelMatrix;
    get modelMatrix()
    {
        return this.#_modelMatrix;
    }
    set modelMatrix(matrix)
    {
        this.#_modelMatrix = matrix;
    }
    #_width;
    get width()
    {
        return this.#_width;
    }
    #_height;
    get height()
    {
        return this.#_height;
    }
    #_shadowmap;
    get shadowMap()
    {
        return this.#_shadowmap;
    }
    bind()
    {
        super.bind();
        this.gl.viewport(0.0,0.0,this.#_width,this.#_height);
    }
    setUniforms()
    {
        this.shader.setUniform("shadowMapMatrix","mat4",this.#_shadowMapMatrix);
    }
    #_shadowMapMatrix;
    set shadowMapMatrix(matrix)
    {
        this.#_shadowMapMatrix = matrix;
    }
    get shadowMapMatrix()
    {
        return this.#_shadowMapMatrix;
    }
    clear()
    {
        gl.clear(gl.DEPTH_BUFFER_BIT);
    }

}
class RSMRenderPass extends RenderPass
{
    constructor(gl,width,height)
    {
        const vertexShaderRSM = `#version 300 es
        #pragma vscode_glsllint_stage : vert
        layout(location = 0) in vec3 attrib_position;
        layout(location = 1) in vec3 attrib_normal;
        layout(location = 2) in vec2 attrib_texCoord;
        layout(location = 3) in vec4 attrib_tangent;
    
        out vec3 var_position;
        out vec2 var_uv;
        out vec3 var_normal;
        out vec3 var_tangent;

        uniform mat4 shadowMapMatrix;
        uniform mat4 modelMatrix;
    
        void main()
        {
    
            vec4 position = shadowMapMatrix*modelMatrix*vec4(attrib_position,1.0);
            var_position = vec3(modelMatrix*vec4(attrib_position,1.0));
            var_uv = attrib_texCoord;
            var_normal = attrib_normal;
            var_tangent = attrib_tangent.xyz;
            gl_Position = position;
        }
        `;
        const fragmentShaderRSM = `#version 300 es
        precision highp float;
        #pragma vscode_glsllint_stage : frag
        
        uniform sampler2D normalTexture;
        uniform sampler2D baseColorTexture;
        
        in vec3 var_position;
        in vec2 var_uv;
        in vec3 var_normal;
        in vec3 var_tangent;
    
        layout(location = 0) out vec3 out_albedo;
        layout(location = 1) out vec3 out_normal;
        layout(location = 2) out vec4 out_position;
        void main()
        {
            vec3 meshNormal = vec3(var_normal.x,var_normal.y,var_normal.z);
            vec3 meshTangent = vec3(var_tangent.x,var_tangent.y,var_tangent.z);
            vec3 bitangent = cross(normalize(meshTangent),normalize(meshNormal));
    
            mat3 TBN = mat3(var_tangent,bitangent,var_normal);
            vec3 normalTexture = texture(normalTexture,var_uv).rgb;
            normalTexture=(normalTexture.rgb-vec3(0.5f))*2.0f;
    
            out_albedo = texture(baseColorTexture,var_uv).rgb;
            out_normal = meshNormal;
            out_position = vec4(var_position,1.0);
        }
        `;
        const shader = new ShaderProgram(gl,vertexShaderRSM,fragmentShaderRSM);    
        const depthTexture = new DepthTexture(gl,width,height);
        const albedoTexture = new UintDataTexture(gl,null,width,height);
        const normalTexture = new UintDataTexture(gl,null,width,height);
        const positionTexture = new FloatTexture(gl,width,height);
        const framebuffer = new RSMFrameBuffer(gl,depthTexture,
            [albedoTexture,normalTexture,positionTexture]
            );
        super(gl,framebuffer,shader);
        this.#_width = width;
        this.#_height = height;
        this.shadowMapMatrix = glMatrix.mat4.create();
        this.#_rsm = {albedoTexture:albedoTexture.texture,
            normalTexture:normalTexture.texture,
            positionTexture:positionTexture.texture};
    }
    #_width;
    get width()
    {
        return this.#_width;
    }
    #_height;
    get height()
    {
        return this.#_height;
    }
    #_rsm;
    get rsm()
    {
        return this.#_rsm;
    }
    bind()
    {
        super.bind();
        this.gl.viewport(0.0,0.0,this.width,this.height);
    }
    setUniforms()
    {
        this.shader.setUniform("shadowMapMatrix","mat4",this._shadowMapMatrix);
    }
    set shadowMapMatrix(matrix)
    {
        this._shadowMapMatrix = matrix;
    }
    get shadowMapMatrix()
    {
        return this._shadowMapMatrix;
    }
}
class Framebuffer
{
    #gl;
    #framebuffer;
    constructor(gl,depthTexture= null,colorTextures = [])
    {
        this.#gl =gl;
        if(!(depthTexture===null && colorTextures.length===0))
        {
            this.#framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
            const colorAttachments = [];
            for(let i=0;i<colorTextures.length;i++)
            {
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER, // target
                    gl.COLOR_ATTACHMENT0+i,//attachment point
                    gl.TEXTURE_2D, // texture target
                    colorTextures[i].texture, // texturet
                    0 // mip level
                );
                colorAttachments.push(gl.COLOR_ATTACHMENT0+i);
            }
            gl.drawBuffers(colorAttachments);
            if(depthTexture!==null)
            {
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER, // target
                    gl.DEPTH_ATTACHMENT,//attachment point
                    gl.TEXTURE_2D, // texture target
                    depthTexture.texture, // texture
                    0 // mip level
                );
            }
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
        }
        else
        {
            this.#framebuffer = null;
        }
    }
    bind()
    {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
    }
    get gl()
    {
        return this.#gl;
    }
}
class DefaultFrameBuffer extends Framebuffer
{
    constructor(gl)
    {
        super(gl);
    }
}
class ShadowMapFrameBuffer extends Framebuffer
{
    constructor(gl,depthTexture){
        super(gl,depthTexture);
    }
};
class RSMFrameBuffer extends Framebuffer
{
    constructor(gl,depthTexture,colorTextures){
        super(gl,depthTexture,colorTextures);
        
    }
}
class Texture
{
    constructor(gl,width,height)
    {
        this.gl = gl;
        this.texture = gl.createTexture();
        this.size = {width,height};
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
    }
    bind(gl)
    {
        gl.bindTexture(gl.TEXTURE_2D,this.texture);
    }


}
class FloatTexture extends Texture
{
    constructor(gl,width,height,numOfComponents=4)
    {
        super(gl,width,height);
        switch(numOfComponents)
        {
            case 4:
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA32F,
                    width,
                    height,
                    0,
                    gl.RGBA,
                    gl.FLOAT,
                    null
                );
                break;
            case 3:
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGB32F,
                    width,
                    height,
                    0,
                    gl.RGB,
                    gl.FLOAT,
                    null
                );
                break;
                default:
                    throw new Error("Error: number of componets not supported");
        }
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

};
class DepthTexture extends Texture
{
    constructor(gl,width,height)
    {
        super(gl,width,height);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT32F,
            width,
            height,
            0,
            gl.DEPTH_COMPONENT,
            gl.FLOAT,
            null
        );
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

}
class UintDataTexture extends Texture
{
    constructor(gl,data,width=1,height=1,numOfChannels=3)
    {
        super(gl,width,height);
        
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
                    data
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
                    data
                );
                break;
            default:
                throw new Error("Error numsber of channels not supported");
        }
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    

}
class TextureFile extends Texture
{

    constructor(gl,path,onLoad)
    {
        super(gl,null,null);
        this.gl = gl;
        this.texture = null;
        this.#loadImage(path).then((imageBlob)=>{
            this.texture = this.#loadTexture(imageBlob,path);
            onLoad();
        });
    }
    static AsyncTextureFile(gl,path)
    {
        return new Promise((resolve)=>{
            const texture = new TextureFile(gl,path,()=>{
                resolve(texture);
            })
        });
    }

    #loadTexture(imageBlob,path)
    {
        const gl = this.gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        this.width = imageBlob.width;
        this.height = imageBlob.height;
        
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
    

        gl.generateMipmap(gl.TEXTURE_2D);
        return this.texture;
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
        if(this.#uniformMapLocationMap.get(uniformName)===null)
        {
            return null;
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
            case "mat4":
                gl.uniformMatrix4fv(
                    this.#uniformMapLocationMap.get(uniformName),
                    false,
                    uniformData
                );
                break;
            case "mat3":
                gl.uniformMatrix3fv(
                    this.#uniformMapLocationMap.get(uniformName),
                    false,
                    uniformData
                );
                break;
                default:
                    throw new Error("Error: uniform type not supported");
        }
    }
    setTexture(uniformName,glTexture,textureSlot)
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
        
        if(this.#uniformMapLocationMap.get(uniformName)===null)
        {
            return null;
        }

        gl.activeTexture(gl.TEXTURE0+textureSlot);
        gl.bindTexture(gl.TEXTURE_2D,glTexture);
        gl.uniform1i(this.#uniformMapLocationMap.get(uniformName),textureSlot);
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
        modelMatrix
        )
    {
        const gl = this.#gl;
        shader.setUniform("modelMatrix","mat4",modelMatrix);
        shader.setUniform("baseColorFactor","vec4",this.#_baseColorFactor);
        
        shader.setTexture("baseColorTexture",this.#_baseColorTexture.texture,0);
        shader.setTexture("metallicRoughnessTexture",this.#_metallicRoughnessTexture.texture,1);
        shader.setTexture("normalTexture",this.#_normalTexture.texture,2);


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
        this.#getStringFile(path).then((stringFile)=>{
            this.#gltfObj = JSON.parse(stringFile);

            const bufferPromise = this.#loadBuffers(this.#gltfObj.buffers,currentDirectory);
            const texturePromises = Promise.all(this.#gltfObj.images.map((image)=>{
                return TextureFile.AsyncTextureFile(gl,currentDirectory+image.uri)
            }));
            return Promise.all([bufferPromise,texturePromises]);
        }).then((bufferAndTextures)=>{
            this.#rawBuffers = loadBufferSlices(this.#gltfObj.bufferViews,bufferAndTextures[0]);
            this.#textures = bufferAndTextures[1];
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

    #loadBuffers(buffers,currentDirectory)
    {
        if(buffers!=undefined)
        {
            const numOfBuffers = buffers.length;
            const onProgressBuffers = (event)=>{
                if (event.lengthComputable)
                loadingModelProgress = ((event.loaded / event.total*numOfBuffers) * 100).toFixed(2);
        
            };
            let binFileBuffersPromises = buffers.map((buffer) => {
                return getBinaryFile(currentDirectory + buffer.uri, onProgressBuffers);
            });
            return Promise.all(binFileBuffersPromises);
        
        }
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
            metallicRoughnessTexture = new UintDataTexture(this.#gl,new Uint8Array([0,0,0]));
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
            normalTexture = new UintDataTexture(this.#gl,new Uint8Array([128,128,255]));
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
    #_gl;
    constructor(canvasElement)
    {

        this.#_gl = canvasElement.getContext("webgl2", { antialias: false });
        
        const ext = this.#_gl.getExtension("EXT_color_buffer_float");
        if (!this.#_gl && !ext) 
        {
            throw new Error("The device in not capable.");
        }
        
        const gl = this.#_gl;//for ease of typing
        gl.clearColor(1.0,1.0,1.0,1.0);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT); 
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
    #drawNode(node,modelMatrix,renderPass)
    {
        const gl = this.#_gl;//for ease of typing
        if(node.primitives!== undefined)
        {

            node.primitives.map((primitive)=>{
                primitive.material.setUniforms(
                    renderPass.shader,
                    modelMatrix
                    ); 
                renderPass.setUniforms();   
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
    draw(drawble,renderPass)
    {
        const gl = this.#_gl;//for ease of typing
        const stackData = [];
        renderPass.bind();
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        //shader.useProgram();
        let currentNode = drawble.nodeRoot;
        let modelMatrix = this.#computeModelMatrix(currentNode);
        let currentData = {node:currentNode,currentModelMatrix:modelMatrix};
        stackData.push(currentData);
        do//TODO precompute model matrices to enable sorting (research)
        {
            this.#drawNode(currentData.node,modelMatrix,renderPass);
            
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