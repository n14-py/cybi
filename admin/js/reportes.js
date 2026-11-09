(function () {
    let crudos = [];
    let charts = [];

    function destruir() {
        charts.forEach(function (c) { c.destroy(); });
        charts = [];
    }

    function miniChart(id, labels, values, type) {
        const el = document.getElementById(id);
        if (!el) return;
        charts.push(new Chart(el.getContext('2d'), {
            type: type || 'bar',
            data: { labels: labels, datasets: [{ data: values, backgroundColor: ['#2f7cf6', '#22d3ee', '#0b2046', '#f59e0b', '#10b981', '#ef4444'], borderColor: '#2f7cf6', fill: type === 'line', tension: 0.3, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    function pintarInforme(datos) {
        const r = window.CybiAnalytics.resumen(datos);
        const riesgos = window.CybiAnalytics.topN(window.CybiAnalytics.mapaRiesgos(datos), 6);
        const ciudades = window.CybiAnalytics.topN(window.CybiAnalytics.mapaCampo(datos, 'ciudad'), 6);
        const senales = window.CybiAnalytics.topN(window.CybiAnalytics.mapaSenales(datos), 6);
        const linea = window.CybiAnalytics.porDia(datos);

        document.getElementById('r-fecha').textContent = new Date().toLocaleString('es-PY');
        document.getElementById('r-rango').textContent = (document.getElementById('r-desde').value || 'inicio') + ' → ' + (document.getElementById('r-hasta').value || 'hoy');
        document.getElementById('rk-total').textContent = r.total;
        document.getElementById('rk-inc').textContent = r.incidencias;
        document.getElementById('rk-alertas').textContent = r.alertas;
        document.getElementById('rk-edad').textContent = r.edadPromedio;
        document.getElementById('rk-victimas').textContent = r.victimas;
        document.getElementById('rk-der').textContent = r.derivaciones;
        document.getElementById('rk-ok').textContent = r.aprobados;
        document.getElementById('rk-rev').textContent = r.pendientes;

        destruir();
        miniChart('rp-riesgos', riesgos.map(function (x) { return x.label; }), riesgos.map(function (x) { return x.value; }));
        miniChart('rp-ciudades', ciudades.map(function (x) { return x.label; }), ciudades.map(function (x) { return x.value; }), 'doughnut');
        miniChart('rp-tiempo', linea.labels, linea.values, 'line');

        document.getElementById('rt-riesgos').innerHTML = riesgos.map(function (x) { return `<tr><td>${x.label}</td><td>${x.value}</td></tr>`; }).join('') || '<tr><td colspan="2">Sin datos</td></tr>';
        document.getElementById('rt-ciudades').innerHTML = ciudades.map(function (x) { return `<tr><td>${x.label}</td><td>${x.value}</td></tr>`; }).join('') || '<tr><td colspan="2">Sin datos</td></tr>';
        document.getElementById('rt-senales').innerHTML = senales.map(function (x) { return `<tr><td>${x.label}</td><td>${x.value}</td></tr>`; }).join('') || '<tr><td colspan="2">Sin datos</td></tr>';
        document.getElementById('rt-casos').innerHTML = datos.slice(0, 40).map(function (d) {
            return `<tr><td>${d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-PY') : ''}</td><td>${d.ciudad || '—'}</td><td>${d.colegio || '—'}</td><td>${(d.riesgosDetectados || []).join(', ')}</td><td>${d.severidad || 1}</td><td>${d.estado}</td></tr>`;
        }).join('') || '<tr><td colspan="6">Sin casos en el período</td></tr>';
    }

    function filtrados() {
        return window.CybiAnalytics.filtrar(crudos, {
            desde: document.getElementById('r-desde').value,
            hasta: document.getElementById('r-hasta').value,
            estado: document.getElementById('r-estado').value
        });
    }

    async function cargar() {
        const status = document.getElementById('r-status');
        try {
            status.className = 'status';
            status.textContent = 'Preparando informe...';
            crudos = await window.CybiApi.stats();
            pintarInforme(filtrados());
            status.textContent = 'Informe listo. El PDF sale como documento completo: fecha de emisión, indicadores, todos los expedientes y las transcripciones.';
        } catch (err) {
            status.className = 'status bad';
            status.textContent = err.message;
        }
    }

    async function exportarPdf() {
        const btn = document.getElementById('btn-pdf');
        const status = document.getElementById('r-status');
        if (!btn || btn.disabled) return;
        if (!window.CybiInformePdf) {
            status.className = 'status bad';
            status.textContent = 'No se cargó el generador del documento.';
            return;
        }
        btn.disabled = true;
        try {
            const resultado = await window.CybiInformePdf.exportar({
                datos: filtrados(),
                filtros: {
                    desde: document.getElementById('r-desde').value,
                    hasta: document.getElementById('r-hasta').value,
                    estado: document.getElementById('r-estado').value
                },
                onProgress: function (mensaje) {
                    status.className = 'status';
                    status.textContent = mensaje;
                }
            });
            status.className = 'status';
            status.textContent = resultado.mensaje;
        } catch (err) {
            status.className = 'status bad';
            status.textContent = err.message || 'No se pudo emitir el PDF.';
        } finally {
            btn.disabled = false;
        }
    }

    window.recargarAdmin = cargar;

    document.addEventListener('DOMContentLoaded', function () {
        if (!window.CybiAuth.exigirSesion()) return;
        window.CybiLayout.render();
        ['r-desde', 'r-hasta', 'r-estado'].forEach(function (id) {
            document.getElementById(id).addEventListener('change', function () { pintarInforme(filtrados()); });
        });
        document.getElementById('btn-pdf').addEventListener('click', exportarPdf);
        document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
        document.getElementById('btn-csv-rep').addEventListener('click', function () {
            window.CybiAnalytics.descargar('cybi-informe.csv', window.CybiAnalytics.csv(filtrados()), 'text/csv;charset=utf-8');
        });
        cargar();
    });
})();
