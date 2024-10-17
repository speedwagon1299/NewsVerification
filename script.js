document.getElementById('searchInput2').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput').addEventListener('keydown', searchwebsite);

function type(text, element, speed = 100) {
    let index = 0;
    element.innerText = ''; // Clear previous text

    function typeNextChar() {
        if (index < text.length) {
            const char = text.charAt(index);
            element.innerText += char === ' ' ? '\u00A0' : char; // Non-breaking space for visible space
            index++;
            setTimeout(typeNextChar, speed);
        }
    }

    typeNextChar(); // Start the typing effect
}

function searchwebsite(event) {
    if (event.key === 'Enter') {
        const searchInput = event.target.value;
        const resultDiv = document.getElementById('result');
        const nextSection = document.getElementById('second');
        const factDiv = document.getElementById('facts');

        // Clear the input field after submitting
        event.target.value = '';
        factDiv.innerHTML = ''; // Clear previous facts

        // Start the typing effect
        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
        } else {
            resultDiv.innerText = `${searchInput}`; // Display on page
        }
        nextSection.scrollIntoView({ behavior: 'smooth' });

        // Prepare facts with arrows
        const factsList = ['1. List', '2. Testing', '3. Okay done'];
        let currentFactIndex = 0; // Track which fact is currently being typed

        function typeNextFact() {
            if (currentFactIndex < factsList.length) {
                const fact = factsList[currentFactIndex];
                const factItem = document.createElement('div');
                factItem.className = 'fact-item';

                const arrow = document.createElement('span');
                arrow.className = 'arrow';
                arrow.textContent = '➤';

                const headingText = document.createElement('span');
                headingText.className = 'heading-text';

                const bodyText = document.createElement('div');
                bodyText.className = 'body-text';
                bodyText.style.display = 'none'; // Start hidden

                // Create a typing effect for heading text
                type(fact, headingText, 100);

                // Create typing effect for body text
                const bodyTextContent = `Details about ${fact}`;
                bodyText.innerText = bodyTextContent;

                factItem.appendChild(arrow);
                factItem.appendChild(headingText);
                factItem.appendChild(bodyText);
                factDiv.appendChild(factItem);

                // Add click event to toggle body text and rotate arrow
                arrow.addEventListener('click', () => {
                    const allBodyTexts = document.querySelectorAll('.body-text');
                    const allArrows = document.querySelectorAll('.arrow');

                    // Collapse other body texts and reset their arrows
                    allBodyTexts.forEach((text, index) => {
                        if (text !== bodyText) {
                            text.style.display = 'none'; // Hide other body texts
                            allArrows[index].style.transform = 'rotate(0deg)'; // Reset rotation
                        }
                    });

                    // Toggle this body text and rotate arrow
                    const isVisible = bodyText.style.display === 'block';
                    bodyText.style.display = isVisible ? 'none' : 'block';
                    arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';

                    // Type out the body text with effect if visible
                    if (!isVisible) {
                        type(bodyTextContent, bodyText, 100); // Typing effect for body text
                    }
                });

                // Increment the index and call the next fact after a delay
                currentFactIndex++;
                setTimeout(typeNextFact, 1000); // Wait before typing the next fact
            }
        }

        // Start typing the first fact
        typeNextFact();
    }
}
