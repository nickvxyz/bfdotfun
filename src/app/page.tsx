import LiveCounter from "@/components/LiveCounter";
import WaitlistForm from "@/components/WaitlistForm";
import ThemeToggle from "@/components/ThemeToggle";
import GateModal from "@/components/GateModal";

export default function Home() {
  return (
    <>
      <GateModal />
      <div className="miniapp">
        <div className="miniapp__header">
          <h1 className="miniapp__title">BurnFat.fun</h1>
          <p className="miniapp__subtitle">A Public Ledger for Fat Burned</p>
        </div>

        <div className="miniapp__counter">
          <LiveCounter label="" hook="You fight to burn every gram, kilogram, pound of fat. The Fat Burn Ledger records it permanently." />
        </div>

        <div className="miniapp__cards">
          <p className="miniapp__cards-label">Who It&apos;s For</p>
          <div className="miniapp__cards-grid">
            <div className="miniapp__card">
              <h3 className="miniapp__card-title">Individuals</h3>
              <p className="miniapp__card-desc">Join the global counter. Submit your fat loss, see it added to humanity&apos;s total. Just a number that grows.</p>
            </div>
            <div className="miniapp__card">
              <h3 className="miniapp__card-title">Coaches</h3>
              <p className="miniapp__card-desc">Create your counter. Add clients. They submit body data, you get verifiable proof of results. No spreadsheets. No trust issues.</p>
            </div>
            <div className="miniapp__card">
              <h3 className="miniapp__card-title">Gyms</h3>
              <p className="miniapp__card-desc">Create a gym-wide counter. Members&apos; progress aggregates into one number. Social proof that sells memberships — backed by permanent data.</p>
            </div>
            <div className="miniapp__card">
              <h3 className="miniapp__card-title">Companies</h3>
              <p className="miniapp__card-desc">Create a company counter. Employees submit weigh-ins, run wellness challenges with prize pools. All results recorded permanently.</p>
            </div>
          </div>
        </div>

        <div className="miniapp__waitlist">
          <p className="miniapp__waitlist-label">Get Early Access</p>
          <WaitlistForm />
        </div>

        <p className="miniapp__launching">Launching shortly.</p>
      </div>

      <footer className="footer">
        <p className="footer__copy">&copy; 2026 BurnFat.fun</p>
        <ThemeToggle />
      </footer>
    </>
  );
}
