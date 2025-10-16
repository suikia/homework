"use strict";

const { vec3 } = glMatrix;

var canvas;
var gl;

var points = [];

var numTimesToSubdivide = 10;

window.onload = function initTriangles() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) {
    gl = canvas.getContext("webgl");
  }
  if (!gl) {
    alert("WebGL isn't available");
    return;
  }

  var vertices = [
    -1, -1, 0,
    0, 1, 0,
    1, -1, 0
  ];

  var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
  var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
  var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);

  divideTriangle(u, v, w, numTimesToSubdivide);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  const vertexShaderSource = `#version 300 es
    in vec3 vPosition;
    void main() {
      gl_Position = vec4(vPosition, 1.0);
    }
  `;

  const fragmentShaderSource = `#version 300 es
    precision mediump float;
    out vec4 fragColor;
    void main() {
      fragColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert("顶点着色器编译错误: " + gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert("片段着色器编译错误: " + gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(fragmentShader);
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("无法链接程序: " + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return;
  }

  gl.useProgram(program);

  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  if (vPosition === -1) {
    console.error("无法找到vPosition属性");
    return;
  }
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  renderTriangles();
};

function triangle(a, b, c) {
  points.push(a[0], a[1], a[2]);
  points.push(b[0], b[1], b[2]);
  points.push(c[0], c[1], c[2]);
}

function divideTriangle(a, b, c, count) {
  if (count === 0) {
    triangle(a, b, c);
  } else {
    var ab = vec3.create();
    vec3.lerp(ab, a, b, 0.5);
    var bc = vec3.create();
    vec3.lerp(bc, b, c, 0.5);
    var ca = vec3.create();
    vec3.lerp(ca, c, a, 0.5);

    divideTriangle(a, ab, ca, count - 1);
    divideTriangle(b, bc, ab, count - 1);
    divideTriangle(c, ca, bc, count - 1);
  }
}

function renderTriangles() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, points.length / 3);
}