function initViewProjectionMatrix(canvasElement) {
    this.forwardDirection = glMatrix.vec3.fromValues(
        -0.9267086982727051,
        0.1860613077878952,
        -0.3264854848384857
    );

    this.position = glMatrix.vec3.fromValues(
        7.51,
        -5.57,
        1.57
    );
    
    return (inputData, modelMatrix) => {
        let leftDirection = glMatrix.vec3.create();
        glMatrix.vec3.cross(leftDirection, [0, 1, 0], this.forwardDirection);
        glMatrix.vec3.normalize(leftDirection, leftDirection);

        let upDirection = glMatrix.vec3.create();
        glMatrix.vec3.cross(upDirection, this.forwardDirection, leftDirection);
        glMatrix.vec3.normalize(upDirection, upDirection);

        let forwardDisplacement = glMatrix.vec3.create();
        glMatrix.vec3.mul(forwardDisplacement, this.forwardDirection, [
            inputData.deltaPosition.forward,
            inputData.deltaPosition.forward,
            inputData.deltaPosition.forward,
        ]);
        glMatrix.vec3.add(this.position, this.position, forwardDisplacement);

        let leftDisplacement = glMatrix.vec3.create();
        glMatrix.vec3.mul(leftDisplacement, leftDirection, [
            inputData.deltaPosition.left,
            inputData.deltaPosition.left,
            inputData.deltaPosition.left,
        ]);
        glMatrix.vec3.add(this.position, this.position, leftDisplacement);

        let horizontalRotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.rotate(
            horizontalRotationMatrix,
            horizontalRotationMatrix,
            inputData.deltaMouse.x * 0.05,
            upDirection
        );

        let forwardDirectionVec4 = glMatrix.vec4.fromValues(
            this.forwardDirection[0],
            this.forwardDirection[1],
            this.forwardDirection[2],
            1.0
        );
        glMatrix.vec4.transformMat4(
            forwardDirectionVec4,
            forwardDirectionVec4,
            horizontalRotationMatrix
        );

        let verticalRotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.rotate(
            verticalRotationMatrix,
            verticalRotationMatrix,
            inputData.deltaMouse.y * 0.05,
            leftDirection
        );

        glMatrix.vec4.transformMat4(
            forwardDirectionVec4,
            forwardDirectionVec4,
            verticalRotationMatrix
        );

        this.forwardDirection = glMatrix.vec3.fromValues(
            forwardDirectionVec4[0],
            forwardDirectionVec4[1],
            forwardDirectionVec4[2]
        );

        inputData.deltaMouse.x = 0;
        inputData.deltaMouse.y = 0;
        let rotationMatrix = glMatrix.mat4.fromValues(
            -leftDirection[0],
            -leftDirection[1],
            -leftDirection[2],
            0,
            upDirection[0],
            upDirection[1],
            upDirection[2],
            0,
            forwardDirectionVec4[0],
            forwardDirectionVec4[1],
            forwardDirectionVec4[2],
            0,
            0,
            0,
            0,
            1
        );

        glMatrix.mat4.transpose(rotationMatrix, rotationMatrix);

        let translateMatrix = glMatrix.mat4.create();
        glMatrix.mat4.translate(
            translateMatrix,
            translateMatrix,
            this.position
        );

        var viewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(viewMatrix, rotationMatrix, translateMatrix);

        if(modelMatrix!=undefined)
        {
            //glMatrix.mat4.mul(viewMatrix, viewMatrix, modelMatrix);
        }

        let projectionMatrix = glMatrix.mat4.create();
        let screenRatio =
            canvasElement.offsetWidth / canvasElement.offsetHeight;

        glMatrix.mat4.perspective(
            projectionMatrix,
            10 * (180 / Math.PI),
            screenRatio,
            0.1,
            10000
        );

        let mvpMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(mvpMatrix, projectionMatrix, viewMatrix);

        if (this.position[0] === NaN) {
            console.log(delta);
        }
        return {
            mvpMatrix: mvpMatrix,
            rotationMatrix: rotationMatrix,
            cameraPosition: this.position,
        };
    };
}
function getRotationMatrixFromPolarAngles(verticalAngle, horizontalAngle) {
    const sphericalQuaternion = glMatrix.quat.create();
    glMatrix.quat.fromEuler(
        sphericalQuaternion,
        verticalAngle,
        horizontalAngle,
        0
    );
    const Xaxis = glMatrix.vec3.fromValues(1.0, 0.0, 0.0);
    glMatrix.vec3.transformQuat(Xaxis, Xaxis, sphericalQuaternion);

    const Yaxis = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);
    glMatrix.vec3.transformQuat(Yaxis, Yaxis, sphericalQuaternion);

    const Zaxis = glMatrix.vec3.fromValues(0.0, 0.0, 1.0);
    glMatrix.vec3.transformQuat(Zaxis, Zaxis, sphericalQuaternion);

    return glMatrix.mat3.fromValues(
        Xaxis[0],
        Xaxis[1],
        Xaxis[2],
        Yaxis[0],
        Yaxis[1],
        Yaxis[2],
        Zaxis[0],
        Zaxis[1],
        Zaxis[2]
    );
}
function getShadowMapUniforms(shadowMapData) {
    const position = glMatrix.vec3.fromValues(
        shadowMapData["position x"],
        shadowMapData["position y"],
        shadowMapData["position z"]
    );
    const rotationMatrix = getRotationMatrixFromPolarAngles(
        shadowMapData["vertical angle"],
        shadowMapData["horizontal angle"]
    );
    const scale = shadowMapData.scale;

    const matrix = glMatrix.mat4.create();

    const sphericalQuaternion = glMatrix.quat.create();
    glMatrix.quat.fromEuler(
        sphericalQuaternion,
        shadowMapData["vertical angle"],
        shadowMapData["horizontal angle"],
        0
    );

    const scaleVec = glMatrix.vec3.fromValues(scale, scale, scale);

    const sampleSpan = shadowMapData.SampleSpan;
    glMatrix.mat4.fromRotationTranslationScale(
        matrix,
        sphericalQuaternion,
        position,
        scaleVec
    );

    const inverse = glMatrix.mat4.create();
    glMatrix.mat4.invert(inverse, matrix);
    return {
        position: position,
        scale: scale,
        rotationMatrix: rotationMatrix,
        matrix: matrix,
        inverse: inverse,
        sampleSpan
    };
}
