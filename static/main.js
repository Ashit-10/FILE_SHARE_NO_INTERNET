/* ---------- upload with progress + speed ---------- */
document.getElementById('uploadForm').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('fileInput').files[0];
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
      const time = (performance.now() - t0) / 1000;          // seconds
      const kbps = (ev.loaded / 1024 / time).toFixed(1);     // KB/s
      speed.textContent = `${kbps} KB/s`;
    }
  };

  xhr.onload = () => location.reload();                      // refresh list
  xhr.open('POST', '/');
  const formData = new FormData();
  formData.append('file', file);
  xhr.send(formData);
});

/* ---------- download with progress + speed ---------- */
function downloadFile(ev, filename){
  ev.preventDefault();
  const url = `/files/${filename}`;
  const idx = [...ev.target.closest('ul').children].indexOf(ev.target.closest('li')) + 1;
  const bar   = document.getElementById(`bar-${idx}`);
  const speed = document.getElementById(`speed-${filename}`);

  bar.style.display = 'block';
  speed.textContent = '';
  let t0 = performance.now();

  const xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onprogress = ev2 => {
    if (ev2.lengthComputable) {
      bar.value = (ev2.loaded / ev2.total) * 100;
      const time = (performance.now() - t0) / 1000;
      const kbps = (ev2.loaded / 1024 / time).toFixed(1);
      speed.textContent = `${kbps} KB/s`;
    }
  };
  xhr.onload = () => {
    bar.style.display = 'none';
    speed.textContent = '';
    const blob = xhr.response;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  xhr.open('GET', url);
  xhr.send();
}

/* ---------- delete file (AJAX) ---------- */
function deleteFile(ev, filename){
  ev.preventDefault();
  if(!confirm(`Delete ${filename}?`)) return;
  fetch(`/delete/${filename}`, {method:'POST'})
    .then(res => {
      if(res.ok) location.reload();
      else alert('Delete failed');
    });
}
