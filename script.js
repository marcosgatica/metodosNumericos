/* =====================================================================
   1. VARIABLES GLOBALES Y CONFIGURACIÓN
   ===================================================================== */
// Límite de seguridad para evitar que los bucles infinitos congelen el navegador
const MAX_ITER = 50; 
// Variable global para almacenar la instancia de Chart.js y poder destruirla/actualizarla
let currentChart = null; 

/* =====================================================================
   2. CONTROL DE NAVEGACIÓN Y UI (INTERFAZ DE USUARIO)
   ===================================================================== */
function showSection(sectionId) {
    // Oculta todas las secciones quitando la clase 'active'
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    // Muestra solo la sección solicitada
    document.getElementById(sectionId).classList.add('active');
    
    // Actualiza el estado visual de los enlaces del menú
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) link.classList.add('active');
    });
    
    // Cierra el menú móvil si estaba abierto y sube la pantalla al inicio
    document.getElementById('navMenu').classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Asigna el evento click a todos los enlaces de navegación
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que la página recargue
        showSection(link.dataset.section);
    });
});

// Control del menú de hamburguesa para dispositivos móviles
document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navMenu').classList.toggle('active');
});

/* =====================================================================
   3. FUNCIONES DE APOYO (HELPERS)
   ===================================================================== */
// Evalúa un string matemático (ej. "x^2 + 2") usando la librería math.js
function evalFunc(expr, x) {
    return math.evaluate(expr, { x: x });
}

// Muestra un mensaje de error en la UI, pasándole el ID del contenedor
function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.add('show');
}

// Limpia los mensajes de error previos
function clearError(id) {
    document.getElementById(id).classList.remove('show');
}

