const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const pino = require('pino');
const axios = require('axios');
const { askOpenAI } = require('./workers/openai');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(helmet());
app.use(bodyParser.json({ limit: '1mb' }));

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

app.get('/', (req, res) => res.send('AI WhatsApp Assistant — ok'));

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.info('Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const changes = req.body.entry?.[0]?.changes?.[0];
    const messages = changes?.value?.messages;
    if (!messages || !messages.length) return;

    const msg = messages[0];
    const from = msg.from;
    const text = msg.text?.body || msg?.button?.text || null;
    if (!text) {
      logger.info('No text payload, skipping');
      return;
    }

    logger.info({ from, text }, 'Received message');

    const aiReply = await askOpenAI(text);
    if (!aiReply) {
      logger.warn('Empty AI reply');
      return;
    }

    await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'me'}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        text: { body: aiReply }
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    logger.info('Replied to user');
  } catch (err) {
    logger.error({ err: err?.message || err }, 'Processing error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server listening on ${PORT}`));