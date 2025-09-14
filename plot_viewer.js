document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch data from a file named plot_data.json
    try {
        const response = await fetch('plot_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setupInteractivePlot(data);
    } catch (error) {
        document.getElementById('text-container').textContent = "Error: Could not load plot_data.json.";
        console.error(error);
    }
});

function setupInteractivePlot(data) {
    const { tokens, probabilities, split_point } = data;
    const tokenIndices = Array.from({ length: tokens.length }, (_, i) => i);

    const textContainer = document.getElementById('text-container');
    const plotDiv = document.getElementById('plot');
    
    // 2. Render the text with a <span> for each token
    textContainer.innerHTML = tokens.map((token, index) => 
        `<span data-index="${index}">${escapeHtml(token)}</span>`
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
        shapes: [] // Vertical line will be added here
    };

    Plotly.newPlot(plotDiv, [promptTrace, completionTrace], layout);

    // 4. Add hover interactivity
    textContainer.addEventListener('mouseover', (event) => {
        if (event.target.tagName === 'SPAN') {
            const index = event.target.dataset.index;
            const updatedLayout = {
                shapes: [{
                    type: 'line', x0: index, x1: index, y0: 0, y1: 1,
                    line: { color: 'red', width: 2, dash: 'dash' }
                }]
            };
            Plotly.relayout(plotDiv, updatedLayout);
        }
    });
    
    textContainer.addEventListener('mouseout', () => {
        Plotly.relayout(plotDiv, { shapes: [] });
    });
}

// Helper function to prevent issues with special characters like < or >
function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
