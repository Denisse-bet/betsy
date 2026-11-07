const API = "http://localhost:3000/api";

const ID_ADMIN = "6aede840317e3a938943bfb7";

// =====================================
// FUNCIONES GENERALES
// =====================================

async function obtener(ruta) {
    const respuesta = await fetch(`${API}/${ruta}`);

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || datos.mensaje || "Error al consultar");
    }

    return datos;
}

function mensajeError(error) {
    console.error(error);
    alert(error.message || "Ocurrió un error");
}

function formatoSoles(valor) {
    return `S/ ${Number(valor || 0).toFixed(2)}`;
}

function mostrarSeccion(id, boton) {
    document.querySelectorAll(".seccion").forEach(seccion => {
        seccion.classList.remove("activa");
    });

    document.getElementById(id).classList.add("activa");

    document.querySelectorAll(".menu-btn").forEach(b => {
        b.classList.remove("active");
    });

    boton.classList.add("active");

    document.getElementById("tituloPagina").textContent =
        boton.textContent.trim();

    if (id === "inicio") cargarDashboard();
    if (id === "productos" || id === "inventario") cargarProductos();
    if (id === "clientes") cargarClientes();
    if (id === "proveedores") cargarProveedores();
    if (id === "ventas") cargarVentas();
    if (id === "alertas") cargarAlertas();
}

// =====================================
// DASHBOARD
// =====================================

async function cargarDashboard() {
    try {
        const [
            productos,
            clientes,
            proveedores,
            alertas,
            ventas
        ] = await Promise.all([
            obtener("productos"),
            obtener("clientes"),
            obtener("proveedores"),
            obtener("alertas"),
            obtener("ventas")
        ]);

        const ventasCompletadas = ventas.filter(
            v => v.estado === "completada"
        );

        const ingresos = ventasCompletadas.reduce(
            (suma, v) => suma + Number(v.total || 0),
            0
        );

        // Indicadores
        document.getElementById("totalProductos").textContent =
            productos.length;

        document.getElementById("totalClientes").textContent =
            clientes.length;

        document.getElementById("totalVentas").textContent =
            ventasCompletadas.length;

        document.getElementById("totalIngresos").textContent =
            formatoSoles(ingresos);

        // Inventario
        const activos = productos.filter(p => p.estado).length;

        const sinStock = productos.filter(
            p => Number(p.stock) <= 0
        ).length;

        const stockBajo = productos.filter(
            p => Number(p.stock) > 0 &&
                 Number(p.stock) <= Number(p.stockMinimo)
        ).length;

        // Próximos vencimientos: lotes con fecha dentro de 90 días
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const limite = new Date(hoy);
        limite.setDate(limite.getDate() + 90);

        let porVencer = 0;

        productos.forEach(producto => {
            (producto.lotes || []).forEach(lote => {
                const fecha = new Date(lote.fechaVencimiento);

                if (
                    lote.fechaVencimiento &&
                    !isNaN(fecha.getTime()) &&
                    fecha >= hoy &&
                    fecha <= limite &&
                    Number(lote.stock) > 0
                ) {
                    porVencer++;
                }
            });
        });

        document.getElementById("productosActivos").textContent = activos;
        document.getElementById("productosStockBajo").textContent = stockBajo;
        document.getElementById("productosSinStock").textContent = sinStock;
        document.getElementById("productosPorVencer").textContent = porVencer;

        dibujarGraficoVentas(ventasCompletadas);
        dibujarProductosVendidos(ventasCompletadas);
        dibujarResumenAlertas(alertas, productos);

        // Ventas recientes
        const recientes = [...ventasCompletadas]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        document.getElementById("tablaVentasDashboard").innerHTML =
            recientes.map(v => `
                <tr>
                    <td>${v.numeroVenta || "-"}</td>
                    <td>${v.nombreCliente || "Cliente general"}</td>
                    <td>${formatoSoles(v.total)}</td>
                    <td>${v.metodoPago || "-"}</td>
                    <td>${new Date(v.createdAt).toLocaleDateString("es-PE")}</td>
                </tr>
            `).join("") ||
            `<tr><td colspan="5">Todavía no hay ventas registradas.</td></tr>`;

    } catch (error) {
        mensajeError(error);
    }
}



