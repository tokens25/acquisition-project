/**
 * Curated English names, descriptions and benefit lines from the DAZN Package
 * Atlas — generated from data/dazn/atlas.json; do not edit by hand.
 *
 * Used for what the content service does not have: the six league products'
 * cards, and a description where a market's card ships without one. Never
 * over what the content service does have.
 */
export interface AtlasLeague { product: string; name: string; desc?: string; inc?: string[]; tags?: string[]; resolution?: string; badge?: string; hl?: boolean }
export interface AtlasDazn { product?: string; name: string; desc?: string; inc?: string[]; badge?: string; hl?: boolean; resolution?: string; tags?: string[] }
export type AtlasCard = AtlasLeague | AtlasDazn

/** `${product}|${entitlementSetId}` */
export const ATLAS_LEAGUE: Record<string, AtlasLeague> = {
 "NFL|tier_nfl_pro": {
  "product": "NFL Game Pass",
  "name": "Pro",
  "inc": [
   "Every game incl. NFL RedZone, the Playoffs & Super Bowl",
   "Authentic American commentary",
   "1080p (Full HD) video",
   "Stream on 2 devices in 1 location",
   "Download to watch offline"
  ],
  "tags": [
   "NFL",
   "RedZone"
  ],
  "resolution": "HD"
 },
 "NFL|tier_nfl_ultimate": {
  "product": "NFL Game Pass",
  "name": "Ultimate",
  "inc": [
   "Every game incl. NFL RedZone, the Playoffs & Super Bowl",
   "Multiview — watch up to 4 games at once",
   "HDR & Dolby 5.1 on Thursday/Sunday Night Football, key Playoffs & Super Bowl",
   "Watch on 5 devices in 2 locations",
   "Download to watch offline"
  ],
  "tags": [
   "NFL",
   "RedZone",
   "4K/HDR"
  ],
  "resolution": "4K/HDR"
 },
 "NHL|tier_nhl_pro": {
  "product": "NHL.TV",
  "name": "Standard",
  "inc": [
   "1,000+ NHL games live + every game on demand",
   "On-demand highlights & full-game replays",
   "Download & access in 150+ countries",
   "Watch on 2 devices in 1 location"
  ],
  "tags": [
   "NHL"
  ],
  "resolution": "HD"
 },
 "NHL|tier_nhl_ultimate": {
  "product": "NHL.TV",
  "name": "Ultimate",
  "inc": [
   "1,000+ NHL games live + every game on demand",
   "Multiview — watch up to 4 games at once",
   "On-demand highlights & full-game replays",
   "Watch on 5 devices in 2 locations",
   "15% off code for NHL Shop"
  ],
  "tags": [
   "NHL"
  ],
  "resolution": "HD"
 },
 "FIBA|tier_fiba_pro": {
  "product": "Courtside 1891",
  "name": "Standard",
  "inc": [
   "Live & on-demand FIBA Basketball, Liga Endesa & Betclic Elite",
   "FIBA incl. 2027 World Cup Qualifiers & 2026 Women's World Cup",
   "Every Liga Endesa (Spain) & Betclic Elite (France) game",
   "FIBA Classics — legendary games & player profiles"
  ],
  "tags": [
   "FIBA",
   "Basketball"
  ],
  "resolution": "HD"
 },
 "FIBA|tier_fiba_ultimate": {
  "product": "Courtside 1891",
  "name": "Ultimate",
  "inc": [
   "Live & on-demand FIBA Basketball, Liga Endesa & Betclic Elite",
   "Multiview — watch up to 4 games at once",
   "FIBA incl. 2027 World Cup Qualifiers & 2026 Women's World Cup",
   "Every Liga Endesa & Betclic Elite game",
   "Watch on 5 devices in 2 locations"
  ],
  "tags": [
   "FIBA",
   "Basketball"
  ],
  "resolution": "HD"
 },
 "CollegeSports|tier_collegesports_pro": {
  "product": "College Sports",
  "name": "Pro",
  "inc": [
   "Live & on-demand NCAA college sports",
   "College football & basketball and more",
   "On-demand replays & highlights",
   "Stream on 2 devices in 1 location",
   "Download to watch offline"
  ],
  "tags": [
   "NCAA",
   "College football",
   "College basketball"
  ],
  "resolution": "HD"
 },
 "CollegeSports|tier_collegesports_ultimate": {
  "product": "College Sports",
  "name": "Ultimate",
  "inc": [
   "Live & on-demand NCAA college sports",
   "Multiview — watch up to 4 games at once",
   "College football & basketball and more",
   "Watch on 5 devices in 2 locations",
   "Download to watch offline"
  ],
  "tags": [
   "NCAA",
   "College football",
   "College basketball"
  ],
  "resolution": "HD"
 },
 "RallyTV|tier_rallytv_pro": {
  "product": "Rally TV",
  "name": "Standard",
  "inc": [
   "Live & on-demand World Rally Championship (WRC)",
   "Every round and every stage",
   "Highlights, replays & rally documentaries"
  ],
  "tags": [
   "WRC",
   "Rallying"
  ],
  "resolution": "HD"
 },
 "NationalLeagueTV|tier_nationalleaguetv_pro": {
  "product": "National League TV",
  "name": "Standard",
  "inc": [
   "Live & on-demand Vanarama National League football",
   "English non-league football",
   "Highlights & full-match replays"
  ],
  "tags": [
   "Non-league football"
  ],
  "resolution": "HD"
 }
}

