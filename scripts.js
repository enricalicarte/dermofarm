const chatHistory = document.getElementById("chat-history");
const brandSelector = document.getElementById("brand-selector");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearChatButton = document.getElementById("clear-chat-button");

// Enviar mensaje al Webhook
async function sendMessage() {
    const message = searchInput.value.trim();
    const selectedBrand = brandSelector.value;
    const timestamp = new Date().toISOString(); // Fecha y hora en formato ISO 8601

    if (!message || message.length > 500) {
        alert("Por favor, escribe un mensaje válido.");
        return;
    }

    addMessage(message, "user");
    searchInput.value = "";

    // Mostrar mensaje de carga temporal
    const loadingMessage = addMessage("Escribiendo...", "bot");

    try {
        const response = await fetch("https://kauai.app.n8n.cloud/webhook-test/9a5d7770-26dc-465c-a2eb-f90a870b3645", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "message",
                message,
                brand: selectedBrand,
                timestamp, // Agregar la marca temporal
            }),
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("Content-Type");
        let botMessage;

        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            botMessage = formatMessageToHTML(data.output || "Sin respuesta del servidor.");
        } else {
            botMessage = await response.text();
        }

        // Reemplazar mensaje de carga con la respuesta del bot
        loadingMessage.innerHTML = botMessage;
        addStarRating(loadingMessage, botMessage);
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        loadingMessage.innerHTML = "Error al conectar con el servidor.";
    }
}

// Enviar valoración al Webhook
async function sendRating(question, answer, rating, comment = null) {
    const timestamp = new Date().toISOString(); // Fecha y hora en formato ISO 8601
    const selectedBrand = brandSelector.value; // Obtener la marca seleccionada

    try {
        const response = await fetch("https://kauai.app.n8n.cloud/webhook-test/9a5d7770-26dc-465c-a2eb-f90a870b3645", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "rating",
                question,
                answer,
                rating,
                comment,
                brand: selectedBrand, // Agregar la marca
                timestamp, // Agregar la marca temporal
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al guardar la valoración: ${response.status} ${response.statusText}`);
        }

        console.log("Valoración enviada con éxito");
    } catch (error) {
        console.error("Error al enviar la valoración:", error);
    }
}

// Añadir mensaje al historial con formato HTML y sistema de valoración
function addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${sender}`;

    if (sender === "bot") {
        messageDiv.innerHTML = content; // Renderiza HTML correctamente
        addStarRating(messageDiv, content); // Agrega el sistema de valoración después del mensaje del bot
    } else {
        messageDiv.textContent = content; // Texto plano para mensajes del usuario
    }

    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return messageDiv; // Devuelve el elemento para futuras actualizaciones
}

// Agregar sistema de valoración con estrellas
function addStarRating(parentElement, answer) {
    const starContainer = document.createElement("div");
    starContainer.className = "star-rating";

    // Obtener la última pregunta del usuario en el historial
    const question = [...chatHistory.querySelectorAll(".chat-message.user")]
        .pop()?.textContent.trim() || "Pregunta desconocida";

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "★";
        star.dataset.value = i;

        // Manejar el clic en la estrella
        star.addEventListener("click", (event) => {
            const rating = event.target.dataset.value;
            updateStarRating(starContainer, rating);
            console.log(`Valoración seleccionada: ${rating}`);

            if (rating <= 5) {
                showFeedbackBox(parentElement, question, answer, rating); // Mostrar caja de comentarios
            }
        });

        starContainer.appendChild(star);
    }

    parentElement.appendChild(starContainer);
}

// Mostrar caja de comentarios
function showFeedbackBox(parentElement, question, answer, rating) {
    // Evitar duplicar la caja
    if (parentElement.querySelector(".feedback-box")) return;

    // Crear la caja de comentarios
    const feedbackBox = document.createElement("div");
    feedbackBox.className = "feedback-box";

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Escribe tus comentarios aquí...";
    feedbackBox.appendChild(textarea);

    // Botón Enviar
    const submitButton = document.createElement("button");
    submitButton.className = "submit";
    submitButton.textContent = "Enviar";
    submitButton.addEventListener("click", () => {
        const comment = textarea.value.trim();
        if (!comment) {
            alert("Por favor, escribe un comentario antes de enviar.");
            return;
        }

        // Enviar la valoración con comentario
        sendRating(question, answer, rating, comment);
        feedbackBox.remove(); // Eliminar la caja tras enviar
    });
    feedbackBox.appendChild(submitButton);

    // Botón Cancelar
    const cancelButton = document.createElement("button");
    cancelButton.className = "cancel";
    cancelButton.textContent = "Cancelar";
    cancelButton.addEventListener("click", () => feedbackBox.remove());
    feedbackBox.appendChild(cancelButton);

    // Insertar la caja debajo del mensaje
    parentElement.appendChild(feedbackBox);
    feedbackBox.style.display = "block";
}

// Actualizar visualización de estrellas seleccionadas
function updateStarRating(container, rating) {
    const stars = container.querySelectorAll(".star");
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add("selected");
        } else {
            star.classList.remove("selected");
        }
    });
}

// Formatear texto con marcas a HTML
function formatMessageToHTML(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **texto** -> <strong>texto</strong>
        .replace(/\*(.*?)\*/g, "<em>$1</em>") // *texto* -> <em>texto</em>
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>') // [texto](url) -> <a href="url">texto</a>
        .replace(/\n\n/g, "</p><p>") // Doble salto de línea -> cierre y apertura de párrafo
        .replace(/\n/g, "<br>") // Salto de línea -> <br>
        .replace(/^/, "<p>") // Agregar <p> al inicio
        .replace(/$/, "</p>"); // Agregar </p> al final
}

// Limpiar chat
clearChatButton.addEventListener("click", () => {
    chatHistory.innerHTML = "";
});

// Manejar evento de tecla Enter
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Manejar clic en botón Enviar
searchButton.addEventListener("click", sendMessage);
