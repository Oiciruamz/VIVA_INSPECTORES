class BSI_PW1100_Handler {
    constructor() {
        this.form = null;
        this.imageFiles = [];
        this.previewPages = [];
        this.currentPageIndex = 0;
        this.pagePaths = [
            '../forms/cover_sheet_preview.html',
            '../forms/boroscope_report_page2_preview.html',
            '../forms/boroscope_report_page3_preview.html',
            '../forms/boroscope_report_page4_preview.html',
            '../forms/boroscope_report_page5_images_preview.html'
        ];
        this.modal = null;
        this.closeButton = null;
        this.prevPageBtn = null;
        this.nextPageBtn = null;
        this.pageNumberDisplay = null;
        this.previewPagesContainer = null;
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupForm());
        } else {
            this.setupForm();
        }
        this.loadFormData(); // Cargar datos del formulario al inicio
    }

    setupForm() {
        this.form = document.querySelector('form');
        if (!this.form) {
            console.error('No se encontró el formulario');
            return;
        }

        // Initialize modal elements
        this.modal = document.getElementById('previewModal');
        this.closeButton = document.querySelector('#previewModal .close-button');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.pageNumberDisplay = document.getElementById('pageNumberDisplay');
        this.previewPagesContainer = document.getElementById('previewPagesContainer');

        // Agregar contenedor de botones de acción
        this.addActionButtonsContainer();
        
        // Agregar sección para subir imágenes
        this.addImageUploadSection();
        
        // Configurar eventos
        this.setupEventListeners();
    }

    addImageUploadSection() {
        const imageSection = document.createElement('fieldset');
        imageSection.innerHTML = `
            <legend>Imágenes Adjuntas</legend>
            <div class="form-group">
                <label for="inspection_images">📷 Subir imágenes de la inspección </label>
                <input type="file" id="inspection_images" name="inspection_images" 
                       multiple accept="image/*" class="image-upload-input">
                <p class="form-note">📁 Puede subir múltiples imágenes. Formatos soportados: JPG, PNG, GIF. Máximo 10MB por imagen.</p>
                <div id="image-preview" class="image-preview-container"></div>
            </div>
        `;

        // Insertar antes del contenedor de botones de acción existente
        const buttonGroup = this.form.querySelector('.button-group');
        if (buttonGroup) {
            this.form.insertBefore(imageSection, buttonGroup);
        } else {
            // Si no se encuentra el contenedor de botones, como fallback, intentar antes del botón submit
            const submitButton = this.form.querySelector('button[type="submit"]');
            if (submitButton) {
                this.form.insertBefore(imageSection, submitButton);
            } else {
                // Si no hay botón submit, simplemente añadir al final del formulario
                this.form.appendChild(imageSection);
            }
        }
    }

    addActionButtonsContainer() {
        const buttonGroup = this.form.querySelector('.button-group');
        if (!buttonGroup) {
            console.error('No se encontró el contenedor .button-group en el formulario.');
            return; // Salir si no se encuentra el contenedor
        }
        
        // Crear botón para limpiar formulario
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'action-button secondary clear-form-btn';
        clearButton.innerHTML = '🗑️ Limpiar Formulario';
        
        // Crear botón de debug
        const debugButton = document.createElement('button');
        debugButton.type = 'button';
        debugButton.className = 'action-button warning debug-fill-btn';
        debugButton.innerHTML = '🐛 Llenar Formulario (Debug)';
        
        // Crear botón para generar Word (el de previsualización ya está en el HTML)
        const wordButton = document.createElement('button');
        wordButton.type = 'button';
        wordButton.className = 'action-button primary generate-word-btn';
        wordButton.innerHTML = '📄 Generar Documento Word';
        
        // Agregar botones al contenedor button-group existente
        // Insertar antes del botón submit existente si es posible
        const submitButton = buttonGroup.querySelector('button[type="submit"]');
        if (submitButton) {
            buttonGroup.insertBefore(clearButton, submitButton);
            buttonGroup.insertBefore(debugButton, submitButton);
            buttonGroup.insertBefore(wordButton, submitButton);
        } else {
            // Si no hay botón submit, simplemente añadir al final
            buttonGroup.appendChild(clearButton);
            buttonGroup.appendChild(debugButton);
            buttonGroup.appendChild(wordButton);
        }

        // El botón original de submit y el de previsualización ya están en el HTML
        // No ocultamos nada, solo añadimos los nuevos.
    }

    setupEventListeners() {
        // Evento para subir imágenes
        const imageInput = document.getElementById('inspection_images');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Evento para previsualizar documento Word (ahora HTML) - apunta al botón existente en HTML
        const previewButton = document.getElementById('previewDocBtn');
        if (previewButton) {
            previewButton.addEventListener('click', () => this.openPreviewModal());
        }

        // Evento para generar documento Word - apunta al nuevo botón creado en JS
        const wordButton = document.querySelector('.generate-word-btn');
        if (wordButton) {
            wordButton.addEventListener('click', () => this.generateWordDocument());
        }

        // Evento para llenar formulario con datos de debug
        const debugButton = document.querySelector('.debug-fill-btn');
        if (debugButton) {
            debugButton.addEventListener('click', () => this.fillFormWithDebugData());
        }

        // Evento para limpiar formulario
        const clearButton = document.querySelector('.clear-form-btn');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearForm());
        }

        // Prevenir envío normal del formulario si se quiere generar Word
        this.form.addEventListener('submit', (e) => {
            // Permitir envío normal del formulario para otras funcionalidades
            console.log('Formulario enviado normalmente');
        });

        // Manejo del modal de previsualización (nueva lógica para HTML)
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.modal.style.display = 'none';
            }
        });

        // Eventos de navegación del modal
        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => this.navigatePreview(-1));
        }
        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => this.navigatePreview(1));
        }
    }

    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        
        // Agregar las nuevas imágenes a las existentes en lugar de reemplazarlas
        this.imageFiles = [...this.imageFiles, ...files];

        // Mostrar preview de todas las imágenes (existentes + nuevas)
        this.showImagePreview(this.imageFiles);
        
        // Limpiar el input para permitir seleccionar las mismas imágenes nuevamente si es necesario
        event.target.value = '';
    }

    showImagePreview(files) {
        const previewContainer = document.getElementById('image-preview');
        previewContainer.innerHTML = '';

        if (files.length === 0) {
            return;
        }

        // Agregar encabezado para la sección de imágenes
        const headerDiv = document.createElement('div');
        headerDiv.className = 'image-preview-header';
        headerDiv.innerHTML = `
            <h4>📸 Imágenes seleccionadas (${files.length})</h4>
            <button type="button" onclick="window.bsiHandler.removeAllImages()" class="btn-remove-all">
                🗑️ Eliminar todas
            </button>
        `;
        previewContainer.appendChild(headerDiv);

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDiv = document.createElement('div');
                imageDiv.className = 'image-preview-item';
                imageDiv.setAttribute('data-index', index);

                // Truncar nombre de archivo si es muy largo
                const truncatedName = file.name.length > 20 
                    ? file.name.substring(0, 17) + '...' 
                    : file.name;

                imageDiv.innerHTML = `
                    <div class="image-preview-thumbnail">
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <p class="image-filename" title="${file.name}">${truncatedName}</p>
                        <button type="button" onclick="window.bsiHandler.removeImage(${index})" class="btn-remove-image">
                            🗑️ Eliminar
                        </button>
                    </div>
                    <div class="image-description-container">
                        <label for="image_description_${index}">
                            📝 Descripción de la imagen ${index + 1}:
                        </label>
                        <textarea 
                            id="image_description_${index}" 
                            name="image_description_${index}"
                            placeholder="Ej: ENGINE ESN V17259, LPC 1.5 NO DAMAGE FOUND"
                        ></textarea>
                        <p class="image-description-help">
                            💡 Describa brevemente qué muestra esta imagen (componente, condición, hallazgos, etc.)
                        </p>
                    </div>
                `;

                previewContainer.appendChild(imageDiv);
            };
            reader.readAsDataURL(file);
        });
    }

    async openPreviewModal() {
        this.showLoadingIndicator('Cargando previsualización...');

        const formData = this.collectFormData();
        this.saveFormData(formData); // Guardar datos del formulario antes de previsualizar

        const validation = this.validateRequiredFields(formData);
        if (!validation.isValid) {
            this.hideLoadingIndicator();
            alert(`Por favor complete los siguientes campos requeridos para la previsualización:\n${validation.missingFields.join('\n')}`);
            return;
        }

        // Cargar las páginas HTML si aún no se han cargado
        if (this.previewPages.length === 0) {
            await this.loadPreviewPages();
        }
        
        // Inyectar datos en todas las páginas cargadas
        this.previewPages.forEach(pageElement => {
            this.injectFormDataIntoPreview(pageElement, formData);
        });

        // Mostrar el modal y la primera página
        this.modal.style.display = 'flex'; // Usar flex para centrar
        this.currentPageIndex = 0;
        this.showPage(this.currentPageIndex);
        this.updatePageNavigation();

        this.hideLoadingIndicator();
    }

    async loadPreviewPages() {
        this.previewPagesContainer.innerHTML = ''; // Limpiar contenedor
        this.previewPages = [];

        for (const path of this.pagePaths) {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const htmlContent = await response.text();
                
                const pageWrapper = document.createElement('div');
                pageWrapper.className = 'preview-page';
                pageWrapper.innerHTML = htmlContent; // Cargar el contenido HTML
                this.previewPagesContainer.appendChild(pageWrapper);
                this.previewPages.push(pageWrapper);

            } catch (error) {
                console.error(`Error al cargar la página de previsualización ${path}:`, error);
                // Opcional: mostrar un mensaje de error al usuario
            }
        }
    }

    showPage(index) {
        this.previewPages.forEach((page, i) => {
            page.style.display = (i === index) ? 'block' : 'none';
        });
    }

    navigatePreview(direction) {
        this.currentPageIndex += direction;

        if (this.currentPageIndex < 0) {
            this.currentPageIndex = 0; // Prevent going below first page
        } else if (this.currentPageIndex >= this.previewPages.length) {
            this.currentPageIndex = this.previewPages.length - 1; // Prevent going beyond last page
        }

        this.showPage(this.currentPageIndex);
        this.updatePageNavigation();
    }

    updatePageNavigation() {
        this.pageNumberDisplay.textContent = `Página ${this.currentPageIndex + 1} de ${this.previewPages.length}`;
        this.prevPageBtn.disabled = this.currentPageIndex === 0;
        this.nextPageBtn.disabled = this.currentPageIndex === this.previewPages.length - 1;
    }

    injectFormDataIntoPreview(pageElement, formData) {
        const mappings = {
            'nombre_registrado': '#preview-nombre_registrado',
            'work_order_number': '#preview-work_order_number',
            'date_of_bsi': '#preview-date_of_bsi',
            'inspected_by': '#preview-inspected_by',
            'inspector_stamp': '#preview-inspector_stamp',
            'references_used': '#preview-references_used',
            'aircraft_registration': '#preview-aircraft_registration',
            'engine_sn': '#preview-engine_sn',
            'boroscope_sn': '#preview-boroscope_sn',
            'probe_sn': '#preview-probe_sn',
            'shiplap_dimensions': '#preview-shiplap_dimensions',
            'final_disposition': '#preview-final_disposition',
            'new_interval_inspections': '#preview-new_interval_inspections',
            'user_email': '#preview-user_email',
            'inspection_time': '#preview-inspection_time',
            'interval_next_fc': '#preview-interval_next_fc',
            'interval_next_fh': '#preview-interval_next_fh',
            'lpc_stage1_remarks': '#preview-lpc_stage1_remarks',
            'lpc_stage2_remarks': '#preview-lpc_stage2_remarks',
            'lpc_stage3_remarks': '#preview-lpc_stage3_remarks',
            'bearing3_front_remarks': '#preview-bearing3_front_remarks',
            'bearing3_rear_remarks': '#preview-bearing3_rear_remarks',
            'hpc_stage1_remarks': '#preview-hpc_stage1_remarks',
            'hpc_stage2_remarks': '#preview-hpc_stage2_remarks',
            'hpc_stage3_remarks': '#preview-hpc_stage3_remarks',
            'hpc_stage4_remarks': '#preview-hpc_stage4_remarks',
            'hpc_stage5_remarks': '#preview-hpc_stage5_remarks',
            'hpc_stage6_remarks': '#preview-hpc_stage6_remarks',
            'hpc_stage7_remarks': '#preview-hpc_stage7_remarks',
            'hpc_stage8_remarks': '#preview-hpc_stage8_remarks',
            'igniter_remarks': '#preview-igniter_remarks',
            'fuelnozzle_remarks': '#preview-fuelnozzle_remarks',
            'cch_inner_remarks': '#preview-cch_inner_remarks',
            'cch_outer_remarks': '#preview-cch_outer_remarks',
            'shiplap_remarks': '#preview-shiplap_remarks',
            'hpt_vane_remarks': '#preview-hpt_vane_remarks',
            'hpt_s1_remarks': '#preview-hpt_s1_remarks',
            'hpt_s2_remarks': '#preview-hpt_s2_remarks',
            'lpt_s1_remarks': '#preview-lpt_s1_remarks',
            'lpt_s2_remarks': '#preview-lpt_s2_remarks',
            'lpt_s3_remarks': '#preview-lpt_s3_remarks'
        };

        for (const key in formData) {
            if (mappings[key]) {
                const targetElement = pageElement.querySelector(mappings[key]);
                if (targetElement) {
                    targetElement.textContent = formData[key];
                }
            }
        }

        // Manejo especial para imágenes: inyectar descripciones y src
        if (formData.image_files_data && Array.isArray(formData.image_files_data)) {
            formData.image_files_data.forEach((imgData, index) => {
                const descElement = pageElement.querySelector(`#preview-image-description-${index}`);
                if (descElement) {
                    descElement.textContent = imgData.description || '';
                }
                const imgElement = pageElement.querySelector(`#preview-image-${index}`);
                if (imgElement && imgData.src) {
                    imgElement.src = imgData.src;
                    imgElement.style.display = 'block'; // Asegurarse de que la imagen se muestre
                }
            });
        }

        // Aquí puedes añadir lógica para campos complejos, como radio buttons o checkboxes
        // Por ejemplo, para radio buttons, podrías buscar un elemento con un ID específico
        // que corresponda al valor seleccionado y añadirle una clase o contenido.

        // Limpiar todos los checkmarks antes de aplicar los nuevos
        pageElement.querySelectorAll('.radio-check').forEach(el => el.textContent = '');

        // Lógica para radio buttons (añadir checkmark a la opción seleccionada)
        const radioGroups = [
            'station', 'bsi_reason', 'bsi_type', 'aircraft_model', 'boroscope_type',
            'lpc_stage1_status', 'lpc_stage2_status', 'lpc_stage3_status',
            'bearing3_front_status', 'bearing3_rear_status',
            'hpc_stage1_status', 'hpc_stage2_status', 'hpc_stage3_status', 'hpc_stage4_status',
            'hpc_stage5_status', 'hpc_stage6_status', 'hpc_stage7_status', 'hpc_stage8_status',
            'igniter_status', 'fuelnozzle_status', 'cch_inner_status', 'cch_outer_status',
            'shiplap_status', 'hpt_vane_status', 'hpt_s1_status', 'hpt_s2_status',
            'lpt_s1_status', 'lpt_s2_status', 'lpt_s3_status',
            'engine_status_bsi', 'interval_affected'
        ];

        radioGroups.forEach(groupName => {
            if (formData[groupName]) {
                const value = formData[groupName];
                const normalizedValue = value.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                const targetId = `#preview-${groupName}-${normalizedValue}`;
                const targetElement = pageElement.querySelector(targetId);
                if (targetElement) {
                    targetElement.textContent = '✔️';
                }
            }
        });
    }

    async generateWordDocument() {
        try {
            // Mostrar indicador de carga
            this.showLoadingIndicator();

            // Recopilar datos del formulario
            const formData = this.collectFormData();

            // Validar campos requeridos
            const validation = this.validateRequiredFields(formData);
            if (!validation.isValid) {
                this.hideLoadingIndicator();
                alert(`Por favor complete los siguientes campos requeridos:\n${validation.missingFields.join('\n')}`);
                return;
            }

            // Crear FormData para enviar al servidor
            const submitData = new FormData();

            // Agregar datos del formulario
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            // Agregar imágenes con sus descripciones
            this.imageFiles.forEach((file, index) => {
                // Agregar el archivo de imagen
                submitData.append('images', file);
                
                // Agregar la descripción de la imagen
                const descriptionField = document.getElementById(`image_description_${index}`);
                const description = descriptionField ? descriptionField.value.trim() : '';
                submitData.append(`image_description_${index}`, description || `Imagen ${index + 1}`);
            });

            // Enviar al servidor
            const response = await fetch('/generate-bsi-pw1100', {
                method: 'POST',
                body: submitData
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            // Descargar el archivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BSI_PW1100_Report_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.hideLoadingIndicator();
            alert('Documento Word generado exitosamente');

        } catch (error) {
            this.hideLoadingIndicator();
            console.error('Error generando documento:', error);
            alert(`Error generando el documento: ${error.message}`);
        }
    }

    collectFormData() {
        const data = {};
        const formElements = this.form.elements;

        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name) {
                if (element.type === 'radio') {
                    if (element.checked) {
                        data[element.name] = element.value;
                    }
                } else if (element.type === 'checkbox') {
                    // Si hay checkboxes, su valor se manejaría aquí
                    data[element.name] = element.checked;
                } else if (element.tagName === 'SELECT') {
                    data[element.name] = element.value;
                } else if (element.type !== 'file') { // Excluir inputs de tipo file (imágenes se manejan aparte)
                    data[element.name] = element.value.trim();
                }
            }
        }

        // Recopilar datos de las imágenes adjuntas (descripciones y src)
        data.image_files_data = [];
        this.imageFiles.forEach((file, index) => {
            const descriptionField = document.getElementById(`image_description_${index}`);
            const description = descriptionField ? descriptionField.value.trim() : '';
            
            // Asegurarse de que el src de la imagen esté disponible (asumimos que ya se cargó en showImagePreview)
            const imgElement = document.querySelector(`#image-preview .image-preview-item[data-index="${index}"] img`);
            const imgSrc = imgElement ? imgElement.src : '';

            data.image_files_data.push({
                name: file.name,
                description: description,
                src: imgSrc // Guardar el Data URL de la imagen para la previsualización
            });
        });

        return data;
    }

    validateRequiredFields(formData) {
        const requiredFields = [
            { key: 'nombre_registrado', label: 'Nombre registrado' },
            { key: 'work_order_number', label: 'Work Order Number' },
            { key: 'date_of_bsi', label: 'Date of BSI' },
            { key: 'inspected_by', label: 'Inspected By' },
            { key: 'inspector_stamp', label: 'Inspector Stamp' },
            { key: 'station', label: 'Station' },
            { key: 'bsi_reason', label: 'BSI accomplished reason' },
            { key: 'bsi_type', label: 'Type of BSI' },
            { key: 'references_used', label: 'References Used' },
            { key: 'aircraft_model', label: 'Aircraft Model' },
            { key: 'engine_sn', label: 'Engine S/N' },
            { key: 'boroscope_type', label: 'Boroscope Used type' },
            { key: 'boroscope_sn', label: 'Boroscope S/N' },
            { key: 'probe_sn', label: 'Probe S/N' },
            { key: 'final_disposition', label: 'Final disposition' },
            { key: 'engine_status_bsi', label: 'Engine Status after BSI' },
            { key: 'new_interval_inspections', label: 'New Interval Inspections' },
            { key: 'user_email', label: 'Email' },
            { key: 'inspection_time', label: 'Inspection Time' },
            { key: 'interval_affected', label: 'Interval inspection Affected' }
        ];

        const missingFields = [];

        requiredFields.forEach(field => {
            if (!formData[field.key] || formData[field.key].trim() === '') {
                missingFields.push(`- ${field.label}`);
            }
        });

        return {
            isValid: missingFields.length === 0,
            missingFields
        };
    }

    showLoadingIndicator(message = 'Cargando...') {
        const wordButton = document.querySelector('.generate-word-btn');
        const previewButton = document.querySelector('.preview-word-btn');
        
        if (wordButton) {
            wordButton.disabled = true;
            wordButton.innerHTML = `⏳ ${message}`;
        }
        if (previewButton) {
            previewButton.disabled = true;
            previewButton.innerHTML = `⏳ ${message}`;
        }
    }

    hideLoadingIndicator() {
        const wordButton = document.querySelector('.generate-word-btn');
        const previewButton = document.querySelector('.preview-word-btn');

        if (wordButton) {
            wordButton.disabled = false;
            wordButton.innerHTML = '📄 Generar Documento Word';
        }
        if (previewButton) {
            previewButton.disabled = false;
            previewButton.innerHTML = '👁️ Previsualizar Documento';
        }
    }

    fillFormWithDebugData() {
        console.log('Llenando formulario con datos de debug...');
        
        // Datos de prueba para el formulario BSI PW1100
        const debugData = {
            // Información general
            nombre_registrado: 'Inspector de Prueba',
            work_order_number: 'WO-2024-001234',
            date_of_bsi: '2024-01-15',
            inspected_by: 'Julio Acosta',
            inspector_stamp: 'QC-003',
            station: 'MTY',
            bsi_reason: 'Maintenance Program',
            bsi_type: 'Full BSI',
            references_used: 'AMM 72-00-00, SB PW1100G-72-001',
            
            // Información de aeronave
            aircraft_model: 'A320 NEO',
            aircraft_registration: 'XA-VBA',
            engine_sn: 'PW123456789',
            
            // Equipo utilizado
            boroscope_type: 'Mentor IQ',
            boroscope_sn: '1830A9916',
            probe_sn: '1602A1890',
            
            // LPC Stages
            lpc_stage1_status: 'No Damage Found',
            lpc_stage1_remarks: 'Inspección visual completada sin anomalías detectadas.',
            lpc_stage2_status: 'Damage In Limits',
            lpc_stage2_remarks: 'Desgaste menor observado en álabes, dentro de límites aceptables.',
            lpc_stage3_status: 'No Damage Found',
            lpc_stage3_remarks: 'Estado satisfactorio.',
            
            // #3 Bearing
            bearing3_front_status: 'No Damage Found',
            bearing3_front_remarks: 'Sello frontal en condiciones normales.',
            bearing3_rear_status: 'No Damage Found',
            bearing3_rear_remarks: 'Sello trasero sin evidencia de fugas.',
            
            // HPC Stages (ejemplos para algunos)
            hpc_stage1_status: 'No Damage Found',
            hpc_stage1_remarks: 'Álabes en condición satisfactoria.',
            hpc_stage2_status: 'Damage In Limits',
            hpc_stage2_remarks: 'Erosión menor en leading edge, dentro de límites.',
            hpc_stage3_status: 'No Damage Found',
            hpc_stage3_remarks: 'Sin anomalías detectadas.',
            hpc_stage4_status: 'No Damage Found',
            hpc_stage4_remarks: 'Estado normal.',
            hpc_stage5_status: 'No Damage Found',
            hpc_stage5_remarks: 'Inspección satisfactoria.',
            hpc_stage6_status: 'No Damage Found',
            hpc_stage6_remarks: 'Sin daños visibles.',
            hpc_stage7_status: 'No Damage Found',
            hpc_stage7_remarks: 'Condición aceptable.',
            hpc_stage8_status: 'No Damage Found',
            hpc_stage8_remarks: 'Última etapa en buen estado.',
            
            // Combustion Chamber
            igniter_status: 'No Damage Found',
            igniter_remarks: 'Segmento del encendedor en condiciones normales.',
            fuelnozzle_status: 'Damage In Limits',
            fuelnozzle_remarks: 'Depósitos de carbón menores, limpieza recomendada.',
            cch_inner_status: 'No Damage Found',
            cch_inner_remarks: 'Liner interno sin grietas o deformaciones.',
            cch_outer_status: 'No Damage Found',
            cch_outer_remarks: 'Liner externo en condición satisfactoria.',
            
            // Ship Lap
            shiplap_status: 'Damage In Limits',
            shiplap_remarks: 'Desgaste normal por operación, dentro de tolerancias.',
            shiplap_dimensions: '2.5mm gap measured',
            
            // HPT
            hpt_vane_status: 'No Damage Found',
            hpt_vane_remarks: 'Álabes guía en condición normal.',
            hpt_s1_status: 'Damage In Limits',
            hpt_s1_remarks: 'Erosión térmica menor en trailing edge.',
            hpt_s2_status: 'No Damage Found',
            hpt_s2_remarks: 'Segunda etapa sin anomalías.',
            
            // LPT
            lpt_s1_status: 'No Damage Found',
            lpt_s1_remarks: 'Primera etapa LPT en buen estado.',
            lpt_s2_status: 'No Damage Found',
            lpt_s2_remarks: 'Segunda etapa sin daños.',
            lpt_s3_status: 'No Damage Found',
            lpt_s3_remarks: 'Tercera etapa satisfactoria.',
            
            // Disposición final
            final_disposition: 'Motor aprobado para operación continua. Se recomienda limpieza de inyectores de combustible en próximo mantenimiento programado. Todos los hallazgos están dentro de límites aceptables según manual de mantenimiento.',
            engine_status_bsi: 'Serviceable to Operation',
            new_interval_inspections: '6000 FC / 12000 FH',
            user_email: 'inspector.prueba@vivaaerobus.com',
            inspection_time: '180',
            
            // Intervalos
            interval_affected: 'No',
            interval_next_fc: '6000',
            interval_next_fh: '12000'
        };
        
        // Llenar todos los campos del formulario
        Object.keys(debugData).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                if (field.type === 'radio') {
                    // Para radio buttons, buscar el que coincida con el valor
                    const radioButton = this.form.querySelector(`[name="${fieldName}"][value="${debugData[fieldName]}"]`);
                    if (radioButton) {
                        radioButton.checked = true;
                    }
                } else if (field.type === 'checkbox') {
                    field.checked = debugData[fieldName];
                } else {
                    // Para inputs normales, textareas y selects
                    field.value = debugData[fieldName];
                }
            }
        });
        
        console.log('Formulario llenado con datos de debug');
        
        // Mostrar notificación visual
        this.showDebugNotification();
    }

    showDebugNotification() {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.innerHTML = '✅ Formulario llenado con datos de prueba';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4caf50;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        // Agregar animación CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 3000);
    }

    clearForm() {
        console.log('Limpiando formulario...');
        
        // Limpiar todos los inputs de texto, textareas, selects
        const textInputs = this.form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="date"], textarea, select');
        textInputs.forEach(input => {
            input.value = '';
        });
        
        // Limpiar radio buttons
        const radioInputs = this.form.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
            radio.checked = false;
        });
        
        // Limpiar checkboxes
        const checkboxInputs = this.form.querySelectorAll('input[type="checkbox"]');
        checkboxInputs.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Limpiar preview de imágenes
        const imagePreview = document.getElementById('image-preview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
        
        // Limpiar archivos de imagen
        const imageInput = document.getElementById('inspection_images');
        if (imageInput) {
            imageInput.value = '';
        }
        this.imageFiles = [];
        
        console.log('Formulario limpiado');
        
        // Mostrar notificación
        this.showClearNotification();
    }

    showClearNotification() {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.innerHTML = '🗑️ Formulario limpiado';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #6c757d;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 2 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    removeImage(index) {
        // Eliminar la imagen del array
        this.imageFiles.splice(index, 1);
        
        // Actualizar el preview
        this.showImagePreview(this.imageFiles);
        
        console.log(`Imagen ${index + 1} eliminada. Imágenes restantes: ${this.imageFiles.length}`);
    }

    removeAllImages() {
        // Confirmar antes de eliminar todas las imágenes
        if (this.imageFiles.length > 0 && confirm('¿Está seguro de que desea eliminar todas las imágenes?')) {
            this.imageFiles = [];
            this.showImagePreview(this.imageFiles);
            
            // Limpiar también el input de archivos
            const imageInput = document.getElementById('inspection_images');
            if (imageInput) {
                imageInput.value = '';
            }
            
            console.log('Todas las imágenes eliminadas');
        }
    }

    // Métodos para guardar y cargar datos del formulario en localStorage
    saveFormData(data) {
        try {
            localStorage.setItem('bsiFormData', JSON.stringify(data));
            console.log('Datos del formulario guardados en localStorage.');
        } catch (e) {
            console.error('Error al guardar datos en localStorage:', e);
        }
    }

    loadFormData() {
        try {
            const data = localStorage.getItem('bsiFormData');
            if (data) {
                const formData = JSON.parse(data);
                // Iterar sobre los datos y rellenar el formulario
                for (const key in formData) {
                    const input = this.form.elements[key];
                    if (input) {
                        if (input.type === 'radio') {
                            const radio = this.form.querySelector(`input[name="${key}"][value="${formData[key]}"]`);
                            if (radio) radio.checked = true;
                        } else if (input.type === 'checkbox') {
                            // Manejar checkboxes si los hubiera
                            input.checked = formData[key];
                        } else {
                            input.value = formData[key];
                        }
                    }
                }
                // Manejar la carga de imágenes y sus descripciones
                if (formData.image_files_data && Array.isArray(formData.image_files_data)) {
                    this.imageFiles = formData.image_files_data.map(imgData => {
                        // Recrear un objeto File dummy o usar Data URL directamente
                        // Para una previsualización real, necesitarías recargar las imágenes del servidor
                        // o guardarlas como Data URLs (cuidado con el tamaño de localStorage)
                        // Por ahora, simplemente cargaremos las descripciones asociadas
                        return { name: imgData.name, description: imgData.description, src: imgData.src };
                    });
                    this.showImagePreview(this.imageFiles);
                    // Rellenar descripciones de imágenes después de que se muestren
                    this.imageFiles.forEach((imgData, index) => {
                        const textarea = document.getElementById(`image_description_${index}`);
                        if (textarea) {
                            textarea.value = imgData.description || '';
                        }
                    });
                }
                console.log('Datos del formulario cargados desde localStorage.');
            }
        } catch (e) {
            console.error('Error al cargar datos desde localStorage:', e);
        }
    }
}

// Inicializar el manejador cuando se carga la página
window.bsiHandler = new BSI_PW1100_Handler(); 