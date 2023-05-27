class GUI
{
    constructor()
    {
        this.shadowMapsGUI = {
            "position x": 0.0,
            "position y": 0.0,
            "position z": 0.0,
            "vertical angle": 73.46,
            "horizontal angle": 54.25,
            "scale": 25.0,
            "Animate light": false
        };
    
        const gui = new dat.GUI();
        gui.add(this.shadowMapsGUI, "vertical angle")
            .min(0.0)
            .max(180.0)
            .step(0.0001)
            .listen();
            gui.add(this.shadowMapsGUI, "horizontal angle").min(0.0).max(180.0).step(0.0001);
            gui.add(this.shadowMapsGUI, "Animate light");
            gui.add(this.shadowMapsGUI, "scale")
            .min(0.0)
            .max(500.0)
            .step(0.0001);

    }
    get shadowMapMatrix()
    {
        if (this.shadowMapsGUI["Animate light"])
        {
            this.shadowMapsGUI["vertical angle"] =
                Math.sin(Date.now() / 500.0) * 20.0 + 80.0;
        }
        return this.#getRotationMatrixFromPolarAngles(
            this.shadowMapsGUI["vertical angle"],
            this.shadowMapsGUI["horizontal angle"]);
    }
    #getRotationMatrixFromPolarAngles(verticalAngle, horizontalAngle) {
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
        
        const result = glMatrix.mat4.create();
        const scaleVec = glMatrix.vec3.fromValues(this.shadowMapsGUI.scale,this.shadowMapsGUI.scale,this.shadowMapsGUI.scale);//TODO plug gui to this
        glMatrix.mat4.scale(result,result,scaleVec);
        const rotationMatrix = glMatrix.mat4.fromValues(
            ...Xaxis,0.0,
            ...Yaxis,0.0,
            ...Zaxis,0.0,
            0.0,0.0,0.0,1.0);
        glMatrix.mat4.mul(result,rotationMatrix,result);    
        glMatrix.mat4.invert(result,result);
        return result;
    }
}