/**
 * 🚨 HERRAMIENTA DE DIAGNÓSTICO DE EMERGENCIA PARA PDF
 * Identifica exactamente por qué las páginas están en blanco
 */
window.EmergencyDiagnostic = {
    // DIAGNÓSTICO PRINCIPAL
    diagnose() {
        console.group('🚨 DIAGNÓSTICO DE EMERGENCIA - PDF EN BLANCO');
        
        console.log('1. Verificando handler...');
        const handler = window.handler;
        if (!handler) {
            console.error('❌ CRÍTICO: No hay handler activo');
            console.log('💡 SOLUCIÓN: Recargar la página o verificar BSI_PW1100_Handler.js');
            console.groupEnd();
            return;
        }
        console.log('✅ Handler encontrado');
        
        console.log('2. Verificando formulario...');
        const form = document.querySelector('form');
        if (!form) {
            console.error('❌ CRÍTICO: No hay formulario');
            console.groupEnd();
            return;
        }
        console.log('✅ Formulario encontrado');
        
        console.log('3. Verificando datos del formulario...');
        let formData = {};
        try {
            formData = handler.collectFormData();
            const filledFields = Object.keys(formData).filter(k => formData[k] && formData[k] !== '').length;
            console.log(`📊 Campos con datos: ${filledFields}/${Object.keys(formData).length}`);
            
            if (filledFields === 0) {
                console.error('❌ PROBLEMA ENCONTRADO: Formulario está VACÍO');
                console.log('💡 SOLUCIÓN: Llenar el formulario antes de generar PDF');
                console.log('🔧 Usar: EmergencyDiagnostic.fillTestData()');
            } else {
                console.log('✅ Formulario tiene datos');
            }
        } catch (error) {
            console.error('❌ ERROR al recolectar datos:', error);
            console.groupEnd();
            return;
        }
        
        console.log('4. Verificando páginas de preview...');
        console.log(`📚 Páginas cargadas: ${handler.previewPages?.length || 0}`);
        if (!handler.previewPages || handler.previewPages.length === 0) {
            console.error('❌ PROBLEMA: No hay páginas de preview cargadas');
            console.log('💡 SOLUCIÓN: Abrir modal de preview primero');
        }
        
        console.groupEnd();
        return { formData, filledFields: Object.keys(formData).filter(k => formData[k] && formData[k] !== '').length };
    },
    
    // LLENAR DATOS DE PRUEBA
    fillTestData() {
        console.log('🧪 Llenando formulario con datos de prueba...');
        
        const testData = {
            'nombre_registrado': 'INSPECTOR DE PRUEBA',
            'work_order_number': 'WO-TEST-001',
            'date_of_bsi': '2024-01-15',
            'inspected_by': 'Julio Acosta',
            'inspector_stamp': 'QC-003',
            'aircraft_registration': 'XA-TEST',
            'aircraft_model': 'A320NEO',
            'engine_sn': 'TEST123456'
        };
        
        let filled = 0;
        for (const [key, value] of Object.entries(testData)) {
            const field = document.getElementById(key);
            if (field) {
                field.value = value;
                filled++;
                console.log(`✅ ${key} = ${value}`);
            }
        }
        
        // Marcar radio buttons
        const radioSelections = {
            'station': 'MTY',
            'bsi_reason': 'Maintenance Program',
            'bsi_type': 'HOT SECTION',
            'aircraft_model': 'A320NEO',
            'boroscope_type': 'Rigid'
        };
        
        for (const [name, value] of Object.entries(radioSelections)) {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                filled++;
                console.log(`✅ Radio ${name} = ${value}`);
            }
        }
        
        console.log(`✅ ${filled} campos llenados con datos de prueba`);
        return filled;
    },
    
    // PROBAR PDF DE EMERGENCIA
    async testEmergencyPdf() {
        console.log('🚨 PROBANDO PDF DE EMERGENCIA...');
        
        const testDiv = document.createElement('div');
        testDiv.innerHTML = `
            <div style="width: 21cm; height: 29.7cm; padding: 2cm; background: white; font-family: Arial; color: black;">
                <img src="img/Viva_Logo.svg.png" style="width: 100px; height: auto; margin-bottom: 20px;">
                <h1 style="color: #00aa00;">✅ PRUEBA DE PDF EXITOSA</h1>
                <h2>VIVA AEROBUS - SISTEMA DE INSPECCIÓN</h2>
                <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Estado:</strong> Sistema de PDF funcionando correctamente</p>
                
                <h3>DIAGNÓSTICO COMPLETO:</h3>
                <ul>
                    <li>✅ html2pdf.js está funcionando</li>
                    <li>✅ html2canvas está funcionando</li>
                    <li>✅ jsPDF está funcionando</li>
                    <li>✅ El navegador es compatible</li>
                </ul>
                
                <h3>CONCLUSIÓN:</h3>
                <p style="color: red; font-weight: bold;">
                    Si puedes ver este PDF con contenido, entonces el problema NO es el sistema de PDF.
                    El problema está en que el formulario está VACÍO o los datos no se están inyectando en las plantillas.
                </p>
                
                <h3>PRÓXIMOS PASOS:</h3>
                <ol>
                    <li>Llenar el formulario completamente</li>
                    <li>Verificar que todos los campos requeridos estén llenos</li>
                    <li>Abrir el modal de preview ANTES de generar PDF</li>
                    <li>Verificar que las páginas muestren los datos en el modal</li>
                    <li>Luego intentar generar el PDF</li>
                </ol>
            </div>
        `;
        
        testDiv.style.cssText = 'position: absolute; top: -10000px; left: -10000px;';
        document.body.appendChild(testDiv);
        
        try {
            const options = {
                margin: [5, 5, 5, 5],
                filename: 'DIAGNOSTIC_TEST_VIVA.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            await window.html2pdf().set(options).from(testDiv).save();
            console.log('✅ PDF DE EMERGENCIA GENERADO EXITOSAMENTE');
            console.log('🎯 CONCLUSIÓN: El sistema de PDF FUNCIONA. El problema está en los DATOS DEL FORMULARIO.');
            
        } catch (error) {
            console.error('❌ Error generando PDF de emergencia:', error);
            console.log('🚨 PROBLEMA CRÍTICO: El sistema de PDF no funciona');
        } finally {
            document.body.removeChild(testDiv);
        }
    },
    
    // FLUJO COMPLETO DE PRUEBA
    async fullTest() {
        console.group('🔬 EJECUTANDO PRUEBA COMPLETA');
        
        // Paso 1: Diagnóstico
        const diagnosis = this.diagnose();
        
        // Paso 2: Llenar datos si está vacío
        if (diagnosis && diagnosis.filledFields === 0) {
            console.log('📝 Llenando datos de prueba...');
            this.fillTestData();
        }
        
        // Paso 3: Probar PDF de emergencia
        await this.testEmergencyPdf();
        
        // Paso 4: Intentar flujo normal
        console.log('🔄 Intentando flujo normal...');
        const handler = window.handler;
        if (handler && handler.openPreviewModal) {
            try {
                await handler.openPreviewModal();
                console.log('✅ Modal abierto, ahora puedes intentar generar PDF normal');
            } catch (error) {
                console.error('❌ Error abriendo modal:', error);
            }
        }
        
        console.groupEnd();
    }
};

console.log('🚨 DIAGNÓSTICO DE EMERGENCIA CARGADO');
console.log('📋 COMANDOS DISPONIBLES:');
console.log('  - EmergencyDiagnostic.diagnose() - Diagnóstico rápido');
console.log('  - EmergencyDiagnostic.fillTestData() - Llenar datos de prueba');
console.log('  - EmergencyDiagnostic.testEmergencyPdf() - Probar PDF directo');
console.log('  - EmergencyDiagnostic.fullTest() - Prueba completa');
console.log('');
console.log('🔥 EJECUTANDO DIAGNÓSTICO AUTOMÁTICO...');
window.EmergencyDiagnostic.diagnose(); 