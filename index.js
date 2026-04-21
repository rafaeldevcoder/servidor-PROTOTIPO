const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const CREDENCIAIS = './credenciais-google.json';
// Substitua pelo SEU EMAIL compartilhado na agenda
const CALENDAR_ID = 'seu-email-aqui@gmail.com'; 

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENCIAIS,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

app.post('/receber-agendamento', async (req, res) => {
    const dados = req.body;
    console.log('🚀 Agendamento recebido:', dados);

    try {
        const eventoGoogle = {
            summary: `Novo Negócio: ${dados.nome}`,
            description: `Telefone: ${dados.telefone}\nEmail: ${dados.email}`,
            start: { dateTime: dados.data_inicio, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: dados.data_fim, timeZone: 'America/Sao_Paulo' },
        };

        await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: eventoGoogle,
        });

        res.status(200).send('Sucesso');
    } catch (erro) {
        console.error('❌ Erro no Google:', erro.message);
        res.status(500).send('Erro');
    }
});

// A nuvem decide a porta, se não tiver, usa a 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 Servidor rodando na porta ${PORT}!`);
});
