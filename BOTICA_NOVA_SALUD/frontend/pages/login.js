
const API = "http://localhost:3000/api";

const formulario = document.getElementById("formLogin");
const campoUsuario = document.getElementById("usuario");
const campoPassword = document.getElementById("password");
const mensaje = document.getElementById("mensaje");
const botonLogin = document.getElementById("btnLogin");
const botonMostrar = document.getElementById("mostrarPassword");

// Mostrar u ocultar contraseña
botonMostrar.addEventListener("click", () => {
    const visible = campoPassword.type === "password";
    campoPassword.type = visible ? "text" : "password";
    botonMostrar.textContent = visible ? "Ocultar" : "Ver";
});

// Iniciar sesión
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    mensaje.textContent = "";
    botonLogin.disabled = true;
    botonLogin.textContent = "VERIFICANDO...";

    try {
        const respuesta = await fetch(`${API}/usuarios/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: campoUsuario.value.trim(),
                password: campoPassword.value
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || "No se pudo iniciar sesión");
        }

        // Guardar sesión
        localStorage.setItem("token", datos.token);
        localStorage.setItem("usuario", JSON.stringify(datos.usuario));

        // Abrir panel principal
        window.location.href = "/index.html";

    } catch (error) {
        mensaje.textContent = error.message;
    } finally {
        botonLogin.disabled = false;
        botonLogin.textContent = "INICIAR SESIÓN";
    }
});
