let deviceName = localStorage.getItem("deviceName");
if (!deviceName) {
  deviceName = prompt("Enter a name for this device:");
  if (deviceName) localStorage.setItem("deviceName", deviceName);
}
document.getElementById("devicename-info").textContent = "📱 Device: " + deviceName;

const fileInput = document.getElementById('fileInput');
const fileNameEl = document.getElementById('fileName');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');

fileInput.addEventListener('change', () => {
  const files = [...fileInput.files].map(f => f.name).join(', ');
  fileNameEl.textContent = files || 'No file selected';
});

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = fileInput.files;
  for (let file of files) {
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload", true);
    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressContainer.style.display = 'block';
        progressBar.style.width = percent + '%';
      }
    };
    xhr.onload = () => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    };
    xhr.send(fd);
  }
});

function refreshFileList() {
  fetch('/list_files')
    .then(r => r.json())
    .then(files => {
      const ul = document.getElementById('fileList');
      ul.innerHTML = '';
      files.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${f}</span>
          <button onclick="downloadFile('${f}')">Download</button>
          <button onclick="deleteFile('${f}')">Delete</button>
        `;
        ul.appendChild(li);
      });
    });
}

function downloadFile(filename){
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/files/" + encodeURIComponent(filename), true);
  xhr.responseType = 'blob';
  xhr.setRequestHeader("X-Device-Name", localStorage.getItem("deviceName") || "Unknown");

  xhr.onload = () => {
    const blob = xhr.response;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  xhr.send();
}

function deleteFile(filename){
  fetch(`/delete/${filename}`, {method:'POST'})
    .then(r => r.ok ? null : alert("Delete failed"));
}

refreshFileList();

const evtSource = new EventSource("/stream");
evtSource.onmessage = function() {
  refreshFileList();
};
