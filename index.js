require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ---------- KONFIG ----------
const panelChannelId = "1454159316990033930";
const reviewChannelId = "1454163377193746544";
const finalRoleId = "1454158477831438520";
const previousRoleId = "1449744737807630478";

// ---------- BOT ONLINE ----------
client.once('ready', async () => {
  console.log(`Bot online jako ${client.user.tag}`);

  const channel = await client.channels.fetch(panelChannelId);

  const btn = new ButtonBuilder()
    .setCustomId('open_application')
    .setLabel('Złóż podanie')
    .setStyle(ButtonStyle.Primary);

  channel.send({
    content: 'Kliknij przycisk, aby otworzyć formularz podania!',
    components: [new ActionRowBuilder().addComponents(btn)]
  });
});

// ---------- INTERAKCJE ----------
client.on(Events.InteractionCreate, async interaction => {

  // 🔹 KLIK PRZYCISKU → OTWÓRZ OKNO
  if (interaction.isButton() && interaction.customId === 'open_application') {

    const modal = new ModalBuilder()
      .setCustomId('application_modal')
      .setTitle('Podanie do Królestwa Polskiego');

    const fields = [
      ["mc", "Jaki jest Twój nick Minecraft?", TextInputStyle.Short],
      ["age", "Ile masz lat?", TextInputStyle.Short],
      ["skills", "Co umiesz robić? (np. budować, bić się)", TextInputStyle.Paragraph],
      ["nations", "Jakie są Twoje poprzednie nacje na serwerze Medieval Empires?", TextInputStyle.Paragraph],
      ["why", "Dlaczego chciałbyś dołączyć do Królestwa Polskiego?", TextInputStyle.Paragraph],
      ["help", "Jak planujesz przyczynić się do rozwoju Królestwa Polskiego?", TextInputStyle.Paragraph],
      ["role", "Kim chciałbyś zostać?", TextInputStyle.Short]
    ];

    for (const [id, label, style] of fields) {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(style)
            .setRequired(true)
        )
      );
    }

    await interaction.showModal(modal);
  }

  // 🔹 PO WYSŁANIU FORMULARZA
  if (interaction.isModalSubmit() && interaction.customId === 'application_modal') {

    const mc = interaction.fields.getTextInputValue('mc');
    const age = interaction.fields.getTextInputValue('age');
    const skills = interaction.fields.getTextInputValue('skills');
    const nations = interaction.fields.getTextInputValue('nations');
    const why = interaction.fields.getTextInputValue('why');
    const help = interaction.fields.getTextInputValue('help');
    const role = interaction.fields.getTextInputValue('role');

    const reviewChannel = await client.channels.fetch(reviewChannelId);

    const acceptBtn = new ButtonBuilder()
      .setCustomId(`accept_${interaction.user.id}_${mc}`)
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success);

    const declineBtn = new ButtonBuilder()
      .setCustomId(`decline_${interaction.user.id}`)
      .setLabel('Decline')
      .setStyle(ButtonStyle.Danger);

    await reviewChannel.send({
      content:
        `**Nowe podanie od <@${interaction.user.id}>**\n\n` +
        `**Nick MC:** ${mc}\n` +
        `**Wiek:** ${age}\n` +
        `**Umiejętności:** ${skills}\n` +
        `**Poprzednie nacje:** ${nations}\n` +
        `**Dlaczego chce dołączyć:** ${why}\n` +
        `**Jak pomoże Królestwu:** ${help}\n` +
        `**Kim chce zostać:** ${role}`,
      components: [new ActionRowBuilder().addComponents(acceptBtn, declineBtn)]
    });

    await interaction.reply({ content: "✅ Podanie wysłane!", ephemeral: true });
  }

  // 🔹 ACCEPT / DECLINE
  if (interaction.isButton()) {
    const parts = interaction.customId.split('_');
    const action = parts[0];
    const userId = parts[1];
    const mcNick = parts[2];

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return interaction.reply({ content: "Nie znaleziono użytkownika.", ephemeral: true });

    if (action === "accept") {
      await member.roles.add(finalRoleId);
      if (member.roles.cache.has(previousRoleId)) {
        await member.roles.remove(previousRoleId);
      }
      await member.setNickname(`${mcNick} (@${member.user.username})`).catch(() => {});
      await interaction.update({ content: `✅ Zaakceptowano <@${userId}>`, components: [] });
    }

    if (action === "decline") {
      await interaction.update({ content: `❌ Odrzucono <@${userId}>`, components: [] });
    }
  }

});

client.login(process.env.TOKEN);
