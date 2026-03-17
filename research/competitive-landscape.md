# Web3 Fitness, Social Fitness & Weight Loss Challenge Platform Research

**Date:** 2026-03-09
**Purpose:** Competitive landscape analysis for burnfat.fun

---

## TABLE OF CONTENTS

1. [Direct Competitors (Financial Weight Loss)](#1-direct-competitors---financial-weight-loss-challenges)
2. [Web3 Fitness / Move-to-Earn](#2-web3-fitness--move-to-earn)
3. [Social Fitness Platforms](#3-social-fitness-platforms)
4. [Corporate Wellness Challenge Platforms](#4-corporate-wellness-challenge-platforms)
5. [Key Patterns & Takeaways for burnfat.fun](#5-key-patterns--takeaways-for-burnfatfun)

---

## 1. DIRECT COMPETITORS - Financial Weight Loss Challenges

### DietBet (dietbet.com)

**Status:** Active, operated by FitnessAI Inc. Over 1 million users, $100M+ in total winnings paid.

**Business Model:**
- Pool-based betting: players bet money, winners split the pot
- DietBet takes 10-25% fee depending on bet size
- Two game types:
  - **Kickstarter:** Lose 4% body weight in 4 weeks (avg bet ~$35)
  - **Transformer:** Lose 10% body weight in 6 months ($35/mo or $175 upfront)
- "No Lose Guarantee" — if too many winners, DietBet waives fees so winners at least break even
- Average winner earns $50-60; Transformer winners avg ~$325 across all 6 rounds

**Verification System:**
- Two-photo weigh-in: (1) full-length shot on scale, (2) scale readout with handwritten "weigh-in word"
- Video weigh-ins required for bets >$100 or flagged accounts
- Human referees review every submission
- BMI floor of 18.5 enforced; max weight loss caps (12% Kickstarter, progressive for Transformer)
- Zero-tolerance cheating policy — permanent ban

**Visual Design Language:**
- Clean, approachable healthcare aesthetic — white/light backgrounds
- Professional but not clinical
- Card-based game listings: image, title, game type badge, bet amount, player count, pot size, timeline, CTA
- Prominent monetary figures ($15,820 pot, 383 players)
- Influencer/host-named games (e.g. "Fatgirlfedup's Spring Startup")
- Urgency language: "Starts today," "21 days left"
- Social login (Apple, Facebook) for reduced friction
- Tab-based filtering: "All," "Starting Soon," "Just Started"

**UX Strengths:**
- Low barrier to entry (~$35)
- Community support within each game (host posts, themed days)
- Straightforward 5-step flow: Join > Weigh-In > Play > Weigh-Out > Win
- 14-day money-back guarantee
- PayPal cashout

**UX Weaknesses:**
- 10-25% fee significantly reduces winnings
- No search function for finding specific users' posts
- Emoji support missing in posts
- Focuses solely on scale weight, not body composition
- Short-term game structure may not sustain long-term habits
- Actual per-person winnings are modest ($38 in one documented case)

---

### HealthyWage (healthywage.com)

**Status:** Active, founded by behavioral economists. Featured on NPR, Today Show, GMA, Fox News, ABC.

**Business Model:**
- Individual wager model (not pool-based like DietBet)
- Users bet on their own weight loss: min 10% of body weight, 6-18 month timeframe
- Monthly wager: $5-$600/month, minimum $100 total
- Proprietary algorithm calculates prize (factors: current weight, BMI, wager amount, timeline, time of year)
- Max prize: $10,000 — prize is locked/guaranteed once bet is placed
- Also offers team challenges with up to $10,000 in additional prizes
- 25% administrative fee on challenges
- Strict no-refund policy — "Part of our job is to prevent you from giving up"
- Only ~25% of users win their bets

**Verification System:**
- Smartphone video weigh-in (start and finish only)
- At-home scale, no clinical visit required

**Visual Design Language:**
- Navy blue + white foundation — medical/trust aesthetic
- Hero-to-conversion funnel layout
- Bold headline: "Weight Loss Challenges + Cash Prizes"
- Prize amounts dominate visual hierarchy in large bold type
- Success stories in carousel format: winner photo, name, location, specific winnings, weight lost, personal quote
- Interactive prize calculator is the primary conversion tool:
  - Sliders for weight goal, timeline, monthly contribution
  - Dynamic prize range updates in real-time as users adjust
  - Encourages "what if" experimentation, building psychological investment
- Media logos bar (NPR, Today, GMA, etc.) for credibility
- JAMA research citation: "5x more likely to reach weight loss goals"
- BBB accreditation

**UX Strengths:**
- Individual bet creates personal accountability (not diluted by group)
- Calculator gamification — users play with numbers before committing
- Prize guarantee once committed
- Research-backed messaging builds trust
- Corporate wellness program adds B2B revenue stream

**UX Weaknesses:**
- 75% of users lose their money
- No refund policy feels punitive
- 25% admin fee is steep
- Minimum $100 total wager is higher barrier than DietBet
- Relies heavily on loss aversion psychology — can feel manipulative
- Algorithm is opaque — two similar users may get very different prizes

---

### StickK (stickk.com)

**Status:** Active, created by Yale behavioral economists. Free platform.

**Business Model:**
- Free commitment contracts (not pool-based)
- Users set goals, timelines, and optional financial stakes
- Lost money goes to: friend, charity, or "anti-charity" (org user opposes)
- Revenue model unclear (likely freemium/corporate)

**How It Works:**
1. Set specific, measurable, time-bound goal
2. Create commitment contract with timeline
3. Optional: add financial stake
4. Optional: designate referee to verify
5. Track progress (daily/weekly/end-of-contract reporting)

**Key Stats:**
- With referee + financial stake: 87% success rate for financial goals, 73% for weight loss
- Commitment contracts "quintuple chances of success" per academic research

**Design Language:**
- Functional, academic aesthetic (not flashy)
- Behavioral science credibility front and center
- Anti-charity concept is unique psychological lever (donate to org you hate if you fail)
- Focus on accountability over gamification

**UX Strengths:**
- Free removes all financial barriers
- Anti-charity concept is brilliant behavioral design
- Referee system adds social accountability
- Backed by rigorous Yale research
- Flexible — works for any goal, not just weight loss

**UX Weaknesses:**
- Reportedly dated interface (403 on fetch — possibly aging infrastructure)
- Less gamified than competitors
- No community/social features
- Self-reporting without verification (relies on honor system or referee)

---

### Moonwalk Fitness (Web3 — Solana)

**Status:** Active, growing. $3.4M seed round led by Hack VC. 1,000+ monthly active users, $300K+ platform deposits.

**Business Model:**
- Crypto-native pooled-stakes fitness game on Solana
- Users deposit USDC/SOL/BONK to join challenges
- Daily step goal required; miss a day = forfeit portion of stake to prize pool
- Winners recover deposit + share of losers' forfeited stakes
- Example: $1,000 buy-in, 10K steps/day for 3 days — miss one day = lose $333

**Key Details:**
- Integrates with Google Fit / Apple Health, leaderboard updates every 10 min
- $MF token TGE October 2025
- Strongest markets: France, US, Nigeria, Vietnam
- Q4 2025: expanding to cycling, running, swimming
- Q1-Q2 2026: non-crypto credits, Nike/Adidas integration, corporate wellness
- Solana Mobile launch partner (Seeker Genesis Token gives 20% XP boost)

**Design & UX:**
- Crypto-native onboarding (USDC deposit)
- Real-time leaderboard with step data
- Early bugs reported (user not appearing on leaderboard immediately)
- Positioned as "fun and engaging" — gamified accountability

**Why This Matters for burnfat.fun:**
- **Most directly comparable Web3 competitor** — crypto stakes on fitness outcomes
- But focused on steps (simple, daily), not weight loss (complex, long-term)
- Currently small user base — opportunity window exists
- Their expansion into non-crypto credits and corporate wellness shows market direction

---

## 2. WEB3 FITNESS / MOVE-TO-EARN

### STEPN (stepn.com) — The Pioneer

**Status:** 5.7M registered users. $1B valuation. Backed by Sequoia, Folius, Solana Capital.

**Business Model:**
- Buy NFT sneaker to start earning
- 4 sneaker types: Walker, Jogger, Runner, Trainer (matched to speed)
- Dual token: GST (utility — repairs, upgrades) + GMT (governance)
- $26M profit Q1, $122.5M profit Q2 (from platform fees)
- Evolved into STEPN GO with social features and sneaker lending

**Visual Design Language:**
- High-contrast, tech-forward: lime green (#8eff36), cyan (#00f1ff) against dark backgrounds (#1a1a1a)
- Headline font: PP Neue Machina Inktrap (ultrabold italic) — angular, modern, aggressive
- Body font: Inter
- Neon accents against neutrals — classic Web3 aesthetic
- Responsive: 1920px desktop to 390px mobile
- Rich interactive states (hover, pressed, grab cursors)
- Fixed navigation header with guided flows

**What Works:**
- NFT sneakers create investment/ownership psychology
- Dual token economy separates utility from governance
- Social features in STEPN GO (sneaker lending, 3D avatars)
- Activation codes from existing users = built-in referral loop

**What Fails:**
- NFT purchase barrier to entry (you pay before you earn)
- Residual active user base after initial hype
- Earnings depend heavily on daily movement — burns out casual users
- Token value volatility = unpredictable earnings

---

### Sweatcoin (sweatco.in) — The Free Alternative

**Status:** 120M+ users worldwide. Available in 51+ countries.

**Business Model:**
- Free to play — no NFT purchase required
- Steps tracked via phone's health data + GPS
- 1 SWEAT per ~7,759 steps, daily cap of 10,000 steps
- SWEAT tokens have real value, tradeable on exchanges
- Marketplace: redeem for rewards (NHS, Apple, Amazon partners)

**Visual Design Language:**
- Vibrant gradient: orange (#ff7b47) to deep purple (#643eef)
- White typography on dark backgrounds
- Fonts: Inter (body), SimplonNorm (headlines, weight 900), Orbitron (futuristic accents)
- Mobile-first responsive (390px breakpoints)
- Fixed nav with backdrop blur (glassmorphism)
- Large numbers in circular gradient-bordered containers (66 billion+ sweatcoins)
- Badge systems and challenges with progressive opacity effects
- Marquee animation scrolling country names — global reach emphasis
- Premium minimalism with energetic dynamism

**What Works:**
- Zero barrier to entry = massive adoption (120M users)
- Marketplace gives tokens tangible value
- Simple concept anyone can understand
- No crypto knowledge required to start

**What Fails:**
- Very low earning rate per step
- Daily cap limits power users
- Token value is low — earnings feel trivial
- Less gamified than competitors

---

### Genopets (genopets.me) — The Gaming Play

**Status:** Active on Solana. NFT creature game.

**Business Model:**
- Move in real life to evolve/level up NFT digital pet
- "Move. Play. Create." tagline
- Token-based economy

**Visual Design Language:**
- Dark, futuristic cyberpunk-meets-wellness aesthetic
- Primary accent: Teal/cyan (#00FFC8)
- Secondary accent: Yellow (#FFC000)
- Base: Deep navy (#181A1C)
- Orange/yellow/teal/purple gradients for depth
- Fonts: PP Monument Extended (geometric, futuristic), Baloo Thambi 2 (body), Dharma (decorative)
- Uppercase styling with generous letter-spacing
- Glassmorphism effects, noise textures
- Digital creature renders as focal point
- Fixed sidebar navigation (desktop)

**Takeaway:** Pure gaming aesthetic. Appeals to crypto-native gamers, not mainstream fitness audience. The creature-evolution mechanic is engaging but niche.

---

### Step App (step.app) — The Ecosystem Builder

**Status:** Active. Has its own blockchain (Step Network).

**Business Model:**
- Walk/run/exercise to earn rewards
- Wearable NFTs: watches, sneakers, headphones (3D rendered)
- Dual token: FITFI + KCAL
- Staking for passive income
- KCAL marketplace for utility conversion
- Multi-tier referral system

**Visual Design Language:**
- Modern tech aesthetic with multiple Google Fonts (Montserrat, Poppins, Inter, Roboto Mono)
- Hero: "Movement just got a lot more fun"
- Card-based feature layouts
- Carousel for partner/exchange logos
- 3D product visualization for NFT wearables
- Fitness-first messaging with crypto infrastructure hidden beneath

**Ecosystem:**
- Step Network (own blockchain)
- Step Exchange (trading)
- Wallet app
- Stepscan (block explorer)
- Launch platform for new projects
- Tutorial videos for onboarding

**Takeaway:** Most ambitious infrastructure play. Seven integrated platforms. But complexity may overwhelm casual fitness users. Design tries to hide crypto complexity behind consumer-friendly interfaces.

---

### OliveX / Dustland (olivex.ai) — The Narrative Play

**Status:** Active. Building fitness metaverse in The Sandbox.

**Business Model:**
- Dustland Runner: "world's first Proof of Workout audio game"
- Real-world runs progress a narrative story
- DOSE token earned for completed workouts
- NFT avatar collection (Concept Art House partnership)
- Metaverse fitness city in The Sandbox
- Active in 173 countries

**Visual Design Language:**
- Dark theme with white/light accents
- Montserrat font (100-900 weights) — modern, geometric
- Hero-to-feature cascade layout
- Product cards for different apps (Runner, Rider, Squat, Pushup)
- Token (DOSE) gets prominent placement as ecosystem heart

**Takeaway:** Audio narrative gamification is unique — turns running into an RPG. But metaverse integration feels forced. The concept works best as a running companion, not a weight loss tool.

---

## 3. SOCIAL FITNESS PLATFORMS

### Strava — The Social Standard

**Status:** 100M+ athletes. Market-defining social fitness platform.

**Brand Identity:**
- Signature color: International Orange (#FC5200), deeper Grenadier (#CC4200), White (#FFFFFF)
- Clean, sporty, energetic
- Three brand pillars: community, location, competition

**Key UX Patterns:**

**Segments & Leaderboards:**
- Geographic route segments with automatic time recording
- Digital crowns for fastest all-time efforts
- Trophies for top 10 placements
- Medals for personal bests
- Laurel crown for "Local Legend" (most completions over 90 days)
- Leaderboard filters: All Time, This Week, This Month, age groups, weight classes, social circles

**Activity Feed:**
- Multimedia posts (photos, videos with activities)
- Kudos (equivalent to likes) and comments
- Friend/following-based feed
- Club-based feeds

**Challenges:**
- Individual and community challenges
- Participant counts and join actions
- Time-based (monthly, annual)

**What Works:**
- Segments create infinite micro-competitions on real geography
- Crowns/trophies/medals system is deeply motivating
- Social feed creates accountability through visibility
- Clubs enable group identity
- "The Annual" challenge drives year-long engagement

**What Fails:**
- Segment map UI can be overwhelming (spiderweb of orange lines)
- Premium paywall for some features alienates free users
- Heavily skewed toward running/cycling — not general fitness
- No financial stakes — motivation is purely social/competitive

---

### Peloton (onepeloton.com) — The Premium Community

**Status:** Major connected fitness platform. Hardware + software ecosystem.

**Brand Identity:**
- Colors: Woodsmoke (#101113) dark base, Cardinal red (#C41F2F) for CTAs, Pumice gray (#CED0CF)
- Dark, premium, intense aesthetic
- Typography: SF Pro (iOS), Inter (Android) — cross-platform consistency
- Design team uses Figma with component library for consistency

**Key UX Patterns:**

**Leaderboards:**
- Real-time during live classes
- Points system in Lanebreak game
- Community-driven (research showed members prefer "presence of others" over pure competition)
- High-fives during workouts

**Gamification:**
- Badges for personal records, milestones, challenge completion
- "The Annual" year-long activity challenge
- Streaks for consistency
- 3-star completion system in Lanebreak

**Social Features:**
- Follow system
- Free-text comments on workout posts in Feed (2025 update)
- Feed is default tab in Community section
- "Tribes" based on interests/locations
- Member stories featured on blog
- Social engagement = 15% more frequent workouts
- Community features = 20% increase in retention

**Design Patterns:**
- Class discovery: category first, then filters (instructor, length, music genre)
- Instructor-centric — parasocial relationships drive engagement
- Live shout-outs create personal connection at scale
- Dark UI conveys premium/focused experience

**What Works:**
- Instructor personality drives emotional connection
- Real-time leaderboard creates urgency and competition
- High-five gesture is low-friction social interaction
- Streak system drives consistency
- Dark premium aesthetic signals quality

**What Fails:**
- Hardware dependency limits audience
- Subscription fatigue
- Leaderboard can be intimidating for beginners

---

### Nike Run Club — The Brand Play

**Key UX Patterns:**

**Challenges:**
- Individual and community-based
- Distance or frequency targets within timeframes
- Regular seasonal challenges

**Leaderboards:**
- Weekly mileage, total distance, challenge-specific
- Personal progress stays front and center (leaderboards secondary)
- Friend leaderboards for social competition

**Gamification:**
- Streaks, milestones, and achievement sharing
- Badges for consistency
- Personal records tracked

**Social:**
- In-app feed showing runner statuses
- Photo sharing
- Group challenges and virtual races
- Running clubs

**What Works:**
- Personal progress > competition (inclusive)
- Brand trust from Nike
- Adaptive coaching
- Virtual races turn solo workouts into communal events

---

### Fitocracy — The Cautionary Tale

**Status:** Effectively dead. App exists but abandoned, community gone, no development.

**What It Was:**
- RPG-style fitness app — earn XP for exercises, level up
- Forums and social feeds were the beating heart
- Quests and challenges

**Why It Died:**
- Strong, Strava, Fitbit offered better design + integrations
- Premium coaching didn't gain traction
- Funding dried up
- Community migrated to Reddit, Discord, Facebook
- Once social element died, gamification felt empty

**Lesson for burnfat.fun:** Gamification without sustained community = dead product. The social layer must be self-sustaining, not dependent on gamification gimmicks alone.

---

## 4. CORPORATE WELLNESS CHALLENGE PLATFORMS

### Wellable
- Gamified wellness challenges for mid-to-large enterprises
- Community chat forums, challenge leaderboards, curated rewards
- Fitness tracker integrations
- Analytics for measuring ROI
- Customizable challenge types (physical, nutrition, company-specific)

### Personify Health (formerly Virgin Pulse)
- Available in 21 languages
- Known for user-friendly, intuitive design
- Personal health assessments
- Ongoing incentive systems
- Long-term behavior change focus

**Corporate Wellness Takeaway:** This is a clear expansion path. HealthyWage already does corporate challenges. Moonwalk is planning corporate wellness for Q1-Q2 2026. The B2B angle provides recurring revenue and user acquisition at scale.

---

## 5. KEY PATTERNS & TAKEAWAYS FOR BURNFAT.FUN

### A. What the Best Platforms Do Right

| Pattern | Used By | Relevance to burnfat.fun |
|---------|---------|--------------------------|
| Financial stakes / loss aversion | DietBet, HealthyWage, StickK, Moonwalk | **Core mechanic** — proven 5x improvement in goal achievement |
| Interactive calculator / "what if" tool | HealthyWage | High — lets users play with numbers before committing |
| Pool-based pot splitting | DietBet, Moonwalk | Consider vs. individual wager model |
| Photo/video verification | DietBet, HealthyWage | Essential for trust and anti-cheating |
| Real-time leaderboards | Strava, Peloton, Moonwalk | Creates urgency and social pressure |
| Success story carousels | HealthyWage, DietBet | Critical for social proof and conversion |
| Media logo bars | HealthyWage | Trust signal — pursue press early |
| Research citations (JAMA, Yale) | HealthyWage, StickK | Academic backing legitimizes the model |
| Anti-charity concept | StickK | Unique behavioral lever worth considering |
| Streak systems | Peloton, Nike, Strava | Drives daily engagement |
| Segments / micro-competitions | Strava | Geographic challenges are sticky |
| Instructor/host personality | Peloton, DietBet | Human connection prevents churn |
| No Lose Guarantee | DietBet | Reduces perceived risk, lowers entry barrier |
| Free tier / zero barrier | Sweatcoin, StickK | Massive user acquisition |

### B. Design Language Observations

**Financial weight loss platforms (DietBet, HealthyWage):**
- Clean, trustworthy, clinical-adjacent
- Blues + whites dominate (trust colors)
- Large bold prize numbers as visual hierarchy anchors
- Testimonials with photos, names, locations, specific dollar amounts
- Simple step-by-step flows (3-5 steps)
- Low visual complexity — accessible to mainstream audience

**Web3 fitness (STEPN, Genopets, Step App):**
- Dark backgrounds with neon accents (lime, cyan, purple)
- Futuristic/gaming typography (angular, geometric)
- 3D renders of NFT assets
- Complex ecosystems with multiple tokens, staking, marketplaces
- Tend to overwhelm non-crypto users

**Social fitness (Strava, Peloton):**
- Brand-signature accent colors (Strava orange, Peloton red)
- Dark premium bases or clean whites
- Activity feeds as central organizing element
- Achievement badges, crowns, medals
- Competition balanced with community warmth

### C. burnfat.fun's Unique Position

burnfat.fun sits at an intersection no one fully owns:

| Competitor | Financial Stakes | Web3/Crypto | Weight Loss Focus | Community |
|------------|-----------------|-------------|-------------------|-----------|
| DietBet | Yes (fiat) | No | Yes | Moderate |
| HealthyWage | Yes (fiat) | No | Yes | Weak |
| StickK | Yes (fiat) | No | Partial | Weak |
| Moonwalk | Yes (crypto) | Yes | No (steps) | Growing |
| STEPN | No (earn) | Yes | No | Moderate |
| Sweatcoin | No (earn) | Yes | No | Weak |
| Strava | No | No | No | Strong |
| Peloton | No | No | No | Strong |
| **burnfat.fun** | **Yes (crypto)** | **Yes** | **Yes** | **TBD** |

**The gap:** No one does crypto-staked weight loss challenges with a real community layer. DietBet and HealthyWage prove financial incentives work for weight loss. Moonwalk proves crypto stakes work for fitness. burnfat.fun combines both with the weight loss specificity that Moonwalk lacks.

### D. Critical Design Decisions for burnfat.fun

1. **Trust-first visual language.** Don't go full Web3 neon-dark aesthetic. Weight loss is personal and vulnerable. Use the trust palette (blues, whites, clean typography) of DietBet/HealthyWage, not the gaming palette of STEPN/Genopets. Crypto should be infrastructure, not identity.

2. **Interactive stake calculator.** HealthyWage's calculator is their best conversion tool. Build one: let users slide weight goal, timeline, stake amount, and see potential winnings dynamically. This creates psychological investment before commitment.

3. **Verification system.** Photo + video weigh-in (DietBet model) is proven. Two photos: full body on scale + scale readout with verification word. Video for high-stakes bets. Human review for anti-cheating. BMI floors to prevent abuse.

4. **Pool vs. individual model.** DietBet (pool/split) creates community. HealthyWage (individual bet) creates personal stakes. Consider hybrid: pool-based challenges with individual side-bets.

5. **Success stories as conversion engine.** Both DietBet and HealthyWage lead with real winner stories: photo, name, location, pounds lost, dollars won, personal quote. This is the #1 trust builder. Start collecting these from day one.

6. **No Lose Guarantee.** DietBet's guarantee that winners won't lose money is a powerful risk reducer. Consider implementing for early adoption.

7. **Streak + challenge layering.** Combine Peloton's streak system (daily engagement) with DietBet's timed challenges (4-week/6-month arcs). Short daily actions within longer challenge containers.

8. **Anti-charity stakes.** StickK's concept of losing money to an organization you oppose is uniquely powerful. In Web3 context: stake goes to a DAO/cause you'd hate to fund.

9. **Community or die.** Fitocracy's death proves gamification without community is a dead end. The social layer (feed, encouragement, shared stakes) must be robust from launch.

10. **Crypto as invisible infrastructure.** Sweatcoin's 120M users vs STEPN's 5.7M shows that removing crypto complexity = 20x more users. Let stakes be in crypto under the hood, but present the experience in dollars/weight/progress.

### E. Market Data

- Move-to-earn market: $2.5B (2024), projected $10B by 2033 (17.4% CAGR)
- Financial incentive studies: 5x more likely to hit weight loss goals (JAMA)
- Deposit contracts outperform lottery-based incentives in meta-analysis
- Loss aversion is the strongest behavioral lever for goal achievement
- Social engagement increases workout frequency by 15% (Peloton data)
- Community features increase retention by 20% (Peloton data)
- StickK: referee + financial stake = 73% success rate for weight loss

---

## Sources

- [Top Move-to-Earn Crypto Projects 2025](https://99bitcoins.com/analysis/top-move-to-earn-crypto/)
- [STEPN & STEPN GO Deep Dive](https://gamefipulse.com/2025/05/11/stepn-stepn-go-a-deep-dive-into-move-to-earn-and-web3-fitness/)
- [Move-to-Earn: Fad or Sustainable?](https://onchain.org/magazine/move-to-earn-amp-fitness-apps-fad-or-sustainable-web3-trend/)
- [Best Move-to-Earn Crypto 2026](https://cryptonews.com/cryptocurrency/best-move-to-earn-crypto/)
- [DietBet How It Works](https://www.dietbet.com/kickstarter/how-it-works)
- [DietBet FAQ](https://www.dietbet.com/faq)
- [DietBet Review - Side Hustle Nation](https://www.sidehustlenation.com/dietbet-review/)
- [DietBet JAMA Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4307813/)
- [HealthyWage Review - Side Hustle Nation](https://www.sidehustlenation.com/healthywage-review/)
- [HealthyWage Review - Money Done Right](https://moneydoneright.com/fast-money/side-hustles/healthywage-review/)
- [HealthyWage Review - FinanceBuzz](https://financebuzz.com/healthywage-review)
- [HealthyWager Challenge](https://www.healthywage.com/healthywager/)
- [HealthyWage Prize Calculator](https://thewinningskinny.com/how-does-healthywages-prize-calculator-work/)
- [StickK Tour](https://www.stickk.com/tour)
- [StickK FAQ](https://www.stickk.com/faq)
- [Commitment Contracts Origin](https://www.thebehavioralscientist.com/articles/commitment-contracts-their-modern-origin)
- [Moonwalk Fitness - CoinDesk](https://www.coindesk.com/business/2024/02/20/how-to-make-or-lose-hundreds-of-dollars-betting-crypto-on-your-fitness-goals)
- [Moonwalk $3.4M Seed - The Block](https://www.theblock.co/post/322930/hack-vc-leads-3-4-million-seed-round-for-web3-health-accountability-app-moonwalk-fitness)
- [Moonwalk Wellness as Web3 Onramp](https://www.coindesk.com/consensus-toronto-2025-coverage/2025/05/16/could-wellness-be-an-onramp-to-web3-moonwalk-fitness-caitlin-cook-thinks-so)
- [Sweatcoin Review - Coin Bureau](https://coinbureau.com/review/sweatcoin-review/)
- [Blockchain in Health & Fitness](https://neuron.expert/news/blockchain-in-health-and-fitness-revolutionizing-wellness-and-the-fitness-industry/13561/en/)
- [Strava Brand Colors](https://mobbin.com/colors/brand/strava)
- [Strava UX Redesign Case Study](https://medium.com/design-bootcamp/ux-case-study-strava-redesign-from-a-runners-perspective-4f0107c8e421)
- [Peloton UX Case Study](https://sharanhegde.com/peloton-interactive-ui-ux-case-study/)
- [Peloton Brand Colors](https://mobbin.com/colors/brand/peloton)
- [Peloton x ustwo](https://ustwo.com/work/peloton/)
- [Nike Run Club Gamification](https://trophy.so/blog/nike-run-club-gamification-case-study)
- [Nike Run Club Community](https://www.social.plus/blog/community-story-nike-run-club)
- [Fitocracy Rise and Fall](https://the-titan-life.com/2025/08/18/is-fitocracy-dead-the-real-story-behind-the-apps-rise-and-fall/)
- [Weight Loss Gamification Startups](https://fastercapital.com/content/Weight-loss-gamification--Startups-Leveraging-Gamification-for-Effective-Weight-Loss-Strategies.html)
- [Financial Incentives for Weight Loss - JAMA RCT](https://pmc.ncbi.nlm.nih.gov/articles/PMC3583583/)
- [Behavioral Economic Incentives Meta-Analysis](https://academic.oup.com/abm/article/57/4/277/6823673)
- [Apps That Pay to Lose Weight 2026](https://financebuzz.com/apps-pay-lose-weight)
- [Weight Loss Wagering Critique](https://theoutline.com/post/8392/weight-loss-wagering-healthywage-dietbet)
- [Top Corporate Wellness Platforms 2026](https://www.wellness360.co/the-top-11-corporate-wellness-platforms-in-2025/)
- [OliveX](https://www.olivex.ai/)
- [Genopets](https://genopets.me)
- [Step App](https://step.app)
