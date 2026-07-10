// ==========================================
// 📊 MOTOR AVANZADO DEL PANEL DE ADMINISTRACIÓN 📊
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    const API_BASE_URL = 'https://cibybackend.onrender.com/api/admin';
    const API_STATS_URL = `${API_BASE_URL}/stats`;
    const API_CHAT_URL = `${API_BASE_URL}/chat`; 
    const API_UPDATE_URL = `${API_BASE_URL}/stats`; 

    // Referencias DOM
    const countAlumnos = document.getElementById('count-alumnos');
    const countCasos = document.getElementById('count-casos');
    const countEdad = document.getElementById('count-edad');
    const countPendientes = document.getElementById('count-pendientes');
    const dataAlert = document.getElementById('data-alert');
    const cityFilter = document.getElementById('city-filter');
    const tablaDatosBody = document.getElementById('tabla-datos-body');

    // Referencias Modal
    const chatModal = document.getElementById('chat-modal');
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatModalIdOculto = document.getElementById('chat-modal-id-oculto');

    // Variables globales
    let riesgosChartObj = null;
    let severidadChartObj = null;
    let ciudadesChartObj = null;
    let datosCrudos = [];

    const colores = {
        blue: '#1877F2',
        cyan: '#00E5FF',
        gold: '#FFD54F',
        red: '#FF5252',
        dark: '#0B2046',
        gray: '#64748B'
    };

    // ==========================================
    // 🔐 SISTEMA DE LOGIN DEL FRONTEND 🔐
    // ==========================================
    window.verificarAcceso = async function() {
        const passInput = document.getElementById('admin-pass');
        const overlay = document.getElementById('login-overlay');
        const errorMsg = document.getElementById('login-error');
        
        try {
            const respuesta = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passInput.value })
            });

            const data = await respuesta.json();

            if (data.success) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    window.cargarEstadisticasYDatos(); 
                }, 500);
            } else {
                errorMsg.style.display = 'block';
                passInput.value = '';
                passInput.focus();
            }
        } catch (error) {
            console.error("Error de autenticación:", error);
            errorMsg.textContent = "Error conectando con el servidor.";
            errorMsg.style.display = 'block';
        }
    };

    const passInput = document.getElementById('admin-pass');
    if (passInput) {
        passInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') window.verificarAcceso();
        });
    }

    // ==========================================
    // OBTENER DATOS DE LA BASE DE DATOS
    // ==========================================
    window.cargarEstadisticasYDatos = async function() {
        try {
            if(dataAlert) dataAlert.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando con el servidor central...';
            
            const respuesta = await fetch(API_STATS_URL);
            if (!respuesta.ok) throw new Error('Error en el servidor');

            datosCrudos = await respuesta.json();
            
            if (datosCrudos.length === 0) {
                if(dataAlert) dataAlert.innerHTML = '<i class="fa-solid fa-info-circle"></i> Aún no hay datos recolectados.';
                if(tablaDatosBody) tablaDatosBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay registros</td></tr>';
                return;
            }

            if(dataAlert) dataAlert.innerHTML = `<i class="fa-solid fa-check-circle"></i> Sistema Sincronizado. ${datosCrudos.length} registros oficiales.`;

            if(cityFilter) poblarFiltroCiudades(datosCrudos);
            procesarYRenderizarDashboard(datosCrudos);

        } catch (error) {
            console.error("Error cargando estadísticas:", error);
            if(dataAlert) {
                dataAlert.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error al conectar con la base de datos.';
                dataAlert.style.background = 'rgba(255, 0, 0, 0.1)';
                dataAlert.style.color = 'red';
            }
        }
    };

    // ==========================================
    // LÓGICA DE FILTRADO Y MATEMÁTICAS
    // ==========================================
    if (cityFilter) {
        cityFilter.addEventListener('change', (e) => {
            const ciudadSeleccionada = e.target.value;
            if (ciudadSeleccionada === 'all') {
                procesarYRenderizarDashboard(datosCrudos);
            } else {
                const datosFiltrados = datosCrudos.filter(d => 
                    d.ciudad && d.ciudad.toLowerCase() === ciudadSeleccionada
                );
                procesarYRenderizarDashboard(datosFiltrados);
            }
        });
    }

    function poblarFiltroCiudades(datos) {
        const ciudadesUnicas = new Set();
        datos.forEach(d => {
            if (d.ciudad && d.ciudad !== 'No especificado') ciudadesUnicas.add(d.ciudad.toLowerCase());
        });

        const seleccionActual = cityFilter.value;
        cityFilter.innerHTML = '<option value="all">Todas</option>';
        
        ciudadesUnicas.forEach(ciudad => {
            const nombreMostrar = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
            cityFilter.innerHTML += `<option value="${ciudad}">${nombreMostrar}</option>`;
        });

        if([...cityFilter.options].some(o => o.value === seleccionActual)) {
            cityFilter.value = seleccionActual;
        }
    }

    function procesarYRenderizarDashboard(datos) {
        // Solo contamos para estadísticas globales los que NO están rechazados
        const datosValidos = datos.filter(d => d.estado !== 'rechazado');
        
        let totalAlumnos = datosValidos.length;
        let totalCasos = 0;
        let casosPendientes = datos.filter(d => d.estado === 'pendiente').length; 
        let sumaEdades = 0;
        let contadorEdadesValidas = 0;

        const mapaRiesgos = { ciberbullying: 0, sexting: 0, phishing: 0, grooming: 0, sextorsion: 0 };
        const mapaCiudades = {};

        datosValidos.forEach(stat => {
            // Edades
            if (stat.edad && stat.edad >= 5 && stat.edad <= 99) {
                sumaEdades += stat.edad;
                contadorEdadesValidas++;
            }

            // Riesgos
            let tieneRiesgo = false;
            if (stat.riesgosDetectados && Array.isArray(stat.riesgosDetectados)) {
                stat.riesgosDetectados.forEach(r => {
                    const riesgo = r.toLowerCase();
                    if (mapaRiesgos[riesgo] !== undefined) { mapaRiesgos[riesgo]++; tieneRiesgo = true; } 
                    else if (riesgo === 'sextorsión' || riesgo === 'sextorsion') { mapaRiesgos.sextorsion++; tieneRiesgo = true; }
                });
            }
            if (tieneRiesgo) totalCasos++;

            // Ciudades
            const city = stat.ciudad ? stat.ciudad.toLowerCase() : 'desconocido';
            mapaCiudades[city] = (mapaCiudades[city] || 0) + 1;
        });

        let edadPromedio = contadorEdadesValidas > 0 ? (sumaEdades / contadorEdadesValidas).toFixed(1) : 0;

        animarContador(countAlumnos, totalAlumnos);
        animarContador(countCasos, totalCasos);
        animarContador(countEdad, parseFloat(edadPromedio));
        if(countPendientes) animarContador(countPendientes, casosPendientes);

        // Renderizar tabla con TODOS los datos (aprobados, pendientes, rechazados)
        renderizarTablaModeracion(datos);

        if(document.getElementById('riesgosChart')) dibujarGraficoRiesgos(mapaRiesgos);
        if(document.getElementById('ciudadesChart')) dibujarGraficoCiudades(mapaCiudades);
    }

    // ==========================================
    // RENDERIZADO DE TABLA Y MODAL (NUEVO)
    // ==========================================
    
    function renderizarTablaModeracion(datos) {
        if (!tablaDatosBody) return;
        tablaDatosBody.innerHTML = '';

        datos.forEach(stat => {
            const fecha = new Date(stat.createdAt).toLocaleDateString('es-PY');
            const riesgos = stat.riesgosDetectados && stat.riesgosDetectados.length > 0 ? stat.riesgosDetectados.join(', ') : 'Ninguno';
            
            let badgeClass = 'badge-pendiente';
            if (stat.estado === 'aprobado') badgeClass = 'badge-aprobado';
            if (stat.estado === 'rechazado') badgeClass = 'badge-rechazado';
            
            const ciudadText = stat.ciudad || 'No disp.';
            const colegioText = stat.colegio || 'No disp.';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fecha}</td>
                <td><strong>${ciudadText}</strong><br><span style="font-size: 0.85rem; color: var(--text-light);">${colegioText}</span></td>
                <td>${stat.edad || '-'}</td>
                <td style="text-transform: capitalize;">${riesgos}</td>
                <td><span class="badge ${badgeClass}">${stat.estado.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="window.abrirChatModal('${stat.chatId}', '${stat._id}')">
                        <i class="fa-solid fa-eye"></i> Revisar
                    </button>
                </td>
            `;
            tablaDatosBody.appendChild(tr);
        });
    }

    window.abrirChatModal = async function(chatId, statId) {
        if (!chatModal || !chatMessagesContainer) return;
        
        chatModalIdOculto.innerText = statId;
        chatMessagesContainer.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br>Cargando conversación...</div>';
        chatModal.style.display = 'flex';

        try {
            const respuesta = await fetch(`${API_CHAT_URL}/${chatId}`);
            if (!respuesta.ok) throw new Error('Error al obtener el chat');
            
            const data = await respuesta.json();
            chatMessagesContainer.innerHTML = ''; // Limpiar loader

            if (data.alertaRoja) {
                chatMessagesContainer.innerHTML += `
                    <div style="background: #FFCDD2; color: #C62828; padding: 10px; border-radius: 10px; text-align: center; font-weight: bold; margin-bottom: 15px;">
                        <i class="fa-solid fa-triangle-exclamation"></i> ALERTA ROJA DETECTADA POR LA IA EN ESTE CHAT
                    </div>
                `;
            }

            data.messages.forEach(msg => {
                // Evitamos mostrar el prompt del sistema
                if (msg.role === 'system') return; 

                const div = document.createElement('div');
                div.className = `msg-bubble ${msg.role === 'user' ? 'msg-user' : 'msg-bot'}`;
                
                // Formatear texto (saltos de línea)
                let texto = msg.content.replace(/\n/g, '<br>');
                div.innerHTML = texto;
                chatMessagesContainer.appendChild(div);
            });

            // Scroll al final
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

        } catch (error) {
            console.error("Error al cargar chat:", error);
            chatMessagesContainer.innerHTML = '<div style="color: red; text-align:center;">Error al cargar el historial del chat.</div>';
        }
    };

    window.cerrarChatModal = function() {
        if (chatModal) chatModal.style.display = 'none';
    };

    window.cambiarEstadoChat = async function(nuevoEstado) {
        const statId = chatModalIdOculto.innerText;
        if (!statId) return;

        try {
            const respuesta = await fetch(`${API_UPDATE_URL}/${statId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!respuesta.ok) throw new Error('Error al actualizar estado');

            // Cierra modal y recarga datos
            cerrarChatModal();
            window.cargarEstadisticasYDatos();

        } catch (error) {
            console.error("Error actualizando estado:", error);
            alert("Hubo un error al actualizar el estado de este registro.");
        }
    };


    // ==========================================
    // RENDERIZADO DE GRÁFICOS
    // ==========================================
    const opcionesGlobales = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Segoe UI' } } } } };

    function dibujarGraficoRiesgos(mapa) {
        const ctx = document.getElementById('riesgosChart').getContext('2d');
        if(riesgosChartObj) riesgosChartObj.destroy();
        riesgosChartObj = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Ciberbullying', 'Sexting', 'Phishing', 'Grooming', 'Sextorsión'], datasets: [{ label: 'Casos Detectados', data: [mapa.ciberbullying, mapa.sexting, mapa.phishing, mapa.grooming, mapa.sextorsion], backgroundColor: [colores.blue, colores.cyan, colores.gold, colores.dark, colores.red], borderRadius: 8 }] },
            options: { ...opcionesGlobales, plugins: { legend: { display: false } } }
        });
    }

    function dibujarGraficoCiudades(mapa) {
        const ctx = document.getElementById('ciudadesChart').getContext('2d');
        if(ciudadesChartObj) ciudadesChartObj.destroy();
        const labels = Object.keys(mapa).map(c => c.charAt(0).toUpperCase() + c.slice(1));
        const data = Object.values(mapa);
        ciudadesChartObj = new Chart(ctx, {
            type: 'pie',
            data: { labels: labels, datasets: [{ data: data, backgroundColor: [colores.blue, colores.cyan, colores.gold, colores.dark, colores.gray], borderWidth: 2 }] },
            options: opcionesGlobales
        });
    }

    // ==========================================
    // ESCUDO ANTI-CRASHEO PARA EL CONTADOR
    // ==========================================
    function animarContador(elemento, valorFinal) {
        if (!elemento) return; 

        let valorActual = 0;
        const duracion = 1000;
        const incremento = valorFinal / (duracion / 16); 

        function actualizar() {
            valorActual += incremento;
            if (valorActual < valorFinal) {
                elemento.textContent = valorFinal % 1 !== 0 ? valorActual.toFixed(1) : Math.ceil(valorActual);
                requestAnimationFrame(actualizar);
            } else {
                elemento.textContent = valorFinal;
            }
        }
        if (valorFinal > 0) actualizar();
        else elemento.textContent = 0;
    }
});