// =====================================
// GRÁFICO DE VENTAS - NOVA SALUD
// =====================================

function dibujarGraficoVentas(ventas = []) {

    const canvas = document.getElementById("graficoVentas");

    if (!canvas) {
        console.error("No existe el elemento graficoVentas en HTML.");
        return;
    }

    const ctx = canvas.getContext("2d");
    const ancho = canvas.clientWidth;
    const alto = 340;
    const escala = window.devicePixelRatio || 1;

    if (!ancho) {
        console.error("El gráfico no tiene espacio disponible.");
        return;
    }

    canvas.width = ancho * escala;
    canvas.height = alto * escala;
    canvas.style.height = alto + "px";

    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);

    // PREPARAR LOS ÚLTIMOS 7 DÍAS

    const dias = [];

    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setHours(0, 0, 0, 0);
        fecha.setDate(fecha.getDate() - i);

        dias.push({
            fecha,
            nombre: fecha.toLocaleDateString("es-PE", {
                weekday: "short"
            }),
            total: 0
        });
    }

    // AGRUPAR LAS VENTAS POR FECHA

    ventas.forEach(venta => {

        if (venta.estado === "anulada") return;

        const fechaVenta = new Date(venta.createdAt);

        if (isNaN(fechaVenta.getTime())) return;

        fechaVenta.setHours(0, 0, 0, 0);

        const dia = dias.find(d =>
            d.fecha.getTime() === fechaVenta.getTime()
        );

        if (dia) {
            dia.total += Number(venta.total) || 0;
        }
    });

    // CONFIGURACIÓN DEL GRÁFICO

    const margenIzquierdo = 65;
    const margenDerecho = 20;
    const margenSuperior = 30;
    const margenInferior = 45;

    const zonaAncho = ancho - margenIzquierdo - margenDerecho;
    const zonaAlto = alto - margenSuperior - margenInferior;

    const maximo = Math.max(
        ...dias.map(d => d.total),
        10
    );

    const escalaMaxima = Math.ceil(maximo / 10) * 10;
    const paso = escalaMaxima / 5;

    // DIBUJAR EJES Y LÍNEAS

    ctx.font = "11px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 5; i++) {

        const valor = paso * i;

        const y = margenSuperior +
            zonaAlto -
            (i / 5) * zonaAlto;

        ctx.beginPath();
        ctx.strokeStyle = "#e8edf4";
        ctx.lineWidth = 1;
        ctx.moveTo(margenIzquierdo, y);
        ctx.lineTo(ancho - margenDerecho, y);
        ctx.stroke();

        ctx.fillStyle = "#8795a8";
        ctx.fillText(
            "S/ " + valor.toFixed(0),
            margenIzquierdo - 10,
            y
        );
    }

    // DIBUJAR BARRAS VERTICALES

    const espacio = zonaAncho / dias.length;
    const anchoBarra = Math.min(42, espacio * 0.48);

    dias.forEach((dia, i) => {

        const centroX =
            margenIzquierdo + espacio * i + espacio / 2;

        const alturaBarra =
            (dia.total / escalaMaxima) * zonaAlto;

        const x = centroX - anchoBarra / 2;
        const y = margenSuperior + zonaAlto - alturaBarra;

        if (dia.total > 0) {

            const gradiente = ctx.createLinearGradient(
                0, y, 0, margenSuperior + zonaAlto
            );

            gradiente.addColorStop(0, "#39a5e8");
            gradiente.addColorStop(1, "#1765b3");

            ctx.fillStyle = gradiente;

            // Rectángulo con esquinas superiores redondeadas
            const radio = Math.min(7, anchoBarra / 2);
            const altura = Math.max(alturaBarra, radio * 2);
            const baseY = margenSuperior + zonaAlto;

            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x, y + radio);
            ctx.quadraticCurveTo(x, y, x + radio, y);
            ctx.lineTo(x + anchoBarra - radio, y);
            ctx.quadraticCurveTo(
                x + anchoBarra, y,
                x + anchoBarra, y + radio
            );
            ctx.lineTo(x + anchoBarra, baseY);
            ctx.closePath();
            ctx.fill();

            // IMPORTE SOBRE LA BARRA

            ctx.fillStyle = "#31516f";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            ctx.fillText(
                "S/ " + dia.total.toFixed(2),
                centroX,
                y - 7
            );
        }

        // NOMBRE DEL DÍA

        ctx.fillStyle = "#718096";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        ctx.fillText(
            dia.nombre,
            centroX,
            margenSuperior + zonaAlto + 13
        );
    });

    console.log("Gráfico de ventas actualizado.");
}


