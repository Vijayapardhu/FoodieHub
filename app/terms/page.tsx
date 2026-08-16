import type { Metadata } from "next"
import { LegalPage, LegalSection } from "@/components/marketing/legal-page"

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The agreement between you, your canteen and FoodieHub — who is responsible for what.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="16 August 2026"
      intro="FoodieHub lets you order ahead from campus canteens and collect with a token. The most important thing on this page: your contract for the food is with the canteen, not with FoodieHub."
    >
      <LegalSection heading="What FoodieHub is">
        <p>
          FoodieHub passes your order to a canteen and shows you its progress.
          The canteen cooks the food, sets the prices, and takes the payment.
          We are the message in between.
        </p>
      </LegalSection>

      <LegalSection heading="Who you are buying from">
        <p>
          When you place an order, you are buying from that canteen. Questions
          about the food — its quality, its ingredients, how it was prepared —
          are for the canteen. FoodieHub does not prepare, handle or inspect
          food.
        </p>
      </LegalSection>

      <LegalSection heading="Paying">
        <p>
          You pay the canteen at the counter when you collect, at the price
          shown in the app. FoodieHub never takes payment from you and never
          holds your money. There is no service fee, convenience fee or
          delivery charge, because there is no delivery.
        </p>
      </LegalSection>

      <LegalSection heading="Cancelling, and being declined">
        <ul className="space-y-1.5">
          <li>
            You can cancel while an order is still pending or confirmed. Once
            the kitchen starts cooking, the ingredients are committed and
            cancellation closes — call the canteen instead.
          </li>
          <li>
            A canteen can decline your order, and must tell you why. Nothing
            was paid, so nothing is refunded.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Collecting">
        <p>
          Show your token at the counter. If you do not collect, the canteen
          may record it: food that was cooked and not collected is a real cost
          to a small kitchen, and repeated no-shows are visible to the canteen
          you did it to.
        </p>
      </LegalSection>

      <LegalSection heading="Estimated times">
        <p>
          The ready-by time is an estimate based on what you ordered and how
          busy the kitchen is. It is not a guarantee, and a kitchen can revise
          it.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          Use a real name and a working phone number — a canteen may need to
          reach you about an order. Keep your sign-in details to yourself; you
          are responsible for orders placed from your account.
        </p>
      </LegalSection>

      <LegalSection heading="Reviews">
        <p>
          Rate what you actually experienced. Reviews that are abusive, or that
          are not about an order you placed, may be removed. A canteen can
          reply publicly to your review.
        </p>
      </LegalSection>

      <LegalSection heading="For canteens">
        <p>
          If you run a canteen on FoodieHub: your listing must reflect what you
          actually sell, prices must match what you charge at the counter, and
          dishes you cannot make should be marked unavailable. FoodieHub takes
          no commission on your sales. Promotional banner placements are the
          one thing that is paid for, priced per day and agreed in advance.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          FoodieHub is provided as it is, and can be unavailable — for
          maintenance, or because something has broken. When it is, order at
          the counter as you always could.
        </p>
      </LegalSection>

      <LegalSection heading="Ending your use">
        <p>
          You can stop using FoodieHub and have your account deleted at any
          time. We may suspend an account that is abusing the service, placing
          orders it has no intention of collecting, or misusing another
          person&apos;s details.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
