(function(){
    /**
     * Exporta un nodo DOM a PDF usando html2pdf.js
     * @param {HTMLElement} container - Nodo que contiene todas las páginas a imprimir.
     * @param {String} fileName - Nombre del archivo de salida.
     * @returns {Promise<void>}
     */
    async function exportPreviewToPDF(container, fileName){
        if(!container){
            throw new Error('Contenedor vacío recibido en exportPreviewToPDF');
        }
        if(typeof window.html2pdf === 'undefined'){
            throw new Error('html2pdf.js no está cargado');
        }
        const options = {
            margin:       [0, 0],           // márgenes en mm
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.95 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };
        await window.html2pdf().set(options).from(container).save();
    }

    // Exponer en window para uso global sin módulos
    window.exportPreviewToPDF = exportPreviewToPDF;
})(); 