let deviceName = localStorage.getItem("deviceName");
if (!deviceName) {
  deviceName = prompt("Enter your device name:");
  localStorage.setItem("deviceName", deviceName);
}
document.getElementById("devicename-info").textContent = "📱 Device: " + deviceName;

const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const speedDisplay = document.getElementById('speedDisplay');
const popup = document.getElementById('popup');

fileInput.addEventListener('change', () => {
  fileName.textContent = [...fileInput.files].map(f => f.name).join(', ');
});

document.getElementById('uploadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const files = fileInput.files;

  [...files].forEach(file => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", "/upload", true);

    const start = Date.now();
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        let percent = (e.loaded / e.total) * 100;
        let speed = (e.loaded / 1024 / 1024) / ((Date.now() - start) / 1000);
        progressBar.style.width = percent + "%";
        progressContainer.style.display = "block";
        speedDisplay.textContent = `↑ ${speed.toFixed(2)} MB/s`;
      }
    };

    xhr.onload = () => {
      progressContainer.style.display = "none";
      progressBar.style.width = "0%";
      speedDisplay.textContent = '';
      fileInput.value = '';
      fileName.textContent = 'No file selected';
    };

    xhr.send(formData);
  });
});

function refreshFileList() {
  fetch("/list_files")
    .then(res => res.json())
    .then(files => {
      const ul = document.getElementById("fileList");
      ul.innerHTML = "";
      files.forEach(f => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${f}</span>
          <div>
            <button onclick="downloadFile('${f}')">Download</button>
            <button onclick="deleteFile('${f}')">Delete</button>
          </div>
        `;
        ul.appendChild(li);
      });
    });
}

function downloadFile(name) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/files/" + encodeURIComponent(name), true);
  xhr.responseType = 'blob';
  xhr.setRequestHeader("X-Device-Name", deviceName);

  const start = Date.now();
  xhr.onprogress = function(e) {
    if (e.lengthComputable) {
      let percent = (e.loaded / e.total) * 100;
      let speed = (e.loaded / 1024 / 1024) / ((Date.now() - start) / 1000);
      progressBar.style.width = percent + "%";
      progressContainer.style.display = "block";
      speedDisplay.textContent = `↓ ${speed.toFixed(2)} MB/s`;
    }
  };

  xhr.onload = function() {
    const blob = xhr.response;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
    progressBar.style.width = '0%';
    progressContainer.style.display = 'none';
    speedDisplay.textContent = '';
  };

  xhr.send();
}

function deleteFile(name) {
  fetch("/delete/" + encodeURIComponent(name), { method: "POST" })
    .then(res => {
      if (!res.ok) alert("Delete failed");
    });
}

function showPopup(msg) {
  popup.innerText = msg;
  popup.style.display = 'block';
  setTimeout(() => { popup.style.display = 'none'; }, 4000);
}

const stream = new EventSource("/stream");
stream.onmessage = function(e) {
  if (e.data.startsWith("popup::")) {
    showPopup(e.data.slice(7));
  } else if (e.data === "refresh") {
    refreshFileList();
  }
};

refreshFileList();
