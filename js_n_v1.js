// Global variables
let factsList = [];
let verifyDictionary = {};
let currentFactIndex = 0;

document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.querySelector(".navbar");
    const navSearch = document.querySelector(".navsearch");
    const homeSection = document.getElementById("home");

    // Function to show or hide the search bar based on the current section
    function toggleNavSearch() {
        const homeSectionRect = homeSection.getBoundingClientRect();
        // If we are in the Home section, hide the nav search bar
        if (
            homeSectionRect.top >= 0 &&
            homeSectionRect.bottom <= window.innerHeight
        ) {
            navSearch.style.display = "none";
        } else {
            navSearch.style.display = "flex";
        }
    }

    // Initial check on page load
    toggleNavSearch();

    // Check on scroll
    window.addEventListener("scroll", toggleNavSearch);
});

// // Function to extract title from URL (kept for other potential uses)
// async function extractTitleFromURL(url) {
//     try {
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error("Network response was not ok");
//         }
//         const html = await response.text();
//         const parser = new DOMParser();
//         const doc = parser.parseFromString(html, "text/html");
//         return `${doc.querySelector("title").innerText}`; // Make sure this is a string
//     } catch (error) {
//         console.error("Error fetching title:", error);
//         return "Error fetching title. Check the URL and try again.";
//     }
// }

async function extractTitleFromURL(url) {
    try {
        const response = await fetch("http://127.0.0.1:5000/fetch-title", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();
        return data.title; // Assuming the backend returns { "title": "Page Title" }
    } catch (error) {
        console.error("Error fetching title:", error);
        return "Error fetching title. Check the URL and try again.";
    }
}

// Typing animation function
function type(text, element, speed = 300) {
    return new Promise((resolve) => {
        let index = 0;
        element.innerText = "";

        function typeNextChar() {
            if (index < text.length) {
                const char = text.charAt(index);
                element.innerText += char === " " ? "\u00A0" : char;
                index++;
                setTimeout(typeNextChar, speed);
            } else {
                resolve();
            }
        }
        typeNextChar();
    });
}

// Status bar with promise
function updateStatusBarWithPromise(stages) {
    return new Promise((resolve) => {
        const statusBar = document.getElementById("statusBar");
        let currentStage = 0;
        const totalDuration = 15000;
        const stageDuration = totalDuration / stages.length;

        async function showNextStage() {
            if (currentStage < stages.length) {
                const stageText = stages[currentStage];
                let dots = "";

                const dotInterval = setInterval(() => {
                    dots = dots.length < 3 ? dots + "." : "";
                    statusBar.innerText = stageText + dots;
                }, 500);

                await new Promise((resolve) =>
                    setTimeout(resolve, stageDuration)
                );
                clearInterval(dotInterval);
                currentStage++;

                if (currentStage < stages.length) {
                    await showNextStage();
                } else {
                    document.body.style.overflow = "auto";
                    document.documentElement.style.overflow = "auto";
                    statusBar.innerText = "";
                    resolve();
                }
            }
        }

        showNextStage();
    });
}

// Scroll to section function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    const navbar = document.querySelector(".navbar");

    if (section) {
        section.scrollIntoView({ behavior: "smooth" });

        setTimeout(() => {
            navbar.classList.add("fixed");
            document.body.classList.add("fixed-navbar");
        }, 1000);
    }
}

// Main data processing function
async function postDataSummarize(url_text) {
    try {
        await updateStatusBarWithPromise([
            "Loading",
            "Analyzing",
            "Extracting",
            "Comparing",
            "Concluding",
        ]);
        scrollToSection("second");

        const data = {
            text: url_text,
            max_length: 128,
            num_beams: 5,
        };

        const response = await fetch("http://127.0.0.1:5000/summarize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        factsList = result.resolved_facts;

        const container = document.getElementById("facts");
        container.innerHTML = "";

        const verificationPromise = postDataVerifier();

        for (const fact of factsList) {
            const factItem = document.createElement("div");
            factItem.className = "fact-item";
            container.appendChild(factItem);
            await type(fact, factItem, 25);
        }

        await verificationPromise;
        displayVerificationResults();
    } catch (error) {
        console.error("Error while posting data:", error);
        document.getElementById("facts").textContent =
            "An error occurred while fetching the data.";
    }
}

// Verification function
async function postDataVerifier() {
    try {
        const response = await fetch("http://127.0.0.1:5000/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resolved_facts: factsList,
            }),
        });

        const results = await response.json();

        results.fact_verification_results.forEach((result) => {
            const fact = result.fact;
            if (!verifyDictionary[fact]) {
                verifyDictionary[fact] = [];
            }

            verifyDictionary[fact].push({
                url: result.url, // Store the full URL instead of extracting the title
                contradict: (
                    result.verification_result.nli_result.contradiction * 100
                ).toFixed(2),
                agree: (
                    result.verification_result.nli_result.entailment * 100
                ).toFixed(2),
                neutral: (
                    result.verification_result.nli_result.neutral * 100
                ).toFixed(2),
            });
        });
    } catch (error) {
        console.error("Error while posting data:", error);
        document.getElementById("body-text").textContent =
            "An error occurred while fetching the data.";
    }
}

