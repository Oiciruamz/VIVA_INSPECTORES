/**
 * Utilidad para depurar la generación de PDF
 * Proporciona herramientas para diagnosticar problemas con html2pdf
 */
class PdfDebugger {
    static logDebugInfo(handler) {
        console.group('🔍 DEBUG INFO - PDF GENERATION');
        
        console.log('📚 Preview pages count:', handler.previewPages?.length || 0);
        console.log('🏠 Preview container:', handler.previewPagesContainer ? 'Found' : 'Missing');
        
        if (handler.previewPages) {
            handler.previewPages.forEach((page, index) => {
                console.log(`📄 Page ${index + 1}:`, {
                    display: page.style.display || 'default',
                    visibility: page.style.visibility || 'default',
                    width: page.offsetWidth + 'px',
                    height: page.offsetHeight + 'px',
                    className: page.className,
                    hasContent: page.innerHTML.length > 100
                });
            });
        }
        
        // Verificar librerías
        console.log('📦 html2pdf available:', typeof window.html2pdf !== 'undefined');
        console.log('📦 html2canvas available:', typeof window.html2canvas !== 'undefined');
        console.log('📦 jsPDF available:', typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined');
        
        console.groupEnd();
    }
    
    static async testPdfGeneration(handler) {
        console.log('🧪 Iniciando prueba de generación PDF...');
        
        try {
            // Crear un contenedor de prueba pequeño
            const testDiv = document.createElement('div');
            testDiv.innerHTML = `
                <div style="width: 21cm; height: 10cm; background: white; padding: 1cm; border: 1px solid #ccc;">
                    <h1>Prueba de PDF</h1>
                    <p>Si puedes leer esto en el PDF, la librería funciona correctamente.</p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                </div>
            `;
            testDiv.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
            document.body.appendChild(testDiv);
            
            const options = {
                margin: [5, 5, 5, 5],
                filename: 'test-pdf.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 1, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            await window.html2pdf().set(options).from(testDiv).save();
            
            document.body.removeChild(testDiv);
            console.log('✅ Prueba de PDF exitosa');
            
        } catch (error) {
            console.error('❌ Error en prueba de PDF:', error);
            throw error;
        }
    }
    
    static highlightProblematicElements(container) {
        const problematicSelectors = [
            '[style*="display: none"]',
            '[style*="visibility: hidden"]',
            '[style*="opacity: 0"]',
            '.hidden',
            '[aria-hidden="true"]'
        ];
        
        problematicSelectors.forEach(selector => {
            const elements = container.querySelectorAll(selector);
            elements.forEach(el => {
                console.warn('⚠️ Elemento problemático encontrado:', selector, el);
                el.style.border = '2px solid red';
                el.title = 'Elemento problemático para PDF';
            });
        });
    }
    
    static cleanupDebugHighlights() {
        const highlighted = document.querySelectorAll('[title="Elemento problemático para PDF"]');
        highlighted.forEach(el => {
            el.style.border = '';
            el.removeAttribute('title');
        });
    }
}

// Exponer globalmente
window.PdfDebugger = PdfDebugger; 