let factsList = []; // Declare factsList globally
let currentFactIndex = 0; // Track which fact is currently being typed
let verifyDictionary = {};

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

async function postDataSummarize(url_text) {
    // Define the JSON data to be sent
    const data = {
        text: url_text, //variable
        max_length: 128,
        num_beams: 5
    };

    try {
        // Send a POST request with the JSON data
        const response = await fetch('http://127.0.0.1:8000/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data) // Convert JS object to JSON string
        });

        // Parse the response as JSON
        const result = await response.json();
        factsList=result.resolved_facts;
        postDataVerifier();

        /* 
        // Log the received result
        console.log("Resolved Sentences:", result.resolved_facts);

        // Get the div where the sentences will be shown
        const container = document.getElementById('resolved-sentences-container'); //variable

        // Clear the container before displaying new results
        container.innerHTML = '';

        // Display the resolved sentences in the container
        if (result.resolved_facts && result.resolved_facts.length > 0) {
            result.resolved_facts.forEach(sentence => {
                const p = document.createElement('p');
                p.textContent = sentence;
                container.appendChild(p);
            });
        } else {
            container.textContent = "No resolved sentences found.";
        }*/
    } catch (error) {
        console.error("Error while posting data:", error);
        document.getElementById('facts').textContent = "An error occurred while fetching the data.";
    }
}

async function postDataVerifier() {
    // Define the JSON data to be sent
    const data = {
        text: factList, //variable
        max_length: 128,
        num_beams: 5
    };

    try {
        // Send a POST request with the JSON data
        const response = await fetch('http://127.0.0.1:8000/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data) // Convert JS object to JSON string
        });

        // Parse the response as JSON
        const results = await response.json();
        //bodyTextContent=result.resolved_facts;
        /*results.forEach(result=>
        {
            //const fact = result.fact;
            const url = result.url;
            const contradict = (result.verification_result.nli_result.contradiction *100).toFixed(2);
            const agree = (result.verification_result.nli_result.entailment*100).toFixed(2);
            const neutral = (result.verification_result.nli_result.neutral*100).toFixed(2);
            const conf = (result.verification_result.confidence * 100).toFixed(2);

            bodyTextContent=bodyTextContent + "\n" + "The website "+url+" offers "+contradict+"% contradiction, \n"+agree+"% agreement and is "+neutral+"% neutral with "+conf+"% confidence";
        }*/

        /*results.fact_verification_results.forEach(result => {
            const fact = result.fact;

            // Initialize the dictionary entry for this fact if it doesn't exist
            /*if (!dictionary[fact]) {
                dictionary[fact] = []
                /*    url: [],
                    contradict: [],
                    agree: [],
                    neutral: [],
                    conf: [],
                };
            }

            // Add the current result to the respective lists
            dictionary[fact].url.push(result.url);
            dictionary[fact].contradict.push((result.verification_result.nli_result.contradiction * 100).toFixed(2)); // Convert to percentage
            dictionary[fact].agree.push((result.verification_result.nli_result.entailment * 100).toFixed(2)); // Convert to percentage
            dictionary[fact].neutral.push((result.verification_result.nli_result.neutral * 100).toFixed(2)); // Convert to percentage
            dictionary[fact].conf.push((result.verification_result.confidence * 100).toFixed(2)); // Convert to percentage
        });*/

        /*dictionary = data.fact_verification_results.map(item => ({
            fact: item.fact,
            results: item.results.map(result => ({
                url: result.url,
                verificationResult: {
                    result: result.verification_result.result,
                    confidence: result.verification_result.confidence.toFixed(2) // Rounding to 2 decimal places
                }
            }))
        }));*/

        results.fact_verification_results.forEach(result => {
        const fact = result.fact;
        if (!verifyDictionary[fact]) {
            verifyDictionary[fact] = []; // Start with an empty array for the fact
        }

        // Create a new entry for the current result
        const entry = {
            url: result.url,
            contradict: (result.verification_result.nli_result.contradiction * 100).toFixed(2), // Convert to percentage
            agree: (result.verification_result.nli_result.entailment * 100).toFixed(2), // Convert to percentage
            neutral: (result.verification_result.nli_result.neutral * 100).toFixed(2), // Convert to percentage
            conf: (result.verification_result.confidence * 100).toFixed(2) // Convert to percentage
        };

        // Push the new entry to the list for the corresponding fact
        verifyDictionary[fact].push(entry);
    });
        

    } catch (error) {
        console.error("Error while posting data:", error);
        document.getElementById('body-text').textContent = "An error occurred while fetching the data.";
    }
}

function searchwebsite(event) {
    if (event.key === 'Enter') {
        const searchInput = event.target.value;
        const resultDiv = document.getElementById('result');
        const nextSection = document.getElementById('second');
        const factDiv = document.getElementById('facts');
        //const factsList = ['1. List', '2. Testing', '3. Okay done'];
        //const factsList = [];
        currentFactIndex = 0; // Initialize index for new search

        // Clear the input field and previous facts
        event.target.value = '';
        factDiv.innerHTML = ''; // Clear previous facts

        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
            return; // Exit if no input
        } else {
            resultDiv.innerText = `${searchInput}`; // Display search term
            //const verifyDictionary={};
            postDataSummarize(`${searchInput}`); 
        }
        nextSection.scrollIntoView({ behavior: 'smooth' });

        //type(
        // Start typing the first fact
        typeNextFact(currentFactIndex);
    }
}

function typeNextFact(currentFactIndex) {
    if (currentFactIndex < factsList.length) {
        const fact = factsList[currentFactIndex];
        const factItem = document.createElement('div');
        factItem.className = 'fact-item';

        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.style.display = 'none';
        arrow.textContent = '➤';

        const headingText = document.createElement('span');
        headingText.className = 'heading-text';

        const bodyText = document.createElement('div');
        bodyText.className = 'body-text';
        bodyText.style.display = 'none'; // Start hidden

        // Create a typing effect for heading text
        type(fact, headingText, 100);

        // Create typing effect for body text
        let bodyTextContent='';
        //postDataVerifier(fact, bodyTextContent)
        //const bodyTextContent = `Details about ${fact}`;
        const specificFactDict=verifyDictionary[fact] || {};
        if (specificFactDict) {
            specificFactDict.urls.forEach((url, index) => {
                bodyTextContent += `The article ${url} agrees with this fact ${specificFactDict.agree[index]}%, contradicts the fact ${specificFactDict.contradict[index]}% and is neutral ${specificFactDict.neutral[index]}%. Confidence in this result is: ${specificFactDict.conf[index]}%.\n`;
            });
        }
        bodyText.innerText = bodyTextContent;

        factItem.appendChild(arrow);
        factItem.appendChild(headingText);
        factItem.appendChild(bodyText);
        document.getElementById('facts').appendChild(factItem);

        if (Object.keys(verifyDictionary).length == factsList.length*5) {
            arrow.style.display = 'inline-block'; // Show the arrow if data is populated
        }

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
        setTimeout(() => {
            typeNextFact(currentFactIndex + 1, factsList,verifyDictionary); // Pass incremented index
        }, 1000); // Wait before typing the next fact
    }
}

document.getElementById('searchInput2').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput').addEventListener('keydown', searchwebsite);

