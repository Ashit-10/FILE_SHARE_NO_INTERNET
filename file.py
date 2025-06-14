from flask import Flask, request, render_template, send_from_directory, jsonify, Response
from werkzeug.utils import secure_filename
import os, time, zipfile, queue

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

clients = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    f = request.files['file']
    filename = secure_filename(f.filename)
    f.save(os.path.join(UPLOAD_FOLDER, filename))
    broadcast("refresh")
    return 'OK'

@app.route('/files/<filename>')
def serve_file(filename):
    device = request.headers.get("X-Device-Name", "Unknown")
    broadcast(f"popup::{device} downloaded {filename}")
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

@app.route('/list_files')
def list_files():
    return jsonify(os.listdir(UPLOAD_FOLDER))

@app.route('/delete/<filename>', methods=['POST'])
def delete_file(filename):
    try:
        os.remove(os.path.join(UPLOAD_FOLDER, filename))
        broadcast("refresh")
        return 'Deleted'
    except:
        return 'Delete failed', 500

@app.route('/download_all')
def download_all():
    zip_path = os.path.join(UPLOAD_FOLDER, 'all_files.zip')
    with zipfile.ZipFile(zip_path, 'w') as zf:
        for file in os.listdir(UPLOAD_FOLDER):
            if file != "all_files.zip":
                zf.write(os.path.join(UPLOAD_FOLDER, file), arcname=file)
    return send_from_directory(UPLOAD_FOLDER, 'all_files.zip', as_attachment=True)

@app.route('/stream')
def stream():
    def event_stream(q):
        while True:
            msg = q.get()
            yield f"data: {msg}\n\n"
    q = queue.Queue()
    clients.append(q)
    return Response(event_stream(q), mimetype="text/event-stream")

def broadcast(message):
    for c in clients:
        c.put(message)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
