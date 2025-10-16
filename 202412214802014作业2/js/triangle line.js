"use strict";
const { vec3 } = glMatrix;

// 配置参数
const subdivisions = 4;
const lineColor = [0, 0, 1, 1]; // 黑色线条
let gl, program, vertices = [], colors = [];

// 初始化
window.onload = () => {
    // 获取WebGL上下文
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return alert("不支持WebGL");

    // 初始三角形顶点
    const a = vec3.fromValues(-0.8, -0.8, 0);
    const b = vec3.fromValues(0, 0.8, 0);
    const c = vec3.fromValues(0.8, -0.8, 0);

    // 生成分形数据
    divide(a, b, c, subdivisions);

    // 初始化着色器
    program = initShaderProgram(`#version 300 es
        in vec3 vPosition;
        in vec4 aColor;
        out vec4 vColor;
        void main() {
            gl_Position = vec4(vPosition, 1);
            vColor = aColor;
        }`, `#version 300 es
        precision mediump float;
        in vec4 vColor;
        out vec4 fragColor;
        void main() { fragColor = vColor; }`);

    // 设置缓冲区
    setBuffer("vPosition", new Float32Array(vertices), 3);
    setBuffer("aColor", new Float32Array(colors), 4);

    // 渲染配置
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1);
    render();
};

// 递归细分三角形
function divide(a, b, c, count) {
    if (count === 0) {
        addLine(a, b);
        addLine(b, c);
        addLine(c, a);
        return;
    }
    // 计算中点
    const ab = vec3.lerp(vec3.create(), a, b, 0.5);
    const bc = vec3.lerp(vec3.create(), b, c, 0.5);
    const ca = vec3.lerp(vec3.create(), c, a, 0.5);
    // 递归
    divide(a, ab, ca, count - 1);
    divide(b, bc, ab, count - 1);
    divide(c, ca, bc, count - 1);
}

// 添加线段
function addLine(p1, p2) {
    // 顶点坐标
    vertices.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    // 颜色（重复两次，对应两个端点）
    colors.push(...lineColor, ...lineColor);
}

// 初始化着色器程序
function initShaderProgram(vsSource, fsSource) {
    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
}

// 编译着色器
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

// 设置缓冲区
function setBuffer(attr, data, size) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, attr);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);
}

// 渲染
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, vertices.length / 3);
}
