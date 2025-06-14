from flask import Flask, request, render_template, send_from_directory, abort
import os
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='static')
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------- helpers ----------
def file_path(fname):
    return os.path.join(UPLOAD_FOLDER, secure_filename(fname))

# ---------- routes ----------
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        f = request.files.get('file')
        if f and f.filename:
            f.save(file_path(f.filename))
    files = sorted(os.listdir(UPLOAD_FOLDER))
    return render_template('index.html', files=files)

@app.route('/files/<filename>')
def download(filename):
    return send_from_directory(UPLOAD_FOLDER, filename,
                               as_attachment=True, download_name=filename)

@app.route('/delete/<filename>', methods=['POST'])
def delete(filename):
    try:
        os.remove(file_path(filename))
        return ('', 204)          # success, no content
    except FileNotFoundError:
        abort(404)

@app.route('/manifest.json')
def manifest():
    # served from /static, but many browsers look for /manifest.json
    return app.send_static_file('manifest.json')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'icon.png')

if __name__ == '__main__':
    # 0.0.0.0 → visible to any device on same Wi‑Fi / hotspot
    app.run(host='0.0.0.0', port=5000, threaded=True)
