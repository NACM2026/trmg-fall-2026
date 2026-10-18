// =====================================================================
//  TRMG "Who's That Baby?" — game settings
//  Edit names, companies, questions, and round choices here.
// =====================================================================
window.GAME_CONFIG = {
  title: "Who's That Baby?",
  eventName: "TRMG Fall Conference 2026",

  supabaseUrl: "https://lbslumqezhxcebojmpip.supabase.co",
  supabaseKey: "sb_publishable_IFEZmvF1Jq3ZFxmq3jJWbg_YLtLFg23",

  // Full web address of play.html on GitHub Pages. Leave "" to build it automatically
  // from wherever presenter.html is opened (works as long as you open the GitHub link).
  playUrl: "https://nacm2026.github.io/trmg-fall-2026/babyface/play.html",

  // Where the winning team picks up gift cards (shown on the final screen + phones)
  prizeNote: "Show this screen at the TRMG registration desk to claim your gift card.",

  teams: {
    credit:      { name: "Team Credit",      color: "#3F5A8C" },
    collections: { name: "Team Collections", color: "#E8741C" }
  },

  // Associate Members — intro order = list order (alphabetical by last name).
  // Either/Or: they pick one and explain why.
  people: {
    robert:   { name: "Robert Andreu",    company: "Altus Commercial Receivables", q: ["Take the scenic route", "Take the fastest route"] },
    chris:    { name: "Chris Chaparro",   company: "Moody's",                      q: ["Coffee", "Energy drink"] },
    lori:     { name: "Lori D'Itri",      company: "Creditors Adjustment Bureau",  q: ["Make the phone call", "Send the email"] },
    dang:     { name: "Dan Grenemyer",    company: "Altus Commercial Receivables", q: ["Go with your gut", "Trust the spreadsheet"] },
    danielh:  { name: "Daniel Howarth",   company: "Sidetrade",                    q: ["Early bird", "Night owl"] },
    cinnamon: { name: "Cinnamon Leigh",   company: "Synter Resource Group",        q: ["Inbox zero", "4,000 unread and proud of it"] },
    brandon:  { name: "Brandon Loyfman",  company: "Bectran",                      q: ["Drive a semi cross-country", "Captain a cargo ship for a week"] },
    alexis:   { name: "Alexis Ortega",    company: "Bectran",                      q: ["Beach vacation", "Mountain cabin"] },
    howard:   { name: "Howard Schneider", company: "AFM",                          q: ["Truck stop jerky", "Truck stop candy"] },
    bill:     { name: "Bill Weiss",       company: "Moody's",                      q: ["Window seat", "Aisle seat"] }
  },

  // Game rounds — order is shuffled vs. intros on purpose.
  // "baby" = whose baby photo is shown. "options" = the 4 choices (A–D).
  rounds: [
    { baby: "howard",   options: ["robert", "howard", "chris", "danielh"] },
    { baby: "brandon",  options: ["bill", "howard", "alexis", "brandon"] },
    { baby: "alexis",   options: ["cinnamon", "alexis", "brandon", "dang"] },
    { baby: "dang",     options: ["dang", "cinnamon", "bill", "lori"] },
    { baby: "robert",   options: ["howard", "alexis", "robert", "cinnamon"] },
    { baby: "lori",     options: ["alexis", "cinnamon", "dang", "lori"] },
    { baby: "danielh",  options: ["chris", "danielh", "cinnamon", "howard"] },
    { baby: "chris",    options: ["bill", "robert", "chris", "howard"] },
    { baby: "cinnamon", options: ["bill", "lori", "danielh", "cinnamon"] },
    { baby: "bill",     options: ["howard", "dang", "bill", "danielh"] }
  ]
};
