const pathParts = window.location.pathname.split('/').filter(part => part.length > 0);
const sessionId = pathParts[pathParts.length - 1];

const qrImage = document.getElementById('qr-image');
const linkText = document.getElementById('link-text');
const notesArea = document.getElementById('notes-area');
const downloadBtn = document.getElementById('downloadBtn');

async function loadSessionData() {
    if (!sessionId || sessionId === 'view') {
        console.error("Nie znaleziono identyfikatora sesji w adresie.");
        return;
    }
    try {
        const response = await fetch(`/session-data/${sessionId}`);
        if (!response.ok) throw new Error("Błąd pobierania sesji.");
        const data = await response.json();
        qrImage.src = data.qr;
        linkText.textContent = data.link;
        downloadBtn.href = `/download-xlsx/${sessionId}`;
    } catch (err) {
        console.error("Wystąpił problem z ładowaniem danych:", err);
    }
}

const socket = io({ query: { sessionId: sessionId } });

socket.on('new-note-display', (noteData) => {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.textContent = noteData.text;
    const maxWidth = notesArea.clientWidth - 160;
    const maxHeight = notesArea.clientHeight - 130;
    note.style.left = Math.max(10, Math.random() * maxWidth) + 'px';
    note.style.top = Math.max(10, Math.random() * maxHeight) + 'px';
    note.style.transform = `rotate(${(Math.random() * 20) - 10}deg)`;
    notesArea.appendChild(note);
});

loadSessionData();