const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const XLSX = require('xlsx');
const QRCode = require('qrcode');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const activeSessions = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/sloik');
});

app.get('/sloik', (req, res) => {
    const sessionId = crypto.randomBytes(4).toString('hex');
    activeSessions[sessionId] = { notes: [], createdAt: Date.now() };
    res.redirect(`/view/${sessionId}`);
});

app.get('/view/:id', (req, res) => {
    const sessionId = req.params.id;
    if (!activeSessions[sessionId]) {
        activeSessions[sessionId] = { notes: [], createdAt: Date.now() };
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/session-data/:id', async (req, res) => {
    const sessionId = req.params.id;
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const studentLink = `${protocol}://${host}/add.html?session=${sessionId}`;
    
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(studentLink);
        res.json({ link: studentLink, qr: qrCodeDataUrl });
    } catch (err) {
        res.status(500).send("Błąd generowania danych");
    }
});

app.get('/download-xlsx/:id', (req, res) => {
    const sessionId = req.params.id;
    const session = activeSessions[sessionId];
    if (!session || session.notes.length === 0) return res.status(400).send("Brak notatek.");
    const worksheet = XLSX.utils.json_to_sheet(session.notes.map(note => ({
        "Data": new Date(note.timestamp).toLocaleString('pl-PL'),
        "Treść": note.text
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pozytywy");
    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="Sloik_${sessionId}.xlsx"`);
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(fileBuffer);
});

io.on('connection', (socket) => {
    const sessionId = socket.handshake.query.sessionId;
    if (sessionId) socket.join(sessionId);
    socket.on('send-note', (data) => {
        const { id, text } = data;
        if (id && text && activeSessions[id]) {
            const noteData = { id: Date.now(), text: text.trim(), timestamp: Date.now() };
            activeSessions[id].notes.push(noteData);
            io.to(id).emit('new-note-display', noteData);
        }
    });
});

http.listen(PORT, '0.0.0.0', () => {
    console.log(`Serwer nasłuchuje na porcie ${PORT}`);
});