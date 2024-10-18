document.getElementById('searchInput2').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput').addEventListener('keydown', searchwebsite);

function type(text, element, speed = 100) {
    let index = 0;
    element.innerText = '';

    function typeNextChar() {
        if (index < text.length) {
            const char = text.charAt(index);
            element.innerText += char === ' ' ? '\u00A0' : char;
            index++;
            setTimeout(typeNextChar, speed);
        }
    }

    typeNextChar();
}

function searchwebsite(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchInput = event.target.value;
        const resultDiv = document.getElementById('result');
        const factDiv = document.getElementById('facts');
        const statusBar = event.target.id === 'searchInput' ? document.getElementById('statusBar') : document.getElementById('statusBar2');
        const wrapper = document.querySelector('.wrapper');
        const second = document.querySelector('.second');

        event.target.value = '';
        factDiv.innerHTML = '';
        statusBar.innerText = '';

        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
        } else {
            resultDiv.innerText = `${searchInput}`;
            resultDiv.style.textAlign = "center";
        }

        const stages = ["Loading", "Analyzing", "Extracting", "Comparing", "Concluding"];
        let currentStage = 0;

        function showNextStage() {
            if (currentStage < stages.length) {
                const stageText = stages[currentStage];
                let dots = '';

                let dotInterval = setInterval(() => {
                    if (dots.length < 3) {
                        dots += '.';
                    } else {
                        dots = '';
                    }
                    statusBar.innerText = stageText + dots;
                }, 500);

                setTimeout(() => {
                    clearInterval(dotInterval);
                    currentStage++;
                    showNextStage();
                }, 2000);
            } else {
                setTimeout(() => {
                    statusBar.innerText = 'Search completed!';
                    setTimeout(() => {
                        statusBar.innerText = '';
                    }, 2000);
                }, 1000);
            }
        }

        showNextStage();

        const factsList = ['1. List', '2. Testing', '3. Okay done'];
        let currentFactIndex = 0;

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
                bodyText.style.display = 'none';

                type(fact, headingText, 100);

                const bodyTextContent = `Details about ${fact}`;
                bodyText.innerText = bodyTextContent;

                factItem.appendChild(arrow);
                factItem.appendChild(headingText);
                factItem.appendChild(bodyText);
                factDiv.appendChild(factItem);

                arrow.addEventListener('click', (e) => {
                    e.preventDefault();
                    const allBodyTexts = document.querySelectorAll('.body-text');
                    const allArrows = document.querySelectorAll('.arrow');

                    allBodyTexts.forEach((text, index) => {
                        if (text !== bodyText) {
                            text.style.display = 'none';
                            allArrows[index].style.transform = 'rotate(0deg)';
                        }
                    });

                    const isVisible = bodyText.style.display === 'block';
                    bodyText.style.display = isVisible ? 'none' : 'block';
                    arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';

                    if (!isVisible) {
                        type(bodyTextContent, bodyText, 100);
                    }
                });

                currentFactIndex++;
                setTimeout(typeNextFact, 1000);
            }
        }

        setTimeout(() => {
            wrapper.style.transform = 'translateY(-100%)';
            second.style.transform = 'translateY(0)';
            
            setTimeout(typeNextFact, 500);
        }, stages.length * 2000 + 1000);
    }
}