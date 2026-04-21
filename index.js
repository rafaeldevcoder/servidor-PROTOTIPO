// 1. IMPORTAÇÃO DE FERRAMENTAS
const express = require('express'); // Framework para criar o nosso servidor web
const cors = require('cors'); // Permite que o teu site (frontend) comunique com este servidor sem ser bloqueado
const { google } = require('googleapis'); // Biblioteca oficial para usar os serviços do Google

// 2. CONFIGURAÇÃO DO SERVIDOR
const app = express();
app.use(cors()); // Ativa a permissão de comunicação externa
app.use(express.json()); // Ensina o servidor a ler os pacotes de dados no formato JSON (que enviamos do frontend)

// 3. CONFIGURAÇÃO DO GOOGLE CALENDAR
const CREDENCIAIS = './credenciais-google.json'; // Ficheiro com a "chave" de acesso ao Google
const CALENDAR_ID = 'devprototipo@gmail.com'; // O email da agenda onde os eventos vão aparecer

// Prepara a autenticação (login automático do sistema)
const auth = new google.auth.GoogleAuth({
    keyFile: CREDENCIAIS,
    scopes: ['https://www.googleapis.com/auth/calendar'], // Dá permissão total à Agenda
});

// Cria o objeto da agenda que vamos usar para ler e escrever
const calendar = google.calendar({ version: 'v3', auth });

// ==========================================
// ROTA 1: RECEBER E SALVAR AGENDAMENTO
// ==========================================
// Esta rota (POST) "escuta" os dados que o formulário do frontend envia
app.post('/receber-agendamento', async (req, res) => {
    const dados = req.body; // Pega no pacote de dados enviado
    console.log('🚀 Agendamento de Usuário recebido:', dados); // Log atualizado para "Usuário"

    try {
        // Monta o evento no formato que o Google Calendar exige
        const eventoGoogle = {
            summary: `${dados.titulo} - ${dados.nome}`, // O título que aparece na agenda
            description: `Telefone: ${dados.telefone}\nEmail: ${dados.email}`, // Detalhes dentro do evento
            start: { dateTime: dados.data_inicio, timeZone: 'America/Sao_Paulo' }, // Data/Hora de início
            end: { dateTime: dados.data_fim, timeZone: 'America/Sao_Paulo' }, // Data/Hora de fim
        };

        // Envia a ordem para o Google criar o evento
        await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: eventoGoogle,
        });

        res.status(200).send('Sucesso'); // Avisa o frontend que correu tudo bem
    } catch (erro) {
        console.error('❌ Erro no Google:', erro.message); // Regista o erro no terminal
        res.status(500).send('Erro'); // Avisa o frontend que algo falhou
    }
});

// ==========================================
// ROTA 2: LER OS AGENDAMENTOS DO GOOGLE
// ==========================================
// Esta rota (GET) é chamada assim que o utilizador entra no sistema para preencher a tabela
app.get('/listar-agendamentos', async (req, res) => {
    try {
        // Pede ao Google a lista de eventos
        const resposta = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: (new Date()).toISOString(), // Filtro importante: Pega apenas eventos de agora em diante
            maxResults: 10, // Limita aos próximos 10 eventos para a tabela não ficar gigante
            singleEvents: true, // Garante que eventos recorrentes aparecem separados
            orderBy: 'startTime', // Organiza do mais próximo para o mais distante
        });

        const eventos = resposta.data.items; // Extrai apenas a lista de eventos da resposta gigante do Google
        res.status(200).json(eventos); // Devolve a lista ao frontend no formato JSON
    } catch (erro) {
        console.error('❌ Erro ao buscar eventos:', erro.message);
        res.status(500).send('Erro ao buscar eventos');
    }
}); 

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
// A nuvem (Render, Heroku, etc.) decide a porta. Se estivermos no nosso computador, usa a 3000.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 Servidor do Sistema White Label rodando na porta ${PORT}!`);
});
