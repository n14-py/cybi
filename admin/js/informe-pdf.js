(function () {
    var ML = 18;
    var ANCHO = 174;
    var DERECHA = ML + ANCHO;
    var LIMITE = 276;
    var Y0 = 22;
    var NAVY = [11, 32, 70];
    var RED = [153, 27, 36];
    var INK = [28, 32, 38];
    var MUTED = [82, 92, 107];
    var LINE = [214, 220, 228];
    var ZEBRA = [246, 248, 251];
    var GOLD = [146, 116, 62];
    var GREEN = [14, 90, 62];
    var BANDERA_ROJA = [213, 43, 30];
    var BANDERA_AZUL = [0, 56, 168];
    var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var CONOCIDOS = {
        _id: 1, id: 1, chatId: 1, createdAt: 1, updatedAt: 1, ciudad: 1, colegio: 1, curso: 1, edad: 1,
        riesgosDetectados: 1, senalesEmocionales: 1, severidad: 1, esVictimaAcoso: 1,
        derivacionRealizada: 1, estado: 1, motivoRevision: 1, notasAdmin: 1
    };

    function sanear(valor) {
        var s = String(valor == null ? '' : valor);
        s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, ' ');
        s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        s = s.replace(/[–—]/g, '-').replace(/…/g, '...');
        s = s.replace(/\u00A0/g, ' ').replace(/\u2212/g, '-');
        s = s.replace(/[^\n\x20-\xFF]/g, '');
        s = s.replace(/[\u007F-\u009F]/g, '');
        s = s.replace(/[^\s\n]{36,}/g, function (w) {
            var out = '';
            var buf = '';
            for (var i = 0; i < w.length; i++) {
                var ch = w.charAt(i);
                buf += ch;
                var corte = /[\/\-?&=._]/.test(ch);
                if ((buf.length >= 24 && corte) || buf.length >= 38) {
                    out += buf + '\n';
                    buf = '';
                }
            }
            return out + buf;
        });
        return s;
    }

    function entero(n) {
        var v = Math.round(Number(n) || 0);
        var neg = v < 0;
        var s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return neg ? '-' + s : s;
    }

    function decimal(n) {
        var v = Number(n);
        if (!isFinite(v)) return '0';
        var r = Math.round(v * 10) / 10;
        var neg = r < 0;
        var abs = Math.abs(r);
        var ent = Math.floor(abs + 1e-9);
        var frac = Math.round((abs - ent) * 10);
        if (frac === 10) { ent += 1; frac = 0; }
        var base = String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        var out = frac ? base + ',' + String(frac) : base;
        return neg ? '-' + out : out;
    }

    function porcentaje(parte, total) {
        if (!total) return '0%';
        var v = Math.round((Number(parte) / Number(total)) * 1000) / 10;
        if (Math.abs(v - Math.round(v)) < 0.001) return String(Math.round(v)) + '%';
        return v.toFixed(1).replace('.', ',') + '%';
    }

    function nomb(n, singular, plural) {
        return entero(n) + ' ' + (Number(n) === 1 ? singular : plural);
    }

    function enPalabras(n) {
        n = Math.floor(Math.abs(Number(n) || 0));
        var unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        var especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
        var decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        var veinti = { 1: 'veintiuno', 2: 'veintidós', 3: 'veintitrés', 4: 'veinticuatro', 5: 'veinticinco', 6: 'veintiséis', 7: 'veintisiete', 8: 'veintiocho', 9: 'veintinueve' };
        var centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

        function hasta999(x) {
            if (!x) return '';
            if (x === 100) return 'cien';
            if (x < 10) return unidades[x];
            if (x < 20) return especiales[x - 10];
            if (x < 30) return x === 20 ? 'veinte' : veinti[x - 20];
            if (x < 100) {
                var u = x % 10;
                return decenas[Math.floor(x / 10)] + (u ? ' y ' + unidades[u] : '');
            }
            var resto = x % 100;
            var cabeza = centenas[Math.floor(x / 100)];
            return resto ? cabeza + ' ' + hasta999(resto) : cabeza;
        }

        if (n < 1000) return hasta999(n) || 'cero';
        var miles = Math.floor(n / 1000);
        var restoMil = n % 1000;
        var parte = miles === 1 ? 'mil' : hasta999(miles) + ' mil';
        return restoMil ? parte + ' ' + hasta999(restoMil) : parte;
    }

    function diasEnPalabras(n) {
        if (n === 21) return 'veintiún';
        if (n === 31) return 'treinta y un';
        return enPalabras(n);
    }

    function partesMapa(date, locale, opciones) {
        var map = {};
        new Intl.DateTimeFormat(locale, opciones).formatToParts(date).forEach(function (p) {
            if (p.type !== 'literal') map[p.type] = p.value;
        });
        return map;
    }

    function relojAsuncion(date) {
        var map = partesMapa(date, 'en-CA', {
            timeZone: 'America/Asuncion',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hourCycle: 'h23'
        });
        if (map.hour === '24') map.hour = '00';
        return map;
    }

    function nombresAsuncion(date) {
        try {
            return partesMapa(date, 'es-PY', {
                timeZone: 'America/Asuncion',
                weekday: 'long',
                month: 'long',
                timeZoneName: 'shortOffset'
            });
        } catch (e) {
            return { weekday: '', month: '', timeZoneName: 'GMT-3' };
        }
    }

    function diaAsuncion(valor) {
        if (!valor) return '';
        var date = new Date(valor);
        if (isNaN(date.getTime())) return '';
        var map = relojAsuncion(date);
        if (!map.year || !map.month || !map.day) return '';
        return map.year + '-' + map.month + '-' + map.day;
    }

    function isoACorta(iso) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
        if (!m) return iso || '';
        return m[3] + '/' + m[2] + '/' + m[1];
    }

    function fechaCalendario(iso) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
        if (!m) return '';
        return Number(m[3]) + ' de ' + MESES[Number(m[2]) - 1] + ' de ' + m[1];
    }

    function formatearInstante(valor) {
        if (!valor) return '';
        var date = new Date(valor);
        if (isNaN(date.getTime())) return sanear(valor);
        var r = relojAsuncion(date);
        var n = nombresAsuncion(date);
        var weekday = String(n.weekday || '').toLocaleLowerCase('es');
        var month = String(n.month || '').toLocaleLowerCase('es');
        var cabeza = weekday ? weekday + ' ' : '';
        return cabeza + Number(r.day) + ' de ' + month + ' de ' + r.year + ', ' + r.hour + ':' + r.minute + ' h';
    }

    function armarFecha(date) {
        var r = relojAsuncion(date);
        var n = nombresAsuncion(date);
        var weekday = String(n.weekday || '').toLocaleLowerCase('es');
        var month = String(n.month || MESES[Number(r.month) - 1] || '').toLocaleLowerCase('es');
        var tz = String(n.timeZoneName || 'GMT-3').replace('−', '-');
        var dia = Number(r.day);
        var anio = Number(r.year);
        var acta;
        if (dia === 1) acta = 'Al primer (1) día';
        else acta = 'A los ' + diasEnPalabras(dia) + ' (' + dia + ') días';
        acta += ' del mes de ' + month + ' del año ' + enPalabras(anio) + ' (' + anio + ').';
        var hoy = 'Hoy, ' + (weekday ? weekday + ' ' : '') + dia + ' de ' + month + ' de ' + anio + ', a las ' + r.hour + ':' + r.minute + ' horas.';
        return {
            codigo: 'CYBI-INF-' + r.year + r.month + r.day + '-' + r.hour + r.minute + r.second,
            fechaHoy: hoy,
            fechaCierre: 'hoy ' + (weekday ? weekday + ' ' : '') + dia + ' de ' + month + ' de ' + anio + ', a las ' + r.hour + ':' + r.minute + ' horas',
            fechaActa: acta,
            fechaTabla: 'Hoy, ' + (weekday ? weekday + ' ' : '') + dia + ' de ' + month + ' de ' + anio,
            horaTabla: r.hour + ':' + r.minute + ':' + r.second + ' (hora de Asunción, ' + tz + ')',
            fechaCorta: r.day + '/' + r.month + '/' + r.year,
            iso: date.toISOString(),
            tz: tz
        };
    }

    function idDe(valor) {
        if (valor == null || valor === '') return '';
        if (typeof valor === 'string' || typeof valor === 'number') return String(valor);
        if (typeof valor === 'object') {
            if (valor.$oid) return String(valor.$oid);
            if (valor.toString && valor.toString !== Object.prototype.toString) {
                var s = valor.toString();
                if (s && s !== '[object Object]') return s;
            }
        }
        return '';
    }

    function estadoTexto(estado) {
        var k = String(estado || '').toLowerCase();
        if (k === 'aprobado') return 'Aprobado';
        if (k === 'pendiente') return 'En revisión';
        if (k === 'rechazado') return 'Rechazado';
        if (!k) return 'No consta';
        return String(estado);
    }

    function estadoFiltro(estado) {
        var map = {
            all: 'Todos los estados',
            aprobado: 'Solo aprobados',
            pendiente: 'Solo en revisión',
            rechazado: 'Solo rechazados'
        };
        return map[estado] || (estado ? String(estado) : 'Todos los estados');
    }

    function severidadTexto(n) {
        var s = Math.min(5, Math.max(1, Number(n || 1)));
        var map = { 1: 'Leve', 2: 'Baja', 3: 'Moderada', 4: 'Alta', 5: 'Crítica' };
        return s + ' · ' + (map[s] || 'Sin escala');
    }

    function siNo(v) {
        if (v === true) return 'Sí';
        if (v === false) return 'No';
        return 'No consta';
    }

    function valorCampo(v) {
        if (v == null || v === '') return 'No consta';
        if (typeof v === 'boolean') return v ? 'Sí' : 'No';
        if (typeof v === 'number') return String(v);
        if (Array.isArray(v)) {
            if (!v.length) return 'No consta';
            return v.map(function (item) {
                if (item == null || item === '') return '';
                if (typeof item === 'string' || typeof item === 'number') return String(item);
                try { return JSON.stringify(item); } catch (e) { return ''; }
            }).filter(Boolean).join(', ') || 'No consta';
        }
        if (typeof v === 'object') {
            try { return JSON.stringify(v, null, 2); } catch (e) { return 'No consta'; }
        }
        return String(v);
    }

    function etiquetaFormal(texto) {
        var menores = { de: 1, del: 1, la: 1, las: 1, los: 1, y: 1, e: 1, o: 1, u: 1, en: 1, el: 1, al: 1 };
        return String(texto || '').replace(/_/g, ' ').trim().toLocaleLowerCase('es').split(/\s+/).map(function (w, i) {
            if (!w) return '';
            if (i > 0 && menores[w]) return w;
            return w.charAt(0).toLocaleUpperCase('es') + w.slice(1);
        }).join(' ');
    }

    function esSinDato(item) {
        var k = String(item && item.key || '').toLowerCase().replace(/\s+/g, ' ');
        return k === 'sin dato' || k === 'sin_dato' || k === 'sindato';
    }

    function ranking(mapa) {
        var claves = Object.keys(mapa || {});
        if (!claves.length || !window.CybiAnalytics) return [];
        return window.CybiAnalytics.topN(mapa, claves.length).map(function (item) {
            return { key: item.key, label: etiquetaFormal(String(item.key || '').replace(/_/g, ' ')), value: item.value };
        });
    }

    function listaNatural(items) {
        if (!items.length) return '';
        if (items.length === 1) return items[0];
        if (items.length === 2) return items[0] + ' y ' + items[1];
        return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
    }

    function fraseTope(lista, textos) {
        var reales = (lista || []).filter(function (item) { return !esSinDato(item); });
        var vacio = (lista || []).filter(esSinDato)[0];
        var partes = [];
        if (!reales.length) {
            if (vacio) partes.push(textos.vacio(vacio.value));
            return partes.join(' ');
        }
        var maximo = reales[0].value;
        var top = reales.filter(function (item) { return item.value === maximo; });
        if (top.length === 1) partes.push(textos.uno(top[0]));
        else if (maximo === 1) partes.push(textos.unaVez(top.length));
        else {
            var mostrados = top.slice(0, 3).map(function (item) { return '«' + item.label + '»'; });
            var nombres = listaNatural(mostrados);
            if (top.length > 3) nombres += ', entre otras,';
            partes.push(textos.varios(nombres, maximo));
        }
        if (vacio) partes.push(textos.vacio(vacio.value));
        return partes.join(' ');
    }

    function estadisticaEdad(datos) {
        var suma = 0;
        var n = 0;
        var fuera = 0;
        var sin = 0;
        (datos || []).forEach(function (d) {
            if (!d || d.estado === 'rechazado') return;
            if (d.edad && d.edad >= 10 && d.edad <= 19) {
                suma += Number(d.edad);
                n += 1;
            } else if (d.edad) fuera += 1;
            else sin += 1;
        });
        return { promedio: n ? Math.round((suma / n) * 10) / 10 : 0, n: n, fuera: fuera, sin: sin };
    }

    function textoMensaje(m) {
        if (m == null) return '';
        if (typeof m === 'string') return m;
        var c = m.content != null ? m.content : (m.texto != null ? m.texto : (m.text != null ? m.text : (m.message != null ? m.message : m.body)));
        if (typeof c === 'string') return c;
        if (Array.isArray(c)) {
            return c.map(function (p) {
                if (typeof p === 'string') return p;
                if (p && typeof p.text === 'string') return p.text;
                if (p && typeof p.content === 'string') return p.content;
                return '';
            }).filter(Boolean).join('\n');
        }
        if (c && typeof c === 'object') {
            try { return JSON.stringify(c); } catch (e) { return ''; }
        }
        return c == null ? '' : String(c);
    }

    function rolMensaje(role) {
        var r = String(role || '').toLowerCase();
        if (r === 'user' || r === 'usuario' || r === 'human') return 'persona';
        if (r === 'assistant' || r === 'bot' || r === 'cybi' || r === 'ai' || r === 'model') return 'cybi';
        return r || 'otro';
    }

    function quienMensaje(rol) {
        if (rol === 'persona') return 'Persona entrevistada';
        if (rol === 'cybi') return 'Cybi';
        return 'Registro (' + rol + ')';
    }

    function instanteMensaje(m) {
        if (!m || typeof m !== 'object') return '';
        var claves = ['createdAt', 'created_at', 'timestamp', 'fecha', 'date', 'time', 'at'];
        for (var i = 0; i < claves.length; i++) {
            if (m[claves[i]]) return m[claves[i]];
        }
        return '';
    }

    function textoVisible(original, vacio) {
        var s = sanear(original).trim();
        if (s) return s;
        if (String(original || '').trim()) return 'El mensaje usa signos que este documento no puede reproducir.';
        return vacio || 'Mensaje sin texto.';
    }

    function normalizarChat(entrada) {
        if (!entrada) return { estado: 'sin_chat', error: '', omitidosSistema: 0, mensajes: [], alertaRoja: null };
        if (!entrada.ok) {
            return { estado: 'error', error: entrada.error || 'No disponible', omitidosSistema: 0, mensajes: [], alertaRoja: null };
        }
        var chat = entrada.chat || {};
        var lista = Array.isArray(chat) ? chat : (chat.messages || chat.mensajes || []);
        var omitidos = 0;
        var mensajes = [];
        lista.forEach(function (m) {
            var role = m && (m.role || m.rol || '');
            if (String(role).toLowerCase() === 'system') {
                omitidos += 1;
                return;
            }
            var rol = rolMensaje(role);
            var cuandoRaw = instanteMensaje(m);
            mensajes.push({
                rol: rol,
                quien: quienMensaje(rol),
                cuando: cuandoRaw ? formatearInstante(cuandoRaw) : '',
                fecha: cuandoRaw || '',
                texto: textoVisible(textoMensaje(m))
            });
        });
        var alerta = null;
        if (chat && !Array.isArray(chat)) {
            if (chat.alertaRoja === true || chat.alerta_roja === true) alerta = true;
            else if (chat.alertaRoja === false || chat.alerta_roja === false) alerta = false;
        }
        return {
            estado: mensajes.length ? 'ok' : 'vacia',
            error: '',
            omitidosSistema: omitidos,
            mensajes: mensajes,
            alertaRoja: alerta
        };
    }

    function otrosCampos(d) {
        var salida = [];
        if (!d || typeof d !== 'object') return salida;
        Object.keys(d).sort().forEach(function (k) {
            if (CONOCIDOS[k] || k.charAt(0) === '_' || k.charAt(0) === '$') return;
            var v = d[k];
            if (typeof v === 'function' || v == null || v === '') return;
            if (Array.isArray(v) && !v.length) return;
            var texto;
            if (typeof v === 'string' && /fecha|date|At$|time/i.test(k) && /T|\d{4}-\d{2}-\d{2}/.test(v) && !isNaN(new Date(v).getTime())) {
                texto = formatearInstante(v);
            } else texto = valorCampo(v);
            if (!texto || texto === 'No consta') return;
            salida.push({ etiqueta: k, valor: texto });
        });
        return salida;
    }

    function construirExpedientes(datos, chats) {
        var lista = (datos || []).slice().sort(function (a, b) {
            var sev = Number(b.severidad || 1) - Number(a.severidad || 1);
            if (sev) return sev;
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        return lista.map(function (d, i) {
            var chatId = idDe(d.chatId);
            var transcripcion = chatId ? normalizarChat(chats[chatId]) : normalizarChat(null);
            return {
                numero: String(i + 1).padStart(Math.max(2, String(lista.length).length), '0'),
                total: lista.length,
                id: idDe(d._id) || idDe(d.id),
                chatId: chatId,
                fechaLarga: d.createdAt ? formatearInstante(d.createdAt) : 'No consta',
                fechaCorta: d.createdAt ? (isoACorta(diaAsuncion(d.createdAt)) || 's/d') : 's/d',
                actualizacion: d.updatedAt ? formatearInstante(d.updatedAt) : '',
                ciudad: d.ciudad || '',
                colegio: d.colegio || '',
                curso: d.curso || '',
                edad: d.edad == null || d.edad === '' ? null : d.edad,
                severidad: Number(d.severidad || 1),
                severidadTexto: severidadTexto(d.severidad),
                estado: d.estado || '',
                estadoTexto: estadoTexto(d.estado),
                victima: d.esVictimaAcoso,
                derivacion: d.derivacionRealizada,
                alertaRoja: transcripcion.alertaRoja,
                riesgos: d.riesgosDetectados || [],
                senales: d.senalesEmocionales || [],
                motivo: d.motivoRevision || '',
                notas: d.notasAdmin || '',
                otros: otrosCampos(d),
                transcripcion: transcripcion
            };
        });
    }

    function parrafosSintesis(v) {
        var p = [];
        var periodo;
        if (v.filtros.desdeRaw || v.filtros.hastaRaw) {
            periodo = ' El período pedido va de ' + (v.filtros.desdeTxt || 'el primer registro disponible') + ' a ' + (v.filtros.hastaTxt || 'el momento de esta emisión') + '.';
        } else {
            periodo = ' No se aplicó un corte de fechas: entran los registros que deja pasar el estado elegido.';
        }
        p.push('Este informe consolida ' + nomb(v.total, 'entrevista anónima', 'entrevistas anónimas') + ' según el filtro de esta emisión.' + periodo + ' El corte de estado es «' + v.filtros.estadoTxt + '».');
        p.push('De ese universo ' + (Number(v.validos) === 1 ? 'queda' : 'quedan') + ' ' + entero(v.validos) + ' en un estado distinto de rechazado y ' + (Number(v.validos) === 1 ? 'es la base' : 'son la base') + ' de los cuadros de riesgos, zonas, instituciones, cursos y señales. En estado aprobado hay ' + entero(v.aprobados) + ', en revisión ' + entero(v.pendientes) + ' y rechazados ' + entero(v.rechazados) + '.');
        p.push('Las entrevistas válidas con al menos un riesgo digital son ' + entero(v.incidencias) + '. Las alertas, entendidas como severidad 4 o 5 sobre todo el filtro, son ' + entero(v.alertas) + '. Los casos de severidad 5 son ' + entero(v.criticos) + '. La severidad media de los registros válidos es ' + decimal(v.severidadPromedio) + ' sobre 5.');
        if (!v.alertas) {
            p.push('No hay alertas de severidad 4 o 5 en este filtro. Los registros válidos marcados como posible víctima de acoso son ' + entero(v.victimas) + '. Los que tienen derivación registrada hacia la línea 155 o un centro de salud son ' + entero(v.derivaciones) + '.');
        } else if (!v.alertasSinDerivacion) {
            p.push((Number(v.alertas) === 1 ? 'La alerta del filtro tiene derivación registrada.' : 'Las ' + entero(v.alertas) + ' alertas del filtro tienen derivación registrada.') + ' Los registros válidos marcados como posible víctima de acoso son ' + entero(v.victimas) + '. Los que tienen derivación registrada hacia la línea 155 o un centro de salud son ' + entero(v.derivaciones) + '.');
        } else if (Number(v.alertasSinDerivacion) === Number(v.alertas)) {
            p.push((Number(v.alertas) === 1 ? 'La alerta del filtro no tiene derivación registrada.' : 'Ninguna de las ' + entero(v.alertas) + ' alertas del filtro tiene derivación registrada.') + ' Los registros válidos marcados como posible víctima de acoso son ' + entero(v.victimas) + '. Los que tienen derivación registrada hacia la línea 155 o un centro de salud son ' + entero(v.derivaciones) + '.');
        } else {
            p.push('De las ' + entero(v.alertas) + ' alertas del filtro, ' + entero(v.alertasSinDerivacion) + ' no ' + (Number(v.alertasSinDerivacion) === 1 ? 'tiene' : 'tienen') + ' derivación registrada. Los registros válidos marcados como posible víctima de acoso son ' + entero(v.victimas) + '. Los que tienen derivación registrada hacia la línea 155 o un centro de salud son ' + entero(v.derivaciones) + '.');
        }
        if (!v.edad.n) {
            p.push('No hay edades declaradas entre 10 y 19 años entre los registros válidos, así que no se calcula promedio.' + (v.edad.sin ? ' Sin edad: ' + entero(v.edad.sin) + '.' : '') + (v.edad.fuera ? ' Fuera de ese rango: ' + entero(v.edad.fuera) + '.' : ''));
        } else {
            var edadTxt = 'La edad promedio es de ' + decimal(v.edad.promedio) + ' años, sobre ' + nomb(v.edad.n, 'edad declarada entre 10 y 19 años', 'edades declaradas entre 10 y 19 años') + '.';
            if (v.edad.fuera) edadTxt += ' Quedan fuera del promedio ' + nomb(v.edad.fuera, 'registro válido', 'registros válidos') + ' por tener una edad fuera de ese rango.';
            if (v.edad.sin) edadTxt += ' Sin edad declarada: ' + entero(v.edad.sin) + '.';
            p.push(edadTxt);
        }
        var lider = [
            fraseTope(v.riesgos, {
                uno: function (item) { return 'La mención de riesgo más frecuente es «' + item.label + '», con ' + nomb(item.value, 'mención', 'menciones') + '.'; },
                unaVez: function (n) { return 'Ninguna mención de riesgo se repite: hay ' + nomb(n, 'categoría distinta', 'categorías distintas') + '.'; },
                varios: function (nombres, maximo) { return nombres + ' comparten la mayor cantidad de menciones de riesgo, con ' + nomb(maximo, 'mención', 'menciones') + ' en cada caso.'; },
                vacio: function (n) { return 'En ' + nomb(n, 'registro válido', 'registros válidos') + ' el riesgo no trae un nombre utilizable.'; }
            }),
            fraseTope(v.ciudades, {
                uno: function (item) { return 'La ciudad con más registros válidos es «' + item.label + '», con ' + nomb(item.value, 'registro', 'registros') + '.'; },
                unaVez: function () { return 'Ninguna ciudad concentra más de un registro válido.'; },
                varios: function (nombres, maximo) { return nombres + ' comparten la mayor cantidad de registros válidos por ciudad, con ' + nomb(maximo, 'registro', 'registros') + ' en cada caso.'; },
                vacio: function (n) { return 'En ' + nomb(n, 'registro válido no consta la ciudad', 'registros válidos no consta la ciudad') + '.'; }
            }),
            fraseTope(v.colegios, {
                uno: function (item) { return 'La institución con más registros válidos es «' + item.label + '», con ' + nomb(item.value, 'registro', 'registros') + '.'; },
                unaVez: function () { return 'Ninguna institución concentra más de un registro válido.'; },
                varios: function (nombres, maximo) { return nombres + ' comparten la mayor cantidad de registros válidos por institución, con ' + nomb(maximo, 'registro', 'registros') + ' en cada caso.'; },
                vacio: function (n) { return 'En ' + nomb(n, 'registro válido no consta la institución', 'registros válidos no consta la institución') + '.'; }
            }),
            fraseTope(v.senales, {
                uno: function (item) { return 'La señal emocional más frecuente es «' + item.label + '», con ' + nomb(item.value, 'mención', 'menciones') + '.'; },
                unaVez: function () { return 'Ninguna señal emocional se repite.'; },
                varios: function (nombres, maximo) { return nombres + ' comparten la mayor cantidad de señales emocionales, con ' + nomb(maximo, 'mención', 'menciones') + ' en cada caso.'; },
                vacio: function (n) { return 'En ' + nomb(n, 'registro válido', 'registros válidos') + ' la señal no trae un nombre utilizable.'; }
            })
        ].filter(Boolean);
        p.push(lider.length ? lider.join(' ') : 'No hay una categoría con menciones para destacar. El detalle, si existe, está en los cuadros.');
        var integridad = 'Al cierre se recuperaron ' + entero(v.chatsOk) + ' de ' + entero(v.conChat) + ' ' + (Number(v.conChat) === 1 ? 'conversación asociada' : 'conversaciones asociadas') + ' a un expediente. ';
        if (!v.sinChat) integridad += 'Todos los expedientes tienen conversación vinculada. ';
        else if (Number(v.sinChat) === 1) integridad += '1 expediente no tiene conversación vinculada. ';
        else integridad += entero(v.sinChat) + ' expedientes no tienen conversación vinculada. ';
        if (v.chatsError) {
            integridad += (Number(v.chatsError) === 1 ? '1 conversación no pudo leerse y el anexo lo deja constar, sin completar el texto. ' : entero(v.chatsError) + ' conversaciones no pudieron leerse y el anexo lo deja constar, sin completar el texto. ');
        }
        integridad += 'Los mensajes transcriptos, sin contar los de sistema, son ' + entero(v.mensajes) + '. Los de sistema omitidos son ' + entero(v.omitidos) + '.';
        p.push(integridad);
        p.push('Cada cifra de esta síntesis sale de los registros incluidos en esta emisión. No se incorporaron casos, ciudades ni riesgos que no estuvieran guardados.');
        return p;
    }

    function serieDiaria(datos) {
        var mapa = {};
        var sinFecha = 0;
        (datos || []).forEach(function (d) {
            var dia = diaAsuncion(d && d.createdAt);
            if (!dia) { sinFecha += 1; return; }
            mapa[dia] = (mapa[dia] || 0) + 1;
        });
        var ac = 0;
        var filas = Object.keys(mapa).sort().map(function (k) {
            ac += mapa[k];
            return [isoACorta(k), entero(mapa[k]), entero(ac)];
        });
        return { filas: filas, sinFecha: sinFecha };
    }

    function filasConteo(lista, total) {
        return (lista || []).map(function (item) {
            return [item.label, entero(item.value), porcentaje(item.value, total)];
        });
    }

    function construirVista(datos, chats, filtros, ahora) {
        var lista = Array.isArray(datos) ? datos : [];
        var f = filtros || {};
        var fecha = armarFecha(ahora || new Date());
        var resumen = window.CybiAnalytics.resumen(lista);
        var edad = estadisticaEdad(lista);
        var expedientes = construirExpedientes(lista, chats || {});
        var riesgos = ranking(window.CybiAnalytics.mapaRiesgos(lista));
        var ciudades = ranking(window.CybiAnalytics.mapaCampo(lista, 'ciudad'));
        var colegios = ranking(window.CybiAnalytics.mapaCampo(lista, 'colegio'));
        var cursos = ranking(window.CybiAnalytics.mapaCampo(lista, 'curso'));
        var senales = ranking(window.CybiAnalytics.mapaSenales(lista));
        var sev = window.CybiAnalytics.mapaSeveridad(lista);
        var serie = serieDiaria(lista);
        var chatsOk = 0;
        var chatsError = 0;
        var sinChat = 0;
        var mensajes = 0;
        var mensajesPersona = 0;
        var mensajesCybi = 0;
        var omitidos = 0;
        expedientes.forEach(function (exp) {
            if (!exp.chatId) sinChat += 1;
            else if (exp.transcripcion.estado === 'error') chatsError += 1;
            else chatsOk += 1;
            omitidos += exp.transcripcion.omitidosSistema || 0;
            (exp.transcripcion.mensajes || []).forEach(function (m) {
                mensajes += 1;
                if (m.rol === 'persona') mensajesPersona += 1;
                else if (m.rol === 'cybi') mensajesCybi += 1;
            });
        });
        var alertasSinDerivacion = lista.filter(function (d) {
            return Number(d.severidad || 1) >= 4 && d.derivacionRealizada !== true;
        }).length;
        var vista = {
            codigo: fecha.codigo,
            fecha: fecha,
            filtros: {
                desdeRaw: f.desde || '',
                hastaRaw: f.hasta || '',
                estadoRaw: f.estado || 'all',
                desdeTxt: f.desde ? fechaCalendario(f.desde) : '',
                hastaTxt: f.hasta ? fechaCalendario(f.hasta) : '',
                estadoTxt: estadoFiltro(f.estado || 'all')
            },
            total: resumen.total,
            validos: resumen.validos,
            pendientes: resumen.pendientes,
            aprobados: resumen.aprobados,
            rechazados: resumen.rechazados,
            incidencias: resumen.incidencias,
            alertas: resumen.alertas,
            criticos: resumen.criticos,
            victimas: resumen.victimas,
            derivaciones: resumen.derivaciones,
            severidadPromedio: resumen.severidadPromedio,
            alertasSinDerivacion: alertasSinDerivacion,
            edad: edad,
            riesgos: riesgos,
            ciudades: ciudades,
            colegios: colegios,
            cursos: cursos,
            senales: senales,
            severidad: sev,
            serie: serie,
            expedientes: expedientes,
            conChat: expedientes.length - sinChat,
            chatsOk: chatsOk,
            chatsError: chatsError,
            sinChat: sinChat,
            mensajes: mensajes,
            mensajesPersona: mensajesPersona,
            mensajesCybi: mensajesCybi,
            omitidos: omitidos
        };
        vista.sintesis = parrafosSintesis(vista);
        return vista;
    }

    function lineas(ctx, texto, ancho, font, style, size) {
        ctx.pdf.setFont(font || 'times', style || 'normal');
        ctx.pdf.setFontSize(size || 10.5);
        var limpio = sanear(texto);
        if (!String(limpio).trim()) return [];
        var out = [];
        limpio.split('\n').forEach(function (parte) {
            var trozo = ctx.pdf.splitTextToSize(parte.trim() ? parte : ' ', Math.max(12, ancho));
            if (Array.isArray(trozo)) out = out.concat(trozo);
            else out.push(String(trozo));
        });
        return out;
    }

    function nuevaPagina(ctx) {
        ctx.pdf.addPage();
        encabezado(ctx);
        ctx.y = Y0;
    }

    function asegurar(ctx, alto) {
        if (ctx.y + alto <= ctx.limite) return;
        nuevaPagina(ctx);
    }

    function encabezado(ctx) {
        var pdf = ctx.pdf;
        pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
        pdf.rect(0, 0, 210, 12.2, 'F');
        pdf.setFillColor(BANDERA_ROJA[0], BANDERA_ROJA[1], BANDERA_ROJA[2]);
        pdf.rect(0, 12.2, 210, 1.15, 'F');
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 13.35, 210, 0.55, 'F');
        pdf.setFillColor(BANDERA_AZUL[0], BANDERA_AZUL[1], BANDERA_AZUL[2]);
        pdf.rect(0, 13.9, 210, 1.15, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('times', 'bold');
        pdf.setFontSize(8);
        pdf.text('REPÚBLICA DEL PARAGUAY', ML, 5.2);
        pdf.setFont('times', 'normal');
        pdf.setFontSize(7.5);
        pdf.text(sanear('Proyecto Cybi  ·  Informe técnico reservado'), ML, 9.3);
        pdf.setFont('times', 'bold');
        pdf.setFontSize(7.5);
        pdf.text(sanear(ctx.codigo || ''), DERECHA, 5.2, { align: 'right' });
        pdf.setFont('times', 'normal');
        pdf.text(sanear('CONFIDENCIAL  ·  ' + (ctx.fechaCorta || '')), DERECHA, 9.3, { align: 'right' });
    }

    function parrafo(ctx, texto, opt) {
        var o = opt || {};
        var size = o.size || 10.5;
        var style = o.style || 'normal';
        var font = o.font || 'times';
        var color = o.color || INK;
        var indent = o.indent || 0;
        var lh = size * 0.46;
        var ls = lineas(ctx, texto, ANCHO - indent, font, style, size);
        if (!ls.length) {
            ctx.y += 1.5;
            return;
        }
        ls.forEach(function (ln) {
            asegurar(ctx, lh + 0.4);
            ctx.pdf.setFont(font, style);
            ctx.pdf.setFontSize(size);
            ctx.pdf.setTextColor(color[0], color[1], color[2]);
            ctx.pdf.text(ln, ML + indent, ctx.y);
            ctx.y += lh;
        });
        ctx.y += o.despues != null ? o.despues : 2.3;
    }

    function nota(ctx, texto) {
        parrafo(ctx, texto, { size: 8.5, style: 'italic', color: MUTED, despues: 3 });
    }

    function viñeta(ctx, texto) {
        var size = 10.5;
        var lh = size * 0.46;
        var ls = lineas(ctx, texto, ANCHO - 6, 'times', 'normal', size);
        if (!ls.length) return;
        ls.forEach(function (ln, i) {
            asegurar(ctx, lh + 0.4);
            if (i === 0) {
                ctx.pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
                ctx.pdf.circle(ML + 1.3, ctx.y - 1.15, 0.55, 'F');
            }
            ctx.pdf.setFont('times', 'normal');
            ctx.pdf.setFontSize(size);
            ctx.pdf.setTextColor(INK[0], INK[1], INK[2]);
            ctx.pdf.text(ln, ML + 5, ctx.y);
            ctx.y += lh;
        });
        ctx.y += 1.4;
    }

    function subtitulo(ctx, texto) {
        var ls = lineas(ctx, texto, ANCHO, 'times', 'bold', 11.5);
        if (!ls.length) return;
        var lh = 5.1;
        asegurar(ctx, ls.length * lh + 5);
        ctx.y += 1.6;
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(11.5);
        ctx.pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        ls.forEach(function (ln) {
            ctx.pdf.text(ln, ML, ctx.y);
            ctx.y += lh;
        });
        ctx.y += 1.8;
    }

    function tituloSeccion(ctx, texto) {
        asegurar(ctx, 18);
        ctx.y += 2.5;
        ctx.pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
        ctx.pdf.rect(ML, ctx.y - 3.4, 2.3, 6.4, 'F');
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(13);
        ctx.pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        ctx.pdf.text(sanear(texto), ML + 5, ctx.y + 1.1);
        ctx.y += 4.4;
        ctx.pdf.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
        ctx.pdf.setLineWidth(0.35);
        ctx.pdf.line(ML, ctx.y, DERECHA, ctx.y);
        ctx.y += 4.6;
    }

    function cajas(ctx, items) {
        var cols = 4;
        var gap = 3;
        var w = (ANCHO - gap * (cols - 1)) / cols;
        var h = 18;
        items.forEach(function (item, i) {
            var col = i % cols;
            if (col === 0) asegurar(ctx, h + 3);
            var x = ML + col * (w + gap);
            var y = ctx.y;
            ctx.pdf.setFillColor(248, 249, 251);
            ctx.pdf.setDrawColor(LINE[0], LINE[1], LINE[2]);
            ctx.pdf.setLineWidth(0.2);
            ctx.pdf.rect(x, y, w, h, 'FD');
            ctx.pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
            ctx.pdf.rect(x, y, w, 1.25, 'F');
            ctx.pdf.setFont('times', 'normal');
            ctx.pdf.setFontSize(7);
            ctx.pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
            ctx.pdf.text(sanear(item.label), x + 2.2, y + 6.3);
            ctx.pdf.setFont('times', 'bold');
            ctx.pdf.setFontSize(13);
            ctx.pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
            ctx.pdf.text(sanear(item.value), x + 2.2, y + 13.6);
            if (col === cols - 1 || i === items.length - 1) ctx.y += h + 3;
        });
    }

    function tabla(ctx, columnas, filas) {
        if (!filas || !filas.length) {
            nota(ctx, 'Sin registros en este corte.');
            return;
        }
        var suma = columnas.reduce(function (a, c) { return a + c.ancho; }, 0) || ANCHO;
        var cols = columnas.map(function (c) {
            return { titulo: c.titulo, ancho: c.ancho * ANCHO / suma, align: c.align || 'left' };
        });
        var headH = 7.1;

        function dibujarCabeza() {
            var x = ML;
            ctx.pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
            ctx.pdf.rect(ML, ctx.y, ANCHO, headH, 'F');
            ctx.pdf.setFont('times', 'bold');
            ctx.pdf.setFontSize(7.5);
            ctx.pdf.setTextColor(255, 255, 255);
            cols.forEach(function (c) {
                var tx = c.align === 'right' ? x + c.ancho - 1.5 : x + 1.5;
                ctx.pdf.text(sanear(c.titulo), tx, ctx.y + 4.6, c.align === 'right' ? { align: 'right' } : undefined);
                x += c.ancho;
            });
            ctx.y += headH;
        }

        if (ctx.y + headH + 8 > ctx.limite) nuevaPagina(ctx);
        dibujarCabeza();
        filas.forEach(function (fila, idx) {
            var celdas = cols.map(function (c, i) {
                return lineas(ctx, fila[i] == null ? '' : fila[i], c.ancho - 3, 'times', 'normal', 8);
            });
            var n = 1;
            celdas.forEach(function (c) { n = Math.max(n, c.length || 1); });
            var rowH = Math.max(6.4, n * 3.55 + 2.2);
            if (ctx.y + rowH > ctx.limite) {
                nuevaPagina(ctx);
                dibujarCabeza();
            }
            if (idx % 2 === 0) {
                ctx.pdf.setFillColor(ZEBRA[0], ZEBRA[1], ZEBRA[2]);
                ctx.pdf.rect(ML, ctx.y, ANCHO, rowH, 'F');
            }
            ctx.pdf.setDrawColor(LINE[0], LINE[1], LINE[2]);
            ctx.pdf.setLineWidth(0.15);
            ctx.pdf.line(ML, ctx.y + rowH, DERECHA, ctx.y + rowH);
            var x = ML;
            ctx.pdf.setFont('times', 'normal');
            ctx.pdf.setFontSize(8);
            ctx.pdf.setTextColor(INK[0], INK[1], INK[2]);
            celdas.forEach(function (ls, i) {
                (ls.length ? ls : ['']).forEach(function (ln, li) {
                    var tx = cols[i].align === 'right' ? x + cols[i].ancho - 1.5 : x + 1.5;
                    ctx.pdf.text(ln, tx, ctx.y + 4.15 + li * 3.55, cols[i].align === 'right' ? { align: 'right' } : undefined);
                });
                x += cols[i].ancho;
            });
            ctx.y += rowH;
        });
        ctx.y += 3.2;
    }

    function campo(ctx, etiqueta, valor) {
        var lh = 4.15;
        var labelLines = lineas(ctx, String(etiqueta || '').toLocaleUpperCase('es'), 44, 'times', 'bold', 7.5);
        var valueLines = lineas(ctx, valorCampo(valor), 124, 'times', 'normal', 9.5);
        if (!labelLines.length) labelLines = [''];
        if (!valueLines.length) valueLines = ['No consta'];
        var n = Math.max(labelLines.length, valueLines.length);
        var h = n * lh + 1.5;
        asegurar(ctx, h + 0.4);
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(7.5);
        ctx.pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        labelLines.forEach(function (ln, i) {
            ctx.pdf.text(ln, ML, ctx.y + 3.5 + i * lh);
        });
        ctx.pdf.setFont('times', 'normal');
        ctx.pdf.setFontSize(9.5);
        ctx.pdf.setTextColor(INK[0], INK[1], INK[2]);
        valueLines.forEach(function (ln, i) {
            ctx.pdf.text(ln, ML + 48, ctx.y + 3.5 + i * lh);
        });
        ctx.y += h;
        ctx.pdf.setDrawColor(234, 237, 242);
        ctx.pdf.setLineWidth(0.12);
        ctx.pdf.line(ML, ctx.y, DERECHA, ctx.y);
    }

    function barraExpediente(ctx, exp) {
        asegurar(ctx, 16);
        var alta = Number(exp.severidad) >= 4;
        ctx.pdf.setFillColor(alta ? RED[0] : NAVY[0], alta ? RED[1] : NAVY[1], alta ? RED[2] : NAVY[2]);
        ctx.pdf.rect(ML, ctx.y, ANCHO, 8.2, 'F');
        ctx.pdf.setTextColor(255, 255, 255);
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(9);
        ctx.pdf.text(sanear('Expediente ' + exp.numero + ' de ' + String(exp.total).padStart(Math.max(2, String(exp.total).length), '0')), ML + 2.4, ctx.y + 5.3);
        ctx.pdf.text(sanear(exp.severidadTexto), DERECHA - 2.4, ctx.y + 5.3, { align: 'right' });
        ctx.y += 10.2;
    }

    function cajaFecha(ctx, modelo) {
        var bloques = [
            { texto: modelo.fecha.fechaHoy, size: 12, style: 'bold' },
            { texto: 'Se emite en la ciudad de Asunción, República del Paraguay.', size: 10, style: 'italic' },
            { texto: modelo.fecha.fechaActa, size: 10.5, style: 'italic' }
        ];
        var medidos = bloques.map(function (b) {
            return { lineas: lineas(ctx, b.texto, ANCHO - 12, 'times', b.style, b.size), size: b.size, style: b.style };
        });
        var h = 7;
        medidos.forEach(function (b, i) {
            h += Math.max(1, b.lineas.length) * (b.size * 0.48);
            if (i < medidos.length - 1) h += 1.5;
        });
        h += 2;
        asegurar(ctx, h + 2);
        var y = ctx.y;
        ctx.pdf.setFillColor(245, 247, 250);
        ctx.pdf.rect(ML, y, ANCHO, h, 'F');
        ctx.pdf.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
        ctx.pdf.rect(ML, y, 2.2, h, 'F');
        var yy = y + 6.2;
        medidos.forEach(function (b, i) {
            ctx.pdf.setFont('times', b.style);
            ctx.pdf.setFontSize(b.size);
            ctx.pdf.setTextColor(i === 0 ? NAVY[0] : INK[0], i === 0 ? NAVY[1] : INK[1], i === 0 ? NAVY[2] : INK[2]);
            (b.lineas.length ? b.lineas : ['']).forEach(function (ln) {
                ctx.pdf.text(ln, ML + 6, yy);
                yy += b.size * 0.48;
            });
            yy += 1.5;
        });
        ctx.y = y + h + 5;
    }

    function bloqueInicial(ctx, modelo) {
        var y0 = ctx.y;
        var logoOk = false;
        if (ctx.logo) {
            try {
                ctx.pdf.addImage(ctx.logo, formatoImagen(ctx.logo), ML, y0, 18, 18);
                logoOk = true;
            } catch (e) {
                logoOk = false;
            }
        }
        var x = logoOk ? ML + 22 : ML;
        var anchoTxt = logoOk ? ANCHO - 22 : ANCHO;
        var titulo = lineas(ctx, 'Informe técnico de inteligencia', anchoTxt, 'times', 'bold', 15);
        var yy = y0 + 6;
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(15);
        ctx.pdf.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        titulo.forEach(function (ln) {
            ctx.pdf.text(ln, x, yy);
            yy += 6.5;
        });
        ctx.pdf.setFont('times', 'normal');
        ctx.pdf.setFontSize(10);
        ctx.pdf.setTextColor(INK[0], INK[1], INK[2]);
        var sub = lineas(ctx, 'Entrevistas anónimas, riesgos digitales y uso interno del equipo', anchoTxt, 'times', 'normal', 10);
        sub.forEach(function (ln) {
            ctx.pdf.text(ln, x, yy);
            yy += 4.6;
        });
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(8.5);
        ctx.pdf.setTextColor(RED[0], RED[1], RED[2]);
        var conf = 'CONFIDENCIAL';
        var wConf = ctx.pdf.getTextWidth(conf);
        ctx.pdf.text(conf, x, yy);
        ctx.pdf.setFont('times', 'normal');
        ctx.pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        ctx.pdf.text(sanear('   ·   ' + modelo.codigo), x + wConf, yy);
        ctx.y = Math.max(yy + 4, y0 + (logoOk ? 22 : 16));
        ctx.pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
        ctx.pdf.setLineWidth(0.45);
        ctx.pdf.line(ML, ctx.y, DERECHA, ctx.y);
        ctx.pdf.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
        ctx.pdf.setLineWidth(0.25);
        ctx.pdf.line(ML, ctx.y + 1.15, DERECHA, ctx.y + 1.15);
        ctx.y += 6;
        cajaFecha(ctx, modelo);
    }

    function listaContenido(ctx) {
        var items = [
            'I. Objeto, alcance y método',
            'II. Resumen ejecutivo',
            'III. Indicadores del período',
            'IV. Distribución de los registros',
            'V. Registro de expedientes',
            'VI. Anexo. Transcripciones íntegras',
            'VII. Cierre de la emisión'
        ];
        var filas = Math.ceil(items.length / 2);
        asegurar(ctx, 8 + filas * 4.6);
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(8);
        ctx.pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        ctx.pdf.text('CONTENIDO', ML, ctx.y + 3);
        ctx.y += 6.5;
        ctx.pdf.setFont('times', 'normal');
        ctx.pdf.setFontSize(9);
        ctx.pdf.setTextColor(INK[0], INK[1], INK[2]);
        items.forEach(function (item, i) {
            var col = i % 2;
            var row = Math.floor(i / 2);
            ctx.pdf.text(sanear(item), ML + col * 88, ctx.y + row * 4.6);
        });
        ctx.y += filas * 4.6 + 3;
    }

    function volcarTexto(ctx, texto) {
        var limpio = String(texto || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '');
        var buffer = [];
        function flush() {
            if (!buffer.length) return;
            parrafo(ctx, buffer.join(' '));
            buffer = [];
        }
        limpio.split('\n').forEach(function (raw) {
            var t = raw.trim();
            if (!t) { flush(); return; }
            var h = t.match(/^#{1,3}\s+(.*)$/);
            if (h) { flush(); subtitulo(ctx, h[1]); return; }
            var b = t.match(/^[-*•]\s+(.*)$/);
            if (b) { flush(); viñeta(ctx, b[1]); return; }
            var n = t.match(/^\d+[.)]\s+(.*)$/);
            if (n) { flush(); viñeta(ctx, n[1]); return; }
            buffer.push(t);
        });
        flush();
    }

    function dibujarFicha(ctx, exp) {
        asegurar(ctx, 42);
        barraExpediente(ctx, exp);
        campo(ctx, 'Identificador', exp.id || 'No consta');
        campo(ctx, 'Conversación', exp.chatId || 'Sin conversación vinculada');
        campo(ctx, 'Fecha de registro', exp.fechaLarga);
        if (exp.actualizacion) campo(ctx, 'Actualización', exp.actualizacion);
        campo(ctx, 'Ciudad', exp.ciudad || 'No consta');
        campo(ctx, 'Institución', exp.colegio || 'No consta');
        campo(ctx, 'Curso', exp.curso || 'No consta');
        campo(ctx, 'Edad declarada', exp.edad == null ? 'No consta' : String(exp.edad));
        campo(ctx, 'Estado', exp.estadoTexto);
        campo(ctx, 'Severidad', exp.severidadTexto);
        campo(ctx, 'Posible víctima', siNo(exp.victima));
        campo(ctx, 'Derivación 155', siNo(exp.derivacion));
        campo(ctx, 'Alerta roja', siNo(exp.alertaRoja));
        campo(ctx, 'Riesgos', exp.riesgos);
        campo(ctx, 'Señales', exp.senales);
        campo(ctx, 'Motivo de revisión', exp.motivo || 'No consta');
        campo(ctx, 'Notas del equipo', exp.notas || 'No consta');
        exp.otros.forEach(function (otro) {
            campo(ctx, otro.etiqueta, otro.valor);
        });
        var cierre;
        if (!exp.chatId) cierre = 'No hay transcripción: este expediente no tiene conversación vinculada.';
        else if (exp.transcripcion.estado === 'error') cierre = 'La transcripción no pudo recuperarse al emitir. El anexo deja el motivo, sin completar mensajes.';
        else cierre = 'La transcripción íntegra está en el anexo, bajo el mismo número de expediente. Mensajes visibles: ' + entero(exp.transcripcion.mensajes.length) + '.';
        ctx.y += 1.6;
        parrafo(ctx, cierre, { size: 9, style: 'italic', color: MUTED, despues: 4 });
    }

    function dibujarMensaje(ctx, mensaje, indice) {
        var size = 10.5;
        var lh = size * 0.46;
        var cuerpo = lineas(ctx, mensaje.texto, ANCHO - 4, 'times', 'normal', size);
        if (!cuerpo.length) cuerpo = ['Mensaje sin texto.'];
        asegurar(ctx, lh * 2 + 6);
        var color = mensaje.rol === 'cybi' ? GREEN : (mensaje.rol === 'persona' ? NAVY : MUTED);
        ctx.pdf.setFillColor(color[0], color[1], color[2]);
        ctx.pdf.rect(ML, ctx.y - 2.5, 2.1, 2.1, 'F');
        ctx.pdf.setFont('times', 'bold');
        ctx.pdf.setFontSize(9);
        ctx.pdf.setTextColor(color[0], color[1], color[2]);
        var cabeza = 'Mensaje ' + String(indice).padStart(2, '0') + '  ·  ' + mensaje.quien;
        ctx.pdf.text(sanear(cabeza), ML + 4, ctx.y);
        ctx.y += 4.2;
        if (mensaje.cuando) {
            ctx.pdf.setFont('times', 'italic');
            ctx.pdf.setFontSize(8);
            ctx.pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
            ctx.pdf.text(sanear(mensaje.cuando), ML + 4, ctx.y);
            ctx.y += 4;
        }
        cuerpo.forEach(function (ln) {
            asegurar(ctx, lh + 0.3);
            ctx.pdf.setFont('times', 'normal');
            ctx.pdf.setFontSize(size);
            ctx.pdf.setTextColor(INK[0], INK[1], INK[2]);
            ctx.pdf.text(ln, ML + 4, ctx.y);
            ctx.y += lh;
        });
        ctx.y += 2.6;
    }

    function dibujarTranscripcion(ctx, exp) {
        asegurar(ctx, 36);
        barraExpediente(ctx, exp);
        campo(ctx, 'Identificador', exp.id || 'No consta');
        campo(ctx, 'Ciudad', exp.ciudad || 'No consta');
        campo(ctx, 'Institución', exp.colegio || 'No consta');
        campo(ctx, 'Fecha de registro', exp.fechaLarga);
        ctx.y += 2;
        var t = exp.transcripcion;
        if (!exp.chatId || t.estado === 'sin_chat') {
            parrafo(ctx, 'Este expediente no tiene una conversación vinculada. No hay mensajes que transcribir.');
            return;
        }
        if (t.estado === 'error') {
            parrafo(ctx, 'La conversación no pudo recuperarse al emitir este documento. Motivo registrado: ' + (t.error || 'No consta') + '. No se completó ningún mensaje.');
            return;
        }
        if (t.omitidosSistema) {
            nota(ctx, 'Se omitieron ' + entero(t.omitidosSistema) + (Number(t.omitidosSistema) === 1 ? ' mensaje de sistema' : ' mensajes de sistema') + ' de esta conversación. No se transcribe su contenido.');
        }
        if (!t.mensajes.length) {
            parrafo(ctx, 'La conversación no tiene mensajes visibles.');
            return;
        }
        t.mensajes.forEach(function (m, i) { dibujarMensaje(ctx, m, i + 1); });
    }

    function cuadroConteo(ctx, titulo, notaTexto, lista) {
        asegurar(ctx, 42);
        subtitulo(ctx, titulo);
        if (notaTexto) nota(ctx, notaTexto);
        var total = (lista || []).reduce(function (a, item) { return a + Number(item.value || 0); }, 0);
        tabla(ctx, [
            { titulo: 'Categoría', ancho: 112 },
            { titulo: 'Cantidad', ancho: 32, align: 'right' },
            { titulo: 'Parte', ancho: 30, align: 'right' }
        ], filasConteo(lista, total));
    }

    function sellar(ctx) {
        var pdf = ctx.pdf;
        var n = pdf.internal.getNumberOfPages();
        for (var i = 1; i <= n; i++) {
            pdf.setPage(i);
            pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
            pdf.setLineWidth(0.35);
            pdf.line(ML, 281.2, DERECHA, 281.2);
            pdf.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
            pdf.setLineWidth(0.22);
            pdf.line(ML, 282.2, DERECHA, 282.2);
            pdf.setFont('times', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
            pdf.text(sanear('Uso exclusivo del equipo Cybi   ·   Prohibida su difusión   ·   ' + (ctx.codigo || '')), ML, 286.4);
            pdf.text('Página ' + i + ' de ' + n, DERECHA, 286.4, { align: 'right' });
            pdf.setFontSize(7);
            pdf.text(sanear('Línea 155 Salud Mental   ·   Fono Ayuda 147   ·   El sitio público no muestra estos datos'), ML, 290.4);
        }
    }

    function escribir(pdf, modelo) {
        var ctx = {
            pdf: pdf,
            y: Y0,
            limite: LIMITE,
            codigo: modelo.codigo,
            fechaCorta: modelo.fecha.fechaCorta,
            logo: modelo.logo || null
        };
        try {
            pdf.setProperties({
                title: 'Informe técnico reservado ' + modelo.codigo,
                subject: 'Registros de entrevistas del Proyecto Cybi',
                author: 'Proyecto Cybi',
                keywords: 'confidencial, cybi, paraguay',
                creator: 'Panel de administración Cybi'
            });
        } catch (e) { /* la carátula ya identifica el documento */ }
        encabezado(ctx);
        bloqueInicial(ctx, modelo);

        var filtros = modelo.filtros;
        tabla(ctx, [
            { titulo: 'Dato', ancho: 48 },
            { titulo: 'Constancia', ancho: 126 }
        ], [
            ['Código', modelo.codigo],
            ['Clasificación', 'Reservado. Uso interno del equipo Cybi.'],
            ['Lugar', 'Asunción, República del Paraguay'],
            ['Fecha', modelo.fecha.fechaTabla],
            ['Hora de cierre', modelo.fecha.horaTabla],
            ['Fecha en letras', modelo.fecha.fechaActa],
            ['Período desde', filtros.desdeTxt || 'Sin corte inicial'],
            ['Período hasta', filtros.hastaTxt || 'Sin corte final'],
            ['Corte de estado', filtros.estadoTxt],
            ['Expedientes', entero(modelo.total)]
        ]);
        listaContenido(ctx);

        tituloSeccion(ctx, 'I. Objeto, alcance y método');
        parrafo(ctx, 'El presente informe reúne las entrevistas anónimas que el filtro de esta exportación dejó dentro del panel de administración del Proyecto Cybi. Se emite para el seguimiento interno del equipo. No se publica en el sitio y no reemplaza la atención de la línea 155 ni la del Fono Ayuda 147.');
        parrafo(ctx, 'Filtro aplicado. Desde: ' + (filtros.desdeTxt || 'sin corte inicial') + '. Hasta: ' + (filtros.hastaTxt || 'sin corte final') + '. Estado: ' + filtros.estadoTxt + '. Expedientes resultantes: ' + entero(modelo.total) + '.');
        parrafo(ctx, 'Método de conteo. Los cuadros de riesgos, señales, ciudades, instituciones y cursos, la edad promedio, las posibles víctimas y las derivaciones se calculan sobre los registros cuyo estado no es rechazado. El total de entrevistas, la distribución por estado de revisión y las alertas de severidad 4 o 5 se calculan sobre todos los registros del filtro, incluidos los rechazados. Es el mismo criterio del panel. La serie diaria cuenta cada entrevista en el día de su fecha de registro, según el calendario de Asunción, y no lista los días sin registros. En cada expediente se transcribe el valor guardado. En los cuadros, la etiqueta lleva mayúscula inicial.');
        parrafo(ctx, 'Las transcripciones reproducen los mensajes guardados, en el orden en que vienen. Los mensajes de sistema (instrucciones internas del modelo) no se copian. Su cantidad queda en el control de la emisión y, cuando existe, en la propia transcripción.');

        tituloSeccion(ctx, 'II. Resumen ejecutivo');
        if (modelo.resumenServicio && modelo.resumenServicio.texto) {
            nota(ctx, 'Síntesis producida por el servicio de inteligencia artificial de Cybi a partir de los registros de esta emisión. Si una frase difiere de un cuadro, manda el cuadro.');
            volcarTexto(ctx, modelo.resumenServicio.texto);
            var recs = modelo.resumenServicio.recomendaciones || [];
            if (recs.length) {
                subtitulo(ctx, 'Orientaciones devueltas por la síntesis');
                recs.forEach(function (item) {
                    var texto = typeof item === 'string' ? item : (item && (item.texto || item.text || item.recomendacion)) || '';
                    if (String(texto).trim()) viñeta(ctx, texto);
                });
            }
        } else {
            nota(ctx, 'Síntesis elaborada de forma automática sobre los registros incluidos en esta emisión. Cada cifra corresponde a un conteo de esos registros.');
            modelo.sintesis.forEach(function (texto) { parrafo(ctx, texto); });
        }

        tituloSeccion(ctx, 'III. Indicadores del período');
        parrafo(ctx, 'Los recuadros resumen el corte. La tabla que sigue dice sobre qué universo se cuenta cada indicador, para que el número pueda reconstruirse.');
        cajas(ctx, [
            { label: 'Entrevistas', value: entero(modelo.total) },
            { label: 'Con riesgo', value: entero(modelo.incidencias) },
            { label: 'Alertas', value: entero(modelo.alertas) },
            { label: 'Críticos', value: entero(modelo.criticos) },
            { label: 'Posibles víctimas', value: entero(modelo.victimas) },
            { label: 'Derivaciones', value: entero(modelo.derivaciones) },
            { label: 'Edad promedio, años', value: decimal(modelo.edad.promedio) },
            { label: 'En revisión', value: entero(modelo.pendientes) }
        ]);
        ctx.y += 1;
        subtitulo(ctx, 'Definición de cada indicador');
        tabla(ctx, [
            { titulo: 'Indicador', ancho: 42 },
            { titulo: 'Valor', ancho: 22, align: 'right' },
            { titulo: 'Cómo se cuenta', ancho: 110 }
        ], [
            ['Entrevistas', entero(modelo.total), 'Todos los registros que pasan el filtro de esta emisión.'],
            ['Válidos', entero(modelo.validos), 'Estado distinto de rechazado. Base de los cuadros.'],
            ['Aprobados', entero(modelo.aprobados), 'Estado aprobado, sobre todo el filtro.'],
            ['En revisión', entero(modelo.pendientes), 'Estado pendiente, sobre todo el filtro.'],
            ['Rechazados', entero(modelo.rechazados), 'Estado rechazado, sobre todo el filtro.'],
            ['Con riesgo', entero(modelo.incidencias), 'Válidos con al menos un riesgo detectado.'],
            ['Alertas', entero(modelo.alertas), 'Severidad 4 o 5, sobre todo el filtro.'],
            ['Críticos', entero(modelo.criticos), 'Severidad 5, sobre todo el filtro.'],
            ['Posibles víctimas', entero(modelo.victimas), 'Válidos con el campo de víctima en sí.'],
            ['Derivaciones', entero(modelo.derivaciones), 'Válidos con derivación registrada en sí.'],
            ['Edad promedio', decimal(modelo.edad.promedio), 'Solo edades declaradas de 10 a 19 años, en registros válidos. Entran ' + entero(modelo.edad.n) + '.'],
            ['Severidad media', decimal(modelo.severidadPromedio), 'Promedio de la severidad de los registros válidos, sobre 5.']
        ]);
        subtitulo(ctx, 'Control de la emisión');
        tabla(ctx, [
            { titulo: 'Concepto', ancho: 124 },
            { titulo: 'Cantidad', ancho: 50, align: 'right' }
        ], [
            ['Expedientes en el informe', entero(modelo.expedientes.length)],
            ['Con conversación asociada', entero(modelo.conChat)],
            ['Transcripción recuperada', entero(modelo.chatsOk)],
            ['Transcripción no disponible', entero(modelo.chatsError)],
            ['Sin conversación vinculada', entero(modelo.sinChat)],
            ['Mensajes transcriptos', entero(modelo.mensajes)],
            ['Mensajes de la persona entrevistada', entero(modelo.mensajesPersona)],
            ['Mensajes de Cybi', entero(modelo.mensajesCybi)],
            ['Mensajes de sistema omitidos', entero(modelo.omitidos)]
        ]);

        tituloSeccion(ctx, 'IV. Distribución de los registros');
        if (!modelo.total) {
            parrafo(ctx, 'El filtro no devolvió registros. No hay cuadros que construir.');
        } else if (!modelo.validos) {
            parrafo(ctx, 'No hay registros válidos en este corte: los cuadros de riesgos, zonas, instituciones, cursos y señales quedan vacíos. Los expedientes rechazados figuran en el registro individual.');
        } else {
            parrafo(ctx, 'Estos cuadros usan solo los registros válidos. Una entrevista puede sumar más de un riesgo o más de una señal, y entonces la cantidad de menciones supera a la de entrevistas. Los porcentajes se redondean a un decimal y pueden no sumar 100 exacto.');
            cuadroConteo(ctx, 'Riesgos detectados', 'Cada mención cuenta una vez. El porcentaje es sobre el total de menciones, no sobre las entrevistas.', modelo.riesgos);
            cuadroConteo(ctx, 'Ciudades', 'Un registro válido cuenta una vez. Si no trae ciudad, queda en «Sin dato».', modelo.ciudades);
            cuadroConteo(ctx, 'Instituciones educativas', 'Un registro válido cuenta una vez. Si no trae institución, queda en «Sin dato».', modelo.colegios);
            cuadroConteo(ctx, 'Cursos', 'Un registro válido cuenta una vez. Si no trae curso, queda en «Sin dato».', modelo.cursos);
            cuadroConteo(ctx, 'Señales emocionales', 'Cada mención cuenta una vez. El porcentaje es sobre el total de menciones.', modelo.senales);
            asegurar(ctx, 42);
            subtitulo(ctx, 'Severidad');
            nota(ctx, 'Escala de los registros válidos. El porcentaje es sobre ese universo.');
            var niveles = [
                ['1', 'Leve'],
                ['2', 'Baja'],
                ['3', 'Moderada'],
                ['4', 'Alta'],
                ['5', 'Crítica']
            ];
            tabla(ctx, [
                { titulo: 'Nivel', ancho: 112 },
                { titulo: 'Registros', ancho: 32, align: 'right' },
                { titulo: 'Parte', ancho: 30, align: 'right' }
            ], niveles.map(function (nivel) {
                var n = Number(modelo.severidad[nivel[0]] || 0);
                return [nivel[0] + ' · ' + nivel[1], entero(n), porcentaje(n, modelo.validos)];
            }));
        }
        asegurar(ctx, 36);
        subtitulo(ctx, 'Serie diaria');
        var notaSerie = 'Cada fila es un día con al menos una entrevista del filtro, en el calendario de Asunción, con cualquier estado. Los días sin entrevistas no se listan.';
        if (modelo.serie.sinFecha) notaSerie += ' Registros sin fecha de alta, fuera de la serie: ' + entero(modelo.serie.sinFecha) + '.';
        nota(ctx, notaSerie);
        tabla(ctx, [
            { titulo: 'Fecha', ancho: 58 },
            { titulo: 'Entrevistas', ancho: 58, align: 'right' },
            { titulo: 'Acumulado', ancho: 58, align: 'right' }
        ], modelo.serie.filas);

        tituloSeccion(ctx, 'V. Registro de expedientes');
        if (!modelo.expedientes.length) {
            parrafo(ctx, 'No hay expedientes en el filtro. El anexo de transcripciones tampoco tiene piezas.');
        } else {
            parrafo(ctx, 'El índice localiza cada expediente. La ficha que sigue repite todos los datos guardados del registro. El orden es por severidad, de mayor a menor, y dentro de la misma severidad por fecha de registro, de la más reciente a la más antigua.');
            tabla(ctx, [
                { titulo: 'N.º', ancho: 12, align: 'right' },
                { titulo: 'Fecha', ancho: 24 },
                { titulo: 'Ciudad', ancho: 32 },
                { titulo: 'Institución', ancho: 48 },
                { titulo: 'Edad', ancho: 14, align: 'right' },
                { titulo: 'Sev.', ancho: 16, align: 'right' },
                { titulo: 'Estado', ancho: 28 }
            ], modelo.expedientes.map(function (exp) {
                return [
                    exp.numero,
                    exp.fechaCorta,
                    exp.ciudad || 's/d',
                    exp.colegio || 's/d',
                    exp.edad == null ? 's/d' : String(exp.edad),
                    String(exp.severidad),
                    exp.estadoTexto
                ];
            }));
            modelo.expedientes.forEach(function (exp) { dibujarFicha(ctx, exp); });
        }

        tituloSeccion(ctx, 'VI. Anexo. Transcripciones íntegras');
        parrafo(ctx, 'Cada pieza usa el mismo número de expediente que el registro anterior. El orden de los mensajes es el del registro. La hora se imprime solo cuando el mensaje la trae. No se redacta ni se resume el texto guardado.');
        if (!modelo.expedientes.length) {
            parrafo(ctx, 'No hay transcripciones porque el filtro no devolvió expedientes.');
        } else {
            modelo.expedientes.forEach(function (exp) { dibujarTranscripcion(ctx, exp); });
        }

        tituloSeccion(ctx, 'VII. Cierre de la emisión');
        parrafo(ctx, 'En la ciudad de Asunción, República del Paraguay, ' + modelo.fecha.fechaCierre + ', se cierra esta emisión.');
        parrafo(ctx, modelo.fecha.fechaActa);
        parrafo(ctx, 'El documento contiene ' + nomb(modelo.expedientes.length, 'expediente', 'expedientes') + ' y ' + nomb(modelo.mensajes, 'mensaje transcripto', 'mensajes transcriptos') + '. Una diferencia con el panel en un momento posterior se debe a registros ingresados o modificados después de esta hora.');
        parrafo(ctx, 'Quien lea este informe para un seguimiento debe volver al expediente y a la transcripción, no quedarse en el resumen.');
        asegurar(ctx, 34);
        ctx.y += 8;
        var yLinea = ctx.y + 14;
        ctx.pdf.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
        ctx.pdf.setLineWidth(0.3);
        ctx.pdf.line(ML, yLinea, ML + 68, yLinea);
        ctx.pdf.line(ML + 96, yLinea, DERECHA, yLinea);
        ctx.pdf.setFont('times', 'normal');
        ctx.pdf.setFontSize(8);
        ctx.pdf.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        ctx.pdf.text('Emisión del panel de administración', ML, yLinea + 4.4);
        ctx.pdf.text('Revisión del equipo Cybi', ML + 96, yLinea + 4.4);
        ctx.y = yLinea + 10;
        parrafo(ctx, 'Los espacios quedan en blanco para la conformidad de quien corresponda. Este documento no atribuye un nombre que el registro no guarde.', { size: 8, style: 'italic', color: MUTED });

        sellar(ctx);
        return pdf;
    }

    function formatoImagen(dataUrl) {
        return String(dataUrl || '').indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
    }

    function payloadDe(modelo) {
        return {
            codigo: modelo.codigo,
            emitidoEn: modelo.fecha.iso,
            fechaEmision: modelo.fecha.fechaHoy,
            fechaEnLetras: modelo.fecha.fechaActa,
            zonaHoraria: 'America/Asuncion',
            filtros: {
                desde: modelo.filtros.desdeRaw || null,
                hasta: modelo.filtros.hastaRaw || null,
                estado: modelo.filtros.estadoRaw || 'all'
            },
            indicadores: {
                total: modelo.total,
                validos: modelo.validos,
                pendientes: modelo.pendientes,
                aprobados: modelo.aprobados,
                rechazados: modelo.rechazados,
                incidencias: modelo.incidencias,
                alertas: modelo.alertas,
                criticos: modelo.criticos,
                victimas: modelo.victimas,
                derivaciones: modelo.derivaciones,
                edadPromedio: modelo.edad.promedio,
                edadesEnPromedio: modelo.edad.n,
                edadesFueraDeRango: modelo.edad.fuera,
                edadesSinDato: modelo.edad.sin,
                severidadPromedio: modelo.severidadPromedio,
                alertasSinDerivacion: modelo.alertasSinDerivacion,
                conversacionesAsociadas: modelo.conChat,
                conversacionesRecuperadas: modelo.chatsOk,
                conversacionesNoDisponibles: modelo.chatsError,
                expedientesSinConversacion: modelo.sinChat,
                mensajesTranscriptos: modelo.mensajes,
                mensajesPersona: modelo.mensajesPersona,
                mensajesCybi: modelo.mensajesCybi,
                mensajesSistemaOmitidos: modelo.omitidos
            },
            distribucion: {
                riesgos: modelo.riesgos.map(function (x) { return { etiqueta: x.label, cantidad: x.value }; }),
                ciudades: modelo.ciudades.map(function (x) { return { etiqueta: x.label, cantidad: x.value }; }),
                colegios: modelo.colegios.map(function (x) { return { etiqueta: x.label, cantidad: x.value }; }),
                cursos: modelo.cursos.map(function (x) { return { etiqueta: x.label, cantidad: x.value }; }),
                senales: modelo.senales.map(function (x) { return { etiqueta: x.label, cantidad: x.value }; }),
                severidad: ['1', '2', '3', '4', '5'].map(function (n) { return { nivel: Number(n), cantidad: Number(modelo.severidad[n] || 0) }; }),
                porDia: modelo.serie.filas.map(function (f) { return { fecha: f[0], cantidad: f[1], acumulado: f[2] }; })
            },
            expedientes: modelo.expedientes.map(function (exp) {
                return {
                    numero: exp.numero,
                    id: exp.id,
                    chatId: exp.chatId || null,
                    fecha: exp.fechaLarga,
                    ciudad: exp.ciudad || null,
                    colegio: exp.colegio || null,
                    curso: exp.curso || null,
                    edad: exp.edad,
                    severidad: exp.severidad,
                    estado: exp.estado || null,
                    esVictimaAcoso: exp.victima === true ? true : (exp.victima === false ? false : null),
                    derivacionRealizada: exp.derivacion === true ? true : (exp.derivacion === false ? false : null),
                    alertaRoja: exp.alertaRoja,
                    riesgos: exp.riesgos,
                    senales: exp.senales,
                    motivoRevision: exp.motivo || null,
                    notasAdmin: exp.notas || null,
                    mensajes: (exp.transcripcion.mensajes || []).map(function (m) {
                        return { rol: m.rol, fecha: m.fecha || null, texto: m.texto };
                    })
                };
            })
        };
    }

    function normalizarResumen(data) {
        if (!data) return null;
        if (typeof data === 'string') {
            var t = data.trim();
            return t ? { texto: t, recomendaciones: [] } : null;
        }
        var texto = data.resumen || data.summary || data.texto || data.text || '';
        if (!String(texto).trim()) return null;
        var recs = data.recomendaciones || data.recommendations || [];
        if (!Array.isArray(recs)) recs = [recs];
        return {
            texto: String(texto),
            recomendaciones: recs.map(function (item) {
                if (item == null) return '';
                if (typeof item === 'string') return item;
                return item.texto || item.text || item.recomendacion || '';
            }).filter(function (item) { return String(item).trim(); })
        };
    }

    function recortarPayload(payload) {
        var json = '';
        try { json = JSON.stringify(payload); } catch (e) { return payload; }
        if (json.length <= 1500000) return payload;
        payload.expedientes = payload.expedientes.map(function (exp) {
            return Object.assign({}, exp, {
                mensajesRecortados: true,
                mensajes: (exp.mensajes || []).slice(0, 8).map(function (m) {
                    return { rol: m.rol, fecha: m.fecha, texto: String(m.texto || '').slice(0, 500) };
                })
            });
        });
        payload.aviso = 'Los mensajes enviados a la síntesis se recortaron por tamaño. El PDF conserva el texto completo.';
        return payload;
    }

    async function pedirResumen(payload) {
        if (!window.CybiApi || !window.CybiApi.resumenInforme) return null;
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
        try {
            var data = await window.CybiApi.resumenInforme(payload, ctrl ? ctrl.signal : undefined);
            return normalizarResumen(data);
        } catch (e) {
            return null;
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    async function traerConversaciones(datos, onProgress) {
        var ids = [];
        var visto = {};
        (datos || []).forEach(function (d) {
            var id = idDe(d && d.chatId);
            if (id && !visto[id]) {
                visto[id] = true;
                ids.push(id);
            }
        });
        var mapa = {};
        if (!ids.length) return mapa;
        var hechos = 0;
        var cursor = 0;
        async function uno(id) {
            try {
                var chat = await window.CybiApi.chat(id);
                mapa[id] = { ok: true, chat: chat };
            } catch (err) {
                mapa[id] = { ok: false, error: (err && err.message) ? err.message : 'No disponible' };
            }
            hechos += 1;
            if (typeof onProgress === 'function') {
                onProgress('Reuniendo conversaciones (' + hechos + ' de ' + ids.length + ')…');
            }
        }
        async function trabajador() {
            while (cursor < ids.length) {
                var i = cursor;
                cursor += 1;
                await uno(ids[i]);
            }
        }
        var tareas = [];
        var n = Math.min(4, ids.length);
        for (var t = 0; t < n; t++) tareas.push(trabajador());
        await Promise.all(tareas);
        return mapa;
    }

    function cargarLogo() {
        return new Promise(function (resolve) {
            if (typeof Image === 'undefined' || typeof document === 'undefined') {
                resolve(null);
                return;
            }
            var img = new Image();
            img.onload = function () {
                try {
                    var size = 320;
                    var canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    var g = canvas.getContext('2d');
                    var escala = Math.min(size / img.naturalWidth, size / img.naturalHeight);
                    var w = img.naturalWidth * escala;
                    var h = img.naturalHeight * escala;
                    g.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
                    var frame = g.getImageData(0, 0, size, size);
                    var d = frame.data;
                    for (var i = 0; i < d.length; i += 4) {
                        if (d[i] <= 18 && d[i + 1] <= 18 && d[i + 2] <= 18) {
                        d[i] = 255;
                        d[i + 1] = 255;
                        d[i + 2] = 255;
                        d[i + 3] = 255;
                    }
                    }
                    g.putImageData(frame, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = function () { resolve(null); };
            img.src = '../img/cybi-logo.jpeg';
        });
    }

    async function exportar(opciones) {
        var opt = opciones || {};
        if (!window.CybiAnalytics) throw new Error('No se cargaron los conteos del panel.');
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('No se cargó la librería del PDF.');
        var datos = Array.isArray(opt.datos) ? opt.datos : [];
        if (typeof opt.onProgress === 'function') opt.onProgress('Reuniendo las conversaciones de cada expediente…');
        var chats = await traerConversaciones(datos, opt.onProgress);
        var modelo = construirVista(datos, chats, opt.filtros || {}, opt.ahora || new Date());
        if (typeof opt.onProgress === 'function') opt.onProgress('Preparando la síntesis del informe…');
        modelo.resumenServicio = await pedirResumen(recortarPayload(payloadDe(modelo)));
        modelo.logo = opt.logo === undefined ? await cargarLogo() : opt.logo;
        if (typeof opt.onProgress === 'function') opt.onProgress('Escribiendo el documento…');
        var pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        escribir(pdf, modelo);
        var archivo = modelo.codigo + '.pdf';
        if (opt.noGuardar) return { pdf: pdf, modelo: modelo, archivo: archivo };
        pdf.save(archivo);
        var origen = modelo.resumenServicio ? 'ia' : 'panel';
        return {
            archivo: archivo,
            codigo: modelo.codigo,
            origen: origen,
            mensaje: origen === 'ia'
                ? 'Documento ' + modelo.codigo + ' emitido. Incluye la síntesis del servicio de inteligencia artificial, todos los expedientes del filtro y las transcripciones recuperadas.'
                : 'Documento ' + modelo.codigo + ' emitido, con todos los expedientes y las transcripciones recuperadas. La síntesis se armó con los registros del panel: el servicio de inteligencia artificial todavía no respondió.'
        };
    }

    window.CybiInformePdf = {
        escribir: escribir,
        construirVista: construirVista,
        exportar: exportar
    };
})();
