import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

function Receipt() {
  return (
    <div className="lb2-flow-accountant__receipt">
      <Image src={LANDING_V2_MEDIA.accountant.receipt} alt="" fill sizes="(max-width: 520px) 33vw, 20vw" />
      <div>
        <span>LAST MONTH<br />YOU MADE</span><i /><strong>$15,470</strong><b>Profit</b>
      </div>
    </div>
  );
}

function ProfitBoard({ title, amount, note }: { title: string; amount: string; note?: string }) {
  return (
    <div className="lb2-flow-accountant__board">
      <Image src={LANDING_V2_MEDIA.accountant.board} alt="" fill sizes="(max-width: 520px) 65vw, 32vw" />
      <span>{title}</span>
      <div data-value={amount === "?" ? "unknown" : "profit"}>
        <strong>{amount}</strong>{note && <small>{note}</small>}
      </div>
    </div>
  );
}

function AccountantScene({
  pose,
  boardTitle,
  amount,
  note,
}: {
  pose: string;
  boardTitle: string;
  amount: string;
  note?: string;
}) {
  return (
    <div className="lb2-flow-accountant__scene">
      <span className="lb2-flow-accountant__line" aria-hidden="true" />
      <Receipt />
      <div className="lb2-flow-accountant__birdee">
        <Image src={pose} alt="" fill sizes="(max-width: 520px) 34vw, 25vw" />
      </div>
      <ProfitBoard title={boardTitle} amount={amount} note={note} />
    </div>
  );
}

export function AccountantStory() {
  return (
    <section
      className="lb2-accountant lb2-flow-story lb2-flow-accountant lb2-flow-accountant--approved"
      id="accountant"
      aria-labelledby="lb2-accountant-title"
    >
      <h2 className="lb2-sr-only" id="lb2-accountant-title">Little Birdee gives you profit you can act on</h2>

      <article className="lb2-flow-accountant__moment" data-moment="objection">
        <div className="lb2-flow-accountant__copy lb2-flow-accountant__copy--objection">
          <h3>
            <span>But my accountant has that info</span>
            <span>They should be telling me this stuff</span>
            <span className="lb2-flow-accountant__cue">Right</span>
            <em>But are they?</em>
          </h3>
        </div>

        <AccountantScene
          pose={LANDING_V2_MEDIA.accountant.attitude}
          boardTitle="YOUR PROFIT NOW"
          amount="?"
        />
      </article>

      <article className="lb2-flow-accountant__moment" data-moment="act-now">
        <div className="lb2-flow-accountant__copy lb2-flow-accountant__copy--profit-now">
          <p className="lb2-flow-accountant__context">Accountants report what has already happened</p>
          <h3>
            <span>Little Birdee tells you</span>
            <em>YOUR PROFIT NOW</em>
          </h3>
          <p className="lb2-flow-accountant__action">So you can do something about it <strong>NOW</strong></p>
          <p className="lb2-flow-accountant__support">Proactive, not reactive</p>
        </div>

        <AccountantScene
          pose={LANDING_V2_MEDIA.accountant.action}
          boardTitle="YOUR PROFIT TOMORROW"
          amount="$916"
          note="probable profit tomorrow"
        />
      </article>
    </section>
  );
}