// Genera dinámicamente una tabla HTML a partir de los resultados de las iteraciones
function renderTable(containerId, headers, rows) {
    let html = '<div class="table-container"><table><thead><tr>';
    // Construye los encabezados
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    
    // Construye las filas de datos
    rows.forEach((row, idx) => {
        const isLast = idx === rows.length - 1; // Identifica la última fila (resultado final)
        let classes = [];
        if (isLast) classes.push('result-row');
        if (row.highlight) classes.push('highlight-row');
        
        const style = row.highlight ? ' style="background-color: rgba(255, 193, 7, 0.3);"' : '';
        html += `<tr class="${classes.join(' ')}"${style}>`;
        // Limita los números a 4 decimales para mantener la tabla limpia
        row.forEach(cell => html += `<td>${typeof cell === 'number' ? cell.toFixed(4) : cell}</td>`);
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    document.getElementById(containerId).innerHTML = html;
}

/* =====================================================================
   4. MÉTODOS DE BÚSQUEDA DE RAÍCES (MÉTODOS CERRADOS Y ABIERTOS)
   ===================================================================== */

/* MÉTODO DE BISECCIÓN: Método cerrado que divide el intervalo a la mitad. 
   Es lento pero seguro si hay cambio de signo. */
function calcularBiseccion() {
    clearError('bisec-error');
    try {
        const func = document.getElementById('bisec-func').value;
        let a = parseFloat(document.getElementById('bisec-a').value);
        let b = parseFloat(document.getElementById('bisec-b').value);
        const tol = parseFloat(document.getElementById('bisec-tol').value);
        
        let fa = evalFunc(func, a);
        let fb = evalFunc(func, b);
        
        // Teorema de Bolzano: Si no hay cambio de signo, no garantiza raíz
        if (fa * fb > 0) throw new Error('f(a) y f(b) deben tener signos opuestos');
        
        let rows = [], xr, fxr, error = 0;
        for (let i = 1; i <= MAX_ITER; i++) {
            xr = (a + b) / 2; // Punto medio
            fxr = evalFunc(func, xr);
            error = (b - a) / 2;
            rows.push([i, a, b, fa, fb, xr, fxr, error]);
            
            // Criterios de parada: tolerancia alcanzada
            if (Math.abs(fxr) < tol || error < tol) break;
            
            // Reasignación de límites para la siguiente iteración
            if (fa * fxr < 0) { b = xr; fb = fxr; } else { a = xr; fa = fxr; }
        }
        renderTable('bisec-result', ['i','a','b','f(a)','f(b)','xr','f(xr)','Error'], rows);
    } catch (e) { showError('bisec-error', 'Error: ' + e.message); }
}

/* MÉTODO DE LA REGLA FALSA: Similar a bisección, pero usa una línea recta 
   entre los puntos para predecir la raíz en lugar de partir a la mitad. */
function calcularReglaFalsa() {
    clearError('rf-error');
    try {
        const func = document.getElementById('rf-func').value;
        let a = parseFloat(document.getElementById('rf-a').value);
        let b = parseFloat(document.getElementById('rf-b').value);
        const tol = parseFloat(document.getElementById('rf-tol').value);
        
        let fa = evalFunc(func, a), fb = evalFunc(func, b);
        if (fa * fb > 0) throw new Error('f(a) y f(b) deben tener signos opuestos');
        
        let rows = [], xr, fxr, error = 0;
        for (let i = 1; i <= MAX_ITER; i++) {
            // Fórmula de la secante para hallar el cruce
            xr = (a * fb - b * fa) / (fb - fa);
            fxr = evalFunc(func, xr);
            if (i > 1) error = Math.abs(xr - rows[rows.length-1][5]); // Error aproximado actual vs anterior
            rows.push([i, a, b, fa, fb, xr, fxr, error]);
            
            if (Math.abs(fxr) < tol) break;
            if (fa * fxr < 0) { b = xr; fb = fxr; } else { a = xr; fa = fxr; }
        }
        renderTable('rf-result', ['i','a','b','f(a)','f(b)','xr','f(xr)','Error'], rows);
    } catch (e) { showError('rf-error', 'Error: ' + e.message); }
}

/* MÉTODO DE NEWTON-RAPHSON: Método abierto muy rápido. Requiere la derivada 
   de la función y un punto inicial cercano a la raíz. */
function calcularNewton() {
    clearError('newton-error');
    try {
        const func = document.getElementById('newton-func').value;
        const deriv = document.getElementById('newton-deriv').value;
        let x = parseFloat(document.getElementById('newton-x0').value);
        const tol = parseFloat(document.getElementById('newton-tol').value);
        
        let rows = [];
        for (let i = 1; i <= MAX_ITER; i++) {
            const fx = evalFunc(func, x), dfx = evalFunc(deriv, x);
            // Evita la división por cero si la pendiente es horizontal
            if (dfx === 0) throw new Error('Derivada cero'); 
            
            const xr = x - fx / dfx; // Fórmula de Newton
            const error = Math.abs(xr - x);
            rows.push([i, x, fx, dfx, xr, error]);
            
            if (error < tol) break;
            x = xr;
        }
        renderTable('newton-result', ['i','xᵢ','f(xᵢ)',"f'(xᵢ)",'xᵣ','Error'], rows);
    } catch (e) { showError('newton-error', 'Error: ' + e.message); }
}

/* MÉTODO DE LA SECANTE: Aproximación a Newton, pero no requiere derivada. 
   Estima la pendiente usando dos puntos iniciales. */
function calcularSecante() {
    clearError('sec-error');
    try {
        const func = document.getElementById('sec-func').value;
        let x0 = parseFloat(document.getElementById('sec-x0').value);
        let x1 = parseFloat(document.getElementById('sec-x1').value);
        const tol = parseFloat(document.getElementById('sec-tol').value);
        
        let rows = [];
        for (let i = 1; i <= MAX_ITER; i++) {
            const fx0 = evalFunc(func, x0), fx1 = evalFunc(func, x1);
            if (fx1 - fx0 === 0) throw new Error('División por cero');
            
            const xr = x1 - fx1 * (x1 - x0) / (fx1 - fx0);
            const error = Math.abs(xr - x1);
            rows.push([i, x0, x1, fx0, fx1, xr, error]);
            
            if (error < tol) break;
            x0 = x1; x1 = xr; // Desplazamiento de los puntos para el próximo ciclo
        }
        renderTable('sec-result', ['i','x₀','x₁','f(x₀)','f(x₁)','xᵣ','Error'], rows);
    } catch (e) { showError('sec-error', 'Error: ' + e.message); }
}

/* MÉTODO DE MÜLLER: Ajusta una parábola a tres puntos para encontrar raíces.
   Útil para raíces múltiples o complejas. */
function calcularMuller() {
    clearError('muller-error');
    try {
        const func = document.getElementById('muller-func').value;
        let x0 = parseFloat(document.getElementById('muller-x0').value);
        let x1 = parseFloat(document.getElementById('muller-x1').value);
        let x2 = parseFloat(document.getElementById('muller-x2').value);
        
        let rows = [];
        for (let i = 1; i <= 10; i++) { // Iteraciones limitadas para Muller por su convergencia
            // Cálculos de las diferencias divididas
            const h0 = x1 - x0, h1 = x2 - x1;
            const d0 = (evalFunc(func, x1) - evalFunc(func, x0)) / h0;
            const d1 = (evalFunc(func, x2) - evalFunc(func, x1)) / h1;
            
            // Coeficientes de la parábola a*x^2 + b*x + c
            const a = (d1 - d0) / (h1 + h0), b = a * h1 + d1, c = evalFunc(func, x2);
            
            // Resolución cuadrática
            const disc = Math.sqrt(b*b - 4*a*c);
            // Elección del signo del denominador para maximizar su valor y minimizar el error
            const den = Math.abs(b + disc) > Math.abs(b - disc) ? b + disc : b - disc;
            const x3 = x2 + (-2 * c) / den; 
            const error = Math.abs(x3 - x2);
            
            rows.push([i, x0, x1, x2, evalFunc(func,x0), evalFunc(func,x1), evalFunc(func,x2), x3, error]);
            if (error < 0.001) break;
            
            x0 = x1; x1 = x2; x2 = x3;
        }
        renderTable('muller-result', ['i','X₀','X₁','X₂','F(X₀)','F(X₁)','F(X₂)','X₃','Error'], rows);
    } catch (e) { showError('muller-error', 'Error: ' + e.message); }
}

/* MÉTODO DE RAÍCES MÚLTIPLES: Variante de Newton-Raphson modificada 
   que usa la primera y segunda derivada para raíces que se repiten. */
function calcularMultiple() {
    clearError('mult-error');
    try {
        const func = document.getElementById('mult-func').value;
        const deriv1 = document.getElementById('mult-deriv1').value;
        const deriv2 = document.getElementById('mult-deriv2').value;
        let x = parseFloat(document.getElementById('mult-x0').value);
        
        let rows = [];
        for (let i = 1; i <= MAX_ITER; i++) {
            const fx = evalFunc(func, x), fpx = evalFunc(deriv1, x), fppx = evalFunc(deriv2, x);
            const den = fpx*fpx - fx*fppx;
            
            if (den === 0) throw new Error('División por cero');
            
            const xr = x - (fx * fpx) / den; // Newton Modificado
            const error = Math.abs(xr - x);
            
            rows.push([i, x, fx, fpx, fppx, xr, error]);
            if (error < 0.000001) break; // Tolerancia fija para este caso
            x = xr;
        }
        renderTable('mult-result', ['i','xᵢ','f(xᵢ)',"f'(xᵢ)","f''(xᵢ)",'xᵣ','Error'], rows);
    } catch (e) { showError('mult-error', 'Error: ' + e.message); }
}

/* =====================================================================
   5. MÉTODOS DE INTERPOLACIÓN
   ===================================================================== */

/* INTERPOLACIÓN LINEAL: Encuentra un valor intermedio trazando una recta 
   entre dos puntos conocidos (x1, y1) y (x2, y2). */
function calcularLineal() {
    clearError('lin-error');
    try {
        const x1 = parseFloat(document.getElementById('lin-x1').value);
        const y1 = parseFloat(document.getElementById('lin-y1').value);
        const x2 = parseFloat(document.getElementById('lin-x2').value);
        const y2 = parseFloat(document.getElementById('lin-y2').value);
        const x = parseFloat(document.getElementById('lin-x').value);

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2) || isNaN(x)) {
            throw new Error('Por favor, completa todos los campos numéricos.');
        }
        if (x2 - x1 === 0) throw new Error('x₁ y x₂ no pueden ser iguales (división por cero).');

        // Ecuación punto-pendiente
        const y = ((x - x1) / (x2 - x1)) * (y2 - y1) + y1;
        
        renderTable('lin-result', ['x₁', 'y₁', 'x₂', 'y₂', 'x (A interpolar)', 'y (Resultado)'], [[x1, y1, x2, y2, x, y]]);
    } catch (e) { showError('lin-error', 'Error: ' + e.message); }
}

