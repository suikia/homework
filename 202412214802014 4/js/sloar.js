// 获取画布和上下文（需确保DOM加载完成后执行，此处因JS在HTML末尾引入，可直接获取）
const canvas = document.getElementById('solarSystem');
const ctx = canvas.getContext('2d');

// 控制变量
let isRunning = true;
let time = 0;
let speed = 1;

// 太阳系配置 - 行星数据
const sun = {
    radius: 30,
    color: '#ffcc00',
    rotationSpeed: 0.01
};

const planets = [
    {
        name: '水星',
        distance: 60,
        radius: 5,
        color: '#a6a6a6',
        orbitSpeed: 0.04,
        rotationSpeed: 0.005,
        satellites: []
    },
    {
        name: '金星',
        distance: 100,
        radius: 8,
        color: '#ffaa88',
        orbitSpeed: 0.03,
        rotationSpeed: 0.003,
        satellites: []
    },
    {
        name: '地球',
        distance: 150,
        radius: 10,
        color: '#3366ff',
        orbitSpeed: 0.02,
        rotationSpeed: 0.01,
        satellites: [
            {
                distance: 20,
                radius: 3,
                color: '#cccccc',
                orbitSpeed: 0.1,
                rotationSpeed: 0.05
            }
        ]
    },
    {
        name: '火星',
        distance: 200,
        radius: 9,
        color: '#cc3333',
        orbitSpeed: 0.015,
        rotationSpeed: 0.009,
        satellites: []
    },
    {
        name: '木星',
        distance: 280,
        radius: 25,
        color: '#ffaa55',
        orbitSpeed: 0.01,
        rotationSpeed: 0.02,
        satellites: []
    }
];

// 中心位置（画布中心）
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// 绘制轨道
function drawOrbits() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // 绘制各行星轨道
    planets.forEach(planet => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, planet.distance, 0, Math.PI * 2);
        ctx.stroke();

        // 卫星轨道在绘制卫星时处理，此处仅为示意
    });
}

// 绘制天体（行星或卫星）
function drawCelestialBody(x, y, radius, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // 绘制天体
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制自转标记
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();

    ctx.restore();
}

// 绘制太阳
function drawSun() {
    drawCelestialBody(centerX, centerY, sun.radius, sun.color, time * sun.rotationSpeed);

    // 绘制太阳光芒
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.005);

    ctx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
    ctx.lineWidth = 2;

    for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(0, -sun.radius);
        ctx.lineTo(0, -sun.radius - 10);
        ctx.stroke();
    }

    ctx.restore();
}

// 绘制行星及其卫星
function drawPlanets() {
    planets.forEach(planet => {
        // 计算行星角度（公转）
        const angle = time * planet.orbitSpeed;

        // 计算行星位置
        const planetX = centerX + Math.cos(angle) * planet.distance;
        const planetY = centerY + Math.sin(angle) * planet.distance;

        // 绘制行星（含自转）
        drawCelestialBody(planetX, planetY, planet.radius, planet.color, time * planet.rotationSpeed);

        // 绘制卫星
        planet.satellites.forEach(satellite => {
            // 计算卫星角度（相对行星）
            const satelliteAngle = time * satellite.orbitSpeed;

            // 计算卫星位置（行星位置 + 相对位置）
            const satelliteX = planetX + Math.cos(satelliteAngle + angle) * satellite.distance;
            const satelliteY = planetY + Math.sin(satelliteAngle + angle) * satellite.distance;

            // 绘制卫星轨道
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.arc(planetX, planetY, satellite.distance, 0, Math.PI * 2);
            ctx.stroke();

            // 绘制卫星（含自转）
            drawCelestialBody(satelliteX, satelliteY, satellite.radius, satellite.color, time * satellite.rotationSpeed);
        });
    });
}

// 绘制星空背景
function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    for (let i = 0; i < 200; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 动画循环
function animate() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制顺序：星空 → 轨道 → 太阳 → 行星
    drawStars();
    drawOrbits();
    drawSun();
    drawPlanets();

    // 更新时间（控制动画进度）
    if (isRunning) {
        time += 0.02 * speed;
    }

    // 循环调用动画
    requestAnimationFrame(animate);
}

// 控制按钮事件监听
document.getElementById('start').addEventListener('click', () => {
    isRunning = true;
});

document.getElementById('stop').addEventListener('click', () => {
    isRunning = false;
});

// 速度调节事件监听
const speedInput = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');

speedInput.addEventListener('input', () => {
    speed = parseFloat(speedInput.value);
    speedValue.textContent = speed + 'x';
});

// 启动动画
animate();