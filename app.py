from flask import Flask, jsonify, render_template
from monitor import get_system_stats

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stats')
def stats():
    return jsonify(get_system_stats())

if __name__ == '__main__':
    app.run(debug=True)
