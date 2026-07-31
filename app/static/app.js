/**
 * Handwritten & Latin Font Replacer Studio - Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentMode = null; // 'mode1' or 'mode2'
    let sessionUploadId = null;
    let glyphData = [];

    // --- DOM Elements ---
    const btnSwitchMode = document.getElementById('btn-switch-mode');
    const mainStepper = document.getElementById('main-stepper');

    // Sections
    const sectionModeSelect = document.getElementById('section-mode-select');
    const sectionM1Upload = document.getElementById('section-m1-upload');
    const sectionM1Review = document.getElementById('section-m1-review');
    const sectionM2Upload = document.getElementById('section-m2-upload');
    const sectionDownload = document.getElementById('section-download');

    // Cards for Mode Select
    const cardMode1 = document.getElementById('card-mode-1');
    const cardMode2 = document.getElementById('card-mode-2');
    const btnSelectMode1 = document.getElementById('btn-select-mode-1');
    const btnSelectMode2 = document.getElementById('btn-select-mode-2');

    // Stepper Indicators
    const stepIndicator1 = document.getElementById('step-indicator-1');
    const stepIndicator2 = document.getElementById('step-indicator-2');
    const stepIndicator3 = document.getElementById('step-indicator-3');
    const step1Label = document.getElementById('step-1-label');
    const step2Label = document.getElementById('step-2-label');

    // Mode 1 Elements
    const m1UploadForm = document.getElementById('m1-upload-form');
    const fontFileInput = document.getElementById('font-file-input');
    const zipFileInput = document.getElementById('zip-file-input');
    const fontDropzoneLabel = document.getElementById('font-dropzone-label');
    const zipDropzoneLabel = document.getElementById('zip-dropzone-label');
    const fontFileInfo = document.getElementById('font-file-info');
    const zipFileInfo = document.getElementById('zip-file-info');
    const btnM1Upload = document.getElementById('btn-m1-upload');

    const m1FamilyName = document.getElementById('m1-family-name');
    const m1StyleName = document.getElementById('m1-style-name');
    const m1FullName = document.getElementById('m1-full-name');

    const glyphGrid = document.getElementById('glyph-grid');
    const glyphFilterInput = document.getElementById('glyph-filter');
    const totalGlyphsCount = document.getElementById('total-glyphs-count');
    const duplicateWarning = document.getElementById('duplicate-warning');
    const btnM1Back = document.getElementById('btn-m1-back');
    const btnM1Generate = document.getElementById('btn-m1-generate');

    const btnConvertLowercase = document.getElementById('btn-convert-lowercase');
    const btnConvertUppercase = document.getElementById('btn-convert-uppercase');

    // Mode 2 Elements
    const m2UploadForm = document.getElementById('m2-upload-form');
    const fontAInput = document.getElementById('font-a-input');
    const fontBInput = document.getElementById('font-b-input');
    const fontALabel = document.getElementById('font-a-label');
    const fontBLabel = document.getElementById('font-b-label');
    const fontAInfo = document.getElementById('font-a-info');
    const fontBInfo = document.getElementById('font-b-info');
    const btnM2Generate = document.getElementById('btn-m2-generate');

    const m2FamilyName = document.getElementById('m2-family-name');
    const m2StyleName = document.getElementById('m2-style-name');
    const m2FullName = document.getElementById('m2-full-name');

    // Download / Preview Elements
    const generationLoading = document.getElementById('generation-loading');
    const generationSuccess = document.getElementById('generation-success');
    const fontPreviewInput = document.getElementById('font-preview-input');
    const btnDownloadFont = document.getElementById('btn-download-font');
    const btnStartOver = document.getElementById('btn-start-over');

    // --- Helper Functions ---
    const hideAllSections = () => {
        if (sectionModeSelect) sectionModeSelect.classList.remove('active');
        if (sectionM1Upload) sectionM1Upload.classList.remove('active');
        if (sectionM1Review) sectionM1Review.classList.remove('active');
        if (sectionM2Upload) sectionM2Upload.classList.remove('active');
        if (sectionDownload) sectionDownload.classList.remove('active');
    };

    const showModeSelection = () => {
        currentMode = null;
        sessionUploadId = null;
        glyphData = [];
        hideAllSections();
        if (sectionModeSelect) sectionModeSelect.classList.add('active');
        if (mainStepper) mainStepper.classList.add('hidden');
        if (btnSwitchMode) btnSwitchMode.classList.add('hidden');
    };

    const setStep = (stepNumber) => {
        if (stepIndicator1) stepIndicator1.classList.remove('active');
        if (stepIndicator2) stepIndicator2.classList.remove('active');
        if (stepIndicator3) stepIndicator3.classList.remove('active');

        if (stepNumber >= 1 && stepIndicator1) stepIndicator1.classList.add('active');
        if (stepNumber >= 2 && stepIndicator2) stepIndicator2.classList.add('active');
        if (stepNumber >= 3 && stepIndicator3) stepIndicator3.classList.add('active');
    };

    const setupFileDropzone = (inputEl, labelEl, infoEl) => {
        if (!inputEl || !labelEl || !infoEl) return;

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

    setupFileDropzone(fontFileInput, fontDropzoneLabel, fontFileInfo);
    setupFileDropzone(zipFileInput, zipDropzoneLabel, zipFileInfo);
    setupFileDropzone(fontAInput, fontALabel, fontAInfo);
    setupFileDropzone(fontBInput, fontBLabel, fontBInfo);

    // --- Mode Selection Handlers ---
    const activateMode1 = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        currentMode = 'mode1';
        hideAllSections();
        if (sectionM1Upload) sectionM1Upload.classList.add('active');
        if (mainStepper) mainStepper.classList.remove('hidden');
        if (btnSwitchMode) btnSwitchMode.classList.remove('hidden');

        if (step1Label) step1Label.textContent = 'Upload Assets';
        if (step2Label) step2Label.textContent = 'Review & Naming';
        setStep(1);
    };

    const activateMode2 = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        currentMode = 'mode2';
        hideAllSections();
        if (sectionM2Upload) sectionM2Upload.classList.add('active');
        if (mainStepper) mainStepper.classList.remove('hidden');
        if (btnSwitchMode) btnSwitchMode.classList.remove('hidden');

        if (step1Label) step1Label.textContent = 'Upload Fonts';
        if (step2Label) step2Label.textContent = 'Merge & Naming';
        setStep(1);
    };

    if (cardMode1) cardMode1.addEventListener('click', activateMode1);
    if (btnSelectMode1) btnSelectMode1.addEventListener('click', activateMode1);

    if (cardMode2) cardMode2.addEventListener('click', activateMode2);
    if (btnSelectMode2) btnSelectMode2.addEventListener('click', activateMode2);

    if (btnSwitchMode) btnSwitchMode.addEventListener('click', showModeSelection);
    if (btnStartOver) btnStartOver.addEventListener('click', showModeSelection);

    const setupAutoNaming = (familyInput, styleInput, fullInput) => {
        if (!familyInput || !styleInput || !fullInput) return;
        const update = () => {
            const fam = familyInput.value.trim();
            const sty = styleInput.value.trim() || 'Regular';
            if (fam) {
                fullInput.value = `${fam} ${sty}`;
            }
        };
        familyInput.addEventListener('input', update);
        styleInput.addEventListener('input', update);
    };

    setupAutoNaming(m1FamilyName, m1StyleName, m1FullName);
    setupAutoNaming(m2FamilyName, m2StyleName, m2FullName);

    // Toolbar Case Conversion Buttons
    if (btnConvertLowercase) {
        btnConvertLowercase.addEventListener('click', () => {
            glyphData.forEach((g, idx) => {
                if (g.guessed_char) {
                    g.guessed_char = g.guessed_char.toLowerCase();
                }
            });
            renderGlyphGrid(glyphData);
        });
    }

    if (btnConvertUppercase) {
        btnConvertUppercase.addEventListener('click', () => {
            glyphData.forEach((g, idx) => {
                if (g.guessed_char) {
                    g.guessed_char = g.guessed_char.toUpperCase();
                }
            });
            renderGlyphGrid(glyphData);
        });
    }

    // --- Mode 1: Upload & OCR Review ---
    if (m1UploadForm) {
        m1UploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!fontFileInput.files[0] || !zipFileInput.files[0]) {
                alert('Please select both a base font file and a handwritten glyph ZIP archive.');
                return;
            }

            btnM1Upload.disabled = true;
            btnM1Upload.querySelector('span').textContent = 'Processing OCR...';

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

                const baseFontBaseName = fontFileInput.files[0].name.replace(/\.[^/.]+$/, "");
                if (m1FamilyName) m1FamilyName.value = `${baseFontBaseName} Handwritten`;
                if (m1StyleName) m1StyleName.value = "Regular";
                if (m1FullName) m1FullName.value = `${baseFontBaseName} Handwritten Regular`;

                hideAllSections();
                if (sectionM1Review) sectionM1Review.classList.add('active');
                setStep(2);

            } catch (err) {
                alert(`Upload Error: ${err.message}`);
            } finally {
                btnM1Upload.disabled = false;
                btnM1Upload.querySelector('span').textContent = 'Run OCR & Process Scans';
            }
        });
    }

    const renderGlyphGrid = (glyphs) => {
        if (!glyphGrid) return;
        glyphGrid.innerHTML = '';
        if (totalGlyphsCount) totalGlyphsCount.textContent = glyphs.length;

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
        if (!glyphGrid) return;
        const charInputs = glyphGrid.querySelectorAll('.glyph-char-input');
        charInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                glyphData[idx].guessed_char = e.target.value;
                validateDuplicates();
            });

            input.addEventListener('focus', () => {
                input.select();
            });
        });
    };

    const validateDuplicates = () => {
        if (!glyphGrid) return;
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

        if (duplicateWarning) {
            if (hasDuplicate) {
                duplicateWarning.classList.remove('hidden');
            } else {
                duplicateWarning.classList.add('hidden');
            }
        }
    };

    if (glyphFilterInput) {
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
    }

    if (btnM1Back) {
        btnM1Back.addEventListener('click', () => {
            hideAllSections();
            if (sectionM1Upload) sectionM1Upload.classList.add('active');
            setStep(1);
        });
    }

    if (btnM1Generate) {
        btnM1Generate.addEventListener('click', async () => {
            const validMappings = glyphData.filter(g => g.guessed_char && g.guessed_char.trim() !== '');
            if (validMappings.length === 0) {
                alert('Please specify at least one valid character mapping.');
                return;
            }

            hideAllSections();
            if (sectionDownload) sectionDownload.classList.add('active');
            setStep(3);

            if (generationLoading) generationLoading.classList.remove('hidden');
            if (generationSuccess) generationSuccess.classList.add('hidden');

            try {
                const payload = {
                    upload_id: sessionUploadId,
                    mappings: glyphData.map(g => ({
                        image_path: g.image_path,
                        char: g.guessed_char
                    })),
                    metadata: {
                        family_name: m1FamilyName ? m1FamilyName.value.trim() || 'My Handwritten Font' : 'My Handwritten Font',
                        style_name: m1StyleName ? m1StyleName.value.trim() || 'Regular' : 'Regular',
                        full_name: m1FullName ? m1FullName.value.trim() || 'My Handwritten Font Regular' : 'My Handwritten Font Regular'
                    }
                };

                const response = await fetch('/api/generate-font', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.detail || 'Font generation failed');
                }

                const data = await response.json();
                handleFontGenerationSuccess(data.download_url);

            } catch (err) {
                alert(`Font Generation Error: ${err.message}`);
                hideAllSections();
                if (sectionM1Review) sectionM1Review.classList.add('active');
                setStep(2);
            }
        });
    }

    // --- Mode 2: Font-to-Font Latin Replacement ---
    if (m2UploadForm) {
        m2UploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!fontAInput.files[0] || !fontBInput.files[0]) {
                alert('Please select both Base Font A and Source Latin Font B.');
                return;
            }

            btnM2Generate.disabled = true;
            btnM2Generate.querySelector('span').textContent = 'Uploading Fonts...';

            try {
                const formData = new FormData();
                formData.append('font_a', fontAInput.files[0]);
                formData.append('font_b', fontBInput.files[0]);

                const uploadRes = await fetch('/api/upload-font2font', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.detail || 'Font upload failed');
                }

                const uploadData = await uploadRes.json();
                sessionUploadId = uploadData.upload_id;

                hideAllSections();
                if (sectionDownload) sectionDownload.classList.add('active');
                setStep(3);

                if (generationLoading) generationLoading.classList.remove('hidden');
                if (generationSuccess) generationSuccess.classList.add('hidden');

                const payload = {
                    upload_id: sessionUploadId,
                    metadata: {
                        family_name: m2FamilyName ? m2FamilyName.value.trim() || 'Merged Latin Font' : 'Merged Latin Font',
                        style_name: m2StyleName ? m2StyleName.value.trim() || 'Regular' : 'Regular',
                        full_name: m2FullName ? m2FullName.value.trim() || 'Merged Latin Font Regular' : 'Merged Latin Font Regular'
                    }
                };

                const genRes = await fetch('/api/generate-font2font', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!genRes.ok) {
                    const errData = await genRes.json();
                    throw new Error(errData.detail || 'Font merge failed');
                }

                const genData = await genRes.json();
                handleFontGenerationSuccess(genData.download_url);

            } catch (err) {
                alert(`Font Merge Error: ${err.message}`);
                hideAllSections();
                if (sectionM2Upload) sectionM2Upload.classList.add('active');
                setStep(1);
            } finally {
                btnM2Generate.disabled = false;
                btnM2Generate.querySelector('span').textContent = 'Match & Merge Fonts';
            }
        });
    }

    // --- Common Download & Preview Handler ---
    const handleFontGenerationSuccess = async (downloadUrl) => {
        const fontName = 'CustomGeneratedFont_' + Date.now();
        const newFontFace = new FontFace(fontName, `url(${downloadUrl})`);
        
        try {
            await newFontFace.load();
            document.fonts.add(newFontFace);
            if (fontPreviewInput) fontPreviewInput.style.fontFamily = `'${fontName}', var(--font-sans)`;
        } catch (e) {
            console.warn('Browser font preview load error:', e);
        }

        if (btnDownloadFont) btnDownloadFont.href = downloadUrl;

        if (generationLoading) generationLoading.classList.add('hidden');
        if (generationSuccess) generationSuccess.classList.remove('hidden');
    };
});
