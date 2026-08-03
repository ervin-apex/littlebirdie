export function canOpenVenueFinancialRecords({
  enforcementEnabled,
  canUseProduct,
  canStartInitialSetup,
}: {
  enforcementEnabled: boolean;
  canUseProduct: boolean;
  canStartInitialSetup: boolean;
}) {
  return !enforcementEnabled || canUseProduct || canStartInitialSetup;
}
