import Header from "@/components/Header";

export default function ChallengesPage() {
  return (
    <>
      <Header />
      <div className="coming-soon page-body">
        <div className="coming-soon__content">
          <h1 className="coming-soon__title">Challenges</h1>
          <p className="coming-soon__message">
            Coming soon. We are building something exciting.
          </p>
          <p className="coming-soon__sub">
            Compete with others, burn fat together, and win prizes.
          </p>
        </div>
      </div>
    </>
  );
}
