document.addEventListener('DOMContentLoaded', () => {
    // --- Centralized DOM Element Management ---
    const elements = {
        inputArea: document.getElementById('input-area'),
        outputArea: document.getElementById('output-area'),
        fromBaseSelect: document.getElementById('from-base-select'),
        toBaseSelect: document.getElementById('to-base-select'),
        themeToggle: document.getElementById('theme-toggle'),
        swapBtn: document.getElementById('swap-btn'),
        body: document.body,
    };

    // --- The Final, Ultra-Reliable Conversion Engine ---
    const ConverterEngine = {
        // Module for number-to-number conversions
        Numerical: {
            // Converts a numerical string from any base into a BigInt.
            toBigInt(value, fromBase) {
                const base = parseInt(fromBase);
                // === FIX: Better sanitization for multi-word inputs like binary-to-text ===
                const sanitizedValue = value.toLowerCase(); 
                if (sanitizedValue.trim() === '') return 0n;

                let bigIntValue = 0n;
                const alphabet = '0123456789abcdef';

                for (const char of sanitizedValue) {
                    // === NEW: Allow '.' for future floating point, but throw error for now ===
                    if (char === '.') {
                        throw new Error("Decimal points ('.') are not supported in this version.");
                    }
                    const charValue = alphabet.indexOf(char);
                    if (charValue === -1 || charValue >= base) {
                        // === NEW: More descriptive error message ===
                        throw new Error(`The character '${char.toUpperCase()}' is not a valid digit for Base-${base}.`);
                    }
                    bigIntValue = bigIntValue * BigInt(base) + BigInt(charValue);
                }
                return bigIntValue;
            },
            // Converts a BigInt into a string of the target base.
            fromBigInt(bigIntValue, toBase) {
                const base = parseInt(toBase);
                return bigIntValue.toString(base).toUpperCase();
            }
        },
        // Module for conversions involving text
        Text: {
            // Converts a string into an array of its character codes.
            toCharCodes(text) {
                const codes = [];
                for (let i = 0; i < text.length; i++) {
                    codes.push(text.charCodeAt(i));
                }
                return codes;
            },
            // === FIX: Switched to fromCodePoint for better Unicode support ===
            fromCharCodes(codes) {
                // Using fromCodePoint allows for characters beyond the basic multilingual plane (like emojis)
                return String.fromCodePoint(...codes);
            }
        }
    };

    // --- Main Application Logic ---
    function handleConversion() {
        const { inputArea, outputArea, fromBaseSelect, toBaseSelect } = elements;
        const inputValue = inputArea.value;
        const fromBase = fromBaseSelect.value;
        const toBase = toBaseSelect.value;

        if (inputValue.trim() === '') {
            outputArea.value = '';
            outputArea.style.color = ''; // Clear any previous error color
            return;
        }
        if (fromBase === toBase) {
            outputArea.value = "TIP: Source and target bases cannot be the same.";
            outputArea.style.color = 'var(--warning-color)';
            return;
        }
        
        try {
            let result = '';

            // --- Conversion Routing ---
            if (fromBase === 'text') {
                // Path 1: Text to a numerical base (character-wise)
                const codes = ConverterEngine.Text.toCharCodes(inputValue);
                result = codes.map(code => ConverterEngine.Numerical.fromBigInt(BigInt(code), toBase)).join(' ');
            } else if (toBase === 'text') {
                // Path 2: A numerical base to text (character-wise)
                const numbers = inputValue.trim().split(/\s+/);
                // === FIX: Convert BigInt to Number for fromCodePoint and handle potential errors ===
                const codes = numbers.map(num => Number(ConverterEngine.Numerical.toBigInt(num, fromBase)));
                result = ConverterEngine.Text.fromCharCodes(codes);
            } else {
                // Path 3: Standard number-to-number conversion
                const bigIntValue = ConverterEngine.Numerical.toBigInt(inputValue.replace(/\s/g, ''), fromBase);
                result = ConverterEngine.Numerical.fromBigInt(bigIntValue, toBase);
                 // Add spacing to binary output for superior readability
                if (toBase === '2') {
                    // Pad with leading zeros to make groups of 4
                    const paddedResult = result.padStart(Math.ceil(result.length / 4) * 4, '0');
                    result = paddedResult.replace(/(.{4})/g, '$1 ').trim();
                }
            }
            
            outputArea.value = result;
            outputArea.style.color = ''; // Reset color on success
        } catch (error) {
            // === NEW: Smart Error Handling Logic ===
            let userFriendlyMessage;
            if (error instanceof RangeError) {
                userFriendlyMessage = "INVALID NUMBER: One or more values are too large to be a valid character code.";
            } else if (error.message.includes('not a valid digit')) {
                userFriendlyMessage = `INVALID INPUT: ${error.message}`;
            } else {
                console.error("An unexpected error occurred:", error); // Log the real error for devs
                userFriendlyMessage = "ERROR: Please check your input for typos or invalid characters.";
            }
            outputArea.value = userFriendlyMessage;
            outputArea.style.color = 'var(--error-color)';
        }
    }

    // --- Event Listeners ---
    [elements.inputArea, elements.fromBaseSelect, elements.toBaseSelect].forEach(el => {
        el.addEventListener('input', handleConversion);
        el.addEventListener('change', handleConversion);
    });

    elements.swapBtn.addEventListener('click', () => {
        const { inputArea, outputArea, fromBaseSelect, toBaseSelect } = elements;
        
        // === FIX: Removed the check that prevented swapping on error. Button is now always responsive. ===
        // if (outputArea.style.color) return; 
        
        const fromValue = fromBaseSelect.value;
        fromBaseSelect.value = toBaseSelect.value;
        toBaseSelect.value = fromValue;
        
        // The output becomes the new input. If it was an error message, it will be cleared by the next conversion.
        inputArea.value = outputArea.value.startsWith('ERROR:') || outputArea.value.startsWith('TIP:') || outputArea.value.startsWith('INVALID') ? '' : outputArea.value;

        handleConversion();
    });

    // Theme & Clipboard functionality
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') elements.body.classList.add('dark');
    elements.themeToggle.addEventListener('click', () => {
        elements.body.classList.toggle('dark');
        localStorage.setItem('theme', elements.body.classList.contains('dark') ? 'dark' : 'light');
    });
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetTextarea = document.getElementById(targetId);
            if (targetTextarea.value && !targetTextarea.style.color) {
                navigator.clipboard.writeText(targetTextarea.value).then(() => {
                    button.classList.add('copied');
                    setTimeout(() => button.classList.remove('copied'), 1500);
                });
            }
        });
    });
    document.querySelector('.paste-btn')?.addEventListener('click', () => {
        navigator.clipboard.readText().then(text => {
            elements.inputArea.value = text;
            handleConversion();
        }).catch(err => { console.error('Failed to read clipboard: ', err); });
    });
    
    document.querySelector('.clear-btn')?.addEventListener('click', () => {
        elements.inputArea.value = '';
        handleConversion(); // Re-run conversion to clear the output
    });

    // --- Rock-Solid Footer Interaction for ALL devices ---
    function setupFooterInteraction() {
        const footerArea = document.querySelector('.footer-interactive-area');
        if (!footerArea) return;

        const toggleFooter = (event) => {
            event.stopPropagation();
            footerArea.classList.toggle('active');
        };

        const hideFooter = () => {
            if (footerArea.classList.contains('active')) {
                footerArea.classList.remove('active');
            }
        };

        footerArea.addEventListener('click', toggleFooter);
        footerArea.addEventListener('touchstart', (event) => {
            event.preventDefault();
            toggleFooter(event);
        });
        
        document.addEventListener('click', hideFooter);
        document.addEventListener('touchstart', hideFooter);
    }

    handleConversion(); // Initial conversion on page load
    setupFooterInteraction(); // Set up the new, robust footer listener
});
