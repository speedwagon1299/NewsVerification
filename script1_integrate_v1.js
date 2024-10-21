let factsList = []; // Declare factsList globally
let currentFactIndex = 0; // Track which fact is currently being typed
let verifyDictionary={};

function type(text, element, speed = 100) {
    return new Promise((resolve) => {
        let index = 0;
        element.innerText = ''; // Clear previous text

        function typeNextChar() {
            if (index < text.length) {
                const char = text.charAt(index);
                element.innerText += char === ' ' ? '\u00A0' : char; // Non-breaking space for visible space
                index++;
                setTimeout(typeNextChar, speed);
            } else {
                resolve(); // Resolve the promise when typing is complete
            }
        }
        typeNextChar(); // Start the typing effect
    });
}

async function postDataSummarize(url_text) {
    const data = {
        text: url_text,
        max_length: 128,
        num_beams: 5
    };

    try {
        const nextSection = document.getElementById('second');
        const response = await fetch('http://127.0.0.1:5000/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        nextSection.scrollIntoView({ behavior: 'smooth' });

        const result = await response.json();
        factsList = result.resolved_facts;

        // Display the facts immediately
        const container = document.getElementById('facts');
        container.innerHTML = ''; // Clear previous facts

        // Start fetching verification results
        const verificationPromise = postDataVerifier();

        // Type each fact one by one
        for (const fact of factsList) {
            const factItem = document.createElement('div');
            factItem.className = 'fact-item';
            container.appendChild(factItem);
            await type(fact, factItem, 25); // Type the fact
        }

        // Wait for verification results to finish
        await verificationPromise;

        // After typing is complete, display arrows and verification details
        displayVerificationResults();

    } catch (error) {
        console.error("Error while posting data:", error);
        document.getElementById('facts').textContent = "An error occurred while fetching the data.";
    }
}

async function postDataVerifier() {
    const data = {
        text: factsList,
        max_length: 128,
        num_beams: 5
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const results = await response.json();

        // Prepare the verification dictionary
        results.fact_verification_results.forEach(result => {
            const fact = result.fact;
            if (!verifyDictionary[fact]) {
                verifyDictionary[fact] = []; // Start with an empty array for the fact
            }

            // Create a new entry for the current result
            const entry = {
                url: result.url,
                contradict: (result.verification_result.nli_result.contradiction * 100).toFixed(2),
                agree: (result.verification_result.nli_result.entailment * 100).toFixed(2),
                neutral: (result.verification_result.nli_result.neutral * 100).toFixed(2),
                conf: (result.verification_result.confidence * 100).toFixed(2)
            };

            verifyDictionary[fact].push(entry);
            console.log("Verification fetched");
        });

    } catch (error) {
        console.error("Error while posting data:", error);
        document.getElementById('body-text').textContent = "An error occurred while fetching the data.";
    }
}

function displayVerificationResults() {
    const container = document.getElementById('facts');
    // Clear existing facts to add arrows
    container.innerHTML = ''; 

    factsList.forEach(fact => {
        const factItem = document.createElement('div');
        factItem.className = 'fact-item';

        // Create an arrow
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = '➤';
        arrow.style.cursor = 'pointer'; // Make it clickable

        // Create a body text div for the verification results
        const bodyText = document.createElement('div');
        bodyText.className = 'body-text';
        bodyText.style.display = 'none'; // Initially hidden

        // Build the content for the body text
        let bodyTextContent = '';
        (verifyDictionary[fact] || []).forEach(entry => {
            bodyTextContent += `The article ${entry.url} agrees with this fact ${entry.agree}%, contradicts the fact ${entry.contradict}% and is neutral ${entry.neutral}%. Confidence in this result is: ${entry.conf}%.\n\n`;
        });

        //bodyText.innerText = bodyTextContent;
        type(bodyTextContent,bodyText,80);

        // Append the arrow, fact, and body text to the fact item
        factItem.appendChild(arrow);
        factItem.appendChild(document.createTextNode(fact)); // Append the fact text
        factItem.appendChild(bodyText);
        container.appendChild(factItem);

        // Add click event to toggle body text
        arrow.addEventListener('click', () => {
            // Collapse all other body texts
            const allBodyTexts = document.querySelectorAll('.body-text');
            allBodyTexts.forEach(otherBodyText => {
                if (otherBodyText !== bodyText) {
                    otherBodyText.style.display = 'none'; // Hide other body texts
        
                    // Find the arrow associated with the other body text
                    const otherArrow = otherBodyText.previousElementSibling; // Get the previous sibling
                    if (otherArrow && otherArrow.classList.contains('arrow')) {
                        otherArrow.style.transform = 'rotate(0deg)'; // Reset rotation
                    }
                }
            });
        
            // Toggle the clicked body text
            const isVisible = bodyText.style.display === 'block';
            bodyText.style.display = isVisible ? 'none' : 'block'; // Toggle display
            arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)'; // Rotate arrow
        });        
    });
}



async function searchwebsite(event) {
    if (event.key === 'Enter') {
        const searchInput = event.target.value;
        const resultDiv = document.getElementById('result');
        //const nextSection = document.getElementById('second');
        const factDiv = document.getElementById('facts');
        //const factsList = ['1. List', '2. Testing', '3. Okay done'];
        //const factsList = [];
        //const currentFactIndex = 0; // Initialize index for new search

        // Clear the input field and previous facts
        event.target.value = '';
        factDiv.innerHTML = ''; // Clear previous facts

        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
            return; // Exit if no input
        } else {
            resultDiv.innerText = `${searchInput}`;
            await postDataSummarize(`${searchInput}`); // Wait for the summarization
        }
        //nextSection.scrollIntoView({ behavior: 'smooth' });
        // Start typing the first fact
    }
}


document.getElementById('searchInput2').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput3').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput4').addEventListener('keydown', searchwebsite);

//const aboutButton = document.querySelector()

// Function to scroll to a specific section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Attach a click event listener to the nav-links container
document.querySelectorAll('.nav-links').forEach(nav => {
    nav.addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName === 'A') {
            event.preventDefault(); // Prevent default anchor behavior
            const sectionId = target.getAttribute('href').substring(1); // Get section ID from href
            scrollToSection(sectionId); // Scroll to the specified section
        }
    });
});