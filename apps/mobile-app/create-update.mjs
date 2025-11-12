#!/usr/bin/env zx

// Log de démarrage
console.log(chalk.cyan("🚀 Script create-update started"));
console.log(
  chalk.cyan("📋 Arguments received:"),
  JSON.stringify(argv, null, 2),
);

// Vérifier les arguments obligatoires
const environment = argv.environment;
const message = argv.message;

if (!environment) {
  console.error(chalk.red("❌ Error: --environment est obligatoire"));
  console.log(
    chalk.yellow(
      'Usage: zx create-update.mjs --environment <preview|production> --message "votre message"',
    ),
  );
  process.exit(1);
}

if (!message || typeof message !== "string" || message.trim() === "") {
  console.error(
    chalk.red(
      "❌ Error: --message (ou -m) est obligatoire et doit être une chaîne non vide",
    ),
  );
  console.log(chalk.red(`   Valeur reçue: ${JSON.stringify(message)}`));
  console.log(
    chalk.yellow(
      'Usage: zx create-update.mjs --environment <preview|production> --message "votre message"',
    ),
  );
  process.exit(1);
}

// Valider que environment est soit preview soit production
if (!["preview", "production"].includes(environment)) {
  console.error(
    chalk.red('❌ Error: environment doit être "preview" ou "production"'),
  );
  process.exit(1);
}

// Configuration Slack (depuis variable d'environnement ou hardcodée)
console.log(chalk.cyan("🔍 Checking SLACK_WEBHOOK_URL..."));
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!SLACK_WEBHOOK_URL) {
  console.error(
    chalk.red("❌ Error: SLACK_WEBHOOK_URL environment variable is required"),
  );
  console.log(
    chalk.yellow("Please set SLACK_WEBHOOK_URL in your environment variables"),
  );
  process.exit(1);
}

console.log(chalk.green("✓ SLACK_WEBHOOK_URL found"));

// Fonction pour envoyer une notification Slack
async function notifySlack(status, emoji, environment, message, error = null) {
  console.log(chalk.cyan(`\n📢 Sending Slack notification: ${status}...`));

  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} EAS Update - ${status}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*environment:* \`${environment}\``,
          },
          {
            type: "mrkdwn",
            text: `*Message:* ${message}`,
          },
        ],
      },
    ],
  };

  if (error) {
    payload.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Error:* \`\`\`${error}\`\`\``,
      },
    });
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(chalk.green("✓ Slack notification sent successfully"));
    } else {
      console.error(
        chalk.yellow(`⚠️  Slack API returned status: ${response.status}`),
      );
    }
  } catch (err) {
    console.error(
      chalk.yellow(
        "⚠️  Impossible d'envoyer la notification Slack:",
        err.message,
      ),
    );
  }
}

// Exécuter eas update
console.log(chalk.blue(`📦 Publishing update to environment: ${environment}`));
console.log(chalk.blue(`   Message: ${message}`));
console.log(chalk.cyan("\n🔄 Starting EAS update...\n"));

try {
  // Utiliser stdio: 'inherit' pour voir l'output en temps réel
  await $({
    stdio: "inherit",
  })`eas update -m ${message} --channel ${environment}`;

  console.log(chalk.green("\n✅ Update published successfully"));
  await notifySlack("Success", "✅", environment, message);
} catch (error) {
  console.error(chalk.red("\n❌ Update failed"));
  console.error(chalk.red("Error details:"), error.stderr || error.message);
  await notifySlack(
    "Failed",
    "❌",
    environment,
    message,
    error.stderr || error.message,
  );
  process.exit(1);
}