// =====================================
// PRODUCTOS MÁS VENDIDOS
// =====================================

function dibujarProductosVendidos(ventas) {
    const cantidades = {};

    ventas.forEach(venta => {
        (venta.detalles || []).forEach(detalle => {
            const nombre = detalle.nombreProducto || "Producto";

            cantidades[nombre] =
                (cantidades[nombre] || 0) +
                Number(detalle.cantidad || 0);
        });
    });

    const ranking = Object.entries(cantidades)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    document.getElementById("productosMasVendidos").innerHTML =
        ranking.map(([nombre, cantidad], i) => `
            <div class="ranking-item">
                <span>${i + 1}. ${nombre}</span>
                <strong>${cantidad} unidades</strong>
            </div>
        `).join("") ||
        `<p class="empty-message">Todavía no hay ventas registradas.</p>`;
}

// =====================================
// RESUMEN DE ALERTAS
// =====================================

function dibujarResumenAlertas(alertas, productos) {
    const pendientes = alertas.filter(
        a => a.estado === "pendiente"
    );

    const avisosStock = productos
        .filter(p => Number(p.stock) <= Number(p.stockMinimo))
        .map(p => ({
            mensaje: `${p.nombre}: stock ${p.stock}`,
            tipo: "stock"
        }));

    const avisosAlertas = pendientes.map(a => ({
        mensaje: a.mensaje || a.tipo,
        tipo: "alerta"
    }));

    const avisos = [...avisosAlertas, ...avisosStock].slice(0, 6);

    document.getElementById("resumenAlertas").innerHTML =
        avisos.map(a => `
            <div class="alerta-item">
                ${a.tipo === "stock" ? "⚠ Stock bajo: " : "● "}
                ${a.mensaje}
            </div>
        `).join("") ||
        `<p class="empty-message">No hay alertas pendientes.</p>`;
}

// =====================================
// PRODUCTOS
// =====================================

async function cargarProductos() {
    try {
        const productos = await obtener("productos");

        document.getElementById("tablaProductos").innerHTML =
            productos.map(p => `
                <tr>
                    <td>${p.codigo || "-"}</td>
                    <td>${p.nombre}</td>
                    <td>${formatoSoles(p.precioVenta)}</td>
                    <td>${p.stock}</td>
                    <td>${p.estado ? "Activo" : "Inactivo"}</td>
                </tr>
            `).join("");

        document.getElementById("tablaInventario").innerHTML =
            productos.map(p => `
                <tr>
                    <td>${p.nombre}</td>
                    <td>${p.codigo || "-"}</td>
                    <td>${p.stock}</td>
                    <td>${p.stockMinimo}</td>
                </tr>
            `).join("");

    } catch (error) {
        mensajeError(error);
    }
}

