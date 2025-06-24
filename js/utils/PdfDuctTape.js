/**
 * 🚨 HERRAMIENTA DE DIAGNÓSTICO DE EMERGENCIA PARA PDF
 * Identifica exactamente por qué las páginas están en blanco
 */
window.PdfDuctTape = {
    // PASO 1: Diagnóstico completo del estado del sistema
    diagnoseEverything() {
        console.group('🚨 DIAGNÓSTICO DE EMERGENCIA - PDF EN BLANCO');
        
        // Verificar handler
        const handler = window.handler || window.BSI_PW1100_Handler || null;
        console.log('🔍 Handler encontrado:', !!handler);
        
        if (!handler) {
            console.error('❌ PROBLEMA CRÍTICO: No se encontró el handler');
            console.groupEnd();
            return { critical: true, error: 'No handler found' };
        }
        
        // Verificar formulario
        const form = handler.form || document.querySelector('form');
        console.log('📝 Formulario encontrado:', !!form);
        
        if (!form) {
            console.error('❌ PROBLEMA CRÍTICO: No se encontró formulario');
            console.groupEnd();
            return { critical: true, error: 'No form found' };
        }
        
        // Verificar datos del formulario
        console.log('🔄 Intentando recolectar datos del formulario...');
        let formData = {};
        try {
            formData = handler.collectFormData();
            console.log('📋 Datos recolectados:', formData);
            console.log('📊 Cantidad de campos con datos:', Object.keys(formData).filter(k => formData[k] && formData[k] !== '').length);
        } catch (error) {
            console.error('❌ ERROR CRÍTICO al recolectar datos:', error);
            console.groupEnd();
            return { critical: true, error: 'Failed to collect form data', details: error };
        }
        
        // Verificar páginas de preview
        console.log('📚 Páginas de preview cargadas:', handler.previewPages?.length || 0);
        console.log('🏠 Container de preview:', !!handler.previewPagesContainer);
        
        // Verificar plantillas HTML
        console.log('🔄 Verificando plantillas HTML...');
        const templatePaths = handler.pagePaths || [];
        console.log('📁 Rutas de plantillas:', templatePaths);
        
        console.groupEnd();
        
        return {
            critical: false,
            handler: !!handler,
            form: !!form,
            formData: formData,
            formDataCount: Object.keys(formData).filter(k => formData[k] && formData[k] !== '').length,
            previewPages: handler.previewPages?.length || 0,
            previewContainer: !!handler.previewPagesContainer,
            templatePaths: templatePaths
        };
    },
    
    // PASO 2: Verificar cada plantilla HTML individualmente
    async checkTemplates() {
        console.group('🔍 VERIFICANDO PLANTILLAS HTML');
        
        const handler = window.handler || window.BSI_PW1100_Handler;
        if (!handler) {
            console.error('❌ No handler disponible');
            console.groupEnd();
            return;
        }
        
        const paths = handler.pagePaths || [
            '../forms/cover_sheet_preview.html',
            '../forms/boroscope_report_page2_preview.html',
            '../forms/boroscope_report_page3_preview.html',
            '../forms/boroscope_report_page5_preview.html',
            '../forms/boroscope_report_page5_images_preview.html'
        ];
        
        for (const path of paths) {
            try {
                console.log(`🔄 Verificando: ${path}`);
                const response = await fetch(path);
                console.log(`📊 Estado HTTP: ${response.status}`);
                
                if (response.ok) {
                    const html = await response.text();
                    console.log(`📐 Tamaño: ${html.length} caracteres`);
                    console.log(`🔍 Contiene elementos preview:`, html.includes('preview-'));
                } else {
                    console.error(`❌ Error HTTP ${response.status} para ${path}`);
                }
            } catch (error) {
                console.error(`❌ Error cargando ${path}:`, error);
            }
        }
        
        console.groupEnd();
    },
    
    // PASO 3: Llenar formulario con datos de prueba
    fillTestData() {
        console.log('🧪 Llenando formulario con datos de prueba...');
        
        const testData = {
            'nombre_registrado': 'TEST INSPECTOR',
            'work_order_number': 'TEST-001',
            'date_of_bsi': '2024-01-15',
            'inspected_by': 'Julio Acosta',
            'inspector_stamp': 'QC-003',
            'aircraft_registration': 'XA-TEST',
            'aircraft_model': 'A320NEO',
            'engine_sn': 'TEST123456',
            'station': 'MTY',
            'bsi_reason': 'Maintenance Program',
            'bsi_type': 'HOT SECTION',
            'boroscope_type': 'Rigid'
        };
        
        // Llenar cada campo
        for (const [key, value] of Object.entries(testData)) {
            const field = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'radio') {
                    const radio = document.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radio) {
                        radio.checked = true;
                        console.log(`✅ Radio ${key} = ${value}`);
                    }
                } else {
                    field.value = value;
                    console.log(`✅ Campo ${key} = ${value}`);
                }
            } else {
                console.warn(`⚠️ Campo no encontrado: ${key}`);
            }
        }
        
        console.log('✅ Datos de prueba ingresados');
    },
    
    // PASO 4: Probar el flujo completo
    async testCompleteFlow() {
        console.group('🧪 PROBANDO FLUJO COMPLETO');
        
        try {
            // 1. Llenar datos de prueba
            this.fillTestData();
            
            // 2. Obtener handler  
            const handler = window.handler;
            if (!handler) {
                console.error('❌ No handler');
                return;
            }
            
            // 3. Recolectar datos
            const formData = handler.collectFormData();
            console.log('📋 Datos recolectados:', formData);
            
            // 4. Cargar páginas de preview
            await handler.loadPreviewPagesWithDynamicImages(formData);
            console.log('📚 Páginas cargadas:', handler.previewPages.length);
            
            // 5. Inyectar datos
            handler.previewPages.forEach((page, index) => {
                handler.injectFormDataIntoPreview(page, formData);
                console.log(`✅ Datos inyectados en página ${index + 1}`);
            });
            
            // 6. Verificar contenido de la primera página
            if (handler.previewPages[0]) {
                const firstPage = handler.previewPages[0];
                const textContent = firstPage.textContent;
                console.log('📄 Contenido de primera página (primeros 200 chars):', textContent.substring(0, 200));
                console.log('🔍 Contiene datos de prueba:', textContent.includes('TEST INSPECTOR'));
            }
            
            console.log('✅ Flujo completo ejecutado');
            
        } catch (error) {
            console.error('❌ Error en flujo completo:', error);
        }
        
        console.groupEnd();
    },
    
    // PASO 5: Generar PDF de emergencia con contenido forzado
    async emergencyPdfTest() {
        console.log('🚨 GENERANDO PDF DE EMERGENCIA...');
        
        // Crear contenido de prueba directo
        const testContent = document.createElement('div');
        testContent.innerHTML = `
            <div style="width: 21cm; height: 29.7cm; padding: 2cm; background: white; font-family: Arial;">
                <h1>PRUEBA DE PDF - VIVA AEROBUS</h1>
                <p>Si puedes leer esto, el sistema de PDF funciona correctamente.</p>
                <p>Fecha: ${new Date().toISOString()}</p>
                <p>El problema está en los datos del formulario o en la carga de plantillas.</p>
                <br><br>
                <h2>DIAGNÓSTICO:</h2>
                <ul>
                    <li>✅ html2pdf funciona</li>
                    <li>✅ Navegador compatible</li>
                    <li>❌ Datos del formulario no llegan al PDF</li>
                </ul>
            </div>
        `;
        
        testContent.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
        document.body.appendChild(testContent);
        
        try {
            const options = {
                margin: [0, 0],
                filename: 'EMERGENCY_TEST.pdf',
                image: { type: 'jpeg', quality: 0.9 },
                html2canvas: { scale: 1, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            await window.html2pdf().set(options).from(testContent).save();
            console.log('✅ PDF de emergencia generado - SI FUNCIONA, el problema está en los datos');
            
        } catch (error) {
            console.error('❌ Error generando PDF de emergencia:', error);
        } finally {
            document.body.removeChild(testContent);
        }
    }
};

// Auto-ejecutar diagnóstico básico
console.log('🚨 INICIANDO DIAGNÓSTICO AUTOMÁTICO...');
const diagnosis = window.PdfDuctTape.diagnoseEverything();
console.log('📊 Resultado del diagnóstico:', diagnosis); 