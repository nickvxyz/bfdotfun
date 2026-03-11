import Header from "@/components/Header";

export default function CoachesPage() {
  return (
    <>
      <Header />
      <main className="coming-soon">
        <div className="coming-soon__icon" aria-hidden="true">&#9889;</div>
        <h1 className="coming-soon__title">Coaches</h1>
        <p className="coming-soon__subtitle">Coming Soon</p>
        <p className="coming-soon__desc">
          Train under verified coaches. Track their results on-chain.
          Every superhero has a mentor.
        </p>
        <div className="coming-soon__divider" aria-hidden="true" />
        <p className="coming-soon__note">
          Burn fat now. Find your coach soon.
        </p>
      </main>
    </>
  );
}