document.getElementById("formProducto").addEventListener("submit", async e => {
    e.preventDefault();

    const datos = Object.fromEntries(new FormData(e.target));

    datos.precioCompra = Number(datos.precioCompra);
    datos.precioVenta = Number(datos.precioVenta);
    datos.stock = Number(datos.stock);
    datos.stockMinimo = Number(datos.stockMinimo);

    try {
        const respuesta = await fetch(`${API}/productos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.error || resultado.mensaje);
        }

        alert("Producto registrado correctamente");

        e.target.reset();

        cargarProductos();
        cargarDashboard();

    } catch (error) {
        mensajeError(error);
    }
});

// =====================================
// CLIENTES
// =====================================

async function cargarClientes() {
    try {
        const clientes = await obtener("clientes");

        document.getElementById("tablaClientes").innerHTML =
            clientes.map(c => `
                <tr>
                    <td>${c.numeroDocumento || "-"}</td>
                    <td>${c.nombres}</td>
                    <td>${c.apellidos || "-"}</td>
                    <td>${c.telefono || "-"}</td>
                </tr>
            `).join("");

    } catch (error) {
        mensajeError(error);
    }
}

document.getElementById("formCliente").addEventListener("submit", async e => {
    e.preventDefault();

    const datos = Object.fromEntries(new FormData(e.target));

    try {
        const respuesta = await fetch(`${API}/clientes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.error || resultado.mensaje);
        }

        alert("Cliente registrado correctamente");

        e.target.reset();

        cargarClientes();
        cargarDashboard();

    } catch (error) {
        mensajeError(error);
    }
});

// =====================================
// PROVEEDORES
// =====================================

async function cargarProveedores() {
    try {
        const proveedores = await obtener("proveedores");

        document.getElementById("tablaProveedores").innerHTML =
            proveedores.map(p => `
                <tr>
                    <td>${p.numeroDocumento}</td>
                    <td>${p.razonSocial}</td>
                    <td>${p.contacto || "-"}</td>
                    <td>${p.telefono || "-"}</td>
                </tr>
            `).join("");

    } catch (error) {
        mensajeError(error);
    }
}

document.getElementById("formProveedor").addEventListener("submit", async e => {
    e.preventDefault();

    const datos = Object.fromEntries(new FormData(e.target));

    try {
        const respuesta = await fetch(`${API}/proveedores`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.error || resultado.mensaje);
        }

        alert("Proveedor registrado correctamente");

        e.target.reset();

        cargarProveedores();
        cargarDashboard();

    } catch (error) {
        mensajeError(error);
    }
});

// =====================================
// VENTAS
// =====================================

async function cargarVentas() {
    try {
        const ventas = await obtener("ventas");

        document.getElementById("tablaVentas").innerHTML =
            ventas.map(v => `
                <tr>
                    <td>${v.numeroVenta}</td>
                    <td>${v.nombreCliente || "Cliente general"}</td>
                    <td>${formatoSoles(v.total)}</td>
                    <td>${v.metodoPago}</td>
                    <td>${new Date(v.createdAt).toLocaleDateString("es-PE")}</td>
                </tr>
            `).join("");

    } catch (error) {
        mensajeError(error);
    }
}

