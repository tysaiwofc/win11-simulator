const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
let painting = false;

document.querySelector('.window-control.minimize').addEventListener('click', () => {
  window.electronAPI.minimizeWindow();  // Minimize a janela
});

document.querySelector('.window-control.close').addEventListener('click', () => {
  window.electronAPI.closeWindow();  // Fechar a janela
});

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');

// Configurar o canvas para ocupar toda a tela
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBackground();
}

function drawBackground() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function startPosition(e) {
  painting = true;
  draw(e);
}

function endPosition() {
  painting = false;
  ctx.beginPath();
}

function draw(e) {
  if (!painting) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = 'round';
  ctx.strokeStyle = colorPicker.value;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function clearCanvas() {
  drawBackground();
}

function saveCanvas() {
  const link = document.createElement('a');
  link.download = 'meu_desenho.png';

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = 1920;
  tempCanvas.height = 1080;
  
  tempCtx.fillStyle = 'white';
  tempCtx.fillRect(0, 0, 1920, 1080);

  tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 1920, 1080);
  
  link.href = tempCanvas.toDataURL();
  link.click();
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
