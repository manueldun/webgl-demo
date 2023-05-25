class Camera{
    #keyW;
    #keyS;
    #keyA;
    #keyD;
    #mouseDownX;
    #mouseDownY;
    #clickedMouseButton;
    #deltaMouse;
    #canvasElement;
    constructor(canvasElement)
    {
        this.#canvasElement = canvasElement;
        this.#keyW = false;
        this.#keyS = false;
        this.#keyA = false;
        this.#keyD = false;

        window.addEventListener("keydown",(e)=>{
        
            switch (e.code) {
                case "KeyW":
                    this.#keyW = true;
                    break;
                case "KeyS":
                    this.#keyS = true;
                    break;
                case "KeyA":
                    this.#keyA = true;
                    break;
                case "KeyD":
                    this.#keyD = true;
                    break;
                default:
            }
        });
    
        window.addEventListener("keyup", (e) =>{
            switch (e.code) {
                case "KeyW":
                    this.#keyW = false;
                    break;
                case "KeyS":
                    this.#keyS = false;
                    break;
                case "KeyA":
                    this.#keyA = false;
                    break;
                case "KeyD":
                    this.#keyD = false;
                    break;
                default:
            }
        });
        this.#mouseDownX = 0.0;
        this.#mouseDownY = 0.0;
        this.#clickedMouseButton = false;
        canvasElement.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const touches = e.changedTouches;
            clickedMouseButton = true;
            this.#mouseDownX = touches[0].pageX;
            this.#mouseDownY = touches[0].pageY;
        });
        canvasElement.addEventListener("mousedown", (e)=>{

            if (typeof e === "object") {
                switch (e.button) {
                    case 0:
                        clickedMouseButton = true;
                        this.#mouseDownX = e.clientX;
                        this.#mouseDownY = e.clientY;
                        break;
                }
            }
        });
        
        canvasElement.addEventListener("touchend", (e) => {
            e.preventDefault();
            clickedMouseButton = false;
        });
        canvasElement.addEventListener("mouseup",  (e) =>{
            if (typeof e === "object") {
                switch (e.button) {
                    case 0:
                        clickedMouseButton = false;
                        break;
                }
            }
        });
        this.#deltaMouse = { x: 0, y: 0 };
        canvasElement.addEventListener("touchmove", (e) => {
            e.preventDefault();

            const touches = e.changedTouches;
            if (clickedMouseButton === true) {
                this.#deltaMouse.x = (touches[0].pageX - this.#mouseDownX) * 0.1;
                this.#mouseDownX = touches[0].pageX;
                this.#deltaMouse.y = (mouseDownY - touches[0].pageY) * 0.1;
                this.#mouseDownY = touches[0].pageY;
            }
        });
        canvasElement.addEventListener("mousemove", (e)=>{
            if (clickedMouseButton === true) {
                this.#deltaMouse.x = (e.clientX - this.#mouseDownX) * 0.1;
                this.#mouseDownX = e.clientX;
                this.#deltaMouse.y = (this.#mouseDownY - e.clientY) * 0.1;
                this.#mouseDownY = e.clientY;
            }
        });
        this.#deltaPosition = { forward: 0, left: 0 };
        //this.#inputData = { deltaPosition: this.#deltaPosition, deltaMouse: this.#deltaMouse };
    
        this.#lastTime = 0;
        this.#delta = 0;
        this.#forwardDirection = glMatrix.vec3.fromValues(0.0,0.0,1.0);
        this.#position = glMatrix.vec3.create();
    }
    #deltaPosition;
    //#inputData;
    #lastTime;
    #delta;

    #forwardDirection;
    #position;
    get cameraMatrices()
    {
        if (this.#lastTime <= 0) {
            this.#lastTime = Date.now();
            this.#delta = 0;
        } else {
            this.#delta = Date.now() - this.#lastTime;
            this.#lastTime = Date.now();
        }
        const speedFactor = 0.008;
        if (this.#keyW === true) {
            this.#deltaPosition.forward = this.#delta * speedFactor;
        } else if (this.#keyS === true) {
            this.#deltaPosition.forward = -this.#delta * speedFactor;
        } else {
            this.#deltaPosition.forward = 0;
        }

        if (this.#keyD === true) {
            this.#deltaPosition.left =  this.#delta  * speedFactor;
        } else if (this.#keyA === true) {
            this.#deltaPosition.left = - this.#delta  * speedFactor;
        } else {
            this.#deltaPosition.left = 0;
        }

        let leftDirection = glMatrix.vec3.create();
        glMatrix.vec3.cross(leftDirection, [0, 1, 0], this.#forwardDirection);
        glMatrix.vec3.normalize(leftDirection, leftDirection);

        let upDirection = glMatrix.vec3.create();
        glMatrix.vec3.cross(upDirection, this.#forwardDirection, leftDirection);
        glMatrix.vec3.normalize(upDirection, upDirection);

        let forwardDisplacement = glMatrix.vec3.create();
        glMatrix.vec3.mul(forwardDisplacement, this.#forwardDirection, [
            this.#deltaPosition.forward,
            this.#deltaPosition.forward,
            this.#deltaPosition.forward,
        ]);
        glMatrix.vec3.add(this.#position, this.#position, forwardDisplacement);

        let leftDisplacement = glMatrix.vec3.create();
        glMatrix.vec3.mul(leftDisplacement, leftDirection, [
            this.#deltaPosition.left,
            this.#deltaPosition.left,
            this.#deltaPosition.left,
        ]);
        glMatrix.vec3.add(this.#position, this.#position, leftDisplacement);

        let horizontalRotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.rotate(
            horizontalRotationMatrix,
            horizontalRotationMatrix,
            this.#deltaMouse.x * 0.05,
            upDirection
        );

        let forwardDirectionVec4 = glMatrix.vec4.fromValues(
            this.#forwardDirection[0],
            this.#forwardDirection[1],
            this.#forwardDirection[2],
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
            this.#deltaMouse.y * 0.05,
            leftDirection
            );
            
            glMatrix.vec4.transformMat4(
                forwardDirectionVec4,
                forwardDirectionVec4,
                verticalRotationMatrix
                );
            this.#forwardDirection = glMatrix.vec3.fromValues(...forwardDirectionVec4); 

        this.forwardDirection = glMatrix.vec3.fromValues(
            forwardDirectionVec4[0],
            forwardDirectionVec4[1],
            forwardDirectionVec4[2]
        );

        this.#deltaMouse.x = 0;
        this.#deltaMouse.y = 0;

        let rotationMatrix = glMatrix.mat4.fromValues(//TODO use look at equivalent
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
            this.#position
        );

        var viewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(viewMatrix, rotationMatrix, translateMatrix);


        let projectionMatrix = glMatrix.mat4.create();
        let screenRatio =
            this.#canvasElement.offsetWidth / this.#canvasElement.offsetHeight;

        glMatrix.mat4.perspective(
            projectionMatrix,
            10 * (180 / Math.PI),
            screenRatio,
            0.1,
            10000
        );

        let vpMatrix = glMatrix.mat4.create();
        glMatrix.mat4.mul(vpMatrix, projectionMatrix, viewMatrix);

        if (this.#position[0] === NaN) {
            console.log(delta);
        }
        return {
            viewMatrix,
            vpMatrix,
            projectionMatrix,
            cameraPosition: this.#position,
        };
    };
    
};