import Image from "next/image";
import { LANDING_V2_MEDIA } from "../media";

const ACCOUNTANT_MOMENTS = [
  {
    id: "objection",
    heading: <>But my accountant has that info.<br />They should be telling me this stuff.</>,
    boardTitle: "YR PROFIT THIS WEEK",
    amount: "?",
    note: "",
    pose: LANDING_V2_MEDIA.accountant.objection,
  },
  {
    id: "are-they",
    preface: <>But my accountant has that info.<br />They should be telling me this stuff.</>,
    heading: <>Right.<br /><em>But are they?</em></>,
    boardTitle: "YR PROFIT TMRW",
    amount: "?",
    note: "",
    pose: LANDING_V2_MEDIA.accountant.attitude,
  },
  {
    id: "profit-now",
    preface: <>Accountants report what has already happened.</>,
    heading: <>Little Birdee tells you <em>YR PROFIT NOW.</em></>,
    boardTitle: "YR PROFIT LAST WEEK",
    amount: "$4,140",
    note: "Profit",
    pose: LANDING_V2_MEDIA.accountant.presenting,
  },
  {
    id: "act-now",
    heading: <>So you can <em>do something about it <b>NOW.</b></em></>,
    support: <>Proactive, <span>not reactive.</span></>,
    boardTitle: "YR PROFIT TMRW",
    amount: "$916",
    note: "probable profit tomorrow",
    pose: LANDING_V2_MEDIA.accountant.action,
  },
] as const;

function Receipt() {
  return (
    <div className="lb2-flow-accountant__receipt">
      <Image src={LANDING_V2_MEDIA.accountant.receipt} alt="" fill sizes="(max-width: 520px) 31vw, 25vw" />
      <div>
        <span>LAST MONTH<br />YOU MADE</span><i /><strong>$15,470</strong><b>Profit</b>
      </div>
    </div>
  );
}

function ProfitBoard({ title, amount, note }: { title: string; amount: string; note: string }) {
  return (
    <div className="lb2-flow-accountant__board">
      <Image src={LANDING_V2_MEDIA.accountant.board} alt="" fill sizes="(max-width: 520px) 38vw, 29vw" />
      <span>{title}</span>
      <div data-value={amount === "?" ? "unknown" : "profit"}>
        <strong>{amount}</strong>{note && <small>{note}</small>}
      </div>
    </div>
  );
}

export function AccountantStory() {
  return (
    <section className="lb2-accountant lb2-flow-story lb2-flow-accountant" id="accountant" aria-labelledby="lb2-accountant-title">
      <h2 className="lb2-sr-only" id="lb2-accountant-title">Little Birdee gives you profit you can act on</h2>

      {ACCOUNTANT_MOMENTS.map((moment, index) => (
        <article className="lb2-flow-accountant__moment" data-moment={moment.id} key={moment.id}>
          <div className="lb2-flow-accountant__copy">
            <span className="lb2-flow-index">0{index + 1}</span>
            {"preface" in moment && moment.preface && <p>{moment.preface}</p>}
            <h3>{moment.heading}</h3>
            {"support" in moment && moment.support && <p className="lb2-flow-accountant__support">{moment.support}</p>}
          </div>

          <div className="lb2-flow-accountant__scene">
            <span className="lb2-flow-accountant__line" aria-hidden="true" />
            <Receipt />
            <div className="lb2-flow-accountant__birdee">
              <Image src={moment.pose} alt="" fill sizes="(max-width: 520px) 25vw, 18vw" />
            </div>
            <ProfitBoard title={moment.boardTitle} amount={moment.amount} note={moment.note} />
          </div>
        </article>
      ))}
    </section>
  );
}
