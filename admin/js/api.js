(function () {
    const cfg = window.CYBI_ADMIN;

    async function request(path, options) {
        const opts = options || {};
        const headers = Object.assign({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + window.CybiAuth.getToken()
        }, opts.headers || {});

        const respuesta = await fetch(cfg.API + path, Object.assign({}, opts, { headers }));

        if (respuesta.status === 401) {
            window.CybiAuth.clearSession();
            location.replace('index.html?expired=1');
            throw new Error('Sesión expirada');
        }

        if (!respuesta.ok) {
            const body = await respuesta.json().catch(() => ({}));
            throw new Error(body.error || 'Error de servidor (' + respuesta.status + ')');
        }

        return respuesta.json();
    }

    window.CybiApi = {
        stats: function () { return request('/stats'); },
        chat: function (chatId) { return request('/chat/' + encodeURIComponent(chatId)); },
        actualizarEstado: function (statId, estado, notasAdmin) {
            return request('/stats/' + encodeURIComponent(statId) + '/estado', {
                method: 'PUT',
                body: JSON.stringify({ estado: estado, notasAdmin: notasAdmin || '' })
            });
        },
        // Síntesis opcional del PDF. POST /informe/resumen
        // Cuerpo: { codigo, emitidoEn, zonaHoraria, filtros, indicadores, distribucion, expedientes }
        // expedientes[].mensajes = [{ rol, fecha, texto }] (sin mensajes de sistema).
        // Respuesta: { resumen: string, recomendaciones?: string[] }
        // Si la ruta todavía no existe, el PDF se emite igual y arma la síntesis en el panel.
        resumenInforme: async function (payload, signal) {
            const respuesta = await fetch(cfg.API + '/informe/resumen', {
                method: 'POST',
                signal: signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + window.CybiAuth.getToken()
                },
                body: JSON.stringify(payload || {})
            });
            const crudo = await respuesta.text();
            let body = {};
            if (crudo) {
                try { body = JSON.parse(crudo); }
                catch (e) { body = { resumen: crudo }; }
            }
            if (!respuesta.ok) {
                const error = new Error((body && body.error) || 'Sin síntesis');
                error.status = respuesta.status;
                throw error;
            }
            return body;
        }
    };
})();