document.getElementById("formVenta").addEventListener("submit", async e => {
    e.preventDefault();

    const datos = Object.fromEntries(new FormData(e.target));

    const venta = {
        nombreCliente: datos.nombreCliente || "Cliente general",
        usuario: ID_ADMIN,
        detalles: [{
            producto: datos.producto,
            cantidad: Number(datos.cantidad)
        }],
        descuento: Number(datos.descuento || 0),
        metodoPago: datos.metodoPago
    };

    try {
        const respuesta = await fetch(`${API}/ventas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(venta)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.error || resultado.mensaje);
        }

        alert("Venta registrada correctamente");

        e.target.reset();

        cargarVentas();
        cargarProductos();
        cargarDashboard();

    } catch (error) {
        mensajeError(error);
    }
});

// ============================================
// ALERTAS
// ============================================

// GENERAR Y ACTUALIZAR ALERTAS
async function generarYActualizarAlertas(boton = null) {
    const textoOriginal = boton ? boton.textContent : "";

    try {
        if (boton) {
            boton.disabled = true;
            boton.textContent = "Generando...";
        }

        const respuesta = await fetch(`${API}/alertas/generar`, {
            method: "POST"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "Error al generar alertas.");
        }

        await cargarAlertas();
        await cargarDashboard();

        alert(
            `${resultado.mensaje}\nNuevas alertas: ${resultado.nuevasAlertas}`
        );

    } catch (error) {
        console.error("Error al generar alertas:", error);
        alert("No se pudieron generar las alertas: " + error.message);

    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    }
}


// LISTAR ALERTAS
async function cargarAlertas(boton = null) {
    const textoOriginal = boton ? boton.textContent : "";

    try {
        if (boton) {
            boton.disabled = true;
            boton.textContent = "Actualizando...";
        }

        const respuesta = await fetch(`${API}/alertas`);

        if (!respuesta.ok) {
            throw new Error("Error HTTP " + respuesta.status);
        }

        const alertas = await respuesta.json();
        const tabla = document.getElementById("tablaAlertas");

        if (!tabla) {
            throw new Error("No se encontró la tabla de alertas.");
        }

        tabla.innerHTML = "";

        if (!Array.isArray(alertas) || alertas.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="4">No hay alertas registradas.</td>
                </tr>
            `;
            return;
        }

        const nombresTipo = {
            stock_bajo: "Stock bajo",
            sin_stock: "Sin stock",
            vencimiento_proximo: "Vencimiento próximo",
            producto_vencido: "Producto vencido"
        };

        const nombresEstado = {
            pendiente: "Pendiente",
            atendida: "Atendida",
            descartada: "Descartada"
        };

        alertas.forEach(alerta => {
            const fila = document.createElement("tr");

            const tipo = document.createElement("td");
            tipo.textContent = nombresTipo[alerta.tipo] || alerta.tipo;

            const mensaje = document.createElement("td");
            mensaje.textContent = alerta.mensaje || "Sin descripción";

            const estado = document.createElement("td");
            estado.textContent = nombresEstado[alerta.estado] || alerta.estado;

            const acciones = document.createElement("td");

            if (alerta.estado === "pendiente" && alerta._id) {
                const btnAtender = document.createElement("button");
                btnAtender.type = "button";
                btnAtender.className = "btn";
                btnAtender.textContent = "Atender";

                btnAtender.addEventListener("click", () => {
                    actualizarEstadoAlerta(alerta._id, "atendida");
                });

                const btnDescartar = document.createElement("button");
                btnDescartar.type = "button";
                btnDescartar.className = "btn";
                btnDescartar.textContent = "Descartar";

                btnDescartar.addEventListener("click", () => {
                    actualizarEstadoAlerta(alerta._id, "descartada");
                });

                acciones.append(btnAtender, btnDescartar);
            } else {
                acciones.textContent = "Sin acciones";
            }

            fila.append(tipo, mensaje, estado, acciones);
            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al cargar alertas:", error);
        alert("No se pudieron cargar las alertas: " + error.message);

    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = textoOriginal;
        }
    }
}


// ACTUALIZAR ESTADO DE UNA ALERTA
async function actualizarEstadoAlerta(id, estado) {
    try {
        const respuesta = await fetch(`${API}/alertas/${id}/estado`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo actualizar.");
        }

        alert(resultado.mensaje);

        await cargarAlertas();
        await cargarDashboard();

    } catch (error) {
        console.error("Error al actualizar alerta:", error);
        alert("Error: " + error.message);
    }
}
// ============================================
// MÓDULO DE REPORTES
// ============================================


// ============================================
// MÓDULO DE REPORTES - REPORTE DE VENTAS
// ============================================

async function generarReporteVentas() {
    const boton = document.querySelector(
        'button[onclick="generarReporteVentas()"]'
    );

    const tabla = document.getElementById("tablaReporteVentas");

    try {
        const fechaInicio = document.getElementById("fechaInicioReporte").value;
        const fechaFin = document.getElementById("fechaFinReporte").value;

        // Validar fechas
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            alert("La fecha inicial no puede ser posterior a la fecha final.");
            return;
        }

        // Mostrar estado de carga
        if (boton) {
            boton.disabled = true;
            boton.textContent = "Generando...";
        }

        if (tabla) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">Consultando ventas, por favor espere...</td>
                </tr>
            `;
        }

        // Consultar ventas al servidor
        const respuesta = await fetch(`${API}/ventas`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron consultar las ventas.");
        }

        const resultado = await respuesta.json();

        // Obtener arreglo de ventas
        const ventas = Array.isArray(resultado)
            ? resultado
            : resultado.ventas || resultado.data || [];

        if (!Array.isArray(ventas)) {
            throw new Error("El servidor no devolvió una lista válida de ventas.");
        }

        // Filtrar ventas completadas por fecha
        const ventasFiltradas = ventas.filter(venta => {
            if (venta.estado && venta.estado !== "completada") {
                return false;
            }

            const fechaOriginal = venta.createdAt || venta.fecha;

            if (!fechaOriginal) {
                return false;
            }

            const fechaVenta = new Date(fechaOriginal);

            if (isNaN(fechaVenta.getTime())) {
                return false;
            }

            // Obtener fecha local sin desfase UTC
            const anio = fechaVenta.getFullYear();
            const mes = String(fechaVenta.getMonth() + 1).padStart(2, "0");
            const dia = String(fechaVenta.getDate()).padStart(2, "0");
            const fecha = `${anio}-${mes}-${dia}`;

            if (fechaInicio && fecha < fechaInicio) return false;
            if (fechaFin && fecha > fechaFin) return false;

            return true;
        });

        // Calcular indicadores
        const cantidadVentas = ventasFiltradas.length;

        const ingresos = ventasFiltradas.reduce(
            (total, venta) => total + Number(venta.total || 0),
            0
        );

        const unidades = ventasFiltradas.reduce((total, venta) => {
            const detalles = Array.isArray(venta.detalles)
                ? venta.detalles
                : [];

            return total + detalles.reduce(
                (suma, detalle) => suma + Number(detalle.cantidad || 0),
                0
            );
        }, 0);

        // Actualizar indicadores
        document.getElementById("reporteCantidadVentas").textContent =
            cantidadVentas;

        document.getElementById("reporteIngresos").textContent =
            `S/ ${ingresos.toFixed(2)}`;

        document.getElementById("reporteUnidades").textContent =
            unidades;

        // Limpiar tabla
        tabla.innerHTML = "";

        // Si no hay ventas
        if (ventasFiltradas.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No hay ventas completadas en el periodo seleccionado.
                    </td>
                </tr>
            `;

            return;
        }

        // Ordenar de la más reciente a la más antigua
        ventasFiltradas.sort((a, b) => {
            const fechaA = new Date(a.createdAt || a.fecha);
            const fechaB = new Date(b.createdAt || b.fecha);
            return fechaB - fechaA;
        });

        // Mostrar ventas en la tabla
        ventasFiltradas.forEach(venta => {
            const fila = document.createElement("tr");

            const fecha = new Date(venta.createdAt || venta.fecha);

            const datos = [
                venta.numeroVenta || "Sin número",
                fecha.toLocaleDateString("es-PE"),
                venta.nombreCliente || "Cliente general",
                `S/ ${Number(venta.total || 0).toFixed(2)}`,
                venta.metodoPago || "No especificado"
            ];

            datos.forEach(dato => {
                const celda = document.createElement("td");
                celda.textContent = dato;
                fila.appendChild(celda);
            });

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al generar reporte:", error);

        if (tabla) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No se pudo generar el reporte. Verifique la conexión.
                    </td>
                </tr>
            `;
        }

        alert("Error al generar el reporte: " + error.message);

    } finally {
        // Restaurar botón
        if (boton) {
            boton.disabled = false;
            boton.textContent = "Generar reporte";
        }
    }
}

// =====================================
// INICIAR SISTEMA
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    cargarDashboard();
    cargarProveedores();
    cargarProductos();
    cargarVentas();
    cargarAlertas();
});

// ============================================
// ACTUALIZAR INVENTARIO DESDE LA BASE DE DATOS
// ============================================

async function actualizarInventarioCompleto(boton) {
    const textoOriginal = boton.textContent;

    try {
        boton.disabled = true;
        boton.textContent = "Actualizando...";

        const respuesta = await fetch("http://localhost:3000/api/productos");

        if (!respuesta.ok) {
            throw new Error("No se pudieron consultar los productos. Código: " + respuesta.status);
        }

        const resultado = await respuesta.json();

        // Admite una respuesta en formato array o dentro de una propiedad
        const productos = Array.isArray(resultado)
            ? resultado
            : resultado.productos || resultado.data || [];

        const tabla = document.getElementById("tablaInventario");

        if (!tabla) {
            throw new Error("No se encontró la tabla de inventario.");
        }

        tabla.innerHTML = "";

        if (productos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="4">No hay productos registrados.</td>
                </tr>
            `;
        } else {
            productos.forEach(producto => {
                const fila = document.createElement("tr");

                const nombre = document.createElement("td");
                nombre.textContent = producto.nombre || "Sin nombre";

                const codigo = document.createElement("td");
                codigo.textContent = producto.codigo || "Sin código";

                const stock = document.createElement("td");
                stock.textContent = producto.stock ?? 0;

                const minimo = document.createElement("td");
                minimo.textContent = producto.stockMinimo ?? 0;

                fila.append(nombre, codigo, stock, minimo);
                tabla.appendChild(fila);
            });
        }

        // Actualiza también la lista general de productos, si existe.
        if (typeof cargarProductos === "function") {
            await cargarProductos();
        }

        console.log("Inventario actualizado correctamente.");
        
    } catch (error) {
        console.error("Error al actualizar inventario:", error);
        alert("No se pudo actualizar el inventario: " + error.message);
    } finally {
        boton.disabled = false;
        boton.textContent = textoOriginal;
    }
}


// ============================================
// ACTUALIZAR DATOS GENERALES DEL DASHBOARD
// ============================================

async function actualizarDatosSistema(boton) {
    const textoOriginal = boton.textContent;

    try {
        boton.disabled = true;
        boton.textContent = "Actualizando datos...";

        // Actualiza los indicadores del Dashboard.
        if (typeof cargarDashboard === "function") {
            await cargarDashboard();
        }

        // Actualiza las listas de los módulos.
        const funciones = [
            "cargarProductos",
            "cargarClientes",
            "cargarProveedores",
            "cargarVentas",
            "cargarAlertas",
            "cargarInventario",
            "cargarMovimientos"
        ];

        for (const nombre of funciones) {
            if (typeof window[nombre] === "function") {
                await window[nombre]();
            }
        }

        console.log("Datos generales actualizados correctamente.");

    } catch (error) {
        console.error("Error al actualizar los datos:", error);
        alert("No se pudieron actualizar todos los datos. Revisa la consola.");
    } finally {
        boton.disabled = false;
        boton.textContent = textoOriginal;
    }
}

// ============================================
// CARGAR DATOS DEL GRÁFICO DE VENTAS
// ============================================

async function cargarGraficoVentas() {
    try {
        const respuesta = await fetch("http://localhost:3000/api/ventas");

        if (!respuesta.ok) {
            throw new Error("Error al consultar ventas: " + respuesta.status);
        }

        const resultado = await respuesta.json();

        const ventas = Array.isArray(resultado)
            ? resultado
            : resultado.ventas || resultado.data || [];

        dibujarGraficoVentas(ventas);

    } catch (error) {
        console.error("Error al cargar el gráfico:", error);
    }
}