// Display verification results
function displayVerificationResults() {
    const container = document.getElementById("facts");
    container.innerHTML = "";

    factsList.forEach((fact) => {
        const factItem = document.createElement("div");
        factItem.className = "fact-item";

        const arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.textContent = "➤";
        arrow.style.cursor = "pointer";

        const bodyText = document.createElement("div");
        bodyText.className = "body-text";
        bodyText.style.display = "none";

        const table = document.createElement("table");
        table.className = "verification-table";
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.marginTop = "10px";
        table.style.marginBottom = "20px";

        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr style="background-color: #f5f5f5;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Source</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Agrees</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Contradicts</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Neutral</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        let ea = 0;
        let en = 0;
        let ecn = 0;

        (verifyDictionary[fact] || []).forEach((entry) => {
            const row = document.createElement("tr");

            // Display the full URL as non-clickable text
            row.innerHTML = `
                <td style="padding: 12px; border: 1px solid #ddd; word-break: break-all;">
                    ${entry.url}
                </td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${entry.agree}%</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${entry.contradict}%</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${entry.neutral}%</td>
            `;
            tbody.appendChild(row);

            ea += parseFloat(entry.agree);
            en += parseFloat(entry.neutral);
            ecn += parseFloat(entry.contradict);
        });

        const numEntries = verifyDictionary[fact].length;
        const summaryRow = document.createElement("tr");
        summaryRow.style.backgroundColor = "#f9f9f9";
        summaryRow.style.fontWeight = "bold";
        summaryRow.innerHTML = `
            <td style="padding: 12px; border: 1px solid #ddd;">Average</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${(
                ea / numEntries
            ).toFixed(2)}%</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${(
                ecn / numEntries
            ).toFixed(2)}%</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${(
                en / numEntries
            ).toFixed(2)}%</td>
        `;
        tbody.appendChild(summaryRow);

        table.appendChild(tbody);
        bodyText.appendChild(table);

        factItem.appendChild(arrow);
        factItem.appendChild(document.createTextNode(fact));
        factItem.appendChild(bodyText);
        container.appendChild(factItem);

        arrow.addEventListener("click", () => {
            const allBodyTexts = document.querySelectorAll(".body-text");
            allBodyTexts.forEach((otherBodyText) => {
                if (otherBodyText !== bodyText) {
                    otherBodyText.style.display = "none";
                    const otherArrow = otherBodyText.previousElementSibling;
                    if (otherArrow && otherArrow.classList.contains("arrow")) {
                        otherArrow.style.transform = "rotate(0deg)";
                    }
                }
            });
            const isVisible = bodyText.style.display === "block";
            bodyText.style.display = isVisible ? "none" : "block";
            arrow.style.transform = isVisible
                ? "rotate(0deg)"
                : "rotate(90deg)";
        });
    });
}

// Search website function
async function searchWebsite(event) {
    if (event.key === "Enter") {
        const searchInput = event.target.value;
        const resultDiv = document.getElementById("result");
        const urlDiv = document.getElementById("url_searched");
        const factDiv = document.getElementById("facts");

        event.target.value = "";
        factDiv.innerHTML = "";

        if (searchInput.trim() === "") {
            resultDiv.innerText = "Please enter a search term.";
            return;
        } else {
            const title = await extractTitleFromURL(searchInput);
            resultDiv.innerText = title; // This should display the title properly
            urlDiv.innerText = searchInput; // This should display the title properly
            await postDataSummarize(searchInput); // Assuming this function is defined elsewhere
        }
    }
}

// Initialize event listeners
["searchInput", "searchInput2", "searchInput3", "searchInput4"].forEach(
    (id) => {
        document.getElementById(id).addEventListener("keydown", searchWebsite);
    }
);

window.addEventListener("load", () => {
    scrollToSection("home");
});
