"use strict";

const { vec3 } = glMatrix;

var canvas;
var gl;

var points = [];

/** Parameters */
var numTimesToSubdivide = 5; // 细分次数，控制图形复杂度，值越大图形越精细
var radius = 1.0;

window.onload = function initTriangles() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL isn't available");
  }

  // 初始化谢尔宾斯基三角形的三个顶点
  // 极角分别为 90°、210°、-30°
  var vertices = [
    radius * Math.cos(90 * Math.PI / 180.0), radius * Math.sin(90 * Math.PI / 180.0), 0,
    radius * Math.cos(210 * Math.PI / 180.0), radius * Math.sin(210 * Math.PI / 180.0), 0,
    radius * Math.cos(-30 * Math.PI / 180.0), radius * Math.sin(-30 * Math.PI / 180.0), 0
  ];

  var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
  var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
  var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);

  divideTriangle(u, v, w, numTimesToSubdivide);

  // 配置 WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  // 加载着色器并初始化属性缓冲区
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // 将数据加载到 GPU
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

  // 将着色器变量与数据缓冲区关联
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  renderTriangles();
};

function tessellaTriangle(a, b, c) {
  var a_new = vec3.create();
  var b_new = vec3.create();
  var c_new = vec3.create();

  // 计算每个点到原点的距离，并以此距离作为旋转角度（弧度制）
  var d_a = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  var d_b = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  var d_c = Math.sqrt(c[0] * c[0] + c[1] * c[1]);

  // 对每个顶点应用旋转：x' = x*cos(d*rad) - y*sin(d*rad)；y' = x*sin(d*rad) + y*cos(d*rad)
  vec3.set(a_new, 
    a[0] * Math.cos(d_a) - a[1] * Math.sin(d_a), 
    a[0] * Math.sin(d_a) + a[1] * Math.cos(d_a), 
    0
  );
  vec3.set(b_new, 
    b[0] * Math.cos(d_b) - b[1] * Math.sin(d_b), 
    b[0] * Math.sin(d_b) + b[1] * Math.cos(d_b), 
    0
  );
  vec3.set(c_new, 
    c[0] * Math.cos(d_c) - c[1] * Math.sin(d_c), 
    c[0] * Math.sin(d_c) + c[1] * Math.cos(d_c), 
    0
  );

  // 将旋转后的顶点加入绘制点集合（绘制线段，所以每两个点组成一条线段）
  points.push(
    a_new[0], a_new[1], a_new[2],
    b_new[0], b_new[1], b_new[2],
    b_new[0], b_new[1], b_new[2],
    c_new[0], c_new[1], c_new[2],
    c_new[0], c_new[1], c_new[2],
    a_new[0], a_new[1], a_new[2]
  );
}

function divideTriangle(a, b, c, count) {
  // 递归终止条件：当细分次数为 0 时，直接绘制三角形
  if (count === 0) {
    tessellaTriangle(a, b, c);
  } else {
    // 计算各边中点
    var ab = vec3.create();
    vec3.lerp(ab, a, b, 0.5);
    var bc = vec3.create();
    vec3.lerp(bc, b, c, 0.5);
    var ca = vec3.create();
    vec3.lerp(ca, c, a, 0.5);

    // 对四个新三角形继续细分
    divideTriangle(a, ab, ca, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(ca, bc, c, count - 1);
    divideTriangle(ab, bc, ca, count - 1);
  }
}

function renderTriangles() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // 以线段方式绘制所有点
  gl.drawArrays(gl.LINES, 0, points.length / 3);
}