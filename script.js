document.getElementById('searchInput2').addEventListener('keydown', searchWebsite);
document.getElementById('searchInput').addEventListener('keydown', searchWebsite);

function searchWebsite(event) {
    if (event.key === 'Enter') {
        const searchInput = event.target.value;
        const resultDiv = document.getElementById('result');
        const nextSection = document.getElementById('second');
        const factDiv = document.getElementById('facts');
        const loadingTextElement = document.getElementById('loading-text');

        // Clear the input field after submitting
        event.target.value = '';

        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
        } else {
            // Show the loading animation after the user presses Enter
            loadingTextElement.style.display = "block";
            updateStatusText();

            // Simulate processing delay (e.g., analyzing or fetching data)
            setTimeout(function () {
                loadingTextElement.style.display = "none"; // Hide the loading animation after processing
                resultDiv.innerText = `You searched for: ${searchInput}`; // Display the search input on the page

                // After processing is done, now scroll to the second section
                nextSection.scrollIntoView({ behavior: 'smooth' });

                // Display sample facts list
                factDiv.innerText = "1. List\n2. Testing\n3. Okay done";

            }, 3000); // Assume 3 seconds for processing (adjust as needed)
        }
    }
}

let statusMessages = ["Loading", "Analyzing", "Extracting","Comparing","Finalizing"];
let statusIndex = 0;
let dotCount = 0;

function updateStatusText() {
    let loadingTextElement = document.getElementById("loading-text");

    // Update status message and dots
    let dots = ".".repeat(dotCount); // Add 1, 2, or 3 dots
    loadingTextElement.innerHTML = statusMessages[statusIndex] + dots;

    // Update dots (cycle through 0, 1, 2, 3 dots)
    dotCount = (dotCount + 1) % 4;

    // Update status message every 6 seconds (2000 ms * 3 cycles)
    if (dotCount === 0) {
        statusIndex = (statusIndex + 1) % statusMessages.length; // Cycle through messages
    }

    setTimeout(updateStatusText, 500); // Update every 500ms for smoother dots animation
}
