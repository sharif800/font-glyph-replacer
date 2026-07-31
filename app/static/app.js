/**
 * Handwritten & Latin Font Replacer Studio - Frontend Logic (v3.3)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentMode = null; // 'mode1', 'mode2', or 'mode3'
    let sessionUploadId = null;
    let glyphData = [];
    let matrixData = [];
    let selectedUnicodes = new Set();
    let calibrations = {}; // Map: ucode -> { scale: 1.0, x_offset: 0.0, y_offset: 0.0 }
    let activeStudioUcode = 65; // Default 'A'

    // Viewport Pan & Zoom State
    let viewportZoom = 1.0;  // Range: 0.3 to 3.0
    let viewportPanX = 0.0;
    let viewportPanY = 0.0;
    let isDraggingCanvas = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // --- DOM Elements ---
    const btnSwitchMode = document.getElementById('btn-switch-mode');
    const mainStepper = document.getElementById('main-stepper');

    // Sections
    const sectionModeSelect = document.getElementById('section-mode-select');
    const sectionM1Upload = document.getElementById('section-m1-upload');
    const sectionM1Review = document.getElementById('section-m1-review');
    const sectionM2Upload = document.getElementById('section-m2-upload');
    const sectionM3Upload = document.getElementById('section-m3-upload');
    const sectionM3Review = document.getElementById('section-m3-review');
    const sectionDownload = document.getElementById('section-download');

    // Mode Selection Cards & Buttons
    const cardMode1 = document.getElementById('card-mode-1');
    const cardMode2 = document.getElementById('card-mode-2');
    const cardMode3 = document.getElementById('card-mode-3');
    const btnSelectMode1 = document.getElementById('btn-select-mode-1');
    const btnSelectMode2 = document.getElementById('btn-select-mode-2');
    const btnSelectMode3 = document.getElementById('btn-select-mode-3');

    // Stepper Indicators
    const stepIndicator1 = document.getElementById('step-indicator-1');
    const stepIndicator2 = document.getElementById('step-indicator-2');
    const stepIndicator3 = document.getElementById('step-indicator-3');
    const step1Label = document.getElementById('step-1-label');
    const step2Label = document.getElementById('step-2-label');

    // Option 1 Elements
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

    // Option 2 Elements
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

    // Option 3 Elements
    const m3UploadForm = document.getElementById('m3-upload-form');
    const fontA3Input = document.getElementById('font-a3-input');
    const fontB3Input = document.getElementById('font-b3-input');
    const fontA3Label = document.getElementById('font-a3-label');
    const fontB3Label = document.getElementById('font-b3-label');
    const fontA3Info = document.getElementById('font-a3-info');
    const fontB3Info = document.getElementById('font-b3-info');
    const btnM3Inspect = document.getElementById('btn-m3-inspect');

    // Studio Canvas & Controls Elements
    const superimposeCanvasBox = document.getElementById('superimpose-canvas-box');
    const activeCharDisplay = document.getElementById('active-char-display');
    const charSelectDropdown = document.getElementById('char-select-dropdown');
    const replaceCharCheckbox = document.getElementById('replace-char-checkbox');

    // Viewport Nav Toolbar Elements
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const zoomReadout = document.getElementById('zoom-readout');
    const btnPanUp = document.getElementById('btn-pan-up');
    const btnPanDown = document.getElementById('btn-pan-down');
    const btnPanLeft = document.getElementById('btn-pan-left');
    const btnPanRight = document.getElementById('btn-pan-right');
    const btnResetViewport = document.getElementById('btn-reset-viewport');

    const sliderScale = document.getElementById('slider-scale');
    const sliderXOff = document.getElementById('slider-x-off');
    const sliderYOff = document.getElementById('slider-y-off');
    const valScale = document.getElementById('val-scale');
    const valXOff = document.getElementById('val-x-off');
    const valYOff = document.getElementById('val-y-off');

    const btnAutoCenter = document.getElementById('btn-auto-center');
    const btnApplyAll = document.getElementById('btn-apply-all');
    const btnResetCurrent = document.getElementById('btn-reset-current');

    const matrixGrid = document.getElementById('matrix-grid');
    const matrixFilterInput = document.getElementById('matrix-filter');
    const selectedUnicodesCount = document.getElementById('selected-unicodes-count');
    const btnMatrixSelectAll = document.getElementById('btn-matrix-select-all');
    const btnMatrixDeselectAll = document.getElementById('btn-matrix-deselect-all');
    const btnMatrixVowels = document.getElementById('btn-matrix-vowels');
    const btnM3Back = document.getElementById('btn-m3-back');
    const btnM3Generate = document.getElementById('btn-m3-generate');

    const m3FamilyName = document.getElementById('m3-family-name');
    const m3StyleName = document.getElementById('m3-style-name');
    const m3FullName = document.getElementById('m3-full-name');

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
        if (sectionM3Upload) sectionM3Upload.classList.remove('active');
        if (sectionM3Review) sectionM3Review.classList.remove('active');
        if (sectionDownload) sectionDownload.classList.remove('active');
    };

    const showModeSelection = () => {
        currentMode = null;
        sessionUploadId = null;
        glyphData = [];
        matrixData = [];
        calibrations = {};
        selectedUnicodes.clear();
        viewportZoom = 1.0;
        viewportPanX = 0.0;
        viewportPanY = 0.0;
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
    setupFileDropzone(fontA3Input, fontA3Label, fontA3Info);
    setupFileDropzone(fontB3Input, fontB3Label, fontB3Info);

    // --- Mode Selection Handlers ---
    const activateMode1 = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
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
        if (e) { e.preventDefault(); e.stopPropagation(); }
        currentMode = 'mode2';
        hideAllSections();
        if (sectionM2Upload) sectionM2Upload.classList.add('active');
        if (mainStepper) mainStepper.classList.remove('hidden');
        if (btnSwitchMode) btnSwitchMode.classList.remove('hidden');

        if (step1Label) step1Label.textContent = 'Upload Fonts';
        if (step2Label) step2Label.textContent = 'Merge & Naming';
        setStep(1);
    };

    const activateMode3 = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        currentMode = 'mode3';
        hideAllSections();
        if (sectionM3Upload) sectionM3Upload.classList.add('active');
        if (mainStepper) mainStepper.classList.remove('hidden');
        if (btnSwitchMode) btnSwitchMode.classList.remove('hidden');

        if (step1Label) step1Label.textContent = 'Upload Fonts';
        if (step2Label) step2Label.textContent = 'Superimpose & Calibrate';
        setStep(1);
    };

    if (cardMode1) cardMode1.addEventListener('click', activateMode1);
    if (btnSelectMode1) btnSelectMode1.addEventListener('click', activateMode1);

    if (cardMode2) cardMode2.addEventListener('click', activateMode2);
    if (btnSelectMode2) btnSelectMode2.addEventListener('click', activateMode2);

    if (cardMode3) cardMode3.addEventListener('click', activateMode3);
    if (btnSelectMode3) btnSelectMode3.addEventListener('click', activateMode3);

    if (btnSwitchMode) btnSwitchMode.addEventListener('click', showModeSelection);
    if (btnStartOver) btnStartOver.addEventListener('click', showModeSelection);

    const setupAutoNaming = (familyInput, styleInput, fullInput) => {
        if (!familyInput || !styleInput || !fullInput) return;
        const update = () => {
            const fam = familyInput.value.trim();
            const sty = styleInput.value.trim() || 'Regular';
            if (fam) fullInput.value = `${fam} ${sty}`;
        };
        familyInput.addEventListener('input', update);
        styleInput.addEventListener('input', update);
    };

    setupAutoNaming(m1FamilyName, m1StyleName, m1FullName);
    setupAutoNaming(m2FamilyName, m2StyleName, m2FullName);
    setupAutoNaming(m3FamilyName, m3StyleName, m3FullName);

    // Toolbar Case Conversion Buttons (Mode 1)
    if (btnConvertLowercase) {
        btnConvertLowercase.addEventListener('click', () => {
            glyphData.forEach(g => {
                if (g.guessed_char) g.guessed_char = g.guessed_char.toLowerCase();
            });
            renderGlyphGrid(glyphData);
        });
    }

    if (btnConvertUppercase) {
        btnConvertUppercase.addEventListener('click', () => {
            glyphData.forEach(g => {
                if (g.guessed_char) g.guessed_char = g.guessed_char.toUpperCase();
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
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
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
                    <input type="text" class="glyph-char-input" maxlength="1" value="${item.guessed_char || ''}" data-index="${index}">
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
            input.addEventListener('focus', () => input.select());
        });
    };

    const validateDuplicates = () => {
        if (!glyphGrid) return;
        const charCounts = {};
        glyphData.forEach(g => {
            const c = g.guessed_char;
            if (c) charCounts[c] = (charCounts[c] || 0) + 1;
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
            if (hasDuplicate) duplicateWarning.classList.remove('hidden');
            else duplicateWarning.classList.add('hidden');
        }
    };

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
                    mappings: glyphData.map(g => ({ image_path: g.image_path, char: g.guessed_char })),
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

    // --- Mode 2: All-Latin Font-to-Font Replacement ---
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

                const uploadRes = await fetch('/api/upload-font2font', { method: 'POST', body: formData });
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

    // --- Mode 3: Superimposition Studio & Calibration ---
    if (m3UploadForm) {
        m3UploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!fontA3Input.files[0] || !fontB3Input.files[0]) {
                alert('Please select both Base Font A and Source Candidate Font B.');
                return;
            }

            btnM3Inspect.disabled = true;
            btnM3Inspect.querySelector('span').textContent = 'Inspecting SVG Glyphs...';

            try {
                const formData = new FormData();
                formData.append('font_a', fontA3Input.files[0]);
                formData.append('font_b', fontB3Input.files[0]);

                const uploadRes = await fetch('/api/upload-font2font-selective', { method: 'POST', body: formData });
                if (!uploadRes.ok) {
                    const errData = await uploadRes.json();
                    throw new Error(errData.detail || 'Font inspection failed');
                }

                const data = await uploadRes.json();
                sessionUploadId = data.upload_id;
                matrixData = data.comparison_items;

                selectedUnicodes.clear();
                calibrations = {};
                viewportZoom = 1.0;
                viewportPanX = 0.0;
                viewportPanY = 0.0;

                matrixData.forEach(item => {
                    if (item.exists_b) {
                        selectedUnicodes.add(item.unicode);
                        calibrations[item.unicode] = { scale: 1.0, x_offset: 0.0, y_offset: 0.0 };
                    }
                });

                populateCharacterDropdown(matrixData);
                renderMatrixGrid(matrixData);

                const firstAvailable = matrixData.find(i => i.exists_b);
                activeStudioUcode = firstAvailable ? firstAvailable.unicode : 65;
                if (charSelectDropdown) charSelectDropdown.value = activeStudioUcode;

                renderSuperimpositionStudio(activeStudioUcode);

                const fontABaseName = fontA3Input.files[0].name.replace(/\.[^/.]+$/, "");
                if (m3FamilyName) m3FamilyName.value = `${fontABaseName} Calibrated`;
                if (m3StyleName) m3StyleName.value = "Regular";
                if (m3FullName) m3FullName.value = `${fontABaseName} Calibrated Regular`;

                hideAllSections();
                if (sectionM3Review) sectionM3Review.classList.add('active');
                setStep(2);

            } catch (err) {
                alert(`Inspection Error: ${err.message}`);
            } finally {
                btnM3Inspect.disabled = false;
                btnM3Inspect.querySelector('span').textContent = 'Launch Superimposition Studio';
            }
        });
    }

    const populateCharacterDropdown = (items) => {
        if (!charSelectDropdown) return;
        charSelectDropdown.innerHTML = '';
        items.forEach(item => {
            if (item.exists_b) {
                const opt = document.createElement('option');
                opt.value = item.unicode;
                opt.textContent = `${item.char} (U+${item.unicode.toString(16).toUpperCase().padStart(4, '0')})`;
                charSelectDropdown.appendChild(opt);
            }
        });
    };

    const extractSvgPathD = (rawSvg) => {
        if (!rawSvg) return '';
        const dMatches = [...rawSvg.matchAll(/d="([^"]+)"/g)];
        if (dMatches.length > 0) {
            return dMatches.map(m => m[1]).join(' ');
        }
        return '';
    };

    // Viewport Pan & Zoom Controls Event Listeners
    if (btnZoomOut) {
        btnZoomOut.addEventListener('click', () => {
            viewportZoom = Math.max(0.3, viewportZoom - 0.25);
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (btnZoomIn) {
        btnZoomIn.addEventListener('click', () => {
            viewportZoom = Math.min(3.0, viewportZoom + 0.25);
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (btnPanUp) {
        btnPanUp.addEventListener('click', () => {
            viewportPanY -= 120 / viewportZoom;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (btnPanDown) {
        btnPanDown.addEventListener('click', () => {
            viewportPanY += 120 / viewportZoom;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (btnPanLeft) {
        btnPanLeft.addEventListener('click', () => {
            viewportPanX -= 120 / viewportZoom;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (btnPanRight) {
        btnPanRight.addEventListener('click', () => {
            viewportPanX += 120 / viewportZoom;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (btnResetViewport) {
        btnResetViewport.addEventListener('click', () => {
            viewportZoom = 1.0;
            viewportPanX = 0.0;
            viewportPanY = 0.0;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    // Mouse Drag-to-Pan & Wheel Zoom on Canvas
    if (superimposeCanvasBox) {
        superimposeCanvasBox.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            viewportZoom = Math.min(3.0, Math.max(0.3, viewportZoom + delta));
            renderSuperimpositionStudio(activeStudioUcode);
        }, { passive: false });

        superimposeCanvasBox.addEventListener('mousedown', (e) => {
            isDraggingCanvas = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDraggingCanvas) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            viewportPanX -= dx * (1.2 / viewportZoom);
            viewportPanY -= dy * (1.2 / viewportZoom);
            renderSuperimpositionStudio(activeStudioUcode);
        });

        window.addEventListener('mouseup', () => {
            isDraggingCanvas = false;
        });
    }

    // Render Superimposition SVG Canvas with Dynamic Viewport Pan & Zoom
    const renderSuperimpositionStudio = (ucode) => {
        activeStudioUcode = ucode;
        const item = matrixData.find(i => i.unicode === ucode);
        if (!item) return;

        if (activeCharDisplay) activeCharDisplay.textContent = item.char;
        if (charSelectDropdown) charSelectDropdown.value = ucode;
        if (replaceCharCheckbox) replaceCharCheckbox.checked = selectedUnicodes.has(ucode);

        if (zoomReadout) zoomReadout.textContent = `${Math.round(viewportZoom * 100)}%`;

        // Fetch or init calibration state
        if (!calibrations[ucode]) {
            calibrations[ucode] = { scale: 1.0, x_offset: 0.0, y_offset: 0.0 };
        }
        const calib = calibrations[ucode];

        // Update Slider Readouts
        if (sliderScale) sliderScale.value = Math.round(calib.scale * 100);
        if (valScale) valScale.textContent = `${Math.round(calib.scale * 100)}%`;

        if (sliderXOff) sliderXOff.value = Math.round(calib.x_offset);
        if (valXOff) valXOff.textContent = `${Math.round(calib.x_offset)} px`;

        if (sliderYOff) sliderYOff.value = Math.round(calib.y_offset);
        if (valYOff) valYOff.textContent = `${Math.round(calib.y_offset)} px`;

        // Parse SVG paths from fontforge export
        let pathAData = extractSvgPathD(item.svg_a);
        let pathBData = extractSvgPathD(item.svg_b);

        // Dynamic Viewport Pan & Zoom ViewBox Math:
        const baseWidth = 1000.0;
        const baseHeight = 1000.0;
        const widthVb = baseWidth / viewportZoom;
        const heightVb = baseHeight / viewportZoom;
        const minXVb = (baseWidth - widthVb) / 2.0 + viewportPanX;
        const minYVb = (baseHeight - heightVb) / 2.0 + viewportPanY;
        const viewBoxStr = `${minXVb} ${minYVb} ${widthVb} ${heightVb}`;

        const svgContent = `
            <svg viewBox="${viewBoxStr}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;background:#03050a;">
                <!-- Typographic Reference Guide Lines -->
                <!-- Baseline (Y=750 in SVG space) -->
                <line x1="-2000" y1="750" x2="3000" y2="750" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 6" />
                <text x="20" y="740" fill="#94a3b8" font-size="22" font-family="sans-serif">Baseline (y=0)</text>

                <!-- Cap-Height (Y=50 in SVG space) -->
                <line x1="-2000" y1="50" x2="3000" y2="50" stroke="#6366f1" stroke-width="2" stroke-dasharray="6 6" />
                <text x="20" y="40" fill="#6366f1" font-size="22" font-family="sans-serif">Cap-Height (y=700)</text>

                <!-- X-Height (Y=270 in SVG space) -->
                <line x1="-2000" y1="270" x2="3000" y2="270" stroke="#10b981" stroke-width="2" stroke-dasharray="6 6" />
                <text x="20" y="260" fill="#10b981" font-size="22" font-family="sans-serif">X-Height (y=480)</text>

                <!-- Startline Left Bearing (X=200 in SVG space) -->
                <line x1="200" y1="-2000" x2="200" y2="3000" stroke="#8b5cf6" stroke-width="2" stroke-dasharray="6 6" />
                <text x="210" y="980" fill="#8b5cf6" font-size="22" font-family="sans-serif">Startline</text>

                <!-- Font A Ghost Reference Silhouette (Blue) -->
                ${pathAData ? `
                    <g transform="translate(200, 750) scale(1, -1)" fill="#6366f1" fill-opacity="0.3" stroke="#818cf8" stroke-width="3">
                        <path d="${pathAData}" />
                    </g>
                ` : ''}

                <!-- Font B Superimposed Overlay (Pink) with Live Calibration Transforms -->
                ${pathBData ? `
                    <g transform="translate(200, 750) scale(1, -1) translate(${calib.x_offset}, ${calib.y_offset}) scale(${calib.scale})" fill="#ec4899" fill-opacity="0.6" stroke="#f472b6" stroke-width="3">
                        <path d="${pathBData}" />
                    </g>
                ` : ''}
            </svg>
        `;

        if (superimposeCanvasBox) {
            superimposeCanvasBox.innerHTML = svgContent;
        }

        highlightActiveMatrixCard(ucode);
    };

    // Live Slider Events
    if (sliderScale) {
        sliderScale.addEventListener('input', (e) => {
            const sc = parseFloat(e.target.value) / 100.0;
            if (calibrations[activeStudioUcode]) calibrations[activeStudioUcode].scale = sc;
            if (valScale) valScale.textContent = `${e.target.value}%`;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (sliderXOff) {
        sliderXOff.addEventListener('input', (e) => {
            const xo = parseFloat(e.target.value);
            if (calibrations[activeStudioUcode]) calibrations[activeStudioUcode].x_offset = xo;
            if (valXOff) valXOff.textContent = `${xo} px`;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (sliderYOff) {
        sliderYOff.addEventListener('input', (e) => {
            const yo = parseFloat(e.target.value);
            if (calibrations[activeStudioUcode]) calibrations[activeStudioUcode].y_offset = yo;
            if (valYOff) valYOff.textContent = `${yo} px`;
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (charSelectDropdown) {
        charSelectDropdown.addEventListener('change', (e) => {
            const ucode = parseInt(e.target.value, 10);
            renderSuperimpositionStudio(ucode);
        });
    }

    if (replaceCharCheckbox) {
        replaceCharCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) selectedUnicodes.add(activeStudioUcode);
            else selectedUnicodes.delete(activeStudioUcode);
            updateSelectedCount();
            renderMatrixGrid(matrixData);
        });
    }

    // Studio Action Buttons
    if (btnAutoCenter) {
        btnAutoCenter.addEventListener('click', () => {
            const item = matrixData.find(i => i.unicode === activeStudioUcode);
            if (!item || !item.exists_a || !item.exists_b) return;

            const bboxA = item.bbox_a;
            const bboxB = item.bbox_b;

            const hA = bboxA[3] - bboxA[1];
            const hB = bboxB[3] - bboxB[1];
            const scaleFactor = (hA > 0 && hB > 0) ? (hA / hB) : 1.0;

            const centerXA = (bboxA[0] + bboxA[2]) / 2.0;
            const centerXB = (bboxB[0] + bboxB[2]) / 2.0;
            const xShift = centerXA - (centerXB * scaleFactor);

            const yShift = bboxA[1] - (bboxB[1] * scaleFactor);

            calibrations[activeStudioUcode] = {
                scale: parseFloat(scaleFactor.toFixed(2)),
                x_offset: parseFloat(xShift.toFixed(1)),
                y_offset: parseFloat(yShift.toFixed(1))
            };

            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    if (btnApplyAll) {
        btnApplyAll.addEventListener('click', () => {
            const currentCalib = calibrations[activeStudioUcode] || { scale: 1.0, x_offset: 0.0, y_offset: 0.0 };
            selectedUnicodes.forEach(ucode => {
                calibrations[ucode] = { ...currentCalib };
            });
            alert(`Applied scale (${Math.round(currentCalib.scale * 100)}%), X-shift (${currentCalib.x_offset}px), and Y-shift (${currentCalib.y_offset}px) across all active letters.`);
        });
    }

    if (btnResetCurrent) {
        btnResetCurrent.addEventListener('click', () => {
            calibrations[activeStudioUcode] = { scale: 1.0, x_offset: 0.0, y_offset: 0.0 };
            renderSuperimpositionStudio(activeStudioUcode);
        });
    }

    const renderMatrixGrid = (items) => {
        if (!matrixGrid) return;
        matrixGrid.innerHTML = '';
        updateSelectedCount();

        items.forEach(item => {
            const card = document.createElement('div');
            const isChecked = selectedUnicodes.has(item.unicode);
            const isActive = (item.unicode === activeStudioUcode);

            card.className = `matrix-card ${isChecked ? 'selected' : ''} ${isActive ? 'active-calibration' : ''}`;
            card.dataset.unicode = item.unicode;

            card.innerHTML = `
                <div class="matrix-card-header">
                    <span class="matrix-char">${item.char}</span>
                    <input type="checkbox" 
                           class="matrix-checkbox" 
                           data-unicode="${item.unicode}" 
                           ${isChecked ? 'checked' : ''} 
                           ${!item.exists_b ? 'disabled' : ''}>
                </div>
                <div class="matrix-comparison-row">
                    <div class="glyph-source-pill">
                        <span class="badge ${item.exists_a ? 'badge-accent' : 'badge-secondary'}">Font A</span>
                        <span>${item.exists_a ? item.width_a : 'N/A'}</span>
                    </div>
                    <div class="glyph-source-pill">
                        <span class="badge ${item.exists_b ? 'badge-cyan' : 'badge-secondary'}">Font B</span>
                        <span>${item.exists_b ? item.width_b : 'N/A'}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    renderSuperimpositionStudio(item.unicode);
                }
            });

            matrixGrid.appendChild(card);
        });

        attachMatrixCheckboxEvents();
    };

    const highlightActiveMatrixCard = (ucode) => {
        if (!matrixGrid) return;
        const cards = matrixGrid.querySelectorAll('.matrix-card');
        cards.forEach(card => {
            if (parseInt(card.dataset.unicode, 10) === ucode) {
                card.classList.add('active-calibration');
            } else {
                card.classList.remove('active-calibration');
            }
        });
    };

    const attachMatrixCheckboxEvents = () => {
        if (!matrixGrid) return;
        const checkboxes = matrixGrid.querySelectorAll('.matrix-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const ucode = parseInt(e.target.dataset.unicode, 10);
                const card = e.target.closest('.matrix-card');
                if (e.target.checked) {
                    selectedUnicodes.add(ucode);
                    if (card) card.classList.add('selected');
                } else {
                    selectedUnicodes.delete(ucode);
                    if (card) card.classList.remove('selected');
                }
                updateSelectedCount();
            });
        });
    };

    const updateSelectedCount = () => {
        if (selectedUnicodesCount) {
            selectedUnicodesCount.textContent = selectedUnicodes.size;
        }
    };

    if (btnMatrixSelectAll) {
        btnMatrixSelectAll.addEventListener('click', () => {
            matrixData.forEach(item => {
                if (item.exists_b) selectedUnicodes.add(item.unicode);
            });
            renderMatrixGrid(matrixData);
        });
    }

    if (btnMatrixDeselectAll) {
        btnMatrixDeselectAll.addEventListener('click', () => {
            selectedUnicodes.clear();
            renderMatrixGrid(matrixData);
        });
    }

    if (btnMatrixVowels) {
        btnMatrixVowels.addEventListener('click', () => {
            const vowelChars = new Set("aeiouAEIOU");
            selectedUnicodes.clear();
            matrixData.forEach(item => {
                if (item.exists_b && vowelChars.has(item.char)) {
                    selectedUnicodes.add(item.unicode);
                }
            });
            renderMatrixGrid(matrixData);
        });
    }

    if (matrixFilterInput) {
        matrixFilterInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const cards = matrixGrid.querySelectorAll('.matrix-card');
            cards.forEach(card => {
                const ucode = parseInt(card.dataset.unicode, 10);
                const charStr = String.fromCharCode(ucode).toLowerCase();
                if (!query || charStr.includes(query)) card.style.display = 'flex';
                else card.style.display = 'none';
            });
        });
    }

    if (btnM3Back) {
        btnM3Back.addEventListener('click', () => {
            hideAllSections();
            if (sectionM3Upload) sectionM3Upload.classList.add('active');
            setStep(1);
        });
    }

    if (btnM3Generate) {
        btnM3Generate.addEventListener('click', async () => {
            if (selectedUnicodes.size === 0) {
                alert('Please select at least one character to replace.');
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
                    selected_unicodes: Array.from(selectedUnicodes),
                    calibrations: calibrations,
                    metadata: {
                        family_name: m3FamilyName ? m3FamilyName.value.trim() || 'Calibrated Selective Font' : 'Calibrated Selective Font',
                        style_name: m3StyleName ? m3StyleName.value.trim() || 'Regular' : 'Regular',
                        full_name: m3FullName ? m3FullName.value.trim() || 'Calibrated Selective Font Regular' : 'Calibrated Selective Font Regular'
                    }
                };

                const response = await fetch('/api/generate-font2font-selective', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.detail || 'Calibrated font merge failed');
                }

                const data = await response.json();
                handleFontGenerationSuccess(data.download_url);

            } catch (err) {
                alert(`Calibrated Font Merge Error: ${err.message}`);
                hideAllSections();
                if (sectionM3Review) sectionM3Review.classList.add('active');
                setStep(2);
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
