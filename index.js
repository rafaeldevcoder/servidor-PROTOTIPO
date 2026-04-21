const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const CREDENCIAIS = './credenciais-google.json';

// Este continua sendo o e-mail "Geral/Master" da empresa
const CALENDAR_ID_PRINCIPAL = 'devprototipo@gmail.com'; 

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENCIAIS,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// ROTA 1: RECEBER E SALVAR NO CALENDAR DO USUÁRIO (DINÂMICO)
app.post('/receber-agendamento', async (req, res) => {
    const dados = req.body;
    console.log('🚀 Tentando agendar para a conta de:', dados.email);

    try {
        const eventoGoogle = {
            summary: `${dados.titulo} - ${dados.nome}`,
            // Descrição atualizada para focar no cliente!
            description: `👤 Cliente: ${dados.nome}\n📱 WhatsApp: ${dados.telefone}\n\nAgendado via LeverSales.`,
            start: { dateTime: dados.data_inicio, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: dados.data_fim, timeZone: 'America/Sao_Paulo' },
        };

        // Usa o e-mail do consultor (que veio do form) como o ID da agenda
        await calendar.events.insert({
            calendarId: dados.email, 
            resource: eventoGoogle,
        });

        console.log('✅ Sucesso ao gravar na agenda pessoal de:', dados.email);
        res.status(200).send('Sucesso');
    } catch (erro) {
        console.error('❌ O usuário não deu permissão. Salvando na Geral...', erro.message);
        
        // Backup na conta geral da LeverSales
        try {
            await calendar.events.insert({
                calendarId: CALENDAR_ID_PRINCIPAL,
                resource: {
                    ...eventoGoogle,
                    summary: `[GERAL] ${dados.titulo} - ${dados.nome}` // Coloca uma tag para identificar
                },
            });
            res.status(200).send('Sucesso (Backup)');
        } catch (erroBackup) {
            res.status(500).send('Erro total: ' + erroBackup.message);
        }
    }
});

// ROTA 2: LER OS AGENDAMENTOS (Lista os da conta Geral/Master na vitrine)
app.get('/listar-agendamentos', async (req, res) => {
    try {
        const resposta = await calendar.events.list({
            calendarId: CALENDAR_ID_PRINCIPAL,
            timeMin: (new Date()).toISOString(),
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 Servidor CRM rodando na porta ${PORT}!`);
});
