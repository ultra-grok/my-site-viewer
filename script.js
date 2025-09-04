document.addEventListener('DOMContentLoaded', () => {
    // This is a simplified fetch for local files.
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            setupViewer(data);
        })
        .catch(error => {
            document.getElementById('entryCounter').textContent = "Error: Could not load data.json. Make sure the file is in the same folder.";
            console.error(error);
        });
});

function setupViewer(dataset) {
    // Get references to the new HTML elements
    const completion2sftContent = document.getElementById('completion_2sft_Content');
    const completion1rlContent = document.getElementById('completion_1rl_Content');
    const promptContent = document.getElementById('promptContent');
    const entryCounter = document.getElementById('entryCounter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentIndex = 0;

    function displayEntry(index) {
        const entry = dataset[index];
        
        // Populate the elements with data from the new JSON structure
        completion2sftContent.textContent = entry.completion_2sft;
        completion1rlContent.textContent = entry.completion_1rl;
        promptContent.textContent = entry.prompt;
        
        // Update counter text
        entryCounter.textContent = `Entry ${currentIndex + 1} of ${dataset.length}`;
    }

    // --- NEW: Refactored navigation into separate functions ---

    function showNextEntry() {
        // This formula correctly wraps from the last item back to the first
        currentIndex = (currentIndex + 1) % dataset.length;
        displayEntry(currentIndex);
    }

    function showPrevEntry() {
        // This formula correctly wraps from the first item back to the last
        currentIndex = (currentIndex - 1 + dataset.length) % dataset.length;
        displayEntry(currentIndex);
    }

    // --- Add event listeners for buttons ---
    nextBtn.addEventListener('click', showNextEntry);
    prevBtn.addEventListener('click', showPrevEntry);

    // --- NEW: Add event listener for arrow keys ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
            showNextEntry();
        } else if (event.key === 'ArrowLeft') {
            showPrevEntry();
        }
    });

    // Display the first entry initially
    displayEntry(currentIndex);
}
