// ========== GLOSSARY GENERATOR FUNCTIONS ==========
function uploadGlossaryFile() {
    const file = document.getElementById("glossaryFileInput").files[0];
    if (!file) return void utils.showNotification("Please select a file to upload.", "warning");
    const progressInterval = utils.showProgress("glossaryProgress", "glossaryProgressText", "Reading DOCX file...");
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        document.getElementById("glossaryProgressText").textContent = "Converting DOCX to HTML...";
        mammoth.convertToHtml({arrayBuffer: arrayBuffer}).then(result => {
            const html = result.value;
            document.getElementById("glossaryProgressText").textContent = "Parsing glossary data...";
            parseGlossaryData(html, progressInterval);
        }).catch(e => {
            console.error(e);
            utils.hideProgress("glossaryProgress", progressInterval);
            utils.showNotification("Error reading the file. Please try again.", "error");
        });
    };
    reader.onerror = function() {
        utils.hideProgress("glossaryProgress", progressInterval);
        utils.showNotification("Error reading the file. Please try again.", "error");
    };
    reader.readAsArrayBuffer(file);
}

function parseGlossaryData(html, progressInterval) {
    try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const glossaryData = [];
        const tables = tempDiv.getElementsByTagName("table");
        if (!(tables.length > 0)) return utils.hideProgress("glossaryProgress", progressInterval), void utils.showNotification("No tables found in the document.", "warning");
        {
            const rows = tables[0].getElementsByTagName("tr");
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName("td");
                if (2 === cells.length) {
                    const term = cells[0].innerText.trim();
                    const definition = cells[1].innerHTML.trim();
                    term && definition && glossaryData.push({term: term, definition: definition});
                }
            }
        }
        0 === glossaryData.length ? (utils.hideProgress("glossaryProgress", progressInterval), utils.showNotification("No glossary terms found.", "warning")) : (localStorage.setItem("glossaryData", JSON.stringify(glossaryData)), utils.hideProgress("glossaryProgress", progressInterval), utils.showNotification(`Glossary data extracted successfully! Found ${glossaryData.length} terms.`, "success"));
    } catch (e) {
        console.error("Error parsing glossary data:", e);
        utils.hideProgress("glossaryProgress", progressInterval);
        utils.showNotification("Error parsing glossary data. Please check the file format.", "error");
    }
}

function generateGlossary() {
    const storedData = localStorage.getItem("glossaryData");
    if (storedData) try {
        const glossaryData = JSON.parse(storedData);
        const groupedData = {};
        glossaryData.forEach(item => {
            const term = item.term.trim();
            const definition = item.definition.trim();
            const firstLetter = term.charAt(0).toUpperCase();
            groupedData[firstLetter] || (groupedData[firstLetter] = []);
            groupedData[firstLetter].push({term: term, definition: definition});
        });
        let alphabetButtons = "";
        let glossaryContent = "";
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            alphabetButtons += `<button class="glossaryBtn btn btn-outline-primary m-1 ${"A" === letter ? "active" : ""}" onclick="openItem('${letter}', event)">${letter}</button>\n`;
            glossaryContent += `<div id="${letter}" class="result-container glosary-item" style="display:${"A" === letter ? "block" : "none"};">\n`;
            groupedData[letter]?.length > 0 ? groupedData[letter].forEach(item => {
                glossaryContent += `<h2>${item.term}</h2>\n<div>${item.definition}</div>\n`;
            }) : glossaryContent += `<h2>${letter}</h2><p>No terms found</p>\n`;
            glossaryContent += "</div>\n";
        }
        const glossaryHtml = `
            <style>
                .active.glossaryBtn,
                .glossaryBtn:hover {
                    background: black !important;
                    transform: translateY(-4px) scale(1);
                    transition: 0.2s;
                    color: #ffbf00!important
                }
            </style>
            <div class="custom-glossary">
                <script>
                    function openItem(glossaryItem, evt) {
                        var items = document.getElementsByClassName("result-container");
                        for (var i = 0; i < items.length; i++) {
                            items[i].style.display = "none";
                        }
                        document.getElementById(glossaryItem).style.display = "block";

                        var btns = document.getElementsByClassName("glossaryBtn");
                        for (var j = 0; j < btns.length; j++) {
                            btns[j].classList.remove("active");
                        }
                        evt.target.classList.add("active");
                    }
                <\/script>
                <div class="container">
                    <div class="glossaryBtnMain alphabet-buttons mb-3">
                        ${alphabetButtons}
                    </div>
                    ${glossaryContent}
                </div>
            </div>`;
        document.getElementById("glossaryCode").value = glossaryHtml;
        showGeneratedCode('glossary', 'glossaryCodeSection');
        utils.showNotification("Glossary code generated successfully!", "success");
    } catch (e) {
        console.error("Error generating glossary:", e);
        utils.showNotification("Error generating glossary. Please try again.", "error");
    } else utils.showNotification("Please upload and parse a DOCX file first.", "warning");
}