const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const CREDENCIAIS = './credenciais-google.json';
// Substitua pelo SEU EMAIL compartilhado na agenda
const CALENDAR_ID = 'devprototipo@gmail.com'; 

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENCIAIS,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// ROTA 1: RECEBER E SALVAR AGENDAMENTO NO GOOGLE
app.post('/receber-agendamento', async (req, res) => {
    const dados = req.body;
    console.log('🚀 Agendamento recebido:', dados);

    try {
        const eventoGoogle = {
            summary: `${dados.titulo} - ${dados.nome}`,
            description: `Telefone: ${dados.telefone}\nEmail: ${dados.email}`,
            start: { dateTime: dados.data_inicio, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: dados.data_fim, timeZone: 'America/Sao_Paulo' },
            
            // 🔥 A MÁGICA ACONTECE AQUI: Adicionando o cliente como convidado
            attendees: [
                { email: dados.email }
            ]
        };

        await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: eventoGoogle,
            // 🔥 COMANDO PARA O GOOGLE: "Avise todos os convidados por e-mail!"
            sendUpdates: 'all',
        });

        res.status(200).send('Sucesso');
    } catch (erro) {
        console.error('❌ Erro no Google:', erro.message);
        res.status(500).send('Erro');
    }
});

// ROTA 2: LER OS AGENDAMENTOS DO GOOGLE
app.get('/listar-agendamentos', async (req, res) => {
    try {
        const resposta = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: (new Date()).toISOString(), // Pega apenas eventos de agora em diante
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const eventos = resposta.data.items;
        res.status(200).json(eventos);
    } catch (erro) {
        console.error('❌ Erro ao buscar eventos:', erro.message);
        res.status(500).send('Erro ao buscar eventos');
    }
}); 

// A nuvem decide a porta, se não tiver, usa a 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 Servidor rodando na porta ${PORT}!`);
});
