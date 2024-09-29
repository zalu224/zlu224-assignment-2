import numpy as np
import matplotlib.pyplot as plt
import os

def ensure_dir(file_path):
    directory = os.path.dirname(file_path)
    if not os.path.exists(directory):
        os.makedirs(directory)

def generate_dataset(num_points):
    return np.random.rand(num_points, 2) * 10

def initial_capture(data):
    plt.figure(figsize=(8, 6))
    plt.scatter(data[:, 0], data[:, 1], c='blue', alpha=0.6)
    plt.title('KMeans Clustering Data')
    plt.xlabel('X-axis')
    plt.ylabel('Y-axis')
    plt.grid()
    ensure_dir('static/initial_visualization.png')
    plt.savefig('static/initial_visualization.png')
    plt.close()

class KMeans:
    def __init__(self, data, k):
        self.data = data
        self.k = k
        self.centroids = None
        self.labels = np.zeros(len(data), dtype=int)
        
    def initialize_centroids(self, method='random'):
        if method == 'random':
            return self.data[np.random.choice(len(self.data), self.k, replace=False)]
        elif method == 'farthest_first':
            return self._farthest_first()
        elif method == 'kmean_plus':
            return self._kmeans_plus_plus()
        else:
            raise ValueError("Invalid initialization method")

    def _farthest_first(self):
        centroids = [self.data[np.random.randint(len(self.data))]]
        for _ in range(1, self.k):
            distances = np.min([np.linalg.norm(self.data - centroid, axis=1) for centroid in centroids], axis=0)
            centroids.append(self.data[np.argmax(distances)])
        return np.array(centroids)

    def _kmeans_plus_plus(self):
        centroids = [self.data[np.random.randint(len(self.data))]]
        for _ in range(1, self.k):
            distances = np.min([np.linalg.norm(self.data - centroid, axis=1) for centroid in centroids], axis=0)
            probabilities = distances**2 / np.sum(distances**2)
            cumulative_probs = np.cumsum(probabilities)
            r = np.random.rand()
            next_centroid_idx = np.where(cumulative_probs >= r)[0][0]
            centroids.append(self.data[next_centroid_idx])
        return np.array(centroids)

    def assign_clusters(self):
        distances = np.linalg.norm(self.data[:, np.newaxis] - self.centroids, axis=2)
        self.labels = np.argmin(distances, axis=1)

    def update_centroids(self):
        new_centroids = np.array([self.data[self.labels == i].mean(axis=0) if np.sum(self.labels == i) > 0 
                                  else self.centroids[i] for i in range(self.k)])
        if np.all(self.centroids == new_centroids):
            return False
        self.centroids = new_centroids
        return True

    def lloyds(self, init_method='random'):
        self.centroids = self.initialize_centroids(init_method)
        steps = 0
        self.capture(steps)  # Capture initial state
        while True:
            old_centroids = self.centroids.copy()
            self.assign_clusters()
            self.update_centroids()
            steps += 1
            self.capture(steps)
            if np.all(old_centroids == self.centroids):
                break
        return steps + 1  # +1 to include the initial state

    def manual_lloyds(self, selected_points):
        self.centroids = np.array([[point['x'], point['y']] for point in selected_points])
        steps = 0
        self.capture(steps)  # Capture initial state
        while True:
            old_centroids = self.centroids.copy()
            self.assign_clusters()
            self.update_centroids()
            steps += 1
            self.capture(steps)
            if np.all(old_centroids == self.centroids):
                break
        return steps + 1  # +1 to include the initial state

    def capture(self, step):
        plt.figure(figsize=(8, 6))
        plt.scatter(self.data[:, 0], self.data[:, 1], c=self.labels, alpha=0.6, cmap='viridis')
        plt.scatter(self.centroids[:, 0], self.centroids[:, 1], c='red', marker='X', s=200, label='Centroids')
        plt.title(f'KMeans Clustering Step {step}')
        plt.xlabel('X-axis')
        plt.ylabel('Y-axis')
        plt.grid()
        plt.legend()
        file_path = f'static/step_images/step_{step}.png'
        plt.savefig(file_path)
        plt.close()