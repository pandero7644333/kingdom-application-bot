const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} = require('discord.js');

require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});


// 🔧 KONFIGURACJA
const panelChannelId = "1467898003330433146"; // kanał panelu
const reviewChannelId = "1454163377193746544"; // kanał adminów
const finalRoleId = "1454158477831438520";     // rola po accept
const previousRoleId = "1449744737807630478";  // rola do usunięcia


// 🚀 BOT ONLINE
client.once('ready', async () => {
  console.log(`Zalogowano jako ${client.user.tag}`);

  const channel = await client.channels.fetch(panelChannelId);

  const embed = new EmbedBuilder()
    .setTitle("📜 Podanie do Królestwa Polskiego")
    .setDescription("Kliknij przycisk poniżej, aby wypełnić podanie.")
    .setColor("Red");

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open_application")
      .setLabel("Otwórz formularz")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [button] });
});


// 🎛 OBSŁUGA INTERAKCJI
client.on('interactionCreate', async interaction => {

  // OTWARCIE FORMULARZA
  if (interaction.isButton() && interaction.customId === "open_application") {

    const modal = new ModalBuilder()
      .setCustomId("application_modal")
      .setTitle("Podanie");

    const nick = new TextInputBuilder()
      .setCustomId("nick")
      .setLabel("Jaki jest twój nick Minecraft")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const age = new TextInputBuilder()
      .setCustomId("age")
      .setLabel("Ile masz lat")
      .setStyle(TextInputStyle.Short);

    const skills = new TextInputBuilder()
      .setCustomId("skills")
      .setLabel("Co umiesz robić (np. budować, bić się)")
      .setStyle(TextInputStyle.Paragraph);

    const nations = new TextInputBuilder()
      .setCustomId("nations")
      .setLabel("Jakie są twoje poprzednie nacje")
      .setStyle(TextInputStyle.Paragraph);

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Dlaczego chcesz dołączyć")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nick),
      new ActionRowBuilder().addComponents(age),
      new ActionRowBuilder().addComponents(skills),
      new ActionRowBuilder().addComponents(nations),
      new ActionRowBuilder().addComponents(reason)
    );

    await interaction.showModal(modal);
  }

  // WYSŁANIE PODANIA
  if (interaction.isModalSubmit() && interaction.customId === "application_modal") {

    const embed = new EmbedBuilder()
      .setTitle("📥 Nowe podanie")
      .addFields(
        { name: "Nick MC", value: interaction.fields.getTextInputValue("nick") },
        { name: "Wiek", value: interaction.fields.getTextInputValue("age") },
        { name: "Umiejętności", value: interaction.fields.getTextInputValue("skills") },
        { name: "Poprzednie nacje", value: interaction.fields.getTextInputValue("nations") },
        { name: "Dlaczego chce dołączyć", value: interaction.fields.getTextInputValue("reason") }
      )
      .setFooter({ text: `ID użytkownika: ${interaction.user.id}` })
      .setColor("Blue");

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("accept_" + interaction.user.id)
        .setLabel("ACCEPT")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("decline_" + interaction.user.id)
        .setLabel("DECLINE")
        .setStyle(ButtonStyle.Danger)
    );

    const reviewChannel = await client.channels.fetch(reviewChannelId);
    await reviewChannel.send({ embeds: [embed], components: [buttons] });

    await interaction.reply({ content: "Podanie wysłane!", ephemeral: true });
  }

  // ACCEPT
  if (interaction.isButton() && interaction.customId.startsWith("accept_")) {
    const userId = interaction.customId.split("_")[1];
    const member = await interaction.guild.members.fetch(userId);

    await member.roles.add(finalRoleId);
    await member.roles.remove(previousRoleId);

    await interaction.reply({ content: "Zaakceptowano.", ephemeral: true });
  }

  // DECLINE
  if (interaction.isButton() && interaction.customId.startsWith("decline_")) {
    await interaction.reply({ content: "Odrzucono.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
