const chatHistory = document.getElementById("chat-history");
const brandSelector = document.getElementById("brand-selector");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearChatButton = document.getElementById("clear-chat-button");

// Obtener fecha y hora actual en formato legible
function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString(); // Formato ISO 8601 para compatibilidad universal
}

// Enviar mensaje al Webhook
async function sendMessage() {
    const message = searchInput.value.trim();
    const selectedBrand = brandSelector.value;

    if (!message || message.length > 500) {
        alert("Por favor, escribe un mensaje válido.");
        return;
    }

    addMessage(message, "user");
    searchInput.value = "";

    // Mostrar mensaje de carga temporal
    const loadingMessage = addMessage("Escribiendo...", "bot");

    try {
        const response = await fetch("https://multiplicaenric.app.n8n.cloud/webhook/527dea54-5355-4717-bbb7-59ecd936269b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "message",
                message,
                brand: selectedBrand,
                timestamp: getCurrentDateTime(), // Añadir la fecha y hora
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
    const selectedBrand = brandSelector.value; // Obtener la marca seleccionada

    try {
        const response = await fetch("https://multiplicaenric.app.n8n.cloud/webhook/527dea54-5355-4717-bbb7-59ecd936269b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "rating",
                question,
                answer,
                rating,
                comment,
                brand: selectedBrand, // Añadir la marca
                timestamp: getCurrentDateTime(), // Añadir la fecha y hora
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

// Mostrar caja de comentarios
function showFeedbackBox(parentElement, question, answer, rating) {
    if (parentElement.querySelector(".feedback-box")) return;

    const feedbackBox = document.createElement("div");
    feedbackBox.className = "feedback-box";

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Escribe tus comentarios aquí...";
    feedbackBox.appendChild(textarea);

    const submitButton = document.createElement("button");
    submitButton.className = "submit";
    submitButton.textContent = "Enviar";
    submitButton.addEventListener("click", () => {
        const comment = textarea.value.trim();
        if (!comment) {
            alert("Por favor, escribe un comentario antes de enviar.");
            return;
        }

        sendRating(question, answer, rating, comment); // Enviar valoración y comentario
        feedbackBox.remove(); // Eliminar la caja tras enviar
    });
    feedbackBox.appendChild(submitButton);

    const cancelButton = document.createElement("button");
    cancelButton.className = "cancel";
    cancelButton.textContent = "Cancelar";
    cancelButton.addEventListener("click", () => feedbackBox.remove());
    feedbackBox.appendChild(cancelButton);

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
