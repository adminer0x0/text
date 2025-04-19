document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const inputTextElem = document.getElementById('inputText');
    const outputTextElem = document.getElementById('outputText');
    const copyButton = document.getElementById('copyButton');
    const controlsSection = document.querySelector('.controls-section');
    const statusMessageElem = document.getElementById('statusMessage');
    const inputLinesElem = document.getElementById('inputLines');
    const outputLinesElem = document.getElementById('outputLines');

    // --- Core Text Processing Logic ---

    const getLines = (text) => text.split('\n');
    const updateOutput = (lines) => {
        const output = lines.join('\n');
        outputTextElem.value = output;
        updateStatus(inputTextElem.value, output);
    };

    const updateStatus = (input = inputTextElem.value, output = outputTextElem.value) => {
        const inputLines = input.split('\n').filter(line => line.trim() !== '').length;
        const outputLines = output.split('\n').filter(line => line.trim() !== '').length;
        inputLinesElem.textContent = inputLines;
        outputLinesElem.textContent = outputLines;
    };

    const setStatusMessage = (msg, isError = false) => {
        statusMessageElem.textContent = msg;
        statusMessageElem.style.color = isError ? '#ff4d4d' : '#00bfff'; // Red for error, blue otherwise
        setTimeout(() => {
             statusMessageElem.textContent = 'Ready';
             statusMessageElem.style.color = '#00bfff';
        }, 3000); // Reset after 3 seconds
    };

    // --- Text Manipulation Functions ---

    const toTitleCase = (str) => {
        return str.toLowerCase().split(' ').map(word => {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    };

     const toSentenceCase = (str) => {
        if (!str) return '';
        // Basic sentence case: capitalize first letter, lower rest. More complex logic needed for proper nouns, etc.
        const firstChar = str.charAt(0).toUpperCase();
        const rest = str.slice(1).toLowerCase();
        return firstChar + rest;
        // A more robust version might split by sentences (. ! ?) and capitalize each.
        // return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()); // Example slightly better version
    };

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    };

    const extractUrls = (text) => {
        // Reasonably good regex for URLs, might miss some edge cases or have false positives
        const urlRegex = /(https?:\/\/[^\s)"'<]+|www\.[^\s)"'<]+|\b[a-z0-9.-]+\.[a-z]{2,}[^\s)"'<]*)/gi;
        const urls = text.match(urlRegex) || [];
        // Basic normalization (add http:// to www.* if missing)
        const normalizedUrls = urls.map(url => {
            if (url.toLowerCase().startsWith('www.')) {
                return 'http://' + url;
            }
            return url;
        });
        // Deduplicate using Set
        return [...new Set(normalizedUrls)];
    };


    // --- Event Listener for Buttons ---
    controlsSection.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const action = event.target.dataset.action;
            if (!action) return; // Ignore clicks not on action buttons

            const lines = getLines(inputTextElem.value);
            let processedLines = [];
            let message = 'Processed'; // Default status message

            try { // Wrap processing in try...catch for safety
                switch (action) {
                    case 'upper':
                        processedLines = lines.map(line => line.toUpperCase());
                        message = 'Converted to Uppercase';
                        break;
                    case 'lower':
                        processedLines = lines.map(line => line.toLowerCase());
                        message = 'Converted to Lowercase';
                        break;
                    case 'title':
                        processedLines = lines.map(toTitleCase);
                        message = 'Converted to Title Case';
                        break;
                    case 'sentence':
                        processedLines = lines.map(toSentenceCase);
                        message = 'Converted to Sentence Case';
                        break;
                    case 'shuffle':
                        processedLines = shuffleArray([...lines]); // Shuffle a copy
                        message = 'Lines Shuffled';
                        break;
                    case 'reverseLines':
                        processedLines = [...lines].reverse();
                        message = 'Lines Reversed';
                        break;
                     case 'reverseEachLine':
                        processedLines = lines.map(line => line.split('').reverse().join(''));
                        message = 'Each Line Reversed';
                        break;
                    case 'deduplicateLines':
                        processedLines = [...new Set(lines)];
                        message = 'Duplicate Lines Removed';
                         break;
                    case 'extractUrls':
                        processedLines = extractUrls(inputTextElem.value);
                        message = `Extracted ${processedLines.length} Unique URLs`;
                        break;
                    case 'addPrefixSuffix':
                        const prefix = document.getElementById('prefix').value || '';
                        const suffix = document.getElementById('suffix').value || '';
                         if (!prefix && !suffix) {
                           throw new Error("No prefix or suffix provided.");
                         }
                        processedLines = lines.map(line => prefix + line + suffix);
                        message = 'Added Prefix/Suffix';
                        break;
                    case 'filterKeyword':
                        const keyword = document.getElementById('keyword').value;
                        const keywordAction = document.getElementById('keywordAction').value;
                        if (!keyword) {
                            throw new Error("Please provide a keyword for filtering.");
                        }
                        const kwLower = keyword.toLowerCase();
                        processedLines = lines.filter(line => {
                            const lineLower = line.toLowerCase();
                            const contains = lineLower.includes(kwLower);
                            switch (keywordAction) {
                                case 'keepContaining': return contains;
                                case 'removeContaining': return !contains;
                                case 'keepNotContaining': return !contains;
                                case 'removeNotContaining': return contains;
                                default: return true;
                            }
                        });
                        message = `Filtered by keyword '${keyword}'`;
                        break;
                    case 'filterLength':
                        const minLength = parseInt(document.getElementById('minLength').value, 10);
                        const maxLength = parseInt(document.getElementById('maxLength').value, 10);
                        const lengthAction = document.getElementById('lengthAction').value;

                         // Basic validation
                         const hasMin = !isNaN(minLength) && minLength >= 0;
                         const hasMax = !isNaN(maxLength) && maxLength >= 0;
                         if(lengthAction.includes('Between') && (!hasMin || !hasMax)) throw new Error("Min and Max length required for 'Between' filter.");
                         if(lengthAction.includes('Shorter') && !hasMin) throw new Error("Min length required for 'Shorter' filter.");
                         if(lengthAction.includes('Longer') && !hasMax) throw new Error("Max length required for 'Longer' filter.");
                         if(hasMin && hasMax && minLength > maxLength) throw new Error("Min length cannot be greater than Max length.");


                        processedLines = lines.filter(line => {
                            const len = line.length;
                             switch (lengthAction) {
                                case 'keepBetween': return hasMin && hasMax && len >= minLength && len <= maxLength;
                                case 'removeBetween': return !hasMin || !hasMax || len < minLength || len > maxLength;
                                case 'keepShorter': return hasMin && len < minLength;
                                case 'keepLonger': return hasMax && len > maxLength;
                                default: return true;
                            }
                        });
                        message = `Filtered by length`;
                        break;
                    case 'clear':
                         inputTextElem.value = '';
                         outputTextElem.value = '';
                         document.getElementById('prefix').value = '';
                         document.getElementById('suffix').value = '';
                         document.getElementById('keyword').value = '';
                         document.getElementById('minLength').value = '';
                         document.getElementById('maxLength').value = '';
                         processedLines = [];
                         message = 'Cleared All Fields';
                         break;
                    default:
                         console.warn('Unknown action:', action);
                         message = 'Unknown Action';
                         processedLines = lines; // No change for unknown action
                         break;
                }

                updateOutput(processedLines);
                setStatusMessage(message);

            } catch (error) {
                 console.error("Processing error:", error);
                 setStatusMessage(`Error: ${error.message}`, true);
                 // Optionally keep the old output or clear it
                 // outputTextElem.value = "Error during processing.";
            }
        }
    });

    // --- Copy Button ---
    copyButton.addEventListener('click', () => {
        const textToCopy = outputTextElem.value;
        if (!textToCopy) {
             setStatusMessage('Nothing to copy!', true);
             return;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor = '#17a2b8'; // Indicate success
                setStatusMessage('Results copied to clipboard!');
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.style.background = ''; // Revert style
                }, 1500);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                setStatusMessage('Failed to copy to clipboard.', true);
                 // Consider adding a fallback method if needed
            });
    });

    // --- Initial Status Update ---
     updateStatus();
     inputTextElem.addEventListener('input', updateStatus); // Update stats while typing

    // --- tsParticles Initialization ---
    tsParticles.load("tsparticles", {
        fpsLimit: 60,
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: ["#00bfff", "#9acd32", "#ff69b4", "#ffea00"] }, // Neon colors
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
            size: { value: 3, random: true, anim: { enable: false } },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.1, width: 1 }, // Faint lines
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out", // Move out of canvas
                bounce: false,
                attract: { enable: false }
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" }, // Grab effect on hover
                onclick: { enable: true, mode: "push" }, // Push particles on click
                resize: true
            },
            modes: {
                grab: { distance: 140, line_opacity: 0.3 },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true,
        background: {
            color: "#0f0f1f", // Match body background
        }
    });

}); // End DOMContentLoaded
