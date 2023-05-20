function getModelMatrix(gltfObj) {
    let modelMatrix = glMatrix.mat4.create();
    if (gltfObj.nodes[0].scale != undefined) {
        let scaleVector = glMatrix.vec3.fromValues(
            gltfObj.nodes[0].scale[0],
            gltfObj.nodes[0].scale[1],
            gltfObj.nodes[0].scale[2]
        );
        glMatrix.mat4.scale(modelMatrix, modelMatrix, scaleVector);
    }
    return modelMatrix;
}
function createTexture(gl,width,height,internalFormat,format,type,data,fbAttachmentPoint)
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
        data // data
    );
    if(type == gl.FLOAT)
    {

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    else{
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
    }
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    return {width,height,texture,fbAttachmentPoint};
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
    const shadowMapMatrixLocation = gl.getUniformLocation(
        shadowMapProgram,
        "shadowMapMatrix"
    );
    const texture = createTexture(gl,width,height,gl.DEPTH_COMPONENT32F,gl.DEPTH_COMPONENT,gl.FLOAT,null,gl.DEPTH_ATTACHMENT);

    
    return {
        ...createFramebuffer(gl,{depth:texture},gl.DEPTH_ATTACHMENT),
        program:shadowMapProgram,
        shadowMapMatrixLocation

    }; 
}
function createFramebuffer(gl,textures){
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
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
    return {frameBuffer:fb,textures:textures};

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
function createReflectiveShadowmap(gl)
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
    uniform mat4 shadowProjection;
    uniform mat4 modelMatrix;

    void main()
    {

        vec4 position = shadowProjection*modelMatrix*vec4(attrib_position,1.0);
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
    uniform sampler2D normalMap;
    uniform sampler2D albedo;
    
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
        vec3 normalTexture = texture(normalMap,var_uv).rgb;
        normalTexture=(normalTexture.rgb-vec3(0.5f))*2.0f;

        out_albedo = texture(albedo,var_uv).rgb;
        out_normal = meshNormal;
        out_position = vec4(var_position,1.0);
    }
    `;
    const rsmProgram = compileShaderProgram(gl,vertexShaderRSM,fragmentShaderRSM);


    const shadowProjectionLocation = gl.getUniformLocation(
        rsmProgram,
        "shadowProjection"
    );

    const modelMatrixLocation = gl.getUniformLocation(
        rsmProgram,
        "modelMatrix"
    );
    const normalMapUniformLocation = gl.getUniformLocation(
        rsmProgram,
        "normalMap"
    );
    const albedoUniformLocation = gl.getUniformLocation(
        rsmProgram,
        "albedo"
    );
    const rsmSize = 512;

    const albedoTexture = createTexture(gl,rsmSize,rsmSize,gl.RGB8,gl.RGB,gl.UNSIGNED_BYTE,null,gl.COLOR_ATTACHMENT0);
    const normalTexture = createTexture(gl,rsmSize,rsmSize,gl.RGB8,gl.RGB,gl.UNSIGNED_BYTE,null,gl.COLOR_ATTACHMENT1);
    const positionTexture = createTexture(gl,rsmSize,rsmSize,gl.RGBA32F,gl.RGBA,gl.FLOAT,null,gl.COLOR_ATTACHMENT2);
    const depthTexture = createTexture(gl,rsmSize,rsmSize,gl.DEPTH_COMPONENT32F,gl.DEPTH_COMPONENT,gl.FLOAT,null,gl.DEPTH_ATTACHMENT);
    const textures= {positionTexture,albedoTexture,normalTexture,depthTexture};
    const rsmFramebuffer = createFramebuffer(gl,textures);
    return {
        framebuffer:rsmFramebuffer,
        program:rsmProgram,
        shadowProjectionLocation,
        modelMatrixLocation,
        normalMapUniformLocation,
        albedoUniformLocation,
        rsmSize
    }; 

}
async function compileForwardShaderProgram(gl)
{

    const vertexShaderSource = await getStringFile("/shaders/shader.vs");

    const fragmentShaderSource = await getStringFile("/shaders/shader.fs");
    const program = compileShaderProgram(gl,vertexShaderSource,fragmentShaderSource);


    const baseColorFactorUniform = gl.getUniformLocation(
        program,
        "colorFactor"
    );

    const metallicFactorUniform = gl.getUniformLocation(
        program,
        "metalnessFactor"
    );

    const roughnessFactorUniform = gl.getUniformLocation(
        program,
        "RoughnessFactor"
    );
 
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
    const rsmPositionLocation = gl.getUniformLocation(
        program,
        "positionRSM"
    );
    const rsmNormalLocation = gl.getUniformLocation(
        program,
        "normalRSM"
    );
    const rsmAlbedoLocation = gl.getUniformLocation(
        program,
        "albedoRSM"
    );
    const vpUniformLocation = gl.getUniformLocation(program, "vp");
    const modelMatrixUniformLocation = gl.getUniformLocation(program, "modelMatrix");
    const metallicRoughnessUniformLocation = gl.getUniformLocation(
        program,
        "metallicRoughness"
    );
    const sampleSpanLocation = gl.getUniformLocation(
        program,
        "sampleSpan"
    );
    return {
        program:program,
        normalSamplerUniformLocation,
        shadowMapSamplerUniformLocation,
        vpUniformLocation,
        metallicRoughnessUniformLocation,
        cameraPositionUniformLocation,
        colorSamplerUniformLocation,
        rotationMatrixUniform,
        lightOriginUniformLocation,
        projectedShadowMapMatrixUniformLocation,
        baseColorFactorUniform,
        metallicFactorUniform,
        roughnessFactorUniform,
        modelMatrixUniformLocation,
        rsmPositionLocation,
        rsmNormalLocation,
        rsmAlbedoLocation,
        sampleSpanLocation
    }
}
function compileSHShaderProgram(gl)
{
    const vertexShaderSH = `#version 300 es
    #pragma vscode_glsllint_stage : vert

    layout(location = 0) in vec3 attrib_position;

    
    uniform mat4 matrix;
    uniform highp sampler3D offsets;

    out vec3 var_position;

    void main()
    {
        ivec3 texture_size = textureSize(offsets,0);
        float texture_total_size = float(texture_size.x*texture_size.y*texture_size.z);
        float x = float((gl_InstanceID/(texture_size.x*texture_size.y))%texture_size.z);
        float y = float((gl_InstanceID/texture_size.x)%texture_size.y);
        float z = float(gl_InstanceID%texture_size.x);

        vec3 offset = texture(offsets,vec3(x/float(texture_size.x),y/float(texture_size.y),z/float(texture_size.z))).xyz;
        vec3 position = (offset*0.4+attrib_position*0.1)+vec3(0.0,1.5,0.0);
        vec4 t_position = (matrix*vec4(position,1.0));
        var_position = attrib_position;
        gl_Position = t_position;
    }
    `;
    const fragmentShaderSH = `#version 300 es
    precision highp float;
    #pragma vscode_glsllint_stage : frag
    
    float pi = radians(180.0);
    float sh_l0m0(vec3 pos)
    {
        pos=normalize(pos);
        return sqrt(1.0/pi)/2.0;
    }
    float sh_l1m1(vec3 pos)
    {
        pos=normalize(pos);
        float theta = atan(pos.y/pos.x);
        float phi = acos(pos.z/length(pos));
        return  sqrt(3.0/(4.0*pi))*(pos.x*length(pos));
    }
    float sh_l1m0(vec3 pos)
    {
        pos=normalize(pos);
        float theta = atan(pos.y/pos.x);
        return  sqrt(3.0/(4.0*pi))*(pos.y*length(pos));
    }
    float sh_l1m_1(vec3 pos)
    {
        pos=normalize(pos);
        return sqrt(3.0/(4.0*pi))*(pos.z/length(pos));
    }
    float topFace(vec3 pos)
    {
        if(pos.y>=0.0)
        {
            return 0.0;
        }
        else{
            pos= normalize(pos);
            //x=a*t
            //y=b*t
            //z=c*t
            //y=1
            //1=b*t
            //t=1/b
            float intersection_x=-pos.x/pos.y;
            float intersection_z=-pos.z/pos.y;
            if(intersection_x<=1.0&&intersection_x>=-1.0&&intersection_z<=1.0&&intersection_z>=-1.0)
            {
                return 1.0;
            }
            else
            {
                return 0.0;
            }
        }
    }
    in vec3 var_position;
    out vec4 out_color;
    void main()
    {
        float sh00 = sh_l0m0(var_position)*0.5565505091843331;
        float sh1_1 = sh_l1m_1(var_position)*0.8632452762092662;
        float sh10 = sh_l1m0(var_position)*0.013954498466489768;
        float sh11 = sh_l1m1(var_position)*-0.07654174673485471;
        float output_sh = sh00+sh1_1+sh10+sh11;
        out_color = vec4(-min(0.0,output_sh),max(0.0,output_sh),0.0,1.0);
    }
    `;
    let program = compileShaderProgram(gl,vertexShaderSH,fragmentShaderSH);
    let matrixUniformLocation = gl.getUniformLocation(program,"matrix");
    let offsetsTextureLocation = gl.getUniformLocation(program,"offsets");
    return {
        program,
        matrixUniformLocation,
        offsetsTextureLocation
    };
}
function create_3d_framebuffer(gl,texture_3d)
{
    const framebuffer = gl.createFramebuffer();
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture3D(
        gl.FRAMEBUFFER, // target
        gl.COLOR_ATTACHMENT0,//gl.DEPTH_ATTACHMENT, // attachment point
        gl.TEXTURE_3D, // texture target
        texture_3d, // texture
        0 // mip level
    );
}

function loadBuffers(buffers,currentDirectory)
{
    
    if(buffers!=undefined)
    {
        numOfBuffers = buffers.length;
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
function loadImages(gl,images,currentDirectory)
{
    
    const loadingMessageElement = document.getElementById("loading-message");
    if(images!=undefined)
        {
            glTextures = images.map(async (image) => {
                image.loadingProgress = 0;
                const imageURI = image.uri;
        
                const colorImagePromise = loadImage(
                    currentDirectory + imageURI,
                    (e) => {
                        if (e.lengthComputable)
                            image.loadingProgress = parseInt(
                                (e.loaded / e.total) * 100
                            );
        
                        totalTextureProgress = images.reduce(
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
                            (totalTextureProgress / images.length).toFixed(2) +
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
            return Promise.all(glTextures);
            
        }
}
function loadBufferSlices(bufferViews,rawBufferFiles)
{
    if(bufferViews!=undefined)
    {
        return bufferViews.map((bufferView) => {
            let rawBufferFile = rawBufferFiles[bufferView.buffer];
            let bufferSlice = rawBufferFile.slice(
                bufferView.byteOffset,
                bufferView.byteOffset + bufferView.byteLength
            );
    
            return bufferSlice;
        });
    
    }
}
function setUpAttribute(gl,attribute,bufferSlice,accesorType,type,offset)
{
    gl.enableVertexAttribArray(attribute);

    const glBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        bufferSlice,
        gl.STATIC_DRAW
    );

    switch (accesorType) {
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
    let normalize = false; // don't normalize the data
    let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next positio
    gl.vertexAttribPointer(
        attribute,
        size,
        type,
        normalize,
        stride,
        offset
    );
}

function create_3d_texture(gl,internal_format,width,height,depth,format,type,buffer)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texImage3D(
        gl.TEXTURE_3D, // target
        0, // mip level
        internal_format,//gl.RGB32F, // internal format
        width, // width
        height, // height
        depth, // depth
        0, // border
        format,//gl.RGB, // format
        type, //gl.FLOAT// type
        buffer); // data
    
    
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_3D, null);
    return texture;
}
async function loadGLTF(gl, paths,materialOverride) {
    let numOfImages = 1;
    let loadingModelProgress = 0;
    let totalTextureProgress = 0;
    const loadingMessageElement = document.getElementById("loading-message");
    loadingMessageElement.innerHTML =
    "<p>Model: " +
    loadingModelProgress +
    " % <br>" +
    "Textures: " +
    (totalTextureProgress / numOfImages).toFixed(2) +
    "%</p>";

    const drawblesPromises =
    (paths.map(async (path)=>{
        const currentDirectory = path.slice(0, path.lastIndexOf("/") + 1);
        const gltfObj = JSON.parse(await getStringFile(path));
        let rawBufferFiles = await loadBuffers(gltfObj.buffers,currentDirectory);

        let glTextures = await loadImages(gl,gltfObj.images,currentDirectory);
        
        let bufferSlices = loadBufferSlices(gltfObj.bufferViews,rawBufferFiles);

        
        const positionAttributeLocation = 0;
        const normalAttributeLocation = 1;
        const texCoordAttributeLocation = 2;
        const tangentAttributeLocation = 3;
    
        let drawblesPromises;
        if(gltfObj.meshes[0]!= undefined)
        {
            drawblesPromises = gltfObj.meshes[0].primitives.map(
                async (primitive) => {
                    let drawble = {};
                    drawble.vao = gl.createVertexArray();
    
                    gl.bindVertexArray(drawble.vao);
                    
                    
                    const positionAccessorIndex = primitive.attributes.POSITION;
                    const positionAccessor = gltfObj.accessors[positionAccessorIndex];
                    const positionBufferviewIndex = positionAccessor.bufferView;
                    const positionAttributeBuffer = bufferSlices[positionBufferviewIndex];
                    setUpAttribute(gl,positionAttributeLocation,positionAttributeBuffer,positionAccessor.type,gl.FLOAT,positionAccessor.offset);
                    
                    const texCoordAccessorIndex = primitive.attributes.TEXCOORD_0;
                    const texCoordAccessor = gltfObj.accessors[texCoordAccessorIndex];
                    drawble.hasUVs = false;
                    if(texCoordAccessor!=undefined)
                    {
                        drawble.hasUVs = true;
                        const texCoordBufferviewIndex = texCoordAccessor.bufferView;
                        const texCoordAttributeBuffer = bufferSlices[texCoordBufferviewIndex];
                        setUpAttribute(gl,texCoordAttributeLocation,texCoordAttributeBuffer,texCoordAccessor.type,gl.FLOAT,texCoordAccessor.offset);
                    }
                    
                    //normal Attribute
                    const normalAccessorIndex = primitive.attributes.NORMAL;
                    const normalAccessor = gltfObj.accessors[normalAccessorIndex];
                    drawble.hasNormals = false;
                    if(normalAccessor != undefined)
                    {
                        drawble.hasNormals = true;
                        const normalBufferViewIndex = normalAccessor.bufferView;
                        const normalAttributeBuffer = bufferSlices[normalBufferViewIndex];
                        //create normal buffer
                        setUpAttribute(gl,normalAttributeLocation,normalAttributeBuffer,normalAccessor.type,gl.FLOAT,normalAccessor.offset);
                        
                    }
     
        
                    //tangent Attribute
                    //gl.enableVertexAttribArray(tangentAttributeLocation);
                    const tangentAccessorIndex = primitive.attributes.TANGENT;
        
                    drawble.tangentAttributeLocation = null;
                    drawble.hasTangent = false;
                    if (tangentAccessorIndex != undefined) {
                        drawble.hasTangent = true;
                        gl.enableVertexAttribArray(tangentAttributeLocation);
                        const tangentAccessor = gltfObj.accessors[tangentAccessorIndex];
                        const tangentBufferViewIndex = tangentAccessor.bufferView;
                        const tangentBufferView =
                            gltfObj.bufferViews[tangentBufferViewIndex];
                        const tangentAttributeBuffer =
                            bufferSlices[tangentBufferViewIndex];
        
                        setUpAttribute(gl,tangentAttributeLocation,tangentAttributeBuffer,tangentAccessor.type,gl.FLOAT,tangentAccessor.offset);
                        //create tangentBuffer
        
                        
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
                    const defaultColorFactor = [0.8,0.8,0.8,1.0];
                    const defaultMetalnessFactor = 0.0;
                    const defaultRoughnessFactor = 0.8;
                    
                    drawble.baseColorFactor = defaultColorFactor;
                    drawble.metallicFactor = defaultMetalnessFactor;
                    drawble.roughnessFactor = defaultRoughnessFactor;
                    if(gltfObj.materials!=undefined)
                    {
                        const material = gltfObj.materials[materialIndex];
        
                        const colorTextureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
                        const imageIndex = gltfObj.textures[colorTextureIndex].source;
            
                        if (material.baseColorTexture != undefined) {
                            drawble.glAlbedoTexture = glTextures[imageIndex];
                        }
                        if(material.baseColorFactor != undefined)
                        {
                            drawble.baseColorFactor = material.baseColorFactor;
                        }
                        
                        if(material.metallicFactor != undefined){
                            drawble.metallicFactor = material.metallicFactor;
                        }
                        if(material.metallicFactor != undefined){
                            drawble.roughnessFactor = material.roughnessFactor;
                        }
    
                        if (material.pbrMetallicRoughness.baseColorTexture != undefined) {
                            const albedoTextureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
                            drawble.glAlbedoTexture = glTextures[albedoTextureIndex];
                        }
            
                        if (material.normalTexture != undefined) {
                            const normalTextureIndex = material.normalTexture.index;
                            const imageNormalIndex =
                                gltfObj.textures[normalTextureIndex].source;
                            drawble.glNormalTexture = glTextures[imageNormalIndex];
                        }
            
            
                        if (material.pbrMetallicRoughness.metallicRoughnessTexture !=undefined)
                        {
                            const metallicRoughnessTextureIndex = material.pbrMetallicRoughness.metallicRoughnessTexture.index;
                            drawble.glMetallicRoughnessTexture = glTextures[metallicRoughnessTextureIndex];
                        }
                    }else{

                    }
    
                    drawble.modelMatrix = getModelMatrix(gltfObj);
                    
                    gl.bindVertexArray(null);
                    return drawble;
                }
            );
        }
        return await Promise.all(drawblesPromises);
    
    }));
    const drawbles = (await Promise.all(drawblesPromises)).flat();

    const forwardProgram = await compileForwardShaderProgram(gl);
   
    const depthTextureSize = 1024;
    const shadowFramebuffer = createDepthTextureFramebuffer(gl,depthTextureSize,depthTextureSize);
    
    const rsm = createReflectiveShadowmap(gl);

    const shVizSHader = compileSHShaderProgram(gl);
    
    const offsets = [];
    const offsetStep = 4;
    const offsetDimension=20;
    const startOffset = -Math.floor(offsetDimension/2);
    const endOffset = Math.floor(offsetDimension/2);
    for(let i=startOffset;i<=endOffset;i++)
    {
        for(let j=startOffset;j<=endOffset;j++)
        {
            for(let k=startOffset;k<=endOffset;k++)
            {
                offsets.push(i*offsetStep);
                offsets.push(j*offsetStep);
                offsets.push(k*offsetStep);
            }
        }
    }
    const SH_debug_texture = create_3d_texture(gl,gl.RGB32F,offsetDimension,offsetDimension,offsetDimension,gl.RGB,gl.FLOAT,new Float32Array(offsets));
    
    console.log(rsm);
    return {
        drawShadowMap: function (matrix) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFramebuffer.frameBuffer);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, shadowFramebuffer.textures.depth.height, shadowFramebuffer.textures.depth.width);
            gl.useProgram(shadowFramebuffer.program);
            
            drawbles.map((drawble) => {
                const mvp = glMatrix.mat4.create();
                glMatrix.mat4.mul(mvp,matrix.inverse,drawble.modelMatrix)
                gl.uniformMatrix4fv(
                    shadowFramebuffer.shadowMapMatrixLocation,
                    false,
                    mvp
                );

                gl.uniformMatrix4fv(
                    shadowFramebuffer.modelMatrix,
                    false,
                    drawble.modelMatrix
                );

                gl.bindVertexArray(drawble.vao);

                if(drawble.hasPosition)
                    gl.enableVertexAttribArray(drawble.positionAttributeLocation);
                gl.drawElements(
                    gl.TRIANGLES,
                    drawble.count,
                    drawble.indiceType,
                    0
                );
            });

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return shadowFramebuffer.textures.depth.texture;
        },
        drawRSM:function(matrix){        
            gl.bindFramebuffer(gl.FRAMEBUFFER,rsm.framebuffer.frameBuffer);
            gl.viewport(0,0,rsm.rsmSize,rsm.rsmSize);
            
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.useProgram(rsm.program);
            drawbles.map((drawble)=>{
                gl.uniformMatrix4fv(
                    rsm.modelMatrixLocation,
                    false,
                    drawble.modelMatrix
                );
                gl.uniformMatrix4fv(
                    rsm.shadowProjectionLocation,
                    false,
                    matrix.inverse
                );
                gl.uniform1i(rsm.albedoUniformLocation, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, drawble.glAlbedoTexture);
                

                gl.bindVertexArray(drawble.vao);               
                if(drawble.hasPosition)
                    gl.enableVertexAttribArray(drawble.positionAttributeLocation);
                if(drawble.hasUVs)
                    gl.enableVertexAttribArray(drawble.texCoordAttributeLocation);
                if(drawble.hasNormals)
                    gl.enableVertexAttribArray(drawble.normalAttributeLocation);
                if(drawble.hasTangent) 
                {
                    gl.enableVertexAttribArray(drawble.tangentAttributeLocation);
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D,drawble.glNormalTexture);
                    gl.uniform1i(rsm.normalMapUniformLocation, 1);
                }
                gl.drawElements(
                    gl.TRIANGLES,
                    drawble.count,
                    drawble.indiceType,
                    0
                );
            });
            
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D,null);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D,null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return {fb:rsm.framebuffer};
        },
        drawSH:function(probeMatrix){
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.useProgram(shVizSHader.program);
            
            drawbles.map((drawble) => {
                gl.uniformMatrix4fv(
                    shVizSHader.matrixUniformLocation,
                    false,
                    probeMatrix
                );
                gl.bindVertexArray(drawble.vao);

                gl.uniform1i(shVizSHader.offsetsTextureLocation, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_3D, SH_debug_texture);
                if(drawble.hasPosition)
                    gl.enableVertexAttribArray(drawble.positionAttributeLocation);
                gl.drawElementsInstanced(
                    gl.TRIANGLES,
                    drawble.count,
                    drawble.indiceType,
                    0,
                    offsetDimension*offsetDimension*offsetDimension
                );
            });


        },
        draw: function (uniformMatrices, shadowMapUniforms) {

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.useProgram(forwardProgram.program);
            drawbles.map((drawble) => {

                gl.uniform4fv(forwardProgram.baseColorFactorUniform,drawble.baseColorFactor);

                gl.uniform1f(forwardProgram.metallicFactorUniform,drawble.metallicFactor);
                gl.uniform1f(forwardProgram.roughnessFactorUniform,drawble.roughnessFactor);

                gl.uniformMatrix4fv(
                    forwardProgram.projectedShadowMapMatrixUniformLocation,
                    false,
                    shadowMapUniforms.inverse
                );
                gl.uniform3fv(
                    forwardProgram.lightOriginUniformLocation,
                    shadowMapUniforms.position
                );
                gl.uniformMatrix3fv(
                    forwardProgram.rotationMatrixUniform,
                    false,
                    shadowMapUniforms.rotationMatrix
                );
                gl.uniform3fv(
                    forwardProgram.cameraPositionUniformLocation,
                    uniformMatrices.cameraPosition
                );
                gl.uniformMatrix4fv(
                    forwardProgram.vpUniformLocation,
                    false,
                    uniformMatrices.mvpMatrix
                );
                gl.uniformMatrix4fv(
                    forwardProgram.modelMatrixUniformLocation,
                    false,
                    drawble.modelMatrix
                );

                gl.uniform1f(forwardProgram.sampleSpanLocation, shadowMapUniforms.sampleSpan);


                gl.uniform1i(forwardProgram.colorSamplerUniformLocation, 0);
                gl.uniform1i(forwardProgram.shadowMapSamplerUniformLocation, 1);
                gl.uniform1i(forwardProgram.normalSamplerUniformLocation, 2);
                gl.uniform1i(forwardProgram.metallicRoughnessUniformLocation, 3);
                gl.uniform1i(forwardProgram.rsmAlbedoLocation, 4);
                gl.uniform1i(forwardProgram.rsmNormalLocation, 5);
                gl.uniform1i(forwardProgram.rsmPositionLocation, 6);
                
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, drawble.glAlbedoTexture);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, shadowFramebuffer.textures.depth.texture);
                if (drawble.glNormalTexture != undefined) {
                    gl.activeTexture(gl.TEXTURE2);
                    gl.bindTexture(gl.TEXTURE_2D, drawble.glNormalTexture);
                }
                if (drawble.glMetallicRoughnessTexture != undefined) {
                    gl.activeTexture(gl.TEXTURE3);
                    gl.bindTexture(
                        gl.TEXTURE_2D,
                        drawble.glMetallicRoughnessTexture
                    );
                }
                gl.activeTexture(gl.TEXTURE4);
                gl.bindTexture(gl.TEXTURE_2D, rsm.framebuffer.textures.albedoTexture.texture);
                
                gl.activeTexture(gl.TEXTURE5);
                gl.bindTexture(gl.TEXTURE_2D, rsm.framebuffer.textures.normalTexture.texture);
                
                gl.activeTexture(gl.TEXTURE6);
                gl.bindTexture(gl.TEXTURE_2D, rsm.framebuffer.textures.positionTexture.texture);

                gl.bindVertexArray(drawble.vao);

                if(drawble.hasPosition)
                    gl.enableVertexAttribArray(drawble.positionAttributeLocation);
                if(drawble.hasUVs)
                    gl.enableVertexAttribArray(drawble.texCoordAttributeLocation);
                if(drawble.hasNormals)
                    gl.enableVertexAttribArray(drawble.normalAttributeLocation);
                if(drawble.hasTangent)                
                    gl.enableVertexAttribArray( drawble.tangentAttributeLocation);
                gl.drawElements(
                    gl.TRIANGLES,
                    drawble.count,
                    drawble.indiceType,
                    0
                );
                
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D,null);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D,null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            });
        },
    }
}
async function loadSponza(gl) {
    return loadGLTF(gl, ["sphere/sphere.gltf","sponza/Sponza.gltf"]);
}
