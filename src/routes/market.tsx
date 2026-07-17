import { createFileRoute } from "@tanstack/react-router";
import { DistrictBlueprint } from "@/components/DistrictBlueprint";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "The Market — Blueprint — MILVERSE" },
      {
        name: "description",
        content:
          "MILVERSE district blueprint: scam ads, cloned shops, and too-good-to-be-true deals. Verify the seller, not the price. Vote on what opens next.",
      },
    ],
  }),
  component: () => (
    <DistrictBlueprint
      district="market"
      title="The Market"
      subtitle="COMMERCIAL DECEPTION · VERIFY THE SELLER"
      concept="The Market trains you against commercial fraud: scam ads, cloned online shops, price-too-good listings, and 'brand ambassador' pitches that steal your CNIC. Verify the seller before you verify the price — the number on the tag is exactly where the scammer wants your eyes."
      mechanics={[
        "Verify-the-seller sweeps — reverse-image the storefront, check the domain, cross-check the reviews.",
        "Price-anchor traps — resist the 70%-off dopamine long enough to check the return policy.",
        "'Brand ambassador' phishing — polite DMs asking for your CNIC + address to 'onboard' you.",
      ]}
    />
  ),
});
