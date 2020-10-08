function initViewProjectionMatrix() {

    this.forwardDirection = glMatrix.vec4.fromValues(0.0, 0.0, -1.0);

    this.position = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);

    return (inputData, modelMatrix) => {

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

        glMatrix.mat4.mul(viewMatrix, viewMatrix, modelMatrix);


        let projectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projectionMatrix, 35 * (180 / Math.PI), 1280 / 720, 0.1, 10000);


        let mvpMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(mvpMatrix, projectionMatrix, viewMatrix);


        if (this.position[0] === NaN) {
            console.log(delta);
        }
        return mvpMatrix;
    }

}