from flask import Flask, render_template, jsonify
import requests
app = Flask(__name__)
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/getdata')
def get_data():
    url = "https://data.nasa.gov/api/views/gh4g-9sfh/rows.json?accessType=DOWNLOAD"
    response = requests.get(url)
    return jsonify(response.json())
@app.route('/moreinfo')
def more_info():
    return render_template('moreinfo.html')
if __name__ == '__main__':
    app.run(debug=True)
