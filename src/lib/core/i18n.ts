import { useAppStore } from "./app-store";

/**
 * Every language selectable in Settings → Display, whether or not a full
 * dictionary exists for it below — a long picker is the honest shape of a
 * real one; not every language ships translated on day one, and choosing
 * an untranslated one says so rather than silently doing nothing (see
 * `setLanguage` in app-store.ts). Names are each language's own name for
 * itself, which is what every real language picker shows regardless of
 * the UI's current language.
 */
export const LANGUAGES: Array<{ code: string; name: string }> = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "pt", name: "Português" },
  { code: "yo", name: "Yorùbá" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "sw", name: "Kiswahili" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "zh", name: "中文（简体）" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "ru", name: "Русский" },
  { code: "tr", name: "Türkçe" },
  { code: "it", name: "Italiano" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "id", name: "Bahasa Indonesia" },
];

type Dict = Record<string, string>;

/**
 * The strings that are always on screen — the sidebar, the topbar, and the
 * settings screen this picker lives on — translated for real. Everything
 * else in the product (feed captions, wallet, messages…) stays English
 * regardless of this setting; translating those is a much larger pass than
 * a language picker on its own, and pretending otherwise here would be
 * worse than being explicit about the boundary.
 */
const en: Dict = {
  nav_home: "Home", nav_explore: "Explore", nav_reels: "Reels", nav_live: "Live",
  nav_messages: "Messages", nav_notifications: "Notifications", nav_collections: "Collections",
  nav_subscriptions: "Subscriptions", nav_wallet: "Wallet", nav_settings: "Settings", nav_profile: "Profile",
  studio_dashboard: "Dashboard", studio_earnings: "Earnings", studio_content: "Content studio",
  studio_vault: "Vault", studio_tiers: "Subscriptions & tiers", studio_fans: "Fans",
  studio_messages: "Mass messaging", studio_live: "Go Live", studio_promos: "Promotions",
  studio_analytics: "Analytics", studio_payouts: "Payouts", studio_verify: "Verification",
  tab_home: "Home", tab_explore: "Explore", tab_live: "Live", tab_inbox: "Inbox",
  studio_tab_home: "Home", studio_tab_content: "Content", studio_tab_earnings: "Earnings", studio_tab_fans: "Fans",
  search_placeholder: "Search creators, posts, transactions…",
  browse: "Browse", studio_toggle: "Studio", create: "Create",
  switch_to_studio: "Switch to Creator Studio", switch_to_browsing: "Switch to Browsing",
  collapse: "Collapse", expand: "Expand", sign_out: "Sign out", log_out: "Log out",
  settings_title: "Settings", settings_account: "Account", settings_notifications: "Notifications",
  settings_display: "Display", settings_privacy: "Privacy and safety",
  save_changes: "Save changes", language: "Language", theme: "Theme",
  theme_light: "Light", theme_dark: "Dark", theme_system: "System", back: "Back",
  language_updated: "Language updated",
};

const fr: Dict = {
  nav_home: "Accueil", nav_explore: "Explorer", nav_reels: "Reels", nav_live: "En direct",
  nav_messages: "Messages", nav_notifications: "Notifications", nav_collections: "Collections",
  nav_subscriptions: "Abonnements", nav_wallet: "Portefeuille", nav_settings: "Paramètres", nav_profile: "Profil",
  studio_dashboard: "Tableau de bord", studio_earnings: "Revenus", studio_content: "Studio de contenu",
  studio_vault: "Coffre", studio_tiers: "Abonnements et paliers", studio_fans: "Fans",
  studio_messages: "Messagerie de masse", studio_live: "Diffuser en direct", studio_promos: "Promotions",
  studio_analytics: "Analytique", studio_payouts: "Paiements", studio_verify: "Vérification",
  tab_home: "Accueil", tab_explore: "Explorer", tab_live: "En direct", tab_inbox: "Messagerie",
  studio_tab_home: "Accueil", studio_tab_content: "Contenu", studio_tab_earnings: "Revenus", studio_tab_fans: "Fans",
  search_placeholder: "Rechercher des créateurs, publications, transactions…",
  browse: "Parcourir", studio_toggle: "Studio", create: "Créer",
  switch_to_studio: "Passer au Studio créateur", switch_to_browsing: "Revenir à la navigation",
  collapse: "Réduire", expand: "Développer", sign_out: "Déconnexion", log_out: "Se déconnecter",
  settings_title: "Paramètres", settings_account: "Compte", settings_notifications: "Notifications",
  settings_display: "Affichage", settings_privacy: "Confidentialité et sécurité",
  save_changes: "Enregistrer les modifications", language: "Langue", theme: "Thème",
  theme_light: "Clair", theme_dark: "Sombre", theme_system: "Système", back: "Retour",
  language_updated: "Langue mise à jour",
};

