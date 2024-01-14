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

// Lookup.id() format: '[constructorName]_[uniqueString]'
class LookupDto {
  constructor(lookup) {
    this.id = lookup.id();
  }
}

class AssemblyDto extends LookupDto {
    /**
     * @param {keyof AssemblyTypes} assemblyType
     * @param {VectorDto} center
     * @param {VectorDto} extent
     * @param {VectorBasisDto} normals
     * @param {VectorDto} biPolyNorm
     */
    constructor(assembly) {
        this.partCode = assembly.partCode();
        this.locationCode = assembly.locationCode();
        this.center = DtoUtil.toVectorDto(current.center);
        this.extent = DtoUtil.toVectorDto(current.demension);
        this.normals = DtoUtil.toVectorBasisDto(current.normals);
        this.biPolyNorm =   new VectorDto(current.biPolyNorm.i(), current.biPolyNorm.j(), current.biPolyNorm.k());
        this.part = assembly.part();
        this.includeJoints = assembly.includeJoints();
    }
}

class CutterDto extends AssemblyDto {constructor(...args){super(...args)}};


class PanelDto extends AssemblyDto {
  constructor(panel) {
    super(panel);
  }
}

class PanelVoidDto extends LookupDto {
  constructor(panelVoid) {
    this.index = panelVoid.index();
  }
}

class CabinetOpeningCorrdinatesDto {
  constructor(cabinetOpeningCorrdinates) {
    this.outerPoly = cabinetOpeningCorrdinates.outerPoly();
  }
}


class CutterReferenceDto extends LookupDto {
  constructor(cutterRef) {
    this.reference = cutterRef instanceof BiPolygon ? cutterRef : cutterRef.id();
    this.fromPoint = cutterRef.fromPoint;
    this.offset = cutterRef.offset;
    this.front = cutterRef.front;
  }
}

class CutterPolyDto extends LookupDto {
  constructor(cutterPoly) {
    this.poly = cutterPoly.poly();
  }
}

class CutterOpeningDto extends LookupDto {
  constructor(cutterOpening) {
    super(cutterOpening);
  }
}

class DividerDto extends LookupDto {
  constructor(divider) {
    this.maxWidth = divider.maxWidth();
    this.planeThickness = divider.planeThickness();
  }
}
class SectionPropertiesDto extends LookupDto {
  constructor(sectionProps) {
    this.top = sectionProps.top().id();
    this.bottom = sectionProps.bottom().id();
    this.left = sectionProps.left().id();
    this.right = sectionProps.right().id();
    this.rotation = sectionProps.rotation();
    this.coordinates = sectionProps.coordinates();
    this.divideRight = sectionProps.divideRight();
    this.pattern = sectionProps.pattern().str();
    this.verticalDivisions = sectionProps.verticalDivisions();
    this.dividerCount = sectionProps.dividerCount();
    this.sectionCount = sectionProps.sectionCount();
    this.dividerJoint = new JointDto(sectionProps.dividerJoint());

    //This will definatly need rewritten; Property object needs to change.
    const propConfig = sectionProps.propertyConfig();
    this.insetIs = propConfig('Inset').is.value();
    this.revealR = propConfig().reveal().r;
    this.overlayzzz = propConfig().overlay();
    this.isReveal = propConfig.isReveal(),
    this.isInset = propConfig.isInset(),

    //These are almost the same thing but im using both
    // need to test to eliminate 1
    this.vertical = sectionProps.value('vertical');
    this.isVertical = sectionProps.isVertical();

    this.pattern = sectionProps.pattern().toJson();

    this.divider = new DividerDto(sectionProps.divider());
    this.dividers = sectionProps.sections.map(s => new Divider(s.divider()));
  }
}

class GovernedSectionDto extends LookupDto {
  constructor(section) {
    super(section);
    this.governingSectionId = section.governingSection().id();
  }
}

class PanelSectionDto extends GovernedSectionDto {constructor(section) {super(section);}};
class DoorSectionDto extends GovernedSectionDto {constructor(section) {super(section);}};
class DrawerSectionDto extends GovernedSectionDto {constructor(section) {super(section);}};
class DuelDoorSectionDto extends GovernedSectionDto {
  constructor(section) {
    super(section);
    this.gap = section.gap();
  }
};

class DividerGovernedDto extends AssemblyDto {
  constructor(dividerGoverned) {
    super(dividerGoverned);
    this.maxWidth = dividerGoverned.maxWidth();
    this.type = dividerGoverned.type();
  }
}

class OpeningDto extends LookupDto {
  constructor(opening) {

  }
}

class OpeningToeKickDto extends LookupDto {
  constructor(openingToeKick) {
    this.leftCornerCutter = openingToeKick.leftCornerCutter().id();
    this.rightCornerCutter = openingToeKick.rightCornerCutter().id();
    this.toeKickPanel = openingToeKick.toeKickPanel().id();
    this.toeKickCutter = openingToeKick.toeKickCutter().id();
    this.opening = openingToeKick.opening().id();
    this.autoToeKick = openingToeKick.autoToeKick().id();
  }
}

class DrawerBoxOpeningDto extends GovernedSectionDto {constructor(drawerBox) {super(drawerBox)}};

class HandleGovernedDto extends GovernedSectionDto {
  constructor(handle) {
    super(handle);
    this.projection = handle.projection();
    this.centerToCenter = handle.centerToCenter();
    this.count = handle.count();
  }
}

class SimpleModelDto {
  constructor(obj3D) {
    this.height = obj3D.height();
    this.width = obj3D.width();
    this.thickness = obj3D.thickness();
    this.center = obj3D.center();
  }
}

class BiPolygonDto {
    /**
     * @param {PolygonDto} front
     * @param {PolygonDto} back
     */
    constructor(front, back) {
        this.front = front;
        this.back = back;
    }
}

class PolygonDto {
    /**
     * @param {VectorDto[]} vertices
     */
    constructor(vertices) {
        this.vertices = vertices;
    }
}

class JointDto {
  constructor(joint) {
    this.type = joint.constructor.name;
    this.maleJointSelector = joint.maleJointSelector();
    this.femaleJointSelector = joint.femaleJointSelector();
    this.maleOffset = joint.maleOffset();
    this.femaleOffset = joint.femaleOffset();
    this.demensionAxis = joint.demensionAxis();
    this.centerAxis = joint.centerAxis();
    this.fullLength = joint.fullLength();
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
        return new BiPolygon(
            this.toPolygon3d(biPolyDto.front),
            this.toPolygon3d(biPolyDto.back),
        );
    }

    /**
     * @param {PolygonDto} polyDto
     * @returns {Polygon3D}
     */
    static toPolygon3d(polyDto) {
        return new Polygon3D(polyDto.vertices);
    }

}

module.exports = { DtoUtil, VectorDto, VectorBasisDto, AssemblyDto, AssemblyTypes, BiPolygonDto, PolygonDto, RenderingTask, RenderingResult }
