import * as THREE from 'three';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// 场景初始化
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// 创建弓箭模型
const bowGeometry = new THREE.TorusGeometry(1, 0.1, 16, 100, Math.PI);
const bowMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
const bow = new THREE.Mesh(bowGeometry, bowMaterial);
scene.add(bow);

// 创建箭矢
const arrowGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2);
const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
arrow.rotation.z = Math.PI / 2;
scene.add(arrow);

// 摄像机位置
camera.position.z = 5;

// 初始化手势检测
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// 处理手势检测结果
hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    
    // 使用食指和拇指位置计算弓的位置和方向
    const indexFinger = landmarks[8];
    const thumb = landmarks[4];
    
    // 更新弓的位置
    bow.position.x = (indexFinger.x - 0.5) * 10;
    bow.position.y = -(indexFinger.y - 0.5) * 10;
    
    // 计算弓的旋转角度
    const angle = Math.atan2(thumb.y - indexFinger.y, thumb.x - indexFinger.x);
    bow.rotation.z = angle - Math.PI / 2;
    
    // 更新箭的位置
    arrow.position.copy(bow.position);
    arrow.rotation.z = angle - Math.PI / 2;
  }
});

// 设置摄像头
const videoElement = document.querySelector("#video");
const camera2 = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 320,
  height: 240
});
camera2.start();

// 射击功能
let isDrawing = false;
let power = 0;
const arrows = [];

function shoot() {
  const arrowClone = arrow.clone();
  arrowClone.position.copy(arrow.position);
  arrowClone.rotation.copy(arrow.rotation);
  
  const direction = new THREE.Vector3(
    Math.cos(arrowClone.rotation.z + Math.PI / 2),
    Math.sin(arrowClone.rotation.z + Math.PI / 2),
    0
  );
  
  arrowClone.velocity = direction.multiplyScalar(power);
  arrows.push(arrowClone);
  scene.add(arrowClone);
  
  power = 0;
  isDrawing = false;
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  // 更新箭的物理
  arrows.forEach((arrow, index) => {
    arrow.position.add(arrow.velocity);
    arrow.velocity.y -= 0.01; // 重力
    
    // 移除超出范围的箭
    if (Math.abs(arrow.position.x) > 20 || Math.abs(arrow.position.y) > 20) {
      scene.remove(arrow);
      arrows.splice(index, 1);
    }
  });
  
  renderer.render(scene, camera);
}

animate();

// 窗口大小调整
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// 手势控制射击
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isDrawing) {
    isDrawing = true;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && isDrawing) {
    shoot();
  }
});

// 蓄力系统
setInterval(() => {
  if (isDrawing && power < 2) {
    power += 0.1;
  }
}, 100);
