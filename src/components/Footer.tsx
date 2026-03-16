import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-main">
      <div className="footer-main__grid">
        <div>
          <p className="footer-main__brand-name">BurnFat.fun</p>
          <p className="footer-main__brand-desc">
            The global burned fat ledger. Every kilogram recorded on-chain, permanently, for everyone who did the hard thing.
          </p>
        </div>
        <div>
          <p className="footer-main__col-title">Product</p>
          <ul className="footer-main__links">
            <li><a href="#" className="footer-main__link">Launch Counter</a></li>
            <li><Link href="/teams" className="footer-main__link">Teams</Link></li>
            <li><Link href="/challenges" className="footer-main__link">Challenges</Link></li>
            <li><a href="/privacy" className="footer-main__link">Privacy Policy</a></li>
          </ul>
        </div>
        <div>
          <p className="footer-main__col-title">Connect</p>
          <ul className="footer-main__links">
            <li><a href="https://x.com/burnfatdotfun" target="_blank" rel="noopener noreferrer" className="footer-main__link">X / Twitter</a></li>
            <li><a href="https://t.me/basefatburning/1" target="_blank" rel="noopener noreferrer" className="footer-main__link">Telegram</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-main__bottom">
        <p className="footer-main__copy">&copy; 2026 BurnFat.fun — All rights reserved.</p>
      </div>
    </footer>
  );
}
