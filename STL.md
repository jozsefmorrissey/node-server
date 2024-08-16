An STL_binary file consists of an 80 character header that can be used as a
comment; the number of triangles as a 32-bit little-endian integer; and 50 bytes
for each triangular facet. A facet is defined in twelve 32-bit floating-point
numbers (little-endian): three for the unit normal vector, and three for the
(X,Y,Z) coordinates of each vertex. For each triangle, these 48 bytes are
followed by a 2-byte unsigned integer, apparently described in the original
documentation as the attribute byte count. According to the Wikipedia entry
for the STL file format, the value for the attribute byte count "should be zero
because most software does not understand anything else." The syntax of the
binary variant is described in succinct tabular form at StL Binary Format at
fabbers.com; it also indicates that the attribute byte count should be zero.
Formal machine-readable specifications of the STL_binary syntax are available at
stl grammar, in an XML-based form compatible with Synalyze It! and .stl file
format, in the Kaitai Struct language.


[header 80x4=320]
[#ofTriangles 32/8=4]
[facet 50]
  [norm (xyz) 4+4+4=12]
  [v1   (xyz) 4+4+4=12]
  [v2   (xyz) 4+4+4=12]
  [v3   (xyz) 4+4+4=12]
  [null 2]
