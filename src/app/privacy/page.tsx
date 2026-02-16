export default function Privacy() {
  return (
    <>
      {/* Hero (light) */}
      <section className="privacy-hero">
        <p className="privacy-hero__label">Legal</p>
        <h1 className="privacy-hero__title">Privacy Policy</h1>
        <p className="privacy-hero__subtitle">Last updated: February 2026</p>
      </section>

      {/* Content (dark) */}
      <section className="privacy">
        <div className="privacy__content">
          <h2 className="privacy__heading">What we collect</h2>
          <p className="privacy__text">
            When you join our waitlist, we collect your email address. That&apos;s it. Nothing else.
          </p>

          <h2 className="privacy__heading">Why we collect it</h2>
          <p className="privacy__text">
            Solely to notify you when BurnFat.fun launches. We will not send marketing emails, newsletters, or anything unrelated to the launch.
          </p>

          <h2 className="privacy__heading">Who sees your data</h2>
          <p className="privacy__text">
            Nobody. Your email is not shared with third parties, not sold, and not used for advertising.
          </p>

          <h2 className="privacy__heading">How long we keep it</h2>
          <p className="privacy__text">
            Until launch notification is sent. After that, waitlist data is deleted unless you create an account.
          </p>

          <h2 className="privacy__heading">Your rights</h2>
          <p className="privacy__text">
            You can request deletion of your data at any time by emailing{" "}
            <a href="mailto:healthtips2411@gmail.com" className="privacy__link">healthtips2411@gmail.com</a>.
            Under GDPR, you have the right to access, correct, or delete your personal data.
          </p>

          <h2 className="privacy__heading">Contact</h2>
          <p className="privacy__text">
            Questions about this policy? Email{" "}
            <a href="mailto:healthtips2411@gmail.com" className="privacy__link">healthtips2411@gmail.com</a>.
          </p>

          <a href="/" className="cta">
            Back to Home
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M5 12L12 19M5 12L12 5" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p className="footer__copy">&copy; 2026 BurnFat.fun</p>
      </footer>
    </>
  );
}
