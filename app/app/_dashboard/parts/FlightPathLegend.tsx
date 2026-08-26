import { ArrowDown, ArrowUp, Minus } from "@phosphor-icons/react";

export function FlightPathLegend() {
  return (
    <div className="flight-path-legend" aria-label="Budget performance legend">
      <span><i className="is-ahead"><ArrowUp weight="bold" /></i>Ahead of budget</span>
      <span><i className="is-behind"><ArrowDown weight="bold" /></i>Behind budget</span>
      <span><i className="is-on-budget"><Minus weight="bold" /></i>On budget</span>
      <span><i className="is-pending" />Not done yet</span>
    </div>
  );
}
