document.getElementById('searchInput2').addEventListener('keydown', searchwebsite);
document.getElementById('searchInput').addEventListener('keydown', searchwebsite);

function searchwebsite(event){
    if (event.key === 'Enter') {
        const searchInput = event.target.value;
        const resultDiv = document.getElementById('result');
        const nextSection = document.getElementById('second');
        const factDiv = document.getElementById('facts');

        // Clear the input field after submitting
        event.target.value = '';

        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
        } else {
            //console.log(`You searched for: ${searchInput}`); // Print to console
            resultDiv.innerText = `${searchInput}`; // Display on page
        }
        nextSection.scrollIntoView({ behavior: 'smooth' });
        factDiv.innerText=`1.List\n2.Testing\n3.Okay done`
    }
};