/* INTERPOLACIÓN DE LAGRANGE: Crea un polinomio de grado n-1 que pasa exactamente
   por "n" puntos conocidos, y evalúa un valor 'x' en ese polinomio. */
function calcularLagrange() {
    clearError('lag-error');
    try {
        const xArr = document.getElementById('lag-x-arr').value.split(',').map(v => parseFloat(v.trim()));
        const yArr = document.getElementById('lag-y-arr').value.split(',').map(v => parseFloat(v.trim()));
        const x = parseFloat(document.getElementById('lag-x').value);

        if (isNaN(x)) throw new Error('Valor a interpolar inválido.');
        if (xArr.length !== yArr.length) throw new Error('Las listas de X e Y deben tener la misma cantidad de elementos.');
        if (xArr.some(isNaN) || yArr.some(isNaN)) throw new Error('Todos los elementos en las listas deben ser números.');

        let resultY = 0;
        // Bucle externo: suma de los términos de Lagrange L_i(x) * y_i
        for (let i = 0; i < xArr.length; i++) {
            let term = yArr[i];
            // Bucle interno: productorio para calcular L_i(x)
            for (let j = 0; j < xArr.length; j++) {
                if (i !== j) {
                    if (xArr[i] - xArr[j] === 0) throw new Error('Los valores de X deben ser distintos (división por cero).');
                    term = term * (x - xArr[j]) / (xArr[i] - xArr[j]);
                }
            }
            resultY += term;
        }
        renderTable('lag-result', ['x interpolado', 'f(x) (Resultado)'], [[x, resultY]]);
    } catch (e) { showError('lag-error', 'Error: ' + e.message); }
}

