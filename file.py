from flask import Flask, render_template, request, send_from_directory, send_file, jsonify
import os
import io
import queue
import zipfile

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

clients = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file:
        file.save(os.path.join(UPLOAD_FOLDER, file.filename))
        for q in clients:
            q.put("refresh")
    return ('', 204)

@app.route('/files/<filename>')
def download(filename):
    device_name = request.headers.get("X-Device-Name", "Unknown")
    log_line = f"[DOWNLOAD] {filename} by {device_name}"
    print(log_line)
    with open("downloads.log", "a") as f:
        f.write(log_line + "\n")
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True, download_name=filename)

@app.route('/delete/<filename>', methods=['POST'])
def delete(filename):
    try:
        os.remove(os.path.join(UPLOAD_FOLDER, filename))
        for q in clients:
            q.put("refresh")
        return ('', 204)
    except:
        return ('File not found', 404)

@app.route('/stream')
def stream():
    def event_stream(q):
        try:
            while True:
                yield f"data: {q.get()}

"
        except GeneratorExit:
            pass

    q = queue.Queue()
    clients.append(q)
    return app.response_class(event_stream(q), mimetype='text/event-stream')

@app.route('/list_files')
def list_files():
    files = os.listdir(UPLOAD_FOLDER)
    return jsonify(files)

@app.route('/download_all')
def download_all():
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            zf.write(filepath, arcname=filename)
    memory_file.seek(0)
    return send_file(memory_file, download_name="all_files.zip", as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
