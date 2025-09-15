document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('all_plot_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const dataset = await response.json(); // array of samples
        setupViewer(dataset);
    } catch (error) {
        document.getElementById('text-container').textContent = "Error: Could not load all_plot_data.json.";
        console.error(error);
    }
});

function setupViewer(dataset) {
    const textContainer = document.getElementById('text-container');
    const plotDiv = document.getElementById('plot');
    const entryCounter = document.getElementById('entryCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentIndex = 0;

    if (!Array.isArray(dataset) || dataset.length === 0) {
        entryCounter.textContent = "No samples found in all_plot_data.json.";
        textContainer.textContent = "";
        return;
    }

    function displaySample(index) {
        const data = dataset[index];
        const tokens = data.tokens || [];
        const probabilities = data.probabilities || [];
        const split_point = (typeof data.split_point === 'number') ? data.split_point : tokens.length;
        const label = (typeof data.label === 'number') ? data.label : 0; // 0=gen,1=true

        // token indices for plotting
        const tokenIndices = Array.from({ length: tokens.length }, (_, i) => i);

        // Update counter & label
        const labelText = label === 1 ? 'True (human)' : 'Generated (model)';
        entryCounter.textContent = `Sample ${currentIndex + 1} of ${dataset.length} — ${labelText}`;

        // Render tokens: mark prompt vs completion parts so CSS can style them
        textContainer.innerHTML = tokens.map((token, idx) => {
            const role = idx < split_point ? 'prompt' : 'completion';
            // escape and set attributes
            return `<span data-index="${idx}" data-role="${role}">${escapeHtml(token)}</span>`;
        }).join('');

        // Setup plotly traces
        const promptTrace = {
            x: tokenIndices.slice(0, split_point),
            y: probabilities.slice(0, split_point),
            mode: 'lines+markers',
            name: 'Prompt',
            line: { color: 'gray' },
            marker: { size: 4 }
        };

        // color completion trace by sample label
        const completionColor = label === 1 ? 'green' : 'orange';
        const completionTrace = {
            x: tokenIndices.slice(split_point),
            y: probabilities.slice(split_point),
            mode: 'lines+markers',
            name: label === 1 ? 'Completion (True)' : 'Completion (Gen)',
            line: { color: completionColor },
            marker: { size: 6 }
        };

        const layout = {
            title: 'Token-wise Probability',
            xaxis: { title: 'Token Index' },
            yaxis: { title: 'Probability', range: [-0.05, 1.05] },
            shapes: []
        };

        Plotly.newPlot(plotDiv, [promptTrace, completionTrace], layout, {responsive: true});
    }

    function showNextSample() {
        currentIndex = (currentIndex + 1) % dataset.length;
        displaySample(currentIndex);
    }

    function showPrevSample() {
        currentIndex = (currentIndex - 1 + dataset.length) % dataset.length;
        displaySample(currentIndex);
    }

    nextBtn.addEventListener('click', showNextSample);
    prevBtn.addEventListener('click', showPrevSample);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
            showNextSample();
        } else if (event.key === 'ArrowLeft') {
            showPrevSample();
        }
    });

    // Hover over text -> vertical line at token index on the plot
    textContainer.addEventListener('mouseover', (event) => {
        if (event.target.tagName === 'SPAN') {
            const index = parseInt(event.target.dataset.index, 10);
            if (!Number.isNaN(index)) {
                Plotly.relayout(plotDiv, { 
                    shapes: [{
                        type: 'line', x0: index, x1: index, y0: 0, y1: 1,
                        line: { color: 'red', width: 2, dash: 'dash' }
                    }]
                });
            }
        }
    });

    textContainer.addEventListener('mouseout', () => {
        Plotly.relayout(plotDiv, { shapes: [] });
    });

    // optional: click on a token to jump to that sample index on the plot (no-op here)
    // textContainer.addEventListener('click', (event) => { ... });

    // initial display
    displaySample(currentIndex);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
