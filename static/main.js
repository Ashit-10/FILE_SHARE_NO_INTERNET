/* ---------- show chosen filename ---------- */
const fileInput  = document.getElementById('fileInput');
const fileNameEl = document.getElementById('fileName');
fileInput.addEventListener('change', () => {
  fileNameEl.textContent = fileInput.files[0]?.name || 'No file selected';
});

/* ---------- upload with progress & speed ---------- */
document.getElementById('uploadForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return;

  const bar   = document.getElementById('uploadBar');
  const speed = document.getElementById('uploadSpeed');
  bar.style.display = 'block';
  speed.textContent = '';
  let t0 = performance.now();

  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = ev => {
    if (ev.lengthComputable) {
      bar.value = (ev.loaded / ev.total) * 100;
      const kbps = (ev.loaded / 1024 / ((performance.now() - t0) / 1000)).toFixed(1);
      speed.textContent = `${kbps} KB/s`;
    }
  };
  xhr.onload = () => location.reload();
  xhr.open('POST', '/');
  const fd = new FormData();
  fd.append('file', file);
  xhr.send(fd);
});

/* ---------- download with progress & speed ---------- */
function downloadFile(filename){
  const li      = [...document.querySelectorAll('#fileList li')]
                  .find(el => el.querySelector('.file-name').textContent === filename);
  const bar     = li.querySelector('progress');
  const speedEl = li.querySelector('.speed');

  bar.style.display = 'block';
  speedEl.textContent = '';
  let t0 = performance.now();

  const xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onprogress = ev => {
    if (ev.lengthComputable) {
      bar.value = (ev.loaded / ev.total) * 100;
      const kbps = (ev.loaded / 1024 / ((performance.now() - t0) / 1000)).toFixed(1);
      speedEl.textContent = `${kbps} KB/s`;
    }
  };
  xhr.onload = () => {
    bar.style.display = 'none';
    speedEl.textContent = '';
    const blob = xhr.response;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  xhr.open('GET', `/files/${filename}`);
  xhr.send();
}

/* ---------- delete ---------- */
function deleteFile(filename){
  if (!confirm(`Delete ${filename}?`)) return;
  fetch(`/delete/${filename}`, {method:'POST'})
    .then(r => r.ok ? location.reload() : alert('Delete failed'));
}

/* ---------- live auto‑refresh via Server‑Sent Events ---------- */
if (window.EventSource){
  const es = new EventSource('/events');
  es.onmessage = e => (e.data === 'refresh') && location.reload();
}
