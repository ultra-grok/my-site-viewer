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
    
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchStatus = document.getElementById('searchStatus');
    const searchResultsContainer = document.getElementById('searchResultsContainer');

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

        const tokenIndices = Array.from({ length: tokens.length }, (_, i) => i);

        const labelText = label === 1 ? 'True (human)' : 'Generated (model)';
        entryCounter.textContent = `Sample ${currentIndex + 1} of ${dataset.length} — ${labelText}`;

        textContainer.innerHTML = tokens.map((token, idx) => {
            const role = idx < split_point ? 'prompt' : 'completion';
            return `<span data-index="${idx}" data-role="${role}">${escapeHtml(token)}</span>`;
        }).join('');

        const promptTrace = {
            x: tokenIndices.slice(0, split_point),
            y: probabilities.slice(0, split_point),
            mode: 'lines+markers',
            name: 'Prompt',
            line: { color: 'gray' },
            marker: { size: 4 }
        };

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
    
    function performSearch() {
        const query = searchInput.value.trim();
        searchResultsContainer.innerHTML = '';
        searchStatus.textContent = '';

        if (!query) {
            searchStatus.textContent = "Please enter a search term.";
            return;
        }
        
        const queryLower = query.toLowerCase();
        const matches = [];
        dataset.forEach((sample, index) => {
            const sampleText = (sample.tokens || []).join('');
            if (sampleText.toLowerCase().includes(queryLower)) {
                matches.push({ index, text: sampleText });
            }
        });

        if (matches.length === 0) {
            searchStatus.textContent = "No matches found.";
        } else {
            searchStatus.textContent = `Found ${matches.length} match(es).`;
            const resultsHtml = matches.map(match => {
                const snippet = createSnippet(match.text, query);
                return `<div class="search-result-item" data-index="${match.index}">
                            <div class="result-index">Sample ${match.index + 1}</div>
                            <div class="result-snippet">${snippet}</div>
                        </div>`;
            }).join('');
            searchResultsContainer.innerHTML = resultsHtml;
        }
    }
    
    function createSnippet(text, query) {
        const snippetLength = 120; // How many characters to show
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        
        const matchIndex = textLower.indexOf(queryLower);
        const start = Math.max(0, matchIndex - Math.floor(snippetLength / 2));
        const end = Math.min(text.length, start + snippetLength);
        
        let snippet = text.substring(start, end);

        // Highlight all occurrences in the snippet using a case-insensitive regex
        const regex = new RegExp(escapeRegExp(query), 'gi');
        snippet = escapeHtml(snippet).replace(regex, (match) => `<strong>${match}</strong>`);

        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        return snippet;
    }

    nextBtn.addEventListener('click', showNextSample);
    prevBtn.addEventListener('click', showPrevSample);

    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT') return; // Don't navigate while typing in search
        if (event.key === 'ArrowRight') {
            showNextSample();
        } else if (event.key === 'ArrowLeft') {
            showPrevSample();
        }
    });
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    searchResultsContainer.addEventListener('click', (event) => {
        const resultItem = event.target.closest('.search-result-item');
        if (resultItem && resultItem.dataset.index) {
            const index = parseInt(resultItem.dataset.index, 10);
            currentIndex = index;
            displaySample(currentIndex);
        }
    });

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

    displaySample(currentIndex);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