const es: Dict = {
  nav_home: "Inicio", nav_explore: "Explorar", nav_reels: "Reels", nav_live: "En vivo",
  nav_messages: "Mensajes", nav_notifications: "Notificaciones", nav_collections: "Colecciones",
  nav_subscriptions: "Suscripciones", nav_wallet: "Billetera", nav_settings: "Configuración", nav_profile: "Perfil",
  studio_dashboard: "Panel", studio_earnings: "Ganancias", studio_content: "Estudio de contenido",
  studio_vault: "Bóveda", studio_tiers: "Suscripciones y niveles", studio_fans: "Fans",
  studio_messages: "Mensajería masiva", studio_live: "Transmitir en vivo", studio_promos: "Promociones",
  studio_analytics: "Analítica", studio_payouts: "Pagos", studio_verify: "Verificación",
  tab_home: "Inicio", tab_explore: "Explorar", tab_live: "En vivo", tab_inbox: "Bandeja",
  studio_tab_home: "Inicio", studio_tab_content: "Contenido", studio_tab_earnings: "Ganancias", studio_tab_fans: "Fans",
  search_placeholder: "Buscar creadores, publicaciones, transacciones…",
  browse: "Explorar", studio_toggle: "Studio", create: "Crear",
  switch_to_studio: "Cambiar a Estudio de creador", switch_to_browsing: "Volver a Explorar",
  collapse: "Contraer", expand: "Expandir", sign_out: "Cerrar sesión", log_out: "Cerrar sesión",
  settings_title: "Configuración", settings_account: "Cuenta", settings_notifications: "Notificaciones",
  settings_display: "Pantalla", settings_privacy: "Privacidad y seguridad",
  save_changes: "Guardar cambios", language: "Idioma", theme: "Tema",
  theme_light: "Claro", theme_dark: "Oscuro", theme_system: "Sistema", back: "Atrás",
  language_updated: "Idioma actualizado",
};

const de: Dict = {
  nav_home: "Startseite", nav_explore: "Entdecken", nav_reels: "Reels", nav_live: "Live",
  nav_messages: "Nachrichten", nav_notifications: "Benachrichtigungen", nav_collections: "Sammlungen",
  nav_subscriptions: "Abonnements", nav_wallet: "Wallet", nav_settings: "Einstellungen", nav_profile: "Profil",
  studio_dashboard: "Übersicht", studio_earnings: "Einnahmen", studio_content: "Content-Studio",
  studio_vault: "Tresor", studio_tiers: "Abonnements & Stufen", studio_fans: "Fans",
  studio_messages: "Massennachrichten", studio_live: "Live gehen", studio_promos: "Aktionen",
  studio_analytics: "Analysen", studio_payouts: "Auszahlungen", studio_verify: "Verifizierung",
  tab_home: "Start", tab_explore: "Entdecken", tab_live: "Live", tab_inbox: "Posteingang",
  studio_tab_home: "Start", studio_tab_content: "Inhalt", studio_tab_earnings: "Einnahmen", studio_tab_fans: "Fans",
  search_placeholder: "Creator, Beiträge, Transaktionen suchen…",
  browse: "Durchsuchen", studio_toggle: "Studio", create: "Erstellen",
  switch_to_studio: "Zum Creator-Studio wechseln", switch_to_browsing: "Zurück zum Durchsuchen",
  collapse: "Einklappen", expand: "Ausklappen", sign_out: "Abmelden", log_out: "Abmelden",
  settings_title: "Einstellungen", settings_account: "Konto", settings_notifications: "Benachrichtigungen",
  settings_display: "Anzeige", settings_privacy: "Datenschutz und Sicherheit",
  save_changes: "Änderungen speichern", language: "Sprache", theme: "Design",
  theme_light: "Hell", theme_dark: "Dunkel", theme_system: "System", back: "Zurück",
  language_updated: "Sprache aktualisiert",
};

