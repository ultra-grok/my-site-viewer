document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Fetch data from the NEW file
        const response = await fetch('all_plot_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const dataset = await response.json(); // This is now an array of samples
        setupViewer(dataset);
    } catch (error) {
        document.getElementById('text-container').textContent = "Error: Could not load all_plot_data.json.";
        console.error(error);
    }
});

function setupViewer(dataset) {
    // Get references to HTML elements
    const textContainer = document.getElementById('text-container');
    const plotDiv = document.getElementById('plot');
    const entryCounter = document.getElementById('entryCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentIndex = 0;

    // This function renders a single sample by its index
    function displaySample(index) {
        const data = dataset[index];
        const { tokens, probabilities, split_point } = data;
        const tokenIndices = Array.from({ length: tokens.length }, (_, i) => i);

        // Update counter text
        entryCounter.textContent = `Sample ${currentIndex + 1} of ${dataset.length}`;

        // 2. Render the text with a <span> for each token
        textContainer.innerHTML = tokens.map((token, idx) => 
            `<span data-index="${idx}">${escapeHtml(token)}</span>`
        ).join('');

        // 3. Create the Plotly plot
        const promptTrace = {
            x: tokenIndices.slice(0, split_point),
            y: probabilities.slice(0, split_point),
            mode: 'lines+markers', name: 'Prompt', line: { color: 'gray' }, marker: { size: 4 }
        };
        const completionTrace = {
            x: tokenIndices.slice(split_point),
            y: probabilities.slice(split_point),
            mode: 'lines+markers', name: 'Completion', line: { color: 'green' }, marker: { size: 4 }
        };
        const layout = {
            title: 'Token-wise Probability',
            xaxis: { title: 'Token Index' },
            yaxis: { title: 'Probability', range: [-0.05, 1.05] },
            shapes: []
        };

        Plotly.newPlot(plotDiv, [promptTrace, completionTrace], layout);
    }

    // --- Navigation functions ---
    function showNextSample() {
        currentIndex = (currentIndex + 1) % dataset.length;
        displaySample(currentIndex);
    }

    function showPrevSample() {
        currentIndex = (currentIndex - 1 + dataset.length) % dataset.length;
        displaySample(currentIndex);
    }

    // --- Add event listeners ---
    nextBtn.addEventListener('click', showNextSample);
    prevBtn.addEventListener('click', showPrevSample);
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
            showNextSample();
        } else if (event.key === 'ArrowLeft') {
            showPrevSample();
        }
    });

    // --- Interactivity (remains the same) ---
    textContainer.addEventListener('mouseover', (event) => {
        if (event.target.tagName === 'SPAN') {
            const index = event.target.dataset.index;
            Plotly.relayout(plotDiv, { 
                shapes: [{
                    type: 'line', x0: index, x1: index, y0: 0, y1: 1,
                    line: { color: 'red', width: 2, dash: 'dash' }
                }]
            });
        }
    });
    
    textContainer.addEventListener('mouseout', () => {
        Plotly.relayout(plotDiv, { shapes: [] });
    });
    
    // Display the first sample initially
    displaySample(currentIndex);
}

// Helper function (remains the same)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
