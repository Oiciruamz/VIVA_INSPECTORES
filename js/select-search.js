/**
 * Select Search Enhancement
 * Convierte automáticamente elementos select con muchas opciones en componentes con búsqueda
 */

class SearchableSelect {
    constructor(selectElement) {
        this.originalSelect = selectElement;
        this.options = Array.from(selectElement.options);
        this.selectedValue = selectElement.value;
        this.isRequired = selectElement.hasAttribute('required');
        this.placeholder = this.getPlaceholder();

        this.createSearchableComponent();
        this.bindEvents();
    }

    getPlaceholder() {
        const firstOption = this.options[0];
        if (firstOption && (firstOption.disabled || firstOption.value === '')) {
            return firstOption.textContent;
        }
        return 'Buscar...';
    }

    createSearchableComponent() {
        // Crear el contenedor principal
        this.container = document.createElement('div');
        this.container.className = 'searchable-select-container';

        // Crear el input de búsqueda
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'search-input';
        this.searchInput.placeholder = this.placeholder;

        // Crear el contenedor de opciones
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'options-container';
        this.optionsContainer.style.display = 'none';

        // Crear las opciones
        this.createOptions();

        // Ensamblar el componente
        this.container.appendChild(this.searchInput);
        this.container.appendChild(this.optionsContainer);

        // Reemplazar el select original
        this.originalSelect.parentNode.insertBefore(this.container, this.originalSelect);
        this.originalSelect.classList.add('original-select');
        this.originalSelect.style.display = 'none';

        // Establecer valor inicial si existe
        if (this.selectedValue) {
            this.setSelectedValue(this.selectedValue);
        }
    }

    createOptions() {
        this.optionElements = [];

        this.options.forEach((option, index) => {
            // Saltar la primera opción si es placeholder
            if (index === 0 && (option.disabled || option.value === '')) {
                return;
            }

            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.textContent = option.textContent;
            optionElement.dataset.value = option.value;
            optionElement.dataset.index = index;

            this.optionsContainer.appendChild(optionElement);
            this.optionElements.push(optionElement);
        });

        // Crear elemento "sin resultados"
        this.noResultsElement = document.createElement('div');
        this.noResultsElement.className = 'no-results';
        this.noResultsElement.textContent = 'No se encontraron resultados';
        this.noResultsElement.style.display = 'none';
        this.optionsContainer.appendChild(this.noResultsElement);
    }

    bindEvents() {
        // Evento de focus en el input de búsqueda
        this.searchInput.addEventListener('focus', () => {
            this.showOptions();
        });

        // Evento de input para filtrar
        this.searchInput.addEventListener('input', (e) => {
            this.filterOptions(e.target.value);
        });

        // Evento de click en las opciones
        this.optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-item')) {
                this.selectOption(e.target);
            }
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideOptions();
            }
        });

        // Navegación con teclado
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });
    }

    showOptions() {
        this.optionsContainer.style.display = 'block';
        this.searchInput.classList.add('options-visible');
        this.filterOptions(this.searchInput.value);
    }

    hideOptions() {
        this.optionsContainer.style.display = 'none';
        this.searchInput.classList.remove('options-visible');
    }

    filterOptions(searchTerm) {
        const term = searchTerm.toLowerCase();
        let visibleCount = 0;

        this.optionElements.forEach(option => {
            const text = option.textContent.toLowerCase();
            const isVisible = text.includes(term);

            option.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;
        });

        // Mostrar/ocultar mensaje de "sin resultados"
        this.noResultsElement.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    selectOption(optionElement) {
        const value = optionElement.dataset.value;
        const text = optionElement.textContent;

        // Actualizar el select original
        this.originalSelect.value = value;
        this.selectedValue = value;

        // Actualizar el input de búsqueda
        this.searchInput.value = text;

        // Actualizar estilos visuales
        this.optionElements.forEach(opt => opt.classList.remove('selected'));
        optionElement.classList.add('selected');

        // Ocultar opciones
        this.hideOptions();

        // Disparar evento change en el select original
        const changeEvent = new Event('change', { bubbles: true });
        this.originalSelect.dispatchEvent(changeEvent);
    }

    setSelectedValue(value) {
        const option = this.optionElements.find(opt => opt.dataset.value === value);
        if (option) {
            this.selectOption(option);
        }
    }

    handleKeyNavigation(e) {
        const visibleOptions = this.optionElements.filter(opt => opt.style.display !== 'none');

        if (visibleOptions.length === 0) return;

        let currentIndex = visibleOptions.findIndex(opt => opt.classList.contains('highlighted'));

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < visibleOptions.length - 1) {
                    this.highlightOption(visibleOptions[currentIndex + 1]);
                } else {
                    this.highlightOption(visibleOptions[0]);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    this.highlightOption(visibleOptions[currentIndex - 1]);
                } else {
                    this.highlightOption(visibleOptions[visibleOptions.length - 1]);
                }
                break;

            case 'Enter':
                e.preventDefault();
                const highlighted = visibleOptions.find(opt => opt.classList.contains('highlighted'));
                if (highlighted) {
                    this.selectOption(highlighted);
                } else if (visibleOptions.length === 1) {
                    this.selectOption(visibleOptions[0]);
                }
                break;

            case 'Escape':
                this.hideOptions();
                break;
        }
    }

    highlightOption(option) {
        this.optionElements.forEach(opt => opt.classList.remove('highlighted'));
        option.classList.add('highlighted');
    }
}

// Función para inicializar todos los selects con búsqueda
function initializeSearchableSelects() {
    const selects = document.querySelectorAll('select');

    selects.forEach(select => {
        // Solo convertir selects con más de 5 opciones (excluyendo placeholders)
        const realOptions = Array.from(select.options).filter(option =>
            !option.disabled && option.value !== ''
        );

        if (realOptions.length > 5) {
            new SearchableSelect(select);
        }
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearchableSelects);
} else {
    initializeSearchableSelects();
}
