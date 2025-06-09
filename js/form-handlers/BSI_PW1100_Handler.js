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
            '../forms/boroscope_report_page5_preview.html',
            '../forms/boroscope_report_page5_images_preview.html'
        ];
        this.modal = null;
        this.closeButton = null;
        this.prevPageBtn = null;
        this.nextPageBtn = null;
        this.downloadPdfBtn = null;
        this.pageNumberDisplay = null;
        this.previewPagesContainer = null;
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo ANTES de hacer cualquier cosa
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.ensureCorrectBodyStyles();
                this.setupForm();
                this.loadFormData();
            });
        } else {
            this.ensureCorrectBodyStyles();
            this.setupForm();
            this.loadFormData();
        }
    }

    ensureCorrectBodyStyles() {
        // Verificar que document.body existe antes de intentar acceder a él
        if (!document.body) {
            console.error('❌ document.body no está disponible aún');
            return;
        }

        try {
            // LIMPIEZA AGRESIVA: Remover TODAS las clases problemáticas
            document.body.classList.remove('modal-open');
            
            // LIMPIEZA AGRESIVA: Limpiar todos los estilos inline
            if (document.body.hasAttribute('style')) {
                document.body.removeAttribute('style');
            }
            document.body.style.cssText = '';
            
            // LIMPIEZA AGRESIVA: Restaurar propiedades específicas del body
            document.body.style.overflow = '';
            document.body.style.height = '';
            document.body.style.paddingRight = '';
            document.body.style.margin = '';
            document.body.style.padding = '';
            document.body.style.display = '';
            document.body.style.justifyContent = '';
            document.body.style.alignItems = '';
            document.body.style.minHeight = '';
            document.body.style.backgroundColor = '';
            document.body.style.position = '';
            document.body.style.fontFamily = '';
            document.body.style.color = '';
            document.body.style.lineHeight = '';
            
            // Remover cualquier elemento de estilo inline que pueda existir
            const inlineStyles = document.querySelectorAll('style[data-modal-styles]');
            inlineStyles.forEach(style => style.remove());
            
            // Asegurar que el body tenga los estilos correctos para el formulario
            console.log('✅ Estilos del body completamente restaurados');
        } catch (error) {
            console.error('❌ Error al restaurar estilos del body:', error);
        }
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
        this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        this.pageNumberDisplay = document.getElementById('pageNumberDisplay');
        this.previewPagesContainer = document.getElementById('previewPagesContainer');

        // Agregar contenedor de botones de acción
        this.addActionButtonsContainer();
        
        // Agregar sección para subir imágenes
        this.addImageUploadSection();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Verificar librerías PDF (con un pequeño delay para asegurar que se carguen)
        setTimeout(() => this.checkPDFLibraries(), 500);
    }

    checkPDFLibraries() {
        console.log('🔍 Verificando librerías PDF...');
        
        // Verificar html2canvas
        if (typeof window.html2canvas !== 'undefined') {
            console.log('✅ html2canvas cargado correctamente');
        } else {
            console.warn('⚠️ html2canvas no está cargado');
        }
        
        // Verificar jsPDF
        if (window.jspdf && window.jspdf.jsPDF) {
            console.log('✅ jsPDF cargado correctamente en window.jspdf.jsPDF');
        } else if (window.jsPDF) {
            console.log('✅ jsPDF cargado correctamente en window.jsPDF');
        } else {
            console.warn('⚠️ jsPDF no está cargado');
        }
    }

    addImageUploadSection() {
        // Verificar si la sección de imágenes ya existe (agregada desde HTML)
        const existingImageInput = document.getElementById('inspection_images');
        if (existingImageInput) {
            console.log('La sección de imágenes ya existe en el HTML, no es necesario crearla.');
            return; // La sección ya está, no necesitamos crearla
        }

        // Solo crear la sección si no existe
        console.log('Creando sección de imágenes dinámicamente...');

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

        // Verificar si los botones ya existen (agregados desde HTML)
        const existingButtons = buttonGroup.querySelectorAll('.action-button');
        if (existingButtons.length > 0) {
            console.log('Los botones ya existen en el HTML, no es necesario crearlos.');
            return; // Los botones ya están, no necesitamos crearlos
        }

        // Solo crear botones si no existen
        console.log('Creando botones dinámicamente...');

        // Limpiar cualquier contenido existente en buttonGroup
        buttonGroup.innerHTML = '';

        // Crear botón para limpiar formulario
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'action-button secondary clear-form-btn';
        clearButton.innerHTML = '🗑️ Limpiar Formulario';

        // Crear botón de debug
        const debugButton = document.createElement('button');
        debugButton.type = 'button';
        debugButton.className = 'action-button warning debug-fill-btn';
        debugButton.innerHTML = 'Llenar Formulario (Debug)';

        // Crear botón para generar Word
        const wordButton = document.createElement('button');
        wordButton.type = 'button';
        wordButton.className = 'action-button primary generate-word-btn';
        wordButton.innerHTML = '📄 Generar Documento Word';

        // Crear botón para previsualizar documento
        const previewButton = document.createElement('button');
        previewButton.type = 'button';
        previewButton.id = 'previewDocBtn'; // Mantener el ID si hay listeners asociados
        previewButton.className = 'action-button primary preview-doc-btn';
        previewButton.innerHTML = 'Previsualizar Documento';

        // Crear contenedores para las filas de botones
        const row1 = document.createElement('div');
        row1.className = 'button-row';
        row1.appendChild(clearButton);
        row1.appendChild(debugButton);

        const row2 = document.createElement('div');
        row2.className = 'button-row';
        row2.appendChild(wordButton);
        row2.appendChild(previewButton);

        // Añadir las filas al buttonGroup
        buttonGroup.appendChild(row1);
        buttonGroup.appendChild(row2);
    }

    setupEventListeners() {
        // Usar un pequeño timeout para asegurar que todos los elementos estén disponibles
        setTimeout(() => {
            this.configureEventListeners();
        }, 100);
    }

    configureEventListeners() {
        console.log('🔧 Configurando event listeners...');

        // Evento para subir imágenes
        const imageInput = document.getElementById('inspection_images');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
            console.log('✅ Event listener para imágenes configurado correctamente');
        } else {
            console.error('❌ No se encontró el input de imágenes');
        }

        // Evento para previsualizar documento Word (ahora HTML) - apunta al botón existente en HTML
        const previewButton = document.getElementById('previewDocBtn');
        if (previewButton) {
            previewButton.addEventListener('click', () => this.openPreviewModal());
            console.log('✅ Event listener para previsualización configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de previsualización');
        }

        // Evento para generar documento Word - apunta al nuevo botón creado en JS
        const wordButton = document.querySelector('.generate-word-btn');
        if (wordButton) {
            wordButton.addEventListener('click', () => this.generateWordDocument());
            console.log('✅ Event listener para generar Word configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de generar Word');
        }

        // Evento para llenar formulario con datos de debug
        const debugButton = document.querySelector('.debug-fill-btn');
        if (debugButton) {
            debugButton.addEventListener('click', () => this.fillFormWithDebugData());
            console.log('✅ Event listener para debug configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de debug');
        }

        // Evento para limpiar formulario
        const clearButton = document.querySelector('.clear-form-btn');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearForm());
            console.log('✅ Event listener para limpiar formulario configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de limpiar formulario');
        }

        // Prevenir envío normal del formulario si se quiere generar Word
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                // Permitir envío normal del formulario para otras funcionalidades
                console.log('Formulario enviado normalmente');
            });
            console.log('✅ Event listener para formulario configurado correctamente');
        } else {
            console.error('❌ No se encontró el formulario');
        }

        // Manejo del modal de previsualización (nueva lógica para HTML)
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.closePreviewModal();
            });
            console.log('✅ Event listener para cerrar modal configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de cerrar modal');
        }

        // Click fuera del modal para cerrarlo
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closePreviewModal();
            }
        });

        // Escape key para cerrar modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
                this.closePreviewModal();
            }
        });

        // Botón X flotante para cerrar modal
        const floatingCloseBtn = document.querySelector('.floating-close-btn');
        if (floatingCloseBtn) {
            floatingCloseBtn.addEventListener('click', () => {
                this.closePreviewModal();
            });
            console.log('✅ Event listener para botón X flotante configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón X flotante');
        }

        // Eventos de navegación del modal
        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => {
                console.log('🔙 BOTÓN ANTERIOR CLICKEADO');
                this.navigatePreview(-1);
            });
            console.log('✅ Event listener para navegación previa configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de página anterior');
        }
        
        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => {
                console.log('🔜 BOTÓN SIGUIENTE CLICKEADO');
                this.navigatePreview(1);
            });
            console.log('✅ Event listener para navegación siguiente configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de página siguiente');
        }

        if (this.downloadPdfBtn) {
            this.downloadPdfBtn.addEventListener('click', () => this.downloadPreviewAsPDF());
            console.log('✅ Event listener para descarga PDF configurado correctamente');
        } else {
            console.error('❌ No se encontró el botón de descarga PDF');
        }

        console.log('🎉 Configuración de event listeners completada');
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
        try {
            // Mostrar modal inmediatamente con indicador de carga
            this.modal.style.display = 'flex';
            document.body.classList.add('modal-open');
            this.showModalLoadingIndicator();

            const formData = this.collectFormData();
            this.saveFormData(formData);

            const validation = this.validateRequiredFields(formData);
            if (!validation.isValid) {
                this.hideModalLoadingIndicator();
                this.showValidationError(validation.missingFields);
                return;
            }

            // Cargar las páginas HTML y generar páginas dinámicas de imágenes
            await this.loadPreviewPagesWithDynamicImages(formData);
            
            // Inyectar datos en TODAS las páginas (estáticas y dinámicas)
            this.previewPages.forEach((pageElement, index) => {
                this.injectFormDataIntoPreview(pageElement, formData);
                if (index < 4) {
                    console.log(`✅ Datos inyectados en página estática ${index + 1}`);
                } else {
                    console.log(`✅ Datos inyectados en página dinámica de imágenes ${index + 1}`);
                }
            });

            // Configurar la vista inicial
            this.currentPageIndex = 0;
            
            // Asegurar que todas las páginas estén ocultas inicialmente
            this.previewPages.forEach(page => {
                if (page) {
                    page.classList.remove('active');
                }
            });
            
            // Mostrar la primera página
            this.showPage(this.currentPageIndex);
            this.updatePageNavigation();
            
            console.log(`✅ Modal iniciado correctamente - mostrando página 1 de ${this.previewPages.length}`);

            this.hideModalLoadingIndicator();
            console.log('✅ Modal de previsualización abierto correctamente');

        } catch (error) {
            console.error('❌ Error al abrir modal de previsualización:', error);
            this.hideModalLoadingIndicator();
            this.showErrorMessage('Error al cargar la previsualización. Por favor, inténtelo nuevamente.');
        }
    }

    closePreviewModal() {
        console.log('Cerrando modal de previsualización...');
        
        // Ocultar modal inmediatamente (sin animación para evitar problemas)
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.style.animation = '';
        }
        
        // Remover la clase modal-open del body
        document.body.classList.remove('modal-open');
        
        // Limpiar cualquier estilo inline que pueda haber sido aplicado al body
        if (document.body.hasAttribute('style')) {
            document.body.removeAttribute('style');
        }
        document.body.style.cssText = '';
        
        // CRÍTICO: Limpiar el contenedor de páginas de previsualización para liberar memoria
        if (this.previewPagesContainer) {
            this.previewPagesContainer.innerHTML = '';
        }
        
        // CRÍTICO: Limpiar el array de páginas
        this.previewPages = [];
        
        // Limpiar indicadores de carga si existen
        this.hideModalLoadingIndicator();
        
        // Forzar el restablecimiento completo de estilos del body
        this.ensureCorrectBodyStyles();
        
        console.log('✅ Modal cerrado completamente y estilos restaurados');
    }

    showModalLoadingIndicator() {
        // Remover indicador existente si lo hay
        this.hideModalLoadingIndicator();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.id = 'modalLoadingIndicator';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p style="margin: 0; font-weight: 600; color: #333;">Cargando previsualización...</p>
        `;
        
        this.previewPagesContainer.appendChild(loadingDiv);
    }

    hideModalLoadingIndicator() {
        const loadingIndicator = document.getElementById('modalLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    showValidationError(missingFields) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'loading-indicator';
        errorDiv.style.background = 'rgba(220, 53, 69, 0.95)';
        errorDiv.style.color = 'white';
        errorDiv.innerHTML = `
            <div style="font-size: 48px;">⚠️</div>
            <h3 style="margin: 10px 0; color: white;">Campos Requeridos Faltantes</h3>
            <p style="margin: 0; color: white; text-align: center;">Por favor complete los siguientes campos:</p>
            <ul style="text-align: left; margin: 15px 0; padding-left: 20px; color: white;">
                ${missingFields.map(field => `<li>${field}</li>`).join('')}
            </ul>
            <button onclick="this.parentElement.remove()" style="
                background: white; 
                color: #dc3545; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 5px; 
                font-weight: 600; 
                cursor: pointer;
                margin-top: 10px;
            ">Entendido</button>
        `;
        
        this.previewPagesContainer.appendChild(errorDiv);
        
        // Auto-cerrar después de 10 segundos
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'loading-indicator';
        errorDiv.style.background = 'rgba(220, 53, 69, 0.95)';
        errorDiv.style.color = 'white';
        errorDiv.innerHTML = `
            <div style="font-size: 48px;">❌</div>
            <h3 style="margin: 10px 0; color: white;">Error</h3>
            <p style="margin: 0; color: white; text-align: center;">${message}</p>
            <button onclick="this.parentElement.remove()" style="
                background: white; 
                color: #dc3545; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 5px; 
                font-weight: 600; 
                cursor: pointer;
                margin-top: 15px;
            ">Cerrar</button>
        `;
        
        this.previewPagesContainer.appendChild(errorDiv);
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
                
                // Crear un parser temporal para extraer contenido Y estilos
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                
                // Extraer los estilos del head
                const headElement = tempDiv.querySelector('head');
                const styleElements = headElement ? headElement.querySelectorAll('style') : [];
                
                // Extraer el contenido del body
                const bodyElement = tempDiv.querySelector('body');
                const bodyContent = bodyElement ? bodyElement.innerHTML : htmlContent;
                
                // Crear el wrapper de la página
                const pageWrapper = document.createElement('div');
                pageWrapper.className = 'preview-page';
                
                // CRÍTICO: Agregar los estilos extraídos al wrapper
                styleElements.forEach(styleEl => {
                    const clonedStyle = document.createElement('style');
                    clonedStyle.textContent = styleEl.textContent;
                    // Agregar un scope específico para esta página para evitar conflictos
                    clonedStyle.setAttribute('data-page-styles', path);
                    pageWrapper.appendChild(clonedStyle);
                });
                
                // Crear un contenedor interno que preserve el diseño original
                const contentContainer = document.createElement('div');
                contentContainer.className = 'page-content-container';
                contentContainer.innerHTML = bodyContent;
                
                pageWrapper.appendChild(contentContainer);
                
                // ELIMINAR COMPLETAMENTE LOS RESETS PROBLEMÁTICOS
                // Ya no aplicamos ningún reset que pueda romper el layout
                
                this.previewPagesContainer.appendChild(pageWrapper);
                this.previewPages.push(pageWrapper);

                console.log(`✅ Página cargada con estilos preservados: ${path}`);

            } catch (error) {
                console.error(`Error al cargar la página de previsualización ${path}:`, error);
                // Opcional: mostrar un mensaje de error al usuario
            }
        }
    }

    async loadPreviewPagesWithDynamicImages(formData) {
        console.log('🔄 Cargando páginas con imágenes dinámicas...');
        
        // Limpiar contenedor y array de páginas
        this.previewPagesContainer.innerHTML = '';
        this.previewPages = [];

        // Primero cargar las páginas estáticas (todas excepto la de imágenes)
        const staticPagePaths = this.pagePaths.filter(path => 
            !path.includes('boroscope_report_page5_images_preview.html')
        );

        for (const path of staticPagePaths) {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const htmlContent = await response.text();
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                
                const headElement = tempDiv.querySelector('head');
                const styleElements = headElement ? headElement.querySelectorAll('style') : [];
                
                const bodyElement = tempDiv.querySelector('body');
                const bodyContent = bodyElement ? bodyElement.innerHTML : htmlContent;
                
                const pageWrapper = document.createElement('div');
                pageWrapper.className = 'preview-page';
                
                styleElements.forEach(styleEl => {
                    const clonedStyle = document.createElement('style');
                    clonedStyle.textContent = styleEl.textContent;
                    clonedStyle.setAttribute('data-page-styles', path);
                    pageWrapper.appendChild(clonedStyle);
                });
                
                const contentContainer = document.createElement('div');
                contentContainer.className = 'page-content-container';
                contentContainer.innerHTML = bodyContent;
                
                pageWrapper.appendChild(contentContainer);
                
                this.previewPagesContainer.appendChild(pageWrapper);
                this.previewPages.push(pageWrapper);

                console.log(`✅ Página estática cargada: ${path}`);

            } catch (error) {
                console.error(`Error al cargar la página ${path}:`, error);
            }
        }

        // Ahora generar páginas dinámicas de imágenes
        await this.generateDynamicImagePages(formData);
    }

         async generateDynamicImagePages(formData) {
         console.log('🖼️ Generando páginas dinámicas de imágenes...');
         console.log('📋 FormData completo:', formData);
         
         const imageData = formData.image_files_data || [];
         console.log('🔍 Datos de imágenes extraídos:', imageData);
         console.log('📊 Cantidad de imágenes:', imageData.length);
         
         const imagesPerPage = 2;
        
        if (imageData.length === 0) {
            console.log('📄 No hay imágenes, generando página vacía');
            // Generar una página vacía con mensaje "no hay imágenes"
            await this.createEmptyImagePage();
            return;
        }

        console.log(`📊 Total de imágenes: ${imageData.length}`);
        const totalImagePages = Math.ceil(imageData.length / imagesPerPage);
        console.log(`📚 Páginas de imágenes a generar: ${totalImagePages}`);

        // Cargar la plantilla base una vez
        const templatePath = '../forms/boroscope_report_page5_images_preview.html';
        let templateHTML = '';
        
        try {
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            templateHTML = await response.text();
        } catch (error) {
            console.error('❌ Error al cargar plantilla de imágenes:', error);
            return;
        }

        // Generar cada página de imágenes
        for (let pageIndex = 0; pageIndex < totalImagePages; pageIndex++) {
            const currentPageNumber = 5 + pageIndex; // Página 5, 6, 7, etc.
            const totalPages = 4 + totalImagePages; // 4 páginas estáticas + páginas de imágenes
            
            console.log(`🔄 Generando página ${currentPageNumber} de ${totalPages}...`);
            
            // Crear página usando la plantilla
            const imagePage = await this.createImagePageFromTemplate(
                templateHTML, 
                imageData, 
                pageIndex, 
                imagesPerPage, 
                currentPageNumber, 
                totalPages
            );
            
            if (imagePage) {
                this.previewPagesContainer.appendChild(imagePage);
                this.previewPages.push(imagePage);
                console.log(`✅ Página de imágenes ${currentPageNumber} generada`);
            }
        }
        
        console.log(`🎉 ${totalImagePages} páginas de imágenes generadas exitosamente`);
    }

    async createEmptyImagePage() {
        console.log('📄 Creando página vacía de imágenes...');
        
        const templatePath = '../forms/boroscope_report_page5_images_preview.html';
        
        try {
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const templateHTML = await response.text();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateHTML;
            
            // Extraer estilos y contenido
            const headElement = tempDiv.querySelector('head');
            const styleElements = headElement ? headElement.querySelectorAll('style') : [];
            const bodyElement = tempDiv.querySelector('body');
            const bodyContent = bodyElement ? bodyElement.innerHTML : templateHTML;
            
            // Crear página
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'preview-page';
            
                         // Agregar estilos
             styleElements.forEach(styleEl => {
                 const clonedStyle = document.createElement('style');
                 clonedStyle.textContent = styleEl.textContent;
                 clonedStyle.setAttribute('data-page-styles', 'dynamic-images');
                 pageWrapper.appendChild(clonedStyle);
             });
             
             // Agregar estilos personalizados para imágenes más grandes
             const customStyle = document.createElement('style');
             customStyle.textContent = `
                 /* Optimización para página A4 (21cm x 29.7cm) */
                 .page-container {
                     height: 29.7cm !important;
                     width: 21cm !important;
                     padding: 1.5cm !important;
                     box-sizing: border-box !important;
                     overflow: hidden !important;
                 }
                 
                 .image-thumbnail {
                     width: 100% !important;
                     height: 100% !important;
                     border: none !important;
                     object-fit: contain !important;
                     border-radius: 0 !important;
                     background-color: transparent !important;
                     box-shadow: none !important;
                     display: block !important;
                 }
                 
                 .image-container {
                     width: 9cm !important;
                     height: 6.5cm !important;
                     margin-right: 1cm !important;
                     display: flex !important;
                     align-items: center !important;
                     justify-content: center !important;
                     background-color: transparent !important;
                     border: none !important;
                     box-shadow: none !important;
                 }
                 
                 .image-item {
                     display: flex !important;
                     align-items: flex-start !important;
                     margin-bottom: 0.5cm !important;
                     padding: 0.8cm !important;
                     border: none !important;
                     border-radius: 0 !important;
                     background-color: transparent !important;
                     box-shadow: none !important;
                     height: 7.5cm !important;
                     overflow: visible !important;
                 }
                 
                 .image-description {
                     flex-grow: 1 !important;
                     font-size: 10pt !important;
                     line-height: 1.4 !important;
                     word-break: break-word !important;
                     padding-top: 0.5cm !important;
                     width: calc(100% - 10cm) !important;
                     overflow: hidden !important;
                     background-color: transparent !important;
                     border: none !important;
                 }
                 
                 .image-description strong {
                     display: block !important;
                     margin-bottom: 0.5cm !important;
                     color: #333 !important;
                     font-size: 11pt !important;
                     border-bottom: 1px solid #ccc !important;
                     padding-bottom: 0.2cm !important;
                 }
                 
                 .support-images-title {
                     font-size: 12pt !important;
                     font-weight: bold !important;
                     margin-bottom: 1cm !important;
                     text-align: center !important;
                     color: #333 !important;
                 }
                 
                 .support-images-section {
                     height: calc(29.7cm - 1.5cm - 1.5cm - 8cm) !important;
                     overflow: hidden !important;
                 }
                 
                 .images-content {
                     height: calc(100% - 2cm) !important;
                     display: flex !important;
                     flex-direction: column !important;
                     justify-content: flex-start !important;
                     overflow: hidden !important;
                 }
                 
                 /* Ajustes para tablas más compactas */
                 .info-table {
                     margin-bottom: 0.8cm !important;
                     font-size: 8pt !important;
                 }
                 
                 .info-table th,
                 .info-table td {
                     padding: 4px !important;
                 }
                 
                 .header-section {
                     margin-bottom: 0.8cm !important;
                 }
                 
                 .footer-section {
                     bottom: 0.5cm !important;
                     font-size: 7pt !important;
                 }
             `;
             customStyle.setAttribute('data-custom-image-styles', 'dynamic-images-empty');
             pageWrapper.appendChild(customStyle);
            
            // Agregar contenido
            const contentContainer = document.createElement('div');
            contentContainer.className = 'page-content-container';
            contentContainer.innerHTML = bodyContent;
            
            // Modificar el footer para mostrar página correcta
            const footerSection = contentContainer.querySelector('.footer-section .footer-left p:last-child');
            if (footerSection) {
                footerSection.textContent = 'Page 5 of 5';
            }
            
            pageWrapper.appendChild(contentContainer);
            
            this.previewPagesContainer.appendChild(pageWrapper);
            this.previewPages.push(pageWrapper);
            
            console.log('✅ Página vacía de imágenes creada');
            
        } catch (error) {
            console.error('❌ Error al crear página vacía de imágenes:', error);
        }
    }

    async createImagePageFromTemplate(templateHTML, imageData, pageIndex, imagesPerPage, currentPageNumber, totalPages) {
        console.log(`🔧 Creando página ${currentPageNumber} con plantilla...`);
        
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = templateHTML;
            
            // Extraer estilos y contenido
            const headElement = tempDiv.querySelector('head');
            const styleElements = headElement ? headElement.querySelectorAll('style') : [];
            const bodyElement = tempDiv.querySelector('body');
            const bodyContent = bodyElement ? bodyElement.innerHTML : templateHTML;
            
            // Crear página
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'preview-page';
            
                         // Agregar estilos
             styleElements.forEach(styleEl => {
                 const clonedStyle = document.createElement('style');
                 clonedStyle.textContent = styleEl.textContent;
                 clonedStyle.setAttribute('data-page-styles', `dynamic-images-${pageIndex}`);
                 pageWrapper.appendChild(clonedStyle);
             });
             
             // Agregar estilos personalizados para imágenes más grandes
             const customStyle = document.createElement('style');
             customStyle.textContent = `
                 /* Optimización para página A4 (21cm x 29.7cm) */
                 .page-container {
                     height: 29.7cm !important;
                     width: 21cm !important;
                     padding: 1.5cm !important;
                     box-sizing: border-box !important;
                     overflow: hidden !important;
                 }
                 
                 .image-thumbnail {
                     width: 100% !important;
                     height: 100% !important;
                     border: none !important;
                     object-fit: contain !important;
                     border-radius: 0 !important;
                     background-color: transparent !important;
                     box-shadow: none !important;
                     display: block !important;
                 }
                 
                 .image-container {
                     width: 9cm !important;
                     height: 6.5cm !important;
                     margin-right: 1cm !important;
                     display: flex !important;
                     align-items: center !important;
                     justify-content: center !important;
                     background-color: transparent !important;
                     border: none !important;
                     box-shadow: none !important;
                 }
                 
                 .image-item {
                     display: flex !important;
                     align-items: flex-start !important;
                     margin-bottom: 0.5cm !important;
                     padding: 0.8cm !important;
                     border: none !important;
                     border-radius: 0 !important;
                     background-color: transparent !important;
                     box-shadow: none !important;
                     height: 7.5cm !important;
                     overflow: visible !important;
                 }
                 
                 .image-description {
                     flex-grow: 1 !important;
                     font-size: 10pt !important;
                     line-height: 1.4 !important;
                     word-break: break-word !important;
                     padding-top: 0.5cm !important;
                     width: calc(100% - 10cm) !important;
                     overflow: hidden !important;
                     background-color: transparent !important;
                     border: none !important;
                 }
                 
                 .image-description strong {
                     display: block !important;
                     margin-bottom: 0.5cm !important;
                     color: #333 !important;
                     font-size: 11pt !important;
                     border-bottom: 1px solid #ccc !important;
                     padding-bottom: 0.2cm !important;
                 }
                 
                 .support-images-title {
                     font-size: 12pt !important;
                     font-weight: bold !important;
                     margin-bottom: 1cm !important;
                     text-align: center !important;
                     color: #333 !important;
                 }
                 
                 .support-images-section {
                     height: calc(29.7cm - 1.5cm - 1.5cm - 8cm) !important;
                     overflow: hidden !important;
                 }
                 
                 .images-content {
                     height: calc(100% - 2cm) !important;
                     display: flex !important;
                     flex-direction: column !important;
                     justify-content: flex-start !important;
                     overflow: hidden !important;
                 }
                 
                 /* Ajustes para tablas más compactas */
                 .info-table {
                     margin-bottom: 0.8cm !important;
                     font-size: 8pt !important;
                 }
                 
                 .info-table th,
                 .info-table td {
                     padding: 4px !important;
                 }
                 
                 .header-section {
                     margin-bottom: 0.8cm !important;
                 }
                 
                 .footer-section {
                     bottom: 0.5cm !important;
                     font-size: 7pt !important;
                 }
             `;
             customStyle.setAttribute('data-custom-image-styles', `dynamic-images-${pageIndex}`);
             pageWrapper.appendChild(customStyle);
            
            // Agregar contenido
            const contentContainer = document.createElement('div');
            contentContainer.className = 'page-content-container';
            contentContainer.innerHTML = bodyContent;
            
            // Modificar el footer para mostrar página y total correctos
            const footerSection = contentContainer.querySelector('.footer-section .footer-left p:last-child');
            if (footerSection) {
                footerSection.textContent = `Page ${currentPageNumber} of ${totalPages}`;
            }
            
            // Ocultar mensaje "no hay imágenes" y remover el script
            const noImagesPage = contentContainer.querySelector('#no-images-page');
            if (noImagesPage) {
                noImagesPage.style.display = 'none';
            }
            
            const scriptTags = contentContainer.querySelectorAll('script');
            scriptTags.forEach(script => script.remove());
            
                         // Generar contenido de imágenes para esta página
             const pagesContainer = contentContainer.querySelector('#pages-container');
             if (pagesContainer) {
                 pagesContainer.innerHTML = '';
                 
                 // Crear página de imágenes con 2 imágenes máximo
                 const imagePageDiv = this.createImagePageDiv(imageData, pageIndex, imagesPerPage, currentPageNumber, totalPages);
                 pagesContainer.appendChild(imagePageDiv);
             }
            
            pageWrapper.appendChild(contentContainer);
            
            console.log(`✅ Página ${currentPageNumber} creada exitosamente`);
            return pageWrapper;
            
        } catch (error) {
            console.error(`❌ Error al crear página ${currentPageNumber}:`, error);
            return null;
        }
    }

         createImagePageDiv(imageData, pageIndex, imagesPerPage, currentPageNumber, totalPages) {
         console.log(`🖼️ Creando contenido para página ${currentPageNumber}...`);
         console.log(`📋 ImageData completo:`, imageData);
         
         const startIndex = pageIndex * imagesPerPage;
         const endIndex = Math.min(startIndex + imagesPerPage, imageData.length);
         const imagesInThisPage = imageData.slice(startIndex, endIndex);
         
         console.log(`📊 Imágenes en esta página: ${imagesInThisPage.length} (índices ${startIndex} a ${endIndex - 1})`);
         console.log(`🔍 Imágenes específicas para esta página:`, imagesInThisPage);
         
         const pageDiv = document.createElement('div');
         pageDiv.className = 'page-container';
        
        pageDiv.innerHTML = `
            <!-- Header Section -->
            <div class="header-section">
                <div style="width: 80px;"></div>
                <div class="header-title">
                    <p>QUALITY CONTROL DEPARTMENT</p>
                    <p>BOROSCOPE INSPECTION REPORT</p>
                </div>
                <img src="../img/Viva_Logo.svg.png" alt="Vivaaerobus Logo" class="header-logo">
            </div>

            <!-- General Information Table -->
            <table class="info-table">
                <thead>
                    <tr>
                        <th>Work Order Number</th>
                        <th>A/C Registration</th>
                        <th>Engine S/N</th>
                        <th>Inspected By</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="placeholder" id="preview-work_order_number-${currentPageNumber}">[Work Order Number]</span></td>
                        <td><span class="placeholder" id="preview-aircraft_registration-${currentPageNumber}">[Aircraft Registration]</span></td>
                        <td><span class="placeholder" id="preview-engine_sn-${currentPageNumber}">[Engine S/N]</span></td>
                        <td><span class="placeholder" id="preview-inspected_by-${currentPageNumber}">[Inspected By]</span></td>
                    </tr>
                    <tr>
                        <th>Internal ID</th>
                        <th>A/C Model</th>
                        <th>Station</th>
                        <th>Inspection Date</th>
                    </tr>
                    <tr>
                        <td><span class="placeholder" id="preview-nombre_registrado-${currentPageNumber}">[Internal ID]</span></td>
                        <td><span class="placeholder" id="preview-aircraft_model-${currentPageNumber}">[Aircraft Model]</span></td>
                        <td><span class="placeholder" id="preview-station-${currentPageNumber}">[Station]</span></td>
                        <td><span class="placeholder" id="preview-date_of_bsi-${currentPageNumber}">[Date of BSI]</span></td>
                    </tr>
                </tbody>
            </table>

            <!-- References Used -->
            <table class="info-table" style="margin-bottom: 1cm;">
                <thead>
                    <tr>
                        <th style="width: 25%;">References Used</th>
                        <td colspan="3"><span class="placeholder" id="preview-references_used-${currentPageNumber}">[References Used]</span></td>
                    </tr>
                </thead>
            </table>

                         <!-- SUPPORT IMAGES Section -->
             <div class="support-images-section">
                 <p class="support-images-title">SUPPORT IMAGES</p>
                 <div class="images-content">
                     ${this.generateImagesHTML(imagesInThisPage, startIndex)}
                 </div>
             </div>

            <!-- Footer Section -->
            <div class="footer-section">
                <div class="footer-left">
                    <p>F-QC-018 REV 3 (05-OCT-2021)</p>
                    <p>Page ${currentPageNumber} of ${totalPages}</p>
                </div>
                <div class="footer-right">
                    <p>Aeroenlaces Nacionales S.A de C.V</p>
                    <p>DGAC 348</p>
                </div>
            </div>
        `;
        
                 console.log(`✅ Contenido de página ${currentPageNumber} generado`);
         return pageDiv;
     }

     generateImagesHTML(imagesInThisPage, startIndex) {
         console.log(`🔧 Generando HTML para ${imagesInThisPage.length} imágenes...`);
         
         if (!imagesInThisPage || imagesInThisPage.length === 0) {
             console.log(`⚠️ No hay imágenes para esta página`);
             return '<div class="no-images-message">No hay imágenes en esta página.</div>';
         }

         let html = '';
         
         imagesInThisPage.forEach((imgData, index) => {
             const globalIndex = startIndex + index;
             
             console.log(`🖼️ Procesando imagen ${globalIndex + 1}:`, {
                 name: imgData.name,
                 description: imgData.description,
                 hasSrc: !!imgData.src,
                 srcLength: imgData.src ? imgData.src.length : 0
             });
             
             // SIEMPRE mostrar pero completamente transparente
             const imageHTML = `
                 <div class="image-item" style="background: transparent !important; border: none !important; padding: 0.8cm !important;">
                     <div class="image-container" style="background: transparent !important; border: none !important;">
                         ${imgData.src && imgData.src.startsWith('data:image/') ? 
                           `<img src="${imgData.src}" 
                                 alt="Imagen ${globalIndex + 1}" 
                                 class="image-thumbnail"
                                 style="background: transparent !important; border: none !important;"
                                 onerror="console.error('Error cargando imagen ${globalIndex + 1}');">` :
                           '' // Contenedor vacío pero invisible
                         }
                     </div>
                     <div class="image-description" style="background: transparent !important;">
                         <strong>Imagen ${globalIndex + 1}:</strong>
                         ${imgData.description || imgData.name || `Imagen ${globalIndex + 1}`}
                     </div>
                 </div>
             `;
             
             html += imageHTML;
         });
         
         console.log(`✅ HTML generado para ${imagesInThisPage.length} imágenes`);
         return html;
     }



    showPage(index) {
        console.log(`🔄 FORZANDO navegación a página ${index + 1}...`);
        
        // BRUTAL: Ocultar TODAS las páginas usando estilos directos
        this.previewPages.forEach((page, i) => {
            if (page) {
                page.style.display = 'none';
                page.style.visibility = 'hidden';
                page.classList.remove('active');
                console.log(`🚫 PÁGINA ${i + 1} BRUTALMENTE OCULTADA`);
            }
        });
        
        // BRUTAL: Mostrar SOLO la página seleccionada
        if (this.previewPages[index]) {
            this.previewPages[index].style.display = 'block';
            this.previewPages[index].style.visibility = 'visible';
            this.previewPages[index].classList.add('active');
            
            // SOLO dimensiones del modal - SIN TOCAR el contenido interno
            this.previewPages[index].style.width = '90vw';
            this.previewPages[index].style.height = '80vh';
            this.previewPages[index].style.overflow = 'auto';
            
            console.log(`🎯 PÁGINA ${index + 1} BRUTALMENTE MOSTRADA`);
            
            // Resetear scroll inmediatamente
            this.previewPagesContainer.scrollTop = 0;
            this.previewPages[index].scrollTop = 0;
            
        } else {
            console.error(`❌ No se encontró la página ${index + 1}`);
        }
    }

    navigatePreview(direction) {
        const oldIndex = this.currentPageIndex;
        this.currentPageIndex += direction;

        if (this.currentPageIndex < 0) {
            this.currentPageIndex = 0;
        } else if (this.currentPageIndex >= this.previewPages.length) {
            this.currentPageIndex = this.previewPages.length - 1;
        }

        console.log(`🚀 NAVEGACIÓN: ${oldIndex} -> ${this.currentPageIndex} (dirección: ${direction})`);
        console.log(`📚 Total páginas disponibles: ${this.previewPages.length}`);

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
            'aircraft_model': '#preview-aircraft_model',
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
            'lpc_stage1_status': '#preview-lpc_stage1_status',
            'lpc_stage2_remarks': '#preview-lpc_stage2_remarks',
            'lpc_stage2_status': '#preview-lpc_stage2_status',
            'lpc_stage3_remarks': '#preview-lpc_stage3_remarks',
            'lpc_stage3_status': '#preview-lpc_stage3_status',
            'bearing3_front_remarks': '#preview-bearing3_front_remarks',
            'bearing3_front_status': '#preview-bearing3_front_status',
            'bearing3_rear_remarks': '#preview-bearing3_rear_remarks',
            'bearing3_rear_status': '#preview-bearing3_rear_status',
            'hpc_stage1_remarks': '#preview-hpc_stage1_remarks',
            'hpc_stage1_status': '#preview-hpc_stage1_status',
            'hpc_stage2_remarks': '#preview-hpc_stage2_remarks',
            'hpc_stage2_status': '#preview-hpc_stage2_status',
            'hpc_stage3_remarks': '#preview-hpc_stage3_remarks',
            'hpc_stage3_status': '#preview-hpc_stage3_status',
            'hpc_stage4_remarks': '#preview-hpc_stage4_remarks',
            'hpc_stage4_status': '#preview-hpc_stage4_status',
            'hpc_stage5_remarks': '#preview-hpc_stage5_remarks',
            'hpc_stage5_status': '#preview-hpc_stage5_status',
            'hpc_stage6_remarks': '#preview-hpc_stage6_remarks',
            'hpc_stage6_status': '#preview-hpc_stage6_status',
            'hpc_stage7_remarks': '#preview-hpc_stage7_remarks',
            'hpc_stage7_status': '#preview-hpc_stage7_status',
            'hpc_stage8_remarks': '#preview-hpc_stage8_remarks',
            'hpc_stage8_status': '#preview-hpc_stage8_status',
            'igniter_remarks': '#preview-igniter_remarks',
            'igniter_status': '#preview-igniter_status',
            'fuelnozzle_remarks': '#preview-fuelnozzle_remarks',
            'fuelnozzle_status': '#preview-fuelnozzle_status',
            'cch_inner_remarks': '#preview-cch_inner_remarks',
            'cch_inner_status': '#preview-cch_inner_status',
            'cch_outer_remarks': '#preview-cch_outer_remarks',
            'cch_outer_status': '#preview-cch_outer_status',
            'shiplap_remarks': '#preview-shiplap_remarks',
            'shiplap_status': '#preview-shiplap_status',
            'hpt_vane_remarks': '#preview-hpt_vane_remarks',
            'hpt_vane_status': '#preview-hpt_vane_status',
            'hpt_s1_remarks': '#preview-hpt_s1_remarks',
            'hpt_s1_status': '#preview-hpt_s1_status',
            'hpt_s2_remarks': '#preview-hpt_s2_remarks',
            'hpt_s2_status': '#preview-hpt_s2_status',
            'lpt_s1_remarks': '#preview-lpt_s1_remarks',
            'lpt_s1_status': '#preview-lpt_s1_status',
            'lpt_s2_remarks': '#preview-lpt_s2_remarks',
            'lpt_s2_status': '#preview-lpt_s2_status',
            'lpt_s3_remarks': '#preview-lpt_s3_remarks',
            'lpt_s3_status': '#preview-lpt_s3_status',
            'new_interval_inspections': '#preview-new_interval_inspections',
            'user_email': '#preview-user_email',
            'inspection_time': '#preview-inspection_time',
            'interval_next_fc': '#preview-interval_next_fc',
            'interval_next_fh': '#preview-interval_next_fh',
            'boroscope_type': '#preview-boroscope_type',
            'station': '#preview-station'
        };

        console.log('🔍 Inyectando datos en página de previsualización...');
        console.log('📋 Datos del formulario:', formData);
        
        let foundElements = 0;
        let missingElements = [];

        for (const key in formData) {
            if (mappings[key]) {
                const targetElement = pageElement.querySelector(mappings[key]);
                if (targetElement) {
                    targetElement.textContent = formData[key];
                    foundElements++;
                    console.log(`✅ ${key} -> ${mappings[key]}: "${formData[key]}"`);
                } else {
                    // Buscar con sufijo de página para páginas dinámicas
                    const targetElementWithSuffix = pageElement.querySelector(mappings[key] + '-5') || 
                                                   pageElement.querySelector(mappings[key] + '-6') ||
                                                   pageElement.querySelector(mappings[key] + '-7') ||
                                                   pageElement.querySelector(mappings[key] + '-8') ||
                                                   pageElement.querySelector(mappings[key] + '-9') ||
                                                   pageElement.querySelector(mappings[key] + '-10');
                    
                    if (targetElementWithSuffix) {
                        targetElementWithSuffix.textContent = formData[key];
                        foundElements++;
                        console.log(`✅ ${key} -> ${mappings[key]} (con sufijo): "${formData[key]}"`);
                    } else {
                        // Estrategia alternativa: buscar por texto placeholder
                        const alternativeTarget = this.findElementByPlaceholderText(pageElement, key, formData[key]);
                        if (alternativeTarget) {
                            alternativeTarget.textContent = formData[key];
                            foundElements++;
                            console.log(`✅ ${key} -> [por texto placeholder]: "${formData[key]}"`);
                        } else {
                            missingElements.push(`${key} -> ${mappings[key]}`);
                        }
                    }
                }
            }
        }
        
        console.log(`✅ Elementos encontrados y actualizados: ${foundElements}`);
        if (missingElements.length > 0) {
            console.warn(`⚠️ Elementos no encontrados en esta página (${missingElements.length}):`, missingElements);
        }

        // Manejo especial para imágenes: inyectar descripciones y src
        if (formData.image_files_data && Array.isArray(formData.image_files_data) && formData.image_files_data.length > 0) {
            console.log(`🖼️ Procesando ${formData.image_files_data.length} imágenes...`);
            
            // Ocultar el mensaje "no hay imágenes"
            const noImagesMessage = pageElement.querySelector('#no-images-message');
            if (noImagesMessage) {
                noImagesMessage.style.display = 'none';
            }
            
            // Primero ocultar todas las imágenes placeholder
            for (let i = 0; i < 10; i++) { // Máximo 10 imágenes
                const imgElement = pageElement.querySelector(`#preview-image-${i}`);
                const imageItem = imgElement ? imgElement.closest('.image-item') : null;
                
                if (imageItem) {
                    imageItem.style.display = 'none'; // Ocultar toda la fila de imagen
                }
            }
            
            formData.image_files_data.forEach((imgData, index) => {
                const descElement = pageElement.querySelector(`#preview-image-description-${index}`);
                if (descElement) {
                    descElement.textContent = imgData.description || `Imagen ${index + 1}`;
                    console.log(`✅ Descripción ${index}: ${imgData.description}`);
                }
                const imgElement = pageElement.querySelector(`#preview-image-${index}`);
                if (imgElement && imgData.src) {
                    imgElement.src = imgData.src;
                    imgElement.style.display = 'block';
                    const imageItem = imgElement.closest('.image-item');
                    if (imageItem) {
                        imageItem.style.display = 'flex'; // Mostrar la fila de imagen
                    }
                    console.log(`✅ Imagen ${index} cargada: ${imgData.name}`);
                } else {
                    console.warn(`⚠️ No se pudo cargar imagen ${index}: elemento no encontrado o sin src`);
                }
            });
        } else {
            console.log('🖼️ No hay imágenes para procesar');
            // Mostrar el mensaje "no hay imágenes"
            const noImagesMessage = pageElement.querySelector('#no-images-message');
            if (noImagesMessage) {
                noImagesMessage.style.display = 'block';
            }
            // Ocultar todas las imágenes placeholder
            for (let i = 0; i < 10; i++) {
                const imgElement = pageElement.querySelector(`#preview-image-${i}`);
                const imageItem = imgElement ? imgElement.closest('.image-item') : null;
                if (imageItem) {
                    imageItem.style.display = 'none';
                }
            }
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

        console.log('🔘 Procesando radio buttons...');
        radioGroups.forEach(groupName => {
            if (formData[groupName]) {
                const value = formData[groupName];
                const normalizedValue = value.replace(/ /g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                const targetId = `#preview-${groupName}-${normalizedValue}`;
                const targetElement = pageElement.querySelector(targetId);
                if (targetElement) {
                    targetElement.textContent = '✔️';
                    console.log(`✅ Radio button: ${groupName} = ${value} -> ${targetId}`);
                } else {
                    console.warn(`⚠️ Radio button element no encontrado: ${targetId} para ${groupName} = ${value}`);
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
        console.log(`📊 Recopilando datos de ${this.imageFiles.length} imágenes...`);
        data.image_files_data = [];
        this.imageFiles.forEach((file, index) => {
            const descriptionField = document.getElementById(`image_description_${index}`);
            const description = descriptionField ? descriptionField.value.trim() : '';
            
            // Asegurarse de que el src de la imagen esté disponible (asumimos que ya se cargó en showImagePreview)
            const imgElement = document.querySelector(`#image-preview .image-preview-item[data-index="${index}"] img`);
            const imgSrc = imgElement ? imgElement.src : '';

            if (imgSrc && imgSrc.startsWith('data:image/')) {
                console.log(`✅ Imagen ${index}: ${file.name} - Descripción: "${description}" - Src Data URL disponible`);
            } else {
                console.warn(`⚠️ Imagen ${index}: ${file.name} - No se pudo obtener el src del elemento img o no es un Data URL válido`);
                console.warn(`   Selector usado: #image-preview .image-preview-item[data-index="${index}"] img`);
                console.warn(`   Elemento encontrado:`, imgElement);
                console.warn(`   Src obtenido:`, imgSrc ? imgSrc.substring(0, 50) + '...' : 'null');
            }

            data.image_files_data.push({
                name: file.name,
                description: description || `Imagen ${index + 1}`,
                src: imgSrc // Guardar el Data URL de la imagen para la previsualización
            });
        });
        
        console.log(`📊 Total de datos de imágenes preparados: ${data.image_files_data.length}`);

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
        notification.innerHTML = '🗑️ Formulario eliminado';
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

    // Función auxiliar para buscar elementos por texto placeholder cuando no hay ID
    findElementByPlaceholderText(pageElement, key, value) {
        const placeholderMappings = {
            'work_order_number': '[Work Order Number]',
            'aircraft_registration': '[Aircraft Registration]',
            'aircraft_model': '[Aircraft Model]',
            'engine_sn': '[Engine S/N]',
            'inspected_by': '[Inspected By]',
            'nombre_registrado': '[Internal ID]',
            'date_of_bsi': '[Date of BSI]',
            'references_used': '[References Used]',
            'inspector_stamp': '[Inspector Stamp]',
            'final_disposition': '[FINAL DISPOSITION]',
            'engine_status_bsi': '[Engine Status BSI]',
            'shiplap_dimensions': '[SHIP LAP DIMENSIONS]'
        };

        if (placeholderMappings[key]) {
            const elements = pageElement.querySelectorAll('.placeholder');
            for (const element of elements) {
                if (element.textContent.trim() === placeholderMappings[key]) {
                    return element;
                }
            }
        }
        return null;
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

    async downloadPreviewAsPDF() {
        try {
            console.log('🔄 Iniciando generación de PDF...');
            console.log('🔍 Verificando librerías disponibles...');
            console.log('window.jspdf:', typeof window.jspdf);
            console.log('window.jsPDF:', typeof window.jsPDF);
            console.log('window.html2canvas:', typeof window.html2canvas);
            
            // Deshabilitar el botón y mostrar progreso
            if (this.downloadPdfBtn) {
                this.downloadPdfBtn.disabled = true;
                this.downloadPdfBtn.innerHTML = '⏳ Generando PDF...';
            }

            // Verificar que tenemos páginas cargadas
            if (!this.previewPages || this.previewPages.length === 0) {
                throw new Error('No hay páginas de preview cargadas');
            }

            // Verificar que html2canvas esté disponible
            if (typeof window.html2canvas === 'undefined') {
                throw new Error('La librería html2canvas no está cargada');
            }

            // Verificar que jsPDF esté disponible
            let jsPDFClass = null;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFClass = window.jspdf.jsPDF;
                console.log('✅ jsPDF encontrado en window.jspdf.jsPDF');
            } else if (window.jsPDF) {
                jsPDFClass = window.jsPDF;
                console.log('✅ jsPDF encontrado en window.jsPDF');
            } else {
                console.error('❌ jsPDF no encontrado en ninguna ubicación');
                throw new Error('La librería jsPDF no está cargada correctamente');
            }

            // Crear un nuevo documento PDF con las dimensiones exactas de A4
            const pdf = new jsPDFClass({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            console.log(`📄 Procesando ${this.previewPages.length} páginas...`);

            // OCULTAR TODAS LAS PÁGINAS ANTES DE EMPEZAR
            console.log('🔄 Ocultando todas las páginas para evitar duplicación...');
            this.previewPages.forEach(page => {
                page.style.display = 'none';
                page.style.visibility = 'hidden';
            });

            // Procesar cada página
            for (let i = 0; i < this.previewPages.length; i++) {
                const pageElement = this.previewPages[i];
                
                // Actualizar progreso
                if (this.downloadPdfBtn) {
                    this.downloadPdfBtn.innerHTML = `⏳ Página ${i + 1} de ${this.previewPages.length}...`;
                }

                console.log(`🔄 Procesando página ${i + 1}...`);

                // Encontrar el contenedor de la página (.page-content-container o .page-container)
                const contentContainer = pageElement.querySelector('.page-content-container') || 
                                       pageElement.querySelector('.page-container') || 
                                       pageElement;

                // MOSTRAR SOLO LA PÁGINA ACTUAL (las demás permanecen ocultas)
                pageElement.style.display = 'block';
                pageElement.style.visibility = 'visible';
                pageElement.style.position = 'relative';
                pageElement.style.transform = 'none';

                // Detectar si es página estática (primeras 4) o dinámica (imágenes)
                const isStaticPage = i < 4;
                const isDynamicPage = i >= 4;

                console.log(`📸 Capturando página ${i + 1} (${isStaticPage ? 'ESTÁTICA' : 'DINÁMICA'}):`, {
                    contentContainer: !!contentContainer,
                    scrollWidth: contentContainer.scrollWidth,
                    scrollHeight: contentContainer.scrollHeight,
                    clientWidth: contentContainer.clientWidth,
                    clientHeight: contentContainer.clientHeight
                });

                try {
                    // SOLUCIÓN UNIFORME: Aplicar la misma configuración de centrado para TODAS las páginas
                    console.log(`🎯 Aplicando configuración de centrado uniforme para página ${i + 1}`);
                    
                    // PREPARACIÓN AGRESIVA del contenedor ANTES de capturar
                    const originalContainerStyles = {
                        position: contentContainer.style.position,
                        left: contentContainer.style.left,
                        right: contentContainer.style.right,
                        top: contentContainer.style.top,
                        transform: contentContainer.style.transform,
                        margin: contentContainer.style.margin,
                        width: contentContainer.style.width,
                        maxWidth: contentContainer.style.maxWidth
                    };

                    // FORZAR CENTRADO ANTES DE CAPTURA
                    contentContainer.style.position = 'relative';
                    contentContainer.style.left = '0';
                    contentContainer.style.right = '0';
                    contentContainer.style.top = '0';
                    contentContainer.style.transform = 'none';
                    contentContainer.style.margin = '0 auto';
                    contentContainer.style.width = '21cm';
                    contentContainer.style.maxWidth = '21cm';

                    // Esperar un momento para que se apliquen los estilos
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const canvas = await html2canvas(contentContainer, {
                        scale: 2.5,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        x: 0, // SIEMPRE empezar en x=0
                        y: 0, // SIEMPRE empezar en y=0
                        width: 794, // Ancho fijo A4 en pixels (21cm * 37.8)
                        height: 1123, // Alto fijo A4 en pixels (29.7cm * 37.8)
                        windowWidth: 1200, // Ventana más grande para mejor renderizado
                        windowHeight: 1600,
                        scrollX: 0,
                        scrollY: 0,
                        onclone: (clonedDoc) => {
                            console.log(`🔄 Aplicando configuración de centrado en clon para página ${i + 1}...`);
                            
                            // Encontrar el elemento a clonar
                            const clonedElement = clonedDoc.querySelector('.page-content-container') || 
                                               clonedDoc.querySelector('.page-container') ||
                                               clonedDoc.body.children[0];
                                               
                            if (clonedElement) {
                                // RESETEO COMPLETO del elemento clonado
                                clonedElement.style.cssText = '';
                                
                                // APLICAR ESTILOS DE CENTRADO Y DIMENSIONES EXACTAS
                                clonedElement.style.backgroundColor = '#ffffff';
                                clonedElement.style.display = 'block';
                                clonedElement.style.visibility = 'visible';
                                clonedElement.style.position = 'relative';
                                clonedElement.style.width = '21cm';
                                clonedElement.style.maxWidth = '21cm';
                                clonedElement.style.minHeight = '29.7cm';
                                clonedElement.style.margin = '0 auto';
                                clonedElement.style.padding = '1.5cm';
                                clonedElement.style.boxSizing = 'border-box';
                                clonedElement.style.left = '0';
                                clonedElement.style.right = '0';
                                clonedElement.style.top = '0';
                                clonedElement.style.transform = 'none';
                                clonedElement.style.overflow = 'visible';
                                
                                // FUENTE MÁS GRANDE
                                clonedElement.style.fontSize = '14px';
                                clonedElement.style.lineHeight = '1.5';
                                
                                // LIMPIAR TODOS LOS ELEMENTOS HIJOS de estilos problemáticos
                                const allChildElements = clonedElement.querySelectorAll('*');
                                allChildElements.forEach(el => {
                                    // Solo limpiar posicionamiento, no otros estilos importantes
                                    if (el.style.position === 'absolute' || el.style.position === 'fixed') {
                                        el.style.position = 'relative';
                                    }
                                    if (el.style.left && el.style.left !== '0px') el.style.left = '0';
                                    if (el.style.right && el.style.right !== '0px') el.style.right = '0';
                                    if (el.style.transform && el.style.transform.includes('translate')) {
                                        el.style.transform = 'none';
                                    }
                                });
                                
                                console.log(`✅ Página ${i + 1} configurada para centrado perfecto`);
                            } else {
                                console.warn(`⚠️ No se encontró elemento para centrar en página ${i + 1}`);
                            }
                        }
                    });

                    // RESTAURAR estilos originales del contenedor
                    Object.keys(originalContainerStyles).forEach(key => {
                        contentContainer.style[key] = originalContainerStyles[key];
                    });

                    console.log(`📏 Canvas generado para página ${i + 1}:`, {
                        width: canvas.width,
                        height: canvas.height,
                        hasData: !!canvas.toDataURL
                    });

                    // Convertir canvas a imagen
                    const imgData = canvas.toDataURL('image/png', 0.95);

                    // Verificar que tenemos datos de imagen
                    if (!imgData || imgData === 'data:,') {
                        throw new Error(`No se generaron datos de imagen para página ${i + 1}`);
                    }

                    // Si no es la primera página, agregar una nueva página
                    if (i > 0) {
                        pdf.addPage();
                    }

                    // Agregar la imagen al PDF con tamaño optimizado
                    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, '', 'FAST');

                    console.log(`✅ Página ${i + 1} agregada al PDF exitosamente`);

                } catch (pageError) {
                    console.error(`❌ Error procesando página ${i + 1}:`, pageError);
                    
                    // Fallback: intentar capturar el pageElement completo
                    try {
                        console.log(`🔄 Intentando captura fallback para página ${i + 1}...`);
                        const fallbackCanvas = await html2canvas(pageElement, {
                            scale: 2,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#ffffff',
                            logging: true
                        });
                        
                        const fallbackImgData = fallbackCanvas.toDataURL('image/png', 0.95);
                        
                        if (i > 0) {
                            pdf.addPage();
                        }
                        pdf.addImage(fallbackImgData, 'PNG', 0, 0, 210, 297, '', 'FAST');
                        console.log(`✅ Página ${i + 1} capturada con fallback`);
                        
                    } catch (fallbackError) {
                        console.error(`❌ Error en fallback para página ${i + 1}:`, fallbackError);
                        throw pageError; // Re-lanzar error original
                    }
                } finally {
                    // OCULTAR LA PÁGINA DESPUÉS DE CAPTURARLA
                    pageElement.style.display = 'none';
                    pageElement.style.visibility = 'hidden';
                }

                console.log(`✅ Página ${i + 1} procesada correctamente`);

                // Pequeña pausa entre páginas para evitar sobrecarga del navegador
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Generar nombre del archivo con timestamp más preciso
            const formData = this.collectFormData();
            const workOrder = formData.work_order_number || 'NO_WO';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
            const date = timestamp[0];
            const time = timestamp[1].split('.')[0];
            const filename = `BSI_PW1100_${workOrder}_${date}_${time}.pdf`;

            // Descargar el PDF
            pdf.save(filename);

            console.log('✅ PDF generado y descargado exitosamente');
            
            // RESTAURAR LA VISUALIZACIÓN NORMAL DEL MODAL
            console.log('🔄 Restaurando visualización normal del modal...');
            this.showPage(this.currentPageIndex);
            this.updatePageNavigation();
            
            // Mostrar notificación de éxito más informativa
            this.showPdfSuccessNotification(filename);

        } catch (error) {
            console.error('❌ Error al generar PDF:', error);
            
            // RESTAURAR LA VISUALIZACIÓN NORMAL EN CASO DE ERROR
            console.log('🔄 Restaurando visualización tras error...');
            this.showPage(this.currentPageIndex);
            this.updatePageNavigation();
            
            this.showPdfErrorNotification(error.message);
        } finally {
            // Restaurar el botón
            if (this.downloadPdfBtn) {
                this.downloadPdfBtn.disabled = false;
                this.downloadPdfBtn.innerHTML = '📄 Descargar como PDF';
            }
        }
    }

    showPdfSuccessNotification(filename) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
            <strong>PDF Generado Exitosamente</strong><br>
            <small style="opacity: 0.8;">${filename}</small>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4caf50;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            text-align: center;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showPdfErrorNotification(errorMessage) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
            <strong>Error al Generar PDF</strong><br>
            <small style="opacity: 0.8;">${errorMessage}</small><br>
            <button onclick="this.parentElement.remove()" style="
                background: white; 
                color: #dc3545; 
                border: none; 
                padding: 8px 15px; 
                border-radius: 4px; 
                font-weight: 600; 
                cursor: pointer;
                margin-top: 10px;
            ">Cerrar</button>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 350px;
            text-align: center;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
    }
}

// Inicializar el manejador cuando se carga la página
window.bsiHandler = new BSI_PW1100_Handler(); 