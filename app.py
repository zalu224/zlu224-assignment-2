from flask import Flask, render_template, request, send_file, jsonify
import numpy as np
from kmeans import KMeans, generate_dataset, initial_capture
import os
import shutil
import json

app = Flask(__name__)

# Global variables
kmeans = None
total_steps = 0
data_points = None

def cleanup_step_images():
    folder_path = 'static/step_images'
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)
    os.makedirs(folder_path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/initial')
def initial():
    global data_points
    num_points = int(request.args.get('numPoints', 300))
    data_points = generate_dataset(num_points)
    initial_capture(data_points)
    return send_file('static/initial_visualization.png')

@app.route('/generate')
def generate():
    global kmeans, total_steps
    k = int(request.args.get('k', 3))
    init_method = request.args.get('init_method', 'random')
    cleanup_step_images()
    kmeans = KMeans(data_points, k)
    total_steps = kmeans.lloyds(init_method)
    return jsonify({"total_steps": total_steps})

@app.route('/generate_manual')
def generate_manual():
    global kmeans, total_steps
    data_selected = request.args.get('manual_data')
    selected_points = json.loads(data_selected)
    cleanup_step_images()
    k = len(selected_points)
    kmeans = KMeans(data_points, k)
    total_steps = kmeans.manual_lloyds(selected_points)
    return jsonify({"total_steps": total_steps})

@app.route('/step')
def step():
    step_number = int(request.args.get('step', 0))
    if step_number >= total_steps:
        step_number = total_steps - 1
    image_path = f'static/step_images/step_{step_number}.png'
    return send_file(image_path)


@app.route('/reset')
def reset():
    global kmeans, total_steps
    kmeans = None 
    total_steps = 0
    cleanup_step_images()
    return send_file('static/initial_visualization.png')

@app.route('/newDataset')
def new_dataset():
    global kmeans, total_steps, data_points
    kmeans = None 
    total_steps = 0
    cleanup_step_images()
    num_points = int(request.args.get('numPoints', 300))
    data_points = generate_dataset(num_points)
    initial_capture(data_points)
    return send_file('static/initial_visualization.png')

@app.route('/getDataPoints')
def get_data_points():
    global data_points
    return jsonify(data_points.tolist() if data_points is not None else [])

if __name__ == '__main__':
    app.run(debug=True, port=3000)