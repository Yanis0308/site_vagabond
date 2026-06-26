import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "..", "messages");
const legalContent = JSON.parse(
  readFileSync(join(__dirname, "legal-i18n.json"), "utf8"),
);

const LOCALES = [
  "fr",
  "en",
  "de",
  "nl",
  "it",
  "es",
  "pt",
  "pl",
  "ja",
  "zh",
  "ko",
];

/** @type {Record<string, Partial<Record<string, string>>>} */
const localeTitleOverrides = {
  de: {
    mentionsTitle: "Impressum",
    confTitle: "Datenschutzerklärung",
    cguTitle: "Nutzungsbedingungen",
    breadcrumbHome: "Startseite",
    lastUpdated: "Zuletzt aktualisiert: 18. Juni 2026",
    seeAlsoTitle: "Siehe auch",
    linkMentions: "Impressum",
    linkConf: "Datenschutz",
    linkCgu: "Nutzungsbedingungen",
  },
  nl: {
    mentionsTitle: "Juridische vermeldingen",
    confTitle: "Privacybeleid",
    cguTitle: "Gebruiksvoorwaarden",
    breadcrumbHome: "Home",
    lastUpdated: "Laatst bijgewerkt: 18 juni 2026",
    seeAlsoTitle: "Zie ook",
    linkMentions: "Juridische vermeldingen",
    linkConf: "Privacy",
    linkCgu: "Gebruiksvoorwaarden",
  },
  it: {
    mentionsTitle: "Note legali",
    confTitle: "Informativa sulla privacy",
    cguTitle: "Termini di utilizzo",
    breadcrumbHome: "Home",
    lastUpdated: "Ultimo aggiornamento: 18 giugno 2026",
    seeAlsoTitle: "Vedi anche",
    linkMentions: "Note legali",
    linkConf: "Privacy",
    linkCgu: "Termini di utilizzo",
  },
  es: {
    mentionsTitle: "Aviso legal",
    confTitle: "Política de privacidad",
    cguTitle: "Condiciones de uso",
    breadcrumbHome: "Inicio",
    lastUpdated: "Última actualización: 18 de junio de 2026",
    seeAlsoTitle: "Ver también",
    linkMentions: "Aviso legal",
    linkConf: "Privacidad",
    linkCgu: "Condiciones de uso",
  },
  pt: {
    mentionsTitle: "Aviso legal",
    confTitle: "Política de privacidade",
    cguTitle: "Termos de utilização",
    breadcrumbHome: "Início",
    lastUpdated: "Última atualização: 18 de junho de 2026",
    seeAlsoTitle: "Ver também",
    linkMentions: "Aviso legal",
    linkConf: "Privacidade",
    linkCgu: "Termos de utilização",
  },
  pl: {
    mentionsTitle: "Informacje prawne",
    confTitle: "Polityka prywatności",
    cguTitle: "Regulamin",
    breadcrumbHome: "Strona główna",
    lastUpdated: "Ostatnia aktualizacja: 18 czerwca 2026",
    seeAlsoTitle: "Zobacz także",
    linkMentions: "Informacje prawne",
    linkConf: "Prywatność",
    linkCgu: "Regulamin",
  },
  ja: {
    mentionsTitle: "法的情報",
    confTitle: "プライバシーポリシー",
    cguTitle: "利用規約",
    breadcrumbHome: "ホーム",
    lastUpdated: "最終更新日：2026年6月18日",
    seeAlsoTitle: "関連ページ",
    linkMentions: "法的情報",
    linkConf: "プライバシー",
    linkCgu: "利用規約",
  },
  zh: {
    mentionsTitle: "法律声明",
    confTitle: "隐私政策",
    cguTitle: "使用条款",
    breadcrumbHome: "首页",
    lastUpdated: "最后更新：2026年6月18日",
    seeAlsoTitle: "另见",
    linkMentions: "法律声明",
    linkConf: "隐私",
    linkCgu: "使用条款",
  },
  ko: {
    mentionsTitle: "법적 고지",
    confTitle: "개인정보 처리방침",
    cguTitle: "이용약관",
    breadcrumbHome: "홈",
    lastUpdated: "최종 업데이트: 2026년 6월 18일",
    seeAlsoTitle: "관련 페이지",
    linkMentions: "법적 고지",
    linkConf: "개인정보",
    linkCgu: "이용약관",
  },
};

function buildLegal(locale) {
  const base = legalContent[locale] ?? legalContent.en;
  const overrides = localeTitleOverrides[locale] ?? {};
  return { ...legalContent.en, ...base, ...overrides };
}

for (const locale of LOCALES) {
  const filePath = join(messagesDir, `${locale}.json`);
  const messages = JSON.parse(readFileSync(filePath, "utf8"));
  messages.legal = buildLegal(locale);
  writeFileSync(filePath, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
  console.log(`Updated legal section in ${locale}.json`);
}
