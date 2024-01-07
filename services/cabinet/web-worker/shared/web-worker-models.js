const { Vector } = require("../../../../public/js/utils/3d-modeling/csg");


const AssemblyTypes = Object.freeze({
    PANEL: 'PANEL',
    FRAME: 'FRAME'
});

class AssemblyDto {
    /**
     * @param {string} assemblyType 
     * @param {Vector} center 
     * @param {Vector} normal 
     * @param {Vector} biPolyNormal
     * @param {Vector} extent 
     */
    constructor(assemblyType, center, normal, biPolyNormal, extent) {
        this.type = assemblyType;
        this.center = center;
        this.extent = extent;
        this.normal = normal;
        this.biPolyNormal = biPolyNormal;
    }
}

class RenderingTask {
    /**
     * @param {Number} taskId 
     * @param {AssemblyDto} assemblyDto 
     */
    constructor(taskId, assemblyDto) {
        this.taskId = taskId;
        this.assemblyDto = assemblyDto;
    }
}

class RenderingResult {
    constructor(taskId, result) {
        this.taskId = taskId;
        this.result = result;
    }
}

module.exports = { AssemblyDto, AssemblyTypes, RenderingTask, RenderingResult }