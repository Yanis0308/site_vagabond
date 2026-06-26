// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof is required to derive LegalMessageKey from messages
import frMessages from "@/messages/fr.json";

export type LegalMessageKey = Extract<
  keyof (typeof frMessages)["legal"],
  string
>;

export interface LegalSection {
  titleKey: LegalMessageKey;
  bodyKey: LegalMessageKey;
}

export const MENTIONS_SECTIONS: LegalSection[] = [
  { titleKey: "mentionsEditorTitle", bodyKey: "mentionsEditorBody" },
  { titleKey: "mentionsHostingTitle", bodyKey: "mentionsHostingBody" },
  { titleKey: "mentionsIpTitle", bodyKey: "mentionsIpBody" },
  { titleKey: "mentionsLiabilityTitle", bodyKey: "mentionsLiabilityBody" },
  { titleKey: "mentionsContactTitle", bodyKey: "mentionsContactBody" },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  { titleKey: "confIntroTitle", bodyKey: "confIntroBody" },
  { titleKey: "confWebsiteTitle", bodyKey: "confWebsiteBody" },
  { titleKey: "confAppTitle", bodyKey: "confAppBody" },
  { titleKey: "confPurposesTitle", bodyKey: "confPurposesBody" },
  { titleKey: "confLegalBasisTitle", bodyKey: "confLegalBasisBody" },
  { titleKey: "confRetentionTitle", bodyKey: "confRetentionBody" },
  { titleKey: "confSharingTitle", bodyKey: "confSharingBody" },
  { titleKey: "confRightsTitle", bodyKey: "confRightsBody" },
  { titleKey: "confCookiesTitle", bodyKey: "confCookiesBody" },
  { titleKey: "confSecurityTitle", bodyKey: "confSecurityBody" },
  { titleKey: "confChangesTitle", bodyKey: "confChangesBody" },
];

export const CGU_SECTIONS: LegalSection[] = [
  { titleKey: "cguIntroTitle", bodyKey: "cguIntroBody" },
  { titleKey: "cguScopeTitle", bodyKey: "cguScopeBody" },
  { titleKey: "cguAccountTitle", bodyKey: "cguAccountBody" },
  { titleKey: "cguAppUsageTitle", bodyKey: "cguAppBody" },
  { titleKey: "cguProTitle", bodyKey: "cguProBody" },
  { titleKey: "cguUserContentTitle", bodyKey: "cguUserContentBody" },
  { titleKey: "cguIpTitle", bodyKey: "cguIpBody" },
  { titleKey: "cguLiabilityTitle", bodyKey: "cguLiabilityBody" },
  { titleKey: "cguTerminationTitle", bodyKey: "cguTerminationBody" },
  { titleKey: "cguLawTitle", bodyKey: "cguLawBody" },
  { titleKey: "cguChangesTitle", bodyKey: "cguChangesBody" },
  { titleKey: "cguContactTitle", bodyKey: "cguContactBody" },
];

export type LegalPageTitleKey = "mentionsTitle" | "confTitle" | "cguTitle";

export type LegalLinkKey = "linkMentions" | "linkConf" | "linkCgu";
