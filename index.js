const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const { GoogleGenAI } = require("@google/genai");

const TOKEN = process.env.TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PREFIX = process.env.PREFIX || "!";

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const chatbot = {
    enabled: false,
    channel: null,
    model: "gemini-2.5-flash"
};

client.once("ready", () => {
    console.log(`${client.user.tag} is online.`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith(PREFIX)) {

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        if (command === "help") {

            const embed = new EmbedBuilder()
                .setTitle("🤖 Solor Ai")
                .setDescription(`
**General**
!help
!ping
!uptime
!botinfo

**Chatbot**
!chatbot setup
!chatbot enable
!chatbot disable
                `);

            return message.reply({ embeds: [embed] });
        }

        if (command === "ping") {
            return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
        }

        if (command === "uptime") {
            const totalSeconds = Math.floor(process.uptime());

            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return message.reply(
                `⏰ Uptime\n${days}d ${hours}h ${minutes}m ${seconds}s`
            );
        }

        if (command === "botinfo") {
            const embed = new EmbedBuilder()
                .setTitle("🤖 Solor Ai")
                .addFields(
                    {
                        name: "Servers",
                        value: `${client.guilds.cache.size}`,
                        inline: true
                    },
                    {
                        name: "Ping",
                        value: `${client.ws.ping}ms`,
                        inline: true
                    },
                    {
                        name: "Model",
                        value: "Solor 1.5 Light",
                        inline: true
                    }
                );

            return message.reply({ embeds: [embed] });
        }

        if (command === "chatbot") {

            const sub = args[0]?.toLowerCase();

            if (sub === "setup") {

                chatbot.enabled = true;
                chatbot.channel = message.channel.id;

                return message.reply(
                    "✅ Chatbot setup complete.\nThis channel is now the AI channel."
                );
            }

            if (sub === "enable") {

                chatbot.enabled = true;

                return message.reply(
                    "✅ Chatbot enabled."
                );
            }

            if (sub === "disable") {

                chatbot.enabled = false;

                return message.reply(
                    "❌ Chatbot disabled."
                );
            }
        }
    }

    if (
        chatbot.enabled &&
        chatbot.channel === message.channel.id
    ) {

        try {

            await message.channel.sendTyping();

            const response = await ai.models.generateContent({
                model: chatbot.model,
                contents: message.content
            });

            const text =
                response.text || "No response.";

            const chunks =
                text.match(/[\s\S]{1,1900}/g) || [];

            for (const chunk of chunks) {
                await message.reply(chunk);
            }

        } catch (err) {
            console.error(err);

            message.reply(
                "❌ Gemini API error."
            );
        }
    }
});

client.login(TOKEN);
