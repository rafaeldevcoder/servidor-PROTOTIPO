const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const CREDENCIAIS = './credenciais-google.json';

// Este continua sendo o seu e-mail principal para a listagem da tabela
const CALENDAR_ID_PRINCIPAL = 'devprototipo@gmail.com'; 

const auth = new google.auth.GoogleAuth({
    keyFile: CREDENCIAIS,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// ROTA 1: RECEBER E SALVAR NO CALENDAR DO CLIENTE (DINÂMICO)
app.post('/receber-agendamento', async (req, res) => {
    const dados = req.body;
    console.log('🚀 Tentando agendar para:', dados.email);

    try {
        const eventoGoogle = {
            summary: `${dados.titulo} - ${dados.nome}`,
            description: `Telefone: ${dados.telefone}\nEmail de Contato: ${dados.email}`,
            start: { dateTime: dados.data_inicio, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: dados.data_fim, timeZone: 'America/Sao_Paulo' },
        };

        // O segredo está aqui: usamos o e-mail que veio do formulário como o ID da agenda
        await calendar.events.insert({
            calendarId: dados.email, 
            resource: eventoGoogle,
        });

        console.log('✅ Sucesso ao gravar na agenda de:', dados.email);
        res.status(200).send('Sucesso');
    } catch (erro) {
        console.error('❌ Erro ao acessar agenda externa:', erro.message);
        
        // Se der erro na agenda do cliente (ex: ele não compartilhou), 
        // tentamos salvar na sua agenda principal como backup para você não perder o dado
        try {
            console.log('⚠️ Tentando salvar na agenda principal como backup...');
            await calendar.events.insert({
                calendarId: CALENDAR_ID_PRINCIPAL,
                resource: {
                    ...eventoGoogle,
                    summary: `[BACKUP] ${dados.titulo} - ${dados.nome}`
                },
            });
            res.status(200).send('Sucesso (Backup)');
        } catch (erroBackup) {
            res.status(500).send('Erro total: ' + erroBackup.message);
        }
    }
});

// NOVA ROTA 2: LER OS AGENDAMENTOS (Lista os da sua conta principal)
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
    console.log(`🤖 Servidor inteligente rodando na porta ${PORT}!`);
});
