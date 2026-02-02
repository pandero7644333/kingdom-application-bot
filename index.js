require('dotenv').config();

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: ['CHANNEL']
});

// ---- KONFIGURACJA ----
const panelChannelId = "1454159316990033930";
const reviewChannelId = "1454163377193746544";
const finalRoleId = "1454158477831438520";
const previousRoleId = "1449744737807630478";

// ---- PYTANIA ----
const questions = [
  "Jaki jest Twój nick Minecraft?",
  "Ile masz lat?",
  "Co umiesz robić? (np. budować, bić się)",
  "Jakie są Twoje poprzednie nacje na serwerze Medieval Empires?",
  "Dlaczego chciałbyś dołączyć do Królestwa Polskiego?",
  "Jak planujesz przyczynić się do rozwoju Królestwa Polskiego?",
  "Kim chciałbyś zostać?"
];

const applications = new Map();

client.once('ready', async () => {
  console.log(`Bot online jako ${client.user.tag}`);

  const channel = await client.channels.fetch(panelChannelId);

  const button = new ButtonBuilder()
    .setCustomId('start_apply')
    .setLabel('Złóż podanie')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  channel.send({
    content: 'Kliknij, aby rozpocząć podanie w DM!',
    components: [row]
  });
});

// ---- PRZYCISK START ----
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'start_apply') {
    applications.set(interaction.user.id, { step: 0, answers: [] });

    try {
      await interaction.user.send("📋 Rozpoczynamy podanie.\n" + questions[0]);
      await interaction.reply({ content: "📨 Sprawdź DM!", ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ Włącz DM od członków serwera.", ephemeral: true });
    }
  }
});

// ---- ODPOWIEDZI W DM ----
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.guild) { // TYLKO DM
    const app = applications.get(message.author.id);
    if (!app) return;

    app.answers.push(message.content);
    app.step++;

    if (app.step < questions.length) {
      await message.channel.send(questions[app.step]);
    } else {
      // KONIEC PYTAŃ
      const reviewChannel = await client.channels.fetch(reviewChannelId);

      const acceptBtn = new ButtonBuilder()
        .setCustomId(`accept_${message.author.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

      const declineBtn = new ButtonBuilder()
        .setCustomId(`decline_${message.author.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);

      await reviewChannel.send({
        content:
          `**Nowe podanie od <@${message.author.id}>**\n\n` +
          `**Nick MC:** ${app.answers[0]}\n` +
          `**Wiek:** ${app.answers[1]}\n` +
          `**Umiejętności:** ${app.answers[2]}\n` +
          `**Poprzednie nacje:** ${app.answers[3]}\n` +
          `**Dlaczego chce dołączyć:** ${app.answers[4]}\n` +
          `**Jak pomoże Królestwu:** ${app.answers[5]}\n` +
          `**Kim chce zostać:** ${app.answers[6]}`,
        components: [row]
      });

      await message.channel.send("✅ Podanie wysłane!");
      applications.delete(message.author.id);
    }
  }
});

// ---- ACCEPT / DECLINE ----
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [action, userId] = interaction.customId.split('_');
  if (!userId) return;

  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!member) return interaction.reply({ content: "Nie znaleziono użytkownika.", ephemeral: true });

  if (action === "accept") {
    await member.roles.add(finalRoleId);
    if (member.roles.cache.has(previousRoleId)) {
      await member.roles.remove(previousRoleId);
    }
    await interaction.update({ content: `✅ Zaakceptowano <@${userId}>`, components: [] });
  }

  if (action === "decline") {
    await interaction.update({ content: `❌ Odrzucono <@${userId}>`, components: [] });
  }
});

client.login(process.env.TOKEN);