/* =====================================================================
   6. MOTOR DE GRÁFICAS (CHART.JS)
   ===================================================================== */
function calcularGrafica() {
    clearError('graf-error');
    try {
        const func = document.getElementById('graf-func').value;
        const xMin = parseFloat(document.getElementById('graf-xmin').value);
        const xMax = parseFloat(document.getElementById('graf-xmax').value);
        const step = parseFloat(document.getElementById('graf-step').value);

        // Validaciones de rangos y lógica matemática
        if (isNaN(xMin) || isNaN(xMax) || isNaN(step)) throw new Error('Completa los campos numéricos correctamente.');
        if (xMin >= xMax) throw new Error('El valor inicial (x) debe ser menor al final.');
        if (step <= 0) throw new Error('El paso (step) debe ser mayor a 0.');

        let xValues = [];
        let yValues = [];
        let rows = [];

        // Seguridad: Evita un cuelgue del navegador limitando los puntos a calcular
        if ((xMax - xMin) / step > 2000) throw new Error('Demasiados puntos a calcular. Aumenta el paso o reduce el rango.');

        let previousY = null;
        
        // Generación del conjunto de datos para la tabla y la gráfica
        for (let x = xMin; x <= xMax; x += step) {
            // Corrige la imprecisión de los decimales de JavaScript (ej. 0.1 + 0.2)
            let currentX = Math.round(x * 100000) / 100000;
            let y = evalFunc(func, currentX);
            
            let obs = "-";
            let highlight = false;
            
            // Detección automática de raíces exactas o cambios de signo (posibles raíces)
            if (y === 0) {
                obs = "🎯 Raíz";
                highlight = true;
            } else if (previousY !== null && ((previousY > 0 && y < 0) || (previousY < 0 && y > 0))) {
                obs = "⚠️ Cambio de signo";
                highlight = true;
            }

            xValues.push(currentX);
            yValues.push(y);
            
            let rowData = [currentX, y, obs];
            if (highlight) rowData.highlight = true;
            rows.push(rowData);

            previousY = y;
        }

        renderTable('graf-result', ['Coordenada X', 'f(X)', 'Observación'], rows);

        // Preparación del canvas de Chart.js
        document.getElementById('chart-wrapper').style.display = 'block';
        const ctx = document.getElementById('graficaCanvas').getContext('2d');
        
        // Es vital destruir la gráfica anterior antes de dibujar una nueva para que no se superpongan o parpadeen
        if (currentChart) {
            currentChart.destroy();
        }

        // Configuración y renderizado de Chart.js
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xValues,
                datasets: [{
                    label: `f(x) = ${func}`,
                    data: yValues,
                    borderColor: '#00d4ff', // Estilo cyberpunk / neón
                    backgroundColor: 'rgba(0, 212, 255, 0.2)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#ff6b6b',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
                },
                plugins: {
                    legend: { labels: { color: '#fff' } }
                }
            }
        });

    } catch (e) {
        // En caso de error (ej. función mal escrita), oculta la gráfica para no mostrar basura
        document.getElementById('chart-wrapper').style.display = 'none';
        showError('graf-error', 'Error: ' + e.message);
    }
}
