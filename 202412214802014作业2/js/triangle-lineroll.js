"use strict";
const { vec3, mat4 } = glMatrix;

// 配置与状态
let [gl, program, verts = [], colors = []] = [];
let rot = 3*Math.PI, drag = false, lastX = 0;
const subdiv = 4, color = [0,0,0,1];

// 初始化
window.onload = () => {
    // 创建角度显示元素
    const angleDisplay = document.createElement('div');
    angleDisplay.style.fontFamily = 'Arial';
    angleDisplay.style.margin = '10px 0';
    document.body.insertBefore(angleDisplay, document.getElementById("gl-canvas"));

    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return alert("不支持WebGL");

    // 生成三角形
    const a = vec3.fromValues(-0.8, -0.8, 0);
    const b = vec3.fromValues(0, 0.8, 0);
    const c = vec3.fromValues(0.8, -0.8, 0);
    divide(a, b, c, subdiv);

    // 着色器（含旋转矩阵）
    program = initShader(`#version 300 es
        in vec3 vPosition;
        in vec4 aColor;
        out vec4 vColor;
        uniform mat4 rotMat;
        void main() {
            gl_Position = rotMat * vec4(vPosition, 1);
            vColor = aColor;
        }`, `#version 300 es
        precision mediump float;
        in vec4 vColor;
        out vec4 fragColor;
        void main() { fragColor = vColor; }`);

    // 缓冲区设置
    setBuffer("vPosition", new Float32Array(verts), 3);
    setBuffer("aColor", new Float32Array(colors), 4);

    // 事件监听（鼠标/触摸旋转）
    canvas.addEventListener('mousedown', e => (drag=true, lastX=e.clientX));
    canvas.addEventListener('mousemove', e => drag && (rot += (e.clientX-lastX)*0.005, lastX=e.clientX, render()));
    window.addEventListener('mouseup', () => drag=false);
    canvas.addEventListener('touchstart', e => (drag=true, lastX=e.touches[0].clientX, e.preventDefault()));
    canvas.addEventListener('touchmove', e => drag && (rot += (e.touches[0].clientX-lastX)*0.005, lastX=e.touches[0].clientX, render(), e.preventDefault()));
    window.addEventListener('touchend', () => drag=false);

    // 初始渲染
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(1,1,1,1);
    
    // 重写render函数，添加角度显示
    const originalRender = render;
    render = () => {
        originalRender();
        // 计算角度（弧度转角度，并取模360）
        const degrees = (rot * 180 / Math.PI) % 360;
        angleDisplay.textContent = `当前旋转角度: ${degrees.toFixed(1)}°`;
    };
    
    render();
};

// 递归细分
function divide(a, b, c, cnt) {
    if (!cnt) {
        addLine(a, b);
        addLine(b, c);
        addLine(c, a);
        return;
    }
    const ab = vec3.lerp(vec3.create(), a, b, 0.5);
    const bc = vec3.lerp(vec3.create(), b, c, 0.5);
    const ca = vec3.lerp(vec3.create(), c, a, 0.5);
    divide(a, ab, ca, cnt-1);
    divide(b, bc, ab, cnt-1);
    divide(c, ca, bc, cnt-1);
}

// 添加线段
function addLine(p1, p2) {
    verts.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
    colors.push(...color, ...color);
}

// 着色器工具
function initShader(vs, fs) {
    const v = compile(vs, gl.VERTEX_SHADER);
    const f = compile(fs, gl.FRAGMENT_SHADER);
    const p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.useProgram(p);
    return p;
}

function compile(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}

// 缓冲区工具
function setBuffer(attr, data, size) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, attr);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);
}

// 渲染（含旋转计算）
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    const mat = mat4.create();
    mat4.rotateZ(mat, mat, rot);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "rotMat"), false, mat);
    gl.drawArrays(gl.LINES, 0, verts.length/3);
}
