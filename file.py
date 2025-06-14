from flask import Flask, request, render_template, send_from_directory, abort, Response
import os, queue
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static')
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

clients = []

def file_path(fname):
    return os.path.join(UPLOAD_FOLDER, secure_filename(fname))

# ---------- main page & upload ----------
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        f = request.files.get('file')
        if f and f.filename:
            f.save(file_path(f.filename))
            # notify all browsers to refresh
            for q in clients:
                q.put("refresh")
    files = sorted(os.listdir(UPLOAD_FOLDER))
    return render_template('index.html', files=files)

# ---------- download ----------
@app.route('/files/<filename>')
def download(filename):
    return send_from_directory(UPLOAD_FOLDER, filename,
                               as_attachment=True, download_name=filename)

# ---------- delete ----------
@app.route('/delete/<filename>', methods=['POST'])
def delete(filename):
    try:
        os.remove(file_path(filename))
        return ('', 204)
    except FileNotFoundError:
        abort(404)

# ---------- server‑sent events ----------
@app.route('/events')
def sse():
    def event_stream():
        q = queue.Queue()
        clients.append(q)
        try:
            while True:
                data = q.get()
                yield f'data: {data}\n\n'
        except GeneratorExit:
            clients.remove(q)
    return Response(event_stream(), mimetype='text/event-stream')

# ---------- PWA helpers ----------
@app.route('/manifest.json')
def manifest():
    return app.send_static_file('manifest.json')

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('icon.png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
