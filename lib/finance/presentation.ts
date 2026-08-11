import type {
  EbitdaPresentation,
  EbitdaResult,
  PeriodPosition,
} from "./types";

export function describeEbitdaResult(
  result: EbitdaResult,
  periodPosition: PeriodPosition,
): EbitdaPresentation {
  if (periodPosition === "future") {
    return {
      label: "Forecast EBITDA",
      explanation:
        "This period uses forecast sales and planned or estimated costs.",
    };
  }

  if (periodPosition === "current") {
    return {
      label: "Projected EBITDA",
      explanation:
        "This combines results so far with forecasts or estimates for the remaining period.",
    };
  }

  switch (result.status) {
    case "forecast":
      return {
        label: "Forecast EBITDA",
        explanation:
          "This completed-period view still contains forecast inputs.",
      };
    case "estimated":
      return {
        label: "Estimated EBITDA",
        explanation:
          "Some components use historical rates, averages, or planned labour.",
      };
    case "provisional":
      return {
        label: "Provisional EBITDA",
        explanation:
          "The inputs are operational actuals but at least one has not been approved.",
      };
    case "confirmed":
      return {
        label: "Confirmed EBITDA",
        explanation:
          "Every component in this result is sourced from confirmed actual data.",
      };
  }
}
