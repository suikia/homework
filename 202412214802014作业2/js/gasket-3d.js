"use strict";

// 引入glMatrix的vec3模块
const { vec3 } = glMatrix;

var gl;
var canvas;
var program; // 新增程序对象变量，避免重复创建

var points = [];
var colors = [];

var numTimesToSubdivide = 5;

// 页面加载初始化
window.onload = function init() {
    // 获取画布元素
    canvas = document.getElementById("gl-canvas");
    if (!canvas) {
        alert("未找到id为'gl-canvas'的画布元素");
        return;
    }

    // 获取WebGL上下文，优先WebGL2，失败则回退WebGL
    gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
        alert("WebGL环境不可用，请更换浏览器重试");
        return;
    }

    // 初始化3D Sierpinski四面体顶点数据（正四面体顶点）
    var vertices = [
        0.0000, 0.0000, -1.0000,  // 顶点1
        0.0000, 0.9428, 0.3333,   // 顶点2
        -0.8165, -0.4714, 0.3333, // 顶点3
        0.8165, -0.4714, 0.3333   // 顶点4
    ];

    // 从顶点数组创建vec3向量
    var t = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
    var u = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
    var v = vec3.fromValues(vertices[6], vertices[7], vertices[8]);
    var w = vec3.fromValues(vertices[9], vertices[10], vertices[11]);

    // 清空数组（防止重复加载时数据叠加）
    points = [];
    colors = [];
    // 递归细分四面体
    divideTetra(t, u, v, w, numTimesToSubdivide);

    // 配置WebGL环境
    gl.viewport(0, 0, canvas.width, canvas.height); // 设置视口
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // 白色背景
    gl.enable(gl.DEPTH_TEST); // 启用深度测试（3D必备，处理遮挡）

    // 初始化着色器程序
    program = initShaders();
    if (!program) {
        console.error("着色器程序初始化失败");
        return;
    }
    gl.useProgram(program);

    // 加载顶点数据到GPU
    loadVertexData();
    // 加载颜色数据到GPU
    loadColorData();

    // 执行渲染
    render();
};

// 初始化着色器程序（直接在JS中定义着色器源码）
function initShaders() {
    // 顶点着色器源码（300 ES版本，处理顶点位置和颜色传递）
    const vertexShaderSource = `#version 300 es
        in vec3 vPosition; // 顶点位置输入
        in vec4 aColor;    // 顶点颜色输入
        out vec4 vColor;   // 传递给片段着色器的颜色

        void main() {
            gl_Position = vec4(vPosition, 1.0); // 输出顶点裁剪坐标
            vColor = aColor; // 传递颜色
        }`;

    // 片段着色器源码（300 ES版本，处理像素颜色）
    const fragmentShaderSource = `#version 300 es
        precision mediump float; // 定义浮点数精度
        in vec4 vColor;          // 从顶点着色器接收的颜色
        out vec4 fragColor;      // 输出像素颜色

        void main() {
            fragColor = vColor; // 直接使用传递的颜色
        }`;

    // 创建顶点着色器
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    // 检查顶点着色器编译错误
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert("顶点着色器编译错误：" + gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return null;
    }

    // 创建片段着色器
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    // 检查片段着色器编译错误
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert("片段着色器编译错误：" + gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        gl.deleteShader(vertexShader);
        return null;
    }

    // 创建并链接着色器程序
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    // 检查程序链接错误
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("着色器程序链接错误：" + gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return null;
    }

    // 链接成功后删除着色器（释放资源）
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
}

// 加载顶点数据到GPU缓冲区
function loadVertexData() {
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    // 将顶点数组转为Float32Array（WebGL要求的格式）
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // 获取顶点着色器中"vPosition"属性位置
    const vPositionLoc = gl.getAttribLocation(program, "vPosition");
    if (vPositionLoc === -1) {
        alert("未找到顶点着色器中的'vPosition'属性");
        return;
    }
    // 配置顶点属性指针（3个分量/浮点数/不归一化/步长0/偏移0）
    gl.vertexAttribPointer(vPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc); // 启用该属性
}

// 加载颜色数据到GPU缓冲区
function loadColorData() {
    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    // 将颜色数组转为Float32Array
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // 获取顶点着色器中"aColor"属性位置
    const aColorLoc = gl.getAttribLocation(program, "aColor");
    if (aColorLoc === -1) {
        alert("未找到顶点着色器中的'aColor'属性");
        return;
    }
    // 配置颜色属性指针（4个分量：RGBA）
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColorLoc); // 启用该属性
}

// 绘制单个三角形（添加顶点和对应颜色）
function triangle(a, b, c, colorIdx) {
    // 基础颜色数组：4种颜色（RGBA），对应4个四面体面
    const baseColors = [
        1.0, 0.0, 0.0, 1.0,  // 红色（索引0）
        0.0, 0.0, 1.0, 1.0,  // 绿色（索引1）
        0.0, 1.0, 0.0, 1.0,  // 蓝色（索引2）
        1.0, 0.0, 1.0, 1.0   // 黑色（索引3）
    ];

    // 为三角形的3个顶点分别添加颜色和坐标
    // 顶点a
    colors.push(...baseColors.slice(colorIdx * 4, (colorIdx + 1) * 4));
    points.push(a[0], a[1], a[2]);
    // 顶点b
    colors.push(...baseColors.slice(colorIdx * 4, (colorIdx + 1) * 4));
    points.push(b[0], b[1], b[2]);
    // 顶点c
    colors.push(...baseColors.slice(colorIdx * 4, (colorIdx + 1) * 4));
    points.push(c[0], c[1], c[2]);
}

// 绘制四面体（由4个三角形面组成）
function tetra(a, b, c, d) {
    // 4个面分别使用不同颜色（索引0-3）
    triangle(a, c, b, 0); // 面1：红色
    triangle(a, c, d, 1); // 面2：绿色
    triangle(a, b, d, 2); // 面3：蓝色
    triangle(b, c, d, 3); // 面4：黑色
}

// 递归细分四面体
function divideTetra(a, b, c, d, count) {
    // 递归终止条件：细分次数为0时直接绘制四面体
    if (count === 0) {
        tetra(a, b, c, d);
        return;
    }

    // 计算各顶点间的中点（线性插值）
    const ab = vec3.create();
    vec3.lerp(ab, a, b, 0.5); // a和b的中点
    const ac = vec3.create();
    vec3.lerp(ac, a, c, 0.5); // a和c的中点
    const ad = vec3.create();
    vec3.lerp(ad, a, d, 0.5); // a和d的中点
    const bc = vec3.create();
    vec3.lerp(bc, b, c, 0.5); // b和c的中点
    const bd = vec3.create();
    vec3.lerp(bd, b, d, 0.5); // b和d的中点
    const cd = vec3.create();
    vec3.lerp(cd, c, d, 0.5); // c和d的中点

    // 细分次数减1，递归处理4个新四面体
    const newCount = count - 1;
    divideTetra(a, ab, ac, ad, newCount);  // 新四面体1
    divideTetra(ab, b, bc, bd, newCount);  // 新四面体2
    divideTetra(ac, bc, c, cd, newCount);  // 新四面体3
    divideTetra(ad, bd, cd, d, newCount);  // 新四面体4
}

// 渲染函数（清除缓冲区并绘制）
function render() {
    // 清除颜色缓冲区和深度缓冲区（3D必须清除深度）
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // 绘制三角形：从第0个顶点开始，共points.length/3个三角形
    gl.drawArrays(gl.TRIANGLES, 0, points.length / 3);
}