document.getElementById('searchInput2').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput').addEventListener('keydown', searchwebsite);

function type(text, elementId, speed = 100) {
    let index = 0;

    function typeNextChar() {
        if (index < text.length) {
            document.getElementById(elementId).innerText += text.charAt(index);
            index++;
            setTimeout(typeNextChar, speed); // Adjust typing speed here (in milliseconds)
        }
    }

    typeNextChar(); // Start the typing effect
}

function searchwebsite(event){
    if (event.key === 'Enter') {
        const searchInput = event.target.value;
        const resultDiv = document.getElementById('result');
        const nextSection = document.getElementById('second');
        const factDiv = document.getElementById('facts');

        // Clear the input field after submitting
        event.target.value = '';
        factDiv.innerText = '';

        // Start the typing effect
        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
        } else {
            //console.log(`You searched for: ${searchInput}`); // Print to console
            resultDiv.innerText = `${searchInput}`; // Display on page
        }
        nextSection.scrollIntoView({ behavior: 'smooth' });
        type('1.List \n 2.Testing \n 3.Okay done','facts',100);
    }
};
