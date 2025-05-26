// Array con colores para los encabezados de tarjetas
const cardColors = [
    '#008080', // Teal
    '#007575', // Teal oscuro
    '#009090'  // Teal claro
];

// Función para inicializar la página
function initPage() {
    setupCardColors();
    setupCardEvents();
    setupSearch();
}

// Asignar colores aleatorios a los encabezados de las tarjetas
function setupCardColors() {
    document.querySelectorAll('.form-card-header').forEach(header => {
        const randomColorIndex = Math.floor(Math.random() * cardColors.length);
        header.style.backgroundColor = cardColors[randomColorIndex];
    });
}

// Configurar eventos para las tarjetas

// Configurar búsqueda de formularios
function setupSearch() {
    const searchInput = document.getElementById('search-forms');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            document.querySelectorAll('.form-card').forEach(card => {
                const title = card.querySelector('.form-title').textContent.toLowerCase();
                const subtitle = card.querySelector('.form-subtitle').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || subtitle.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initPage); 