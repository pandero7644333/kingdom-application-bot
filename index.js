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

// ---- KONFIGURACJA ----
const panelChannelId = "1454159316990033930";     // Kanał startowy
const reviewChannelId = "1454163377193746544";    // Kanał administracyjny z podaniami
const finalRoleId = "1454158477831438520";        // Rola po zaakceptowaniu
const previousRoleId = "1449744737807630478";     // Rola do usunięcia po akceptacji

// ---- READY ----
client.once('ready', async () => {
  console.log(`Bot online as ${client.user.tag}`);

  const channel = await client.channels.fetch(panelChannelId);

  const button = new ButtonBuilder()
    .setCustomId('apply_btn')
    .setLabel('Złóż podanie')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  channel.send({
    content: 'Kliknij przycisk, aby otrzymać panel w DM!',
    components: [row]
  });
});

// ---- INTERACTIONS ----
client.on(Events.InteractionCreate, async interaction => {

  // ---- BUTTON: Apply Now (Kanał) ----
  if (interaction.isButton() && interaction.customId === 'apply_btn') {
    const dmButton = new ButtonBuilder()
      .setCustomId('dm_modal')
      .setLabel('Otwórz panel w DM')
      .setStyle(ButtonStyle.Primary);

    const dmRow = new ActionRowBuilder().addComponents(dmButton);

    try {
      await interaction.user.send({
        content: 'Kliknij przycisk, aby wypełnić podanie:',
        components: [dmRow]
      });
      await interaction.reply({ content: '✅ Sprawdź swoje DM!', ephemeral: true });
    } catch(err) {
      await interaction.reply({ content: '❌ Nie mogę wysłać Ci DM. Włącz prywatne wiadomości od członków serwera.', ephemeral: true });
    }
  }

  // ---- BUTTON: Open Modal (DM) ----
  if (interaction.isButton() && interaction.customId === 'dm_modal') {
    // TYLKO OTWIERAMY MODAL W DM, nic do kanału
    const modal = new ModalBuilder()
      .setCustomId('application_modal')
      .setTitle('Podanie do Królestwa Polskiego');

    // Tekstowe pytania po polsku
    const mcNick = new TextInputBuilder()
      .setCustomId('mc_nick')
      .setLabel('Jaki jest Twój nick Minecraft?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const age = new TextInputBuilder()
      .setCustomId('age')
      .setLabel('Ile masz lat?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const skills = new TextInputBuilder()
      .setCustomId('skills')
      .setLabel('Co umiesz robić? (np. budować, bić się)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const previousNations = new TextInputBuilder()
      .setCustomId('previous_nations')
      .setLabel('Jakie są Twoje poprzednie nacje na serwerze Medieval Empires?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    const whyJoin = new TextInputBuilder()
      .setCustomId('why_join')
      .setLabel('Dlaczego chciałbyś dołączyć do Królestwa Polskiego?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const contribution = new TextInputBuilder()
      .setCustomId('contribution')
      .setLabel('Jak planujesz przyczynić się do rozwoju Królestwa Polskiego?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const roleGoal = new TextInputBuilder()
      .setCustomId('role_goal')
      .setLabel('Kim chciałbyś zostać?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(mcNick),
      new ActionRowBuilder().addComponents(age),
      new ActionRowBuilder().addComponents(skills),
      new ActionRowBuilder().addComponents(previousNations),
      new ActionRowBuilder().addComponents(whyJoin),
      new ActionRowBuilder().addComponents(contribution),
      new ActionRowBuilder().addComponents(roleGoal)
    );

    await interaction.showModal(modal); // WAŻNE: tylko modal w DM
  }

  // ---- PO SUBMIT MODAL ----
  if (interaction.isModalSubmit() && interaction.customId === 'application_modal') {
    const mcNick = interaction.fields.getTextInputValue('mc_nick');
    const age = interaction.fields.getTextInputValue('age');
    const skills = interaction.fields.getTextInputValue('skills');
    const previousNations = interaction.fields.getTextInputValue('previous_nations');
    const whyJoin = interaction.fields.getTextInputValue('why_join');
    const contribution = interaction.fields.getTextInputValue('contribution');
    const roleGoal = interaction.fields.getTextInputValue('role_goal');

    // Zmień nick użytkownika na Discordzie
    try {
      await interaction.member.setNickname(`${mcNick} (@${interaction.user.username})`);
    } catch (err) { console.log("Nie mogę zmienić nicka:", err); }

    // ---- WYŚLIJ PODANIE DO KANAŁU REVIEW ----
    const reviewChannel = await client.channels.fetch(reviewChannelId);

    const acceptButton = new ButtonBuilder()
      .setCustomId(`accept_${interaction.user.id}`)
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
      .setCustomId(`decline_${interaction.user.id}`)
      .setLabel('Decline')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

    await reviewChannel.send({
      content: `**Nowe podanie od <@${interaction.user.id}>**\n\n` +
               `**Nick Minecraft:** ${mcNick}\n` +
               `**Wiek:** ${age}\n` +
               `**Umiejętności:** ${skills}\n` +
               `**Poprzednie nacje:** ${previousNations}\n` +
               `**Dlaczego chce dołączyć:** ${whyJoin}\n` +
               `**Jak pomoże Królestwu:** ${contribution}\n` +
               `**Kim chce zostać:** ${roleGoal}`,
      components: [row]
    });

    await interaction.reply({ content: '✅ Twoje podanie zostało wysłane!', ephemeral: true });
  }

  // ---- ACCEPT / DECLINE ----
  if (interaction.isButton()) {
    const [action, userId] = interaction.customId.split('_');
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return interaction.reply({ content: "Nie znaleziono użytkownika.", ephemeral: true });

    if (action === "accept") {
      try {
        await member.roles.add(finalRoleId);
        if (previousRoleId && member.roles.cache.has(previousRoleId)) {
          await member.roles.remove(previousRoleId);
        }
        await interaction.update({ content: `✅ Podanie zaakceptowane dla <@${userId}>`, components: [] });
      } catch (err) {
        console.log(err);
        await interaction.reply({ content: "Błąd przy przydzielaniu roli.", ephemeral: true });
      }
    }

    if (action === "decline") {
      await interaction.update({ content: `❌ Podanie odrzucone dla <@${userId}>`, components: [] });
    }
  }
});

client.login(process.env.TOKEN);
