const BiPolygon = require("../../app-src/three-d/objects/bi-polygon");
const Polygon3D = require("../../app-src/three-d/objects/polygon");
const Vector3D = require("../../app-src/three-d/objects/vector");
const Vertex3D = require("../../app-src/three-d/objects/vertex");

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
        this.normals = normals;
        this.biPolyNorm = biPolyNorm;
    }
}

class BiPolygonDto {
    /**
     * @param {PolygonDto} poly1 
     * @param {PolygonDto} poly2 
     */
    constructor(poly1, poly2) {
        this.poly1 = poly1;
        this.poly2 = poly2;
    }
}

class PolygonDto {
    /**
     * @param {VectorDto[]} poly2 
     */
    constructor(vertices) {
        this.vertices = vertices;
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


class DtoUtil {

    static toVectorDto(v) {
        return new VectorDto(v.x, v.y, v.z);
    }

    static toVectorBasisDto(normals) {
        return new VectorBasisDto(
            new VectorDto(normals.x.i(), normals.x.j(), normals.x.k()),
            new VectorDto(normals.y.i(), normals.y.j(), normals.y.k()),
            new VectorDto(normals.z.i(), normals.z.j(), normals.z.k())
        );
    }

    /**
     * @param {VectorDto} vectorDto 
     * @returns {Vector3D}
     */
    static toVector3d(vectorDto) {
        return new Vector3D(vectorDto.x, vectorDto.y, vectorDto.z);
    }

    /**
     * @param {VectorDto} vectorDto 
     * @returns {Vertex3D}
     */
    static toVertex3d(vectorDto) {
        return new Vertex3D(vectorDto.x, vectorDto.y, vectorDto.z);
    }

    /**
     * @param {BiPolygon} biPoly
     * @returns {BiPolygonDto}
     */
    static toBiPolygonDto(biPoly) {
        return new BiPolygonDto(
            DtoUtil.toPolygonDto(biPoly.front()), 
            DtoUtil.toPolygonDto(biPoly.back())
        );
    }

    /**
     * @param {Polygon3D} poly 
     * @returns {PolygonDto}
     */
    static toPolygonDto(poly) {
        const vertices = poly.vertices().map(DtoUtil.toVectorDto);
        return new PolygonDto(vertices);
    }

    /**
     * @param {BiPolygonDto} biPolyDto 
     * @returns {BiPolygon}
     */
    static toBiPolygon(biPolyDto) {

    }

    /**
     * @param {PolygonDto} polyDto
     * @returns {Polygon3D}
     */
    static toPolygon3d(polyDto) {

    }

}

module.exports = { DtoUtil, VectorDto, VectorBasisDto, AssemblyDto, AssemblyTypes, BiPolygonDto, PolygonDto, RenderingTask, RenderingResult }