/** `${market}|${entitlementSetId}` */
export const ATLAS_DAZN: Record<string, AtlasDazn> = {
 "gb|base_ent_set": {
  "name": "DAZN Standard",
  "desc": "Full HD. Combat sports + football; PPVs cost extra.",
  "inc": [
   "185+ fights a year from the best promoters",
   "Additional cost for pay-per-view events",
   "Full HD video resolution",
   "Every Serie A match + LaLiga, Bundesliga & Saudi Pro League highlights"
  ],
  "resolution": "HD"
 },
 "gb|tier_ult": {
  "name": "DAZN Ultimate",
  "desc": "Annual contract, auto-renews. Pay-per-views bundled in.",
  "inc": [
   "Minimum 12 pay-per-views a year included at no extra cost",
   "185+ fights a year from the world's best promoters",
   "HDR and Dolby 5.1 surround sound on select events",
   "Every Serie A match + LaLiga, Bundesliga & Saudi Pro League highlights"
  ],
  "badge": "NEW · PPVs included",
  "hl": true,
  "resolution": "4K/HDR"
 },
 "it|tier_bronze_it": {
  "name": "Sports",
  "desc": "Non-football sport. 1 home network.",
  "inc": [
   "Simultaneous streaming on 1 home network",
   "Watch on your devices, anywhere",
   "FanZone: interact and play with other fans during events"
  ],
  "resolution": "HD"
 },
 "it|tier_goalpass_it": {
  "name": "Goal",
  "desc": "National & international football on DAZN. 1 home network.",
  "inc": [
   "Simultaneous streaming on 1 home network",
   "Watch on your devices, anywhere",
   "FanZone: interact and play with other fans during events"
  ],
  "resolution": "HD"
 },
 "it|tier_mobile_it": {
  "name": "Mobile",
  "desc": "Mobile-only viewing of the DAZN catalogue.",
  "inc": [
   "Mobile-only access (phone / tablet)",
   "Full DAZN sport catalogue on the go"
  ],
  "badge": "Mobile only",
  "resolution": "HD"
 },
 "it|tier_myclubpass_it": {
  "name": "MyClubPass",
  "desc": "Your favourite club's Serie A matches.",
  "inc": [
   "All Serie A Enilive matches of your favourite team",
   "Highlights of every Serie A Enilive match",
   "Content and insights on your favourite team"
  ],
  "resolution": "HD"
 },
 "it|tier_silver_it": {
  "name": "Full",
  "desc": "Full access to all sport & competitions. 1 home network.",
  "inc": [
   "Simultaneous streaming on 1 home network",
   "FanZone: interact and play with other fans",
   "Watch on your devices, anywhere",
   "Eurosport channels 3,4,5,6 available separately",
   "+1 additional user purchasable anytime"
  ],
  "badge": "Best seller",
  "hl": true,
  "resolution": "HD"
 },
 "it|tier_gold_it": {
  "name": "Family",
  "desc": "Full access to all sport & competitions. 2 home networks.",
  "inc": [
   "Simultaneous streaming on 2 home networks",
   "FanZone: interact and play with other fans",
   "Watch on your devices, anywhere",
   "Eurosport channels 3,4,5,6 included"
  ],
  "resolution": "HD"
 },
 "es|tier_us_es": {
  "name": "Made in USA",
  "desc": "US sport — NBA, NFL, NASCAR (in Spanish).",
  "inc": [
   "NBA: 180 regular-season games + All-Star + Playoffs + Conference Finals + Finals (on demand)",
   "NFL: 5 weekly games, playoffs, Super Bowl & Game Time (ES) + RedZone (EN)",
   "All NASCAR races",
   "Red Bull TV & Eurosport channels"
  ],
  "resolution": "HD"
 },
 "es|tier_baloncesto_es": {
  "name": "Baloncesto",
  "desc": "Spanish & US basketball.",
  "inc": [
   "All ACB: Liga Endesa, Copa del Rey, Supercopa Endesa",
   "NBA: 180 games + All-Star + Playoffs + Finals (on demand)",
   "Special content: previews, interviews, documentaries",
   "All Premium content free outside the basketball season"
  ],
  "resolution": "HD"
 },
 "es|tier_motor_es": {
  "name": "Motor",
  "desc": "Motorsport — F1, MotoGP, NASCAR, WSBK, DTM.",
  "inc": [
   "Entire Formula 1 World Championship",
   "Entire MotoGP World Championship",
   "NASCAR, WSBK and DTM",
   "Red Bull TV & Eurosport channels",
   "All Premium content free outside the motor season"
  ],
  "resolution": "HD"
 },
 "es|tier_futbol_es": {
  "name": "Fútbol",
  "desc": "Europe's big leagues, live and on demand.",
  "inc": [
   "LALIGA: 5 matches in 35 of 38 rounds + the free match every round + all LALIGA HYPERMOTION",
   "All Europe's big leagues: Premier League, Bundesliga, Ligue 1, Eredivisie, Liga F, UEFA Nations League…",
   "NFL: 5 weekly games, playoffs, Super Bowl (ES) + RedZone (EN)",
   "All Premium content free outside the football season"
  ],
  "badge": "Best seller",
  "hl": true,
  "resolution": "HD"
 },
 "es|tier_premium_es": {
  "name": "Premium",
  "desc": "Everything DAZN Spain offers, in one plan.",
  "inc": [
   "All DAZN sport in the most complete plan",
   "Motor: F1, MotoGP, NASCAR, WSBK, DTM",
   "LALIGA + all Europe's big leagues",
   "NFL: 5 weekly games, playoffs, Super Bowl",
   "All ACB + NBA (180 games + Playoffs + Finals)",
   "Red Bull TV & Eurosport channels"
  ],
  "badge": "Special offer",
  "hl": true,
  "resolution": "HD"
 },
 "jp|tier_vito_jp": {
  "name": "Global",
  "desc": "Global sports bundle — combat sports, Supercross, Red Bull TV.",
  "inc": [
   "Boxing & combat sports, Supercross, Red Bull TV and various global sports",
   "Multi-view: watch up to 4 matches at once",
   "Monthly plan"
  ],
  "resolution": "HD"
 },
 "jp|tier_baseball_jp": {
  "name": "Baseball",
  "desc": "Baseball only — NPB, farm league, Miyazaki Phoenix League.",
  "inc": [
   "NPB pro baseball (some games excluded), farm league, Miyazaki Phoenix League + related",
   "Multi-view: up to 4 matches at once",
   "Up to 2 devices from 1 location simultaneously",
   "Annual plan (monthly instalments)"
  ],
  "resolution": "HD"
 },
 "jp|tier_dazn_jp": {
  "name": "Standard",
  "desc": "The full DAZN Japan catalogue.",
  "inc": [
   "Bundesliga & European football, J.League, pro baseball, B.League, League One",
   "Multi-view: up to 4 matches at once",
   "Up to 2 devices from 1 location simultaneously",
   "Monthly or annual plan"
  ],
  "badge": "Recommended",
  "hl": true,
  "resolution": "HD"
 },
 "de|tier_mobile_de": {
  "name": "Mobile Pass",
  "desc": "Selected live sport, highlights & near-live clips on your phone.",
  "inc": [
   "Streaming on phones only",
   "Bundesliga Konferenz live on Saturday",
   "Bundesliga & Champions League highlights on demand after full-time",
   "Near-live clips of Bundesliga & UCL during the match",
   "LALIGA, Serie A, darts and more live"
  ],
  "badge": "Mobile · on the go",
  "resolution": "HD"
 },
 "de|tier_supersport_de": {
  "name": "Super Sports",
  "desc": "Bundesliga Konferenz, international football, darts, UFC and more.",
  "inc": [
   "Bundesliga Konferenz live on Saturday",
   "All 9 Bundesliga matchday games on demand right after full-time",
   "LALIGA, Serie A, Ligue 1, FA Cup, UEFA internationals, UFC, darts and more"
  ],
  "badge": "Special offer",
  "resolution": "HD"
 },
 "de|tier_gold_de": {
  "name": "Unlimited",
  "desc": "UEFA Champions League guaranteed to 2027, Bundesliga & everything else.",
  "inc": [
   "UEFA Champions League live — guaranteed until summer 2027 (>90% of games)",
   "Bundesliga Konferenz on Saturday + all Sunday games live",
   "All 9 Bundesliga matchday games on demand after full-time",
   "LALIGA, Serie A, Ligue 1, FA Cup, UEFA internationals, UFC, darts and more"
  ],
  "badge": "Bestseller",
  "hl": true,
  "resolution": "HD"
 },
 "de|tier_gold_de_wc_2": {
  "name": "Unlimited Plus",
  "desc": "All of DAZN with parallel streams + select games in premium quality.",
  "inc": [
   "All DAZN content (like Unlimited)",
   "Multiple parallel streams",
   "Selected games (Bundesliga & UCL) in HDR + Dolby 5.1",
   "Download for offline viewing"
  ],
  "resolution": "4K/HDR"
 },
 "de|tier_bundle_ul_nflpro_de": {
  "name": "Unlimited + NFL Pro",
  "desc": "DAZN Unlimited bundled with NFL Game Pass Pro.",
  "inc": [
   "Everything in DAZN Unlimited",
   "NFL Game Pass Pro"
  ],
  "badge": "Bundle",
  "resolution": "HD"
 },
 "de|tier_bundle_ul_nflult_de": {
  "name": "Unlimited + NFL Ultimate",
  "desc": "DAZN Unlimited bundled with NFL Game Pass Ultimate.",
  "inc": [
   "Everything in DAZN Unlimited",
   "NFL Game Pass Ultimate"
  ],
  "badge": "Bundle",
  "resolution": "HD"
 },
 "fr|tier_super_sports_fr": {
  "name": "DAZN",
  "desc": "Football, basketball, boxing and more.",
  "inc": [
   "Football: LALIGA*, Copa del Rey, Serie A, Coppa Italia, Eredivisie, Jupiler Pro League, Saudi Pro League",
   "Basketball: Betclic ÉLITE (Play-in & Playoffs) + Liga ACB (Spain)",
   "Boxing: Matchroom, Queensberry, Misfits, Golden Boy…",
   "FIFA+ legends content · LIV Golf · and more",
   "1 connection"
  ],
  "badge": "Recommended",
  "resolution": "HD"
 },
 "fr|tier_leagueoneplus_fr": {
  "name": "Ligue 1+",
  "desc": "All of Ligue 1 McDonald's live. And more.",
  "inc": [
   "Now 100% of Ligue 1 McDonald's live",
   "100% of the new Ligue 3 Betclic + its Playoffs",
   "Exclusive shows, magazines & documentaries",
   "2 simultaneous connections"
  ],
  "resolution": "HD"
 },
 "fr|tier_unlimited_fr": {
  "name": "DAZN + Ligue 1+",
  "desc": "All of DAZN plus Ligue 1+.",
  "inc": [
   "Now 100% of Ligue 1 McDonald's + the new Ligue 3 Betclic on Ligue 1+",
   "Football: LALIGA*, Copa del Rey, Serie A, Coppa Italia, Eredivisie, Jupiler Pro League, Saudi Pro League",
   "Basketball: Betclic ÉLITE + Liga ACB",
   "Boxing: Matchroom, Queensberry, Misfits, Golden Boy…",
   "2 simultaneous connections"
  ],
  "badge": "Recommended",
  "hl": true,
  "resolution": "HD"
 },
 "fr|tier_unlimited_yp_fr": {
  "name": "Pass -26 ans",
  "desc": "All of DAZN + Ligue 1+, for under-26s only. No commitment.",
  "inc": [
   "100% of Ligue 1 McDonald's + Ligue 3 Betclic on Ligue 1+",
   "Football: LALIGA*, Copa del Rey, Serie A, Eredivisie, Jupiler Pro League, Saudi Pro League",
   "Basketball: Betclic ÉLITE + Liga ACB",
   "FIFA+, LIV Golf, 180+ boxing bouts a year, and more",
   "Mobile, tablet & computer only",
   "1 connection · no commitment"
  ],
  "badge": "Under-26 · no commitment",
  "resolution": "HD"
 },
 "us|base_ent_set": {
  "name": "DAZN Standard",
  "desc": "Boxing + soccer (Spanish). PPVs cost extra.",
  "inc": [
   "185+ fights a year from the best promoters",
   "Additional cost for pay-per-view events",
   "Full HD video resolution",
   "A selection of UEFA Champions League matches in Spanish + LALIGA, Bundesliga & Saudi Pro League highlights"
  ],
  "resolution": "HD"
 },
 "us|tier_ult": {
  "name": "DAZN Ultimate",
  "desc": "Annual contract, auto-renews. PPVs bundled in.",
  "inc": [
   "Minimum 12 pay-per-views a year included at no extra cost",
   "185+ fights a year from the world's best promoters",
   "HDR and Dolby 5.1 surround sound on select events",
   "A selection of UEFA Champions League & Europa League matches (Spanish only)"
  ],
  "badge": "NEW · PPVs included",
  "hl": true,
  "resolution": "4K/HDR"
 },
 "ca|tier_dazn_ca": {
  "name": "DAZN",
  "desc": "Every NFL game, UEFA Champions League, boxing (PPVs extra) and more.",
  "inc": [
   "Every NFL game from every team",
   "UEFA Champions League",
   "Boxing (PPVs not included) and more"
  ],
  "badge": "Recommended",
  "hl": true,
  "resolution": "HD"
 },
 "ca|tier_daznplus_ca": {
  "name": "DAZN+",
  "desc": "The complete sports package.",
  "inc": [
   "NFL Game Pass",
   "The best European soccer",
   "Boxing (PPVs not included), rugby and much more"
  ],
  "resolution": "HD"
 },
 "ca|tier_dazn_ca_ul": {
  "name": "DAZN Ultimate",
  "desc": "DAZN with an extra simultaneous stream.",
  "inc": [
   "Every NFL game from every team, UEFA Champions League, boxing (PPVs not included)",
   "Ultimate: up to 3 simultaneous streams"
  ],
  "resolution": "HD"
 },
 "ca|tier_daznplus_ca_ul": {
  "name": "DAZN+ Ultimate",
  "desc": "DAZN+ with an extra simultaneous stream.",
  "inc": [
   "NFL Game Pass, the best European soccer, boxing (PPVs not included) and much more",
   "Ultimate: up to 3 simultaneous streams"
  ],
  "resolution": "HD"
 },
 "au|base_ent_set": {
  "name": "DAZN Standard",
  "desc": "Boxing + football highlights. PPVs cost extra.",
  "inc": [
   "185+ fights a year from the best promoters",
   "Additional cost for pay-per-view events",
   "Full HD video resolution",
   "Highlights from LALIGA, Bundesliga and the Saudi Pro League"
  ],
  "resolution": "HD"
 },
 "au|tier_ult": {
  "name": "DAZN Ultimate",
  "desc": "Annual contract, auto-renews. PPVs bundled in.",
  "inc": [
   "Minimum 12 pay-per-views a year included at no extra cost",
   "185+ fights a year from the world's best promoters",
   "HDR and Dolby 5.1 surround sound on select events",
   "Highlights from LALIGA, Serie A, Bundesliga and the Saudi Pro League"
  ],
  "badge": "NEW · PPVs included",
  "hl": true,
  "resolution": "4K/HDR"
 },
 "br|base_ent_set": {
  "name": "DAZN Standard",
  "desc": "Full HD. Combat sports + football; PPVs cost extra.",
  "inc": [
   "185+ fights a year from the best promoters",
   "Additional cost for pay-per-view events",
   "Full HD video resolution",
   "Every Serie A match + LaLiga, Bundesliga & Saudi Pro League highlights"
  ],
  "resolution": "HD"
 },
 "br|tier_ult": {
  "name": "DAZN Ultimate",
  "desc": "Annual contract, auto-renews. Pay-per-views bundled in.",
  "inc": [
   "Minimum 12 pay-per-views a year included at no extra cost",
   "185+ fights a year from the world's best promoters",
   "HDR and Dolby 5.1 surround sound on select events",
   "Every Serie A match + LaLiga, Bundesliga & Saudi Pro League highlights"
  ],
  "badge": "NEW · PPVs included",
  "hl": true,
  "resolution": "4K/HDR"
 },
 "be|tier_silver_be": {
  "name": "DAZN Total",
  "desc": "Belgian Pro League plus European top football & combat sport.",
  "inc": [
   "All Jupiler Pro League & Challenger Pro League + the best of Lotto Super League",
   "The best of LaLiga, Serie A, Ligue 1 & the FA Cup",
   "The best of the NBA & NFL",
   "All PFL fights"
  ],
  "badge": "Best seller",
  "hl": true,
  "resolution": "HD"
 },
 "at|tier_mobile_at": {
  "name": "Mobile Pass",
  "desc": "Live sport, near-live clips, news & highlights on your phone.",
  "inc": [
   "Streaming on phones only",
   "All DAZN content on your phone",
   "Near-live clips",
   "News, stats, FanZone and more"
  ],
  "badge": "Mobile · on the go",
  "resolution": "HD"
 },
 "at|tier_gold_at": {
  "name": "DAZN",
  "desc": "LALIGA, Bundesliga (Konferenz + Sunday games), Serie A and more.",
  "inc": [
   "All LALIGA matches",
   "Bundesliga Konferenz + Sunday games live",
   "All Serie A & Ligue 1 matches",
   "UFC, FA Cup, PDC Darts and more"
  ],
  "badge": "Bestseller",
  "hl": true,
  "resolution": "HD"
 },
 "at|tier_bundle_ul_nflpro_at": {
  "name": "DAZN + NFL Pro",
  "desc": "DAZN Unlimited bundled with NFL Game Pass Pro.",
  "inc": [
   "Everything in DAZN Unlimited",
   "NFL Game Pass Pro"
  ],
  "badge": "Bundle",
  "resolution": "HD"
 },
 "at|tier_bundle_ul_nflult_at": {
  "name": "DAZN + NFL Ultimate",
  "desc": "DAZN Unlimited bundled with NFL Game Pass Ultimate.",
  "inc": [
   "Everything in DAZN Unlimited",
   "NFL Game Pass Ultimate"
  ],
  "badge": "Bundle",
  "resolution": "HD"
 },
 "li|tier_gold_li": {
  "name": "DAZN",
  "desc": "Bundesliga, European football, US sports & fight sports.",
  "inc": [
   "All Friday & Sunday Bundesliga matches, live & exclusive",
   "European football: Serie A and LaLiga",
   "US sports, fight sports and much more"
  ],
  "hl": true,
  "resolution": "HD"
 },
 "lu|tier_gold_lu": {
  "name": "DAZN",
  "desc": "European top football and combat sport.",
  "inc": [
   "European top football — LaLiga, Serie A, Bundesliga, Ligue 1",
   "Combat sports: boxing, MMA, PFL",
   "Watch on your devices, anywhere"
  ],
  "hl": true,
  "resolution": "HD"
 },
 "ch|tier_mobile_ch": {
  "name": "Mobile Pass",
  "desc": "The DAZN catalogue on your phone.",
  "inc": [
   "Streaming on phones only",
   "Full DAZN catalogue on your phone",
   "Near-live clips, news & stats"
  ],
  "badge": "Mobile · on the go",
  "resolution": "HD"
 },
 "ch|tier_supersports_ch": {
  "name": "Super Sports",
  "desc": "Bundesliga incl. Konferenz, UFC, selected LALIGA & Serie A and more.",
  "inc": [
   "Selected LALIGA matches",
   "Serie A and Ligue 1 matches",
   "Bundesliga Konferenz + Sunday games live",
   "UFC, FA Cup, PDC Darts & more"
  ],
  "badge": "Special offer",
  "resolution": "HD"
 },
 "ch|tier_unlimited_ch": {
  "name": "Unlimited",
  "desc": "All LALIGA & Serie A, Bundesliga Konferenz & Sunday games and more.",
  "inc": [
   "All LALIGA matches",
   "All Serie A & Ligue 1 matches",
   "Bundesliga Konferenz + Sunday games live",
   "UFC, FA Cup, PDC Darts & more"
  ],
  "badge": "Bestseller",
  "hl": true,
  "resolution": "HD"
 },
 "ch|tier_unlimited_wc_2_ch": {
  "name": "Unlimited Plus",
  "desc": "All of DAZN, watch on 2 streams at once.",
  "inc": [
   "All DAZN content (like Unlimited)",
   "Watch on 2 streams at the same time"
  ],
  "resolution": "4K/HDR"
 },
 "ch|tier_bundle_ul_nflpro_ch": {
  "name": "Unlimited + NFL Pro",
  "desc": "DAZN Unlimited bundled with NFL Game Pass Pro.",
  "inc": [
   "Everything in DAZN Unlimited",
   "NFL Game Pass Pro"
  ],
  "badge": "Bundle",
  "resolution": "HD"
 },
 "ch|tier_bundle_ul_nflult_ch": {
  "name": "Unlimited + NFL Ultimate",
  "desc": "DAZN Unlimited bundled with NFL Game Pass Ultimate.",
  "inc": [
   "Everything in DAZN Unlimited",
   "NFL Game Pass Ultimate"
  ],
  "badge": "Bundle",
  "resolution": "HD"
 },
 "pt|tier_motor_pt": {
  "name": "Motores",
  "desc": "All the thrill of Formula 1 and much more.",
  "inc": [
   "F1, F2, F3, Porsche Supercup, Formula E and more",
   "MotoGP & WSBK (exclusive from 2027)",
   "Portuguese rider Miguel Oliveira in WSBK",
   "Exclusive motor channel DAZN 5"
  ],
  "resolution": "HD"
 },
 "pt|tier_bronze_pt": {
  "name": "Base",
  "desc": "All football and motor content in one plan.",
  "inc": [
   "300+ Champions, Europa & Conference League games",
   "Premier League, LALIGA, Bundesliga + all motor content",
   "TV channels, podcasts, interviews, docs (DAZN 1–5)",
   "Multiview, FanZone, news, results & stats"
  ],
  "badge": "Best choice",
  "hl": true,
  "resolution": "HD"
 },
 "pt|tier_silver_pt": {
  "name": "Total",
  "desc": "The complete plan: football, motor, MMA, boxing & more.",
  "inc": [
   "The best combat sport — boxing & MMA",
   "Everything in Base + Motores",
   "TV channels, podcasts, interviews, docs (DAZN 1–5)",
   "Multiview, FanZone, news, results & stats"
  ],
  "resolution": "HD"
 },
 "tw|base_ent_set": {
  "name": "DAZN Standard",
  "desc": "The DAZN Taiwan sport catalogue.",
  "inc": [
   "The full DAZN Taiwan sport catalogue",
   "Live sport, highlights & on demand",
   "Watch across your devices"
  ],
  "hl": true,
  "resolution": "HD"
 }
}
