import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import ThemeToggle from "@/components/ThemeToggle";
import MiniAppRedirect from "@/components/MiniAppRedirect";

export default function Home() {
  return (
    <>
      <MiniAppRedirect />
      {/* Hero */}
      <section className="hero">
        <p className="hero__label">Burn Fat Fun</p>
        <h1 className="hero__title">
          A Public Ledger<br />for Fat Burned
        </h1>
        <p className="hero__subtitle">
          Every kilogram burned is recorded permanently.<br />
          The global total only grows.
        </p>
      </section>

      {/* Community Progress */}
      <section className="counter-section">
        <div className="counter-section__grid">
          <div className="counter-section__left">
            <LiveCounter />
          </div>

          <div className="counter-section__right">
            <p className="counter-section__text">
              This number reflects the total amount of fat burned by participants so far. Only confirmed results are added. Nothing is reset.
            </p>
          </div>
        </div>
      </section>

      {/* BIP Disclaimer */}
      <div className="bip">
        <p className="bip__text">
          burnfat.fun is built in public. Everything below reflects our current vision and may evolve as the project grows and the community shapes it. We publish what we think, build what we test, and change what doesn&apos;t work.
        </p>
      </div>

      {/* Why This Exists */}
      <section className="story">
        <p className="story__label">Why This Exists</p>
        <div className="story__content">
          <p className="story__text">
            Two years ago I weighed 91 kg and decided to do something about it for the first time in my life. I went on an extreme diet marathon — three weeks, 13 kg gone. I felt incredible. Proud. Alive.
          </p>
          <p className="story__text">
            But here&apos;s what actually got me through it: not the diet. Not discipline. I started posting about it on Instagram. A handful of followers — nothing big. But they&apos;d comment things like &ldquo;keep going Nick, you got this.&rdquo; That tiny bit of public accountability and support from a few strangers was more powerful than any meal plan or coach.
          </p>
          <p className="story__text">
            Some weight came back. I kept going. For two years I&apos;ve been in this fight — training, dieting, burning fat, gaining some back, burning again. That&apos;s the reality nobody talks about: weight loss isn&apos;t a straight line. It&apos;s cycles. And every cycle feels like starting over — unless someone&apos;s counting.
          </p>
          <p className="story__text">
            On January 2, 2026,{" "}
            <a
              href="https://x.com/basejunkie_/status/2007027057440788583"
              target="_blank"
              rel="noopener noreferrer"
              className="story__link"
            >
              @BaseJunkie_
            </a>{" "}
            posted a CTA on X to burn some excess fat gained over the Christmas holidays.
          </p>
          <p className="story__text">
            37 comments. 5,400 views. People wanted in.
          </p>
          <p className="story__text">
            A Telegram group formed that week. I was 77.6 kg. Real people sharing daily fat burning results. No coaches. No programs. Just accountability and support. Today I&apos;m 70.5. Over 20 kg burned across my lifetime. None of it recorded anywhere — until now.
          </p>
          <p className="story__text">
            And here&apos;s what I realized: my story isn&apos;t special. Millions of people are doing this right now — alone, invisible, with no record that they ever tried. The fitness industry made $250 billion selling them shame, calorie counters, and punishment mechanics. But what people actually need is not another coach or another course. It&apos;s a community of others who share the same goal and celebrate your wins instead of giving you advice.
          </p>
          <p className="story__punchline">
            That&apos;s why I&apos;m building burnfat.fun.
          </p>
        </div>
      </section>

      {/* What We're Building */}
      <section className="building">
        <p className="building__label">What We&apos;re Building</p>
        <div className="building__content">
          <h3 className="building__subheader">The Monument</h3>
          <p className="building__text">
            A global public ledger of fat burned by humans. One number that only grows. Not a fitness app. Not a diet program. A monument to collective effort.
          </p>
          <p className="building__text">
            You burn fat. You press Burn Fat. You pay $1 per kilogram. Your contribution is recorded forever.
          </p>
          <p className="building__text">
            No refund. No undo. The fat is gone. The money is gone. Both are permanent proof you took action.
          </p>

          <h3 className="building__subheader">Why It Costs Money</h3>
          <p className="building__text">
            That&apos;s the part that will make some people uncomfortable. Good.
          </p>
          <p className="building__text">
            You don&apos;t pay for the right to run a marathon. You pay a participation fee for your name to stand in the protocol. $1 per kilogram. You burned 2 kg? That&apos;s $2 to inscribe your contribution in the global fight against obesity. You can choose not to pay. I will — and I&apos;ll show everyone else I was in this fight.
          </p>
          <p className="building__accent">
            The difference between a diary and a memorial.
          </p>

          <h3 className="building__subheader">What You Get</h3>
          <p className="building__text">
            A permanent record — your kilograms in a global ledger that never resets.
          </p>
          <p className="building__text">
            Lifetime stats — total kg burned across your entire life. Weight came back and you burned it again? That&apos;s a new entry, not a failure. 10 kg in 2025 + 5 kg in 2027 = 15 kg forever.
          </p>
          <p className="building__text">
            Part of something bigger — humanity has burned 12,847 kg. 2 of them are yours. Without yours, the result is incomplete.
          </p>
          <p className="building__text">
            No competition. No shame. No leaderboard, no rankings, no streaks. Pauses are respected. Every cycle counts. Every method counts — diet, training, GLP-1, surgery. We don&apos;t judge how. We record that you did.
          </p>
        </div>
      </section>

      {/* What's Ahead */}
      <section className="roadmap">
        <p className="roadmap__label">What&apos;s Ahead</p>
        <div className="roadmap__timeline">
          <div className="roadmap__item">
            <div className="roadmap__marker">
              <span className="roadmap__version">v1</span>
              <span className="roadmap__phase">Launching Soon</span>
            </div>
            <p className="roadmap__desc">
              Manual report. $1/kg entry fee. Global counter. Live feed. Lifetime profiles. Honor system — cheating is economically pointless when there are no prizes. Referral program — bring people who burn, earn a share of their entry fees. Telegram community.
            </p>
          </div>
          <div className="roadmap__item">
            <div className="roadmap__marker">
              <span className="roadmap__version">v1.5</span>
              <span className="roadmap__phase">Weeks After Launch</span>
            </div>
            <p className="roadmap__desc">
              AI agent access — tell your agent &ldquo;I burned 1 kg, submit my report to burnfat.fun.&rdquo; The first ledger on Base your AI agent can write to. Card payments — no wallet, no crypto knowledge needed. The door opens to everyone.
            </p>
          </div>
          <div className="roadmap__item">
            <div className="roadmap__marker">
              <span className="roadmap__version">v2</span>
              <span className="roadmap__phase">Challenges &amp; Coach Marketplace</span>
            </div>
            <p className="roadmap__desc">
              Lock money behind a goal. Set a deadline. Verify with smart scales. Coaches sell courses to an audience that already pays and tracks progress.
            </p>
          </div>
          <div className="roadmap__item">
            <div className="roadmap__marker">
              <span className="roadmap__version">v3</span>
              <span className="roadmap__phase">Team Battles &amp; Global Forks</span>
            </div>
            <p className="roadmap__desc">
              5v5 and 10v10 competitions. Coaches create local counters with custom rules. Corporate wellness partnerships. Local ledgers feed into the global monument.
            </p>
          </div>
        </div>
      </section>

      {/* The Opportunity */}
      <section className="opportunity">
        <p className="opportunity__label">The Opportunity</p>
        <div className="opportunity__content">
          <p className="opportunity__text">
            The global wellness industry is valued at $250 billion. It&apos;s fragmented — thousands of apps, coaches, and platforms competing for attention with no shared infrastructure. burnfat.fun is that infrastructure.
          </p>
          <p className="opportunity__text">
            The counter is the brand and the entry point. Free to see, paid to join. $1/kg creates revenue from Day 1 with zero marginal cost. The audience that gathers around the counter becomes the marketplace — coaches come to where the users already are.
          </p>
          <p className="opportunity__text">
            Minimal capital required to validate. Clear unit economics before scale. Cumulative network effect — every new kilogram makes the counter more meaningful, every new user makes the platform more valuable for coaches.
          </p>
          <p className="opportunity__key-line">
            Once the canonical ledger of human fat burning exists, there&apos;s no second one.
          </p>
          <p className="opportunity__text">
            GLP-1 adoption is creating the largest wave of intentional weight loss in human history. AI agents are emerging as personal interfaces — burnfat.fun is the first ledger they can write to.
          </p>
          <p className="opportunity__signature">
            Solo founder. Pre-launch. Building on Base. Building in public.
          </p>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="waitlist-section">
        <p className="waitlist-section__label">Join Waitlist</p>
        <h2 className="waitlist-section__title">Get Early Access</h2>
        <p className="waitlist-section__subtitle">
          Leave your email. We&apos;ll notify you when the ledger opens.
        </p>
        <p className="waitlist-section__launching">Launching shortly.</p>
        <WaitlistForm />
      </section>

      {/* Tagline */}
      <div className="tagline">
        <p className="tagline__text">
          You fight to burn every gram, kilogram, pound of fat. The Fat Burn Ledger records it permanently.
        </p>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p className="footer__copy">&copy; 2026 BurnFat.fun</p>
        <ThemeToggle />
      </footer>
    </>
  );
}
