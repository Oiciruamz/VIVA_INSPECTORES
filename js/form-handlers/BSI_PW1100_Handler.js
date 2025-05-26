class BSI_PW1100_Handler {
    constructor() {
        this.form = null;
        this.imageFiles = [];
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupForm());
        } else {
            this.setupForm();
        }
    }

    setupForm() {
        this.form = document.querySelector('form');
        if (!this.form) {
            console.error('No se encontró el formulario');
            return;
        }

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

        // Insertar antes de los botones de acción
        const actionButtonsContainer = this.form.querySelector('.action-buttons-container');
        if (actionButtonsContainer) {
            this.form.insertBefore(imageSection, actionButtonsContainer);
        } else {
            // Si no existe el contenedor de botones, insertar antes del botón submit
            const submitButton = this.form.querySelector('button[type="submit"]');
            this.form.insertBefore(imageSection, submitButton);
        }
    }

    addActionButtonsContainer() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        
        // Crear contenedor para todos los botones de acción
        const actionContainer = document.createElement('div');
        actionContainer.className = 'action-buttons-container';
        
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
        
        // Crear botón para generar Word
        const wordButton = document.createElement('button');
        wordButton.type = 'button';
        wordButton.className = 'action-button primary generate-word-btn';
        wordButton.innerHTML = '📄 Generar Documento Word';
        
        // Agregar botones al contenedor
        actionContainer.appendChild(clearButton);
        actionContainer.appendChild(debugButton);
        actionContainer.appendChild(wordButton);
        
        // Insertar antes del botón submit
        submitButton.parentNode.insertBefore(actionContainer, submitButton);
        
        // Ocultar el botón submit original o moverlo al contenedor
        submitButton.style.display = 'none';
    }



    setupEventListeners() {
        // Evento para subir imágenes
        const imageInput = document.getElementById('inspection_images');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Evento para generar documento Word
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
        const formData = new FormData(this.form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            // Evitar duplicar las imágenes que ya se manejan por separado
            if (key !== 'images' && key !== 'inspection_images') {
                data[key] = value;
            }
        }

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

    showLoadingIndicator() {
        const button = document.querySelector('.generate-word-btn');
        if (button) {
            button.disabled = true;
            button.innerHTML = '⏳ Generando documento...';
        }
    }

    hideLoadingIndicator() {
        const button = document.querySelector('.generate-word-btn');
        if (button) {
            button.disabled = false;
            button.innerHTML = '📄 Generar Documento Word';
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
}

// Inicializar el manejador cuando se carga la página
window.bsiHandler = new BSI_PW1100_Handler(); 