let index = function () {
const afterLoad = []
const APP_ID = 'cabinet-builder';


const PULL_TYPE = {
  DRAWER: 'Drawer',
  DOOR: 'Door'
};

const CoverStartPoints = {
  INSIDE_RAIL: 'InsideRail',
  OUTSIDE_RAIL: 'OutsideRail'
}



Request = {
    onStateChange: function (success, failure, id) {
      return function () {
        if (this.readyState == 4) {
          if (this.status == 200) {
            try {
              resp = JSON.parse(this.responseText);
            } catch (e){
              resp = this.responseText;
            }
            if (success) {
              success(resp, this);
            }
          } else if (failure) {
            const errorMsgMatch = this.responseText.match(Request.errorMsgReg);
            if (errorMsgMatch) {
              this.errorMsg = errorMsgMatch[1].trim();
            }
            const errorCodeMatch = this.responseText.match(Request.errorCodeReg);
            if (errorCodeMatch) {
              this.errorCode = errorCodeMatch[1];

            }
            failure(this);
          }
          var resp = this.responseText;
        }
      }
    },

    id: function (url, method) {
      return `request.${method}.${url.replace(/\./g, ',')}`;
    },

    get: function (url, success, failure) {
      const xhr = new Request.xmlhr();
      xhr.open("GET", url, true);
      const id = Request.id(url, 'GET');
      xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
      if ((typeof User) !== 'undefined')
        xhr.setRequestHeader('Authorization', User.credential());
      xhr.send();
      return xhr;
    },

    hasBody: function (method) {
      return function (url, body, success, failure) {
        const xhr = new Request.xmlhr();
        xhr.open(method, url, true);
        const id = Request.id(url, method);
        xhr.onreadystatechange =  Request.onStateChange(success, failure, id);
        xhr.setRequestHeader('Content-Type', 'application/json');
        if ((typeof User) !== 'undefined')
          xhr.setRequestHeader('Authorization', User.credential());
        xhr.send(JSON.stringify(body));
        return xhr;
      }
    },

    post: function () {Request.hasBody('POST')(...arguments)},
    delete: function () {Request.hasBody('DELETE')(...arguments)},
    options: function () {Request.hasBody('OPTIONS')(...arguments)},
    head: function () {Request.hasBody('HEAD')(...arguments)},
    put: function () {Request.hasBody('PUT')(...arguments)},
    connect: function () {Request.hasBody('CONNECT')(...arguments)},
}

Request.errorCodeReg = /Error Code:([a-zA-Z0-9]*)/;
Request.errorMsgReg = /[a-zA-Z0-9]*?:([a-zA-Z0-9 ]*)/;


try {
  Request.xmlhr = XMLHttpRequest;
} catch (e) {
  Request.xmlhr = require('xmlhttprequest').XMLHttpRequest;
  exports.Request = Request;
}


/*
 * lightgl.js
 * http://github.com/evanw/lightgl.js/
 *
 * Copyright 2011 Evan Wallace
 * Released under the MIT license
 */
var GL=function(){function F(b){return{8:"BACKSPACE",9:"TAB",13:"ENTER",16:"SHIFT",27:"ESCAPE",32:"SPACE",37:"LEFT",38:"UP",39:"RIGHT",40:"DOWN"}[b]||(65<=b&&90>=b?String.fromCharCode(b):null)}function k(){var b=Array.prototype.concat.apply([],arguments);b.length||(b=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);this.m=G?new Float32Array(b):b}function t(){this.unique=[];this.indices=[];this.map={}}function v(b,c){this.buffer=null;this.target=b;this.type=c;this.data=[]}function o(b){b=b||{};this.vertexBuffers=
{};this.indexBuffers={};this.addVertexBuffer("vertices","gl_Vertex");b.coords&&this.addVertexBuffer("coords","gl_TexCoord");b.normals&&this.addVertexBuffer("normals","gl_Normal");b.colors&&this.addVertexBuffer("colors","gl_Color");(!("triangles"in b)||b.triangles)&&this.addIndexBuffer("triangles");b.lines&&this.addIndexBuffer("lines")}function H(b){return new j(2*(b&1)-1,(b&2)-1,(b&4)/2-1)}function u(b,c,a){this.t=arguments.length?b:Number.MAX_VALUE;this.hit=c;this.normal=a}function r(){var b=d.getParameter(d.VIEWPORT),
c=d.modelviewMatrix.m,a=new j(c[0],c[4],c[8]),e=new j(c[1],c[5],c[9]),f=new j(c[2],c[6],c[10]),c=new j(c[3],c[7],c[11]);this.eye=new j(-c.dot(a),-c.dot(e),-c.dot(f));a=b[0];e=a+b[2];f=b[1];c=f+b[3];this.ray00=d.unProject(a,f,1).subtract(this.eye);this.ray10=d.unProject(e,f,1).subtract(this.eye);this.ray01=d.unProject(a,c,1).subtract(this.eye);this.ray11=d.unProject(e,c,1).subtract(this.eye);this.viewport=b}function w(b,c,a){for(;null!=(result=b.exec(c));)a(result)}function E(b,c){function a(a){var b=
document.getElementById(a);return b?b.text:a}function e(a,b){var c={},d=/^((\s*\/\/.*\n|\s*#extension.*\n)+)[^]*$/.exec(b),b=d?d[1]+a+b.substr(d[1].length):a+b;w(/\bgl_\w+\b/g,a,function(a){a in c||(b=b.replace(RegExp("\\b"+a+"\\b","g"),"_"+a),c[a]=!0)});return b}function f(a,b){var c=d.createShader(a);d.shaderSource(c,b);d.compileShader(c);if(!d.getShaderParameter(c,d.COMPILE_STATUS))throw"compile error: "+d.getShaderInfoLog(c);return c}var b=a(b),c=a(c),i=b+c,h={};w(/\b(gl_[^;]*)\b;/g,"uniform mat3 gl_NormalMatrix;uniform mat4 gl_ModelViewMatrix;uniform mat4 gl_ProjectionMatrix;uniform mat4 gl_ModelViewProjectionMatrix;uniform mat4 gl_ModelViewMatrixInverse;uniform mat4 gl_ProjectionMatrixInverse;uniform mat4 gl_ModelViewProjectionMatrixInverse;",
function(a){a=a[1];if(-1!=i.indexOf(a)){var b=a.replace(/[a-z_]/g,"");h[b]="_"+a}});-1!=i.indexOf("ftransform")&&(h.MVPM="_gl_ModelViewProjectionMatrix");this.usedMatrices=h;b=e("uniform mat3 gl_NormalMatrix;uniform mat4 gl_ModelViewMatrix;uniform mat4 gl_ProjectionMatrix;uniform mat4 gl_ModelViewProjectionMatrix;uniform mat4 gl_ModelViewMatrixInverse;uniform mat4 gl_ProjectionMatrixInverse;uniform mat4 gl_ModelViewProjectionMatrixInverse;attribute vec4 gl_Vertex;attribute vec4 gl_TexCoord;attribute vec3 gl_Normal;attribute vec4 gl_Color;vec4 ftransform(){return gl_ModelViewProjectionMatrix*gl_Vertex;}",
b);c=e("precision highp float;uniform mat3 gl_NormalMatrix;uniform mat4 gl_ModelViewMatrix;uniform mat4 gl_ProjectionMatrix;uniform mat4 gl_ModelViewProjectionMatrix;uniform mat4 gl_ModelViewMatrixInverse;uniform mat4 gl_ProjectionMatrixInverse;uniform mat4 gl_ModelViewProjectionMatrixInverse;",c);this.program=d.createProgram();d.attachShader(this.program,f(d.VERTEX_SHADER,b));d.attachShader(this.program,f(d.FRAGMENT_SHADER,c));d.linkProgram(this.program);if(!d.getProgramParameter(this.program,
d.LINK_STATUS))throw"link error: "+d.getProgramInfoLog(this.program);this.attributes={};this.uniformLocations={};var g={};w(/uniform\s+sampler(1D|2D|3D|Cube)\s+(\w+)\s*;/g,b+c,function(a){g[a[2]]=1});this.isSampler=g}function q(b,c,a){a=a||{};this.id=d.createTexture();this.width=b;this.height=c;this.format=a.format||d.RGBA;this.type=a.type||d.UNSIGNED_BYTE;d.bindTexture(d.TEXTURE_2D,this.id);d.pixelStorei(d.UNPACK_FLIP_Y_WEBGL,1);d.texParameteri(d.TEXTURE_2D,d.TEXTURE_MAG_FILTER,a.filter||a.magFilter||
d.LINEAR);d.texParameteri(d.TEXTURE_2D,d.TEXTURE_MIN_FILTER,a.filter||a.minFilter||d.LINEAR);d.texParameteri(d.TEXTURE_2D,d.TEXTURE_WRAP_S,a.wrap||a.wrapS||d.CLAMP_TO_EDGE);d.texParameteri(d.TEXTURE_2D,d.TEXTURE_WRAP_T,a.wrap||a.wrapT||d.CLAMP_TO_EDGE);d.texImage2D(d.TEXTURE_2D,0,this.format,b,c,0,this.format,this.type,null)}function j(b,c,a){this.x=b||0;this.y=c||0;this.z=a||0}var d,s={create:function(b){var b=b||{},c=document.createElement("canvas");c.width=800;c.height=600;"alpha"in b||(b.alpha=
!1);try{d=c.getContext("webgl",b)}catch(a){}try{d=d||c.getContext("experimental-webgl",b)}catch(e){}if(!d)throw"WebGL not supported";d.MODELVIEW=I|1;d.PROJECTION=I|2;var f=new k,i=new k;d.modelviewMatrix=new k;d.projectionMatrix=new k;var h=[],g=[],n,m;d.matrixMode=function(a){switch(a){case d.MODELVIEW:n="modelviewMatrix";m=h;break;case d.PROJECTION:n="projectionMatrix";m=g;break;default:throw"invalid matrix mode "+a;}};d.loadIdentity=function(){k.identity(d[n])};d.loadMatrix=function(a){for(var a=
a.m,b=d[n].m,c=0;c<16;c++)b[c]=a[c]};d.multMatrix=function(a){d.loadMatrix(k.multiply(d[n],a,i))};d.perspective=function(a,b,c,e){d.multMatrix(k.perspective(a,b,c,e,f))};d.frustum=function(a,b,c,e,g,i){d.multMatrix(k.frustum(a,b,c,e,g,i,f))};d.ortho=function(a,b,c,e,g,i){d.multMatrix(k.ortho(a,b,c,e,g,i,f))};d.scale=function(a,b,c){d.multMatrix(k.scale(a,b,c,f))};d.translate=function(a,b,c){d.multMatrix(k.translate(a,b,c,f))};d.rotate=function(a,b,c,e){d.multMatrix(k.rotate(a,b,c,e,f))};d.lookAt=
function(a,b,c,e,g,i,h,j,l){d.multMatrix(k.lookAt(a,b,c,e,g,i,h,j,l,f))};d.pushMatrix=function(){m.push(Array.prototype.slice.call(d[n].m))};d.popMatrix=function(){var a=m.pop();d[n].m=G?new Float32Array(a):a};d.project=function(a,b,c,e,f,g){e=e||d.modelviewMatrix;f=f||d.projectionMatrix;g=g||d.getParameter(d.VIEWPORT);a=f.transformPoint(e.transformPoint(new j(a,b,c)));return new j(g[0]+g[2]*(a.x*0.5+0.5),g[1]+g[3]*(a.y*0.5+0.5),a.z*0.5+0.5)};d.unProject=function(a,b,c,e,g,h){e=e||d.modelviewMatrix;
g=g||d.projectionMatrix;h=h||d.getParameter(d.VIEWPORT);a=new j((a-h[0])/h[2]*2-1,(b-h[1])/h[3]*2-1,c*2-1);return k.inverse(k.multiply(g,e,f),i).transformPoint(a)};d.matrixMode(d.MODELVIEW);var l=new o({coords:!0,colors:!0,triangles:!1}),y=-1,p=[0,0,0,0],q=[1,1,1,1],u=new E("uniform float pointSize;varying vec4 color;varying vec4 coord;void main(){color=gl_Color;coord=gl_TexCoord;gl_Position=gl_ModelViewProjectionMatrix*gl_Vertex;gl_PointSize=pointSize;}",
"uniform sampler2D texture;uniform float pointSize;uniform bool useTexture;varying vec4 color;varying vec4 coord;void main(){gl_FragColor=color;if(useTexture)gl_FragColor*=texture2D(texture,coord.xy);}");d.pointSize=function(a){u.uniforms({pointSize:a})};d.begin=function(a){if(y!=-1)throw"mismatched gl.begin() and gl.end() calls";y=a;l.colors=[];l.coords=[];l.vertices=[]};d.color=function(a,b,c,e){q=arguments.length==1?a.toArray().concat(1):
[a,b,c,e||1]};d.texCoord=function(a,b){p=arguments.length==1?a.toArray(2):[a,b]};d.vertex=function(a,b,c){l.colors.push(q);l.coords.push(p);l.vertices.push(arguments.length==1?a.toArray():[a,b,c])};d.end=function(){if(y==-1)throw"mismatched gl.begin() and gl.end() calls";l.compile();u.uniforms({useTexture:!!d.getParameter(d.TEXTURE_BINDING_2D)}).draw(l,y);y=-1};var r=function(){for(var a in x)if(B.call(x,a)&&x[a])return true;return false},s=function(a){var b={},c;for(c in a)b[c]=typeof a[c]=="function"?
function(b){return function(){b.apply(a,arguments)}}(a[c]):a[c];b.original=a;b.x=b.pageX;b.y=b.pageY;for(c=d.canvas;c;c=c.offsetParent){b.x=b.x-c.offsetLeft;b.y=b.y-c.offsetTop}if(D){b.deltaX=b.x-v;b.deltaY=b.y-w}else{b.deltaX=0;b.deltaY=0;D=true}v=b.x;w=b.y;b.dragging=r();b.preventDefault=function(){b.original.preventDefault()};b.stopPropagation=function(){b.original.stopPropagation()};return b},z=function(a){d=t;a=s(a);if(d.onmousemove)d.onmousemove(a);a.preventDefault()},A=function(a){d=t;x[a.which]=
false;if(!r()){document.removeEventListener("mousemove",z);document.removeEventListener("mouseup",A);d.canvas.addEventListener("mousemove",z);d.canvas.addEventListener("mouseup",A)}a=s(a);if(d.onmouseup)d.onmouseup(a);a.preventDefault()},b=function(){D=false},t=d,v=0,w=0,x={},D=!1,B=Object.prototype.hasOwnProperty;d.canvas.addEventListener("mousedown",function(a){d=t;if(!r()){document.addEventListener("mousemove",z);document.addEventListener("mouseup",A);d.canvas.removeEventListener("mousemove",z);
d.canvas.removeEventListener("mouseup",A)}x[a.which]=true;a=s(a);if(d.onmousedown)d.onmousedown(a);a.preventDefault()});d.canvas.addEventListener("mousemove",z);d.canvas.addEventListener("mouseup",A);d.canvas.addEventListener("mouseover",b);d.canvas.addEventListener("mouseout",b);document.addEventListener("contextmenu",function(){x={};D=false});var C=d;d.makeCurrent=function(){d=C};d.animate=function(){function a(){d=e;var f=(new Date).getTime();if(d.onupdate)d.onupdate((f-c)/1E3);if(d.ondraw)d.ondraw();
b(a);c=f}var b=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||function(a){setTimeout(a,1E3/60)},c=(new Date).getTime(),e=d;a()};d.fullscreen=function(a){function b(){d.canvas.width=window.innerWidth-e-f;d.canvas.height=window.innerHeight-c-g;d.viewport(0,0,d.canvas.width,d.canvas.height);if(a.camera||!("camera"in a)){d.matrixMode(d.PROJECTION);d.loadIdentity();d.perspective(a.fov||45,d.canvas.width/d.canvas.height,a.near||0.1,a.far||1E3);d.matrixMode(d.MODELVIEW)}if(d.ondraw)d.ondraw()}
var a=a||{},c=a.paddingTop||0,e=a.paddingLeft||0,f=a.paddingRight||0,g=a.paddingBottom||0;if(!document.body)throw"document.body doesn't exist yet (call gl.fullscreen() from window.onload() or from inside the <body> tag)";document.body.appendChild(d.canvas);document.body.style.overflow="hidden";d.canvas.style.position="absolute";d.canvas.style.left=e+"px";d.canvas.style.top=c+"px";window.addEventListener("resize",b);b()};return d},keys:{},Matrix:k,Indexer:t,Buffer:v,Mesh:o,HitTest:u,Raytracer:r,Shader:E,
Texture:q,Vector:j};document.addEventListener("keydown",function(b){if(!b.altKey&&!b.ctrlKey&&!b.metaKey){var c=F(b.keyCode);c&&(s.keys[c]=!0);s.keys[b.keyCode]=!0}});document.addEventListener("keyup",function(b){if(!b.altKey&&!b.ctrlKey&&!b.metaKey){var c=F(b.keyCode);c&&(s.keys[c]=!1);s.keys[b.keyCode]=!1}});var I=305397760,G="undefined"!=typeof Float32Array;k.prototype={inverse:function(){return k.inverse(this,new k)},transpose:function(){return k.transpose(this,new k)},multiply:function(b){return k.multiply(this,
b,new k)},transformPoint:function(b){var c=this.m;return(new j(c[0]*b.x+c[1]*b.y+c[2]*b.z+c[3],c[4]*b.x+c[5]*b.y+c[6]*b.z+c[7],c[8]*b.x+c[9]*b.y+c[10]*b.z+c[11])).divide(c[12]*b.x+c[13]*b.y+c[14]*b.z+c[15])},transformVector:function(b){var c=this.m;return new j(c[0]*b.x+c[1]*b.y+c[2]*b.z,c[4]*b.x+c[5]*b.y+c[6]*b.z,c[8]*b.x+c[9]*b.y+c[10]*b.z)}};k.inverse=function(b,c){var c=c||new k,a=b.m,e=c.m;e[0]=a[5]*a[10]*a[15]-a[5]*a[14]*a[11]-a[6]*a[9]*a[15]+a[6]*a[13]*a[11]+a[7]*a[9]*a[14]-a[7]*a[13]*a[10];
e[1]=-a[1]*a[10]*a[15]+a[1]*a[14]*a[11]+a[2]*a[9]*a[15]-a[2]*a[13]*a[11]-a[3]*a[9]*a[14]+a[3]*a[13]*a[10];e[2]=a[1]*a[6]*a[15]-a[1]*a[14]*a[7]-a[2]*a[5]*a[15]+a[2]*a[13]*a[7]+a[3]*a[5]*a[14]-a[3]*a[13]*a[6];e[3]=-a[1]*a[6]*a[11]+a[1]*a[10]*a[7]+a[2]*a[5]*a[11]-a[2]*a[9]*a[7]-a[3]*a[5]*a[10]+a[3]*a[9]*a[6];e[4]=-a[4]*a[10]*a[15]+a[4]*a[14]*a[11]+a[6]*a[8]*a[15]-a[6]*a[12]*a[11]-a[7]*a[8]*a[14]+a[7]*a[12]*a[10];e[5]=a[0]*a[10]*a[15]-a[0]*a[14]*a[11]-a[2]*a[8]*a[15]+a[2]*a[12]*a[11]+a[3]*a[8]*a[14]-
a[3]*a[12]*a[10];e[6]=-a[0]*a[6]*a[15]+a[0]*a[14]*a[7]+a[2]*a[4]*a[15]-a[2]*a[12]*a[7]-a[3]*a[4]*a[14]+a[3]*a[12]*a[6];e[7]=a[0]*a[6]*a[11]-a[0]*a[10]*a[7]-a[2]*a[4]*a[11]+a[2]*a[8]*a[7]+a[3]*a[4]*a[10]-a[3]*a[8]*a[6];e[8]=a[4]*a[9]*a[15]-a[4]*a[13]*a[11]-a[5]*a[8]*a[15]+a[5]*a[12]*a[11]+a[7]*a[8]*a[13]-a[7]*a[12]*a[9];e[9]=-a[0]*a[9]*a[15]+a[0]*a[13]*a[11]+a[1]*a[8]*a[15]-a[1]*a[12]*a[11]-a[3]*a[8]*a[13]+a[3]*a[12]*a[9];e[10]=a[0]*a[5]*a[15]-a[0]*a[13]*a[7]-a[1]*a[4]*a[15]+a[1]*a[12]*a[7]+a[3]*a[4]*
a[13]-a[3]*a[12]*a[5];e[11]=-a[0]*a[5]*a[11]+a[0]*a[9]*a[7]+a[1]*a[4]*a[11]-a[1]*a[8]*a[7]-a[3]*a[4]*a[9]+a[3]*a[8]*a[5];e[12]=-a[4]*a[9]*a[14]+a[4]*a[13]*a[10]+a[5]*a[8]*a[14]-a[5]*a[12]*a[10]-a[6]*a[8]*a[13]+a[6]*a[12]*a[9];e[13]=a[0]*a[9]*a[14]-a[0]*a[13]*a[10]-a[1]*a[8]*a[14]+a[1]*a[12]*a[10]+a[2]*a[8]*a[13]-a[2]*a[12]*a[9];e[14]=-a[0]*a[5]*a[14]+a[0]*a[13]*a[6]+a[1]*a[4]*a[14]-a[1]*a[12]*a[6]-a[2]*a[4]*a[13]+a[2]*a[12]*a[5];e[15]=a[0]*a[5]*a[10]-a[0]*a[9]*a[6]-a[1]*a[4]*a[10]+a[1]*a[8]*a[6]+
a[2]*a[4]*a[9]-a[2]*a[8]*a[5];for(var a=a[0]*e[0]+a[1]*e[4]+a[2]*e[8]+a[3]*e[12],d=0;16>d;d++)e[d]/=a;return c};k.transpose=function(b,c){var c=c||new k,a=b.m,e=c.m;e[0]=a[0];e[1]=a[4];e[2]=a[8];e[3]=a[12];e[4]=a[1];e[5]=a[5];e[6]=a[9];e[7]=a[13];e[8]=a[2];e[9]=a[6];e[10]=a[10];e[11]=a[14];e[12]=a[3];e[13]=a[7];e[14]=a[11];e[15]=a[15];return c};k.multiply=function(b,c,a){var a=a||new k,b=b.m,c=c.m,e=a.m;e[0]=b[0]*c[0]+b[1]*c[4]+b[2]*c[8]+b[3]*c[12];e[1]=b[0]*c[1]+b[1]*c[5]+b[2]*c[9]+b[3]*c[13];e[2]=
b[0]*c[2]+b[1]*c[6]+b[2]*c[10]+b[3]*c[14];e[3]=b[0]*c[3]+b[1]*c[7]+b[2]*c[11]+b[3]*c[15];e[4]=b[4]*c[0]+b[5]*c[4]+b[6]*c[8]+b[7]*c[12];e[5]=b[4]*c[1]+b[5]*c[5]+b[6]*c[9]+b[7]*c[13];e[6]=b[4]*c[2]+b[5]*c[6]+b[6]*c[10]+b[7]*c[14];e[7]=b[4]*c[3]+b[5]*c[7]+b[6]*c[11]+b[7]*c[15];e[8]=b[8]*c[0]+b[9]*c[4]+b[10]*c[8]+b[11]*c[12];e[9]=b[8]*c[1]+b[9]*c[5]+b[10]*c[9]+b[11]*c[13];e[10]=b[8]*c[2]+b[9]*c[6]+b[10]*c[10]+b[11]*c[14];e[11]=b[8]*c[3]+b[9]*c[7]+b[10]*c[11]+b[11]*c[15];e[12]=b[12]*c[0]+b[13]*c[4]+b[14]*
c[8]+b[15]*c[12];e[13]=b[12]*c[1]+b[13]*c[5]+b[14]*c[9]+b[15]*c[13];e[14]=b[12]*c[2]+b[13]*c[6]+b[14]*c[10]+b[15]*c[14];e[15]=b[12]*c[3]+b[13]*c[7]+b[14]*c[11]+b[15]*c[15];return a};k.identity=function(b){var b=b||new k,c=b.m;c[0]=c[5]=c[10]=c[15]=1;c[1]=c[2]=c[3]=c[4]=c[6]=c[7]=c[8]=c[9]=c[11]=c[12]=c[13]=c[14]=0;return b};k.perspective=function(b,c,a,e,d){b=Math.tan(b*Math.PI/360)*a;c*=b;return k.frustum(-c,c,-b,b,a,e,d)};k.frustum=function(b,c,a,e,d,i,h){var h=h||new k,g=h.m;g[0]=2*d/(c-b);g[1]=
0;g[2]=(c+b)/(c-b);g[3]=0;g[4]=0;g[5]=2*d/(e-a);g[6]=(e+a)/(e-a);g[7]=0;g[8]=0;g[9]=0;g[10]=-(i+d)/(i-d);g[11]=-2*i*d/(i-d);g[12]=0;g[13]=0;g[14]=-1;g[15]=0;return h};k.ortho=function(b,c,a,e,d,i,h){var h=h||new k,g=h.m;g[0]=2/(c-b);g[1]=0;g[2]=0;g[3]=-(c+b)/(c-b);g[4]=0;g[5]=2/(e-a);g[6]=0;g[7]=-(e+a)/(e-a);g[8]=0;g[9]=0;g[10]=-2/(i-d);g[11]=-(i+d)/(i-d);g[12]=0;g[13]=0;g[14]=0;g[15]=1;return h};k.scale=function(b,c,a,d){var d=d||new k,f=d.m;f[0]=b;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=c;f[6]=0;f[7]=
0;f[8]=0;f[9]=0;f[10]=a;f[11]=0;f[12]=0;f[13]=0;f[14]=0;f[15]=1;return d};k.translate=function(b,c,a,d){var d=d||new k,f=d.m;f[0]=1;f[1]=0;f[2]=0;f[3]=b;f[4]=0;f[5]=1;f[6]=0;f[7]=c;f[8]=0;f[9]=0;f[10]=1;f[11]=a;f[12]=0;f[13]=0;f[14]=0;f[15]=1;return d};k.rotate=function(b,c,a,d,f){if(!b||!c&&!a&&!d)return k.identity(f);var f=f||new k,i=f.m,h=Math.sqrt(c*c+a*a+d*d),b=b*(Math.PI/180),c=c/h,a=a/h,d=d/h,h=Math.cos(b),b=Math.sin(b),g=1-h;i[0]=c*c*g+h;i[1]=c*a*g-d*b;i[2]=c*d*g+a*b;i[3]=0;i[4]=a*c*g+d*b;
i[5]=a*a*g+h;i[6]=a*d*g-c*b;i[7]=0;i[8]=d*c*g-a*b;i[9]=d*a*g+c*b;i[10]=d*d*g+h;i[11]=0;i[12]=0;i[13]=0;i[14]=0;i[15]=1;return f};k.lookAt=function(b,c,a,d,f,i,h,g,n,m){var m=m||new k,l=m.m,b=new j(b,c,a),d=new j(d,f,i),g=new j(h,g,n),h=b.subtract(d).unit(),g=g.cross(h).unit(),n=h.cross(g).unit();l[0]=g.x;l[1]=g.y;l[2]=g.z;l[3]=-g.dot(b);l[4]=n.x;l[5]=n.y;l[6]=n.z;l[7]=-n.dot(b);l[8]=h.x;l[9]=h.y;l[10]=h.z;l[11]=-h.dot(b);l[12]=0;l[13]=0;l[14]=0;l[15]=1;return m};t.prototype={add:function(b){var c=
JSON.stringify(b);c in this.map||(this.map[c]=this.unique.length,this.unique.push(b));return this.map[c]}};v.prototype={compile:function(b){for(var c=[],a=0;a<this.data.length;a+=1E4)c=Array.prototype.concat.apply(c,this.data.slice(a,a+1E4));a=this.data.length?c.length/this.data.length:0;if(a!=Math.round(a))throw"buffer elements not of consistent size, average size is "+a;this.buffer=this.buffer||d.createBuffer();this.buffer.length=c.length;this.buffer.spacing=a;d.bindBuffer(this.target,this.buffer);
d.bufferData(this.target,new this.type(c),b||d.STATIC_DRAW)}};o.prototype={addVertexBuffer:function(b,c){(this.vertexBuffers[c]=new v(d.ARRAY_BUFFER,Float32Array)).name=b;this[b]=[]},addIndexBuffer:function(b){this.indexBuffers[b]=new v(d.ELEMENT_ARRAY_BUFFER,Uint16Array);this[b]=[]},compile:function(){for(var b in this.vertexBuffers){var c=this.vertexBuffers[b];c.data=this[c.name];c.compile()}for(var a in this.indexBuffers)c=this.indexBuffers[a],c.data=this[a],c.compile()},transform:function(b){this.vertices=
this.vertices.map(function(a){return b.transformPoint(j.fromArray(a)).toArray()});if(this.normals){var c=b.inverse().transpose();this.normals=this.normals.map(function(a){return c.transformVector(j.fromArray(a)).unit().toArray()})}this.compile();return this},computeNormals:function(){this.normals||this.addVertexBuffer("normals","gl_Normal");for(var b=0;b<this.vertices.length;b++)this.normals[b]=new j;for(b=0;b<this.triangles.length;b++){var c=this.triangles[b],a=j.fromArray(this.vertices[c[0]]),d=
j.fromArray(this.vertices[c[1]]),f=j.fromArray(this.vertices[c[2]]),a=d.subtract(a).cross(f.subtract(a)).unit();this.normals[c[0]]=this.normals[c[0]].add(a);this.normals[c[1]]=this.normals[c[1]].add(a);this.normals[c[2]]=this.normals[c[2]].add(a)}for(b=0;b<this.vertices.length;b++)this.normals[b]=this.normals[b].unit().toArray();this.compile();return this},computeWireframe:function(){for(var b=new t,c=0;c<this.triangles.length;c++)for(var a=this.triangles[c],d=0;d<a.length;d++){var f=a[d],i=a[(d+
1)%a.length];b.add([Math.min(f,i),Math.max(f,i)])}this.lines||this.addIndexBuffer("lines");this.lines=b.unique;this.compile();return this},getAABB:function(){var b={min:new j(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE)};b.max=b.min.negative();for(var c=0;c<this.vertices.length;c++){var a=j.fromArray(this.vertices[c]);b.min=j.min(b.min,a);b.max=j.max(b.max,a)}return b},getBoundingSphere:function(){for(var b=this.getAABB(),b={center:b.min.add(b.max).divide(2),radius:0},c=0;c<this.vertices.length;c++)b.radius=
Math.max(b.radius,j.fromArray(this.vertices[c]).subtract(b.center).length());return b}};o.plane=function(b){var b=b||{},c=new o(b);detailX=b.detailX||b.detail||1;detailY=b.detailY||b.detail||1;for(b=0;b<=detailY;b++)for(var a=b/detailY,d=0;d<=detailX;d++){var f=d/detailX;c.vertices.push([2*f-1,2*a-1,0]);c.coords&&c.coords.push([f,a]);c.normals&&c.normals.push([0,0,1]);d<detailX&&b<detailY&&(f=d+b*(detailX+1),c.triangles.push([f,f+1,f+detailX+1]),c.triangles.push([f+detailX+1,f+1,f+detailX+2]))}c.compile();
return c};var J=[[0,4,2,6,-1,0,0],[1,3,5,7,1,0,0],[0,1,4,5,0,-1,0],[2,6,3,7,0,1,0],[0,2,1,3,0,0,-1],[4,5,6,7,0,0,1]];o.cube=function(b){for(var b=new o(b),c=0;c<J.length;c++){for(var a=J[c],d=4*c,f=0;4>f;f++)b.vertices.push(H(a[f]).toArray()),b.coords&&b.coords.push([f&1,(f&2)/2]),b.normals&&b.normals.push(a.slice(4,7));b.triangles.push([d,d+1,d+2]);b.triangles.push([d+2,d+1,d+3])}b.compile();return b};o.sphere=function(b){var b=b||{},c=new o(b),a=new t;detail=b.detail||6;for(b=0;8>b;b++)for(var d=
H(b),f=0<d.x*d.y*d.z,i=[],h=0;h<=detail;h++){for(var g=0;h+g<=detail;g++){var k=h/detail,m=g/detail,l=(detail-h-g)/detail,m={vertex:(new j(k+(k-k*k)/2,m+(m-m*m)/2,l+(l-l*l)/2)).unit().multiply(d).toArray()};c.coords&&(m.coord=0<d.y?[1-k,l]:[l,1-k]);i.push(a.add(m))}if(0<h)for(g=0;h+g<=detail;g++)k=(h-1)*(detail+1)+(h-1-(h-1)*(h-1))/2+g,m=h*(detail+1)+(h-h*h)/2+g,c.triangles.push(f?[i[k],i[m],i[k+1]]:[i[k],i[k+1],i[m]]),h+g<detail&&c.triangles.push(f?[i[m],i[m+1],i[k+1]]:[i[m],i[k+1],i[m+1]])}c.vertices=
a.unique.map(function(a){return a.vertex});c.coords&&(c.coords=a.unique.map(function(a){return a.coord}));c.normals&&(c.normals=c.vertices);c.compile();return c};o.load=function(b,c){c=c||{};"coords"in c||(c.coords=!!b.coords);"normals"in c||(c.normals=!!b.normals);"colors"in c||(c.colors=!!b.colors);"triangles"in c||(c.triangles=!!b.triangles);"lines"in c||(c.lines=!!b.lines);var a=new o(c);a.vertices=b.vertices;a.coords&&(a.coords=b.coords);a.normals&&(a.normals=b.normals);a.colors&&(a.colors=b.colors);
a.triangles&&(a.triangles=b.triangles);a.lines&&(a.lines=b.lines);a.compile();return a};u.prototype={mergeWith:function(b){0<b.t&&b.t<this.t&&(this.t=b.t,this.hit=b.hit,this.normal=b.normal)}};r.prototype={getRayForPixel:function(b,c){var b=(b-this.viewport[0])/this.viewport[2],c=1-(c-this.viewport[1])/this.viewport[3],a=j.lerp(this.ray00,this.ray10,b),d=j.lerp(this.ray01,this.ray11,b);return j.lerp(a,d,c).unit()}};r.hitTestBox=function(b,c,a,d){var f=a.subtract(b).divide(c),i=d.subtract(b).divide(c),
h=j.min(f,i),f=j.max(f,i),h=h.max(),f=f.min();return 0<h&&h<f?(b=b.add(c.multiply(h)),a=a.add(1E-6),d=d.subtract(1E-6),new u(h,b,new j((b.x>d.x)-(b.x<a.x),(b.y>d.y)-(b.y<a.y),(b.z>d.z)-(b.z<a.z)))):null};r.hitTestSphere=function(b,c,a,d){var f=b.subtract(a),i=c.dot(c),h=2*c.dot(f),f=f.dot(f)-d*d,f=h*h-4*i*f;return 0<f?(i=(-h-Math.sqrt(f))/(2*i),b=b.add(c.multiply(i)),new u(i,b,b.subtract(a).divide(d))):null};r.hitTestTriangle=function(b,c,a,d,f){var i=d.subtract(a),h=f.subtract(a),f=i.cross(h).unit(),
d=f.dot(a.subtract(b))/f.dot(c);if(0<d){var b=b.add(c.multiply(d)),g=b.subtract(a),a=h.dot(h),c=h.dot(i),h=h.dot(g),j=i.dot(i),i=i.dot(g),g=a*j-c*c,j=(j*h-c*i)/g,i=(a*i-c*h)/g;if(0<=j&&0<=i&&1>=j+i)return new u(d,b,f)}return null};new k;new k;E.prototype={uniforms:function(b){d.useProgram(this.program);for(var c in b){var a=this.uniformLocations[c]||d.getUniformLocation(this.program,c);if(a){this.uniformLocations[c]=a;var e=b[c];e instanceof j?e=[e.x,e.y,e.z]:e instanceof k&&(e=e.m);var f=Object.prototype.toString.call(e);
if("[object Array]"==f||"[object Float32Array]"==f)switch(e.length){case 1:d.uniform1fv(a,new Float32Array(e));break;case 2:d.uniform2fv(a,new Float32Array(e));break;case 3:d.uniform3fv(a,new Float32Array(e));break;case 4:d.uniform4fv(a,new Float32Array(e));break;case 9:d.uniformMatrix3fv(a,!1,new Float32Array([e[0],e[3],e[6],e[1],e[4],e[7],e[2],e[5],e[8]]));break;case 16:d.uniformMatrix4fv(a,!1,new Float32Array([e[0],e[4],e[8],e[12],e[1],e[5],e[9],e[13],e[2],e[6],e[10],e[14],e[3],e[7],e[11],e[15]]));
break;default:throw"don't know how to load uniform \""+c+'" of length '+e.length;}else if(f=Object.prototype.toString.call(e),"[object Number]"==f||"[object Boolean]"==f)(this.isSampler[c]?d.uniform1i:d.uniform1f).call(d,a,e);else throw'attempted to set uniform "'+c+'" to invalid value '+e;}}return this},draw:function(b,c){this.drawBuffers(b.vertexBuffers,b.indexBuffers[c==d.LINES?"lines":"triangles"],2>arguments.length?d.TRIANGLES:c)},drawBuffers:function(b,c,a){var e=this.usedMatrices,f=d.modelviewMatrix,
i=d.projectionMatrix,h=e.MVMI||e.NM?f.inverse():null,g=e.PMI?i.inverse():null,j=e.MVPM||e.MVPMI?i.multiply(f):null,k={};e.MVM&&(k[e.MVM]=f);e.MVMI&&(k[e.MVMI]=h);e.PM&&(k[e.PM]=i);e.PMI&&(k[e.PMI]=g);e.MVPM&&(k[e.MVPM]=j);e.MVPMI&&(k[e.MVPMI]=j.inverse());e.NM&&(f=h.m,k[e.NM]=[f[0],f[4],f[8],f[1],f[5],f[9],f[2],f[6],f[10]]);this.uniforms(k);var e=0,l;for(l in b)k=b[l],f=this.attributes[l]||d.getAttribLocation(this.program,l.replace(/^gl_/,"_gl_")),-1!=f&&k.buffer&&(this.attributes[l]=f,d.bindBuffer(d.ARRAY_BUFFER,
k.buffer),d.enableVertexAttribArray(f),d.vertexAttribPointer(f,k.buffer.spacing,d.FLOAT,!1,0,0),e=k.buffer.length/k.buffer.spacing);for(l in this.attributes)l in b||d.disableVertexAttribArray(this.attributes[l]);if(e&&(!c||c.buffer))c?(d.bindBuffer(d.ELEMENT_ARRAY_BUFFER,c.buffer),d.drawElements(a,c.buffer.length,d.UNSIGNED_SHORT,0)):d.drawArrays(a,0,e);return this}};var B,p,C;q.prototype={bind:function(b){d.activeTexture(d.TEXTURE0+(b||0));d.bindTexture(d.TEXTURE_2D,this.id)},unbind:function(b){d.activeTexture(d.TEXTURE0+
(b||0));d.bindTexture(d.TEXTURE_2D,null)},drawTo:function(b){var c=d.getParameter(d.VIEWPORT);B=B||d.createFramebuffer();p=p||d.createRenderbuffer();d.bindFramebuffer(d.FRAMEBUFFER,B);d.bindRenderbuffer(d.RENDERBUFFER,p);if(this.width!=p.width||this.height!=p.height)p.width=this.width,p.height=this.height,d.renderbufferStorage(d.RENDERBUFFER,d.DEPTH_COMPONENT16,this.width,this.height);d.framebufferTexture2D(d.FRAMEBUFFER,d.COLOR_ATTACHMENT0,d.TEXTURE_2D,this.id,0);d.framebufferRenderbuffer(d.FRAMEBUFFER,
d.DEPTH_ATTACHMENT,d.RENDERBUFFER,p);d.viewport(0,0,this.width,this.height);b();d.bindFramebuffer(d.FRAMEBUFFER,null);d.bindRenderbuffer(d.RENDERBUFFER,null);d.viewport(c[0],c[1],c[2],c[3])},swapWith:function(b){var c;c=b.id;b.id=this.id;this.id=c;c=b.width;b.width=this.width;this.width=c;c=b.height;b.height=this.height;this.height=c}};q.fromImage=function(b,c){var c=c||{},a=new q(b.width,b.height,c);try{d.texImage2D(d.TEXTURE_2D,0,a.format,a.format,a.type,b)}catch(e){if("file:"==location.protocol)throw'image not loaded for security reasons (serve this page over "http://" instead)';
throw"image not loaded for security reasons (image must originate from the same domain as this page or use Cross-Origin Resource Sharing)";}c.minFilter&&(c.minFilter!=d.NEAREST&&c.minFilter!=d.LINEAR)&&d.generateMipmap(d.TEXTURE_2D);return a};q.fromURL=function(b,c){var a;if(!(a=C)){a=document.createElement("canvas").getContext("2d");a.canvas.width=a.canvas.height=128;for(var e=0;e<a.canvas.height;e+=16)for(var f=0;f<a.canvas.width;f+=16)a.fillStyle=(f^e)&16?"#FFF":"#DDD",a.fillRect(f,e,16,16);a=
a.canvas}C=a;var i=q.fromImage(C,c),h=new Image,g=d;h.onload=function(){g.makeCurrent();q.fromImage(h,c).swapWith(i)};h.src=b;return i};j.prototype={negative:function(){return new j(-this.x,-this.y,-this.z)},add:function(b){return b instanceof j?new j(this.x+b.x,this.y+b.y,this.z+b.z):new j(this.x+b,this.y+b,this.z+b)},subtract:function(b){return b instanceof j?new j(this.x-b.x,this.y-b.y,this.z-b.z):new j(this.x-b,this.y-b,this.z-b)},multiply:function(b){return b instanceof j?new j(this.x*b.x,this.y*
b.y,this.z*b.z):new j(this.x*b,this.y*b,this.z*b)},divide:function(b){return b instanceof j?new j(this.x/b.x,this.y/b.y,this.z/b.z):new j(this.x/b,this.y/b,this.z/b)},equals:function(b){return this.x==b.x&&this.y==b.y&&this.z==b.z},dot:function(b){return this.x*b.x+this.y*b.y+this.z*b.z},cross:function(b){return new j(this.y*b.z-this.z*b.y,this.z*b.x-this.x*b.z,this.x*b.y-this.y*b.x)},length:function(){return Math.sqrt(this.dot(this))},unit:function(){return this.divide(this.length())},min:function(){return Math.min(Math.min(this.x,
this.y),this.z)},max:function(){return Math.max(Math.max(this.x,this.y),this.z)},toAngles:function(){return{theta:Math.atan2(this.z,this.x),phi:Math.asin(this.y/this.length())}},toArray:function(b){return[this.x,this.y,this.z].slice(0,b||3)},clone:function(){return new j(this.x,this.y,this.z)},init:function(b,c,a){this.x=b;this.y=c;this.z=a;return this}};j.negative=function(b,c){c.x=-b.x;c.y=-b.y;c.z=-b.z;return c};j.add=function(b,c,a){c instanceof j?(a.x=b.x+c.x,a.y=b.y+c.y,a.z=b.z+c.z):(a.x=b.x+
c,a.y=b.y+c,a.z=b.z+c);return a};j.subtract=function(b,c,a){c instanceof j?(a.x=b.x-c.x,a.y=b.y-c.y,a.z=b.z-c.z):(a.x=b.x-c,a.y=b.y-c,a.z=b.z-c);return a};j.multiply=function(b,c,a){c instanceof j?(a.x=b.x*c.x,a.y=b.y*c.y,a.z=b.z*c.z):(a.x=b.x*c,a.y=b.y*c,a.z=b.z*c);return a};j.divide=function(b,c,a){c instanceof j?(a.x=b.x/c.x,a.y=b.y/c.y,a.z=b.z/c.z):(a.x=b.x/c,a.y=b.y/c,a.z=b.z/c);return a};j.cross=function(b,c,a){a.x=b.y*c.z-b.z*c.y;a.y=b.z*c.x-b.x*c.z;a.z=b.x*c.y-b.y*c.x;return a};j.unit=function(b,
c){var a=b.length();c.x=b.x/a;c.y=b.y/a;c.z=b.z/a;return c};j.fromAngles=function(b,c){return new j(Math.cos(b)*Math.cos(c),Math.sin(c),Math.sin(b)*Math.cos(c))};j.randomDirection=function(){return j.fromAngles(2*Math.random()*Math.PI,Math.asin(2*Math.random()-1))};j.min=function(b,c){return new j(Math.min(b.x,c.x),Math.min(b.y,c.y),Math.min(b.z,c.z))};j.max=function(b,c){return new j(Math.max(b.x,c.x),Math.max(b.y,c.y),Math.max(b.z,c.z))};j.lerp=function(b,c,a){return c.subtract(b).multiply(a).add(b)};
j.fromArray=function(b){return new j(b[0],b[1],b[2])};return s}();


// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on meshes elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm. All edge cases involving overlapping coplanar polygons in both
// solids are correctly handled.
//
// Example usage:
//
//     var cube = CSG.cube();
//     var sphere = CSG.sphere({ radius: 1.3 });
//     var polygons = cube.subtract(sphere).toPolygons();
//
// ## Implementation Details
//
// All CSG operations are implemented in terms of two functions, `clipTo()` and
// `invert()`, which remove parts of a BSP tree inside another BSP tree and swap
// solid and empty space, respectively. To find the union of `a` and `b`, we
// want to remove everything in `a` inside `b` and everything in `b` inside `a`,
// then combine polygons from `a` and `b` into one solid:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     a.build(b.allPolygons());
//
// The only tricky part is handling overlapping coplanar polygons in both trees.
// The code above keeps both copies, but we need to keep them in one tree and
// remove them in the other tree. To remove them from `b` we can clip the
// inverse of `b` against `a`. The code for union now looks like this:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     b.invert();
//     b.clipTo(a);
//     b.invert();
//     a.build(b.allPolygons());
//
// Subtraction and intersection naturally follow from set operations. If
// union is `A | B`, subtraction is `A - B = ~(~A | B)` and intersection is
// `A & B = ~(~A | ~B)` where `~` is the complement operator.
//
// ## License
//
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.

// # class CSG

// Holds a binary space partition tree representing a 3D solid. Two solids can
// be combined using the `union()`, `subtract()`, and `intersect()` methods.

CSG = function() {
  this.polygons = [];
};

// Construct a CSG solid from a list of `CSG.Polygon` instances.
CSG.fromPolygons = function(polygons) {
  var csg = new CSG();
  csg.polygons = polygons;
  return csg;
};

CSG.toString = function () {
  const list = [];
  this.polygons.forEach((polygon) => {
    const obj = {vertices: []};
    polygon.vertices.forEach((vertex) =>
        obj.vertices.push({x: vertex.pos.x, y: vertex.pos.y, z: vertex.pos.z}));
    list.push(obj);
  });
  return JSON.stringify(list, null, 2);
}

CSG.prototype = {
  clone: function() {
    var csg = new CSG();
    csg.polygons = this.polygons.map(function(p) { return p.clone(); });
    return csg;
  },

  toPolygons: function() {
    return this.polygons;
  },

  // Return a new CSG solid representing space in either this solid or in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  //
  //     A.union(B)
  //
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |       +----+
  //     +----+--+    |       +----+       |
  //          |   B   |            |       |
  //          |       |            |       |
  //          +-------+            +-------+
  //
  union: function(csg) {
    var a = new CSG.Node(this.clone().polygons);
    var b = new CSG.Node(csg.clone().polygons);
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    return CSG.fromPolygons(a.allPolygons());
  },

  // Return a new CSG solid representing space in this solid but not in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  //
  //     A.subtract(B)
  //
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |    +--+
  //     +----+--+    |       +----+
  //          |   B   |
  //          |       |
  //          +-------+
  //
  subtract: function(csg) {
    var a = new CSG.Node(this.clone().polygons);
    var b = new CSG.Node(csg.clone().polygons);
    a.invert();
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  },

  // Return a new CSG solid representing space both this solid and in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  //
  //     A.intersect(B)
  //
  //     +-------+
  //     |       |
  //     |   A   |
  //     |    +--+----+   =   +--+
  //     +----+--+    |       +--+
  //          |   B   |
  //          |       |
  //          +-------+
  //
  intersect: function(csg) {
    var a = new CSG.Node(this.clone().polygons);
    var b = new CSG.Node(csg.clone().polygons);
    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();
    return CSG.fromPolygons(a.allPolygons());
  },

  // Return a new CSG solid with solid and empty space switched. This solid is
  // not modified.
  inverse: function() {
    var csg = this.clone();
    csg.polygons.map(function(p) { p.flip(); });
    return csg;
  },
  endpoints: function () {
    const endpoints = {};
    const endpoint = (attr, value) => {
      const max = endpoints[attr];
      endpoints[attr] = max === undefined || max < value ? value : max;
      const minAttr = `-${attr}`;
      const min = endpoints[minAttr];
      endpoints[minAttr] = min === undefined || min > value ? value : min;
    }
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      endpoint('x', vertex.pos.x);
      endpoint('y', vertex.pos.y);
      endpoint('z', vertex.pos.z);
    }));
    return endpoints;
  },
  distCenter: function () {
    const endpoints = this.endpoints();
    const x = ((endpoints.x + endpoints['-x']) / 2);
    const y = ((endpoints.y + endpoints['-y']) / 2);
    const z = ((endpoints.z + endpoints['-z']) / 2);
    return {x,y,z};
  },

  rotate: function (rotations) {
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      let newPos = ArbitraryRotate(vertex.pos, rotations.x, {x: 1, y:0, z:0});
      newPos = ArbitraryRotate(newPos, rotations.y, {x: 0, y:1, z:0});
      newPos = ArbitraryRotate(newPos, rotations.z, {x: 0, y:0, z:1});
      return new CSG.Vertex(newPos, vertex.normal);
    }));
  },

  translate: function (offset) {
    this.polygons.forEach((poly) => poly.forEachVertex((vertex) => {
      vertex.pos.x += offset.x;
      vertex.pos.y += offset.y;
      vertex.pos.z += offset.z;
    }));
  },

  center: function (newCenter) {
    const center = this.distCenter();
    const offset = {
      x: newCenter.x - center.x,
      y: newCenter.y - center.y,
      z: newCenter.z - center.z
    }
    this.translate(offset);
  }
};

// Construct an axis-aligned solid cuboid. Optional parameters are `center` and
// `radius`, which default to `[0, 0, 0]` and `[1, 1, 1]`. The radius can be
// specified using a single number or a list of three numbers, one for each axis.
//
// Example code:
//
//     var cube = CSG.cube({
//       center: [0, 0, 0],
//       radius: 1
//     });
//
// x1 = (x0 – xc)cos(θ) – (y0 – yc)sin(θ) + xc(Equation 3)
// y1 = (x0 – xc)sin(θ) + (y0 – yc)cos(θ) + yc(Equation 4)
CSG.cube = function(options) {
  options = options || {};
  var c = new CSG.Vector(options.center || [0, 0, 0]);
  var r = !options.radius ? [1, 1, 1] : options.radius.length ?
           options.radius : [options.radius, options.radius, options.radius];
  if (options.demensions) {
    r = [options.demensions[0]/2, options.demensions[1]/2, options.demensions[2]/2];
  }
  return CSG.fromPolygons([
    [[0, 4, 6, 2], [-1, 0, 0]],
    [[1, 3, 7, 5], [+1, 0, 0]],
    [[0, 1, 5, 4], [0, -1, 0]],
    [[2, 6, 7, 3], [0, +1, 0]],
    [[0, 2, 3, 1], [0, 0, -1]],
    [[4, 5, 7, 6], [0, 0, +1]]
  ].map(function(info) {
    return new CSG.Polygon(info[0].map(function(i) {
      var pos = new CSG.Vector(
        c.x + r[0] * (2 * !!(i & 1) - 1),
        c.y + r[1] * (2 * !!(i & 2) - 1),
        c.z + r[2] * (2 * !!(i & 4) - 1)
      );
      return new CSG.Vertex(pos, new CSG.Vector(info[1]));
    }));
  }));
};

// Construct a solid sphere. Optional parameters are `center`, `radius`,
// `slices`, and `stacks`, which default to `[0, 0, 0]`, `1`, `16`, and `8`.
// The `slices` and `stacks` parameters control the tessellation along the
// longitude and latitude directions.
//
// Example usage:
//
//     var sphere = CSG.sphere({
//       center: [0, 0, 0],
//       radius: 1,
//       slices: 16,
//       stacks: 8
//     });
CSG.sphere = function(options) {
  options = options || {};
  var c = new CSG.Vector(options.center || [0, 0, 0]);
  var r = options.radius || 1;
  var slices = options.slices || 16;
  var stacks = options.stacks || 8;
  var polygons = [], vertices;
  function vertex(theta, phi) {
    theta *= Math.PI * 2;
    phi *= Math.PI;
    var dir = new CSG.Vector(
      Math.cos(theta) * Math.sin(phi),
      Math.cos(phi),
      Math.sin(theta) * Math.sin(phi)
    );
    vertices.push(new CSG.Vertex(c.plus(dir.times(r)), dir));
  }
  for (var i = 0; i < slices; i++) {
    for (var j = 0; j < stacks; j++) {
      vertices = [];
      vertex(i / slices, j / stacks);
      if (j > 0) vertex((i + 1) / slices, j / stacks);
      if (j < stacks - 1) vertex((i + 1) / slices, (j + 1) / stacks);
      vertex(i / slices, (j + 1) / stacks);
      polygons.push(new CSG.Polygon(vertices));
    }
  }
  return CSG.fromPolygons(polygons);
};

// Construct a solid cylinder. Optional parameters are `start`, `end`,
// `radius`, and `slices`, which default to `[0, -1, 0]`, `[0, 1, 0]`, `1`, and
// `16`. The `slices` parameter controls the tessellation.
//
// Example usage:
//
//     var cylinder = CSG.cylinder({
//       start: [0, -1, 0],
//       end: [0, 1, 0],
//       radius: 1,
//       slices: 16
//     });
CSG.cylinder = function(options) {
  options = options || {};
  var s = new CSG.Vector(options.start || [0, -1, 0]);
  var e = new CSG.Vector(options.end || [0, 1, 0]);
  var ray = e.minus(s);
  var r = options.radius || 1;
  var slices = options.slices || 16;
  var axisZ = ray.unit(), isY = (Math.abs(axisZ.y) > 0.5);
  var axisX = new CSG.Vector(isY, !isY, 0).cross(axisZ).unit();
  var axisY = axisX.cross(axisZ).unit();
  var start = new CSG.Vertex(s, axisZ.negated());
  var end = new CSG.Vertex(e, axisZ.unit());
  var polygons = [];
  function point(stack, slice, normalBlend) {
    var angle = slice * Math.PI * 2;
    var out = axisX.times(Math.cos(angle)).plus(axisY.times(Math.sin(angle)));
    var pos = s.plus(ray.times(stack)).plus(out.times(r));
    var normal = out.times(1 - Math.abs(normalBlend)).plus(axisZ.times(normalBlend));
    return new CSG.Vertex(pos, normal);
  }
  for (var i = 0; i < slices; i++) {
    var t0 = i / slices, t1 = (i + 1) / slices;
    polygons.push(new CSG.Polygon([start, point(0, t0, -1), point(0, t1, -1)]));
    polygons.push(new CSG.Polygon([point(0, t1, 0), point(0, t0, 0), point(1, t0, 0), point(1, t1, 0)]));
    polygons.push(new CSG.Polygon([end, point(1, t1, 1), point(1, t0, 1)]));
  }
  return CSG.fromPolygons(polygons);
};

// # class Vector

// Represents a 3D vector.
//
// Example usage:
//
//     new CSG.Vector(1, 2, 3);
//     new CSG.Vector([1, 2, 3]);
//     new CSG.Vector({ x: 1, y: 2, z: 3 });

CSG.Vector = function(x, y, z) {
  if (arguments.length == 3) {
    this.x = x;
    this.y = y;
    this.z = z;
  } else if ('x' in x) {
    this.x = x.x;
    this.y = x.y;
    this.z = x.z;
  } else {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2];
  }
};

CSG.Vector.prototype = {
  clone: function() {
    return new CSG.Vector(this.x, this.y, this.z);
  },

  negated: function() {
    return new CSG.Vector(-this.x, -this.y, -this.z);
  },

  plus: function(a) {
    return new CSG.Vector(this.x + a.x, this.y + a.y, this.z + a.z);
  },

  minus: function(a) {
    return new CSG.Vector(this.x - a.x, this.y - a.y, this.z - a.z);
  },

  times: function(a) {
    return new CSG.Vector(this.x * a, this.y * a, this.z * a);
  },

  dividedBy: function(a) {
    return new CSG.Vector(this.x / a, this.y / a, this.z / a);
  },

  dot: function(a) {
    return this.x * a.x + this.y * a.y + this.z * a.z;
  },

  lerp: function(a, t) {
    return this.plus(a.minus(this).times(t));
  },

  length: function() {
    return Math.sqrt(this.dot(this));
  },

  unit: function() {
    return this.dividedBy(this.length());
  },

  cross: function(a) {
    return new CSG.Vector(
      this.y * a.z - this.z * a.y,
      this.z * a.x - this.x * a.z,
      this.x * a.y - this.y * a.x
    );
  }
};

// # class Vertex

// Represents a vertex of a polygon. Use your own vertex class instead of this
// one to provide additional features like texture coordinates and vertex
// colors. Custom vertex classes need to provide a `pos` property and `clone()`,
// `flip()`, and `interpolate()` methods that behave analogous to the ones
// defined by `CSG.Vertex`. This class provides `normal` so convenience
// functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
// is not used anywhere else.

CSG.Vertex = function(pos, normal) {
  this.pos = new CSG.Vector(pos);
  this.normal = new CSG.Vector(normal);
};

CSG.Vertex.prototype = {
  clone: function() {
    return new CSG.Vertex(this.pos.clone(), this.normal.clone());
  },

  // Invert all orientation-specific data (e.g. vertex normal). Called when the
  // orientation of a polygon is flipped.
  flip: function() {
    this.normal = this.normal.negated();
  },

  // Create a new vertex between this vertex and `other` by linearly
  // interpolating all properties using a parameter of `t`. Subclasses should
  // override this to interpolate additional properties.
  interpolate: function(other, t) {
    return new CSG.Vertex(
      this.pos.lerp(other.pos, t),
      this.normal.lerp(other.normal, t)
    );
  }
};

// # class Plane

// Represents a plane in 3D space.

CSG.Plane = function(normal, w) {
  this.normal = normal;
  this.w = w;
};

// `CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
// point is on the plane.
CSG.Plane.EPSILON = 1e-5;

CSG.Plane.fromPoints = function(a, b, c) {
  var n = b.minus(a).cross(c.minus(a)).unit();
  return new CSG.Plane(n, n.dot(a));
};

CSG.Plane.prototype = {
  clone: function() {
    return new CSG.Plane(this.normal.clone(), this.w);
  },

  flip: function() {
    this.normal = this.normal.negated();
    this.w = -this.w;
  },

  // Split `polygon` by this plane if needed, then put the polygon or polygon
  // fragments in the appropriate lists. Coplanar polygons go into either
  // `coplanarFront` or `coplanarBack` depending on their orientation with
  // respect to this plane. Polygons in front or in back of this plane go into
  // either `front` or `back`.
  splitPolygon: function(polygon, coplanarFront, coplanarBack, front, back) {
    var COPLANAR = 0;
    var FRONT = 1;
    var BACK = 2;
    var SPANNING = 3;

    // Classify each point as well as the entire polygon into one of the above
    // four classes.
    var polygonType = 0;
    var types = [];
    for (var i = 0; i < polygon.vertices.length; i++) {
      var t = this.normal.dot(polygon.vertices[i].pos) - this.w;
      var type = (t < -CSG.Plane.EPSILON) ? BACK : (t > CSG.Plane.EPSILON) ? FRONT : COPLANAR;
      polygonType |= type;
      types.push(type);
    }

    // Put the polygon in the correct list, splitting it when necessary.
    switch (polygonType) {
      case COPLANAR:
        (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
        break;
      case FRONT:
        front.push(polygon);
        break;
      case BACK:
        back.push(polygon);
        break;
      case SPANNING:
        var f = [], b = [];
        for (var i = 0; i < polygon.vertices.length; i++) {
          var j = (i + 1) % polygon.vertices.length;
          var ti = types[i], tj = types[j];
          var vi = polygon.vertices[i], vj = polygon.vertices[j];
          if (ti != BACK) f.push(vi);
          if (ti != FRONT) b.push(ti != BACK ? vi.clone() : vi);
          if ((ti | tj) == SPANNING) {
            var t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
            var v = vi.interpolate(vj, t);
            f.push(v);
            b.push(v.clone());
          }
        }
        if (f.length >= 3) front.push(new CSG.Polygon(f, polygon.shared));
        if (b.length >= 3) back.push(new CSG.Polygon(b, polygon.shared));
        break;
    }
  }
};

// # class Polygon

// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
//
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).

CSG.Polygon = function(vertices, shared) {
  this.vertices = vertices;
  this.shared = shared;
  this.plane = CSG.Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
};

CSG.Polygon.prototype = {
  clone: function() {
    var vertices = this.vertices.map(function(v) { return v.clone(); });
    return new CSG.Polygon(vertices, this.shared);
  },

  flip: function() {
    this.vertices.reverse().map(function(v) { v.flip(); });
    this.plane.flip();
  },
  forEachVertex: function (func) {
    for (let vIndex = 0; vIndex < this.vertices.length; vIndex += 1) {
      const vertex = this.vertices[vIndex];
      const newVertex = func(vertex);
      this.vertices[vIndex] = newVertex instanceof CSG.Vertex ? newVertex : vertex;
    }
  }
};

// # class Node

// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the front and/or back subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.

CSG.Node = function(polygons) {
  this.plane = null;
  this.front = null;
  this.back = null;
  this.polygons = [];
  if (polygons) this.build(polygons);
};

CSG.Node.prototype = {
  clone: function() {
    var node = new CSG.Node();
    node.plane = this.plane && this.plane.clone();
    node.front = this.front && this.front.clone();
    node.back = this.back && this.back.clone();
    node.polygons = this.polygons.map(function(p) { return p.clone(); });
    return node;
  },

  // Convert solid space to empty space and empty space to solid space.
  invert: function() {
    for (var i = 0; i < this.polygons.length; i++) {
      this.polygons[i].flip();
    }
    this.plane.flip();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    var temp = this.front;
    this.front = this.back;
    this.back = temp;
  },

  // Recursively remove all polygons in `polygons` that are inside this BSP
  // tree.
  clipPolygons: function(polygons) {
    if (!this.plane) return polygons.slice();
    var front = [], back = [];
    for (var i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], front, back, front, back);
    }
    if (this.front) front = this.front.clipPolygons(front);
    if (this.back) back = this.back.clipPolygons(back);
    else back = [];
    return front.concat(back);
  },

  // Remove all polygons in this BSP tree that are inside the other BSP tree
  // `bsp`.
  clipTo: function(bsp) {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(bsp);
    if (this.back) this.back.clipTo(bsp);
  },

  // Return a list of all polygons in this BSP tree.
  allPolygons: function() {
    var polygons = this.polygons.slice();
    if (this.front) polygons = polygons.concat(this.front.allPolygons());
    if (this.back) polygons = polygons.concat(this.back.allPolygons());
    return polygons;
  },

  // Build a BSP tree out of `polygons`. When called on an existing tree, the
  // new polygons are filtered down to the bottom of the tree and become new
  // nodes there. Each set of polygons is partitioned using the first polygon
  // (no heuristic is used to pick a good split).
  build: function(polygons) {
    if (!polygons.length) return;
    if (!this.plane) this.plane = polygons[0].plane.clone();
    var front = [], back = [];
    for (var i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
    }
    if (front.length) {
      if (!this.front) this.front = new CSG.Node();
      this.front.build(front);
    }
    if (back.length) {
      if (!this.back) this.back = new CSG.Node();
      this.back.build(back);
    }
  }
};

function round(value, percision) {
  const multiplier = Math.pow(10, percision);
  return Math.round(value * multiplier, 5) / multiplier;
}

/*
   Rotate a point p by angle theta around an arbitrary axis r
   Return the rotated point.
   Positive angles are anticlockwise looking down the axis
   towards the origin.
   Assume right hand coordinate system.
*/
function ArbitraryRotate(point, degreestheta, radius)
{
  theta = degreestheta * Math.PI/180;
  let p = point;
  let r = radius;
   let q = {x: 0.0, y: 0.0, z: 0.0};
   let costheta,sintheta;

   const Normalise = (obj, attr) => obj[attr] *= obj[attr] > 0 ? 1 : -1;
   Normalise(r, 'x',);
   Normalise(r, 'y',);
   Normalise(r, 'z',);

   costheta = Math.cos(theta);
   sintheta = Math.sin(theta);

   q.x += (costheta + (1 - costheta) * r.x * r.x) * p.x;
   q.x += ((1 - costheta) * r.x * r.y - r.z * sintheta) * p.y;
   q.x += ((1 - costheta) * r.x * r.z + r.y * sintheta) * p.z;
   q.x = round(q.x, 10);

   q.y += ((1 - costheta) * r.x * r.y + r.z * sintheta) * p.x;
   q.y += (costheta + (1 - costheta) * r.y * r.y) * p.y;
   q.y += ((1 - costheta) * r.y * r.z - r.x * sintheta) * p.z;
   q.y = round(q.y, 10);

   q.z += ((1 - costheta) * r.x * r.z - r.y * sintheta) * p.x;
   q.z += ((1 - costheta) * r.y * r.z + r.x * sintheta) * p.y;
   q.z += (costheta + (1 - costheta) * r.z * r.z) * p.z;
   q.z = round(q.z, 10);

   return(q);
}



/*
AutoCAD DXF Content

These are the common headers, classes, tables, blocks, and objects required for AC2017 DXF files.

## License

Copyright (c) 2018 Z3 Development https://github.com/z3dev

All code released under MIT license
*/

// Important Variables
//   ANGDIR = 0 : counter clockwise angles
//   INSUNITS = 4 : millimeters
//
const dxfHeaders = function () {
  const content = `  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1027
  9
$ACADMAINTVER
 70
8
  9
$DWGCODEPAGE
  3
ANSI_1252
  9
$LASTSAVEDBY
  1
unknown
  9
$REQUIREDVERSIONS
160
0
  9
$INSBASE
 10
0.0
 20
0.0
 30
0.0
  9
$EXTMIN
 10
1e+20
 20
1e+20
 30
1e+20
  9
$EXTMAX
 10
-1e+20
 20
-1e+20
 30
-1e+20
  9
$LIMMIN
 10
0.0
 20
0.0
  9
$LIMMAX
 10
12.0
 20
9.0
  9
$ORTHOMODE
 70
0
  9
$REGENMODE
 70
1
  9
$FILLMODE
 70
1
  9
$QTEXTMODE
 70
0
  9
$MIRRTEXT
 70
0
  9
$LTSCALE
 40
1.0
  9
$ATTMODE
 70
1
  9
$TEXTSIZE
 40
0.2
  9
$TRACEWID
 40
0.05
  9
$TEXTSTYLE
  7
Notes
  9
$CLAYER
  8
0
  9
$CELTYPE
  6
ByLayer
  9
$CECOLOR
 62
256
  9
$CELTSCALE
 40
1.0
  9
$DISPSILH
 70
0
  9
$DIMSCALE
 40
1.0
  9
$DIMASZ
 40
3.0
  9
$DIMEXO
 40
1.5
  9
$DIMDLI
 40
6.0
  9
$DIMRND
 40
0.0
  9
$DIMDLE
 40
0.0
  9
$DIMEXE
 40
3.0
  9
$DIMTP
 40
0.0
  9
$DIMTM
 40
0.0
  9
$DIMTXT
 40
3.0
  9
$DIMCEN
 40
3.0
  9
$DIMTSZ
 40
0.0
  9
$DIMTOL
 70
0
  9
$DIMLIM
 70
0
  9
$DIMTIH
 70
0
  9
$DIMTOH
 70
0
  9
$DIMSE1
 70
0
  9
$DIMSE2
 70
0
  9
$DIMTAD
 70
1
  9
$DIMZIN
 70
3
  9
$DIMBLK
  1

  9
$DIMASO
 70
1
  9
$DIMSHO
 70
1
  9
$DIMPOST
  1

  9
$DIMAPOST
  1

  9
$DIMALT
 70
0
  9
$DIMALTD
 70
2
  9
$DIMALTF
 40
25.4
  9
$DIMLFAC
 40
1.0
  9
$DIMTOFL
 70
0
  9
$DIMTVP
 40
0.0
  9
$DIMTIX
 70
0
  9
$DIMSOXD
 70
0
  9
$DIMSAH
 70
0
  9
$DIMBLK1
  1

  9
$DIMBLK2
  1

  9
$DIMSTYLE
  2
Civil-Metric
  9
$DIMCLRD
 70
0
  9
$DIMCLRE
 70
0
  9
$DIMCLRT
 70
0
  9
$DIMTFAC
 40
1.0
  9
$DIMGAP
 40
2.0
  9
$DIMJUST
 70
0
  9
$DIMSD1
 70
0
  9
$DIMSD2
 70
0
  9
$DIMTOLJ
 70
1
  9
$DIMTZIN
 70
0
  9
$DIMALTZ
 70
0
  9
$DIMALTTZ
 70
0
  9
$DIMUPT
 70
0
  9
$DIMDEC
 70
2
  9
$DIMTDEC
 70
2
  9
$DIMALTU
 70
2
  9
$DIMALTTD
 70
2
  9
$DIMTXSTY
  7
Standard
  9
$DIMAUNIT
 70
0
  9
$DIMADEC
 70
2
  9
$DIMALTRND
 40
0.0
  9
$DIMAZIN
 70
2
  9
$DIMDSEP
 70
46
  9
$DIMATFIT
 70
3
  9
$DIMFRAC
 70
1
  9
$DIMLDRBLK
  1

  9
$DIMLUNIT
 70
2
  9
$DIMLWD
 70
-2
  9
$DIMLWE
 70
-2
  9
$DIMTMOVE
 70
0
  9
$DIMFXL
 40
1.0
  9
$DIMFXLON
 70
0
  9
$DIMJOGANG
 40
0.785398163397
  9
$DIMTFILL
 70
0
  9
$DIMTFILLCLR
 70
0
  9
$DIMARCSYM
 70
0
  9
$DIMLTYPE
  6

  9
$DIMLTEX1
  6

  9
$DIMLTEX2
  6

  9
$DIMTXTDIRECTION
 70
0
  9
$LUNITS
 70
2
  9
$LUPREC
 70
4
  9
$SKETCHINC
 40
0.1
  9
$FILLETRAD
 40
0.0
  9
$AUNITS
 70
4
  9
$AUPREC
 70
5
  9
$MENU
  1
.
  9
$ELEVATION
 40
0.0
  9
$PELEVATION
 40
0.0
  9
$THICKNESS
 40
0.0
  9
$LIMCHECK
 70
0
  9
$CHAMFERA
 40
0.0
  9
$CHAMFERB
 40
0.0
  9
$CHAMFERC
 40
0.0
  9
$CHAMFERD
 40
0.0
  9
$SKPOLY
 70
0
  9
$TDCREATE
 40
2457986.69756
  9
$TDUCREATE
 40
2455631.2632
  9
$TDUPDATE
 40
2457986.69756
  9
$TDUUPDATE
 40
2456436.43179
  9
$TDINDWG
 40
0.0003490741
  9
$TDUSRTIMER
 40
0.0003487153
  9
$USRTIMER
 70
1
  9
$ANGBASE
 50
0.0
  9
$ANGDIR
 70
0
  9
$PDMODE
 70
0
  9
$PDSIZE
 40
0.0
  9
$PLINEWID
 40
0.0
  9
$SPLFRAME
 70
0
  9
$SPLINETYPE
 70
6
  9
$SPLINESEGS
 70
8
  9
$HANDSEED
  5
5C7
  9
$SURFTAB1
 70
6
  9
$SURFTAB2
 70
6
  9
$SURFTYPE
 70
6
  9
$SURFU
 70
6
  9
$SURFV
 70
6
  9
$UCSBASE
  2

  9
$UCSNAME
  2

  9
$UCSORG
 10
0.0
 20
0.0
 30
0.0
  9
$UCSXDIR
 10
1.0
 20
0.0
 30
0.0
  9
$UCSYDIR
 10
0.0
 20
1.0
 30
0.0
  9
$UCSORTHOREF
  2

  9
$UCSORTHOVIEW
 70
0
  9
$UCSORGTOP
 10
0.0
 20
0.0
 30
0.0
  9
$UCSORGBOTTOM
 10
0.0
 20
0.0
 30
0.0
  9
$UCSORGLEFT
 10
0.0
 20
0.0
 30
0.0
  9
$UCSORGRIGHT
 10
0.0
 20
0.0
 30
0.0
  9
$UCSORGFRONT
 10
0.0
 20
0.0
 30
0.0
  9
$UCSORGBACK
 10
0.0
 20
0.0
 30
0.0
  9
$PUCSBASE
  2

  9
$PUCSNAME
  2

  9
$PUCSORG
 10
0.0
 20
0.0
 30
0.0
  9
$PUCSXDIR
 10
1.0
 20
0.0
 30
0.0
  9
$PUCSYDIR
 10
0.0
 20
1.0
 30
0.0
  9
$PUCSORTHOREF
  2

  9
$PUCSORTHOVIEW
 70
0
  9
$PUCSORGTOP
 10
0.0
 20
0.0
 30
0.0
  9
$PUCSORGBOTTOM
 10
0.0
 20
0.0
 30
0.0
  9
$PUCSORGLEFT
 10
0.0
 20
0.0
 30
0.0
  9
$PUCSORGRIGHT
 10
0.0
 20
0.0
 30
0.0
  9
$PUCSORGFRONT
 10
0.0
 20
0.0
 30
0.0
  9
$PUCSORGBACK
 10
0.0
 20
0.0
 30
0.0
  9
$USERI1
 70
0
  9
$USERI2
 70
0
  9
$USERI3
 70
0
  9
$USERI4
 70
0
  9
$USERI5
 70
0
  9
$USERR1
 40
0.0
  9
$USERR2
 40
0.0
  9
$USERR3
 40
0.0
  9
$USERR4
 40
0.0
  9
$USERR5
 40
0.0
  9
$WORLDVIEW
 70
1
  9
$SHADEDGE
 70
3
  9
$SHADEDIF
 70
70
  9
$TILEMODE
 70
1
  9
$MAXACTVP
 70
64
  9
$PINSBASE
 10
0.0
 20
0.0
 30
0.0
  9
$PLIMCHECK
 70
0
  9
$PEXTMIN
 10
0.628866766397
 20
0.799999952316
 30
0.0
  9
$PEXTMAX
 10
9.02886638493
 20
7.19999957085
 30
0.0
  9
$PLIMMIN
 10
-0.700541819174
 20
-0.228100386192
  9
$PLIMMAX
 10
10.2994579405
 20
8.27189937351
  9
$UNITMODE
 70
0
  9
$VISRETAIN
 70
1
  9
$PLINEGEN
 70
0
  9
$PSLTSCALE
 70
1
  9
$TREEDEPTH
 70
3020
  9
$CMLSTYLE
  2
Standard
  9
$CMLJUST
 70
0
  9
$CMLSCALE
 40
1.0
  9
$PROXYGRAPHICS
 70
1
  9
$MEASUREMENT
 70
1
  9
$CELWEIGHT
370
-1
  9
$ENDCAPS
280
0
  9
$JOINSTYLE
280
0
  9
$LWDISPLAY
290
0
  9
$INSUNITS
 70
4
  9
$HYPERLINKBASE
  1

  9
$STYLESHEET
  1

  9
$XEDIT
290
1
  9
$CEPSNTYPE
380
0
  9
$PSTYLEMODE
290
1
  9
$FINGERPRINTGUID
  2
{39DB1BDD-BC6C-46D3-A333-DFCC0DC4782D}
  9
$VERSIONGUID
  2
{69EEBB2D-7039-498F-9366-3F994E4A07E7}
  9
$EXTNAMES
290
1
  9
$PSVPSCALE
 40
0.0
  9
$OLESTARTUP
290
0
  9
$SORTENTS
280
127
  9
$INDEXCTL
280
0
  9
$HIDETEXT
280
1
  9
$XCLIPFRAME
280
0
  9
$HALOGAP
280
0
  9
$OBSCOLOR
 70
257
  9
$OBSLTYPE
280
0
  9
$INTERSECTIONDISPLAY
280
0
  9
$INTERSECTIONCOLOR
 70
257
  9
$DIMASSOC
280
2
  9
$PROJECTNAME
  1

  9
$CAMERADISPLAY
290
0
  9
$LENSLENGTH
 40
50.0
  9
$CAMERAHEIGHT
 40
0.0
  9
$STEPSPERSEC
 40
2.0
  9
$STEPSIZE
 40
6.0
  9
$3DDWFPREC
 40
2.0
  9
$PSOLWIDTH
 40
0.25
  9
$PSOLHEIGHT
 40
4.0
  9
$LOFTANG1
 40
1.57079632679
  9
$LOFTANG2
 40
1.57079632679
  9
$LOFTMAG1
 40
0.0
  9
$LOFTMAG2
 40
0.0
  9
$LOFTPARAM
 70
7
  9
$LOFTNORMALS
280
1
  9
$LATITUDE
 40
37.795
  9
$LONGITUDE
 40
-122.394
  9
$NORTHDIRECTION
 40
0.0
  9
$TIMEZONE
 70
-8000
  9
$LIGHTGLYPHDISPLAY
280
1
  9
$TILEMODELIGHTSYNCH
280
1
  9
$CMATERIAL
347
96
  9
$SOLIDHIST
280
1
  9
$SHOWHIST
280
1
  9
$DWFFRAME
280
2
  9
$DGNFRAME
280
0
  9
$REALWORLDSCALE
290
1
  9
$INTERFERECOLOR
 62
1
  9
$INTERFEREOBJVS
345
A3
  9
$INTERFEREVPVS
346
A0
  9
$CSHADOW
280
0
  9
$SHADOWPLANELOCATION
 40
0.0
  0
ENDSEC`
  return content
}

const dxfClasses = function () {
  const content = `  0
SECTION
  2
CLASSES
  0
CLASS
  1
ACDBDICTIONARYWDFLT
  2
AcDbDictionaryWithDefault
  3
ObjectDBX Classes
 90
0
 91
1
280
0
281
0
  0
CLASS
  1
DICTIONARYVAR
  2
AcDbDictionaryVar
  3
ObjectDBX Classes
 90
0
 91
15
280
0
281
0
  0
CLASS
  1
TABLESTYLE
  2
AcDbTableStyle
  3
ObjectDBX Classes
 90
4095
 91
1
280
0
281
0
  0
CLASS
  1
MATERIAL
  2
AcDbMaterial
  3
ObjectDBX Classes
 90
1153
 91
3
280
0
281
0
  0
CLASS
  1
VISUALSTYLE
  2
AcDbVisualStyle
  3
ObjectDBX Classes
 90
4095
 91
26
280
0
281
0
  0
CLASS
  1
SCALE
  2
AcDbScale
  3
ObjectDBX Classes
 90
1153
 91
17
280
0
281
0
  0
CLASS
  1
MLEADERSTYLE
  2
AcDbMLeaderStyle
  3
ACDB_MLEADERSTYLE_CLASS
 90
4095
 91
3
280
0
281
0
  0
CLASS
  1
CELLSTYLEMAP
  2
AcDbCellStyleMap
  3
ObjectDBX Classes
 90
1152
 91
2
280
0
281
0
  0
CLASS
  1
EXACXREFPANELOBJECT
  2
ExAcXREFPanelObject
  3
EXAC_ESW
 90
1025
 91
0
280
0
281
0
  0
CLASS
  1
NPOCOLLECTION
  2
AcDbImpNonPersistentObjectsCollection
  3
ObjectDBX Classes
 90
1153
 91
0
280
0
281
0
  0
CLASS
  1
LAYER_INDEX
  2
AcDbLayerIndex
  3
ObjectDBX Classes
 90
0
 91
0
280
0
281
0
  0
CLASS
  1
SPATIAL_INDEX
  2
AcDbSpatialIndex
  3
ObjectDBX Classes
 90
0
 91
0
280
0
281
0
  0
CLASS
  1
IDBUFFER
  2
AcDbIdBuffer
  3
ObjectDBX Classes
 90
0
 91
0
280
0
281
0
  0
CLASS
  1
DIMASSOC
  2
AcDbDimAssoc
  3
"AcDbDimAssoc|Product Desc:     AcDim ARX App For Dimension|Company:          Autodesk, Inc.|WEB Address:      www.autodesk.com"
 90
0
 91
0
280
0
281
0
  0
CLASS
  1
ACDBSECTIONVIEWSTYLE
  2
AcDbSectionViewStyle
  3
ObjectDBX Classes
 90
1025
 91
1
280
0
281
0
  0
CLASS
  1
ACDBDETAILVIEWSTYLE
  2
AcDbDetailViewStyle
  3
ObjectDBX Classes
 90
1025
 91
1
280
0
281
0
  0
CLASS
  1
IMAGEDEF
  2
AcDbRasterImageDef
  3
ISM
 90
0
 91
1
280
0
281
0
  0
CLASS
  1
RASTERVARIABLES
  2
AcDbRasterVariables
  3
ISM
 90
0
 91
1
280
0
281
0
  0
CLASS
  1
IMAGEDEF_REACTOR
  2
AcDbRasterImageDefReactor
  3
ISM
 90
1
 91
1
280
0
281
0
  0
CLASS
  1
IMAGE
  2
AcDbRasterImage
  3
ISM
 90
2175
 91
1
280
0
281
1
  0
CLASS
  1
PDFDEFINITION
  2
AcDbPdfDefinition
  3
ObjectDBX Classes
 90
1153
 91
1
280
0
281
0
  0
CLASS
  1
PDFUNDERLAY
  2
AcDbPdfReference
  3
ObjectDBX Classes
 90
4095
 91
1
280
0
281
1
  0
CLASS
  1
DWFDEFINITION
  2
AcDbDwfDefinition
  3
ObjectDBX Classes
 90
1153
 91
2
280
0
281
0
  0
CLASS
  1
DWFUNDERLAY
  2
AcDbDwfReference
  3
ObjectDBX Classes
 90
1153
 91
1
280
0
281
1
  0
CLASS
  1
DGNDEFINITION
  2
AcDbDgnDefinition
  3
ObjectDBX Classes
 90
1153
 91
2
280
0
281
0
  0
CLASS
  1
DGNUNDERLAY
  2
AcDbDgnReference
  3
ObjectDBX Classes
 90
1153
 91
1
280
0
281
1
  0
ENDSEC`
  return content
}

const dxfTables = function () {
  const content = `  0
SECTION
  2
TABLES
  0
TABLE
  2
VPORT
  5
8
330
0
100
AcDbSymbolTable
 70
0
  0
ENDTAB
  0
TABLE
  2
LTYPE
  5
5F
330
0
100
AcDbSymbolTable
 70
7
  0
LTYPE
  5
14
330
5F
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
ByBlock
 70
0
  3

 72
65
 73
0
 40
0.0
  0
LTYPE
  5
15
330
5F
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
ByLayer
 70
0
  3

 72
65
 73
0
 40
0.0
  0
LTYPE
  5
16
330
5F
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
Continuous
 70
0
  3
Solid line
 72
65
 73
0
 40
0.0
  0
LTYPE
  5
1B1
330
5F
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
CENTER
 70
0
  3
Center ____ _ ____ _ ____ _ ____ _ ____ _ ____
 72
65
 73
4
 40
2.0
 49
1.25
 74
0
 49
-0.25
 74
0
 49
0.25
 74
0
 49
-0.25
 74
0
  0
LTYPE
  5
1B2
330
5F
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
DASHED
 70
0
  3
Dashed __ __ __ __ __ __ __ __ __ __ __ __ __ _
 72
65
 73
2
 40
0.75
 49
0.5
 74
0
 49
-0.25
 74
0
  0
LTYPE
  5
1B3
330
5F
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
PHANTOM
 70
0
  3
Phantom ______  __  __  ______  __  __  ______
 72
65
 73
6
 40
2.5
 49
1.25
 74
0
 49
-0.25
 74
0
 49
0.25
 74
0
 49
-0.25
 74
0
 49
0.25
 74
0
 49
-0.25
 74
0
  0
LTYPE
  5
39E
330
5F
100
AcDbSymbolTableRecord
100
AcDbLinetypeTableRecord
  2
HIDDEN
 70
0
  3
Hidden __ __ __ __ __ __ __ __ __ __ __ __ __ __
 72
65
 73
2
 40
9.525
 49
6.35
 74
0
 49
-3.175
 74
0
  0
ENDTAB
  0
TABLE
  2
LAYER
  5
2
330
0
100
AcDbSymbolTable
 70
3
  0
LAYER
  5
10
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
  2
0
 70
0
  6
Continuous
370
-3
390
F
347
98
348
0
  0
LAYER
  5
1B4
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
  2
View Port
 70
0
  6
Continuous
290
0
370
-3
390
F
347
98
348
0
  0
LAYER
  5
21D
330
2
100
AcDbSymbolTableRecord
100
AcDbLayerTableRecord
  2
Defpoints
 70
0
  6
Continuous
290
0
370
-3
390
F
347
98
348
0
  0
ENDTAB
  0
TABLE
  2
STYLE
  5
3
330
0
100
AcDbSymbolTable
 70
3
  0
STYLE
  5
11
330
3
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
  2
Standard
 70
0
 40
0.0
 41
1.0
 50
0.0
 71
0
 42
0.2
  3
arial.ttf
  4

  0
STYLE
  5
DC
330
3
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
  2
Annotative
 70
0
 40
0.0
 41
1.0
 50
0.0
 71
0
 42
0.2
  3
arial.ttf
  4

  0
STYLE
  5
178
330
3
100
AcDbSymbolTableRecord
100
AcDbTextStyleTableRecord
  2
Notes
 70
0
 40
3.0
 41
1.0
 50
0.0
 71
0
 42
0.2
  3
arial.ttf
  4

  0
ENDTAB
  0
TABLE
  2
VIEW
  5
6
330
0
100
AcDbSymbolTable
 70
0
  0
ENDTAB
  0
TABLE
  2
UCS
  5
7
330
0
100
AcDbSymbolTable
 70
0
  0
ENDTAB
  0
TABLE
  2
APPID
  5
9
330
0
100
AcDbSymbolTable
 70
12
  0
APPID
  5
12
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD
 70
0
  0
APPID
  5
DD
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
AcadAnnoPO
 70
0
  0
APPID
  5
DE
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
AcadAnnotative
 70
0
  0
APPID
  5
DF
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD_DSTYLE_DIMJAG
 70
0
  0
APPID
  5
E0
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD_DSTYLE_DIMTALN
 70
0
  0
APPID
  5
107
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD_MLEADERVER
 70
0
  0
APPID
  5
1B5
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
AcAecLayerStandard
 70
0
  0
APPID
  5
1BA
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD_EXEMPT_FROM_CAD_STANDARDS
 70
0
  0
APPID
  5
237
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD_DSTYLE_DIMBREAK
 70
0
  0
APPID
  5
28E
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD_PSEXT
 70
0
  0
APPID
  5
4B0
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
ACAD_NAV_VCDISPLAY
 70
0
  0
APPID
  5
4E3
330
9
100
AcDbSymbolTableRecord
100
AcDbRegAppTableRecord
  2
HATCHBACKGROUNDCOLOR
 70
0
  0
ENDTAB
  0
TABLE
  2
DIMSTYLE
  5
A
330
0
100
AcDbSymbolTable
 70
3
100
AcDbDimStyleTable
 71
3
340
242
340
27
340
E1
  0
DIMSTYLE
105
27
330
A
100
AcDbSymbolTableRecord
100
AcDbDimStyleTableRecord
  2
Standard
 70
0
 41
3.0
 42
2.0
 43
9.0
 44
5.0
140
3.0
141
2.0
147
2.0
340
11
1001
ACAD_DSTYLE_DIMJAG
1070
388
1040
38.0
1001
ACAD_DSTYLE_DIMBREAK
1070
391
1040
90.0
1001
ACAD_DSTYLE_DIMTALN
1070
392
1070
0
  0
DIMSTYLE
105
E1
330
A
100
AcDbSymbolTableRecord
100
AcDbDimStyleTableRecord
  2
Annotative
 70
0
 40
0.0
 41
3.0
 42
2.5
 43
10.0
 44
5.0
140
3.0
141
2.0
147
2.0
340
11
1001
AcadAnnotative
1000
AnnotativeData
1002
{
1070
1
1070
1
1002
}
1001
ACAD_DSTYLE_DIMJAG
1070
388
1040
38.0
1001
ACAD_DSTYLE_DIMBREAK
1070
391
1040
90.0
1001
ACAD_DSTYLE_DIMTALN
1070
392
1070
0
  0
DIMSTYLE
105
242
330
A
100
AcDbSymbolTableRecord
100
AcDbDimStyleTableRecord
  2
Civil-Metric
 70
0
 41
3.0
 42
1.5
 43
6.0
 44
3.0
 73
0
 74
0
 77
1
 78
3
 79
2
140
3.0
141
3.0
147
2.0
179
2
271
2
272
2
276
1
340
11
1001
ACAD_DSTYLE_DIMBREAK
1070
391
1040
3.0
1001
ACAD_DSTYLE_DIMJAG
1070
388
1040
38.0
1001
ACAD_DSTYLE_DIMTALN
1070
392
1070
0
  0
ENDTAB
  0
TABLE
  2
BLOCK_RECORD
  5
1
330
0
100
AcDbSymbolTable
 70
4
  0
BLOCK_RECORD
  5
1F
330
1
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
  2
*Model_Space
340
530
 70
0
280
1
281
0
  0
BLOCK_RECORD
  5
58
330
1
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
  2
*Paper_Space
340
531
 70
0
280
1
281
0
  0
BLOCK_RECORD
  5
238
330
1
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
  2
_ArchTick
340
0
 70
0
280
1
281
0
  0
BLOCK_RECORD
  5
23C
330
1
100
AcDbSymbolTableRecord
100
AcDbBlockTableRecord
  2
_Open30
340
0
 70
0
280
1
281
0
  0
ENDTAB
  0
ENDSEC`
  return content
}

const dxfBlocks = function () {
  const content = `  0
SECTION
  2
BLOCKS
  0
BLOCK
  5
23A
330
238
100
AcDbEntity
  8
0
100
AcDbBlockBegin
  2
_ArchTick
 70
0
 10
0.0
 20
0.0
 30
0.0
  3
_ArchTick
  1

  0
ENDBLK
  5
23B
330
238
100
AcDbEntity
  8
0
100
AcDbBlockEnd
  0
BLOCK
  5
20
330
1F
100
AcDbEntity
  8
0
100
AcDbBlockBegin
  2
*Model_Space
 70
0
 10
0.0
 20
0.0
 30
0.0
  3
*Model_Space
  1

  0
ENDBLK
  5
21
330
1F
100
AcDbEntity
  8
0
100
AcDbBlockEnd
  0
BLOCK
  5
5A
330
58
100
AcDbEntity
 67
1
  8
0
100
AcDbBlockBegin
  2
*Paper_Space
 70
0
 10
0.0
 20
0.0
 30
0.0
  3
*Paper_Space
  1

  0
ENDBLK
  5
5B
330
58
100
AcDbEntity
 67
1
  8
0
100
AcDbBlockEnd
  0
BLOCK
  5
240
330
23C
100
AcDbEntity
  8
0
100
AcDbBlockBegin
  2
_Open30
 70
0
 10
0.0
 20
0.0
 30
0.0
  3
_Open30
  1

  0
ENDBLK
  5
241
330
23C
100
AcDbEntity
  8
0
100
AcDbBlockEnd
  0
ENDSEC`
  return content
}

const dxfObjects = function () {
  const content = `  0
SECTION
  2
OBJECTS
  0
DICTIONARY
  5
C
330
0
100
AcDbDictionary
281
1
  3
ACAD_COLOR
350
524
  3
ACAD_GROUP
350
525
  3
ACAD_LAYOUT
350
526
  3
ACAD_MATERIAL
350
527
  3
ACAD_MLEADERSTYLE
350
528
  3
ACAD_MLINESTYLE
350
529
  3
ACAD_PLOTSETTINGS
350
52A
  3
ACAD_PLOTSTYLENAME
350
52C
  3
ACAD_SCALELIST
350
52D
  3
ACAD_TABLESTYLE
350
52E
  3
ACAD_VISUALSTYLE
350
52F
  0
DICTIONARY
  5
524
330
C
100
AcDbDictionary
281
1
  0
DICTIONARY
  5
525
330
C
100
AcDbDictionary
281
1
  0
DICTIONARY
  5
526
330
C
100
AcDbDictionary
281
1
  3
Model
350
530
  3
Layout1
350
531
  0
DICTIONARY
  5
527
330
C
100
AcDbDictionary
281
1
  0
DICTIONARY
  5
528
330
C
100
AcDbDictionary
281
1
  0
DICTIONARY
  5
529
330
C
100
AcDbDictionary
281
1
  0
DICTIONARY
  5
52A
330
C
100
AcDbDictionary
281
1
  0
ACDBPLACEHOLDER
  5
52B
330
52C
  0
ACDBDICTIONARYWDFLT
  5
52C
330
C
100
AcDbDictionary
281
1
  3
Normal
350
52B
100
AcDbDictionaryWithDefault
340
52B
  0
DICTIONARY
  5
52D
330
C
100
AcDbDictionary
281
1
  0
DICTIONARY
  5
52E
330
C
100
AcDbDictionary
281
1
  0
DICTIONARY
  5
52F
330
C
100
AcDbDictionary
281
1
  0
LAYOUT
  5
530
330
526
100
AcDbPlotSettings
  1

  2
DWFx ePlot (XPS Compatible).pc3
  4
ANSI_A_(8.50_x_11.00_Inches)
  6

 40
5.8
 41
17.8
 42
5.8
 43
17.8
 44
215.9
 45
279.4
 46
0.0
 47
0.0
 48
0.0
 49
0.0
140
0.0
141
0.0
142
1.0
143
14.53
 70
11952
 72
0
 73
1
 74
0
  7

 75
0
147
0.069
148
114.98
149
300.29
100
AcDbLayout
  1
Model
 70
1
 71
0
 10
0.0
 20
0.0
 11
12.0
 21
9.0
 12
0.0
 22
0.0
 32
0.0
 14
0.0
 24
0.0
 34
0.0
 15
0.0
 25
0.0
 35
0.0
146
0.0
 13
0.0
 23
0.0
 33
0.0
 16
1.0
 26
0.0
 36
0.0
 17
0.0
 27
1.0
 37
0.0
 76
0
330
1F
  0
LAYOUT
  5
531
330
526
100
AcDbPlotSettings
  1

  2
DWFx ePlot (XPS Compatible).pc3
  4
ANSI_A_(8.50_x_11.00_Inches)
  6

 40
5.8
 41
17.8
 42
5.8
 43
17.8
 44
215.9
 45
279.4
 46
0.0
 47
0.0
 48
0.0
 49
0.0
140
0.0
141
0.0
142
1.0
143
1.0
 70
688
 72
0
 73
1
 74
5
  7
acad.ctb
 75
16
147
1.0
148
0.0
149
0.0
100
AcDbLayout
  1
Layout1
 70
1
 71
1
 10
-0.7
 20
-0.23
 11
10.3
 21
8.27
 12
0.0
 22
0.0
 32
0.0
 14
0.63
 24
0.8
 34
0.0
 15
9.0
 25
7.2
 35
0.0
146
0.0
 13
0.0
 23
0.0
 33
0.0
 16
1.0
 26
0.0
 36
0.0
 17
0.0
 27
1.0
 37
0.0
 76
0
330
58
  0
ENDSEC`
  return content
}

const dxfEntities = (objects, options) => {
  const entityContents = objects.map((object, i) => {
    return PolygonsTo3DFaces(object, options)
  });

  let section = `  0
SECTION
  2
ENTITIES
`
  entityContents.forEach((content) => {
    if (content) {
      section += content
    }
  })
  section += `  0
ENDSEC`
  return section
}


const serialize = (options, ...objects) => {
  const defaults = {
    geom3To: '3dface', // or polyline
    pathTo: 'lwpolyline',
    statusCallback: null,
    colorIndex: 0
  }
  options = Object.assign({}, defaults, options)

  options.entityId = 0 // sequence id for entities created

  if (objects.length === 0) throw new Error('only JSCAD geometries can be serialized to DXF')

  const dxfContent = `999
Created by JSCAD
${dxfHeaders(options)}
${dxfClasses(options)}
${dxfTables(options)}
${dxfBlocks(options)}
${dxfEntities(objects, options)}
${dxfObjects(options)}
  0
EOF
`
  return [dxfContent]
}

let polygonToTriangles = (polygon) => {
  const length = polygon.vertices.length - 2
  if (length < 1) return []

  const pivot = polygon.vertices[0]
  const triangles = []
  for (let i = 0; i < length; i++) {
    triangles.push([pivot, polygon.vertices[i + 1], polygon.vertices[i + 2]])
  }
  return triangles
}

let triangleTo3DFaces = (triangle, options, color) => {
  const corner10 = triangle[0].pos;
  const corner11 = triangle[1].pos;
  const corner12 = triangle[2].pos;
  const corner13 = triangle[2].pos;
  const str = `  0
3DFACE
  5
MyPart
  100
AcDbEntity
  8
0
  62
${color}
  100
AcDbFace
  70
0
  10
${corner10.x}
  20
${corner10.y}
  30
${corner10.z}
  11
${corner11.x}
  21
${corner11.y}
  31
${corner11.z}
  12
${corner12.x}
  22
${corner12.y}
  32
${corner12.z}
  13
${corner13.x}
  23
${corner13.y}
  33
${corner13.z}
`
  return str
}

let PolygonsTo3DFaces = (csg, options) => {
  let str = ''
  const polygons = csg.polygons
  // const objectColor = getColorNumber(object, options)
  polygons.forEach((polygon, i) => {
    const polyColor = 0;//polygon.color ? getColorNumber(polygon, options) : objectColor
    const triangles = polygonToTriangles(polygon)
    triangles.forEach((triangle, i) => {
      str += triangleTo3DFaces(triangle, options, polyColor)
    })
  })
  return [str]
}


// Set the color of all polygons in this solid
CSG.prototype.setColor = function(r, g, b) {
  this.toPolygons().map(function(polygon) {
    if (Array.isArray(r)) {
      g = r[1];
      b = r[2];
      r = r[0];
    }
    polygon.shared = [r/255, g/255, b/255];
  });
};

// Convert from CSG solid to GL.Mesh object
CSG.prototype.toMesh = function() {
  var mesh = new GL.Mesh({ normals: true, colors: true });
  var indexer = new GL.Indexer();
  this.toPolygons().map(function(polygon) {
    var indices = polygon.vertices.map(function(vertex) {
      vertex.color = polygon.shared || [1, 1, 1];
      return indexer.add(vertex);
    });
    for (var i = 2; i < indices.length; i++) {
      mesh.triangles.push([indices[0], indices[i - 1], indices[i]]);
    }
  });
  mesh.vertices = indexer.unique.map(function(v) { return [v.pos.x, v.pos.y, v.pos.z]; });
  mesh.normals = indexer.unique.map(function(v) { return [v.normal.x, v.normal.y, v.normal.z]; });
  mesh.colors = indexer.unique.map(function(v) { return v.color; });
  mesh.computeWireframe();
  return mesh;
};

var angleX = 0;
var angleY = 0;
var viewers = [];

// Set to true so lines don't use the depth buffer
Viewer.lineOverlay = false;

// A viewer is a WebGL canvas that lets the user view a mesh. The user can
// tumble it around by dragging the mouse.
function Viewer(csg, width, height, depth) {
  viewers.push(this);
  this.setDepth = (d) => depth = d;
  let x = 0;
  let y = 0;

  const zoom = (out) => {
    depth += (out === true ? 2 : -2);
  };
  this.zoom = zoom;
  const pan = (leftRight, upDown) => {
    x += leftRight;
    y += upDown * -1;
  }

  // Get a new WebGL canvas
  var gl = GL.create();
  this.gl = gl;
  this.mesh = csg.toMesh();

  // Set up the viewport
  gl.canvas.width = width;
  gl.canvas.height = height;
  gl.viewport(0, 0, width, height);
  gl.matrixMode(gl.PROJECTION);
  gl.loadIdentity();
  gl.perspective(100, width / height, 0.1, 100);
  gl.matrixMode(gl.MODELVIEW);

  // Set up WebGL state
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0.93, 0.93, 0.93, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.polygonOffset(1, 1);

  // Black shader for wireframe
  this.blackShader = new GL.Shader('\
    void main() {\
      gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
    }\
  ', '\
    void main() {\
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);\
    }\
  ');

  // Shader with diffuse and specular lighting
  this.lightingShader = new GL.Shader('\
    varying vec3 color;\
    varying vec3 normal;\
    varying vec3 light;\
    void main() {\
      const vec3 lightDir = vec3(3.0, 2.0, 3.0) / 3.741657386773941;\
      light = (gl_ModelViewMatrix * vec4(lightDir, 0.005)).xyz;\
      color = gl_Color.rgb;\
      normal = gl_NormalMatrix * gl_Normal;\
      gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
    }\
  ', '\
    varying vec3 color;\
    varying vec3 normal;\
    varying vec3 light;\
    void main() {\
      vec3 n = normalize(normal);\
      float diffuse = max(0.0, dot(light, n));\
      float specular = pow(max(0.0, -reflect(light, n).z), 32.0) * sqrt(diffuse);\
      gl_FragColor = vec4(mix(color * (0.3 + 0.7 * diffuse), vec3(1.0), specular), 1.0);\
    }\
  ');

  function rotateEvent(e) {
    angleY += e.deltaX * 2;
    angleX += e.deltaY * 2;
    angleX = Math.max(-90, Math.min(90, angleX));
  }

  gl.onmousemove = function(e) {
    if (e.dragging) {
      if (shiftHeld) panEvent(e);
      else rotateEvent(e);
      gl.ondraw();
    }
  };

  function zoomEvent(e) {
    const st = document.documentElement.scrollTop;
    if (e.deltaY < 0) {
      zoom(true);
    } else {
      zoom();
    }
  }

  function panEvent(e) {
    const st = document.documentElement.scrollTop;
    pan(e.deltaX, e.deltaY)
  }

  let lastScrollTop = 0;
  gl.canvas.onwheel = function (e) {
    zoomEvent(e);
    gl.ondraw();
  }
  disableScroll(gl.canvas);

  let shiftHeld = false;
  window.onkeydown = (e) => {
    shiftHeld = e.key === "Shift" ? true : false;
  }
  window.onkeyup = (e) => {
    shiftHeld = !shiftHeld || e.key === "Shift" ? false : true;
  }

  var that = this;
  gl.ondraw = function() {
    gl.makeCurrent();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.loadIdentity();
    gl.translate(x, y, -depth);
    gl.rotate(angleX, 1, 0, 0);
    gl.rotate(angleY, 0, 1, 0);

    if (!Viewer.lineOverlay) gl.enable(gl.POLYGON_OFFSET_FILL);
    that.lightingShader.draw(that.mesh, gl.TRIANGLES);
    if (!Viewer.lineOverlay) gl.disable(gl.POLYGON_OFFSET_FILL);

    if (Viewer.lineOverlay) gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    // that.blackShader.draw(that.mesh, gl.LINES);
    gl.disable(gl.BLEND);
    if (Viewer.lineOverlay) gl.enable(gl.DEPTH_TEST);
  };

  gl.ondraw();
  // gl.canvas.width = '100vw';
  // gl.canvas.height = '100vh';
}

var nextID = 0;
function addViewer(viewer, id) {
  document.getElementById(id).appendChild(viewer.gl.canvas);
}




// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e) {
  if (keys[e.keyCode]) {
    preventDefault(e);
    return false;
  }
}

// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () { supportsPassive = true; }
  }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

// call this to Disable
function disableScroll(element) {
  element.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
  element.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  element.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
  element.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

// call this to Enable
function enableScroll(element) {
  element.removeEventListener('DOMMouseScroll', preventDefault, false);
  element.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  element.removeEventListener('touchmove', preventDefault, wheelOpt);
  element.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}



class CustomEvent {
  constructor(name) {
    const watchers = [];
    this.name = name;

    const runFuncs = (e) => watchers.forEach((func) => func(e));

    this.on = function (func) {
      if ((typeof func) === 'function') {
        watchers.push(func);
      } else {
        return 'on' + name;
      }
    }

    this.trigger = function (element) {
      element = element === undefined ? window : element;
      runFuncs(element);
      if(document.createEvent){
          element.dispatchEvent(this.event);
      } else {
          element.fireEvent("on" + this.event.eventType, this.event);
      }
    }
//https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
    this.event;
    if(document.createEvent){
        this.event = document.createEvent("HTMLEvents");
        this.event.initEvent(name, true, true);
        this.event.eventName = name;
    } else {
        this.event = document.createEventObject();
        this.event.eventName = name;
        this.event.eventType = name;
    }
  }
}

let idCount = 0;
class ExprDef {
  constructor(name, options, notify, stages, alwaysPossible) {
    this.id = idCount++;
    let id = this.id;
    let string;
    let modified = '';
    let start;
    let end;
    alwaysPossible = alwaysPossible ? alwaysPossible : [];
    stages = stages ? stages : {};
    let currStage = stages;

    function getRoutes(prefix, stage) {
      let routes = [];
      let keys = Object.keys(stage);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (key !== '_meta') {
          let newPrefix;
          if (prefix) {
            newPrefix = `${prefix}.${key}`;
          } else {
            newPrefix = key;
          }
          const deepRoutes = getRoutes(newPrefix, stage[key]);
          if (deepRoutes.length > 0) {
            routes = routes.concat(deepRoutes);
          }
          if (stage[key]._meta && stage[key]._meta.end) {
            routes.push(newPrefix + '.end');
          }
          if (stage[key]._meta && stage[key]._meta.repeat) {
            routes.push(newPrefix + '.repeat');
          }
        }
      }
      return routes;
    }

    this.always = function () {
      for (let index = 0; index < arguments.length; index += 1) {
        alwaysPossible.push(arguments[index]);
      }
    };
    this.getAlways = function (exprDef) {return alwaysPossible;};

    this.allRoutes = function () {
      return getRoutes(null, stages);
    }

    function getNotice (exprDef) {
      let isInAlways = false;
      alwaysPossible.map(function (value) {if (value.getName() === exprDef.getName()) isInAlways = true;});
      if (isInAlways) return;
      if (!exprDef.closed()) {
        if (currStage[exprDef.getName()] === undefined) {
          throw new Error(`Invalid Stage Transition ${currStage._meta.expr.getName()} -> ${exprDef.getName()}\n${currStage._meta.expr.allRoutes()}`)
        }
        currStage = currStage[exprDef.getName()];
      }
    }
    this.getNotice = getNotice;

    function getName () {return name;};
    this.getName = getName;
    this.onClose = function (start, end) {
      return function (str, start, end) {
        if (notify) notify(this);
        options.onClose(str, start, end);
      }
    }

    function setMeta(targetNodes, attr, value) {
      return function () {
        for (let lIndex = 0; lIndex < targetNodes.length; lIndex += 1) {
          targetNodes[lIndex]._meta[attr] = value;
        }
      }
    }

    function then (targetNodes) {
      return function () {
        const createdNodes = [];
        for (let lIndex = 0; lIndex < targetNodes.length; lIndex += 1) {
          const targetNode = targetNodes[lIndex];
          for (let index = 0; index < arguments.length; index += 1) {
            const exprDef = arguments[index];
            if (!exprDef instanceof ExprDef) {
              throw new Error(`Argument is not an instanceof ExprDef`);
            }
            const nextExpr = exprDef.clone(getNotice);
            if (targetNode[nextExpr.getName()] === undefined) {
              targetNode[nextExpr.getName()] = {
                _meta: {
                  expr: nextExpr
                }
              };
            }
            createdNodes.push(targetNode[nextExpr.getName()]);
          }
        }
        return {
          then: then(createdNodes),
          repeat: setMeta(createdNodes, 'repeat', true),
          end: setMeta(createdNodes, 'end', true),
        };
      }
    }

    this.if = function () {return then([stages]).apply(this, arguments);}

    function isEscaped(str, index) {
      if (options.escape === undefined) {
        return false;
      }
      let count = -1;
      let firstIndex, secondIndex;
      do {
        count += 1;
        firstIndex = index - (options.escape.length * (count + 1));
        secondIndex = options.escape.length;
      } while (str.substr(firstIndex, secondIndex) === options.escape);
      return count % 2 == 0;
    }

    function foundCall(onFind, sub) {
      if ((typeof notify) === 'function') {
        notify(this);
      }
      if ((typeof onFind) === 'function') {
        return onFind(sub);
      } else {
        return sub;
      }
    }

    this.find = function (str, index) {
      let startedThisCall = false;
      let needle = options.closing;
      let starting = false;
      if (start === undefined) {
        needle = options.opening;
        starting = true;
      }
      const sub = str.substr(index);
      let needleLength;
      if (needle instanceof RegExp) {
        const match = sub.match(needle);
        if (match && match.index === 0) {
          needleLength = match[0].length;
        }
      } else if ((typeof needle) === 'string') {
        if (sub.indexOf(needle) === 0 && !isEscaped(str, index))
          needleLength = needle.length;
      } else if (needle === undefined || needle === null) {
        needleLength = 0;
      } else {
        throw new Error('Opening or closing type not supported. Needs to be a RegExp or a string');
      }
      needleLength += options.tailOffset ? options.tailOffset : 0;
      let changes = '';
      if (start === undefined && starting && (needleLength || needle === null)) {
        string = str;
        start = index;
        startedThisCall = true;
        if (needle === null) {
          if ((typeof notify) === 'function') {
            notify(this);
          }          return {index, changes}
        } else {
          changes += foundCall.apply(this, [options.onOpen, str.substr(start, needleLength)]);
        }
      }
      if ((!startedThisCall && needleLength) ||
            (startedThisCall && options.closing === undefined) ||
            (!startedThisCall && options.closing === null)) {
        if (str !== string) {
          throw new Error ('Trying to apply an expression to two different strings.');
        }
        end = index + needleLength;
        if (options.closing === null) {
          return {index, changes}
        }
        if (!startedThisCall) {
          changes += foundCall.apply(this, [options.onClose, str.substr(end - needleLength, needleLength)]);
        }
        return { index: end, changes };
      }

      return start !== undefined ? { index: start + needleLength, changes } :
                      { index: -1, changes };
    }

    this.clone = function (notify) {
      return new ExprDef(name, options, notify, stages, alwaysPossible);
    };
    this.name = this.getName();
    this.canEnd = function () {return (currStage._meta && currStage._meta.end) || options.closing === null};
    this.endDefined = function () {return options.closing !== undefined && options.closing !== null};
    this.location = function () {return {start, end, length: end - start}};
    this.closed = function () {return end !== undefined;}
    this.open = function () {return start !== undefined;}
    this.next =  function () {
      const expressions = [];
      if (currStage._meta && currStage._meta.repeat) {
        currStage = stages;
      }
      Object.values(currStage).map(
        function (val) {if (val._meta) expressions.push(val._meta.expr);}
      )
      return alwaysPossible.concat(expressions);
    };
  }
}

function parse(exprDef, str) {
  exprDef = exprDef.clone();
  let index = 0;
  let modified = '';
  const breakDown = [];
  const stack = [];

  function topOfStack() {
    return stack[stack.length - 1];
  }

  function closeCheck(exprDef) {
    if (exprDef && (exprDef.canEnd() || exprDef.endDefined())) {
      let result = exprDef.find(str, index);
      if (result.index) {
        modified += result.changes;
        return result.index;
      }
    }
  }

  function checkArray(exprDef, array) {
    if (exprDef.endDefined()) {
      let nextIndex = closeCheck(exprDef);
      if (nextIndex) return nextIndex;
    }
    for (let aIndex = 0; aIndex < array.length; aIndex += 1) {
      const childExprDef = array[aIndex].clone(exprDef.getNotice);
      const result = childExprDef.find(str, index);
      if (result.index !== -1) {
        modified += result.changes;
        if (childExprDef.closed()) {
          breakDown.push(childExprDef);
        } else {
          stack.push(childExprDef);
        }
        return result.index;
      }
    }
    if (exprDef.canEnd()) {
      nextIndex = closeCheck(exprDef);
      if (nextIndex) return nextIndex;
    }
    throw new Error(`Invalid string @ index ${index}\n'${str.substr(0, index)}' ??? '${str.substr(index)}'`);
  }

  function open(exprDef, index) {
    const always = exprDef.getAlways();
    while (!exprDef.open()) {
      let result = exprDef.find(str, index);
      modified += result.changes;
      if(result.index === -1) {
        let newIndex = checkArray(exprDef, always);
        index = newIndex;
      } else {
        if (exprDef.closed()) {
          breakDown.push(exprDef);
        } else {
          stack.push(exprDef);
        }
        index = result.index;
      }
    }
    return index;
  }

  let loopCount = 0;
  index = open(exprDef, index);
  progress = [-3, -2, -1];
  while (topOfStack() !== undefined) {
    const tos = topOfStack();
    if (progress[0] === index) {
      throw new Error(`ExprDef stopped making progress`);
    }
    let stackIds = '';
    let options = '';
    stack.map(function (value) {stackIds+=value.getName() + ','});
    tos.next().map(function (value) {options+=value.getName() + ','})
    index = checkArray(tos, tos.next());
    if (tos.closed()) {
      stack.pop();
    }
    loopCount++;
  }
  // if (index < str.length) {
  //   throw new Error("String not fully read");
  // }
  return modified;
}


ExprDef.parse = parse;
try {
  exports.ExprDef = ExprDef;
} catch (e) {}

class $t {
	constructor(template, id, selector) {
    const afterRenderEvent = new CustomEvent('afterRender');
    const beforeRenderEvent = new CustomEvent('beforeRender');

		function varReg(prefix, suffix) {
		  const vReg = '([a-zA-Z_\\$][a-zA-Z0-9_\\$]*)';
		  prefix = prefix ? prefix : '';
		  suffix = suffix ? suffix : '';
		  return new RegExp(`${prefix}${vReg}${suffix}`)
		};

		function replace(needleRegEx, replaceStr, exceptions) {
		  return function (sub) {
		    if (!exceptions || exceptions.indexOf(sub) === -1) {
		      return sub.replace(needleRegEx, replaceStr)
		    } else {
		      return sub;
		    }
		  }
		}

		const signProps = {opening: /([-+\!])/};
		const relationalProps = {opening: /((\<|\>|\<\=|\>\=|\|\||\||&&|&))/};
		const ternaryProps = {opening: /\?/};
		const keyWordProps = {opening: /(new|null|undefined|NaN|true|false)[^a-z^A-Z]/, tailOffset: -1};
		const ignoreProps = {opening: /new \$t\('.*?'\).render\(get\('scope'\), '(.*?)', get\)/};
		const commaProps = {opening: /,/};
		const colonProps = {opening: /:/};
		const multiplierProps = {opening: /(===|[-+=*\/](=|))/};
		const stringProps = {opening: /('|"|`)(\1|.*?([^\\]((\\\\)*?|[^\\])(\1)))/};
		const spaceProps = {opening: /\s{1}/};
		const numberProps = {opening: /[0-9]*((\.)[0-9]*|)/};
		const objectProps = {opening: '{', closing: '}'};
		const objectLabelProps = {opening: varReg(null, '\\:')};
		const groupProps = {opening: /\(/, closing: /\)/};
		const expressionProps = {opening: null, closing: null};
		const attrProps = {opening: varReg('(\\.', '){1,}')};

		// const funcProps = {
		//   opening: varReg(null, '\\('),
		//   onOpen: replace(varReg(null, '\\('), 'get("$1")('),
		//   closing: /\)/
		// };
		const arrayProps = {
		  opening: varReg(null, '\\['),
		  onOpen: replace(varReg(null, '\\['), 'get("$1")['),
		  closing: /\]/
		};
		const variableProps = {
		  opening: varReg(),
		  onOpen: replace(varReg(), 'get("$1")'),
		};
		const objectShorthandProps = {
		  opening: varReg(),
		  onOpen: replace(varReg(), '$1: get("$1")'),
		};


		const expression = new ExprDef('expression', expressionProps);
		const ternary = new ExprDef('ternary', ternaryProps);
		const relational = new ExprDef('relational', relationalProps);
		const comma = new ExprDef('comma', commaProps);
		const colon = new ExprDef('colon', colonProps);
		const attr = new ExprDef('attr', attrProps);
		// const func = new ExprDef('func', funcProps);
		const string = new ExprDef('string', stringProps);
		const space = new ExprDef('space', spaceProps);
		const keyWord = new ExprDef('keyWord', keyWordProps);
		const group = new ExprDef('group', groupProps);
		const object = new ExprDef('object', objectProps);
		const array = new ExprDef('array', arrayProps);
		const number = new ExprDef('number', numberProps);
		const multiplier = new ExprDef('multiplier', multiplierProps);
		const sign = new ExprDef('sign', signProps);
		const ignore = new ExprDef('ignore', ignoreProps);
		const variable = new ExprDef('variable', variableProps);
		const objectLabel = new ExprDef('objectLabel', objectLabelProps);
		const objectShorthand = new ExprDef('objectShorthand', objectShorthandProps);

		expression.always(space, ignore, keyWord);
		expression.if(string, number, group, array, variable)
		      .then(multiplier, sign, relational, group)
		      .repeat();
		expression.if(string, group, array, variable)
					.then(attr)
		      .then(multiplier, sign, relational, expression)
					.repeat();
		expression.if(string, group, array, variable)
					.then(attr)
					.end();
		expression.if(sign)
		      .then(expression)
		      .then(multiplier, sign, relational, group)
		      .repeat();
		expression.if(string, number, group, array, variable)
		      .then(ternary)
		      .then(expression)
		      .then(colon)
		      .then(expression)
		      .end();
		expression.if(ternary)
		      .then(expression)
		      .then(colon)
		      .then(expression)
		      .end();
		expression.if(object, string, number, group, array, variable)
		      .end();
		expression.if(sign)
		      .then(number)
		      .end();

		object.always(space, ignore, keyWord);
		object.if(objectLabel).then(expression).then(comma).repeat();
		object.if(objectShorthand).then(comma).repeat();
		object.if(objectLabel).then(expression).end();
		object.if(objectShorthand).end();

		group.always(space, ignore, keyWord);
		group.if(expression).then(comma).repeat();
		group.if(expression).end();

		array.always(space, ignore, keyWord);
		array.if(expression).then(comma).repeat();
		array.if(expression).end();

		function getter(scope, parentScope) {
			parentScope = parentScope || function () {return undefined};
			function get(name) {
				if (name === 'scope') return scope;
				const split = new String(name).split('.');
				let currObj = scope;
				for (let index = 0; currObj != undefined && index < split.length; index += 1) {
					currObj = currObj[split[index]];
				}
				if (currObj !== undefined) return currObj;
				const parentScopeVal = parentScope(name);
				if (parentScopeVal !== undefined) return parentScopeVal;
        else {
          const globalVal = $t.global(name);
          return globalVal === undefined ? '' : globalVal;
        }
			}
			return get;
		}

		function defaultArray(elemName, get) {
			let resp = '';
			for (let index = 0; index < get('scope').length; index += 1) {
				if (elemName) {
					const obj = {};
					obj[elemName] = get(index);
					resp += new $t(template).render(obj, undefined, get);
				} else {
					resp += new $t(template).render(get(index), undefined, get);
				}
			}
			return `${resp}`;
		}

		function arrayExp(itExp, get) {
			const match = itExp.match($t.arrayItExpReg);
			const varName = match[1];
			const array = get(match[2]);
			let built = '';
			for (let index = 0; index < array.length; index += 1) {
				const obj = {};
				obj[varName] = array[index];
				obj.$index = index;
				built += new $t(template).render(obj, undefined, get);
			}
			return built;
		}

		function itOverObject(itExp, get) {
			const match = itExp.match($t.objItExpReg);
			const keyName = match[1];
			const valueName = match[2];
			const obj = get(match[3]);
			const keys = Object.keys(obj);
			let built = '';
			for (let index = 0; index < keys.length; index += 1) {
				const key = keys[index];
				const childScope = {};
				childScope[keyName] = key;
				childScope[valueName] = obj[key];
				childScope.$index = index;
				built += new $t(template).render(childScope, undefined, get);
			}
      return built;
		}

		function rangeExp(itExp, get) {
			const match = itExp.match($t.rangeItExpReg);
			const elemName = match[1];
			let startIndex = (typeof match[2]) === 'number' ||
						match[2].match(/^[0-9]*$/) ?
						match[2] : get(`${match[2]}`);
			let endIndex = (typeof match[3]) === 'number' ||
						match[3].match(/^[0-9]*$/) ?
						match[3] : get(`${match[3]}`);
			if (((typeof startIndex) !== 'string' &&
							(typeof	startIndex) !== 'number') ||
								(typeof endIndex) !== 'string' &&
								(typeof endIndex) !== 'number') {
									throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
			}

			try {
				startIndex = Number.parseInt(startIndex);
			} catch (e) {
				throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
			}
			try {
				endIndex = Number.parseInt(endIndex);
			} catch (e) {
				throw Error(`Invalid range '${itExp}' evaluates to '${startIndex}..${endIndex}'`);
			}

			let index = startIndex;
			let built = '';
			while (true) {
				let increment = 1;
				if (startIndex > endIndex) {
					if (index <= endIndex) {
						break;
					}
					increment = -1;
				} else if (index >= endIndex) {
					break;
				}
				const obj = {$index: index};
				obj[elemName] = index;
				built += new $t(template).render(obj, undefined, get);
				index += increment;
			}
			return built;
		}

		function evaluate(get) {
			if ($t.functions[id]) {
				try {
					return $t.functions[id](get);
				} catch (e) {
				  console.error(e);
				}
			} else {
				return eval($t.templates[id])
			}
		}

		function type(scope, itExp) {
			if ((typeof itExp) === 'string' && itExp.match($t.rangeAttemptExpReg)) {
				if (itExp.match($t.rangeItExpReg)) {
					return 'rangeExp'
				}
				return 'rangeExpFormatError';
			} else if (Array.isArray(scope)) {
				if (itExp === undefined) {
					return 'defaultArray';
				} else if (itExp.match($t.nameScopeExpReg)) {
					return 'nameArrayExp';
				} else {
					return 'invalidArray';
				}
			} else if ((typeof scope) === 'object') {
				if (itExp === undefined) {
					return 'defaultObject';
				} else if (itExp.match($t.objItExpReg)){
					return 'itOverObject';
				} else if (itExp.match($t.arrayItExpReg)){
					return 'arrayExp';
				} else {
					return 'invalidObject';
				}
			} else {
				return 'defaultObject';
			}
		}

		function render(scope, itExp, parentScope) {
      if (scope === undefined) return '';
			let rendered = '';
			const get = getter(scope, parentScope);
			switch (type(scope, itExp)) {
				case 'rangeExp':
					rendered = rangeExp(itExp, get);
					break;
				case 'rangeExpFormatError':
					throw new Error(`Invalid range itteration expression "${itExp}"`);
				case 'defaultArray':
					rendered = defaultArray(itExp, get);
					break;
				case 'nameArrayExp':
					rendered = defaultArray(itExp, get);
					break;
				case 'arrayExp':
					rendered = arrayExp(itExp, get);
					break;
				case 'invalidArray':
					throw new Error(`Invalid iterative expression for an array "${itExp}"`);
				case 'defaultObject':
					rendered = evaluate(get);
					break;
				case 'itOverObject':
					rendered = itOverObject(itExp, get);
					break;
				case 'invalidObject':
					throw new Error(`Invalid iterative expression for an object "${itExp}"`);
				default:
					throw new Error(`Programming error defined type '${type()}' not implmented in switch`);
			}

      if (selector) {
        const elem = document.querySelector(selector);
        if (elem !== null) {
          beforeRenderEvent.trigger();
          elem.innerHTML = rendered;
          afterRenderEvent.trigger();
        }
      }
			return rendered;
		}


//---------------------  Compile Functions ---------------//

		function stringHash(string) {
			let hashString = string;
			let hash = 0;
			for (let i = 0; i < hashString.length; i += 1) {
				const character = hashString.charCodeAt(i);
				hash = ((hash << 5) - hash) + character;
				hash &= hash; // Convert to 32bit integer
			}
			return hash;
		}

		function isolateBlocks(template) {
			let inBlock = false;
			let openBracketCount = 0;
			let block = '';
			let blocks = [];
			let str = template;
			for (let index = 0; index < str.length; index += 1) {
				if (inBlock) {
					block += str[index];
				}
				if (!inBlock && index > 0 &&
					str[index] == '{' && str[index - 1] == '{') {
					inBlock = true;
				} else if (inBlock && str[index] == '{') {
					openBracketCount++;
				} else if (openBracketCount > 0 && str[index] == '}') {
					openBracketCount--;
				} else if (str[index + 1] == '}' && str[index] == '}' ) {
					inBlock = false;
					blocks.push(`${block.substr(0, block.length - 1)}`);
					block = '';
				}
			}
			return blocks;
		}

		function compile() {
			const blocks = isolateBlocks(template);
			let str = template;
			for (let index = 0; index < blocks.length; index += 1) {
				const block = blocks[index];
				const parced = ExprDef.parse(expression, block);
				str = str.replace(`{{${block}}}`, `\` + (${parced}) + \``);
			}
			return `\`${str}\``;
		}

		const repeatReg = /<([a-zA-Z-]*):t( ([^>]* |))repeat=("|')([^>^\4]*?)\4([^>]*>((?!(<\1:t[^>]*>|<\/\1:t>)).)*<\/)\1:t>/;
		function formatRepeat(string) {
			// tagname:1 prefix:2 quote:4 exlpression:5 suffix:6
			// string = string.replace(/<([^\s^:^-^>]*)/g, '<$1-ce');
			let match;
			while (match = string.match(repeatReg)) {
				let tagContents = match[2] + match[6];
				let template = `<${match[1]}${tagContents}${match[1]}>`.replace(/\\'/g, '\\\\\\\'').replace(/([^\\])'/g, '$1\\\'').replace(/''/g, '\'\\\'');
				let templateName = tagContents.replace(/.*\$t-id=('|")([\.a-zA-Z-_\/]*?)(\1).*/, '$2');
        let scope = tagContents.replace(/.*\$t-scope=('|")([a-zA-Z-_\/]*?)(\1).*/, '$2') || 'scope';
				template = templateName !== tagContents ? templateName : template;
        console.log('\n\n\ntn: ', tempName, '-', template)
				string = string.replace(match[0], `{{new $t('${template}').render(get('${scope}'), '${match[5]}', get)}}`);
				// console.log('\n\n\nformrepeat: ', string, '\n\n\n')
				eval(`new $t(\`${template}\`)`);
			}
			return string;
		}

		if (id) {
			$t.templates[id] = undefined;
			$t.functions[id] = undefined;
		}

		template = template.replace(/\s{1,}/g, ' ');
		id = $t.functions[template] ? template : id || stringHash(template);
		if (!$t.functions[id]) {
			if (!$t.templates[id]) {
				template = template.replace(/\s{2,}|\n/g, ' ');
				template = formatRepeat(template);
				$t.templates[id] = compile();
			}
		}
		this.compiled = function () { return $t.templates[id];}
		this.render = render;
    this.afterRender = (func) => afterRenderEvent.on(func);
    this.beforeRender = (func) => beforeRenderEvent.on(func);
		this.type = type;
		this.isolateBlocks = isolateBlocks;
	}
}

$t.templates = {};//{"-1554135584": '<h1>{{greeting}}</h1>'};
$t.functions = {};
$t.isTemplate = (id) => $t.functions[id] !== undefined;
$t.arrayItExpReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*in\s*([a-zA-Z][a-z0-9A-Z\.]*)\s*$/;
$t.objItExpReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*,\s*([a-zA-Z][a-z0-9A-Z]*)\s*in\s*([a-zA-Z][a-z\.0-9A-Z]*)\s*$/;
$t.rangeAttemptExpReg = /^\s*([a-z0-9A-Z]*)\s*in\s*(.*\.\..*)\s*$/;
$t.rangeItExpReg = /^\s*([a-z0-9A-Z]*)\s*in\s*([a-z0-9A-Z]*)\.\.([a-z0-9A-Z]*)\s*$/;
$t.nameScopeExpReg = /^\s*([a-zA-Z][a-z0-9A-Z]*)\s*$/;
$t.quoteStr = function (str) {
		str = str.replace(/\\`/g, '\\\\\\`')
		str = str.replace(/([^\\])`/g, '$1\\\`')
		return `\`${str.replace(/``/g, '`\\`')}\``;
	}
$t.formatName = function (string) {
    function toCamel(whoCares, one, two) {return `${one}${two.toUpperCase()}`;}
    return string.replace(/([a-z])[^a-z^A-Z]{1,}([a-zA-Z])/g, toCamel);
}
$t.dumpTemplates = function () {
	let templateFunctions = '';
	let tempNames = Object.keys($t.templates);
	for (let index = 0; index < tempNames.length; index += 1) {
		const tempName = tempNames[index];
		if (tempName) {
			const template = $t.templates[tempName];
			templateFunctions += `\n$t.functions['${tempName}'] = function (get) {\n\treturn ${template}\n}`;
		}
	}
	return templateFunctions;
}

function createGlobalsInterface() {
  const GLOBALS = {};
  const isMotifiable = () => GLOBALS[name] === undefined ||
        GLOBALS[name].imutable !== 'true';
  $t.global = function (name, value, imutable) {
    if (value === undefined) return GLOBALS[name] ? GLOBALS[name].value : undefined;
    if (isMotifiable()) GLOBALS[name] = {value, imutable};
  }
  $t.rmGlobal = function(name) {
    if (isMotifiable()) delete GLOBALS[name];
  }
}
createGlobalsInterface();

try{
	exports.$t = $t;
} catch (e) {}



$t.functions['202297006'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + ` ` + (get("$index") === get("activeIndex") ? ' active' : '') + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['443122713'] = function (get) {
	return `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").constructorId === get("section").name ? 'selected' : '') + `> ` + (get("clean")(get("section").name)) + ` </option>`
}
$t.functions['600085932'] = function (get) {
	return `<option value='` + (get("item")) + `' ` + (get("selected")(get("item")) ? 'selected' : '') + `> ` + (get("item")) + ` </option>`
}
$t.functions['632351395'] = function (get) {
	return `<div > <input class='expand-list-sidebar-input' list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </div>`
}
$t.functions['633282157'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['990870856'] = function (get) {
	return `<div class='inline' > <h3>` + (get("assem").objId) + `</h3> <div> ` + (get("getFeatureDisplay")(get("assem"))) + ` </div> </div>`
}
$t.functions['1927703609'] = function (get) {
	return `<div > ` + (get("recurse")(get("key"), get("group"))) + ` </div>`
}
$t.functions['cabinet/body'] = function (get) {
	return `<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> </div> <div class='property-id-container center inline-flex'>` + (get("selectHtml")) + `</div> <div class='right'> <select class="show-right-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> <label>Show Right</label> </div> </div> <br> <div class='center'> <button class='save-cabinet-btn' index='` + (get("$index")) + `'>Save</button> </div> ` + (new $t('<div  class=\'divison-section-cnt\'> {{OpenSectionDisplay.html(opening)}} </div>').render(get('scope'), 'opening in cabinet.openings', get)) + ` </div> `
}
$t.functions['-970877277'] = function (get) {
	return `<option >` + (get("showType").name) + `</option>`
}
$t.functions['-1702305177'] = function (get) {
	return `<div class='divison-section-cnt'> ` + (get("OpenSectionDisplay").html(get("opening"))) + ` </div>`
}
$t.functions['cabinet/head'] = function (get) {
	return `<div class='cabinet-header'> <input class='cabinet-id-input' prop-update='` + (get("$index")) + `.name' index='` + (get("$index")) + `' room-id='` + (get("room").id) + `' value='` + (get("cabinet").name || get("$index")) + `'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.width' room-id='` + (get("room").id) + `' value='` + (get("cabinet").width()) + `'> <label>H:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.length' room-id='` + (get("room").id) + `' value='` + (get("cabinet").length()) + `'> <label>D:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.thickness' room-id='` + (get("room").id) + `' value='` + (get("cabinet").thickness()) + `'> </div> </div> `
}
$t.functions['display-manager'] = function (get) {
	return `<div class='display-manager' id='` + (get("id")) + `'> ` + (new $t('<div  class=\'display-manager-item\'> <input class=\'display-manager-input{{$index === 0 ? " active" : ""}}\' type=\'button\' display-id=\'{{item.id}}\' value=\'{{item.name}}\'/> </div>').render(get('scope'), 'item in list', get)) + ` </div> `
}
$t.functions['-1519826343'] = function (get) {
	return `<div class='display-manager-item'> <input class='display-manager-input` + (get("$index") === 0 ? " active" : "") + `' type='button' display-id='` + (get("item").id) + `' value='` + (get("item").name) + `'/> </div>`
}
$t.functions['divide/body'] = function (get) {
	return `<h2>` + (get("list").activeIndex()) + `</h2> val: ` + (get("list").value()('selected')) + ` `
}
$t.functions['divide/head'] = function (get) {
	return `<div> <select value='` + (get("opening").name) + `' class='open-divider-select` + (get("sections").length === 0 ? ' hidden' : '') + `'> ` + (new $t('<option  value=\'{{section.prototype.constructor.name}}\' {{opening.constructorId === section.name ? \'selected\' : \'\'}}> {{clean(section.name)}} </option>').render(get('scope'), 'section in sections', get)) + ` </select> <div class='open-divider-select` + (get("sections").length === 0 ? '' : ' hidden') + `'> D </div> </div> `
}
$t.functions['divider-controls'] = function (get) {
	return `<div> <label>Dividers:</label> <input class='division-pattern-input' type='text' name='pattern' opening-id='` + (get("opening").uniqueId) + `' value='` + (get("opening").pattern().str) + `'> <span class="open-orientation-radio-cnt"> <label for='open-orientation-horiz-` + (get("opening").uniqueId) + `'>Horizontal:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='horizontal' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-horiz-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? '' : 'checked') + `> <label for='open-orientation-vert-` + (get("opening").uniqueId) + `'>Vertical:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='vertical' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-vert-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? 'checked' : '') + `> </span> <div class='open-pattern-input-cnt' opening-id='` + (get("opening").uniqueId) + `' ` + (get("opening").pattern().equal ? 'hidden' : '') + `> ` + (get("patternInputHtml")) + ` </div> </div> `
}
$t.functions['expandable/list'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> <div class="expand-body {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> </div> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> `
}
$t.functions['-1921787246'] = function (get) {
	return `<option value="` + (get("option")) + `" ></option>`
}
$t.functions['-1756076485'] = function (get) {
	return `<span > <input list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </span>`
}
$t.functions['expandable/pill'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` </div> <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <br> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> <div class="expand-body ` + (get("type")) + `"></div> </div> `
}
$t.functions['-520175802'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['expandable/sidebar'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}} {{$index === activeIndex ? \' active\' : \'\'}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<div > <input class=\'expand-list-sidebar-input\' list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </div>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['features'] = function (get) {
	return `<div class='tab'> ` + (new $t('<div > <label>{{feature.name}}</label> <input type=\'checkbox\' name=\'{{id + \'-checkbox\'}}\' {{feature.isCheckbox() ? \'\': \'hidden\'}}> <input type=\'text\' name=\'{{id + \'-input\'}}\' {{feature.showInput() ? \'\' : \'hidden\'}}> <input class=\'feature-radio\' type=\'radio\' name=\'{{id}}\' value=\'{{feature.id}}\' {{!feature.isRadio() ? "hidden disabled" : ""}}> <div {{!feature.isRadio() ? \'\' : \'hidden\'}}> <input type=\'text\' placeholder="Unique Notes" {{!feature.isRadio() ? "hidden disabled" : ""}}> {{new $t(\'features\').render({features: get(\'feature.features\'), id: get(\'id\') + \'.\' + get(\'feature.id\')})}} </div> </div>').render(get('scope'), 'feature in features', get)) + ` </div> `
}
$t.functions['-666497277'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").isCheckbox() ? '': 'hidden') + `> <input type='text' name='` + (get("id") + '-input') + `' ` + (get("feature").showInput() ? '' : 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> <div ` + (!get("feature").isRadio() ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> ` + (new $t('features').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
}
$t.functions['input/decision/decision'] = function (get) {
	return ` <div> <span id='` + (get("id")) + `' class='inline-flex'> ` + (new $t('<span  class=\'pad {{class}}\' node-id=\'{{_nodeId}}\' index=\'{{$index}}\'> {{input.html()}} </span>').render(get('scope'), 'input in inputArray', get)) + ` </span> ` + (new $t('<div  id=\'{{input.childCntId}}\'> {{childHtml($index)}} </div>').render(get('scope'), 'input in inputArray', get)) + ` </div> `
}
$t.functions['-2022747631'] = function (get) {
	return `<span class='pad ` + (get("class")) + `' node-id='` + (get("_nodeId")) + `' index='` + (get("$index")) + `'> ` + (get("input").html()) + ` </span>`
}
$t.functions['-1362189101'] = function (get) {
	return `<div id='` + (get("input").childCntId) + `'> ` + (get("childHtml")(get("$index"))) + ` </div>`
}
$t.functions['input/decision/decisionTree'] = function (get) {
	return `<div class='` + (get("class")) + `' tree-id='` + (get("treeId")) + `'> ` + (get("payload").html()) + ` <button class='` + (get("buttonClass")) + `' tree-id='` + (get("treeId")) + `' ` + (get("formFilled")() ? '' : 'disabled') + `> ` + (get("name")) + ` </button> </div> `
}
$t.functions['input/input'] = function (get) {
	return `<div class='input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='` + (get("class")) + `' list='input-list-` + (get("id")) + `' id='` + (get("id")) + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `' ` + (get("attrString")()) + `> <datalist id="input-list-` + (get("id")) + `"> ` + (new $t('<option value="{{item}}" ></option>').render(get('scope'), 'item in list', get)) + ` </datalist> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `
}
$t.functions['-994603408'] = function (get) {
	return `<option value="` + (get("item")) + `" ></option>`
}
$t.functions['input/measurement'] = function (get) {
	return `<div class='fit input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='measurement-input ` + (get("class")) + `' id='` + (get("id")) + `' value='` + (get("value")() ? get("value")() : "") + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `'> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `
}
$t.functions['input/select'] = function (get) {
	return `<div class='input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <select class='` + (get("class")) + `' id='` + (get("id")) + `' name='` + (get("name")) + `' value='` + (get("value")()) + `'> ` + (new $t('<option  value=\'{{item}}\' {{selected(item) ? \'selected\' : \'\'}}> {{item}} </option>').render(get('scope'), 'item in list', get)) + ` </select> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `
}
$t.functions['login/confirmation-message'] = function (get) {
	return `<h3> Check your email for confirmation. </h3> <button id='resend-activation'>Resend</button> `
}
$t.functions['login/create-account'] = function (get) {
	return `<h3>Create An Account</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='register'>Register</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='LOGIN'>Login</a> `
}
$t.functions['login/login'] = function (get) {
	return `<h3>Login</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='login-btn'>Login</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `
}
$t.functions['login/reset-password'] = function (get) {
	return `<h3>Reset Password</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='reset-password'>Reset</button> <br><br> <a href='#' user-state='LOGIN'>Login</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `
}
$t.functions['managers/abstract-manager'] = function (get) {
	return `<div> <div class="center"> <h2 id='` + (get("headerId")) + `'> ` + (get("header")) + ` <button class='manager-save-btn' id='` + (get("saveBtnId")) + `'>Save</button> </h2> </div> <div id="` + (get("bodyId")) + `"></div> </div> `
}
$t.functions['managers/cost/body'] = function (get) {
	return `<div class='` + (get("instance").CostManager.cntClass) + `' > ` + (get("instance").CostManager.costTypeHtml(get("instance").cost, get("instance"))) + ` </div> `
}
$t.functions['managers/cost/cost-body'] = function (get) {
	return `<div> ` + (get("CostManager").costTypeHtml(get("cost"), get("scope"))) + ` </div> `
}
$t.functions['managers/cost/cost-head'] = function (get) {
	return `<b> ` + (get("id")()) + ` - ` + (get("constructor").constructorId(get("constructor").name)) + ` </b> `
}
$t.functions['managers/cost/header'] = function (get) {
	return `<b part-id='` + (get("instance").partId) + `'>` + (get("instance").partId) + `</b> `
}
$t.functions['managers/property/body'] = function (get) {
	return `<div> No Need </div> `
}
$t.functions['managers/property/header'] = function (get) {
	return `<div> <b>` + (get("instance").name) + ` (` + (get("instance").constructor.code) + `) - ` + (get("instance").value) + `</b> </div> `
}
$t.functions['managers/template/body'] = function (get) {
	return `<div> <span> <input value='` + (get("instance").length()) + `'> </span> <span> <label>X</label> <input value='` + (get("instance").width()) + `'> </span> <span> <label>X</label> <input value='` + (get("instance").depth()) + `'> </span> <label>Cost</label> <input value='` + (get("instance").cost()) + `'> <br> <label>Per ` + (get("instance").unitCost().name) + ` = ` + (get("instance").unitCost().value) + ` </div> `
}
$t.functions['managers/template/header'] = function (get) {
	return `<div> <b>` + (get("instance").id()) + ` - ` + (get("instance").constructor.name) + ` (` + (get("instance").method()) + `)</b> </div> `
}
$t.functions['model-controller'] = function (get) {
	return `<div> <div class='model-selector'> <div ` + (get("group").level > 0 ? 'hidden' : '') + `> <div class='` + (get("tdm").isTarget("prefix", get("group").prefix) ? "active " : "") + ` ` + (get("label") ? "prefix-switch model-label" : "") + `' ` + (!get("label") ? 'hidden' : '') + `> <label type='prefix'>` + (get("label")) + `</label> <input type='checkbox' class='prefix-checkbox' prefix='` + (get("group").prefix) + `' ` + (!get("tdm").hidePrefix(get("label")) ? 'checked' : '') + `> </div> <div class='` + (get("label") ? "prefix-body indent" : "") + `' ` + (get("label") ? 'hidden' : '') + `> ` + (new $t('<div class=\'model-label{{tdm.isTarget("part-name", partName) ? " active" : ""}}\' > <label type=\'part-name\'>{{partName}}</label> <input type=\'checkbox\' class=\'part-name-checkbox\' part-name=\'{{partName}}\' {{!tdm.hidePartName(partName) ? \'checked\' : \'\'}}> {{new $t(\'<div class=\\\'{{tdm.isTarget("part-code", part.partCode) ? "active " : ""}} model-label indent\\\'  {{partList.length > 1 ? "" : "hidden"}}> <label type=\\\'part-code\\\'>{{part.partCode}}</label> <input type=\\\'checkbox\\\' class=\\\'part-code-checkbox\\\' part-code=\\\'{{part.partCode}}\\\' {{!tdm.hidePartCode(part.partCode) ? \\\'checked\\\' : \\\'\\\'}}> </div>\').render(get(\'scope\'), \'part in partList\', get)}} </div>').render(get('scope'), 'partName, partList in group.parts', get)) + ` ` + (new $t('model-controller').render(get('scope'), 'label, group in group.groups', get)) + ` </div> </div> </div> </div> `
}
$t.functions['-1397238508'] = function (get) {
	return `<div class='` + (get("tdm").isTarget("part-code", get("part").partCode) ? "active " : "") + ` model-label indent' ` + (get("partList").length > 1 ? "" : "hidden") + `> <label type='part-code'>` + (get("part").partCode) + `</label> <input type='checkbox' class='part-code-checkbox' part-code='` + (get("part").partCode) + `' ` + (!get("tdm").hidePartCode(get("part").partCode) ? 'checked' : '') + `> </div>`
}
$t.functions['-443173449'] = function (get) {
	return `<div class='model-label` + (get("tdm").isTarget("part-name", get("partName")) ? " active" : "") + `' > <label type='part-name'>` + (get("partName")) + `</label> <input type='checkbox' class='part-name-checkbox' part-name='` + (get("partName")) + `' ` + (!get("tdm").hidePartName(get("partName")) ? 'checked' : '') + `> ` + (new $t('<div class=\'{{tdm.isTarget("part-code", part.partCode) ? "active " : ""}} model-label indent\' {{partList.length > 1 ? "" : "hidden"}}> <label type=\'part-code\'>{{part.partCode}}</label> <input type=\'checkbox\' class=\'part-code-checkbox\' part-code=\'{{part.partCode}}\' {{!tdm.hidePartCode(part.partCode) ? \'checked\' : \'\'}}> </div>').render(get('scope'), 'part in partList', get)) + ` </div>`
}
$t.functions['-424251200'] = function (get) {
	return `model-controller`
}
$t.functions['opening'] = function (get) {
	return `<div class='opening-cnt' opening-id='` + (get("opening").uniqueId) + `'> <div class='divider-controls'> </div> </div> <div id='` + (get("openDispId")) + `'> </div> `
}
$t.functions['order/body'] = function (get) {
	return `<div> <b>` + (get("order").name) + `</b> <ul id='order-nav' class='center toggle-display-list'> <li class='toggle-display-item active' display-id='builder-display-` + (get("$index")) + `'>Builder</li> <li class='toggle-display-item' display-id='information-display-` + (get("$index")) + `'>Information</li> </ul> <div id='builder-display-` + (get("$index")) + `'> <b>` + (get("order").name) + `</b> <button class='save-order-btn' index='` + (get("$index")) + `'>Save</button> <div id='room-pills'>RoomPills!</div> </div> <div id='information-display-` + (get("$index")) + `' hidden> <utility-filter id='uf-info-` + (get("$index")) + `' edit='true'> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> </div> </div> `
}
$t.functions['order/builder/body'] = function (get) {
	return `<div> <b>` + (get("order").name) + `</b> <button class='save-order-btn' index='` + (get("$index")) + `'>Save</button> <div id='room-pills'>RoomPills!</div> </div> `
}
$t.functions['order/builder/head'] = function (get) {
	return `<h3 class='margin-zero'> ` + (get("order").name) + ` </h3> `
}
$t.functions['order/head'] = function (get) {
	return `<h3 class='margin-zero'> ` + (get("order").name) + ` </h3> `
}
$t.functions['order/information/body'] = function (get) {
	return `<utility-filter hidden> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> `
}
$t.functions['order/information/head'] = function (get) {
	return `<b>Information</b> `
}
$t.functions['properties/properties'] = function (get) {
	return `<div class='center'> <div class='` + (get("key") ? "property-container close" : "") + `' radio-id='` + (get("radioId")) + `' ` + (get("noChildren")() ? 'hidden' : '') + `> <div class='` + (get("key") ? "expand-header" : "") + `'> ` + (get("key")) + ` </div> <div` + (get("key") ? ' hidden' : '') + `> ` + (new $t('<div > <label>{{property.name()}}</label> <input type="text" name="{{key}}" value="{{property.value()}}"> </div>').render(get('scope'), 'property in properties', get)) + ` ` + (new $t('<div > {{recurse(key, group)}} </div>').render(get('scope'), 'key, group in groups', get)) + ` </div> </div> </div> `
}
$t.functions['-136866915'] = function (get) {
	return `<div > <label>` + (get("property").name()) + `</label> <input type="text" name="` + (get("key")) + `" value="` + (get("property").value()) + `"> </div>`
}
$t.functions['properties/property'] = function (get) {
	return `<label>` + (get("property").name()) + `</label> <input type="text" name="` + (get("key")) + `" value="` + (get("property").value()) + `"> `
}
$t.functions['room/body'] = function (get) {
	return `<div> <select> ` + (new $t('<option >{{type}}</option>').render(get('scope'), 'type in propertyTypes', get)) + ` </select> <div class='cabinet-cnt' room-id='` + (get("room").id) + `'></div> </div> `
}
$t.functions['-1674837651'] = function (get) {
	return `<option >` + (get("type")) + `</option>`
}
$t.functions['room/head'] = function (get) {
	return `<b>` + (get("room").name) + `</b> `
}
$t.functions['sections/divider'] = function (get) {
	return `<h2>Divider: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/door'] = function (get) {
	return `<h2>DoorSection(` + (get("list").activeIndex()) + `):</h2> <br><br> <div> ` + (new $t('<div class=\'inline\' > <h3>{{assem.objId}}</h3> <div> {{getFeatureDisplay(assem)}} </div> </div>').render(get('scope'), 'assem in assemblies', get)) + ` </div> `
}
$t.functions['sections/drawer'] = function (get) {
	return `<h2>Drawer: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/dual-door'] = function (get) {
	return `<h2>Dual Door: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/false-front'] = function (get) {
	return `<h2>False Front: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/open'] = function (get) {
	return `<h2>Open: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/templates/managers/cost/types/select.js'] = function (get) {
	return `<b>Select</b> `
}
$t.functions['./public/html/templates/managers/cost/types/category.js'] = function (get) {
	return `<b>Catagory</b> `
}
$t.functions['managers/cost/types/select'] = function (get) {
	return `<div> <b>Select</b> <div> ` + (get("CostManager").selectInput(get("cost")).html()) + ` </div> <div id='` + (get("parentId")) + `'>` + (get("expandList").html()) + `</div> </div> `
}
$t.functions['managers/cost/types/category'] = function (get) {
	return `<div> <b>Catagory</b> <div id='` + (get("parentId")) + `'>` + (get("expandList").html()) + `</div> </div> `
}
$t.functions['managers/cost/types/conditional'] = function (get) {
	return `<div> <b>Conditional</b> <div id='` + (get("parentId")) + `'>` + (get("expandList").html()) + `</div> </div> `
}
$t.functions['managers/cost/types/labor'] = function (get) {
	return `<div> <b>Labor</b> <span` + (get("cost").length() === undefined ? ' hidden' : '') + `> <input value='` + (get("cost").length()) + `'> </span> <span` + (get("cost").width() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").width()) + `'> </span> <span` + (get("cost").depth() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").depth()) + `'> </span> <br> <div> <label>Cost</label> <input value='` + (get("cost").cost()) + `'> <label>Per ` + (get("cost").unitCost('name')) + ` = ` + (get("cost").unitCost('value')) + `</label> </div> </div> `
}
$t.functions['managers/cost/types/material'] = function (get) {
	return `<div> <b>Material</b> <span` + (get("cost").length() === undefined ? ' hidden' : '') + `> <input value='` + (get("cost").length()) + `'> </span> <span` + (get("cost").width() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").width()) + `'> </span> <span` + (get("cost").depth() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").depth()) + `'> </span> <br> <div> <label>Cost</label> <input value='` + (get("cost").cost()) + `'> <label>Per ` + (get("cost").unitCost('name')) + ` = ` + (get("cost").unitCost('value')) + `</label> </div> </div> `
}


class Endpoints {
  constructor(config, host) {
    const instance = this;

    if ((typeof config) !== 'object') {
      host = config;
      config = Endpoints.defaultConfig;
    }

    host = host || '';
    this.setHost = (newHost) => {
      if ((typeof newHost) === 'string') {
        host = config._envs[newHost] || newHost;
      }
    };
    this.setHost(host);
    this.getHost = (env) => env === undefined ? host : config._envs[env];

    const endPointFuncs = {setHost: this.setHost, getHost: this.getHost};
    this.getFuncObj = function () {return endPointFuncs;};


    function build(str) {
      const pieces = str.split(/:[a-zA-Z0-9]*/g);
      const labels = str.match(/:[a-zA-Z0-9]*/g) || [];
      return function () {
        let values = [];
        if (arguments[0] === null || (typeof arguments[0]) !== 'object') {
          values = arguments;
        } else {
          const obj = arguments[0];
          labels.map((value) => values.push(obj[value.substr(1)] !== undefined ? obj[value.substr(1)] : value))
        }
        let endpoint = '';
        for (let index = 0; index < pieces.length; index += 1) {
          const arg = values[index];
          let value = '';
          if (index < pieces.length - 1) {
            value = arg !== undefined ? encodeURIComponent(arg) : labels[index];
          }
          endpoint += pieces[index] + value;
        }
        return `${host}${endpoint}`;
      }
    }

    function configRecurse(currConfig, currFunc) {
      const keys = Object.keys(currConfig);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const value = currConfig[key];
        if (key.indexOf('_') !== 0) {
          if (value instanceof Object) {
            currFunc[key] = {};
            configRecurse(value, currFunc[key]);
          } else {
            currFunc[key] = build(value);
          }
        } else {
          currFunc[key] = value;
        }
      }
    }

    configRecurse(config, endPointFuncs);
  }
}

try {
  Endpoints.defaultConfig = require('../public/json/endpoints.json');
  exports.EPNTS = new Endpoints(Endpoints.defaultConfig).getFuncObj();
  exports.Endpoints = Endpoints;
} catch (e) {}

const EPNTS = new Endpoints({
  "_envs": {
    "local": "http://localhost:3000/cabinet",
    "dev": "https://dev.jozsefmorrissey.com/cabinet",
    "prod": "https://node.jozsefmorrissey.com/cabinet"
  },
  "user": {
    "register": "/register",
    "resendActivation": "/resend/activation",
    "activate": "/activate/:email/:secret",
    "validate": "/validate",
    "login": "/login",
    "status": "/status",
    "resetPasswordRequest": "/reset/password/request",
    "resetPassword": "/reset/password/:email/:secret"
  },
  "cabinet": {
    "add": "/:id",
    "list": "/all"
  },
  "costs": {
    "save": "/costs/save",
    "get": "/costs/get"
  },
  "patterns": {
    "save": "/patterns/save",
    "get": "/patterns/get"
  },
  "properties": {
    "save": "/properties/save",
    "get": "/properties/get"
  },
  "templates": {
    "save": "/templates/save",
    "get": "/templates/get"
  },
  "order": {
    "add": "/order/:id",
    "get": "/order/:id",
    "list": "/list/orders"
  },
  "export": {
    "dxf": "/export/dxf"
  }
}
, 'http://localhost:3000/cabinet').getFuncObj();
try {exports.EPNTS = EPNTS;}catch(e){}

const cabinetBuildConfig = {
  "standard": {
    "type": "standard",
    "values": {
      "brh": "tkb.w + pback.t + brr - fb.w",
      "stl": "frorl + pr.t",
      "str": "frorr + pl.t",
      "st":"str + stl"
    },
    "subAssemblies": {
      "Panel.ToeKickBacker": {
        "type": "Panel",
        "code": "tkb",
        "center": ["pr.t + frorl + (l / 2)", "w / 2", "tkd + (t / 2)"],
        "demensions": ["tkh", "c.w - st", "tkbw"],
        "rotation": "z"
      },
      "Frame.Left": {
        "type": "Frame",
        "code": "fl",
        "center": ["w / 2", "brh + (l / 2)", "t / 2"],
        "demensions": ["frw", "c.l - brh", "frt"]
      },
      "Frame.Right": {
        "type": "Frame",
        "code": "fr",
        "center": ["c.w - (w / 2)", " brh + (l / 2)", " t / 2"],
        "demensions": ["frw", " c.l - brh", " frt"]
      },
      "Frame.Bottom": {
        "type": "Frame",
        "code": "fb",
        "center": ["fr.w + (l / 2)", " brh + (w / 2)", " t / 2"],
        "demensions": ["frw", " c.w - fr.w - fl.w", "frt"],
        "rotation": "z"
      },
      "Frame.Top": {
        "type": "Frame",
        "code": "ft",
        "center": ["fr.w + (l / 2)", " c.l - (w/2)", "t / 2"],
        "demensions": ["frw", "fb.l", "frt"],
        "rotation": "z"
      },
      "Panel.Right": {
        "type": "Panel",
        "code": "pr",
        "center": ["c.w - frorl - (t / 2)", "l / 2", "(w / 2) + fr.t"],
        "demensions": ["c.t - fr.t", "c.l", "pwt34"],
        "rotation": "y"
      },
      "Panel.Left": {
        "type": "Panel",
        "code": "pl",
        "center": ["frorr + (t / 2)", " l / 2", " (w/2) + fl.t"],
        "demensions": ["c.t - fr.t", "c.l", "pwt34"],
        "rotation": "y"
      },
      "Panel.Back": {
        "type": "Panel",
        "code": "pback",
        "center": ["l / 2 + stl", " (w / 2) + tkb.w", " c.t - (t / 2)"],
        "demensions": ["c.l - tkb.w", " c.w - st", " pwt34"],
        "rotation": "z"
      },
      "Panel.Bottom": {
        "type": "Panel",
        "code": "pb",
        "center": ["(l / 2) + stl", " brh + fb.w - (t / 2) - brr", "fb.t + (w / 2)"],
        "demensions": ["c.t - fb.t - pback.t", "c.w - st", "pwt34"],
        "rotation": "yx"
      }
    },
    "joints": {
      "pback->pl":
        {
          "type": "Rabbet",
          "depth": 3/8,
          "DemensionToOffset": "y",
          "centerOffset": "-x"
        },
      "pback->pr": {
        "type": "Rabbet",
        "depth": 3/8,
        "DemensionToOffset":"y",
        "centerOffset": "+x"
      },
      "tkb->pl": {
        "type": "Dado",
        "depth": 3/8,
        "DemensionToOffset":"y",
        "centerOffset": "-x"
      },
      "pl->lr": {
        "type": "Dado",
        "depth": 3/8,
        "DemensionToOffset":"x",
        "centerOffset": "-z"
      },
      "tkb->pr": {
        "type": "Dado",
        "depth": 3/8,
        "DemensionToOffset":"y",
        "centerOffset": "+x"
      },
      "pr->rr": {
        "type": "Dado",
        "depth": 3/8,
        "DemensionToOffset":"x",
        "centerOffset": "-z"
      },
      "pb->pl": {
        "type": "Dado",
        "depth": 3/8,
        "DemensionToOffset":"y",
        "centerOffset": "-x"
      },
      "pb->pr": {
        "type": "Dado",
        "depth": 3/8,
        "DemensionToOffset":"y",
        "centerOffset": "+x"
      },
      "pb->br": {
        "type": "Dado",
        "depth": 3/8
      },
      "pb->rr": {
        "type": "Dado",
        "depth": 3/8
      },
      "pb->lr": {
        "type": "Dado",
        "depth": 3/8
      },
      "pback->pb'": {
        "type": "Butt"
      },
      "ft->rr": {
        "type": "Butt"
      },
      "ft->lr": {
        "type": "Butt"
      },
      "fb->rr": {
        "type": "Butt"
      },
      "fb->lr": {
        "type": "Butt"
      }
    },
    "bordersIdMap": [
      {
        "top": "ft",
        "bottom": "fb",
        "left": "fl",
        "right": "fr",
        "back": "pback"
      }
    ]
  },

  "Frame Only": {
    "type": "Frame Only",
    "values": {
      "brh": "0",
      "stl": "frorl + pr.t",
      "str": "frorr + pl.t",
      "st":"str + stl"
    },
    "subAssemblies": {
      "Left": {
        "type": "Frame",
        "code": "fl",
        "center": ["w / 2", "brh + (l / 2)", "t / 2"],
        "demensions": ["frw", "c.l - brh", "frt"]
      },

      "Right": {
        "type": "Frame",
        "code": "fr",
        "center": ["c.w - (w / 2)", " brh + (l / 2)", " t / 2"],
        "demensions": ["frw", " c.l - brh", " frt"]
      },

      "Bottom": {
        "type": "Frame",
        "code": "fb",
        "center": ["fr.w + (l / 2)", " brh + (w / 2)", " t / 2"],
        "demensions": ["frw", " c.w - fr.w - fl.w", "frt"],
        "rotation": "z"
      },
      "Top": {
        "type": "Frame",
        "code": "ft",
        "center": ["fr.w + (l / 2)", " c.l - (w/2)", "t / 2"],
        "demensions": ["frw", "fb.l", "frt"],
        "rotation": "z"
      },

    },
    "joints": {
      "ft->rr": {
    "type": "Butt"
    },
    "ft->lr": {
    "type": "Butt"
    },
    "fb->rr": {
    "type": "Butt"
    },
    "fb->lr": {
    "type": "Butt"
    }
    },
    "bordersIdMap": [
      {
        "top": "ft",
        "bottom": "fb",
        "left": "fl",
        "right": "fr",
        "back": "fr"
      }
    ]
  }
}


class Position {
  constructor(assembly, sme) {

    function getSme(attr, obj) {
      if (attr === undefined) {
        return {x: sme.eval(obj.x),
          y: sme.eval(obj.y),
          z: sme.eval(obj.z)}
      } else {
        return sme.eval(obj[attr]);
      }
    }

    let center, demension;
    let demCoords = {};
    let centerCoords = {};

    if ((typeof assembly.centerStr()) !== 'object') {
      centerCoords = Position.parseCoordinates(assembly.centerStr(), '0,0,0');
      center = (attr) => getSme(attr, centerCoords);
    } else {
      center = assembly.centerStr;
    }

    if ((typeof assembly.demensionStr()) !== 'object') {
      const defSizes = getDefaultSize(assembly);
      demCoords = Position.parseCoordinates(assembly.demensionStr(),
      `${defSizes.width},${defSizes.length},${defSizes.thickness}`,
      '0,0,0');
      demension = (attr) => getSme(attr, demCoords);
    } else new Promise(function(resolve, reject) {
      demension = assembly.demensionStr
    });



    function get(func, sme) {
      if ((typeof func) === 'function' && (typeof func()) === 'object') return func;
      return sme;
    }

    this.center = (attr) => center(attr);
    this.demension = (attr) => demension(attr);

    this.current = () => {
      const position = {
        center: this.center(),
        demension: this.demension(),
        rotation: this.rotation()
      };
      assembly.getJoints().male.forEach((joint) =>
        joint.updatePosition(position)
      );
      return position;
    }

    this.centerAdjust = (center, direction) => {
      const magnitude = direction[0] === '-' ? -1 : 1;
      const axis = direction.replace(/\+|-/, '');
      return this.center(center) + (magnitude * this.demension(axis) / 2);
    }

    this.limits = (targetStr) => {
      if (targetStr !== undefined) {
        const match = targetStr.match(/^(\+|-|)([xyz])$/)
        const attr = match[2];
        const d = this.demension(attr)/2;
        const pos = `+${attr}`;
        const neg = `-${attr}`;
        const limits = {};
        limits[pos] = d;
        if (match[1] === '+') return limits[pos];
        limits[neg] = -d;
        if (match[1] === '-') return limits[neg];
        return  limits;
      }
      const d = this.demension();
      return  {
        x: d.x / 2,
        '-x': -d.x / 2,
        y: d.y / 2,
        '-y': -d.y / 2,
        z: d.z / 2,
        '-z': -d.z / 2,
      }
    }


    this.rotation = () => {
      const rotation = {x: 0, y: 0, z: 0};
      const axisStrs = (assembly.rotationStr() || '').match(Position.rotateStrRegex);
      for (let index = 0; axisStrs && index < axisStrs.length; index += 1) {
        const match = axisStrs[index].match(Position.axisStrRegex);
        rotation[match[2]] = match[4] ? Number.parseInt[match[4]] : 90;
      }
      return rotation;
    };

    this.set = (obj, type, value) => {
      if (value !== undefined) obj[type] = value;
      return demension(type);
    }

    this.setDemension = (type, value) => this.set(demCoords, type, value);
    this.setCenter = (type, value) => this.set(centerCoords, type, value);
  }
}

Position.targeted = (attr, x, y, z) => {
  const all = attr === undefined;
  const dem = {
    x: all || attr === 'x' && x(),
    y: all || attr === 'y' && y(),
    z: all || attr === 'z' && z()
  };
  return all ? {x,y,z} : dem[attr];
}
Position.axisStrRegex = /(([xyz])(\(([0-9]*)\)|))/;
Position.rotateStrRegex = new RegExp(Position.axisStrRegex, 'g');
Position.touching = (pos1, pos2) => {
  const touchingAxis = (axis) => {
    if (pos1[`${axis}1`] === pos2[`${axis}0`])
      return {axis: `${axis}`, direction: '+'};
    if (pos1[`${axis}0`] === pos2[`${axis}1`])
      return {axis: `${axis}`, direction: '-'};
  }
  if (!Position.within(pos1, pos2)) return null;
  return touchingAxis('x') || touchingAxis('y') || touchingAxis('z') || null;
}
Position.within = (pos1, pos2, axises) => {
  const axisTouching = (axis) => {
    if (axises !== undefined && axises.index(axis) === -1) return true;
    const p10 = pos1[`${axis}0`];
    const p11 = pos1[`${axis}1`];
    const p20 = pos2[`${axis}0`];
    const p21 = pos2[`${axis}1`];
    return (p10 >= p20 && p10 <= p21) ||
            (p11 <= p21 && p11 >= p20);
  }
  return axisTouching('x') && axisTouching('y') && axisTouching('z');
}

Position.parseCoordinates = function() {
  let coordinateMatch = null;
  for (let index = 0; coordinateMatch === null && index < arguments.length; index += 1) {
    const str = arguments[index];
    if (index > 0 && arguments.length - 1 === index) {
      //console.error(`Attempted to parse invalid coordinateStr: '${JSON.stringify(arguments)}'`);
    }
    if (typeof str === 'string') {
      coordinateMatch = str.match(Position.demsRegex);
    }
  }
  if (coordinateMatch === null) {
    throw new Error(`Unable to parse coordinates`);
  }
  return {
    x: coordinateMatch[1],
    y: coordinateMatch[2],
    z: coordinateMatch[3]
  }
}
Position.demsRegex = /([^,]{1,}?),([^,]{1,}?),([^,]{1,})/;


class CabinetConfig {
  constructor() {
    let cabinetList = {};
    let cabinetKeys = {};
    let configKeys;
    const updateEvent = new CustomEvent('update');
    function setLists(cabinets) {
      const allCabinetKeys = Object.keys(cabinets);
      allCabinetKeys.forEach((key) => {
        const type = cabinets[key].partName;
        if (cabinetKeys[type] === undefined)  cabinetKeys[type] = {};
        if (cabinetKeys[type][key] === undefined)  cabinetKeys[type][key] = {};
        cabinetKeys[type][key] = cabinets[key];
      });

      cabinetList = cabinets;
      configKeys = Object.keys(cabinetBuildConfig);
      updateEvent.trigger();
    }

    this.valid = (type, id) => (!id ?
    cabinetBuildConfig[type] : cabinetKeys[type][id]) !== undefined;

    this.onUpdate = (func) => updateEvent.on(func);
    this.inputTree = () => {
      const typeInput = new Select({
        name: 'type',
        class: 'center',
        list: JSON.parse(JSON.stringify(configKeys))
      });
      const propertyInput = new Select({
        name: 'propertyId',
        class: 'center',
        list: Object.keys(properties.list)
      });
      const inputs = [Input.Name(), typeInput, propertyInput];
      const inputTree = new DecisionInputTree('Cabinet', inputs, console.log);
      const cabinetTypes = Object.keys(cabinetKeys);
      cabinetTypes.forEach((type) => {
        const cabinetInput = new Select({
          label: 'Layout (Optional)',
          name: 'id',
          class: 'center',
          list: [''].concat(Object.keys(cabinetKeys[type]))
        });
        inputTree.addState(type, cabinetInput);
        inputTree.then(`type:${type}`).jump(type);
      });
      return inputTree;
    }
    this.get = (name, type, propertyId, id) => {
      let cabinet;
      if (!id) cabinet = Cabinet.build(type);
      else cabinet = Cabinet.fromJson(cabinetList[id]);
      if (propertyId !== undefined) cabinet.propertyId(propertyId);
      cabinet.name = name;
      return cabinet;
    };

    afterLoad.push(() =>
      Request.get(EPNTS.cabinet.list(), setLists, () => setLists([])));
  }
}

CabinetConfig = new CabinetConfig();


class Feature {
  constructor(id, subFeatures, properties, parent) {
    subFeatures = subFeatures || [];
    this.properties = properties || {};
    this.enabled = false;
    this.features = [];
    const radioFeatures = [];
    this.name = id.replace(/([a-z])([A-Z])/g, '$1.$2')
                  .replace(/\.([a-zA-Z0-9])/g, Feature.formatName);
    this.id = id;
    this.isRoot = (path) => path === 'root';
    this.multipleFeatures = () => this.features.length > 1;
    this.isInput = () => (typeof this.properties.inputValidation) === 'function';
    this.showInput = () => (this.isInput() && !this.isCheckbox() && !this.isRadio())
                          || (this.enabled && (this.isCheckbox() || this.isRadio()));
    this.isCheckbox = () => this.id.indexOf('has') === 0;
    this.radioFeature = (feature) => radioFeatures.length > 1 && radioFeatures.indexOf[feature] !== -1;
    this.isRadio = () => (!this.isCheckbox() && parent !== undefined && parent.radioFeature(this));
    this.addFeature = (featureOrId) => {
      let feature;
      if (featureOrId instanceof Feature) feature = featureOrId;
      else feature = Feature.byId[featureOrId];
      if (!(feature instanceof Feature)) {
        throw new Error(`Invalid feature '${id}'`);
      }
      this.features.push(feature);
      if (!feature.isCheckbox()) radioFeatures.push(feature);
    };
    subFeatures.forEach((featureId) => this.addFeature(featureId))
    Feature.byId[id] = this;
  }
}

Feature.byId = {};
Feature.objMap = {};
Feature.addRelations = (objId, featureIds) => {
  featureIds.forEach((id) => {
    if (Feature.objMap[objId] === undefined) Feature.objMap[objId] = [];
    const feature = Feature.byId[id];
    if (!(feature instanceof Feature)) {
      throw new Error('Trying to add none Feature object');
    }
    else Feature.objMap[objId].push(feature);
  });
};
Feature.clone = (feature, parent) => {
  const clone = new feature.constructor(feature.id, undefined, feature.properties, parent);
  feature.features.forEach((f) => clone.addFeature(Feature.clone(f, feature)));
  return clone;
}
Feature.getList = (id) => {
  const masterList = Feature.objMap[id];
  if (masterList === undefined) return [];
  const list = [];
  masterList.forEach((feature) => list.push(Feature.clone(feature)));
  return list;
}
Feature.formatName = (match) => ` ${match[1].toUpperCase()}`;

new Feature('thickness', undefined, {inputValidation: (value) => !new Measurement(value).isNaN()});
new Feature('inset');
new Feature('fullOverlay');
new Feature('1/8');
new Feature('1/4');
new Feature('1/2');
new Feature('roundOver', ['1/8', '1/4', '1/2']);
new Feature('knockedOff');
new Feature('hasFrame', ['thickness']);
new Feature('hasPanel', ['thickness']);
new Feature('insetProfile');
new Feature('glass');
new Feature('edgeProfile', ['roundOver', 'knockedOff']);
new Feature('drawerFront', ['edgeProfile'])
new Feature('doveTail');
new Feature('miter');
new Feature('drawerBox', ['doveTail', 'miter'])
new Feature('insetPanel', ['glass', 'insetProfile'])
new Feature('solid');
new Feature('doorType', ['fullOverlay', 'inset']);
new Feature('doorStyle', ['insetPanel', 'solid'])
new Feature('drawerType', ['fullOverlay', 'inset']);

Feature.addRelations('DrawerBox', ['drawerType', 'drawerFront', 'drawerBox']);
Feature.addRelations('PartitionSection', ['hasFrame', 'hasPanel']);
Feature.addRelations('Door', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('DoubleDoor', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('FalseFront', ['drawerType', 'edgeProfile']);



let roomDisplay;
let order;
let propertyDisplay;
let mainDisplayManager;

afterLoad.push(() => {
  order = new Order();
  orderDisplay = new OrderDisplay('#app');
  setTimeout(ThreeDModel.init, 1000);
  propertyDisplay = new PropertyDisplay('#property-manager');
  mainDisplayManager = new DisplayManager('display-ctn', 'menu', 'menu-btn');
});


function createElement(tagname, attributes) {
  const elem = document.createElement(tagname);
  const keys = Object.keys(attributes);
  keys.forEach((key) => elem.setAttribute(key, attributes[key]));
  return elem;
}

function up(selector, node) {
  if (node instanceof HTMLElement) {
    if (node.matches(selector)) {
      return node;
    } else {
      return up(selector, node.parentNode);
    }
  }
}

function appendError(target, message) {
  return function (e) {
    const parent = target.parentNode;
    const error = document.createElement('div');
    error.className = 'error';
    error.innerHTML = message;
    parent.insertBefore(error, target.nextElementSibling)
  }
}

function upAll(selector, node) {
  const elems = [];
  let elem = node;
  while(elem = up(selector, elem)) {
    elems.push(elem);
    elem = elem.parentElement;
  }
  return elems;
}

function depth(node) {return upAll('*', node).length};

function downInfo(selector, leafSelector, node, distance) {
  const nodes = node instanceof HTMLCollection ? node : [node];
  distance = distance || 0;

  function recurse (node, distance) {
    if (node instanceof HTMLElement) {
      if (node.matches(selector)) {
        return { node, distance, matches: [{node, distance}]};
      }
    }
    return { distance: Number.MAX_SAFE_INTEGER, matches: [] };
  }

  let matches = [];
  let found = { distance: Number.MAX_SAFE_INTEGER };
  for (let index = 0; index < nodes.length; index += 1) {
    const currNode = nodes[index];
    const maybe = recurse(currNode, ++distance);
    if (maybe.node) {
      matches = matches.concat(maybe.matches);
      found = maybe.distance < found.distance ? maybe : found;

    }
    if (!leafSelector || !currNode.matches(leafSelector)) {
      const childRes = downInfo(selector, leafSelector, currNode.children, distance + 1);
      matches = matches.concat(childRes.matches);
      found = childRes.distance < found.distance ? childRes : found;
    }
  }
  found.matches = matches;
  return found;
}

function down(selector, node) {return downInfo(selector, node).node};
function downAll(selector, node) {return downInfo(selector, node).matches};

function closest(selector, node) {
  const visited = [];
  function recurse (currNode, distance) {
    let found = { distance: Number.MAX_SAFE_INTEGER };
    if (!currNode || (typeof currNode.matches) !== 'function') {
      return found;
    }
    visited.push(currNode);
    if (currNode.matches(selector)) {
      return { node: currNode, distance };
    } else {
      for (let index = 0; index < currNode.children.length; index += 1) {
        const child = currNode.children[index];
        if (visited.indexOf(child) === -1) {
          const maybe = recurse(child, distance + index + 1);
          found = maybe && maybe.distance < found.distance ? maybe : found;
        }
      }
      if (visited.indexOf(currNode.parentNode) === -1) {
        const maybe = recurse(currNode.parentNode, distance + 1);
        found = maybe && maybe.distance < found.distance ? maybe : found;
      }
      return found;
    }
  }

  return recurse(node, 0).node;
}


const selectors = {};
let matchRunIdCount = 0;
function getTargetId(target) {
  if((typeof target.getAttribute) === 'function') {
    let targetId = target.getAttribute('ce-match-run-id');
    if (targetId === null || targetId === undefined) {
      targetId = matchRunIdCount + '';
      target.setAttribute('ce-match-run-id', matchRunIdCount++)
    }
    return targetId;
  }
  return target === document ?
        '#document' : target === window ? '#window' : undefined;
}

function runMatch(event) {
  const  matchRunTargetId = getTargetId(event.currentTarget);
  const selectStrs = Object.keys(selectors[matchRunTargetId][event.type]);
  selectStrs.forEach((selectStr) => {
    const target = up(selectStr, event.target);
    const everything = selectStr === '*';
    if (everything || target) {
      selectors[matchRunTargetId][event.type][selectStr].forEach((func) => func(target, event));
    }
  })
}


function addClass(target, clazz) {
  removeClass(target, clazz);
  target.className += ` ${clazz}`;
}

function swapClass(target, newClass, oldClass) {
  removeClass(target, oldClass);
  addClass(target, newClass)
}

function classReg(clazz) {
  return new RegExp(`(^| )(${clazz}( |$)){1,}`, 'g');
}

function removeClass(target, clazz) {
  target.className = target.className.replace(classReg(clazz), ' ').trim();
}

function hasClass(target, clazz) {
  return target.className.match(classReg(clazz));
}

function toggleClass(target, clazz) {
  if (hasClass(target, clazz)) removeClass(target, clazz);
  else addClass(target, clazz);
}

function matchRun(event, selector, func, target) {
  target = target || document;
  const  matchRunTargetId = getTargetId(target);
  if (selectors[matchRunTargetId] === undefined) {
    selectors[matchRunTargetId] = {};
  }
  if (selectors[matchRunTargetId][event] === undefined) {
    selectors[matchRunTargetId][event] = {};
    target.addEventListener(event, runMatch);
  }
  if ( selectors[matchRunTargetId][event][selector] === undefined) {
    selectors[matchRunTargetId][event][selector] = [];
  }

  const selectorArray = selectors[matchRunTargetId][event][selector];
  // if (selectorArray.indexOf(func) !== -1) {
    selectorArray.push(func);
  // }
}

function bindField(selector, objOrFunc, validation) {
  let lastInputTime = {};
  function update(elem) {
    elem.id = elem.id || randomString(7);
    const thisInputTime = new Date().getTime();
    lastInputTime[elem.id] = thisInputTime;
    setTimeout(() => {
      if (thisInputTime === lastInputTime[elem.id]) {
        const updatePath = elem.getAttribute('prop-update') || elem.getAttribute('name');
        if (updatePath !== null) {
          const newValue = elem.value;
          if ((typeof validation) === 'function' && !validation(newValue)) {
            console.error('badValue')
          } else if ((typeof objOrFunc) === 'function') {
            objOrFunc(updatePath, elem.value);
          } else {
            const attrs = updatePath.split('.');
            const lastIndex = attrs.length - 1;
            let currObj = objOrFunc;
            for (let index = 0; index < lastIndex; index += 1) {
              let attr = attrs[index];
              if (currObj[attr] === undefined) currObj[attr] = {};
              currObj = currObj[attr];
            }
            currObj[attrs[lastIndex]] = elem.value;
          }
        }
      }
    }, 2000);
  }
  matchRun('keyup', selector, update);
  matchRun('change', selector, update);
}


function updateDivisions (target) {
  const name = target.getAttribute('name');
  const index = Number.parseInt(target.getAttribute('index'));
  const value = Number.parseFloat(target.value);
  const inputs = target.parentElement.parentElement.querySelectorAll('.division-pattern-input');
  const uniqueId = up('.opening-cnt', target).getAttribute('opening-id');
  const opening = Assembly.get(uniqueId);
  const values = opening.dividerLayout().fill;
  for (let index = 0; values && index < inputs.length; index += 1){
    const value = values[index];
    if(value) inputs[index].value = value;
  }
  updateModel(opening);
}

function parseSeperator (str, seperator, isRegex) {
  if ((typeof str) !== 'string') {
    return {};
  }
  if (isRegex !== true) {
    seperator = seperator.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&');
  }
  var keyValues = str.match(new RegExp('.*?=.*?(' + seperator + '|$)', 'g'));
  var json = {};
  for (let index = 0; keyValues && index < keyValues.length; index += 1) {
    var split = keyValues[index].match(new RegExp('\\s*(.*?)\\s*=\\s*(.*?)\\s*(' + seperator + '|$)'));
    if (split) {
      json[split[1]] = split[2];
    }
  }
  return json;
}

function getCookie(name, seperator) {
  const cookie = parseSeperator(document.cookie, ';')[name];
  if (seperator === undefined) return cookie;
  const values = cookie === undefined ? [] : cookie.split(seperator);
  if (arguments.length < 3) return values;
  let obj = {};
  for (let index = 2; index < arguments.length; index += 1) {
    const key = arguments[index];
    const value = values[index - 2];
    obj[key] = value;
  }
  return obj;
}


function getParam(name) {
  if (getParam.params === undefined) {
    const url = window.location.href;
    const paramStr = url.substr(url.indexOf('?') + 1);
    getParam.params = parseSeperator(paramStr, '&');
  }
  return decodeURI(getParam.params[name]);
}

function temporaryStyle(elem, time, style) {
  const save = {};
  const keys = Object.keys(style);
  keys.forEach((key) => {
    save[key] = elem.style[key];
    elem.style[key] = style[key];
  });

  setTimeout(() => {
    keys.forEach((key) => {
      elem.style[key] = save[key];
    });
  }, time);
}

function center(elem) {
  const rect = elem.getBoundingClientRect();
  const x = rect.x + (rect.height / 2);
  const y = rect.y + (rect.height / 2);
  return {x, y, top: rect.top};
}

function isScrollable(elem) {
    const horizontallyScrollable = elem.scrollWidth > elem.clientWidth;
    const verticallyScrollable = elem.scrollHeight > elem.clientHeight;
    return elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight;
};

function scrollableParents(elem) {
  let scrollable = [];
  if (elem instanceof HTMLElement) {
    if (isScrollable(elem)) {
      scrollable.push(elem);
    }
    return scrollableParents(elem.parentNode).concat(scrollable);
  }
  return scrollable;
}

function scrollIntoView(elem, divisor, delay, scrollElem) {
  let scrollPidCounter = 0;
  const lastPosition = {};
  let highlighted = false;
  function scroll(scrollElem) {
    return function() {
      const scrollCenter = center(scrollElem);
      const elemCenter = center(elem);
      const fullDist = Math.abs(scrollCenter.y - elemCenter.y);
      const scrollDist = fullDist > 5 ? fullDist/divisor : fullDist;
      const yDiff = scrollDist * (elemCenter.y < scrollCenter.y ? -1 : 1);
      scrollElem.scroll(0, scrollElem.scrollTop + yDiff);
      if (elemCenter.top !== lastPosition[scrollElem.scrollPid]
            && (scrollCenter.y < elemCenter.y - 2 || scrollCenter.y > elemCenter.y + 2)) {
        lastPosition[scrollElem.scrollPid] = elemCenter.top;
        setTimeout(scroll(scrollElem), delay);
      } else if(!highlighted) {
        highlighted = true;
        temporaryStyle(elem, 2000, {
          borderStyle: 'solid',
          borderColor: '#07ff07',
          borderWidth: '5px'
        });
      }
    }
  }
  const scrollParents = scrollableParents(elem);
  scrollParents.forEach((scrollParent) => {
    scrollParent.scrollPid = scrollPidCounter++;
    setTimeout(scroll(scrollParent), 100);
  });
}


function removeCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

matchRun('change', '.open-orientation-radio,.open-division-input', updateDivisions);



// terminology
// name - String to define state;
// payload - data returned for a given state
// stateObject - object defining states {name: [payload]...}
// states - array of availible state names.
// node - {name, states, payload, then, addState, addStates};
// then(name) - a function to set a following state.
// next(name) - a function to get the next state.
// back() - a function to move back up the tree.
// top() - a function to get root;
//
// returns all functions return current node;
class DecisionTree {
  constructor(name, payload) {
    name = name || 'root';
    const stateConfigs = {};
    const tree = {};
    const nodeMap = {};

    function addState(name, payload) {
      return stateConfigs[name] = payload;
    }

    function addStates(sts) {
      if ((typeof sts) !== 'object') throw new Error('Argument must be an object\nFormat: {[name]: payload...}');
      const keys = Object.keys(sts);
      keys.forEach((key) => stateConfigs[key] = sts[key]);
    }

    function getState(name, parent) {
      return new DecisionNode(name, stateConfigs[name], parent);
    }


    class DecisionNode {
      constructor(name, payload, parent) {
        const states = {};
        let jump;
        payload = payload || {};
        payload._nodeId = `decision-node-${randomString(7)}`;
        nodeMap[payload._nodeId] = this;
        this.getNode = (nodeId) => nodeMap[nodeId];
        this.name = name;
        this.states = states;
        this.payload = payload;
        this.jump = (name) => {
          if (name) jump = getState(name, parent);
          return jump;
        };
        this.then = (name, payload) => {
          payload = payload ? addState(name, payload) : stateConfigs[name];
          states[name] = (getState(name, this));
          const state = states[name];
          return state === undefined ? undefined : state.jump() || state;
        }
        this.addState = (name, payload) => addState(name, payload) && this;
        this.addStates = (sts) => addStates(sts) && this;
        this.next = (name) => {
          const state = states[name];
          return state === undefined ? undefined : state.jump() || state;
        }

        this.routePayloads = () => {
          let currNode = this;
          const payloads = [];
          while(currNode !== null) {
            payloads.push(currNode.payload);
            currNode = currNode.back();
          }
          return payloads.reverse();
        }
        this.back = () => parent;
        this.top = () => rootNode;
      }
    }

    const rootNode = new DecisionNode(name, payload, null);
    return rootNode;
  }
}


function regexToObject (str, reg) {
  const match = str.match(reg);
  if (match === null) return null;
  const returnVal = {};
  for (let index = 2; index < arguments.length; index += 1) {
    const attr = arguments[index];
    if (attr) returnVal[attr] = match[index - 1];
  }
  return returnVal;
}

class Measurement {
  constructor(value) {
    if ((typeof value) === 'string') {
      value += ' '; // Hacky fix for regularExpression
    }

    let decimal = 0;
    let nan = false;
    this.isNaN = () => nan;

    const parseFraction = (str) => {
      const regObj = regexToObject(str, Measurement.regex, null, 'integer', null, 'numerator', 'denominator');
      regObj.integer = Number.parseInt(regObj.integer) || 0;
      regObj.numerator = Number.parseInt(regObj.numerator) || 0;
      regObj.denominator = Number.parseInt(regObj.denominator) || 0;
      if(regObj.denominator === 0) {
        regObj.numerator = 0;
        regObj.denominator = 1;
      }
      regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
      return regObj;
    };

    function reduce(numerator, denominator) {
      let reduced = true;
      while (reduced) {
        reduced = false;
        for (let index = 0; index < Measurement.primes.length; index += 1) {
          const prime = Measurement.primes[index];
          if (prime >= denominator) break;
          if (numerator % prime === 0 && denominator % prime === 0) {
            numerator = numerator / prime;
            denominator = denominator / prime;
            reduced = true;
            break;
          }
        }
      }
      if (numerator === 0) {
        return '';
      }
      return ` ${numerator}/${denominator}`;
    }

    function calculateValue(accuracy) {
      accuracy = accuracy || '1/1000'
      const fracObj = parseFraction(accuracy);
      const denominator = fracObj.denominator;
      if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
        throw new Error('Please enter a fraction with a denominator between (0, 1000]')
      }
      let remainder = decimal;
      let currRemainder = remainder;
      let value = 0;
      let numerator = 0;
      while (currRemainder > 0) {
        numerator += fracObj.numerator;
        currRemainder -= fracObj.decimal;
      }
      const diff1 = decimal - ((numerator - fracObj.numerator) / denominator);
      const diff2 = (numerator / denominator) - decimal;
      numerator -= diff1 < diff2 ? fracObj.numerator : 0;
      const integer = Math.floor(numerator / denominator);
      numerator = numerator % denominator;
      return {integer, numerator, denominator};
    }

    this.fraction = (accuracy) => {
      if (nan) return NaN;
      const obj = calculateValue(accuracy);
      const integer = obj.integer !== 0 ? obj.integer : '';
      return `${integer}${reduce(obj.numerator, obj.denominator)}`;
    }

    this.decimal = (accuracy) => {
      if (nan) return NaN;
      const obj = calculateValue(accuracy);
      return obj.integer + (obj.numerator / obj.denominator);
    }

    if ((typeof value) === 'number') {
      decimal = value;
    } else if ((typeof value) === 'string') {
      try {
        decimal = parseFraction(value).decimal;
      } catch (e) {
        nan = true;
      }
    } else {
      nan = true;
    }
  }
}

Measurement.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;
Measurement.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
Measurement.rangeRegex = /^\s*(\(|\[)(.*),(.*)(\)|\])\s*/;

Measurement.validation = function (range) {
  const obj = regexToObject(range, Measurement.rangeRegex, 'minBound', 'min', 'max', 'maxBound');
  let min = obj.min.trim() !== '' ?
        new Measurement(obj.min).decimal() : Number.MIN_SAFE_INTEGER;
  let max = obj.max.trim() !== '' ?
        new Measurement(obj.max).decimal() : Number.MAX_SAFE_INTEGER;
  const minCheck = obj.minBound === '(' ? ((val) => val > min) : ((val) => val >= min);
  const maxCheck = obj.maxBound === ')' ? ((val) => val < max) : ((val) => val <= max);
  return function (value) {
    const decimal = new Measurement(value).decimal();
    if (decimal === NaN) return false;
    return minCheck(decimal) && maxCheck(decimal);
  }
}


const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function randomString(len) {
  len = len || 7;
  let str = '';
  while (str.length < len) str += Math.random().toString(36).substr(2);
  return str.substr(0, len);
}

function getValue(code, obj) {
  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
  return CONSTANTS[code].value;
}
$t.global('getValue', getValue, true);

function getDefaultSize(instance) {
  const constructorName = instance.constructor.name;
  if (constructorName === 'Cabinet') return {length: 24, width: 50, thickness: 21};
  return {length: 0, width: 0, thickness: 0};
}

function setterGetter () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 1) {
    const attr = arguments[index];
    this[attr] = (value) => {
      if (value === undefined) return attrs[attr];
      attrs[attr] = value;
    }
  }
}

function funcOvalue () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 2) {
    const attr = arguments[index];
    const funcOval = arguments[index + 1];
    if ((typeof funcOval) === 'function') this[attr] = funcOval;
    else this[attr] = () => funcOval;
  }
}

function arraySet(array, values, start, end) {
  if (start!== undefined && end !== undefined && start > end) {
    const temp = start;
    start = end;
    end = temp;
  }
  start = start || 0;
  end = end || values.length;
  for (let index = start; index < end; index += 1)
    array[index] = values[index];
  return array;
}


JSON.clone = (obj) => {
  const keys = Object.keys(obj);
  const clone = ((typeof obj.clone) === 'function') ? obj.clone() : {};
  for(let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const member = obj[key];
    if ((typeof memeber) === 'object') {
      if ((typeof member.clone) === 'function') {
        clone[key] = member.clone();
      } else {
        clone[key] = JSON.clone(member);
      }
    } else {
      clone[key] = member;
    }
  }
  return clone;
}



function regexToObject (str, reg) {
  const match = str.match(reg);
  if (match === null) return null;
  const returnVal = {};
  for (let index = 2; index < arguments.length; index += 1) {
    const attr = arguments[index];
    if (attr) returnVal[attr] = match[index - 1];
  }
  return returnVal;
}

class StringMathEvaluator {
  constructor(globalScope, resolver) {
    globalScope = globalScope || {};
    const instance = this;
    let splitter = '.';
    let cache = {};

    function resolve (path, currObj, globalCheck) {
      if (path === '') return currObj;
      const resolved = !globalCheck && resolver && resolver(path, currObj);
      if (resolved) return resolved;
      try {
        if ((typeof path) === 'string') path = path.split(splitter);
        for (let index = 0; index < path.length; index += 1) {
          currObj = currObj[path[index]];
        }
        if (currObj === undefined && !globalCheck) throw Error('try global');
        return currObj;
      }  catch (e) {
        return resolve(path, globalScope, true);
      }
    }

    function multiplyOrDivide (values, operands) {
      const op = operands[operands.length - 1];
      if (op === StringMathEvaluator.multi || op === StringMathEvaluator.div) {
        const len = values.length;
        values[len - 2] = op(values[len - 2], values[len - 1])
        values.pop();
        operands.pop();
      }
    }

    const resolveArguments = (initialChar, func) => {
      return function (expr, index, values, operands, scope, path) {
        if (expr[index] === initialChar) {
          const args = [];
          let endIndex = index += 1;
          const terminationChar = expr[index - 1] === '(' ? ')' : ']';
          let terminate = false;
          let openParenCount = 0;
          while(!terminate && endIndex < expr.length) {
            const currChar = expr[endIndex++];
            if (currChar === '(') openParenCount++;
            else if (openParenCount > 0 && currChar === ')') openParenCount--;
            else if (openParenCount === 0) {
              if (currChar === ',') {
                args.push(expr.substr(index, endIndex - index - 1));
                index = endIndex;
              } else if (openParenCount === 0 && currChar === terminationChar) {
                args.push(expr.substr(index, endIndex++ - index - 1));
                terminate = true;
              }
            }
          }

          for (let index = 0; index < args.length; index += 1) {
            args[index] = instance.eval(args[index], scope);
          }
          const state = func(expr, path, scope, args, endIndex);
          if (state) {
            values.push(state.value);
            return state.endIndex;
          }
        }
      }
    };

    function chainedExpressions(expr, value, endIndex, path) {
      if (expr.length === endIndex) return {value, endIndex};
      let values = [];
      let offsetIndex;
      let valueIndex = 0;
      let chained = false;
      do {
        const subStr = expr.substr(endIndex);
        const offsetIndex = isolateArray(subStr, 0, values, [], value, path) ||
                            isolateFunction(subStr, 0, values, [], value, path) ||
                            (subStr[0] === '.' &&
                              isolateVar(subStr, 1, values, [], value));
        if (Number.isInteger(offsetIndex)) {
          value = values[valueIndex];
          endIndex += offsetIndex - 1;
          chained = true;
        }
      } while (offsetIndex !== undefined);
      return {value, endIndex};
    }

    const isolateArray = resolveArguments('[',
      (expr, path, scope, args, endIndex) => {
        endIndex = endIndex - 1;
        let value = resolve(path, scope)[args[args.length - 1]];
        return chainedExpressions(expr, value, endIndex, '');
      });

    const isolateFunction = resolveArguments('(',
      (expr, path, scope, args, endIndex) =>
          chainedExpressions(expr, resolve(path, scope).apply(null, args), endIndex - 1, ''));

    function isolateParenthesis(expr, index, values, operands, scope) {
      const char = expr[index];
      if (char === ')') throw new Error('UnExpected closing parenthesis');
      if (char === '(') {
        let openParenCount = 1;
        let endIndex = index + 1;
        while(openParenCount > 0 && endIndex < expr.length) {
          const currChar = expr[endIndex++];
          if (currChar === '(') openParenCount++;
          if (currChar === ')') openParenCount--;
        }
        if (openParenCount > 0) throw new Error('UnClosed parenthesis');
        const len = endIndex - index - 2;
        values.push(instance.eval(expr.substr(index + 1, len), scope));
        multiplyOrDivide(values, operands);
        return endIndex;
      }
    };

    function isolateOperand (char, operands) {
      if (char === ')') throw new Error('UnExpected closing parenthesis');
      switch (char) {
        case '*':
        operands.push(StringMathEvaluator.multi);
        return true;
        break;
        case '/':
        operands.push(StringMathEvaluator.div);
        return true;
        break;
        case '+':
        operands.push(StringMathEvaluator.add);
        return true;
        break;
        case '-':
        operands.push(StringMathEvaluator.sub);
        return true;
        break;
      }
      return false;
    }

    function isolateValueReg(reg, resolver) {
      return function (expr, index, values, operands, scope) {
        const match = expr.substr(index).match(reg);
        let args;
        if (match) {
          let endIndex = index + match[0].length;
          let value = resolver(match[0], scope);
          if (!Number.isFinite(value)) {
            const state = chainedExpressions(expr, scope, endIndex, match[0]);
            if (state !== undefined) {
              value = state.value;
              endIndex = state.endIndex;
            }
          }
          values.push(value);
          multiplyOrDivide(values, operands);
          return endIndex;
        }
      }
    }

    function convertFeetInchNotation(expr) {
      expr = expr.replace(StringMathEvaluator.footInchReg, '($1*12+$2)') || expr;
      expr = expr.replace(StringMathEvaluator.inchReg, '$1') || expr;
      expr = expr.replace(StringMathEvaluator.footReg, '($1*12)') || expr;
      return expr = expr.replace(StringMathEvaluator.mixedNumberReg, '($1+$2)') || expr;;
    }
    function addUnexpressedMultiplicationSigns(expr) {
      expr = expr.replace(/([0-9]{1,})(\s*)([a-zA-Z]{1,})/g, '$1*$3');
      expr = expr.replace(/([a-zA-Z]{1,})\s{1,}([0-9]{1,})/g, '$1*$2');
      expr = expr.replace(/\)([^\s^+^-^*^\/])/g, ')*$1');
      return expr.replace(/([^\s^+^-^*^\/])\(/g, '$1*(');
    }

    const isolateNumber = isolateValueReg(StringMathEvaluator.numReg, Number.parseFloat);
    const isolateVar = isolateValueReg(StringMathEvaluator.varReg, resolve);

    this.cache = (expr) => {
      const time = new Date().getTime();
      if (cache[expr] && cache[expr].time > time - 200) {
        cache[expr].time = time;
        return cache[expr].value;
      }
      return null
    }

    this.eval = function (expr, scope) {
      if (this.cache(expr) !== null) return this.cache(expr);
      if (Number.isFinite(expr))
        return expr;
      expr = addUnexpressedMultiplicationSigns(expr);
      expr = convertFeetInchNotation(expr);
      scope = scope || globalScope;
      const allowVars = (typeof scope) === 'object';
      let operands = [];
      let values = [];
      let prevWasOpperand = true;
      for (let index = 0; index < expr.length; index += 1) {
        const char = expr[index];
        if (prevWasOpperand) {
          try {
            if (isolateOperand(char, operands)) throw new Error('Invalid operand location');
            let newIndex = isolateParenthesis(expr, index, values, operands, scope) ||
                isolateNumber(expr, index, values, operands, scope) ||
                (allowVars && isolateVar(expr, index, values, operands, scope));
            if (Number.isInteger(newIndex)) {
              index = newIndex - 1;
              prevWasOpperand = false;
            }
          } catch (e) {
            console.error(e);
            return NaN;
          }
        } else {
          prevWasOpperand = isolateOperand(char, operands);
        }
      }
      if (prevWasOpperand) return NaN;

      let value = values[0];
      for (let index = 0; index < values.length - 1; index += 1) {
        value = operands[index](values[index], values[index + 1]);
        values[index + 1] = value;
      }

      if (Number.isFinite(value)) {
        cache[expr] = {time: new Date().getTime(), value};
        return new Measurement(value).decimal('1/32');
      }
      return NaN;
    }
  }
}

StringMathEvaluator.regex = /^\s*(([0-9]*)\s{1,}|)(([0-9]{1,})\s*\/([0-9]{1,})\s*|)$/;

StringMathEvaluator.mixedNumberReg = /([0-9]{1,})\s{1,}([0-9]{1,}\/[0-9]{1,})/g;
StringMathEvaluator.footInchReg = /\s*([0-9]{1,})\s*'\s*([0-9\/ ]{1,})\s*"\s*/g;
StringMathEvaluator.footReg = /\s*([0-9]{1,})\s*'\s*/g;
StringMathEvaluator.inchReg = /\s*([0-9]{1,})\s*"\s*/g;
StringMathEvaluator.evaluateReg = /[-\+*/]|^\s*[0-9]{1,}\s*$/;
StringMathEvaluator.numReg = /^(-|)[0-9\.]{1,}/;
StringMathEvaluator.varReg = /^((\.|)([a-zA-Z][a-zA-Z0-9\.]*))/;
StringMathEvaluator.multi = (n1, n2) => n1 * n2;
StringMathEvaluator.div = (n1, n2) => n1 / n2;
StringMathEvaluator.add = (n1, n2) => n1 + n2;
StringMathEvaluator.sub = (n1, n2) => n1 - n2;

StringMathEvaluator.primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];


StringMathEvaluator.reduce = function(numerator, denominator) {
  let reduced = true;
  while (reduced) {
    reduced = false;
    for (let index = 0; index < StringMathEvaluator.primes.length; index += 1) {
      const prime = StringMathEvaluator.primes[index];
      if (prime >= denominator) break;
      if (numerator % prime === 0 && denominator % prime === 0) {
        numerator = numerator / prime;
        denominator = denominator / prime;
        reduced = true;
        break;
      }
    }
  }
  if (numerator === 0) {
    return '';
  }
  return ` ${numerator}/${denominator}`;
}

StringMathEvaluator.parseFraction = function (str) {
  const regObj = regexToObject(str, StringMathEvaluator.regex, null, 'integer', null, 'numerator', 'denominator');
  regObj.integer = Number.parseInt(regObj.integer) || 0;
  regObj.numerator = Number.parseInt(regObj.numerator) || 0;
  regObj.denominator = Number.parseInt(regObj.denominator) || 0;
  if(regObj.denominator === 0) {
    regObj.numerator = 0;
    regObj.denominator = 1;
  }
  regObj.decimal = regObj.integer + (regObj.numerator / regObj.denominator);
  return regObj;
}

StringMathEvaluator.toFraction = function (decimal, accuracy) {
  if (decimal === NaN) return NaN;
  accuracy = accuracy || '1/1000'
  const fracObj = StringMathEvaluator.parseFraction(accuracy);
  const denominator = fracObj.denominator;
  if (fracObj.decimal === 0 || fracObj.integer > 0 || denominator > 1000) {
    throw new Error('Please enter a fraction with a denominator between (0, 1000]')
  }
  let remainder = decimal;
  let currRemainder = remainder;
  let value = 0;
  let numerator = 0;
  while (currRemainder > 0) {
    numerator += fracObj.numerator;
    currRemainder -= fracObj.decimal;
  }
  const diff1 = decimal - ((numerator - fracObj.numerator) / denominator);
  const diff2 = (numerator / denominator) - decimal;
  numerator -= diff1 < diff2 ? fracObj.numerator : 0;
  const integer = Math.floor(numerator / denominator);
  numerator = numerator % denominator;
  return `${integer}${StringMathEvaluator.reduce(numerator, denominator)}`;
}


class Show {
  constructor(name) {
    this.name = name;
    Show.types[name] = this;
  }
}
Show.types = {};
Show.listTypes = () => Object.values(Show.types);
new Show('None');
new Show('Flat');
new Show('Inset Panel');



class Property {
  // clone constructor(id, value) {
  constructor(id, name, props) {
    let value;
    const existingProp = Property.list[id];
    let clone = false;
    if (existingProp) {
      this.name = existingProp.name();
      props = existingProp.properties();
      value = name;
      clone = true;
    } else {
      props = props || {};
      value = props.value;
    }
    this.id = () => id;
    this.name = () => name;
    this.values = () => JSON.parse(JSON.stringify(props.values));
    this.description = () => props.description;
    this.value = (val) => {
      if (val !== undefined) value = val;
      return value;
    }
    this.properties = () => props;
    this.clone = (val) => {
      return new Property(id, name, val, props);
    }
    if(!clone) Property.list[id] = this;
  }
}

Property.list = {};

const DEFAULT_PROPS = {
  pwt34: {name: 'Plywood 3/4 Thickness', value: 25/32},
  pwt12: {name: 'Plywood 1/2 Thickness', value: 1/2},
  pwt14: {name: 'Plywood 1/4 Thickness', value: 1/4},
  frw: {name: 'Frame Rail Width', value: 1.5},
  frorr: {name: 'Frame Rail Outside Reveal Right', value: 1 / 8},
  frorl: {name: 'Frame Rail Outside Reveal Left', value: 1 / 8},
  frt: {name: 'Frame Rail Thickness', value: 3/4},
  tkbw: {name: 'Toe Kick Backer Width', value: 1/2},
  tkd: {name: 'Toe Kick Depth', value: 3},
  tkh: {name: 'Toe Kick Height', value: 3},
  pbt: {name: 'Panel Back Thickness', value: 1/2},
  brr: {name: 'Bottom Rail Reveal', value: 1/8},
  iph: {name: 'Ideal Handle Height', value: 42},
  trv: {name: 'Top Reveal', value: 1},
  brv: {name: 'Bottom Reveal', value: 1},
  lrv: {name: 'Left Reveal', value: 1},
  rrv: {name: 'Right Reveal', value: 1},
  r: {name: 'Reveal', value: 1/2},
  Plywood: {name: 'Plywood', value: 'SoftMapel'},
  wood: {name: 'Wood', value: 'SoftMapel'},
  glass: {name: 'glass', value: 'Flat'},
  csp: {name: 'Cover Start Point', value: CoverStartPoints.OUTSIDE_RAIL, options: Object.keys(CoverStartPoints)}
};

const assemProps = {
  Cabinet: {
    global: {},
    instance: {
      Frame: {
        Scribe: {
          frorr: new Property('frorr', 'Right'),
          frorl: new Property('frorl', 'Left'),
        },
        Reveal: {
          brr: new Property('brr', 'Inside Bottom'),
          Cover: {
            trv: new Property('trv', 'Top'),
            brv: new Property('brv', 'Bottom'),
            lrv: new Property('lrv', 'Left'),
            rrv: new Property('rrv', 'Right'),
            r: new Property('r', 'Reveal')
          }
        },
        frw: new Property('frw', 'Frame Rail Width'),
        frt: new Property('frt', 'Frame Rail Thickness'),
      },
      'Toe Kick': {
        tkbw: new Property('tkbw', 'Toe Kick Backer Width'),
        tkd: new Property('tkd', 'Toe Kick Depth'),
        tkh: new Property('tkh', 'Toe Kick Height'),
      },
      Panel: {
        pbt: new Property('pbt', 'Panel Back Thickness'),

      },
      iph: new Property('iph', 'Ideal Handle Height'),
      csp: new Property('csp', 'Cover Start Point', undefined,
          {values: Object.keys(CoverStartPoints)})
    }
  },
  Guides: {
    global: {
      tos: new Property('tos', 'Top Offset'),
    },
    instance: {
      sos: new Property('sos', 'Side Offest'),
      bos: new Property('bos', 'Bottom Offset')
    }
  }
}

function assemProperties(clazz) {
  return assemProps[clazz] || {global: {}, instance: {}};
}

function properties(name, values) {
  if (values === undefined) {
    const props = properties.list[name] || properties.list['Half Overlay'];
    return JSON.parse(JSON.stringify(props));
  }

  const props = JSON.parse(JSON.stringify(DEFAULT_PROPS));
  const overwrites = JSON.parse(JSON.stringify(values));
  if (name !== undefined) properties.list[name] = props;
  Object.keys(overwrites).forEach((key) => props[key] = overwrites[key]);

}
properties.list = {};


properties('Half Overlay', {});
const CONSTANTS = properties('Half Overlay');

properties('Full Overlay', {
  trv: {name: 'Top Reveal', value: 1/16},
  brv: {name: 'Bottom Reveal', value: 1/16},
  lrv: {name: 'Left Reveal', value: 1/16},
  rrv: {name: 'Right Reveal', value: 1/16},
  r: {name: 'Reveal', value: 1/16},
  fs: {name: 'Face Spacing', value: 1/16},
});

properties('Inset', {
  trv: {name: 'Top Reveal', value: -1/16},
  brv: {name: 'Bottom Reveal', value: -1/16},
  lrv: {name: 'Left Reveal', value: -1/16},
  rrv: {name: 'Right Reveal', value: -1/16},
  r: {name: 'Reveal', value: -1/16},
  csp: {name: 'Cover Start Point', value: CoverStartPoints.INSIDE_RAIL, CoverStartPoints}
});


afterLoad.push(() => matchRun('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
})
)

class Pattern {
  constructor(str) {
    this.str = str;
    let unique = {};
    for (let index = 0; index < str.length; index += 1) {
      unique[str[index]] = true;
    }
    unique = Object.keys(unique).join('');
    this.unique = unique;
    this.equal = this.unique.length === 1;
    class Element {
      constructor(id, index, count) {
        let value;
        this.id = id;
        this.count = count || 1;
        this.indexes = [index];
        this.value = (val) => {
          if (val !== undefined) {
            Pattern.mostResent[id] = val;
            value = val;
          }
          return value;
        }
      }
    }

    if ((typeof str) !== 'string' || str.length === 0)
      throw new Error('Must define str (arg0) as string of length > 1');

    const elements = {};
    const values = {};
    const updateOrder = [];
    for (let index = str.length - 1; index > -1; index -= 1) {
      const char = str[index];
      if (elements[char]) {
        elements[char].count++;
        elements[char].indexes.push(index);
      } else {
        elements[char] = new Element(char, index);
        if (Pattern.mostResent[char] !== undefined) {
          elements[char].value(Pattern.mostResent[char]);
          updateOrder.push(char);
        }
      }
    }

    this.ids = Object.keys(elements);
    this.size = str.length;
    let lastElem;
    this.satisfied = () => updateOrder.length === unique.length - 1;

    const calc = (dist) => {
      const values = {};
      updateOrder.forEach((id) => {
        const elem = elements[id];
        dist -= elem.count * elem.value();
        values[elem.id] = elem.value();
      });
      if (lastElem === undefined) {
        for (let index = 0; index < unique.length; index += 1) {
          const char = unique[index];
          if (!values[char]) {
            if (lastElem === undefined) lastElem = elements[char];
            else {lastElem = undefined; break;}
          }
        }
      }
      if (lastElem !== undefined) {
        lastElem.value(dist / lastElem.count);
        values[lastElem.id] = lastElem.value();
      }
      const list = [];
      const fill = [];
      if (lastElem)
        for (let index = 0; index < unique.length; index += 1)
          fill[index] = values[unique[index]];
      for (let index = 0; index < str.length; index += 1)
        list[index] = values[str[index]];
      const retObj = {values, list, fill, str};
      return retObj;
    }

    this.value = (id, value) => {
      if ((typeof id) === 'number') id = unique[id];
      if ((typeof value) === 'number') {
        const index = updateOrder.indexOf(id);
        if (index !== -1) updateOrder.splice(index, 1);
        updateOrder.push(id);
        if (updateOrder.length === this.ids.length) {
          lastElem = elements[updateOrder[0]];
          updateOrder.splice(0, 1);
        }
        elements[id].value(value);
      } else {
        return elements[id].value();
      }
    }

    this.toJson = () => {
      const json = this.calc();
      json.list = undefined;
      json.fill = undefined;
      return json;
    }

    this.elements = elements;
    this.calc = calc;
  }
}

Pattern.fromJson = (json) => {
  const pattern = new Pattern(json.str);
  const keys = Object.keys(pattern.values);
  keys.foEach((key) => pattern.value(key, pattern.values[key]));
  return json;
};
Pattern.mostResent = {};

const p1 = new Pattern('babcdaf');
p1.value('b', 2);
p1.value('a', 2);
p1.value('c', 3);
p1.value('d', 4);
p1.value('b', 2);
p1.value('f', 5);
p1.calc(20);
const p2 = new Pattern(' // ^^%');


class OrderDisplay {
  constructor(parentSelector, orders) {
    const roomDisplays = {};
    let active;
    const getHeader = (order, $index) =>
        OrderDisplay.headTemplate.render({order, $index});

    const setInfo = (order, index) => () => {
      const elem = document.getElementById(`uf-info-${index}`);
      if (elem)
        UTF.buildDisplay(elem, new UFObj(order));
    }

    function initOrder(order, index) {
      roomDisplays[order.id] = new RoomDisplay('#room-pills', order);
      ToggleDisplayList.onShow(`information-display-${index}`, );
      expandList.afterRender(setInfo(order, index));
      return order;
    }

    function loadOrder(index, start) {
      return function (orderData) {
        const order = Order.fromJson(orderData);
        initOrder(order, index);
        expandList.set(index, order);
        expandList.refresh();
        console.log('load Time:', new Date().getTime() - start);
      }
    }

    const getBody = (order, $index) => {
      if (order instanceof Order) {
        let propertyTypes = Object.keys(properties.list);
        active = roomDisplays[order.id];
        return OrderDisplay.bodyTemplate.render({$index, order, propertyTypes});
      } else {
        const start = new Date().getTime();
        Request.get(EPNTS.order.get(order.name), loadOrder($index, start), console.error);
        return 'Loading...';
      }
    }
    const getObject = (values) => initOrder(new Order(values.name));
    this.active = () => active;

    const expListProps = {
      list: orders,
      inputs: [{placeholder: 'name'}],
      inputValidation: (values) => values.name ? true :
          'You must Define a name',
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Order', type: 'sidebar',
      inputTree: new DecisionInputTree('Order', Input.Name(), console.log)
    };
    const expandList = new ExpandableList(expListProps);
    expandList.afterRender(() => {if (active !== undefined) active.refresh()});

    const saveSuccess = () => console.log('success');
    const saveFail = () => console.log('failure');
    const save = (target) => {
      const index = target.getAttribute('index');
      const order = expandList.get(index);
      Request.post(EPNTS.order.add(order.name), order.toJson(), saveSuccess, saveFail);
      console.log('saving');
    }

    const attrUpdate = (attr) => (target) => {
      const index = target.getAttribute('index');
      const order = expandList.get(index);
      order[attr] = target.value;
    };

    function addOrders(names) {
      names.forEach((name) => expListProps.list.push({ name }));
      expandList.refresh();
    }
    Request.get(EPNTS.order.list(), addOrders);

    matchRun('change', '.order-name-input', attrUpdate('name'));
    matchRun('click', '.save-order-btn', save);
  }
}
OrderDisplay.bodyTemplate = new $t('order/body');
OrderDisplay.headTemplate = new $t('order/head');
OrderDisplay.builderBodyTemplate = new $t('order/builder/body');
OrderDisplay.builderHeadTemplate = new $t('order/builder/head');
OrderDisplay.infoBodyTemplate = new $t('order/information/body');
OrderDisplay.infoHeadTemplate = new $t('order/information/head');


class PropertyDisplay {
  constructor(containerSelector) {
    let currProps;

    const noChildren = (properties, groups) => () =>
          properties.length === 0 && Object.keys(groups).length === 0;

    function getScope(key, group) {
      let radioId = group.radioId || PropertyDisplay.counter++;
      const properties = [];
      const groups = [];
      const scope = {key, properties, groups, recurse, radioId,
                      noChildren: noChildren(properties, groups)};
      const keys = Object.keys(group.values);
      radioId = PropertyDisplay.counter++;
      for( let index = 0; index < keys.length; index += 1) {
        const value = group.values[keys[index]];
        if (value instanceof Property) {
          scope.properties.push(value);
        } else {
          scope.groups[keys[index]] = {key: keys[index], values: value, radioId};
        }
      }
      return scope;
    }

    this.update = () => {
      const propKeys = Object.keys(assemProps);
      const propertyObjs = {};
      for (let index = 0; index < propKeys.length; index += 1) {
        const key = propKeys[index];
        const props = assemProps[key];
        const propObj = {global: props.global, instance: {}};
        propertyObjs[key] = propObj;
        const assems = Cost.objMap[key] || [];
        for (let aIndex = 0; aIndex < assems.length; aIndex += 1) {
          const aProps = JSON.clone(props.instance);
          propObj.instance[assems[aIndex].id()] = aProps;
        }
      }
      const values = {values: propertyObjs};
      const contianer = document.querySelector(containerSelector);
      contianer.innerHTML =
          PropertyDisplay.template.render(getScope(undefined, values));
    };

    const recurse = (key, group) => {
      return PropertyDisplay.template.render(getScope(key, group));
    }

    function updateProperties(name, value) {
    }
    bindField(containerSelector, updateProperties);
    new RadioDisplay('property-container', 'radio-id');
  }
}

PropertyDisplay.counter = 0;
PropertyDisplay.template = new $t('properties/properties');
PropertyDisplay.propTemplate = new $t('properties/property');


class RoomDisplay {
  constructor(parentSelector, order) {
    const cabinetDisplays = {};
    const getHeader = (room, $index) =>
        RoomDisplay.headTemplate.render({room, $index});

    const getBody = (room, $index) => {
      let propertyTypes = Object.keys(properties.list);
      return RoomDisplay.bodyTemplate.render({$index, room, propertyTypes});
    }

    const getObject = (values) => {
      const room = new Room(values.name);
      return room;
    }
    this.active = () => expandList.active();
    this.cabinetDisplay = () => {
      const room = this.active();
      const id = room.id;
      if (cabinetDisplays[id] === undefined) {
        cabinetDisplays[id] = new CabinetDisplay(room);
      }
      return cabinetDisplays[id];
    }
    this.cabinet = () => this.cabinetDisplay().active();
    const expListProps = {
      list: order.rooms,
      parentSelector, getHeader, getBody, getObject,
      inputs: [{placeholder: 'name'}],
      inputValidation: (values) => values.name !== '' ? true : 'name must be defined',
      listElemLable: 'Room', type: 'pill',
      inputTree: new DecisionInputTree('Room', Input.Name(), console.log)
    };
    const expandList = new ExpandableList(expListProps);
    expandList.afterRender(() => this.cabinetDisplay().refresh());
    this.refresh = () => expandList.refresh();
  }
}
RoomDisplay.bodyTemplate = new $t('room/body');
RoomDisplay.headTemplate = new $t('room/head');



class User {
  constructor() {
    const stateAttr = 'user-state';
    let state, cnt, email, password;

    function updateDisplay(s) {
      state = s ? User.states[s] : state;
      cnt = cnt || document.getElementById('login-cnt');
      cnt.innerHTML = state.template.render({email, password});
    }

    const hideLogin = () => document.getElementById('login').hidden = true;
    const showLogin = () => document.getElementById('login').hidden = false;
    function successfulRegistration(body) {
      updateDisplay('CONFIRMATION_MESSAGE');
    }

    function register(target) {password
      const fail = appendError(target, 'Registration Failed: Email already registered');
      const body = {email, password};
      document.cookie = `${APP_ID}=${email}:invalid`;
      Request.post(EPNTS.user.register(), body, successfulRegistration, fail);
    }

    function successfulLogin(body, res) {
      const newAuth = res.getResponseHeader('authorization');
      document.cookie = `${APP_ID}=${newAuth}`;
      hideLogin();
    }

    const getEmail = () => getCookie(APP_ID, ':', 'email').email;
    this.credential = User.credential;

    function login(target) {
      const fail = appendError(target, 'Login Failed: Invalid Email and/or Password');
      const body = {email, password};
      Request.post(EPNTS.user.login(), body, successfulLogin, fail);
    }

    function resendActivation(target) {
      const fail = appendError(target, 'Email Not Registered Or Already Active');
      const body = {email: getEmail()};
      Request.post(EPNTS.user.resendActivation(), body, successfulRegistration, fail);
    }

    function logout() {
      removeCookie(APP_ID);
      showLogin();
      updateDisplay('LOGIN')
    }

    function resetPassword(target) {
      const fail = appendError(target, 'Server Error Must have occured... try again in a few minutes');
      const body = {email, newPassword: password};
      Request.post(EPNTS.user.resetPasswordRequest(), body, successfulRegistration, fail);
    }

    matchRun('click', `[${stateAttr}]`, (elem) => {
      const stateId = elem.getAttribute(stateAttr);
      if (User.states[stateId]) {
        updateDisplay(stateId);
      } else console.error(`Invalid State: '${stateId}'`);
    });

    matchRun('click', '#register', register);
    matchRun('click', '#login-btn', login);
    matchRun('click', '#resend-activation', resendActivation);
    matchRun('click', '#reset-password', resetPassword);
    matchRun('click', '#logout-btn', logout);

    matchRun('change', 'input[name="email"]', (elem) => email = elem.value);
    matchRun('change', 'input[name="password"]', (elem) => password = elem.value);

    function statusCheck(body) {
      switch (body) {
        case 'Not Registered':
          updateDisplay('LOGIN')
          break;
        case 'Not Activated':
          updateDisplay('CONFIRMATION_MESSAGE');
          break;
        case 'Logged In':
          hideLogin();
          break;
        case 'Logged Out':
          updateDisplay('LOGIN')
          break;
        default:

      }
    }


    if (this.credential()) Request.get(EPNTS.user.status(), statusCheck);
    else updateDisplay('LOGIN');
  }
}

User.states = {};
User.states.LOGIN = {
  template: new $t('login/login')
};
User.states.CONFIRMATION_MESSAGE = {
  template: new $t('login/confirmation-message')
};
User.states.CREATE_ACCOUNT = {
  template: new $t('login/create-account')
};
User.states.RESET_PASSWORD = {
  template: new $t('login/reset-password')
};

User.credential = () => getCookie(APP_ID);


User = new User();


class Company {
  constructor(properties) {
    if (!properties.name) throw new Error('Company name must be defined')
    if (Company.list[properties.name] !== undefined) throw new Error('Company name must be unique: name already registered');
    this.name = () => properties.name;
    this.email = () => properties.email;
    this.address = () => properties.address;
    Company.list[this.name()] = this;
  }
}

Company.list = {};
new Company({name: 'Central Door'});
new Company({name: 'Central Wood'});
new Company({name: 'ADC'});
new Company({name: 'Accessa'});
new Company({name: 'Top Knobs'});
new Company({name: 'Richelieu'});


class DisplayManager {
  constructor(displayId, listId, switchId) {
    if (switchId && !listId) throw new Error('switchId can be defined iff listId is defined');
    const id = randomString();
    const instance = this;
    this.list = (func) => {
      const list = [];
      const runFunc = (typeof func) === 'function';
      const displayElems = document.getElementById(displayId).children;
      for (let index = 0; index < displayElems.length; index += 1) {
        const elem = displayElems[index];
        let id = elem.id || randomString(7);
        elem.id = id;
        name = elem.getAttribute('name') || id;
        const item = {id, name};
        if (runFunc) func(elem);
        list.push(item);
      }
      return list;
    }

    function updateActive(id) {
      const items = document.querySelectorAll('.display-manager-input');
      for (let index = 0; index < items.length; index += 1) {
        const elem = items[index];
        elem.getAttribute('display-id') === id ?
              addClass(elem, 'active') : removeClass(elem, 'active');
      }
    }

    function open(id) {
      const displayElems = document.getElementById(displayId).children;
      for (let index = 0; index < displayElems.length; index += 1) {
        const elem = displayElems[index];
        if (elem.id === id) elem.hidden = false;
        else elem.hidden = true;
      }
      updateActive(id);
    }

    this.open = open;

    const children = document.getElementById(displayId).children;

    if (children.length > 0) {
      this.list();
      open(children[0].id);
      if (listId) {
        document.getElementById(listId).innerHTML = DisplayManager.template.render({id, switchId, list: this.list()});
      }
    }

    if (switchId) {
      matchRun('click', `#${switchId}`, (target, event) => {
        const listElem = document.getElementById(listId);
        listElem.hidden = !listElem.hidden;
      });
      document.addEventListener('click', (event) => {
        const listElem = document.getElementById(listId);
        const target = event.target;
        const withinList = up(`#${listId}`, target) !== undefined;
        if (!withinList && target.id !== switchId &&listElem)
          listElem.hidden = true;
      });
    }
    DisplayManager.instances[id] = this;
  }
}

DisplayManager.instances = {};
DisplayManager.template = new $t('display-manager');

matchRun('click', '.display-manager-input', (target, event) => {
  const displayManager = up('.display-manager', target);
  const displayManagerId = displayManager.id;
  const displayId = target.getAttribute('display-id');
  DisplayManager.instances[displayManagerId].open(displayId);
});


// properties
//  required: {
//  getHeader: function returns html header string,
//  getBody: function returns html body string,
//}
//  optional: {
//  list: list to use, creates on undefined
//  getObject: function returns new list object default is generic js object,
//  parentSelector: cssSelector only reqired for refresh function,
//  listElemLable: nameOfElementType changes add button label,
//  hideAddBtn: defaults to false,
//  startClosed: all tabs are closed on list open.
//  input: true - require user to enter text before adding new
//  inputOptions: array of autofill inputs
//  inputs: [{placeholder, autofill},...]
//  inputValidation: function to validate input fields
//  type: defaults to list,
//  selfCloseTab: defalts to true - allows clicking on header to close body,
//  findElement: used to find elemenents related to header - defaults to closest
//}
class ExpandableList {
  constructor(props) {
    const afterRenderEvent = new CustomEvent('afterRender');
    const afterAddEvent = new CustomEvent('afterAdd');
    const afterRefreshEvent = new CustomEvent('afterRefresh');
    const instance = this;
    props.id = ExpandableList.lists.length;
    this.id = () => props.id;
    props.list = props.list || [];
    props.inputs = props.inputs || [];
    props.ERROR_CNT_ID = `expandable-error-msg-cnt-${this.id}`;
    props.inputTreeId = `expandable-input-tree-cnt-${this.id}`
    props.type = props.type || 'list';
    props.findElement = props.findElement || ((selector, target) =>  closest(selector, target));
    this.findElement = props.findElement;
    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
    props.getObject = props.getObject || (() => {});
    let pendingRefresh = false;
    let lastRefresh = new Date().getTime();
    const storage = {};
    props.activeIndex = 0;
    ExpandableList.lists[props.id] = this;

    function setErrorMsg(msg) {
        document.getElementById(props.ERROR_CNT_ID).innerHTML = msg;
    }

    function values() {
      if (instance.hasInputTree()) return props.inputTree.values();
      const values = {};
      props.inputs.forEach((input) =>
        values[input.placeholder] = document.getElementById(input.id).value);
      return values;
    }

    this.add = () => {
      const inputValues = values();
      if ((typeof props.inputValidation) !== 'function' ||
              props.inputValidation(inputValues) === true) {
        props.list.push(props.getObject(inputValues));

        this.activeIndex(props.list.length - 1);
        this.refresh();
        afterAddEvent.trigger();
        if (this.hasInputTree) props.inputTree.formFilled();
      } else {
        const errors = props.inputValidation(inputValues);
        let errorStr;
        if ((typeof errors) === 'object') {
          const keys = Object.keys(errors);
          errorStr = Object.values(errors).join('<br>');
        } else {
          errorStr = `Error: ${errors}`;
        }
        setErrorMsg(errorStr);
      }
    };
    this.hasInputTree = () =>
      props.inputTree && props.inputTree.constructor.name === 'DecisionNode';
    if (this.hasInputTree())
      props.inputTree.onComplete(this.add);
    props.hasInputTree = this.hasInputTree;

    this.isSelfClosing = () => props.selfCloseTab;
    this.remove = (index) => {
      props.list.splice(index, 1);
      this.refresh();
    }
    this.html = () => ExpandableList[`${props.type}Template`].render(props);
    this.afterRender = (func) => afterRenderEvent.on(func);
    this.afterAdd = (func) => afterAddEvent.on(func);
    this.refresh = (type) => {
      props.type = (typeof type) === 'string' ? type : props.type;
      if (!pendingRefresh) {
        pendingRefresh = true;
        setTimeout(() => {
          props.inputs.forEach((input) => input.id = input.id || randomString(7));
          const parent = document.querySelector(props.parentSelector);
          const html = this.html();
          if (parent && html !== undefined) {
            parent.innerHTML = html;
            afterRefreshEvent.trigger();
          }
          pendingRefresh = false;
        }, 100);
      }
    };
    this.activeIndex = (value) => value === undefined ? props.activeIndex : (props.activeIndex = value);
    this.active = () => props.list[this.activeIndex()];
    this.value = (index) => (key, value) => {
      if (props.activeIndex === undefined) props.activeIndex = 0;
      if (index === undefined) index = props.activeIndex;
      if (storage[index] === undefined) storage[index] = {};
      if (value === undefined) return storage[index][key];
      storage[index][key] = value;
    }
    this.set = (index, value) => props.list[index] = value;
    this.get = (index) => props.list[index];
    this.renderBody = (target) => {
      const headerSelector = `.expand-header[ex-list-id='${props.id}'][index='${this.activeIndex()}']`;
      target = target || document.querySelector(headerSelector);
      if (target !== null) {
        const id = target.getAttribute('ex-list-id');
        const list = ExpandableList.lists[id];
        const headers = up('.expandable-list', target).querySelectorAll('.expand-header');
        const bodys = up('.expandable-list', target).querySelectorAll('.expand-body');
        const rmBtns = up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
        headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
        bodys.forEach((body) => body.style.display = 'none');
        rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
        const body = list.findElement('.expand-body', target);
        body.style.display = 'block';
        const index = target.getAttribute('index');
        this.activeIndex(index);
        body.innerHTML = this.htmlBody(index);
        target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
        target.className += ' active';
        afterRenderEvent.trigger();
        // scrollIntoView(target.parentElement, 3, 25, document.body);
      }
    };
    afterRefreshEvent.on(() => {if (!props.startClosed)this.renderBody()});

    this.htmlBody = (index) => props.getBody(props.list[index], index);
    this.getList = () => props.list;
    this.refresh();
  }
}
ExpandableList.lists = [];
ExpandableList.listTemplate = new $t('expandable/list');
ExpandableList.pillTemplate = new $t('expandable/pill');
ExpandableList.sidebarTemplate = new $t('expandable/sidebar');
ExpandableList.getIdAndIndex = (target) => {
  const cnt = up('.expand-header,.expand-body', target);
  const id = Number.parseInt(cnt.getAttribute('ex-list-id'));
  const index = Number.parseInt(cnt.getAttribute('index'));
  return {id, index};
}
ExpandableList.getValueFunc = (target) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].value(idIndex.index);
}

ExpandableList.get = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].get(idIndex.index);
}

ExpandableList.set = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  ExpandableList.lists[idIndex.id].set(idIndex.index, value);
}

ExpandableList.value = (key, value, target) => {
  return ExpandableList.getValueFunc(target)(key, value);
}
matchRun('click', '.expandable-list-add-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  ExpandableList.lists[id].add();
});
matchRun('click', '.expandable-item-rm-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  const index = target.getAttribute('index');
  ExpandableList.lists[id].remove(index);
});
ExpandableList.closeAll = (header) => {
  const hello = 'world';
}

matchRun('click', '.expand-header', (target, event) => {
  const isActive = target.matches('.active');
  const id = target.getAttribute('ex-list-id');
  const list = ExpandableList.lists[id];
  if (list) {
    if (isActive && !event.target.tagName.match(/INPUT|SELECT/)) {
      target.className = target.className.replace(/(^| )active( |$)/g, '');
      list.findElement('.expand-body', target).style.display = 'none';
      list.activeIndex(null);
      target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'none';
    } else if (!isActive) {
      list.renderBody(target);
    }
  }
});


class InformationBar {
  constructor() {
    const container = document.createElement('div');
    container.className = 'information-bar';

    this.show = () => container.hidden = false;
    this.hide = () => container.hidden = true;
    this.update = (html) => container.innerHTML = html;

    document.body.append(container);
  }
}



class Input {
  constructor(props) {
    let hidden = props.hide || false;
    const instance = this;
    this.type = props.type;
    this.label = props.label;
    this.name = props.name;
    this.id = props.id || `input-${randomString(7)}`;
    const forAll = Input.forAll(this.id);
    this.hidden = () => hidden;
    this.hide = () => forAll((elem) => {
      const cnt = up('.input-cnt', elem);
      hidden = cnt.hidden = true;
    });
    this.show = () => forAll((elem) => {
      const cnt = up('.input-cnt', elem);
      hidden = cnt.hidden = false;
    });
    this.placeholder = props.placeholder;
    this.class = props.class;
    this.list = props.list || [];

    let valid;
    let value = props.value;
    props.targetAttr = props.targetAttr || 'value';
    this.targetAttr = () => props.targetAttr;

    props.errorMsg = props.errorMsg || 'Error';

    this.errorMsgId = props.errorMsgId || `error-msg-${this.id}`;
    const idSelector = `#${this.id}`;

    const html = this.constructor.html(this);
    if ((typeof html) !== 'function') throw new Error('props.html must be defined as a function');
    this.html = () =>
     html();

    function valuePriority (func) {
      return (elem, event) => func(elem[props.targetAttr], elem, event);
    }
    this.attrString = () => Input.attrString(this.targetAttr(), this.value());

    function getElem(id) {return document.getElementById(id);}

    this.on = (eventType, func) => matchRun(eventType, idSelector, valuePriority(func));
    this.valid = () => valid === undefined ? this.setValue() : valid;
    this.setValue = (val) => {
      const elem = getElem(this.id);
      if (val === undefined){
        if (elem) val = elem[props.targetAttr]
        if (val === undefined) val = props.default;
      }
      if(this.validation(val)) {
        valid = true;
        value = val;
        if (elem) elem[props.targetAttr] = val;
        return true;
      }
      valid = false;
      value = undefined;
      return false;
    }
    this.value = (typeof value === 'function') ? value() : () => value || '';
    this.doubleCheck = () => {
      valid = undefined;
      validate();
      return valid;
    }
    this.validation = function(val) {
      const elem = getElem(instance.id);
      val = val === undefined && elem ? elem.value : val;
      if (val === undefined) return false;
      if (valid !== undefined && val === value) return valid;
      let valValid = true;
      if (props.validation instanceof RegExp) {
        valValid = val.match(props.validation) !== null;
      }
      else if ((typeof props.validation) === 'function') {
        valValid = props.validation.apply(null, arguments);
      }
      else if (Array.isArray(props.validation)) {
        valValid = props.validation.indexOf(val) !== -1;
      }

      return valValid;
    };

    const validate = (target) => {
      target = target || getElem(instance.id);
      if (target) {
        if (this.setValue(target[props.targetAttr])) {
          getElem(this.errorMsgId).innerHTML = '';
          valid = true;
        } else {
          getElem(this.errorMsgId).innerHTML = props.errorMsg;
          valid = false;
        }
      }
    }

    if (props.clearOnClick) {
      matchRun(`mousedown`, `#${this.id}`, () => {
        const elem = getElem(this.id);
        if (elem) elem.value = '';
      });
    }
    matchRun(`change`, `#${this.id}`, validate);
    matchRun(`keyup`, `#${this.id}`, validate);
  }
}

Input.forAll = (id) => {
  const idStr = `#${id}`;
  return (func) => {
    const elems = document.querySelectorAll(idStr);
    for (let index = 0; index < elems.length; index += 1) {
      func(elems[index]);
    }
  }
}

Input.template = new $t('input/input');
Input.html = (instance) => () => Input.template.render(instance);
Input.flagAttrs = ['checked', 'selected'];
Input.attrString = (targetAttr, value) =>{
  if (Input.flagAttrs.indexOf(targetAttr) !== -1) {
    return value === true ? targetAttr : '';
  }
  return `${targetAttr}='${value}'`
}

Input.id = () => new Input({
  type: 'text',
  placeholder: 'Id',
  name: 'id',
  class: 'center',
  validation: /^\s*[^\s]{1,}\s*$/,
  errorMsg: 'You must enter an Id'
});

Input.propertyId = () => new Input({
  type: 'text',
  placeholder: 'Property Id',
  name: 'propertyId',
  class: 'center',
  validation: /^[a-zA-Z\.]{1}$/,
  errorMsg: 'Alpha Numeric Value seperated by \'.\'.<br>I.E. Cabinet=>1/2 Overlay = Cabinet.12Overlay'
});

Input.propertyValue = () => new Input({
  type: 'text',
  placeholder: 'Property Value',
  name: 'propertyValue',
  class: 'center'
});

Input.CostId = () => new Input({
  type: 'text',
  placeholder: 'Id',
  name: 'id',
  class: 'center',
  validation: (id, values) =>
      id !== '' && (!values.referenceable || Cost.defined.indexOf(id)  === -1),
  errorMsg: 'You must an Id: value must be unique if Referencable.'
});

Input.Name = () => new Input({
  type: 'text',
  placeholder: 'Name',
  name: 'name',
  class: 'center',
  validation: /^\s*[^\s].*$/,
  errorMsg: 'You must enter a Name'
});

Input.color = () => new Input({
  type: 'color',
  validation: /.*/,
  placeholder: 'color',
  name: 'color',
  class: 'center'
});

Input.optional = () => new Input({
  label: 'Optional',
  name: 'optional',
  type: 'checkbox',
  default: false,
  validation: [true, false],
  targetAttr: 'checked'
});

Input.modifyDemension = () => new Input({
  label: 'Modify Demension',
  name: 'modifyDemension',
  type: 'checkbox',
  default: false,
  validation: [true, false],
  targetAttr: 'checked'
});

Input.partNumber = () => new Input({
  label: 'Part Number',
  name: 'partNumber',
  type: 'text'
});

Input.count = (value) => new Input({
  label: 'Count',
  name: 'count',
  type: 'number',
  value: value || 1
});

Input.quantity = (value) => new Input({
  label: 'Quantity',
  name: 'quantity',
  type: 'number',
  value: value || 0
});

Input.hourlyRate = () => new Input({
  label: 'Hourly Rate',
  name: 'hourlyRate',
  type: 'number',
});

Input.hours = (value) => new Input({
  label: 'Hours',
  name: 'hours',
  type: 'number',
  value: value || 0
});

Input.laborType = (type) => new Input({
  name: 'laborType',
  placeholder: 'Labor Type',
  label: 'Type',
  class: 'center',
  clearOnClick: true,
  list: Labor.types,
  value: type
});


class RadioDisplay {
  constructor(radioClass, groupAttr) {
    const selector = (attrVal) => {
      return groupAttr ? `.${radioClass}[${groupAttr}="${attrVal}"]` : `.${radioClass}`;
    }

    const infoBar = new InformationBar();

    function path () {
      let path = '';
      const info = downInfo(`.${radioClass}.open`, `.${radioClass}.close`, document.body);
      info.matches.forEach((obj) => {
        const header = obj.node.children[0];
        if (header && header.getBoundingClientRect().y < 8) {
          path += `${header.innerText}=>`
        }
      });
      return path;
    }

    matchRun('scroll', `*`, (target, event) => {
      infoBar.update(path());
    });

    matchRun('click', `.${radioClass}`, (target, event) => {
      const attrVal = target.getAttribute(groupAttr);
      const hidden = target.children[1].hidden;
      const targetHeader = target.children[0];
      const targetBody = target.children[1];
      targetBody.hidden = !hidden;
      if (hidden) {
        addClass(targetHeader, 'active');
        swapClass(target, 'open', 'close');
        const siblings = document.querySelectorAll(selector(attrVal));
        for (let index = 0; index < siblings.length; index += 1) {
          if (siblings[index] !== target) {
            const sibHeader = siblings[index].children[0];
            const sibBody = siblings[index].children[1];
            swapClass(siblings[index], 'close', 'open');
            sibBody.hidden = true;
            removeClass(sibHeader, 'active');
          }
        }
      } else {
        swapClass(target, 'close', 'open');
        removeClass(targetHeader, 'active');
      }
      infoBar.update(path());
    });
  }
}



ToggleDisplayList = {};
ToggleDisplayList.class = 'toggle-display-list';
ToggleDisplayList.funcs = {};

ToggleDisplayList.onShow = (displayId, func) => {
  if ((typeof func) === 'function') {
    if (ToggleDisplayList.funcs[displayId] === undefined) {
      ToggleDisplayList.funcs[displayId] = [];
    }
    ToggleDisplayList.funcs[displayId].push(func);
  }
}

ToggleDisplayList.runFuncs = (displayId) => {
  if (ToggleDisplayList.funcs[displayId] === undefined) return;
  ToggleDisplayList.funcs[displayId].forEach((func) => func(displayId));
}

ToggleDisplayList.toggle = function (elem, event) {
  const target = event.target;
  const children = elem.children;
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (target === child) {
      addClass(child, 'active');
      const displayId = child.getAttribute('display-id');
      document.getElementById(displayId).hidden = false;
      ToggleDisplayList.runFuncs(displayId);
    } else {
      removeClass(child, 'active');
      document.getElementById(child.getAttribute('display-id')).hidden = true;
    }
  }
}

matchRun('click', `.${ToggleDisplayList.class}`, ToggleDisplayList.toggle);



class AbstractManager {
  constructor(id, name) {
    let list;
    const manager = this;
    this.saveBtnId = `${name}-manager-save-btn`;
    this.headerId = `${name}-manager-header-cnt`;
    this.bodyId = `${name}-manager-body-cnt`;
    this.header = `${name.substr(0,1).toUpperCase()}${name.substr(1)} Manager`;
    const parentSelector = `#${this.bodyId}`;
    const template = new $t('managers/abstract-manager');
    const bodyTemplate = new $t(`managers/${name}/body`);
    const headTemplate = new $t(`managers/${name}/header`);

    const getHeader = (instance) => headTemplate.render({instance, manager});
    const getBody = (instance) => bodyTemplate.render({instance, manager});

    const getObject = (typeof manager.getObject) === 'function' ?
                        (values) => manager.getObject(values) : undefined;

    function init(json) {
      document.getElementById(id).innerHTML = template.render(manager);
      list = manager.fromJson(json) || [];
      const expListProps = {
        inputTree: manager.constructor.inputTree(),
        parentSelector, getHeader, getBody, getObject, list,
        hideAddBtn: true
      };
      const expandList = new ExpandableList(expListProps);

      const saveSuccess = () => console.log('success save');
      const saveFail = () => console.log('failed save');
      const save = (target) => {
        const body = manager.toJson();
        Request.post(manager.savePoint(), body, saveSuccess, saveFail);
      }
      matchRun('click', `#${manager.saveBtnId}`, save);
    }

    afterLoad.push(() => Request.get(manager.loadPoint(), init));
  }
}

AbstractManager.inputTree = () => undefined;


const colors = {
  indianred: [205, 92, 92],
  lightcoral: [240, 128, 128],
  salmon: [250, 128, 114],
  darksalmon: [233, 150, 122],
  lightsalmon: [255, 160, 122],
  white: [255, 255, 255],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  black: [0, 0, 0],
  red: [255, 0, 0],
  maroon: [128, 0, 0],
  yellow: [255, 255, 0],
  olive: [128, 128, 0],
  lime: [0, 255, 0],
  green: [0, 128, 0],
  aqua: [0, 255, 255],
  teal: [0, 128, 128],
  blue: [0, 0, 255],
  navy: [0, 0, 128],
  fuchsia: [255, 0, 255],
  purple: [128, 0, 128]
}

function getColor(name) {
  if(colors[name]) return colors[name];
  return [0,0,0];
}

function Validation() {
  types = {};
  types.int = '^[0-9]{1,}$';
  types.float = `^((\\.[0-9]{1,})|([0-9]{1,}\\.[0-9]{1,}))$|(${types.int})`;
  types.fraction = '^[0-9]{1,}/[0-9]{1,}$';
  types.size = `(${types.float})|(${types.fraction})`;


  let obj = {};
  Object.keys(types).forEach((type) => {
    const regex = new RegExp(types[type]);
    obj[type] = (min, max) => {
      min = Number.isFinite(min) ? min : Number.MIN_SAFE_INTEGER;
      max = Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER;
      return (value) => {
        if ((typeof value) === 'string') {
          if (value.match(regex) === null) return false;
          value = Number.parseFloat(value);
        }
        return value > min && value < max;
      }
    }

  });
  return obj;
}
Validation = Validation();


class ThreeDModel {
  constructor(assembly) {
    const hiddenPartCodes = {};
    const hiddenPartNames = {};
    const hiddenPrefixes = {};
    const instance = this;
    let hiddenPrefixReg;
    let inclusiveTarget = {};

    this.isTarget = (type, value) => {
      return inclusiveTarget.type === type && inclusiveTarget.value === value;
    }
    this.inclusiveTarget = function(type, value) {
      let prefixReg;
      if (type === 'prefix') prefixReg = new RegExp(`^${value}`)
      inclusiveTarget = {type, value, prefixReg};
    }

    function inclusiveMatch(part) {
      if (!inclusiveTarget.type || !inclusiveTarget.value) return null;
      switch (inclusiveTarget.type) {
        case 'prefix':
          return part.partName.match(inclusiveTarget.prefixReg) !== null;
          break;
        case 'part-name':
          return part.partName === inclusiveTarget.value;
        case 'part-code':
          return part.partCode === inclusiveTarget.value;
        default:
          throw new Error('unknown inclusiveTarget type');
      }
    }

    function manageHidden(object) {
      return function (attr, value) {
        if (value === undefined) return object[attr] === true;
       object[attr] = value === true;
       instance.render();
      }
    }

    function buildHiddenPrefixReg() {
      const list = [];
      const keys = Object.keys(hiddenPrefixes);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        if (hiddenPrefixes[key] === true) {
          list.push(key);
        }
      }
      hiddenPrefixReg = list.length > 0 ? new RegExp(`^${list.join('|')}`) : null;
    }

    this.hidePartCode = manageHidden(hiddenPartCodes);
    this.hidePartName = manageHidden(hiddenPartNames);
    this.hidePrefix = manageHidden(hiddenPrefixes);

    function hasHidden(hiddenObj) {
      const keys = Object.keys(hiddenObj);
      for(let i = 0; i < hiddenObj.length; i += 1)
        if (hidden[keys[index]])return true;
      return false;
    }
    this.noneHidden = () => !hasHidden(hiddenPartCodes) &&
        !hasHidden(hiddenPartNames) && !hasHidden(hiddenPrefixes);

    this.depth = (label) => label.split('.').length - 1;

    function hidden(part, level) {
      const im = inclusiveMatch(part);
      if (im !== null) return !im;
      if (instance.hidePartCode(part.partCode)) return true;
      if (instance.hidePartName(part.partName)) return true;
      if (hiddenPrefixReg && part.partName.match(hiddenPrefixReg)) return true;
      return false;
    }

    function coloring(part) {
      if (part.partName && part.partName.match(/.*Frame.*/)) return getColor('blue');
      else if (part.partName && part.partName.match(/.*Drawer.Box.*/)) return getColor('green');
      else if (part.partName && part.partName.match(/.*Handle.*/)) return getColor('silver');
      return getColor('red');
    }

    const randInt = (start, range) => start + Math.floor(Math.random() * range);
    function debugColoring() {
      return [randInt(0, 255),randInt(0, 255),randInt(0, 255)];
    }

    function getModel(assem) {
      const pos = assem.position().current();
      let model;
      if (assem instanceof DrawerBox) {
        model = drawerBox(pos.demension.y, pos.demension.x, pos.demension.z);
      } else if (assem instanceof Handle) {
        model = pull(pos.demension.y, pos.demension.z);
      } else {
        const radius = [pos.demension.x / 2, pos.demension.y / 2, pos.demension.z / 2];
        model = CSG.cube({ radius });
      }
      model.rotate(pos.rotation);
      pos.center.z *= -1;
      model.center(pos.center);
      // serialize({}, model);
      return model;
    }


    this.render = function () {
      const startTime = new Date().getTime();
      buildHiddenPrefixReg();
      function buildObject(assem) {
        let a = getModel(assem);
        a.setColor(...debugColoring(assem));
        assem.getJoints().female.forEach((joint) => {
          const male = joint.getMale();
          const m = getModel(male, male.position().current());
          a = a.subtract(m);
        });
        // else a.setColor(1, 0, 0);
        return a;
      }
      const assemblies = assembly.getParts();
      let a;
      for (let index = 0; index < assemblies.length; index += 1) {
        const assem = assemblies[index];
        if (!hidden(assem)) {
          const b = buildObject(assem);
          if (a === undefined) a = b;
          else if (b && assem.length() && assem.width() && assem.thickness()) {
            a = a.union(b);
          }
        }
      }
      console.log(`Precalculations - ${(startTime - new Date().getTime()) / 1000}`);
      ThreeDModel.viewer.mesh = a.toMesh();
      ThreeDModel.viewer.gl.ondraw();
      console.log(`Rendering - ${(startTime - new Date().getTime()) / 1000}`);
    }
  }
}
const cube = new CSG.cube({radius: [3,5,1]});
ThreeDModel.init = () => {
  const p = pull(5,2);
  const db = drawerBox(10, 15, 22);
  ThreeDModel.viewer = new Viewer(db, 300, 150, 50);
  addViewer(ThreeDModel.viewer, 'three-d-model');
}

ThreeDModel.models = {};
ThreeDModel.get = (assembly) => {
  if (ThreeDModel.models[assembly.uniqueId] === undefined) {
    ThreeDModel.models[assembly.uniqueId] = new ThreeDModel(assembly);
  }
  return ThreeDModel.models[assembly.uniqueId];
}
ThreeDModel.render = (part) => {
  const renderId = randomString();
  ThreeDModel.renderId = renderId;
  setTimeout(() => {
    if(ThreeDModel.renderId === renderId) ThreeDModel.get(part).render();
  }, 250);
};


function displayPart(part) {
  return true;
}

function groupParts(cabinet) {
  const grouping = {displayPart, group: {groups: {}, parts: {}, level: 0}};
  const parts = cabinet.getParts();
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const namePieces = part.partName.split('.');
    let currObj = grouping.group;
    let level = 0;
    let prefix = '';
    for (let nIndex = 0; nIndex < namePieces.length - 1; nIndex += 1) {
      const piece = namePieces[nIndex];
      prefix += piece;
      if (currObj.groups[piece] === undefined) currObj.groups[piece] = {groups: {}, parts: []};
      currObj = currObj.groups[piece];
      currObj.groups = ++level;
      currObj.prefix = prefix;
      prefix += '.'
    }
    if (currObj.parts[part.partName] === undefined) currObj.parts[part.partName] = [];
    currObj.parts[part.partName].push(part);
  }
  return grouping;
}

const modelContTemplate = new $t('model-controller')
const stateReg = /( |^)(small|large)( |$)/;
matchRun('click', '#max-min-btn', (target) => {
  const className = target.parentElement.className;
  const controller = document.getElementById('model-controller');
  const state = className.match(stateReg);
  const clean = className.replace(new RegExp(stateReg, 'g'), '').trim();
  if (state[2] === 'small') {
    target.parentElement.className = `${clean} large`;
    const cabinet = orderDisplay.active().cabinet();
    if (cabinet) {
      const grouping = groupParts(cabinet);
      grouping.tdm = ThreeDModel.get(cabinet);
      controller.innerHTML = modelContTemplate.render(grouping);
    }
    controller.hidden = false;
  } else {
    target.parentElement.className = `${clean} small`;
    controller.hidden = true;
  }
});


matchRun('click', '.model-label', (target) => {
  if (event.target.tagName === 'INPUT') return;
  const has = hasClass(target, 'active');
  deselectPrefix();
  !has ? addClass(target, 'active') : removeClass(target, 'active');
  let label = target.children[0]
  let type = label.getAttribute('type');
  let value = type !== 'prefix' ? label.innerText :
        label.nextElementSibling.getAttribute('prefix');
  const cabinet = orderDisplay.active().cabinet();
  const tdm = ThreeDModel.get(cabinet);
  tdm.inclusiveTarget(type, has ? undefined : value);
  tdm.render();
});

function deselectPrefix() {
  document.querySelectorAll('.model-label')
    .forEach((elem) => removeClass(elem, 'active'));
  const cabinet = orderDisplay.active().cabinet();
  const tdm = ThreeDModel.get(cabinet);
  tdm.inclusiveTarget(undefined, undefined);
}

matchRun('click', '.prefix-switch', (target, event) => {
  const eventTarg = event.target;
  const active = upAll('.model-selector', target);
  active.push(target.parentElement.parentElement);
  const all = document.querySelectorAll('.prefix-body');
  all.forEach((pb) => pb.hidden = true);
  active.forEach((ms) => ms.children[0].children[1].hidden = false);
});

matchRun('change', '.prefix-checkbox', (target) => {
  const cabinet = orderDisplay.active().cabinet();
  const attr = target.getAttribute('prefix');
  deselectPrefix();
  ThreeDModel.get(cabinet).hidePrefix(attr, !target.checked);
});

matchRun('change', '.part-name-checkbox', (target) => {
  const cabinet = orderDisplay.active().cabinet();
  const attr = target.getAttribute('part-name');
  deselectPrefix();
  const tdm = ThreeDModel.get(cabinet);
  tdm.hidePartName(attr, !target.checked);
  tdm.render();
});

matchRun('change', '.part-code-checkbox', (target) => {
  const cabinet = orderDisplay.active().cabinet();
  const attr = target.getAttribute('part-code');
  deselectPrefix();
  const tdm = ThreeDModel.get(cabinet);
  tdm.hidePartCode(attr, !target.checked);
  tdm.render();
})


function updateModel(part) {
  const cabinet = part.getAssembly('c');
  ThreeDModel.render(cabinet);
}




class CabinetDisplay {
  constructor(room) {
    const propertySelectors = {};
    const parentSelector = `[room-id="${room.id}"].cabinet-cnt`;
    let propId = 'Half Overlay';
    const instance = this;
    this.propId = (id) => {
      if (id ===  undefined) return propId;
      propId = id;
    }
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({room, cabinet, $index});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      if (propertySelectors[cabinet.uniqueId] === undefined)
        propertySelectors[cabinet.uniqueId] = Select.propertyId(cabinet.propertyId());
      if (expandList.activeIndex() === $index)
        ThreeDModel.render(cabinet);
      const selectHtml = propertySelectors[cabinet.uniqueId].html();
      const scope = {room, $index, cabinet, showTypes, OpenSectionDisplay, selectHtml};
      return CabinetDisplay.bodyTemplate.render(scope);
    }

    function inputValidation(values) {
      const validName = values.name !== undefined;
      const validType = CabinetConfig.valid(values.type, values.id);
      if(validType) return true;
      return {type: 'You must select a defined type.'};
    }
    const getObject = (values) => {
      return CabinetConfig.get(values.name, values.type, values.propertyId, values.id);
    };
    this.active = () => expandList.active();
    const expListProps = {
      list: room.cabinets,
      inputTree:   CabinetConfig.inputTree(),
      parentSelector, getHeader, getBody, getObject, inputValidation,
      listElemLable: 'Cabinet'
    };
    const expandList = new ExpandableList(expListProps);
    this.refresh = () => expandList.refresh();

    const cabinetKey = (path) => {
      const split = path.split('.');
      const index = split[0];
      const key = split[1];
      const cabinet = expListProps.list[index];
      return {cabinet, key};
    }

    const valueUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      cabKey.cabinet.value(cabKey.key, new Measurement(value).decimal());
      ThreeDModel.render(cabKey.cabinet);
    }

    const attrUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      cabKey.cabinet[cabKey.key] = value;
    }

    const saveSuccess = () => console.log('success');
    const saveFail = () => console.log('failure');
    const save = (target) => {
      const index = target.getAttribute('index');
      const cabinet = expListProps.list[index];
      if (cabinet.name !== undefined) {
        Request.post(EPNTS.cabinet.add(cabinet.name), cabinet.toJson(), saveSuccess, saveFail);
        console.log('saving');
      } else {
        alert('Please enter a name if you want to save the cabinet.')
      }
    }

    CabinetConfig.onUpdate(() => props.inputOptions = CabinetConfig.list());
    bindField(`[room-id="${room.id}"].cabinet-input`, valueUpdate, Measurement.validation('(0,)'));
    bindField(`[room-id="${room.id}"].cabinet-id-input`, attrUpdate);
    matchRun('click', '.save-cabinet-btn', save);
  }
}
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');


class FeatureDisplay {
  constructor(assembly, parentSelector) {
    this.html = () => FeatureDisplay.template.render({features: assembly.features, id: 'root'});
    this.refresh = () => {
      const container = document.querySelector(parentSelector);
      container.innerHTML = this.html;
    }
  }
}
FeatureDisplay.template = new $t('features');





// constructors
// Cost({id, Method: Cost.methods.LINEAR_FEET, cost, length})
// Cost({id, Method: Cost.methods.SQUARE_FEET, cost, length, width})
// Cost({id, Method: Cost.methods.CUBIC_FEET, cost, length, width, depth})
// Cost({id, Method: Cost.methods.UNIT, cost})
// Cost((id, Cost, formula));
// props. - (optional*)
// id - Cost identifier
// method - Method for calculating cost
// length - length of piece used to calculate unit cost
// width - width of piece used to calculate unit cost
// depth - depth of piece used to calculate unit cost
// cost - cost of piece used to calculate unit cost
// formula* - formula used to apply cost to part
// company* - Company to order from.
// partNumber* - Part number to order part from company
// Cost* - Reference Cost.

class Cost {
  //constructor(id, Cost, formula)
  constructor(props) {
    this.props = () => JSON.parse(JSON.stringify(props));
    props = this.props();
    const instance = this;
    const uniqueId = randomString();
    const lastUpdated = props.lastUpdated || new Date().getTime();
    this.lastUpdated = new Date(lastUpdated).toLocaleDateString();
    this.uniqueId = () => uniqueId;
    this.objectId = Cost.getterSetter(props, 'objectId');
    this.id = Cost.getterSetter(props, 'id');
    this.children = props.children || [];

    if (props.objectId !== undefined) {
      if (Cost.objMap[props.objectId] === undefined) Cost.objMap[props.objectId] = [];
      Cost.objMap[props.objectId].push(this);
    }

    if (!(this instanceof ReferenceCost)) {
      Cost.unique[props.id] = this;
      if (props.referenceable) Cost.defined.push(this.id());
    }

    this.addChild = (cost) => {
      if (cost instanceof Cost) {
        this.children.push(cost);
      }
    }
    const cName = this.constructor.name;
    if (Cost.lists[cName] === undefined) Cost.lists[cName] = {};
    Cost.lists[cName][props.id] = this;

    this.toJson = () => {
      const json = {
        type: Cost.constructorId(this.constructor.name),
        id: this.id(),
        objectId: this.objectId(),
        lastUpdated: lastUpdated,
        children
      };
      const children = [];
      this.children.forEach((child) => children.push(child.toJson()));
      const reqProps = this.constructor.requiredProps || [];
      reqProps.forEach((prop) => json[prop] = this[prop]());
      return json;
    }
  }
}


Cost.getterSetter = (obj, attr, validation) => (val) => {
  if (val && validation && validation(val)) obj[attr] = val;
  if (validation && !validation(obj[attr])) throw new Error(`Invalid Cost Value ${obj[attr]}`);
  return obj[attr];
}
Cost.unique = {};
Cost.defined = ['Custom'];
Cost.lists = {};
Cost.objMap = {};
Cost.types = [];
Cost.get = (id) => {
  const listsKeys = Object.keys(Cost.lists);
  for (let index = 0; index < listsKeys.length; index += 1) {
    if (Cost.lists[listsKeys[index]][id]) return Cost.lists[listsKeys[index]][id];
  }
  return undefined;
};

Cost.freeId = (id) => Cost.get(id) === undefined;

Cost.constructorId = (name) => name.replace(/Cost$/, '');
Cost.register = (clazz) => {
  Cost.types[Cost.constructorId(clazz.prototype.constructor.name)] = clazz;
  Cost.typeList = Object.keys(Cost.types).sort();
}

Cost.new = function(propsOreference) {
  let constructer;
  if (propsOreference instanceof Cost)
    constructer = Cost.types[Cost.constructorId(propsOreference.constructor.name)];
  else constructer = Cost.types[Cost.constructorId(propsOreference.type)]
  return new constructer(propsOreference)
}

Cost.fromJson = (objOrArray) => {
  function instanceFromJson(obj) {
    const cost = Cost.new(obj);
    obj.children.forEach((childJson) => cost.addChild(Cost.fromJson(childJson)));
    return cost;
  }
  if (!Array.isArray(objOrArray)) return instanceFromJson(objOrArray);

  const list = [];
  objOrArray.forEach((obj) => list.push(instanceFromJson(obj)));
  return list;
}

Cost.toJson = (array) => {
  if (!Array.isArray(array)) throw new Error('Input argument must be of type Array');
  const list = [];
  array.forEach((cost) => {
    if (!(cost instanceof Cost)) throw new Error('All array object must be of type Cost');
    list.push(cost.toJson())
  });
  return list;
}

afterLoad.push(() =>
  Cost.evaluator = new StringMathEvaluator(null, (attr, assem) => Assembly.resolveAttr(assem, attr))
);



class Room {
  constructor(name, id) {
    this.name = name || `Room ${Room.count++}`;
    this.id = id || randomString(32);
    this.cabinets = [];
    this.toJson = () => {
      const json = {name: this.name, id: this.id, cabinets: []};
      this.cabinets.forEach((cabinet) => json.cabinets.push(cabinet.toJson()));
      return json;
    };
  }
};
Room.count = 0;
Room.fromJson = (roomJson) => {
  const room = new Room(roomJson.name, roomJson.id);
  roomJson.cabinets.forEach((cabJson) => room.cabinets.push(Cabinet.fromJson(cabJson)));
  return room;
}


class Order {
  constructor(name, id) {
    this.name = name || ++Order.count;
    this.id = id || randomString(32);
    this.rooms = []
    this.toJson = () => {
      const json = {name: this.name, rooms: []};
      this.rooms.forEach((room) => json.rooms.push(room.toJson()));
      return json;
    }
  }
}

Order.count = 0;
Order.fromJson = (orderJson) => {
  const order = new Order(orderJson.name, orderJson.id);
  orderJson.rooms.forEach((roomJson) => order.rooms.push(Room.fromJson(roomJson)));
  return order;
}


const OpenSectionDisplay = {};

OpenSectionDisplay.html = (opening) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  opening.init();
  OpenSectionDisplay.sections[opening.uniqueId] = opening;
  setTimeout(() => OpenSectionDisplay.refresh(opening), 100);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  return OpenSectionDisplay.template.render({opening, openDispId, patternInputHtml});
}

OpenSectionDisplay.getSelectId = (opening) => `opin-division-pattern-select-${opening.uniqueId}`;
OpenSectionDisplay.template = new $t('opening');
OpenSectionDisplay.listBodyTemplate = new $t('divide/body');
OpenSectionDisplay.listHeadTemplate = new $t('divide/head');
OpenSectionDisplay.sections = {};
OpenSectionDisplay.lists = {};
OpenSectionDisplay.getId = (opening) => `open-section-display-${opening.uniqueId}`;

OpenSectionDisplay.getList = (root) => {
  let openId = root.uniqueId;
  if (OpenSectionDisplay.lists[openId]) return OpenSectionDisplay.lists[openId];
  const sections = Section.sections();
  const getObject = (target) => sections[Math.floor(Math.random()*sections.length)];
  const parentSelector = `#${OpenSectionDisplay.getId(root)}`
  const list = root.sections;
  const hideAddBtn = true;
  const selfCloseTab = true;
  let exList;
  const clean = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
  const getHeader = (opening, index) => {
    const sections = index % 2 === 0 ? Section.getSections(false) : [];
    return OpenSectionDisplay.listHeadTemplate.render({opening, sections, clean});
  }
  const getBody = (opening) => {
    const list = OpenSectionDisplay.getList(root);
    const getFeatureDisplay = (assem) => new FeatureDisplay(assem).html();
    const assemblies = opening.getSubAssemblies();
    return Section.render({assemblies, getFeatureDisplay, opening, list, sections});
  }
  const findElement = (selector, target) => down(selector, up('.expandable-list', target));
  const expListProps = {
    parentSelector, getHeader, getBody, getObject, list, hideAddBtn,
    selfCloseTab, findElement, startClosed: true
  }
  exList = new ExpandableList(expListProps);
  OpenSectionDisplay.lists[openId] = exList;
  return exList;
}
OpenSectionDisplay.dividerControlTemplate = new $t('divider-controls');
OpenSectionDisplay.updateDividers = (opening) => {
  const selector = `[opening-id="${opening.uniqueId}"].opening-cnt > .divider-controls`;
  const dividerControlsCnt = document.querySelector(selector);
  const selectPatternId = OpenSectionDisplay.getSelectId(opening);
  bindField(`#${selectPatternId}`, (g, p) => opening.pattern(p), /.*/);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  dividerControlsCnt.innerHTML = OpenSectionDisplay.dividerControlTemplate.render(
          {opening, selectPatternId, patternInputHtml});
}

OpenSectionDisplay.changeIds = {};
OpenSectionDisplay.refresh = (opening) => {
  let changeId = (OpenSectionDisplay.changeIds[opening.uniqueId] || 0) + 1;
  OpenSectionDisplay.changeIds[opening.uniqueId] = changeId;
  setTimeout(()=> {
    if (changeId === OpenSectionDisplay.changeIds[opening.uniqueId]) {
      const id = OpenSectionDisplay.getId(opening);
      const target = document.getElementById(id);
      const listCnt = up('.expandable-list', target);
      const listId = Number.parseInt(listCnt.getAttribute('ex-list-id'));

      const type = opening.isVertical() === true ? 'pill' : 'sidebar';
      OpenSectionDisplay.updateDividers(opening);
      OpenSectionDisplay.getList(opening).refresh(type);
      const dividerSelector = `[opening-id='${opening.uniqueId}'].division-count-input`;
      // listCnt.querySelector(dividerSelector).focus();
    }
  }, 500);
}

OpenSectionDisplay.patternContainerSelector = (opening) =>
  `.open-pattern-input-cnt[opening-id='${opening.uniqueId}']`;

OpenSectionDisplay.lastInputValues = {};
OpenSectionDisplay.patterInputHtml = (opening) => {
  const pattern = opening.pattern();
  const patCntSelector = OpenSectionDisplay.patternContainerSelector(opening);

  let inputHtml = '';
  for (let index = 0; index < pattern.unique.length; index += 1) {
    const id = pattern.unique[index];
    let fill = opening.dividerLayout().fill;
    const measInput = MeasurementInput.pattern(id, pattern.value(id));
    measInput.on('keyup', (value, target) => {
      opening.pattern().value(target.name, OpenSectionDisplay.evaluator.eval(target.value));
      fill = opening.dividerLayout().fill;
      const patternCnt = document.querySelector(patCntSelector);
      const inputs = patternCnt.querySelectorAll('input');
      fill.forEach((value, index) => {
        if (inputs[index] !== target)
          inputs[index].value = value;
      });
      if (opening.pattern().satisfied()) {
        const cabinet = opening.getAssembly('c');
        ThreeDModel.render(cabinet);
      }
    });
    inputHtml += measInput.html();
  }
  return inputHtml;
};

OpenSectionDisplay.getOpening = (target) => {
  const openId = target.getAttribute('opening-id');
  return OpenSectionDisplay.sections[openId];
}

OpenSectionDisplay.evaluator = new StringMathEvaluator();
OpenSectionDisplay.patternInputChange = (target) => {
  const opening = OpenSectionDisplay.getOpening(up('.open-pattern-input-cnt', target));
  opening.pattern().value(target.name, OpenSectionDisplay.evaluator(target.value));
  if (opening.pattern().satisfied()) {
    OpenSectionDisplay.refresh(opening);
  }
};

OpenSectionDisplay.patternInputSelector = (opening) =>
  `[name='pattern'][opening-id='${opening.uniqueId}']`;

OpenSectionDisplay.onPatternChange = (target) => {
  const opening = OpenSectionDisplay.getOpening(target);
  const newVal = target.value || 'a';
  const cntSelector = OpenSectionDisplay.patternContainerSelector(opening);
  const inputCnt = document.querySelector(OpenSectionDisplay.patternContainerSelector(opening));
  if (opening.pattern().str !== newVal) {
    opening.pattern(newVal).str;
    const html = OpenSectionDisplay.patterInputHtml(opening);
    document.querySelector(cntSelector).innerHTML = html;
    OpenSectionDisplay.refresh(opening);
    const cabinet = opening.getAssembly('c');
    ThreeDModel.render(cabinet);
  }
  if (inputCnt !== null) {
    inputCnt.hidden = opening.pattern().equal;
  }
}

OpenSectionDisplay.onOrientation = (target) => {
  const openId = target.getAttribute('open-id');
  const value = target.value;
  const opening = OpenSectionDisplay.sections[openId];
  opening.vertical(value === 'vertical');
  OpenSectionDisplay.refresh(opening);
};

OpenSectionDisplay.onSectionChange = (target) => {
  ExpandableList.value('selected', target.value, target);
  const section = ExpandableList.get(target);
  const index = ExpandableList.getIdAndIndex(target).index;
  section.parentAssembly.setSection(target.value, index);
  OpenSectionDisplay.refresh(section.parentAssembly);
  updateModel(section);
}

matchRun('keyup', '.division-pattern-input', OpenSectionDisplay.onPatternChange);
matchRun('keyup', '.patternInput', OpenSectionDisplay.patternInputChange);
matchRun('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
matchRun('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)


class SelectCost extends Cost {
  constructor (props) {
    super(props);
    props = this.props();
    this.modifyDemension = Cost.getterSetter(props, 'modifyDemension');
    this.default = Cost.getterSetter(props, 'default');

    const selected = 0;
    this.selected = (index) => {
      if (index !== undefined) this.selected(index);
      return this.children[this.selected()];
    }

    this.selectedId = () => {
      const child = this.selected();
      return child === undefined ? '' : child.id();
    }

    this.calc = (assemblyOrCount) => this.children[selected] ?
        this.children[selected].calc(assemblyOrCount) : -0.01;

    this.unitCost = () => this.children[selected] ?
        this.children[selected].unitCost() : -0.01;

    const selectedId = this.selectedId();
    if (selectedId) {
      this.children.forEach((child, index) => {
        if (child.id() === selectedId) selected = index;
      });
    }
  }
}

SelectCost.requiredProps = ['modifyDemension', 'default', 'selectedId'];

Cost.register(SelectCost);


class Select extends Input {
  constructor(props) {
    super(props);
    let value = props.index && props.list[props.index] ?
      props.list[props.index] : props.list[0];
    value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
    props.value = undefined;
    this.setValue(value);

    this.selected = (value) => value === this.value();
  }
}

Select.template = new $t('input/select');
Select.html = (instance) => () => Select.template.render(instance);

Select.costType = () => new Select({
  placeholder: 'Type',
  name: 'type',
  class: 'center',
  list: Cost.typeList
});

Select.method = () => new Select({
  name: 'method',
  class: 'center',
  list: Material.methodList,
});

Select.propertyConditions = () => new Select({
  name: 'propertyCondition',
  class: 'center',
  list: Object.values(ConditionalCost.conditions)
});

Select.propertyId = (name) => new Select({
  name: 'propertyId',
  class: 'center',
  list: Object.keys(properties.list),
  value: name
});

Select.company = () => new Select({
  name: 'company',
  label: 'Company',
  class: 'center',
  list: [''].concat(Object.keys(Company.list)),
  value: ''
});

Select.cost = (cost) => {
  const childIds = ['None'].concat(cost.children.map((obj) => obj.id()));
  return new Select({
    name: 'child',
    label: 'Default',
    class: 'center',
    list: childIds,
    value: cost.selectedId()
  })
};



/**
  A branching cost that will incorporate
**/
class Category extends Cost {
  constructor (props) {
    super(props);

    this.calc = (assemblyOrCount) => {
      const cost = 0;
      this.children.forEach((child) => child.calc(assemblyOrCount));
      return cost || -0.01;
    }

    this.unitCost = () => undefined;
  }
}

Category.explanation = `A branching cost that will incorporate all child costs 
                        in its total`
Cost.register(Category);


class ConditionalCost extends Category {
  constructor (props) {
    super(props);
    props = this.props();
    this.propertyId = Cost.getterSetter(props, 'propertyId');
    this.propertyValue = Cost.getterSetter(props, 'propertyValue');
    this.propertyCondition = Cost.getterSetter(props, 'propertyCondition',
                              ConditionalCost.isCondition);
    this.categoryCalc = this.calc;
    this.calc = (assembly) => ConditionalCost.calc(this, assembly);
  }
}

ConditionalCost.requiredProps = ['propertyId', 'propertyValue', 'propertyCondition'];
ConditionalCost.toKey = (value) => new String(value).replace(/ /g, '_').toUpperCase();

ConditionalCost.conditions = {};
ConditionalCost.conditions.EQUAL = 'Equals';
ConditionalCost.conditions.NOT_EQUAL = 'Not Equal';
ConditionalCost.conditions.LESS_THAN = 'Less Than';
ConditionalCost.conditions.GREATER_THAN = 'Greater Than';
ConditionalCost.conditions.LESS_THAN_OR_EQUAL = 'Less Than Or Equal';
ConditionalCost.conditions.GREATER_THAN_OR_EQUAL = 'Greater Than Or Equal';

ConditionalCost.isCondition = (value) => ConditionalCost
                      .conditions(ConditionalCost.toKey(value)) !== undefined;

ConditionalCost.calc = (cost, assembly) => {
  let validationFunc;
  switch (cost.propertyCondition()) {
    case ConditionalCost.conditions.EQUAL:
      validationFunc = (value) => cost.propertyValue() === value;
      break;
    case ConditionalCost.conditions.NOT_EQUAL:
      validationFunc = (value) => cost.propertyValue() !== value;
      break;
    case ConditionalCost.conditions.LESS_THAN:
      validationFunc = (value) => cost.propertyValue() > value;
      break;
    case ConditionalCost.conditions.GREATER_THAN:
      validationFunc = (value) => cost.propertyValue() < value;
      break;
    case ConditionalCost.conditions.LESS_THAN_EQUAL:
      validationFunc = (value) => cost.propertyValue() >= value;
      break;
    case ConditionalCost.conditions.GREATER_THAN_EQUAL:
      validationFunc = (value) => cost.propertyValue() <= value;
      break;
    default:
      throw new Error('Some how you managed to have an invalid Condition');
  }

  const value = assembly.value(cost.propertyId);
  if (validationFunc(value)) {
    return cost.categoryCalc(assembly);
  }
  return 0;
}


ConditionalCost.explanation = `A cost that is applied if the a defined
                                condition is met`;

Cost.register(ConditionalCost);



class ReferenceCost extends Cost {
  constructor(referenceCost, props) {
    super(referenceCost.props());
    this.children = [];
    referenceCost.children.forEach((child) => this.children.push(child));

    this.id = referenceCost.id;
    this.partNumber = referenceCost.partNumber;

    this.method = referenceCost.method;
    this.length = referenceCost.length;
    this.width = referenceCost.width;
    this.depth = referenceCost.depth;
    this.cost = referenceCost.cost;

    this.calc = referenceCost.calc;
  }
}


function pull(length, height) {
  var rspx = length - .75;
  var rCyl = CSG.cylinder({start: [rspx, .125, .125-height], end: [rspx, .125, .125], radius: .25})
  var lCyl = CSG.cylinder({start: [.75, .125, .125 - height], end: [.75, .125, .125], radius: .25})
  var mainCyl = CSG.cylinder({start: [0, .125, .125], end: [length, .125, .125], radius: .25})
  return mainCyl.union(lCyl).union(rCyl);
}


function drawerBox(length, width, depth) {
  const bottomHeight = 7/8;
  const box = CSG.cube({demensions: [width, length, depth], center: [0,0,0]});
  box.setColor(1, 0, 0);
  const inside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, bottomHeight, 0]});
  inside.setColor(0, 0, 1);
  const bInside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, (-length) + (bottomHeight) - 1/4, 0]});
  bInside.setColor(0, 0, 1);

  return box.subtract(bInside).subtract(inside);
}


class UFObj {
  constructor(order) {
    class Row {
      constructor(assembly, index) {
        this.cabnetId = index;//assembly.getAssembly('c').name;
        this.type = assembly.constructor.name;
        this.partName = assembly.partName.replace(/.*\.(.*)/, '$1');
        const dems = assembly.position().demension();
        const accuracy = undefined; //'1/32';
        dems.y = new Measurement(dems.y).fraction(accuracy);
        dems.x = new Measurement(dems.x).fraction(accuracy);
        dems.z = new Measurement(dems.z).fraction(accuracy);
        this.size = `${dems.y} x ${dems.x} x ${dems.z}`;
        this.partCode = `${index}-${assembly.partCode}`;
        this.cost = '$0';
        this.notes = assembly.notes || '';
      }
    }
    const cabinets = [];
    const array = [];
    order.rooms.forEach((room) => room.cabinets.forEach((cabinet, index) => {
      array.push(new Row(cabinet, index));
      cabinet.getParts().forEach((part) => array.push(new Row(part, index)));
    }));
    return array;
  }
}




const costTypes = ['Custom'];
class CostManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const list = [];

    this.toJson = () => {
      const json = {};
      list.forEach((listObj) => {
        json[listObj.partId] = [];
          listObj.expandList.getList().forEach((cost) =>
              json[listObj.partId].push(cost.toJson()));
      });
      return json;
    };

    this.loadPoint = () => EPNTS.costs.get();
    this.savePoint = () => EPNTS.costs.save();
    this.costTypeHtml = CostManager.costTypeHtml;
    this.fromJson = (json) => {
      CostManager.partList = CostManager.partList ||
          ['Opening'].concat(Object.keys(Assembly.classes)
              .filter((id) => !id.match(/^.*Section$/)));
      CostManager.partList.sort();
      CostManager.partList.forEach((id) => {
        const parentId = `cost-group-${randomString()}`;
        const expListProps = {
          list: json[id] ? Cost.fromJson(json[id]) : [],
          inputValidation: () => true,
          parentId,
          parentSelector: `#${parentId}`,
          inputTree:   CostManager.costInputTree(costTypes, id),
          getHeader: CostManager.costHeader,
          getBody: CostManager.costBody,
          getObject: CostManager.getCostObject(id),
          listElemLable: 'Cost'
        };
        const cost = new Category({id, referenceable: true, children: expListProps.list});
        const requiredProps = assemProperties(id);
        const expandList = new ExpandableList(expListProps);
        list.push({partId: id, expandList, requiredProps,
          CostManager: CostManager, parentId, cost});
      });
      propertyDisplay.update();
      return list;
    }

    this.Cost = Cost;
    this.globalProps = () => assemProperties(name)

    const getHeader = (costGroup) => CostManager.costHeadTemplate(costGroup.instance);
    const getBody = (costGroup) => CostManager.costBodyTemplate(costGroup.instance);
    const getObject = (values) => {
      const obj = {partId: values.partId, costs: []};
      return obj;
    }
  }
}

CostManager.headTemplate = new $t('managers/cost/head');
CostManager.bodyTemplate = new $t('managers/cost/body');
CostManager.costHeadTemplate = new $t('managers/cost/cost-head');
CostManager.costBodyTemplate = new $t('managers/cost/cost-body');
CostManager.cntClass = 'cost-manager-reference-cnt';
CostManager.selectInput = (cost) => Select.cost(cost);

CostManager.setInstanceProps = (scope) => {
  const parent = document.getElementById(scope.parentId);
  if (scope.instanceProps !== undefined) return scope;
  if (parent === null) return undefined;



  const expandLists = upAll('.expand-body', parent);
  let instanceProps = {};
  if (expandLists.length === 2) {
    const partId = expandLists[1].parentElement.children[1].children[0]
                      .getAttribute('part-id');
    scope.instanceProps = assemProperties(partId).instance;
  }
}

CostManager.childScopes = {};
CostManager.childScope = (cost) => {
  if (CostManager.childScopes[cost.uniqueId()] === undefined) {
    const parentId = `cost-child-group-${randomString()}`;
    const expListProps = {
      list: cost.children,
      inputValidation: () => true,
      parentSelector: `#${parentId}`,
      inputTree:   CostManager.costInputTree(costTypes, undefined),
      getHeader: CostManager.costHeader,
      getBody: CostManager.costBody,
      getObject: CostManager.getCostObject(cost.id()),
      listElemLable: 'Cost'
    };
    const expandList = new ExpandableList(expListProps);

    CostManager.childScopes[cost.uniqueId()] = {expandList, cost, parentId,
          CostManager};
  }
  const scope = CostManager.childScopes[cost.uniqueId()];
  CostManager.setInstanceProps(scope);
  return scope;
}

CostManager.getCostObject = (id) => (values) => {
  const obj = CostManager.getObject(values);
  if (values.referenceable) costTypes.push(values.id);
  return obj;
};

CostManager.typeTemplates = {};
CostManager.costTypeHtml = (cost, scope) => {
  const constName = cost.constructor.name;
  if (CostManager.typeTemplates[constName])
    return CostManager.typeTemplates[constName].render(scope);
  const fileId = `managers/cost/types/${Cost.constructorId(constName).toLowerCase()}`;
  if ($t.isTemplate(fileId)) {
    template = new $t(fileId);
    CostManager.typeTemplates[constName] = template;
    return template.render(scope);
  }
  return 'nada';
}



CostManager.isInstance = (target) => upAll('.expandable-list', el).length === 2;
CostManager.costHeader = (cost) => CostManager.costHeadTemplate.render(cost);
CostManager.costBody = (cost) => CostManager.costBodyTemplate.render(CostManager.childScope(cost));
CostManager.getObject = (values) => {
  if (values.costType === 'Custom') {
    return Cost.new(values);
  } else {
    const referenceCost = Cost.get(values.costType);
    if (referenceCost === undefined) throw new Error('Invalid Cost reference name');
    return Cost.new({type: referenceCost.constructor.name, referenceCost, formula: values.formula});
  }
}

afterLoad.push(() => {
  // Todo do a valid test for input... probably need to make a sample cabinet
  const sectionScope = {l: 0, w:0, d:0, fpt: 0, fpb: 0, fpr: 0, fpl: 0, ppt: 0, ppb: 0, ppl: 0, ppr: 0};
  const defaultScope = {l: 0, w:0, d:0};
  const sectionEval = new StringMathEvaluator(sectionScope);
  const defaultEval = new StringMathEvaluator(defaultScope);
  const sectionObjs = ['Door', 'DrawerFront', 'DrawerBox', 'Opening'];

  const validate = (objId, type) => (formula) => {
    if (type === 'Labor' || sectionObjs.indexOf(objId) === -1)
      return !Number.isNaN(defaultEval.eval(formula));
    return !Number.isNaN(sectionEval.eval(formula));
  }

  const sectionInput = () => new Input({
    name: 'formula',
    placeholder: 'Formula',
    validation: validate('Door'),
    class: 'center',
    errorMsg: `Invalid Formula: allowed variables...
    <br>l - length
    <br>w - width
    <br>d - depth/thickness
    <br>fp[tblr] - Frame postion [top, bottom, left, right]
    <br>pp[tblr] - Panel Postion [top, bottom, left, right]`
  });
  const defaultInput = () => new Input({
    name: 'formula',
    placeholder: 'Formula',
    validation: validate(),
    class: 'center',
    errorMsg: `Invalid Formula: allowed variables...
    <br>l - length
    <br>w - width
    <br>d - depth/thickness`
  });

  CostManager.formulaInput = (objId, type) => {
    if (type === 'Labor' ||
          sectionObjs.indexOf(objId) === -1)
      return defaultInput();
    return sectionInput();
  };
});

CostManager.costInputTree = (costTypes, objId, onUpdate) => {
  const costTypeSelect = new Select({
    name: 'costType',
    value: 'Custom',
    class: 'center',
    list: Cost.defined
  });
  const reference = new Input({
    name: 'referenceable',
    label: 'Referenceable',
    type: 'checkbox',
    default: false,
    validation: [true, false],
    targetAttr: 'checked',
    value: objId === undefined ? false : true,
  });
  const objectId = new Input({
    name: 'objectId',
    hide: true,
    value: objId
  });

  costTypeSelect.on('change',
    (val) => {
      if (val !== 'Custom') {
        reference.setValue(false);
        reference.hide();
      } else {
        reference.show();
      }
    });

  const id = Input.CostId();
  const laborType = Input.laborType();
  const hourlyRate = Input.hourlyRate();

  const idType = [objectId, id, Select.costType()];
  const materialInput = [Select.method(), Select.company(), Input.partNumber()];
  const laborInput = [Select.method(), laborType, hourlyRate];
  laborType.on('keyup',
    (val, values) => hourlyRate.setValue(Labor.hourlyRate(val)));

  const length = MeasurementInput.len();
  const width = MeasurementInput.width();
  const depth = MeasurementInput.depth();
  const cost = MeasurementInput.cost();
  const hours = Input.hours();
  const count = Input.count();
  const modifyDemension = Input.modifyDemension();
  const selectInfo = [CostManager.formulaInput(objId, 'Select'),
                      RelationInput];
  const conditionalInfo = [Input.propertyId(), Select.propertyConditions(),
        Input.propertyValue()];
  const color = [Input.color()];

  // Todo: ????
  const matFormula = CostManager.formulaInput(objId, 'Material');
  const costCount = [count, cost, matFormula];
  const lengthCost = [length, cost, matFormula];
  const lengthWidthCost = [length, width, cost, matFormula];
  const lengthWidthDepthCost = [length, width, depth, cost, matFormula];

  const laborFormula = CostManager.formulaInput(objId, 'Labor');
  const hourlyCount = [count, hours, laborFormula];
  const lengthHourly = [length, hours, laborFormula];
  const lengthWidthHourly = [length, width, hours, laborFormula];
  const lengthWidthDepthHourly = [length, width, depth, hours, laborFormula];

  const decisionInput = new DecisionInputTree('cost',
    [costTypeSelect, reference]);

  decisionInput.contengency('id', 'referenceable');
  decisionInput.onChange(onUpdate);

  decisionInput.addStates({
    lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color,idType,
    laborInput, costCount, materialInput, selectInfo, hourlyCount,
    lengthHourly, lengthWidthHourly, lengthWidthDepthHourly, modifyDemension,
    conditionalInfo
  });

  const idTypeNode = decisionInput.then('costType:Custom')
        .jump('idType');


  const conditionalNode = idTypeNode.then('type:Conditional')
        .jump('conditionalInfo');
  const materialNode = idTypeNode.then('type:Material')
        .jump('materialInput');
  const selectNode = idTypeNode.then('type:Select')
        .jump('selectInfo');
  const laborNode = idTypeNode.then('type:Labor')
        .jump('laborInput');

  idTypeNode.then('id:length').jump('modifyDemension');
  idTypeNode.then('id:width').jump('modifyDemension');
  idTypeNode.then('id:depth').jump('modifyDemension');


  materialNode.then(`method:${Material.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  materialNode.then(`method:${Material.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  materialNode.then(`method:${Material.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  materialNode.then(`method:${Material.methods.UNIT}`)
        .jump('costCount');

  materialNode.then('type:Material').jump('color');


  laborNode.then(`method:${Material.methods.LINEAR_FEET}`)
        .jump('lengthHourly');
  laborNode.then(`method:${Material.methods.SQUARE_FEET}`)
        .jump('lengthWidthHourly');
  laborNode.then(`method:${Material.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthHourly');
  laborNode.then(`method:${Material.methods.UNIT}`)
        .jump('hourlyCount');

  laborNode.then('type:Material').jump('color');

  return decisionInput;
}

new CostManager('cost-manager', 'cost');



class TemplateManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const getObject = (values) => mangager.getObject(values);
    this.loadPoint = () => EPNTS.templates.get();
    this.savePoint = () => EPNTS.templates.save();
    this.fromJson = Cost.fromJson;
  }
}

new TemplateManager('template-manager', 'template');

TemplateManager.inputTree = (callback) => {
  const idTypeMethod = [Input.id(), Select.costType(), Select.method()];

  const length = MeasurementInput.len();
  const width = MeasurementInput.width();
  const depth = MeasurementInput.depth();
  const cost = MeasurementInput.cost();
  const lengthCost = [length, cost];
  const lengthWidthCost = [length, width, cost];
  const lengthWidthDepthCost = [length, width, depth, cost];
  const color = [Input.color()];

  const decisionInput = new DecisionInputTree('cost',
    idTypeMethod, callback);

  decisionInput.addStates({
    lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color
  });

  decisionInput.then(`method:${Material.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  decisionInput.then(`method:${Material.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  decisionInput.then(`method:${Material.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  decisionInput.then(`method:${Material.methods.UNIT}`)
        .jump('cost');
  decisionInput.then('type:Material').jump('color');

  return decisionInput;
}


class Material extends Cost {
  constructor (props) {
    super(props);
    props = this.props();
    const instance = this;
    this.company = Cost.getterSetter(props, 'company');
    this.formula = Cost.getterSetter(props, 'formula');
    this.partNumber = Cost.getterSetter(props, 'partNumber');
    this.method = Cost.getterSetter(props, 'method');
    this.length = Cost.getterSetter(props, 'length');
    this.width = Cost.getterSetter(props, 'width');
    this.depth = Cost.getterSetter(props, 'depth');
    this.cost = Cost.getterSetter(props, 'cost');


    this.unitCost = referenceCost ? referenceCost.unitCost : (attr) => {
      const unitCost = Cost.configure(instance.method(), instance.cost(),
        instance.length(), instance.width(), instance.depth());
      const copy = JSON.parse(JSON.stringify(unitCost));
      if (attr) return copy[attr];
      return copy;
    }

    this.calc = (assemblyOrCount) => {
      if (assemblyOrCount instanceof Assembly)
        return Cost.evaluator.eval(`${this.unitCost().value}*${this.formula()}`, assembly);
      else return Cost.evaluator.eval(`${this.unitCost().value}*${assemblyOrCount}`);
    }
  }
}

Material.requiredProps = ['method', 'cost', 'formula', 'length', 'width',
                          'depth', 'company', 'partNumber'];

Material.methods = {
  LINEAR_FEET: 'Linear Feet',
  SQUARE_FEET: 'Square Feet',
  CUBIC_FEET: 'Cubic Feet',
  UNIT: 'Unit'
};

Material.methodList = Object.values(Material.methods);


Material.configure = (method, cost, length, width, depth) => {
  const retValue = {unitCost: {}};
  switch (method) {
    case Material.methods.LINEAR_FEET:
      const perLinearInch = Cost.evaluator.eval(`${cost}/(${length} * 12)`);
      retValue.unitCost.name = 'Linear Inch';
      retValue.unitCost.value = perLinearInch;
      return retValue;
    case Material.methods.SQUARE_FEET:
      const perSquareInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*144)`);
      retValue.unitCost.name = 'Square Inch';
      retValue.unitCost.value = perSquareInch;
      return retValue;
    case Material.methods.CUBIC_FEET:
      const perCubicInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*${depth}*1728)`);
      retValue.unitCost.name = 'Cubic Inch';
      retValue.unitCost.value = perCubicInch;
      return retValue;
    case Material.methods.UNIT:
      retValue.unitCost.name = 'Unit';
      retValue.unitCost.value = cost;
      return retValue;
    default:
      throw new Error('wtf');
      retValue.unitCost.name = 'Unknown';
      retValue.unitCost = -0.01;
      retValue.formula = -0.01;
      return retValue;
  }
};

Material.explanation = `Cost to be calculated by number of units or demensions`;

Cost.register(Material);



class DecisionInputTree extends DecisionTree{
  constructor(name, inputArrayOinstance, onComplete) {
    const rootClass = `decision-input-${randomString()}`;
    class DecisionInput {
      constructor(name, inputArrayOinstance, decisionTreeId) {
        this.name = name;
        this.decisionTreeId = decisionTreeId;
        this.id = `decision-input-node-${randomString()}`;
        this.childCntId = `decision-child-ctn-${randomString()}`
        this.values = () => root.values()
        this.inputArray = DecisionInputTree.validateInput(inputArrayOinstance, this.values);
        this.class = rootClass;
        this.getValue = (index) => this.inputArray[index].value();

        this.html = () => {
          return DecisionInput.template.render(this);
        }

        this.childHtml = (index) => {
          const node = getNode(this._nodeId);
          const nextNode = next(node, index);
          return nextNode !== undefined ? nextNode.payload.html() : '';
        }
      }
    }
    DecisionInput.template = new $t('input/decision/decision');

    super(name, new DecisionInput(name, inputArrayOinstance, `decision-tree-${randomString()}`));
    if ((typeof name) !== 'string') throw Error('name(arg2) must be defined as a string');


    const root = this;
    const onCompletion = [];
    const onChange = [];
    this.treeId = randomString();
    this.buttonClass = `tree-submit`;
    const buttonSelector = `.${this.buttonClass}[tree-id='${this.treeId}']`;
    this.class = `decision-input-tree`;
    const getNode = this.getNode;
    const parentAddState = this.addState;
    const parentAddStates = this.addStates;

    this.addState = (name, payload) => parentAddState(name, new DecisionInput(name, payload)) && this;
    this.addStates = (sts) => {
      const states = {};
      const keys = Object.keys(sts);
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        states[key] = new DecisionInput(key, sts[key]);
      }
      return parentAddStates(states)
    }

    function getInput(name) {
      let answer;
      forEachInput((input) => answer = input.name === name ? input : answer);
      return answer;
    }

    this.set = (name, value) => {
      const input = getInput(name);
      input.setValue(value);
    }

    const next = (node, index) => {
      const inputArray = node.payload.inputArray;
      const input = inputArray[index];
      const name = input.name;
      const value = node.payload.getValue(index);
      return node.next(`${name}:${value}`) || node.next(name);
    }

    function forEachInput(func) {
      let nodes = [root];
      while (nodes.length !== 0) {
        const node = nodes[0];
        const inputs = node.payload.inputArray;
        for (let index = 0; index < inputs.length; index += 1) {
          const input = inputs[index];
          func(inputs[index]);
          const nextNode = next(node, index);
          if (nextNode) nodes.push(nextNode);
        }
        nodes.splice(0, 1);
      }
    }

    function formFilled() {
      let filled = true;
      forEachInput((input) => filled = filled && input.doubleCheck());
      const addBtn = document.querySelector(buttonSelector);
      if (addBtn) addBtn.disabled = !filled;
      return filled;
    }

    this.formFilled = formFilled;

    function values() {
      const values = {};
      forEachInput((input) => values[input.name] = input.value());
      return values;
    }
    this.values = values;

    const contengencies = {};
    this.contengency = (subject, master) => {
      if (contengencies[master] === undefined) contengencies[master] = [];
      contengencies[master].push(subject);
    }

    this.update = (target) => {
      const parentDecisionCnt = up(`.${rootClass}`, target);
      if (parentDecisionCnt) {
        const nodeId = parentDecisionCnt.getAttribute('node-id');
        const index = parentDecisionCnt.getAttribute('index');
        const currentNode = this.getNode(nodeId);
        if (currentNode) {
          const currentInput = currentNode.payload.inputArray[index];
          currentInput.setValue();
          (contengencies[currentInput.name] || []).forEach((inputName) => {
            const contengentInput = getInput(inputName);
            if (contengentInput)
              contengentInput.doubleCheck();
          });
          runFunctions(onChange, currentInput.name, currentInput.value(), target);
          const stepLen = Object.keys(currentNode.states).length;
          if (stepLen) {
            const inputCount = currentNode.payload.inputArray.length;
            const nextState = next(currentNode, index);
            const childCntId = currentNode.payload.inputArray[index].childCntId;
            const childCnt = document.getElementById(childCntId);
            if (nextState) {
              childCnt.innerHTML = DecisionInput.template.render(nextState.payload);
            } else {
              childCnt.innerHTML = '';
            }
          }
        }
      }

      formFilled();
    }

    this.html = () =>
      DecisionInputTree.template.render(this);
    function on(func, funcArray) {
      if ((typeof func) === 'function') funcArray.push(func);
    };
    this.onChange = (func) => on(func, onChange);
    this.onComplete = (func) => on(func, onCompletion);

    this.onComplete(onComplete);

    function runFunctions(funcArray, ...args) {
      for(let index = 0; index < funcArray.length; index += 1) {
        funcArray[index].apply(null, args);
      }
    }

    const inputSelector = `.${rootClass} > div > input,select`;
    matchRun('change', inputSelector, this.update);
    matchRun('keyup', inputSelector, this.update);
    matchRun('click', buttonSelector, () => {
      const vals = values();
      runFunctions(onCompletion, values);
    });
  }
}

DecisionInputTree.validateInput = (inputArrayOinstance, valuesFunc) => {
  if (Array.isArray(inputArrayOinstance)) {
    inputArrayOinstance.forEach((instance) => {
      if (!(instance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
      const parentValidate = instance.validation;
      instance.validation = (value) => parentValidate(value, valuesFunc());
      instance.childCntId = `decision-child-ctn-${randomString()}`
    });
    return inputArrayOinstance;
  }
  if (!(inputArrayOinstance instanceof Input)) throw new Error('arg3 must be an array exclusivly of/or instance of Input');
  inputArrayOinstance.childCntId = `decision-child-ctn-${randomString()}`
  return [inputArrayOinstance];
}

DecisionInputTree.template = new $t('input/decision/decisionTree');


class Labor extends Material {
  constructor (props) {
    super(props);
    const type = props.laborType;
    this.type = () => type;
    this.hourlyRate = () => Labor.hourlyRates[type];
    const parentCalc = this.calc;
    this.calc = (assembly) => parentCalc(assembly) * Labor.hourlyRates[type];
    if (Labor.hourlyRates[type] === undefined) Labor.types.push(type);
    Labor.hourlyRate(type, props.hourlyRate || Labor.defaultRate);

    const parentToJson = this.toJson;
  }
}

Labor.requiredProps = Material.requiredProps.concat(['type', 'hourlyRate']);
Labor.defaultRate = 40;
Labor.hourlyRate = (type, rate) => {
  rate = Cost.evaluator.eval(new String(rate));
  if (!Number.isNaN(rate)) Labor.hourlyRates[type] = rate;
  return Labor.hourlyRates[type] || Labor.defaultRate;
}
Labor.hourlyRates = {};
Labor.types = [];
Labor.explanation = `Cost to be calculated hourly`;

Cost.register(Labor);


class Joint {
  constructor(joinStr) {
    const match = joinStr.match(Joint.regex);
    this.malePartCode = match[1];
    this.femalePartCode = match[2];

    this.updatePosition = () => {};

    this.getFemale = () => this.parentAssembly.getAssembly(this.femalePartCode);
    this.getMale = () => this.parentAssembly.getAssembly(this.malePartCode);

    this.maleOffset = () => 0;
    this.femaleOffset = () => 0;
    this.setParentAssembly = (pa) => this.parentAssembly = pa;

    this.getDemensions = () => {
      const malePos = getMale();
      const femalePos = getFemale();
      // I created a loop but it was harder to understand
      return undefined;
    }

    if (Joint.list[this.malePartCode] === undefined) Joint.list[this.malePartCode] = [];
    if (Joint.list[this.femalePartCode] === undefined) Joint.list[this.femalePartCode] = [];
    Joint.list[this.malePartCode].push(this);
    Joint.list[this.femalePartCode].push(this);
  }
}
Joint.list = {};
Joint.regex = /([a-z0-1\.]{1,})->([a-z0-1\.]{1,})/;

Joint.classes = {};
Joint.register = (clazz) =>
  Joint.classes[clazz.prototype.constructor.name] = clazz;
Joint.new = function (id) {
  return new Joint.classes[id](...Array.from(arguments).slice(1));
}


class MeasurementInput extends Input {
  constructor(props) {
    super(props);
    props.validation = (value) => typeof MeasurementInput.evaluator.eval(value) === 'number';
    props.errorMsg = 'Invalid Mathematical Expression';
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);
MeasurementInput.evaluator = new StringMathEvaluator(Math);

MeasurementInput.len = () => new MeasurementInput({
  type: 'text',
  placeholder: 'Length',
  name: 'length',
  class: 'center',
});
MeasurementInput.width = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'width',
  class: 'center',
});
MeasurementInput.depth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'depth',
  class: 'center',
});
MeasurementInput.cost = () => new MeasurementInput({
  type: 'number',
  label: '$',
  placeholder: 'Cost',
  name: 'cost'
});
MeasurementInput.pattern = (id, value) => new MeasurementInput({
  type: 'text',
  label: id,
  value,
  placeholder: id,
  name: id,
  class: 'pattern-input',
});

MeasurementInput.offsetLen = () => new MeasurementInput({
  type: 'text',
  label: 'Offset',
  placeholder: 'Length',
  name: 'offsetLength',
  class: 'center',
});
MeasurementInput.offsetWidth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'offsetWidth',
  class: 'center',
});
MeasurementInput.offsetDepth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'offsetDepth',
  class: 'center',
});


class Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    this.display = true;
    this.important = ['partCode', 'partName', 'centerStr', 'demensionStr', 'rotationStr'];
    this.part = true;
    this.included = true;
    this.parentAssembly = parent;
    let propId = 'Full Overlay';
    this.propertyId = (id) => {
      if (id === undefined) return propId;
      propId = id;
    }
    let instance = this;
    funcOvalue.apply(this, ['centerStr', centerStr, 'demensionStr',  demensionStr, 'rotationStr', rotationStr]);

    function getValueSmeFormatter(path) {
      const split = path.split('.');
      let attr = split[0];
      let objIdStr;
      if (split.length === 2) {
        objIdStr = split[0];
        attr = split[1];
      }

      let obj;
      if (objIdStr === undefined) {
        obj = instance;
      } else {
        obj = instance.getAssembly(objIdStr);
      }
      const returnVal = Assembly.resolveAttr(obj, attr);
      return returnVal;
    }
    const sme = new StringMathEvaluator(null, getValueSmeFormatter);


    let getting =  false;
    this.getAssembly = (partCode, callingAssem) => {
      if (callingAssem === this) return undefined;
      if (this.partCode === partCode) return this;
      if (this.subAssemblies[partCode]) return this.subAssemblies[partCode];
      if (callingAssem !== undefined) {
        const children = Object.values(this.subAssemblies);
        for (let index = 0; index < children.length; index += 1) {
          const assem = children[index].getAssembly(partCode, this);
          if (assem !== undefined) return assem;
        }
      }
      if (this.parentAssembly !== undefined && this.parentAssembly !== callingAssem)
        return this.parentAssembly.getAssembly(partCode, this);
      return undefined;
    }
    let position = new Position(this, sme);
    this.position = () => position;
    this.updatePosition = () => position = new Position(this, sme);
    this.partCode = partCode;
    this.partName = partName;
    this.joints = [];
    this.values = {};
    this.fullDem = () => {
    }
    this.getJoints = (pc, joints) => {
      pc = pc || partCode;
      joints = joints || {male: [], female: []};
      this.joints.forEach((joint) => {
        if (joint.malePartCode === pc) {
          joints.male.push(joint);
        } else if (joint.femalePartCode === pc) {
          joints.female.push(joint);
        }
      });
      if (this.parentAssembly !== undefined)
        this.parentAssembly.getJoints(pc, joints);
      return joints;
    }
    function initObj(value) {
      const obj = {};
      for (let index = 1; index < arguments.length; index += 1) {
        obj[arguments[index]] = value;
      }
      return obj;
    }
    const funcAttrs = ['length', 'width', 'thickness'];
    this.value = (code, value) => {
      if (code.match(new RegExp(funcAttrs.join('|')))) {
        this[code](value);
      } else {
        if (value !== undefined) {
          this.values[code] = value;
        } else {
          const instVal = this.values[code];
          if (instVal !== undefined && instVal !== null) {
            if ((typeof instVal) === 'number' || (typeof instVal) === 'string') {
              return sme.eval(instVal);
            } else {
              return instVal;
            }
          }
          if (this.parentAssembly) return this.parentAssembly.value(code);
          else {
            try {
              if (code.match(/trv|brv|lrv|rrv|fs/)) {
                const nothing = true;
              }
              return properties(propId)[code].value;
            } catch (e) {
              console.error(`Failed to resolve code: ${code}`);
              return NaN;
            }
          }
        }
      }
    }
    this.jointOffsets = () => {
    }

    this.subAssemblies = {};
    this.setSubAssemblies = (assemblies) => {
      this.subAssemblies = {};
      assemblies.forEach((assem) => this.subAssemblies[assem.partCode] = assem);
    };

    // TODO: wierd dependency on inherited class.... fix!!!
    const defaultPartCode = () =>
      instance.partCode = instance.partCode || Cabinet.partCode(this);

    this.setParentAssembly = (pa) => {
      this.parentAssembly = pa;
      defaultPartCode();
    }
    this.features = Feature.getList(formatConstructorId(this));
    this.addSubAssembly = (assembly) => {
      this.subAssemblies[assembly.partCode] = assembly;
      assembly.setParentAssembly(this);
    }

    this.objId = this.constructor.name;

    this.addJoints = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        const joint = arguments[i];
        this.joints.push(joint);
        joint.setParentAssembly(this);
      }
    }

    this.addSubAssemblies = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        this.addSubAssembly(arguments[i]);
      }
    }

    this.children = () => Object.values(this.subAssemblies);

    this.getSubAssemblies = () => {
      let assemblies = [];
      this.children().forEach((assem) => {
        assemblies.push(assem);
        assemblies = assemblies.concat(assem.getSubAssemblies());
      });
      return assemblies;
    }
    this.getParts = () => {
      return this.getSubAssemblies().filter((a) => a.part && a.included );
    }
    this.uniqueId = randomString(32);
    if (Assembly.idCounters[this.objId] === undefined) {
      Assembly.idCounters[this.objId] = 0;
    }
    this.toJson = function (json) {
      json = json || {};
      json.type = this.constructor.name;
      if (this.important) {
        this.important.forEach((attr) =>
            json[attr] = (typeof this[attr]) === 'function' ? this[attr]() : this[attr]);
      }
      json.values = JSON.parse(JSON.stringify(this.values));
      json.subAssemblies = [];
      if (!Assembly.class(json.type).dontSaveChildren) {
        const subAssems = this.children();
        subAssems.forEach((assem) => json.subAssemblies.push(assem.toJson()));
      }
      return json;
    }

    Assembly.add(this);

    this.width = (value) => position.setDemension('x', value);
    this.length = (value) => position.setDemension('y', value);
    this.thickness = (value) => position.setDemension('z', value);
    defaultPartCode();
  }
}

Assembly.list = {};
Assembly.get = (uniqueId) => {
  const keys = Object.keys(Assembly.list);
  for (let index = 0; index < keys.length; index += 1) {
    const assembly = Assembly.list[keys[index]][uniqueId];
    if (assembly !== undefined) return assembly;
  }
  return null;
}
Assembly.add = (assembly) => {
  const name = assembly.constructor.name;
  if (Assembly.list[name] === undefined) Assembly.list[name] = {};
  Assembly.list[name][assembly.uniqueId] = assembly;
}
Assembly.all = () => {
  const list = [];
  const keys = Object.keys(Assembly.list);
  keys.forEach((key) => list.concat(Object.values(Assembly.list[key])));
  return list;
}
Assembly.resolveAttr = (assembly, attr) => {
  if (!(assembly instanceof Assembly)) return undefined;
  if (attr === 'length' || attr === 'height' || attr === 'h' || attr === 'l') {
    return assembly.length();
  } else if (attr === 'w' || attr === 'width') {
    return assembly.width();
  } else if (attr === 'depth' || attr === 'thickness' || attr === 'd' || attr === 't') {
    return assembly.thickness();
  }
  return assembly.value(attr);
}
Assembly.fromJson = (assemblyJson) => {
  const demensionStr = assemblyJson.demensionStr;
  const centerStr = assemblyJson.centerStr;
  const rotationStr = assemblyJson.rotationStr;
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = Assembly.new(assemblyJson.type, partCode, partName, centerStr, demensionStr, rotationStr);
  assembly.values = assemblyJson.values;
  assemblyJson.subAssemblies.forEach((json) =>
    assembly.addSubAssembly(Assembly.class(json.type)
                              .fromJson(json, assembly)));
  if (assemblyJson.length) assembly.length(assemblyJson.length);
  if (assemblyJson.width) assembly.width(assemblyJson.width);
  if (assemblyJson.thickness) assembly.thickness(assemblyJson.thickness);
  return assembly;
}
Assembly.classes = {};
Assembly.register = (clazz) =>
  Assembly.classes[clazz.prototype.constructor.name] = clazz;
Assembly.new = function (id) {
  return new Assembly.classes[id](...Array.from(arguments).slice(1));
}
Assembly.class = function (id) {
  return Assembly.classes[id];
}

Assembly.classObj = (filterFunc) => {
  if ((typeof filterFunc) !== 'function') return Assembly.classes;
  const classIds = Object.keys(Assembly.classes);
  const classes = Assembly.classes;
  const obj = [];
  for (let index = 0; index < classIds.length; index += 1) {
    const id = classIds[index];
    if (filterFunc(classes[id])) obj[id]= classes[id];
  }
  return obj;
}
Assembly.classList = (filterFunc) => Object.values(Assembly.classObj(filterFunc));
Assembly.classIds = (filterFunc) => Object.keys(Assembly.classObj(filterFunc));
Assembly.lists = {};
Assembly.idCounters = {};


class Dado extends Joint {
  constructor(joinStr, defaultDepth, axis, centerOffset) {
    super(joinStr);

    this.maleOffset = (assembly) => {
      return defaultDepth;
    }

    if (axis === undefined) return;

    this.updatePosition = (position) => {
      const direction = centerOffset[0] === '-' ? -1 : 1;
      const centerAxis = centerOffset[1];
      position.demension[axis] += defaultDepth;
      position.center[centerAxis] += defaultDepth/2 * direction;
    };

  }
}

Joint.register(Dado);


class RelationInput extends Select {
  constructor(name, sortFunc) {
    super({name: name, value: name, list: RelationInput.relations, label: 'Auto Select Relation'});
    if (RelationInput.relationsObjs[name] !== undefined) throw new Error('Relation Inputs must have a unique name.');
    this.eval = function(list) {
      evalList = [];

      if (!Array.isArray(list)) return undefined;
      for(let index = 0; index < list.length; index += 1) {
        evalList[index] = this.constructor.eval(list[index]);
      }
      list.sort(sortFunc);
      return list[0];
    };
    RelationInput.relationsObjs[name] = this;
    RelationInput.relations.push(name);
    RelationInput.relations
        .sort((a, b) => a.length > b.length ? 1 : -1);
  }
}

RelationInput.relationsObjs = {};
RelationInput.relations = [];

RelationInput.eval = new StringMathEvaluator(Math);

new RelationInput('Equal', (a, b) => a === b ? -1 : 1);
new RelationInput('Less Than', (a, b) => a < b ? -1 : 1);
new RelationInput('Greater Than', (a, b) => a > b ? -1 : 1);
new RelationInput('Less Than Or Equal', (a, b) => a <= b ? -1 : 1);
RelationInput = new RelationInput('Greater Than Or Equal', (a, b) => a >= b ? -1 : 1);


const OVERLAY = {};
OVERLAY.FULL = 'Full';
OVERLAY.HALF = 'Half';
OVERLAY.INSET = 'Inset';

const CABINET_TYPE = {FRAMED: 'Framed', FRAMELESS: 'Frameless'};

const framedFrameWidth = 1.5;
const framelessFrameWidth = 3/4;
class Cabinet extends Assembly {
  constructor(partCode, partName, propsId) {
    super(partCode, partName);
    this.propertyId(propsId);
    this.important = ['partCode', 'name', 'partName', 'length', 'width', 'thickness', 'propertyId'];
    const instance = this;
    let frameWidth = framedFrameWidth;
    let toeKickHeight = 4;
    this.part = false;
    this.display = false;
    this.overlay = OVERLAY.HALF;
    this.openings = [];
    this.type = CABINET_TYPE.FRAMED;
    const panels = 0;
    const framePieces = 0;
    const addFramePiece = (piece) => framePieces.push(piece);
    const framePieceCount = () => pieces.length;
    const addPanel = (panel) => panels.push(panel);
    const panelCount = () => panels.length;
    const opening = () => {
      const w = width - (frameWidth * 2);
      const h = height - toeKickHeight - (frameWidth * 2);
      return {width: w, height: h};
    }

    this.borders = (borderIds) => {
      const borders = {};
      borders.right = instance.getAssembly(borderIds.right);
      borders.left = instance.getAssembly(borderIds.left);
      borders.top = instance.getAssembly(borderIds.top);
      borders.bottom = instance.getAssembly(borderIds.bottom);

      const pb = instance.getAssembly(borderIds.back);

      return () => {
        const depth = pb.position().center('z') + pb.position().limits('-z');

        const position = {};
        const start = {};
        if (CoverStartPoints.INSIDE_RAIL === borders.top.value('csp')) {
          position.right = borders.right.position().centerAdjust('x', '-x');
          position.left = borders.left.position().centerAdjust('x', '+x');
          position.top = borders.top.position().centerAdjust('y', '-x');
          position.bottom = borders.bottom.position().centerAdjust('y', '+x');
        } else {
          position.right = borders.right.position().centerAdjust('x', '+x');
          position.left = borders.left.position().centerAdjust('x', '-x');
          position.top = borders.top.position().centerAdjust('y', '+x');
          position.bottom = borders.bottom.position().centerAdjust('y', '-x');
        }
        position.right -= this.value('rrv');
        position.left += this.value('lrv')
        position.top -= this.value('trv');
        position.bottom += this.value('brv');

        return {borders, position, depth, borderIds};
      }
    }
  }
}

Cabinet.build = (type) => {
  const cabinet = new Cabinet('c', type);
  const config = cabinetBuildConfig[type];

  const valueIds = Object.keys(config.values);
  valueIds.forEach((valueId) => cabinet.value(valueId, config.values[valueId]));

  const subNames = Object.keys(config.subAssemblies);
  subNames.forEach((name) => {
    subAssemConfig = config.subAssemblies[name];
    const type = subAssemConfig.type;
    const demStr = subAssemConfig.demensions.join(',');
    const centerStr = subAssemConfig.center.join(',');
    const rotationStr = subAssemConfig.rotation;
    const subAssem = Assembly.new(type, subAssemConfig.code, name, centerStr, demStr, rotationStr);
    subAssem.partCode = subAssemConfig.code;
    cabinet.addSubAssembly(subAssem);
  });

  const joinRelations = Object.keys(config.joints);
  joinRelations.forEach((relation) => {
    relationConfig = config.joints[relation];
    const type = relationConfig.type;
    const depth = relationConfig.depth;
    const demensionToOffset = relationConfig.DemensionToOffset;
    const centerOffset = relationConfig.centerOffset;
    const joint = Joint.new(type, relation, depth, demensionToOffset, centerOffset);
    cabinet.addJoints(joint);
  });

  config.bordersIdMap.forEach((idMap) => {
    const divideSection = new DivideSection(cabinet.borders(idMap), cabinet);
    cabinet.openings.push(divideSection);
    cabinet.addSubAssembly(divideSection);
  });
  return cabinet;
}

Cabinet.fromJson = (assemblyJson) => {
  const partCode = assemblyJson.partCode;
  const partName = assemblyJson.partName;
  const assembly = new Cabinet(partCode, partName);
  assembly.values = assemblyJson.values;
  assemblyJson.subAssemblies.forEach((json) => {
    const clazz = Assembly.class(json.type);
    if (clazz !== DivideSection) {
      assembly.addSubAssembly(clazz.fromJson(json, assembly));
    } else {
      const divideSection = clazz.fromJson(json, assembly);
      assembly.openings.push(divideSection);
      assembly.addSubAssembly(divideSection);
    }
  });
  assembly.length(assemblyJson.length);
  assembly.width(assemblyJson.width);
  assembly.thickness(assemblyJson.thickness);
  return assembly;
}

Cabinet.partCode = (assembly) => {
  const cabinet = assembly.getAssembly('c');
  if (cabinet) {
    const name = assembly.constructor.name;
    cabinet.partIndex = cabinet.partIndex || 0;
    return `${assembly.constructor.abbriviation}-${cabinet.partIndex++}`;
  }
}


Assembly.register(Cabinet);


class Divider extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}
Divider.count = 0;

Divider.abbriviation = 'dv';

Assembly.register(Divider);


class Frame extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

Frame.abbriviation = 'fr';

Assembly.register(Frame);


class Rabbet extends Joint {
  constructor(joinStr, defaultDepth, axis, centerOffset) {
    super(joinStr);
    this.maleOffset = (assembly) => {
      return defaultDepth;
    }

    if (axis === undefined) return;

    this.updatePosition = (position) => {
      const direction = centerOffset[0] === '-' ? -1 : 1;
      const centerAxis = centerOffset[1];
      position.demension[axis] += defaultDepth;
      position.center[centerAxis] += defaultDepth/2 * direction;
    };
  }
}

Joint.register(Rabbet);


class Miter extends Joint {
  constructor(joinStr) {
    super(joinStr);
  }
}

Joint.register(Miter);


class Butt extends Joint {
  constructor(joinStr) {
    super(joinStr);
  }
}

Joint.register(Butt);


class Panel extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

Panel.abbriviation = 'pn';

Assembly.register(Panel);



class Guides extends Assembly {
  constructor() {
  }
}

Assembly.register(Guides);



class Screw extends Assembly {
  constructor() {

  }
}

Assembly.register(Screw);



class DoorCatch extends Assembly {
  constructor() {

  }
}

Assembly.register(DoorCatch);



const sectionFilePath = (filename) => `sections/${filename}`;

class Section extends Assembly {
  constructor(templatePath, isPartition, partCode, partName, sectionProperties) {
    super(partCode, partName);
    this.index = () => sectionProperties().index;
    this.center = (attr) => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const center = {};
      center.x = (!attr || attr === 'x') &&
            leftPos.center('x') - ((leftPos.center('x') - rightPos.center('x')) / 2);
      center.y = (!attr || attr === 'y') &&
            botPos.center('y') + ((topPos.center('y') - botPos.center('y')) / 2);
      center.z = (!attr || attr === 'z') &&
            topPos.center('z');
      return attr ? center[attr] : center;
    }

    const calculateRevealOffset = (border, direction) => {
      const borderPos = border.position();
      let reveal = border.value('r');
      const insideRailStart = CoverStartPoints.INSIDE_RAIL === border.value('csp');
      const positive = insideRailStart ? direction.indexOf('-') !== -1 :
                          direction.indexOf('-') === -1;
      const axis = direction.replace(/\+|-/, '');
      const magnitude = positive ? 1 : -1;
      const divisor = insideRailStart ? 1 : 2;
      const borderOrigin = !insideRailStart ? borderPos.center(axis) :
        (positive ? borderPos.centerAdjust(`${axis}`, '-x') :
                    borderPos.centerAdjust(`${axis}`, '+x'));
      return  borderOrigin + ((reveal * magnitude) / divisor);
    }


    this.outerSize = () => {
      const props = sectionProperties();
      const pos = props.position;

      const top = props.borders.top;
      const bot = props.borders.bottom;
      const left = props.borders.left;
      const right = props.borders.right;

      const limits = {};
      limits.x = pos.right || calculateRevealOffset(right, '-x');
      limits['-x'] = pos.left || calculateRevealOffset(left, '+x');
      limits.y = pos.top || calculateRevealOffset(top, '-y');
      limits['-y'] = pos.bottom || calculateRevealOffset(bot, '+y');
      limits['-z'] = top.position().limits('-z');
      limits.z = props.depth - limits['-z'];

      const center = {};
      center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
      center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
      center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);

      const dems = {};
      dems.x = limits.x - limits['-x'];
      dems.y = limits.y - limits['-y'];
      dems.z = props.depth;

      return {limits, center, dems};
    }

    this.innerSize = () => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const x = rightPos.center('x') + rightPos.limits('-x') - (leftPos.center('x') + leftPos.limits('+x'));
      const y = topPos.center('y') + topPos.limits('-x') - ((botPos.center('y') + botPos.limits('+x')));
      const z = topPos.center('z');
      return {x,y,z};
    }

    if (templatePath === undefined) {
      throw new Error('template path must be defined');
    }
    this.isPartition = () => isPartition;
    this.constructorId = this.constructor.name;
    this.part = false;
    this.display = false;
    this.name = this.constructorId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
    Section.templates[this.constructorId] = new $t(templatePath);
  }
}
Section.isPartition = () => false;
Section.abstractClasses = ['PartitionSection', 'OpeningCoverSection', 'SpaceSection']
Section.sectionInstance = (clazz) => clazz.prototype instanceof Section &&
  Section.abstractClasses.indexOf(clazz.name) === -1;
Section.sections = () => Assembly.classList(Section.sectionInstance);
Section.getSections = (isPartition) => {
  const sections = [];
  Section.sections().forEach((section) => {
    const part = section.isPartition();
    if(isPartition === undefined || part === isPartition) sections.push(section);
  });
  return sections;
}
Section.keys = () => Assembly.classIds(Section.sectionInstance);
Section.templates = {};
Section.new = function (constructorId) {
  const section = Assembly.new.apply(null, arguments);
  if (section instanceof Section) return section;
  throw new Error(`Invalid section Id: '${constructorId}'`);
}
Section.render = (scope) => {
  scope.featureDisplay = new FeatureDisplay(scope.opening).html();
  const cId = scope.opening.constructorId;
  if (cId === 'DivideSection') {
    return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
  }
  return Section.templates[cId].render(scope);
}

Assembly.register(Section);



class Door extends Assembly {
  constructor(partCode, partName, coverCenter, coverDems, rotationStr) {
    super(partCode, partName, coverCenter, coverDems, rotationStr);
    let location = Handle.location.TOP_RIGHT;
    let pull = new Handle(`${partCode}-dp`, 'Door.Handle', this, location);
    this.setHandleLocation = (l) => location = l;
    this.addSubAssembly(pull);
  }
}

Door.abbriviation = 'dr';

Assembly.register(Door);



class Hinges extends Assembly {
  constructor() {

  }
}

Assembly.register(Hinges);


/*
    a,b,c
    d,e,f
    g,h,i
*/
class Handle extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    super(partCode, 'Handle');
    this.setParentAssembly(door);
    index = index || 0;
    count = count || 1;
    this.setLocation = (l) => location = l;

    function offset(center, distance) {
      const spacing = distance / count;
      return center - (distance / 2) + spacing / 2 + spacing * (index);
    }


    this.demensionStr = (attr) => {
      const dems = {x: 1, y: 3, z: 1.5};
      return attr ? dems[attr] : dems;
    }

    const edgeOffset = 1;
    this.centerStr = (attr) => {
        let center = door.position().center();
        let doorDems = door.position().demension();
        let pullDems = this.demensionStr();
        center.z -= (doorDems.z + pullDems.z) / 2;
        switch (location) {
          case Handle.location.TOP_RIGHT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.TOP_LEFT:
          center.x = center.x - doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.BOTTOM_RIGHT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.BOTTOM_LEFT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.TOP:
            center.x = offset(center.x, doorDems.x);
            center.y -= doorDems.y / 2;
					break;
          case Handle.location.BOTTOM:
            center.x = offset(center.x, doorDems.x);
            center.y += doorDems.y / 2;
					break;
          case Handle.location.RIGHT:
            center.y = offset(center.y, doorDems.y);
            center.x += doorDems.x / 2;
					break;
          case Handle.location.LEFT:
            center.y = offset(center.y, doorDems.y);
            center.x -= doorDems.x / 2;
					break;
          case Handle.location.CENTER:
            center.x = offset(center.x, doorDems.x);
					break;
          default:
            throw new Error('Invalid pull location');
        }
        return attr ? center[attr] : center;
    };

    this.updatePosition();
  }
}
Handle.location = {};
Handle.location.TOP_RIGHT = {rotate: true};
Handle.location.TOP_LEFT = {rotate: true};
Handle.location.BOTTOM_RIGHT = {rotate: true};
Handle.location.BOTTOM_LEFT = {rotate: true};
Handle.location.TOP = {multiple: true};
Handle.location.BOTTOM = {multiple: true};
Handle.location.RIGHT = {multiple: true};
Handle.location.LEFT = {multiple: true};
Handle.location.CENTER = {multiple: true, rotate: true};

Handle.abbriviation = 'pu';

Assembly.register(Handle);


class DrawerBox extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
  }
}

DrawerBox.abbriviation = 'db';

Assembly.register(DrawerBox);


class DrawerFront extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    this.setParentAssembly(parent);
    const instance = this;
    let pulls;
    if (demensionStr === undefined) return;

    function pullCount(dems) {
      if (dems.x < 30) return 1;
      return 2;
    }

    this.demensionStr = (attr) => {
      const dems = demensionStr();
      return dems;
    };

    this.children = () => this.updateHandles();

    this.updateHandles = (dems, count) => {
      count = count || pullCount(this.demensionStr());
      pulls = [];
      for (let index = 0; index < count; index += 1) {
        pulls.push(new Handle(`${partCode}-p-${index}`, 'Drawer.Handle', this, Handle.location.CENTER, index, count));
      }
      return pulls;
    };
    this.updatePosition();
  }
}

DrawerFront.abbriviation = 'df';

Assembly.register(DrawerFront);


class SpaceSection extends Section {
  constructor(templatePath, partCode, partName, sectionProperties) {
    super(templatePath, false, partCode, partName, sectionProperties);
    if ((typeof sectionProperties) !== 'function')
    this.important = ['partCode', 'partName', 'index'];
    this.borderIds = () => sectionProperties().borderIds;
    const instance = this;

    const parentValue = this.value;
    this.value = (attr, value) => {
      const props = sectionProperties();
      const top = props.borders.top;
      const bottom = props.borders.bottom;
      const right = props.borders.right;
      const left = props.borders.left;
      let panel;
      switch (attr) {
        case 'opt':
          if (props.position.top) return props.position.top;
          return top.position().center('y');
        case 'opb':
          if (props.position.bottom) return props.position.bottom;
          return bottom.position().center('y');
        case 'opr':
          if (props.position.right) return props.position.right;
          return right.position().center('x');
        case 'opl':
          if (props.position.left) return props.position.left;
          return left.position().center('x');
        case 'fpt':
          return top.position().center('y') - top.width() / 2;
        case 'fpb':
          return bottom.position().center('y') + bottom.width() / 2;
        case 'fpr':
          return right.position().center('x') - right.width() / 2;
        case 'fpl':
          return left.position().center('x') + left.width() / 2;
        case 'ppt':
          panel = top.getAssembly(top.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            top.position().centerAdjust('y', '-x') :
            panel.position().centerAdjust('y', '-z');
        case 'ppb':
          panel = bottom.getAssembly(bottom.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            bottom.position().centerAdjust('y', '+x') :
            panel.position().centerAdjust('y', '+z');
        case 'ppr':
          panel = right.getAssembly(right.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            right.position().centerAdjust('x', '-x') :
            panel.position().centerAdjust('x', '-z');
        case 'ppl':
          panel = left.getAssembly(left.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            left.position().centerAdjust('x', '+x') :
            panel.position().centerAdjust('x', '+z');
        default:
          return parentValue(attr, value);
      }
    }
  }
}

SpaceSection.fromJson = (json, parent) => {
  const sectionProps = parent.borders(json.borderIds || json.index);
  const assembly = json.type !== 'DivideSection' ?
          Assembly.new(json.type, json.partCode, sectionProps, parent) :
          Assembly.new(json.type, sectionProps, parent);
  assembly.partCode = json.partCode;
  assembly.partName = json.partName;
  assembly.values = json.values;
  json.subAssemblies.forEach((json) =>
    assembly.addSubAssembly(Assembly.class(json.type)
                              .fromJson(json, assembly)));
  return assembly;
}

Assembly.register(SpaceSection);


class PartitionSection extends Section {
  constructor(templatePath, partCode, partName, sectionProperties) {
    super(templatePath, true, partCode, partName, sectionProperties);
    this.important = ['partCode', 'partName', 'index'];
  }
}

PartitionSection.isPartition = () => true;

PartitionSection.fromJson = (json, parent) => {
  const sectionProps = parent.dividerProps(json.index);
  const assembly = Assembly.new(json.type, json.partCode, sectionProps, parent);
  assembly.partCode = json.partCode;
  assembly.partName = json.partName;
  assembly.values = json.values;
  return assembly;
}


let dvs;
let dsCount = 0;
class DivideSection extends SpaceSection {
  constructor(sectionProperties, parent) {
    super(sectionFilePath('open'), `dvds-${parent.uniqueId}-${sectionProperties().index}`, 'divideSection', sectionProperties);
    this.important = ['partCode', 'partName', 'borderIds', 'index'];
    const instance = this;
    this.setParentAssembly(parent);
    dvs = dvs || this;
    let pattern;
    let sectionCount = 1;
    this.vertical = (is) => instance.value('vertical', is);
    this.vertical(true);
    this.sections = [];
    this.pattern = (patternStr) => {
      if ((typeof patternStr) === 'string') {
        sectionCount = patternStr.length;
        this.divide(sectionCount - 1);
        pattern = new Pattern(patternStr);
      } else {
        if (!pattern || pattern.str.length !== sectionCount)
          pattern = new Pattern(new Array(sectionCount).fill('a').join(''));
      }
      return pattern;
    }
    this.dividerCount = () => Math.ceil((this.sections.length - 1) / 2);
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
    this.sectionProperties = () => JSON.stringify(sectionProperties);
    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new DivideSection(this.borders(0), this));
      }
    }

    this.children = () => this.sections;
    this.partitions = () => this.sections.filter((e, index) => index % 2 === 1);
    this.spaces = () => this.sections.filter((e, index) => index % 2 === 0);
    this.borders = (index) => {
      return () => {
        // if (index === 1) {
        //   console.log('center');
        // }
        const props = sectionProperties();
        const position = {
          top: props.position.top,
          bottom: props.position.bottom,
          left: props.position.left,
          right: props.position.right
        };

        let top = props.borders.top;
        let bottom = props.borders.bottom;
        let left = props.borders.left;
        let right = props.borders.right;
        if (this.vertical()) {
          if (index !== 0) {
            left = this.sections[index - 1];
            position.left = undefined;
          } if (this.sections[index + 1] !== undefined) {
            right = this.sections[index + 1];
            position.right = undefined;
          }
        } else {
          if (index !== 0) {
            top = this.sections[index - 1];
            position.top = undefined;
          } if (this.sections[index + 1] !== undefined) {
            bottom = this.sections[index + 1];
            position.bottom = undefined;
          }
        }

        const depth = props.depth;
        if (!top || !bottom || !right || !left)
          throw new Error('Border not defined');
        return {borders: {top, bottom, right, left}, position, depth, index};
      }
    }
    this.dividerProps = (index) => {
      return () => {
        // if (index === 1) {
        //   console.log('center');
        // }
        const answer = this.dividerLayout().list;
        let offset = 0;
        for (let i = 0; i < index + 1; i += 1) offset += answer[i];
        let props = sectionProperties();
        const innerSize = this.innerSize();
        let center = this.center();
        let dividerLength;
        if (this.vertical()) {
          let start = sectionProperties().borders.left.position().center('x');
          start += sectionProperties().borders.left.position().limits('+x');
          center.x = start + offset;
          dividerLength = innerSize.y;
        } else {
          let start = sectionProperties().borders.top.position().center('y');
          start += sectionProperties().borders.top.position().limits('+x');
          center.y = start - offset;
          dividerLength = innerSize.x;
        }
        const rotationFunc = () =>  this.vertical() ? '' : 'z';

        const depth = props.depth;
        const vertical = this.vertical();
        return {center, dividerLength, rotationFunc, index, depth, vertical};
      }
    }

    this.sectionCount = () => this.dividerCount() + 1;
    this.dividerLayout = () => {
      let distance;
      if (CoverStartPoints.INSIDE_RAIL === this.value('csp')) {
        distance = this.vertical() ? this.innerSize().x : this.innerSize().y;
        this.sections.forEach((section) =>
          distance -= section instanceof DividerSection ? section.maxWidth() : 0);
      } else {
        distance = this.vertical() ? this.outerSize().dems.x : this.outerSize().dems.y;
      }
      return this.pattern().calc(distance);
    };
    this.divide = (dividerCount) => {
      if (!Number.isNaN(dividerCount)) {
        dividerCount = dividerCount > 10 ? 10 : dividerCount;
        dividerCount = dividerCount < 0 ? 0 : dividerCount;
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount * 2 + 1);
          return true;
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = currDividerCount; index < dividerCount; index +=1) {
            this.sections.push(new DividerSection(`dv-${this.uniqueId}-${index}`, this.dividerProps(index), instance));
            const divideIndex = dividerCount + index + 1;
            this.sections.push(new DivideSection(this.borders(divideIndex), instance));
          }
          return diff !== 0;
        }
      }
      return false;
    }
    this.setSection = (constructorIdOobject, index) => {
      let section;
      if ((typeof constructorIdOobject) === 'string') {
        if (constructorIdOobject === 'DivideSection') {
          section = new DivideSection(this.borders(index), instance);
        } else {
          section = Section.new(constructorIdOobject, 'dr', this.borders(index));
        }
      } else {
        section = constructorIdOobject;
      }
      section.setParentAssembly(instance);
      this.sections[index] = section;
    }
    this.size = () => {
      return {width: this.width, height: this.height};
    }
    this.sizes = () => {
      return 'val';
    }
    const assemToJson = this.toJson;
    this.toJson = () => {
      const json = assemToJson.apply(this);
      json.pattern = this.pattern().toJson();
      return json;
    }
  }
}

DivideSection.fromJson = (json, parent) => {
  const sectionProps = parent.borders(json.borderIds || json.index);
  const assembly = new DivideSection(sectionProps, parent);
  const subAssems = json.subAssemblies;
  assembly.values = json.values;
  for (let index = 0; index < subAssems.length / 2; index += 1) {
    const partIndex = index * 2 + 1;
    if (partIndex < subAssems.length) {
      const partJson = subAssems[partIndex];
      const partition = Assembly.class(partJson.type).fromJson(partJson, assembly);
      assembly.setSection(partition, partIndex);
    }

    const spaceIndex = index * 2;
    const spaceJson = subAssems[spaceIndex];
    spaceJson.index = spaceIndex;
    const space = Assembly.class(spaceJson.type).fromJson(spaceJson, assembly);
    assembly.setSection(space, spaceIndex);
  }
  assembly.pattern(json.pattern.str);
  const pattern = assembly.pattern();
  const patternIds = Object.keys(json.pattern.values);
  patternIds.forEach((id) => pattern.value(id, json.pattern.values[id]));
  return assembly;
}

DivideSection.abbriviation = 'ds';

Assembly.register(DivideSection);


class DividerSection extends PartitionSection {
  constructor(partCode, sectionProperties, parent) {
    super(sectionFilePath('divider'), partCode, 'Divider', sectionProperties, parent);
    if (sectionProperties === undefined) return;
    this.setParentAssembly(parent);
    const props = sectionProperties;
    const instance = this;
    this.position().center = (attr) => {
      const center = props().center;
      return attr ? center[attr] : center;
    };
    this.position().demension = (attr) =>
      Position.targeted(attr, () => this.value('frw'),
          () => props().dividerLength / 2, () => this.value('frt'));
    const panelCenterFunc = (attr) => {
      const props = sectionProperties();
      const dem = {
        x: props.center.x,
        y: props.center.y,
        z: props.depth / 2
      };
      return attr ? dem[attr] : dem;
    };
    const panelDemFunc = (attr) => {
      if (attr === 'z') return this.value('pwt34');
      const props = sectionProperties();
      const dem = {
        x: props.depth - frameDemFunc('z'),
        y: props.dividerLength,
        z: this.value('pwt34')
      };
      return attr ? dem[attr] : dem;
    };
    const panelRotFunc = () => {
      const isVertical = sectionProperties().vertical;
      if (isVertical) return 'xyz';
      else return 'xy';
    }

    const frameCenterFunc = (attr) => {
      const props = sectionProperties();
      const dem = {
        x: props.center.x,
        y: props.center.y,
        z: props.center.z
      };
      return attr ? dem[attr] : dem;
    };

    const frameDemFunc = (attr) => {
      const reqHeight = attr === 'y' || attr === undefined;
      const dem = {
        x: this.value('frw'),
        y: reqHeight ? sectionProperties().dividerLength : undefined,
        z: this.value('frt'),
      };
      return attr ? dem[attr] : dem;
    }

    const frameRotFunc = () => props().rotationFunc();

    const lastWidthCalc = {date: Number.MAX_SAFE_INTEGER};
    this.maxWidth = () => {
      const currentDate = new Date().getTime();
      if (lastWidthCalc.date < currentDate + 1000) {
        return lastWidthCalc.value;
      }
      if (!panel.included && !frame.included) return 0;

      let value;
      const panelWidth = panel.position().demension('z');
      const frameWidth = frame.position().demension('x');
      if (value === undefined && !frame.included) return panelWidth;
      if (value === undefined && !panel.included) return frameWidth;
      if (value === undefined) value = panelWidth > frameWidth ? panelWidth : frameWidth;
      lastWidthCalc.date = currentDate;
      lastWidthCalc.value = value;
      return value;
    }

    const index = props().index;
    const panel = new Panel(`dp-${index}`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc);
    const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
    this.addSubAssembly(panel);
    this.addSubAssembly(frame);
  }
}

DividerSection.abbriviation = 'dvrs';

Assembly.register(DividerSection);



class OpeningCoverSection extends SpaceSection {
  constructor(filePath, partCode, partName, divideProps, pullType) {
    super(filePath, partCode, partName, divideProps);
    const instance = this;

    pullType = pullType || PULL_TYPE.DOOR;
    let pulls = [];

    this.setHandleType = (pt) => pullType = pt;
    if (divideProps === undefined) return;

    this.updateHandles = (count) => {
      pulls = [];
      if (pullType === PULL_TYPE.DRAWER) {
        count = count || instance.drawerHandleCount();
        for (let index = 0; index < count; index += 1) {
          pulls.push(new Handle(`dwp-${index}`, 'Drawer.Handle', instance.drawerHandleCenter(index, count), instance.pullDems));
        }
      } else {
        pulls.push(new Handle(`dp`, 'Door.Handle', instance.doorHandleCenter, instance.pullDems, 'z'));
      }
    }

    this.coverDems = function(attr) {
      const dems = instance.outerSize().dems;
      dems.z = 3/4;
      return attr ? dems[attr] : dems;
    }

    this.coverCenter = function (attr) {
      const center = instance.outerSize().center;
      const inset = CoverStartPoints.INSIDE_RAIL === instance.value('csp');
      center.z = inset ? 3/8 : -3/4;
      return attr ? center[attr] : center;
    }

    this.hingeSide = () => {
      const props = divideProps();
      return props.borders.right.partCode === 'fr' ? '+x' : '-x';
    }


    const gap = 1/16;
    function duelDoorDems() {
      const dems = instance.coverDems();
      dems.x = (dems.x - gap) / 2;
      return dems;
    }
    this.duelDoorDems = duelDoorDems;

    function duelDoorCenter(right) {
      return function () {
        const direction = right ? -1 : 1;
        const center = instance.coverCenter();
        const dems = duelDoorDems();
        center.x += (dems.x + gap) / 2 * direction;
        return center;
      }
    }
    this.duelDoorCenter = duelDoorCenter;

    function closest(target) {
      let winner = {value: arguments[1], diff: Math.abs(target - arguments[1])};
      for (let index = 2; index < arguments.length; index += 1) {
        const value = arguments[index];
        const diff = Math.abs(target - value);
        if (diff < winner.diff) {
          winner = {diff, value}
        }
      }
      return winner.value;
    }

    this.drawerHandleCenter = (index, count) =>
      (attr) => {
        const center = instance.coverCenter(attr);
        const dems = instance.coverDems();
        const spacing = (dems.x / (count));
        center.x += -(dems.x/2) + spacing / 2 + spacing * (index);
        center.z -= (instance.coverDems('z') + dems.z) / 2;
        return center;
    };

    this.pullDems = (attr) => {
      const dems = {x: 1, y: 5, z: 2};
      return attr ? dems[attr] : dems;
    }

    this.doorHandleCenter = () => {
      const idealHandleHeight = instance.value('iph');
      const dems = this.coverDems();
      const center = this.coverCenter();
      const top = center.y +  dems.y / 2 - 4;
      const bottom = center.y -  dems.y / 2 + 4;
      const xOffset = dems.x / 2 - 1.5;
      center.x = center.x - xOffset * (this.hingeSide() === '-x' ? 1 : -1);
      center.y = closest(idealHandleHeight, top, center.y, bottom);
      center.z -= (instance.coverDems('z') + dems.z) / 2;
      return center;
    }

  }
}

OpeningCoverSection.dontSaveChildren = true;

Assembly.register(OpeningCoverSection);


class DoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('door'), partCode, 'Door.Section', divideProps);
    this.addSubAssembly(new Door('d', 'Door', this.coverCenter, this.coverDems));
  }
}

DoorSection.abbriviation = 'drs';
Assembly.register(DoorSection);


class DrawerSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('drawer'), partCode, 'Drawer.Section', divideProps, PULL_TYPE.DRAWER);
    if (divideProps === undefined) return;
    const instance = this;

    function getDrawerDepth(depth) {
      if (depth < 3) return 0;
      return Math.ceil((depth - 1)/2) * 2;
    }

    function drawerCenter(attr) {
      const props = divideProps();
      const dems = drawerDems();
      const center = instance.center();
      center.z += (dems.z - props.borders.top.position().demension('z')) / 2 - 1/8;
      return attr ? center[attr] : center;
    }

    function drawerDems(attr) {
      const props = divideProps();
      const dems = instance.innerSize()
      dems.z = getDrawerDepth(props.depth);
      dems.x = dems.x - 1/2;
      dems.y = dems.y - 1/2;
      return attr ? dems[attr] : dems;
    }

    this.addSubAssembly(new DrawerBox('db', 'Drawer.Box', drawerCenter, drawerDems));
    this.addSubAssembly(new DrawerFront('df', 'Drawer.Front', this.coverCenter, this.coverDems, '', this));
  }
}

DrawerSection.abbriviation = 'dws';

Assembly.register(DrawerSection);


class DualDoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('dual-door'), partCode, 'Duel.Door.Section', divideProps);
    if (divideProps === undefined) return;
    const rightDoor = new Door('dr', 'DoorRight', this.duelDoorCenter(true), this.duelDoorDems);
    this.addSubAssembly(rightDoor);
    rightDoor.setHandleLocation(Handle.location.TOP_LEFT);

    const leftDoor = new Door('dl', 'DoorLeft', this.duelDoorCenter(), this.duelDoorDems);
    this.addSubAssembly(leftDoor);
    leftDoor.setHandleLocation(Handle.location.TOP_RIGHT);
  }
}

DualDoorSection.abbriviation = 'dds';

Assembly.register(DualDoorSection);


class FalseFrontSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('false-front'), partCode, 'False.Front.Section', divideProps, PULL_TYPE.DRAWER);
    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', this.coverCenter, this.coverDems, '', this));
  }
}

FalseFrontSection.abbriviation = 'ffs';

Assembly.register(FalseFrontSection);



return {afterLoad};
}

window.onload = () => {
  try {
    index = index();
    index.afterLoad.forEach((item) => {item();});
  } catch (e) {
      console.log(e);
  }
}