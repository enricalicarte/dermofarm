const chatHistory = document.getElementById("chat-history");
const brandSelector = document.getElementById("brand-selector");
const brandHeaders = document.querySelectorAll(".brand-header");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearChatButton = document.getElementById("clear-chat-button");

// Mostrar/ocultar listas de conversaciones
brandHeaders.forEach(header => {
    header.addEventListener("click", () => {
        const brand = header.dataset.brand;
        const list = document.getElementById(`${brand}-list`);
        list.style.display = list.style.display === "block" ? "none" : "block";
    });
});

// Cambiar de marca
brandSelector.addEventListener("change", () => {
    chatHistory.innerHTML = "";
});

// Enviar mensaje
async function sendMessage() {
    const message = searchInput.value.trim();
    const selectedBrand = brandSelector.value;

    if (!message || message.length > 500) {
        alert("Por favor, escribe un mensaje válido.");
        return;
    }

    addMessage(message, "user");
    searchInput.value = "";

    try {
        const response = await fetch("https://multiplicaenric.app.n8n.cloud/webhook-test/527dea54-5355-4717-bbb7-59ecd936269b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, brand: selectedBrand }),
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

        addMessage(botMessage, "bot");
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        addMessage("Error al conectar con el servidor.", "bot");
    }
}

// Añadir mensaje al historial con formato HTML
function addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${sender}`;

    if (sender === "bot") {
        messageDiv.innerHTML = content; // Renderiza HTML correctamente
    } else {
        messageDiv.textContent = content; // Texto plano para mensajes del usuario
    }

    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Formatear texto con marcas a HTML
function formatMessageToHTML(content) {
    return content
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
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
