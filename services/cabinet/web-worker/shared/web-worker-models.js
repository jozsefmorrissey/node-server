const { Vector } = require("../../../../public/js/utils/3d-modeling/csg");


const AssemblyTypes = Object.freeze({
    PANEL: 'PANEL',
    FRAME: 'FRAME'
});

class VectorDto {
    /**
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class VectorBasisDto {

    /**
     * @param {VectorDto} i 
     * @param {VectorDto} j 
     * @param {VectorDto} k 
     */
    constructor(i, j, k) {
        this.i = i;
        this.j = j;
        this.k = k;
    }

}

class AssemblyDto {
    /**
     * @param {keyof AssemblyTypes} assemblyType 
     * @param {VectorDto} center 
     * @param {VectorDto} extent 
     * @param {VectorBasisDto} normals 
     * @param {VectorDto} biPolyNorm
     */
    constructor(assemblyType, center, extent, normals, biPolyNorm) {
        this.type = assemblyType;
        this.center = center;
        this.extent = extent;
        this.normal = normals;
        this.biPolyNorm = biPolyNorm;
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

module.exports = { VectorDto, VectorBasisDto, AssemblyDto, AssemblyTypes, RenderingTask, RenderingResult }