(function() {
    // ========== CONFIGURACIÓN DE FIREBASE ==========
    const firebaseConfig = {
        apiKey: "AIzaSyAFLH5cuIiQ5UVuGW22deUp-nUoxATrXR8",
        authDomain: "mi-app-repcontver.firebaseapp.com",
        projectId: "mi-app-repcontver",
        storageBucket: "mi-app-repcontver.firebasestorage.app",
        messagingSenderId: "210095808109",
        appId: "1:210095808109:web:f79a854b4c19da022e2964",
        measurementId: "G-W4JDBQJSD5"
    };

    // Inicializar Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();

    // ========== DATOS INICIALES ==========
    let nomina = JSON.parse(localStorage.getItem('repcontver_nomina')) || [
        { nombre: 'SEMINARIO RICARDO EDGAR', cedula: '0921451191' },
        { nombre: 'LOPEZ TOMALÁ OSCAR EDUARDO', cedula: '0951983519' },
        { nombre: 'RAMIREZ ESCALANTE MIGUEL ANGEL', cedula: '0941476582' },
        { nombre: 'SOLORZANO WONG HECTOR EMILIO', cedula: '0922215249' },
        { nombre: 'MOSQUERA GONZALEZ MARCOS BOLIVAR', cedula: '0929258648' },
        { nombre: 'CONTRERAS CASTRO ALDO JOSUE', cedula: '0954981304' }
    ];

    let supervisores = JSON.parse(localStorage.getItem('repcontver_supervisores')) || [
        { nombre: 'Angel Diaz de la Cruz', cargo: 'Supervisor de Operaciones' },
        { nombre: 'Carlos Pacheco', cargo: 'SUPERVISOR' },
        { nombre: 'Richard Quille Camacho', cargo: 'Representante Legal' }
    ];

    let sanciones = JSON.parse(localStorage.getItem('repcontver_sanciones')) || [
        { nombre: 'Amonestación Verbal', desc: 'Llamado de atención verbal (FALTA LEVE)' },
        { nombre: 'Amonestación Escrita', desc: 'Amonestación escrita y/o multa hasta 10%' },
        { nombre: 'Multa 10%', desc: 'Multa que no exceda el 10% de la remuneración' },
        { nombre: 'Terminación Visto Bueno', desc: 'Terminación de relación laboral vía visto bueno' }
    ];

    let historial = [];

    const articulos = [
        { ref: 'Art. 58 Lit.20', desc: 'Sostener altercados verbales GRAVE y físicos MUY GRAVE con compañeros, trabajadores y jefes superiores dentro de las instalaciones de la empresa y su entorno, así como también hacer escandalo dentro de la empresa.', gravedad: 'GRAVE / MUY GRAVE' },
        { ref: 'Art. 58 (48)', desc: 'Apropiarse de artículos abandonados u olvidados por clientes, compañeros o público en general. Su incumplimiento será considerado como falta MUY GRAVE.', gravedad: 'MUY GRAVE' },
        { ref: 'Art. 58 (57)', desc: 'Dormirse durante horas de trabajo cuando el trabajador estuviese de turno. Su incumplimiento será considerado como falta GRAVE.', gravedad: 'GRAVE' },
        { ref: 'Art 58 #22', desc: 'Presentarse en su lugar de trabajo en evidente estado de embriaguez o bajo los efectos de estupefacientes prohibidos por la Ley, Su incumplimiento será considerado como FALTA GRAVE.', gravedad: 'GRAVE' },
        { ref: 'Art. 11 / Art.54 CT', desc: 'En caso de retraso o ausencia injustificada a su jornada de trabajo, se procederá conforme al Art. 54 del Código del Trabajo.', gravedad: 'LEVE / GRAVE' },
        { ref: 'Art. 56 #3', desc: 'Ejecutar su labor de acuerdo a las instrucciones y normas técnicas que se hubieren impartido; y, cumplir estrictamente con las disposiciones impartidas por la empresa y/o autoridades competentes, sin que en ningún caso pueda alegarse su incumplimiento por desconocimiento o ignoran de la labor especifica confiada, su incumplimiento será FALTA GRAVE.', gravedad: 'GRAVE' },
        { ref: 'Art. 58 Lit.16', desc: 'Utilizar en actividades particulares los servicios, bienes materiales, equipos o vehículos de propiedad de la empresa o sus clientes, sin estar debidamente autorizados por el jefe respectivo. Su incumplimiento será considerado como una falta MUY GRAVE.', gravedad: 'MUY GRAVE' },
        { ref: 'Art. 49', desc: 'El uso de teléfono celular durante la jornada de trabajo no está permitido; Su incumplimiento será considerado como falta GRAVE.', gravedad: 'GRAVE' }
    ];

    // ========== ESTADO DE SELECCIÓN ==========
    let selectedWorker = null;
    let selectedSupervisor = null;
    let selectedSancion = null;
    let selectedArticulo = null;

    // ========== FUNCIONES ==========
    function generarCodigo() {
        const d = new Date();
        return `REP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900+100)}`;
    }

    function actualizarCodigo() {
        const el = document.getElementById('codigoUnico');
        if (el) el.innerText = generarCodigo();
    }

    // ===== FUNCIÓN PARA ESCUCHAR CAMBIOS EN FIREBASE =====
    function escucharFirebase() {
        db.collection("llamados")
          .orderBy("fecha", "desc")
          .onSnapshot((querySnapshot) => {
              console.log("🔥 Datos recibidos de Firebase:", querySnapshot.size, "documentos");
              
              historial = [];
              
              querySnapshot.forEach((doc) => {
                  const data = doc.data();
                  historial.push({
                      id: doc.id,
                      codigo: data.codigo || 'SIN CÓDIGO',
                      fecha: data.fecha || new Date().toISOString(),
                      trabajador: data.trabajador || 'SIN NOMBRE',
                      cedula: data.cedula || 'SIN CÉDULA',
                      supervisor: data.supervisor || 'SIN SUPERVISOR',
                      cargo: data.cargo || 'SIN CARGO',
                      sancion: data.sancion || 'SIN SANCIÓN',
                      articulo: data.articulo || 'SIN ARTÍCULO',
                      motivo: data.motivo || 'SIN MOTIVO',
                      pdfBase64: data.pdfBase64 || null
                  });
              });
              
              console.log("📊 Historial actualizado:", historial.length, "registros");
              renderHistorial();
              
          }, (error) => {
              console.error("❌ Error de Firebase:", error);
              alert("Error conectando con Firebase. Los datos no se sincronizarán.");
          });
    }

    // ===== FUNCIÓN PARA GUARDAR EN FIREBASE =====
    async function guardarEnFirebase(nuevoLlamado) {
        try {
            const docRef = await db.collection("llamados").add(nuevoLlamado);
            console.log("✅ Guardado en Firebase con ID:", docRef.id);
            return true;
        } catch (error) {
            console.error("❌ Error guardando en Firebase:", error);
            alert("Error al guardar en la nube. El llamado solo estará disponible localmente.");
            return false;
        }
    }

// ===== FUNCIÓN PARA ENVIAR NOTIFICACIÓN POR EMAIL (VERSIÓN SILENCIOSA) =====
function enviarNotificacionEmail(datosLlamado) {
    // Silenciosamente intenta enviar, pero no muestra errores
    try {
        const serviceID = "service_y9oxf6e";
        const templateID = "template_wxv2z5p";
        const publicKey = "FmZpk2vgPZehbp3qB";
        
        const fechaObj = new Date(datosLlamado.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-EC', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        const templateParams = {
            to_email: "cpacheco@repcontver.com",
            codigo: datosLlamado.codigo,
            fecha: fechaFormateada,
            supervisor: datosLlamado.supervisor,
            cargo: datosLlamado.cargo,
            trabajador: datosLlamado.trabajador,
            articulo: datosLlamado.articulo,
            sancion: datosLlamado.sancion,
            motivo: datosLlamado.motivo
        };
        
        emailjs.init(publicKey);
        emailjs.send(serviceID, templateID, templateParams)
            .then(() => console.log("Email enviado"))
            .catch(() => {}); // ← ERROR SILENCIADO (no hace nada)
            
    } catch (error) {
        // No hacer nada, error silenciado
    }
}

    function renderHistorial() {
        const container = document.getElementById('historialContainer');
        const statsEl = document.getElementById('historialStats');
        const searchInput = document.getElementById('buscarHistorial');
        
        if (!container) return;
        
        const filtro = searchInput ? searchInput.value.toLowerCase() : '';
        
        if (statsEl) {
            statsEl.innerHTML = `Total: ${historial.length} llamados (sincronizados)`;
        }

        container.innerHTML = '';
        
        if (historial.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No hay llamados guardados</div>';
            return;
        }
        
        const historialFiltrado = historial.filter(item => {
            return (item.trabajador?.toLowerCase().includes(filtro) || 
                   item.codigo?.toLowerCase().includes(filtro) ||
                   item.articulo?.toLowerCase().includes(filtro));
        });
        
        historialFiltrado.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'historial-item';
            
            const fecha = item.fecha ? new Date(item.fecha) : new Date();
            const fechaStr = fecha.toLocaleDateString('es-EC');
            
            div.innerHTML = `
                <div class="historial-info">
                    <span class="historial-fecha">${fechaStr} | ${item.codigo || 'S/C'}</span>
                    <span class="historial-nombre">${item.trabajador || 'S/N'}</span>
                    <span class="historial-articulo">${item.articulo || 'S/A'}</span>
                </div>
                <div>
                    <button class="view-historial" data-index="${historial.indexOf(item)}" title="Ver PDF">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(div);
        });

        document.querySelectorAll('.view-historial').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.dataset.index;
                const llamado = historial[index];
                if (llamado && llamado.pdfBase64) {
                    const pdfWindow = window.open("");
                    pdfWindow.document.write("<iframe width='100%' height='100%' style='border:none;' src='data:application/pdf;base64," + llamado.pdfBase64 + "'></iframe>");
                }
            });
        });
    }

    function renderNomina() {
        const container = document.getElementById('nominaListContainer');
        if (!container) return;
        
        container.innerHTML = '';
        nomina.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `nomina-item ${selectedWorker?.cedula === item.cedula ? 'selected' : ''}`;
            div.innerHTML = `
                <div class="nomina-info">
                    <span class="nomina-nombre">${item.nombre}</span>
                    <span class="nomina-cedula">${item.cedula}</span>
                </div>
                <button class="delete-nomina" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            
            div.addEventListener('click', (e) => {
                if (e.target.closest('.delete-nomina')) return;
                selectedWorker = { nombre: item.nombre, cedula: item.cedula };
                renderNomina();
                updateDisplay();
            });
            
            container.appendChild(div);
        });

        document.querySelectorAll('.delete-nomina').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.dataset.index;
                nomina.splice(index, 1);
                if (selectedWorker && !nomina.find(w => w.cedula === selectedWorker.cedula)) {
                    selectedWorker = null;
                }
                localStorage.setItem('repcontver_nomina', JSON.stringify(nomina));
                renderNomina();
                updateDisplay();
            });
        });
    }

    function renderSupervisores() {
        const container = document.getElementById('supervisorListContainer');
        if (!container) return;
        
        container.innerHTML = '';
        supervisores.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `supervisor-item ${selectedSupervisor?.nombre === item.nombre && selectedSupervisor?.cargo === item.cargo ? 'selected' : ''}`;
            div.innerHTML = `
                <div class="supervisor-info">
                    <span class="supervisor-nombre">${item.nombre}</span>
                    <span class="supervisor-cargo">${item.cargo}</span>
                </div>
                <button class="delete-supervisor" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            
            div.addEventListener('click', (e) => {
                if (e.target.closest('.delete-supervisor')) return;
                selectedSupervisor = { nombre: item.nombre, cargo: item.cargo };
                renderSupervisores();
                updateDisplay();
            });
            
            container.appendChild(div);
        });

        document.querySelectorAll('.delete-supervisor').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.dataset.index;
                supervisores.splice(index, 1);
                if (selectedSupervisor && !supervisores.find(s => s.nombre === selectedSupervisor.nombre && s.cargo === selectedSupervisor.cargo)) {
                    selectedSupervisor = null;
                }
                localStorage.setItem('repcontver_supervisores', JSON.stringify(supervisores));
                renderSupervisores();
                updateDisplay();
            });
        });
    }

    function renderSanciones() {
        const container = document.getElementById('sancionesListContainer');
        if (!container) return;
        
        container.innerHTML = '';
        sanciones.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `sancion-item ${selectedSancion?.nombre === item.nombre ? 'selected' : ''}`;
            div.innerHTML = `
                <div class="sancion-info">
                    <span class="sancion-nombre">${item.nombre}</span>
                    <span class="sancion-desc">${item.desc}</span>
                </div>
                <button class="delete-sancion" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            
            div.addEventListener('click', (e) => {
                if (e.target.closest('.delete-sancion')) return;
                selectedSancion = { nombre: item.nombre, desc: item.desc };
                renderSanciones();
                updateDisplay();
            });
            
            container.appendChild(div);
        });

        document.querySelectorAll('.delete-sancion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = btn.dataset.index;
                sanciones.splice(index, 1);
                if (selectedSancion && !sanciones.find(s => s.nombre === selectedSancion.nombre)) {
                    selectedSancion = null;
                }
                localStorage.setItem('repcontver_sanciones', JSON.stringify(sanciones));
                renderSanciones();
                updateDisplay();
            });
        });
    }

    function renderArticulos(filter = '') {
        const container = document.getElementById('articulosContainer');
        if (!container) return;
        
        container.innerHTML = '';
        const filtro = filter.toLowerCase();
        
        let articulosFiltrados = articulos;
        if (filtro) {
            articulosFiltrados = articulos.filter(art => 
                art.ref.toLowerCase().includes(filtro) || 
                art.desc.toLowerCase().includes(filtro)
            );
        }
        
        articulosFiltrados.forEach(art => {
            const div = document.createElement('div');
            div.className = `articulo-item ${selectedArticulo?.ref === art.ref ? 'selected-articulo' : ''}`;
            div.innerHTML = `
                <div>
                    <span class="articulo-ref">${art.ref}</span>
                    <div class="articulo-desc">${art.desc.substring(0, 80)}...</div>
                </div>
                <span class="articulo-gravedad">${art.gravedad}</span>
            `;
            
            div.addEventListener('click', () => {
                selectedArticulo = { ref: art.ref, desc: art.desc, gravedad: art.gravedad };
                renderArticulos(document.getElementById('buscarArticulo')?.value || '');
                updateDisplay();
            });
            
            container.appendChild(div);
        });
        
        if (container.innerHTML === '') {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No se encontraron artículos</div>';
        }
    }

    function updateDisplay() {
        const workerSpan = document.getElementById('selectedWorkerText');
        if (workerSpan) {
            workerSpan.innerText = selectedWorker ? `${selectedWorker.nombre} (${selectedWorker.cedula})` : 'Selecciona un trabajador';
        }

        const supervisorSpan = document.getElementById('selectedSupervisorText');
        if (supervisorSpan) {
            supervisorSpan.innerText = selectedSupervisor ? `${selectedSupervisor.nombre} - ${selectedSupervisor.cargo}` : 'Selecciona un supervisor';
        }

        const sancionSpan = document.getElementById('selectedSancionText');
        if (sancionSpan) {
            sancionSpan.innerText = selectedSancion ? selectedSancion.nombre : 'Selecciona una sanción';
        }

        const articuloSpan = document.getElementById('selectedArticuloText');
        if (articuloSpan) {
            articuloSpan.innerText = selectedArticulo ? `${selectedArticulo.ref}: ${selectedArticulo.desc.substring(0, 50)}...` : 'Selecciona un artículo';
        }
    }

    // ===== FUNCIÓN PRINCIPAL: GENERAR PDF =====
    function generarPDF(guardarEnHistorial = true) {
        if (!selectedWorker) { alert('Seleccione un trabajador'); return null; }
        if (!selectedSupervisor) { alert('Seleccione un supervisor'); return null; }
        if (!selectedSancion) { alert('Seleccione una sanción'); return null; }
        if (!selectedArticulo) { alert('Seleccione un artículo'); return null; }

        const motivo = document.getElementById('motivoField')?.value.trim() || 'Sin especificar';
        const codigo = document.getElementById('codigoUnico')?.innerText || generarCodigo();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Colores corporativos
        const azulOscuro = [11, 43, 79];
        const naranja = [255, 180, 71];
        const grisClaro = [245, 245, 245];

        // Fecha y hora
        const fecha = new Date();
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        const hora = fecha.getHours().toString().padStart(2, '0');
        const minutos = fecha.getMinutes().toString().padStart(2, '0');
        
        const fechaFormato = `${dia}/${mes}/${anio} ${hora}:${minutos}`;
        const fechaLarga = fecha.toLocaleDateString('es-EC', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }).replace(/ de /g, ' del ');

        // ===== ENCABEZADO =====
        doc.setFillColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.rect(0, 0, 210, 32, 'F');
        
        doc.setTextColor(255, 255, 255);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('REPCONTVER S.A.', 20, 12);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('SERVICIOS EXTRAPORTUARIOS', 20, 17);
        
        doc.setFontSize(6);
        doc.text('Dirección: KM 23.5 VIA PERIMETRAL, FRENTE A HOSPITAL UNIVERSITARIO', 20, 22);
        doc.text('Teléfono: (04)2023253', 20, 26);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`Código: ${codigo}`, 160, 14, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Guayaquil, ${fechaLarga}`, 160, 22, { align: 'center' });

        // ===== TÍTULO =====
        doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('LLAMADO DE ATENCIÓN', 105, 65, { align: 'center' });

        // ===== CUERPO =====
        let yPos = 75;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const intro = `Se hace el siguiente llamado de atención al Sr. ${selectedWorker.nombre} CI.: ${selectedWorker.cedula} por haber incumplido con el reglamento interno de trabajo de Repcontver S.A., específicamente lo estipulado en:`;
        const linesIntro = doc.splitTextToSize(intro, 170);
        doc.text(linesIntro, 20, yPos);
        
        yPos += (linesIntro.length * 5) + 5;

        doc.setFillColor(grisClaro[0], grisClaro[1], grisClaro[2]);
        doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.roundedRect(20, yPos - 2, 170, 25, 3, 3, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setFontSize(10);
        doc.text(selectedArticulo.ref, 25, yPos + 5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(80, 80, 80);
        const descripcion = `"${selectedArticulo.desc}"`;
        const linesDesc = doc.splitTextToSize(descripcion, 150);
        doc.text(linesDesc, 25, yPos + 13);
        
        yPos += 30;

        doc.setFillColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(20, yPos - 3, 170, 30, 3, 3, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('RÉGIMEN DISCIPLINARIO', 25, yPos + 3);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('• FALTA LEVE: Primera vez: amonestación verbal. Segunda vez: amonestación escrita y/o multa hasta 10%.', 25, yPos + 11);
        doc.text('• FALTA GRAVE: Primera vez: Multa hasta 10%; reincidencia: Terminación vía visto bueno.', 25, yPos + 18);
        doc.text('• FALTA MUY GRAVE: Terminación de relación laboral, previo visto bueno.', 25, yPos + 25);
        
        yPos += 35;

        doc.setFillColor(naranja[0], naranja[1], naranja[2]);
        doc.circle(23, yPos - 2, 2, 'F');
        
        doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('MOTIVO', 30, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        const linesMotivo = doc.splitTextToSize(motivo, 160);
        doc.text(linesMotivo, 30, yPos + 7);
        
        yPos += (linesMotivo.length * 6) + 15;

        doc.setFillColor(naranja[0], naranja[1], naranja[2]);
        doc.circle(23, yPos - 2, 2, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setFontSize(11);
        doc.text('SANCIÓN APLICADA', 30, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`${selectedSancion.nombre} - ${selectedSancion.desc}`, 30, yPos + 7);
        
        yPos += 20;

        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text('En caso de no proceder a firmar, firmará un testigo.', 20, yPos);
        doc.text('Comunicado que se archivará dentro de su carpeta.', 20, yPos + 6);

        yPos += 20;

        // ===== FIRMAS =====
        doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setLineWidth(0.3);
        doc.line(20, yPos, 190, yPos);

        yPos += 10;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setFontSize(10);
        doc.text('SUPERVISOR', 20, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(selectedSupervisor.nombre, 20, yPos + 5);
        doc.text(selectedSupervisor.cargo, 20, yPos + 10);
        doc.text('REPCONTVER S.A.', 20, yPos + 15);

        doc.line(20, yPos + 25, 90, yPos + 25);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('Firma del supervisor', 35, yPos + 30);

        doc.setFillColor(grisClaro[0], grisClaro[1], grisClaro[2]);
        doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.roundedRect(120, yPos - 5, 70, 48, 5, 5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.setFontSize(11);
        doc.text('RECIBIDO', 140, yPos + 5);

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(125, yPos + 18, 185, yPos + 18);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Firma de recibido', 138, yPos + 23);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.text('HUELLA', 138, yPos + 35);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text('(espacio para huella)', 130, yPos + 40);

        // ===== PIE DE PÁGINA =====
        doc.setFillColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
        doc.rect(0, 275, 210, 22, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestión BASC · REPCONTVER S.A.', 105, 290, { align: 'center' });
        doc.text(fechaFormato, 190, 290, { align: 'right' });

        const pdfBase64 = doc.output('datauristring').split(',')[1];

        if (guardarEnHistorial) {
            const nuevoLlamado = {
                codigo: codigo,
                fecha: new Date().toISOString(),
                trabajador: selectedWorker.nombre,
                cedula: selectedWorker.cedula,
                supervisor: selectedSupervisor.nombre,
                cargo: selectedSupervisor.cargo,
                sancion: selectedSancion.nombre,
                articulo: selectedArticulo.ref,
                motivo: motivo,
                pdfBase64: pdfBase64
            };
            
            // Guardar en Firebase
            guardarEnFirebase(nuevoLlamado);
            
            // ===== NUEVO: ENVIAR NOTIFICACIÓN EMAIL =====
            enviarNotificacionEmail(nuevoLlamado);
        }

        doc.save(`llamado_atencion_${selectedWorker.cedula}_${codigo}.pdf`);
        return pdfBase64;
    }

    // Función para exportar a Excel
    function exportarAExcel() {
        if (historial.length === 0) {
            alert('No hay datos en el historial para exportar');
            return;
        }

        const columnas = [
            'CÓDIGO',
            'FECHA',
            'TRABAJADOR',
            'CÉDULA',
            'SUPERVISOR',
            'CARGO',
            'SANCIÓN',
            'ARTÍCULO',
            'MOTIVO'
        ];

        const datos = historial.map(item => {
            const fecha = new Date(item.fecha);
            const fechaStr = fecha.toLocaleDateString('es-EC') + ' ' + 
                            fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
            
            return [
                item.codigo || '',
                fechaStr,
                item.trabajador || '',
                item.cedula || '',
                item.supervisor || '',
                item.cargo || '',
                item.sancion || '',
                item.articulo || '',
                item.motivo || ''
            ];
        });

        const contenidoExcel = [columnas, ...datos];

        let csvContent = "";
        contenidoExcel.forEach(fila => {
            const filaEscapada = fila.map(celda => {
                if (typeof celda === 'string' && (celda.includes(',') || celda.includes('"'))) {
                    return `"${celda.replace(/"/g, '""')}"`;
                }
                return celda;
            }).join(',');
            csvContent += filaEscapada + "\n";
        });

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historial_llamados_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    // ========== EVENT LISTENERS ==========
    document.addEventListener('DOMContentLoaded', function() {
        renderNomina();
        renderSupervisores();
        renderSanciones();
        renderArticulos();
        renderHistorial();
        actualizarCodigo();
        updateDisplay();
        
        // ===== INICIAR ESCUCHA DE FIREBASE =====
        escucharFirebase();

        document.getElementById('btnAgregarNomina')?.addEventListener('click', () => {
            const nombre = document.getElementById('newNombre')?.value.trim();
            const cedula = document.getElementById('newCedula')?.value.trim();
            
            if (!nombre || !cedula) {
                alert('Ingrese nombre y cédula');
                return;
            }
            
            nomina.push({ nombre, cedula });
            localStorage.setItem('repcontver_nomina', JSON.stringify(nomina));
            
            document.getElementById('newNombre').value = '';
            document.getElementById('newCedula').value = '';
            renderNomina();
        });

        document.getElementById('btnAgregarSupervisor')?.addEventListener('click', () => {
            const nombre = document.getElementById('newSupNombre')?.value.trim();
            const cargo = document.getElementById('newSupCargo')?.value.trim() || 'Supervisor';
            
            if (!nombre) {
                alert('Ingrese el nombre del supervisor');
                return;
            }
            
            supervisores.push({ nombre, cargo });
            localStorage.setItem('repcontver_supervisores', JSON.stringify(supervisores));
            
            document.getElementById('newSupNombre').value = '';
            document.getElementById('newSupCargo').value = '';
            renderSupervisores();
        });

        document.getElementById('btnAgregarSancion')?.addEventListener('click', () => {
            const nombre = document.getElementById('newSancionNombre')?.value.trim();
            const desc = document.getElementById('newSancionDesc')?.value.trim() || '';
            
            if (!nombre) {
                alert('Ingrese el nombre de la sanción');
                return;
            }
            
            sanciones.push({ nombre, desc });
            localStorage.setItem('repcontver_sanciones', JSON.stringify(sanciones));
            
            document.getElementById('newSancionNombre').value = '';
            document.getElementById('newSancionDesc').value = '';
            renderSanciones();
        });

        document.getElementById('buscarArticulo')?.addEventListener('input', (e) => {
            renderArticulos(e.target.value);
        });

        document.getElementById('buscarHistorial')?.addEventListener('input', () => {
            renderHistorial();
        });

        document.getElementById('refreshCodigo')?.addEventListener('click', actualizarCodigo);

        document.getElementById('generarPdfBtn')?.addEventListener('click', () => {
            generarPDF(true);
        });

        document.getElementById('exportHistorialBtn')?.addEventListener('click', () => {
            const dataStr = JSON.stringify(historial, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `historial_llamados_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });

        document.getElementById('exportExcelBtn')?.addEventListener('click', exportarAExcel);

        document.getElementById('clearHistorialBtn')?.addEventListener('click', () => {
            if (confirm('¿Está seguro de eliminar TODO el historial?')) {
                historial = [];
                renderHistorial();
                alert('Nota: Esto solo limpia la vista local. Los datos en la nube permanecen.');
            }
        });
    });
})();






