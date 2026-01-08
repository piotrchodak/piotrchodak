const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session');

const socket = io();

const noteInput = document.getElementById('noteInput');
const sendBtn = document.getElementById('sendBtn');
const successMessage = document.getElementById('successMessage');

sendBtn.addEventListener('click', () => {
    const text = noteInput.value.trim();
    if (text !== '' && sessionId) {
        // Przesyłamy tekst wraz z ID sesji, aby serwer wiedział, do którego pokoju go wysłać
        socket.emit('send-note', {
            id: sessionId,
            text: text
        });
        
        noteInput.value = '';
        successMessage.classList.remove('hidden');
        sendBtn.disabled = true;
        
        setTimeout(() => {
            successMessage.classList.add('hidden');
            sendBtn.disabled = false;
        }, 3000);
    } else if (!sessionId) {
        alert("Błąd: Brak poprawnego identyfikatora sesji w linku.");
    }
});

socket.on("connect_error", (err) => {
    console.error("Błąd połączenia:", err.message);
});