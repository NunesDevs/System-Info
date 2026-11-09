from flask import Flask, jsonify, render_template
from monitor import get_system_stats

def create_app(stats_provider=None):
    app = Flask(__name__)
    provider = stats_provider or get_system_stats

    @app.get('/')
    def index():
        return render_template('index.html')

    @app.get('/stats')
    def stats():
        try:
            return jsonify(provider())
        except (OSError, RuntimeError):
            return jsonify(error='Não foi possível coletar as métricas agora.'), 503

    @app.after_request
    def private_metrics_headers(response):
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'no-referrer'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
        return response

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='127.0.0.1', debug=False)
