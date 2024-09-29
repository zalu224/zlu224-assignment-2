let currentStep = 0;
let totalSteps = 0;
let selectedPoints = [];

function generateInitialVisualization() {
    const numPoints = document.getElementById('numPoints').value || 300;
    const url = `/initial?numPoints=${numPoints}&t=${new Date().getTime()}`;
    const img = document.getElementById('data-visualization');
    img.src = url;
    img.style.display = 'block';
}

function stepThroughKMeans() {
    if (currentStep == 0) {
        initializeKMeans();
    } else if (currentStep > totalSteps) {
        alert("KMeans has converged.");
        return;
    } else {
        updateVisualization();
    }
}

function initializeKMeans() {
    const kClusters = document.getElementById('kClusters').value;
    const initMethod = document.getElementById('initMethod').value;
    const url = initMethod === 'manual' 
        ? `/generate_manual?k=${kClusters}&manual_data=${encodeURIComponent(JSON.stringify(selectedPoints))}`
        : `/generate?k=${kClusters}&init_method=${initMethod}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            totalSteps = data.total_steps;
            if (isNaN(totalSteps)) {
                console.error("Failed to retrieve total steps from the server.");
                return;
            }
            currentStep = 0;
            updateVisualization();
        })
        .catch(error => console.error("Error during initialization:", error));
}

function updateVisualization() {
    const img = document.getElementById('data-visualization');
    const timestamp = new Date().getTime();
    img.src = `/step?step=${currentStep}&t=${timestamp}`;
    img.style.display = 'block';
    currentStep++;
}

function runToConvergence() {
    if (currentStep == 0) {
        initializeKMeans();
    } else {
        currentStep = totalSteps;
        updateVisualization();
    }
}

function generateNewDataset() {
    const numPoints = document.getElementById('numPoints').value || 300;
    const url = `/newDataset?numPoints=${numPoints}&t=${new Date().getTime()}`;
    resetState();
    const img = document.getElementById('data-visualization');
    img.src = url;
    img.style.display = 'block';
}

function resetAlgorithm() {
    const url = `/reset`;
    resetState();
    const img = document.getElementById('data-visualization');
    img.src = url;
    img.style.display = 'block';
}

function resetState() {
    currentStep = 0;
    totalSteps = 0;
    selectedPoints = [];
    document.getElementById('initMethod').selectedIndex = 0;
}

document.getElementById('initMethod').addEventListener('change', function () {
    const selectedMethod = this.value;
    const canvas = document.getElementById('plotly-div');
    const img = document.getElementById('data-visualization');

    if (selectedMethod === 'manual') {
        img.style.display = 'none';
        canvas.style.display = 'block';
        fetch('/getDataPoints')
            .then(response => response.json())
            .then(dataPoints => {
                initManualSelection(dataPoints);
            });
    } else {
        canvas.style.display = 'none';
        img.style.display = 'block';
    }
});

function initManualSelection(initialData) {
    selectedPoints = []; // Reset selected points

    const trace = {
        x: initialData.map(point => point[0]),
        y: initialData.map(point => point[1]),
        mode: 'markers',
        type: 'scatter',
        marker: {color:'blue'},
        name: 'Data Points',
        showlegend: false
    };

    const layout = {
        title: 'Select Initial Centroids',
        xaxis: { title: 'X'},
        yaxis: {title: 'Y'},
        dragmode: 'select',
    };

    Plotly.newPlot('plotly-div', [trace], layout);

    const plotlyDiv = document.getElementById('plotly-div');

    plotlyDiv.on('plotly_click', function(data) {
        const x = data.points[0].x;
        const y = data.points[0].y;
        selectedPoints.push({ x, y });
        
        Plotly.addTraces(plotlyDiv, {
            x: [x],
            y: [y],
            mode: 'markers',
            marker: {color: 'red', size: 10, symbol: 'x'},
            type: 'scatter',
            name: `Centroid ${selectedPoints.length}`,
            hoverinfo: 'text',
            showlegend: true
        });

        updateCentroidCount();
    });
}

function updateCentroidCount() {
    const countDisplay = document.getElementById('centroidCount');
    countDisplay.textContent = `Selected Centroids: ${selectedPoints.length}`;
}

function initializeKMeans() {
    const initMethod = document.getElementById('initMethod').value;
    let url;
    
    if (initMethod === 'manual') {
        if (selectedPoints.length < 2) {
            alert("Please select at least 2 centroids for manual initialization.");
            return;
        }
        url = `/generate_manual?manual_data=${encodeURIComponent(JSON.stringify(selectedPoints))}`;
    } else {
        const kClusters = document.getElementById('kClusters').value;
        url = `/generate?k=${kClusters}&init_method=${initMethod}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            totalSteps = data.total_steps;
            if (isNaN(totalSteps)) {
                console.error("Failed to retrieve total steps from the server.");
                return;
            }
            currentStep = 0;
            isInitialized = true;
            updateVisualization();
        })
        .catch(error => console.error("Error during initialization:", error));
}

function stepThroughKMeans() {
    if (!isInitialized) {
        initializeKMeans();
    } else if (currentStep >= totalSteps) {
        alert("KMeans has converged.");
    } else {
        updateVisualization();
    }
}

function runToConvergence() {
    if (!isInitialized) {
        initializeKMeans();
    }
    currentStep = totalSteps - 1;
    updateVisualization();
}

function updateVisualization() {
    const img = document.getElementById('data-visualization');
    const timestamp = new Date().getTime();
    img.src = `/step?step=${currentStep}&t=${timestamp}`;
    img.style.display = 'block';
    currentStep++;

    // Hide Plotly div if it's visible
    document.getElementById('plotly-div').style.display = 'none';
}

function resetAlgorithm() {
    const url = `/reset`;
    resetState();
    const img = document.getElementById('data-visualization');
    img.src = url;
    img.style.display = 'block';
    document.getElementById('plotly-div').style.display = 'none';
}

function resetState() {
    currentStep = 0;
    totalSteps = 0;
    selectedPoints = [];
    isInitialized = false;
    document.getElementById('initMethod').selectedIndex = 0;
    document.getElementById('kClusters').style.display = 'block';
    document.getElementById('centroidCount').style.display = 'none';
    updateCentroidCount();
}

document.getElementById('initMethod').addEventListener('change', function () {
    const selectedMethod = this.value;
    const canvas = document.getElementById('plotly-div');
    const img = document.getElementById('data-visualization');
    const kClustersInput = document.getElementById('kClusters');
    const centroidCountDisplay = document.getElementById('centroidCount');

    if (selectedMethod === 'manual') {
        img.style.display = 'none';
        canvas.style.display = 'block';
        kClustersInput.style.display = 'none';
        centroidCountDisplay.style.display = 'block';
        fetch('/getDataPoints')
            .then(response => response.json())
            .then(dataPoints => {
                initManualSelection(dataPoints);
            });
    } else {
        canvas.style.display = 'none';
        img.style.display = 'block';
        kClustersInput.style.display = 'block';
        centroidCountDisplay.style.display = 'none';
    }
});


window.onload = function() {
    generateInitialVisualization();
    document.getElementById('centroidCount').style.display = 'none';
};