const pt: Dict = {
  nav_home: "Início", nav_explore: "Explorar", nav_reels: "Reels", nav_live: "Ao vivo",
  nav_messages: "Mensagens", nav_notifications: "Notificações", nav_collections: "Coleções",
  nav_subscriptions: "Assinaturas", nav_wallet: "Carteira", nav_settings: "Configurações", nav_profile: "Perfil",
  studio_dashboard: "Painel", studio_earnings: "Ganhos", studio_content: "Estúdio de conteúdo",
  studio_vault: "Cofre", studio_tiers: "Assinaturas e níveis", studio_fans: "Fãs",
  studio_messages: "Mensagens em massa", studio_live: "Transmitir ao vivo", studio_promos: "Promoções",
  studio_analytics: "Análises", studio_payouts: "Pagamentos", studio_verify: "Verificação",
  tab_home: "Início", tab_explore: "Explorar", tab_live: "Ao vivo", tab_inbox: "Caixa de entrada",
  studio_tab_home: "Início", studio_tab_content: "Conteúdo", studio_tab_earnings: "Ganhos", studio_tab_fans: "Fãs",
  search_placeholder: "Buscar criadores, publicações, transações…",
  browse: "Navegar", studio_toggle: "Studio", create: "Criar",
  switch_to_studio: "Mudar para Estúdio do criador", switch_to_browsing: "Voltar a Navegar",
  collapse: "Recolher", expand: "Expandir", sign_out: "Sair", log_out: "Sair",
  settings_title: "Configurações", settings_account: "Conta", settings_notifications: "Notificações",
  settings_display: "Exibição", settings_privacy: "Privacidade e segurança",
  save_changes: "Salvar alterações", language: "Idioma", theme: "Tema",
  theme_light: "Claro", theme_dark: "Escuro", theme_system: "Sistema", back: "Voltar",
  language_updated: "Idioma atualizado",
};

const yo: Dict = {
  nav_home: "Ilé", nav_explore: "Ṣàwárí", nav_reels: "Reels", nav_live: "Láàyè",
  nav_messages: "Ìránṣẹ́", nav_notifications: "Ìkéde", nav_collections: "Àkójọ",
  nav_subscriptions: "Ìforúkọsílẹ̀", nav_wallet: "Àpamọ́wọ́", nav_settings: "Ìtòlẹ́sẹẹsẹ", nav_profile: "Àkọsílẹ̀",
  studio_dashboard: "Pátákó", studio_earnings: "Owó tí a jẹ̀", studio_content: "Ilé-iṣẹ́ Àkóónú",
  studio_vault: "Àpótí ìpamọ́", studio_tiers: "Ìforúkọsílẹ̀ àti ìpele", studio_fans: "Onífẹ̀ẹ́",
  studio_messages: "Ìránṣẹ́ ọ̀pọ̀lọpọ̀", studio_live: "Bẹ̀rẹ̀ Láàyè", studio_promos: "Ìgbéga",
  studio_analytics: "Ìtúpalẹ̀", studio_payouts: "Sísan", studio_verify: "Ìjẹ́rìísí",
  tab_home: "Ilé", tab_explore: "Ṣàwárí", tab_live: "Láàyè", tab_inbox: "Àpótí",
  studio_tab_home: "Ilé", studio_tab_content: "Àkóónú", studio_tab_earnings: "Owó tí a jẹ̀", studio_tab_fans: "Onífẹ̀ẹ́",
  search_placeholder: "Wá àwọn oníṣẹ́, àwọn ìfiweranṣẹ, àwọn ìdúnàádúrà…",
  browse: "Wo", studio_toggle: "Studio", create: "Ṣẹ̀dá",
  switch_to_studio: "Yí padà sí Ilé-iṣẹ́ Oníṣẹ́", switch_to_browsing: "Padà sí Wíwo",
  collapse: "Kó jọ", expand: "Tú sílẹ̀", sign_out: "Jáde", log_out: "Jáde",
  settings_title: "Ìtòlẹ́sẹẹsẹ", settings_account: "Àkọọ́lẹ̀", settings_notifications: "Ìkéde",
  settings_display: "Ìfihàn", settings_privacy: "Ìpamọ́ àti Ààbò",
  save_changes: "Fi àwọn ìyípadà pamọ́", language: "Èdè", theme: "Àwòrí",
  theme_light: "Ìmọ́lẹ̀", theme_dark: "Òkùnkùn", theme_system: "Ẹ̀rọ", back: "Padà",
  language_updated: "Èdè ti yí padà",
};

const DICTS: Record<string, Dict> = { en, fr, es, de, pt, yo };

/** Whether `code` has a real dictionary — the gate `setLanguage` in
    app-store.ts checks before switching, versus just toasting that it
    isn't ready yet. */
export function isLanguageSupported(code: string): boolean {
  return code in DICTS;
}

export function translate(code: string, key: string): string {
  return DICTS[code]?.[key] ?? en[key] ?? key;
}

/** `t("nav_home")` in whatever language is active — re-renders on switch
    because it reads through the store rather than a snapshot. */
export function useT() {
  const language = useAppStore((s) => s.language);
  return (key: string) => translate(language, key);
}
