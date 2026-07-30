/**
 * Handwritten Font Replacer - Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let sessionUploadId = null;
    let glyphData = [];

    // --- DOM Elements ---
    const uploadForm = document.getElementById('upload-form');
    const fontFileInput = document.getElementById('font-file-input');
    const zipFileInput = document.getElementById('zip-file-input');
    const fontDropzoneLabel = document.getElementById('font-dropzone-label');
    const zipDropzoneLabel = document.getElementById('zip-dropzone-label');
    const fontFileInfo = document.getElementById('font-file-info');
    const zipFileInfo = document.getElementById('zip-file-info');
    const btnUpload = document.getElementById('btn-upload');

    const stepIndicator1 = document.getElementById('step-indicator-1');
    const stepIndicator2 = document.getElementById('step-indicator-2');
    const stepIndicator3 = document.getElementById('step-indicator-3');

    const sectionUpload = document.getElementById('section-upload');
    const sectionReview = document.getElementById('section-review');
    const sectionDownload = document.getElementById('section-download');

    const glyphGrid = document.getElementById('glyph-grid');
    const glyphFilterInput = document.getElementById('glyph-filter');
    const totalGlyphsCount = document.getElementById('total-glyphs-count');
    const duplicateWarning = document.getElementById('duplicate-warning');
    
    const btnBackUpload = document.getElementById('btn-back-upload');
    const btnGenerateFont = document.getElementById('btn-generate-font');

    const generationLoading = document.getElementById('generation-loading');
    const generationSuccess = document.getElementById('generation-success');
    const fontPreviewInput = document.getElementById('font-preview-input');
    const btnDownloadFont = document.getElementById('btn-download-font');
    const btnStartOver = document.getElementById('btn-start-over');

    // --- Helper Functions ---
    const showStep = (stepNumber) => {
        sectionUpload.classList.remove('active');
        sectionReview.classList.remove('active');
        sectionDownload.classList.remove('active');

        stepIndicator1.classList.remove('active');
        stepIndicator2.classList.remove('active');
        stepIndicator3.classList.remove('active');

        if (stepNumber === 1) {
            sectionUpload.classList.add('active');
            stepIndicator1.classList.add('active');
        } else if (stepNumber === 2) {
            sectionReview.classList.add('active');
            stepIndicator1.classList.add('active');
            stepIndicator2.classList.add('active');
        } else if (stepNumber === 3) {
            sectionDownload.classList.add('active');
            stepIndicator1.classList.add('active');
            stepIndicator2.classList.add('active');
            stepIndicator3.classList.add('active');
        }
    };

    const setupFileDropzone = (inputEl, labelEl, infoEl, fileExtensionHint) => {
        inputEl.addEventListener('change', () => {
            if (inputEl.files && inputEl.files[0]) {
                infoEl.textContent = `✓ Selected: ${inputEl.files[0].name} (${(inputEl.files[0].size / 1024).toFixed(1)} KB)`;
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            labelEl.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                labelEl.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            labelEl.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                labelEl.classList.remove('dragover');
            }, false);
        });

        labelEl.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                inputEl.files = files;
                infoEl.textContent = `✓ Selected: ${files[0].name} (${(files[0].size / 1024).toFixed(1)} KB)`;
            }
        });
    };

    setupFileDropzone(fontFileInput, fontDropzoneLabel, fontFileInfo, '.TTF/.OTF');
    setupFileDropzone(zipFileInput, zipDropzoneLabel, zipFileInfo, '.ZIP');

    // --- Step 1: Upload Handling ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!fontFileInput.files[0] || !zipFileInput.files[0]) {
            alert('Please select both a base font file and a handwritten glyph ZIP archive.');
            return;
        }

        btnUpload.disabled = true;
        btnUpload.querySelector('span').textContent = 'Processing OCR...';

        const formData = new FormData();
        formData.append('font_file', fontFileInput.files[0]);
        formData.append('zip_file', zipFileInput.files[0]);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Upload failed');
            }

            const data = await response.json();
            sessionUploadId = data.upload_id;
            glyphData = data.glyphs;

            renderGlyphGrid(glyphData);
            showStep(2);

        } catch (err) {
            alert(`Upload Error: ${err.message}`);
        } finally {
            btnUpload.disabled = false;
            btnUpload.querySelector('span').textContent = 'Run OCR & Process Scans';
        }
    });

    // --- Step 2: Render & Validate Review Grid ---
    const renderGlyphGrid = (glyphs) => {
        glyphGrid.innerHTML = '';
        totalGlyphsCount.textContent = glyphs.length;

        glyphs.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'glyph-card';
            card.dataset.id = item.id;
            card.dataset.index = index;

            card.innerHTML = `
                <div class="glyph-img-box">
                    <img src="${item.image_b64 || '/static/placeholder.png'}" alt="${item.filename}" />
                </div>
                <div class="glyph-input-wrapper">
                    <input type="text" 
                           class="glyph-char-input" 
                           maxlength="1" 
                           value="${item.guessed_char || ''}" 
                           data-index="${index}">
                </div>
                <div class="glyph-filename" title="${item.filename}">${item.filename}</div>
            `;

            glyphGrid.appendChild(card);
        });

        attachGridInputEvents();
        validateDuplicates();
    };

    const attachGridInputEvents = () => {
        const charInputs = glyphGrid.querySelectorAll('.glyph-char-input');
        charInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                let val = e.target.value;
                glyphData[idx].guessed_char = val;
                validateDuplicates();
            });

            input.addEventListener('focus', () => {
                input.select();
            });
        });
    };

    const validateDuplicates = () => {
        const charCounts = {};
        glyphData.forEach(g => {
            const c = g.guessed_char;
            if (c) {
                charCounts[c] = (charCounts[c] || 0) + 1;
            }
        });

        let hasDuplicate = false;
        const cards = glyphGrid.querySelectorAll('.glyph-card');

        cards.forEach(card => {
            const input = card.querySelector('.glyph-char-input');
            const val = input.value;

            if (val && charCounts[val] > 1) {
                card.classList.add('duplicate-error');
                hasDuplicate = true;
            } else {
                card.classList.remove('duplicate-error');
            }
        });

        if (hasDuplicate) {
            duplicateWarning.classList.remove('hidden');
        } else {
            duplicateWarning.classList.add('hidden');
        }
    };

    // Filter characters input
    glyphFilterInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cards = glyphGrid.querySelectorAll('.glyph-card');
        
        cards.forEach(card => {
            const inputVal = card.querySelector('.glyph-char-input').value.toLowerCase();
            const fileName = card.querySelector('.glyph-filename').textContent.toLowerCase();
            
            if (!query || inputVal.includes(query) || fileName.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });

    btnBackUpload.addEventListener('click', () => {
        showStep(1);
    });

    // --- Step 3: Generate Font Submission ---
    btnGenerateFont.addEventListener('click', async () => {
        // Validate at least 1 character is mapped
        const validMappings = glyphData.filter(g => g.guessed_char && g.guessed_char.trim() !== '');
        if (validMappings.length === 0) {
            alert('Please specify at least one valid character mapping.');
            return;
        }

        showStep(3);
        generationLoading.classList.remove('hidden');
        generationSuccess.classList.add('hidden');

        try {
            const payload = {
                upload_id: sessionUploadId,
                mappings: glyphData.map(g => ({
                    image_path: g.image_path,
                    char: g.guessed_char
                }))
            };

            const response = await fetch('/api/generate-font', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Font generation failed');
            }

            const data = await response.json();
            const downloadUrl = data.download_url;

            // Load generated font into browser dynamically for previewing!
            const fontName = 'CustomGeneratedFont_' + Date.now();
            const newFontFace = new FontFace(fontName, `url(${downloadUrl})`);
            await newFontFace.load();
            document.fonts.add(newFontFace);

            fontPreviewInput.style.fontFamily = `'${fontName}', var(--font-sans)`;

            btnDownloadFont.href = downloadUrl;

            generationLoading.classList.add('hidden');
            generationSuccess.classList.remove('hidden');

        } catch (err) {
            alert(`Font Generation Error: ${err.message}`);
            showStep(2);
        }
    });

    btnStartOver.addEventListener('click', () => {
        uploadForm.reset();
        fontFileInfo.textContent = '';
        zipFileInfo.textContent = '';
        sessionUploadId = null;
        glyphData = [];
        showStep(1);
    });
});
