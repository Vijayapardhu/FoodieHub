import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection } from "@/components/marketing/legal-page"

export const metadata: Metadata = {
  title: "About FoodieHub",
  description:
    "Why FoodieHub exists, who built it, and how it makes money without charging students or taking commission from canteens.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <LegalPage
      title="About FoodieHub"
      updated="16 August 2026"
      intro="FoodieHub is a campus ordering system for the canteens at Aditya University, Surampalem. It exists because the break is short and the queue is not."
    >
      <LegalSection heading="The problem it solves">
        <p>
          Everybody on campus is free at the same time, so everybody arrives at
          the counter at the same time. The kitchen can cook far more food than
          it can take orders for — the bottleneck is the counter, not the
          stove.
        </p>
        <p>
          Ordering ahead moves the decision off the counter and spreads the
          kitchen&apos;s work across the morning instead of fifteen frantic
          minutes. You order between lectures, walk up, show a token, and pay.
        </p>
      </LegalSection>

      <LegalSection heading="What it deliberately does not do">
        <ul className="space-y-1.5">
          <li>
            <strong>No delivery.</strong> You collect. Nobody is riding a
            scooter across campus for a ₹15 chai.
          </li>
          <li>
            <strong>No markup on how you pay.</strong> Pay the canteen at the
            counter, as you always have, or online through Razorpay if you'd
            rather have it settled before you arrive. FoodieHub never holds
            your money either way.
          </li>
          <li>
            <strong>No commission.</strong> A canteen keeps every rupee it
            takes. Delivery platforms charge 20–30%; on a ₹40 plate that is the
            margin.
          </li>
          <li>
            <strong>No surge pricing, no service fee.</strong> The price in the
            app is the price on the board.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How it pays for itself">
        <p>
          Canteens can buy a promotional banner slot — on the home screen, in
          the cart, or on the order tracking page — priced per day and agreed
          in advance. That is the only money FoodieHub earns. Students pay
          nothing, and a canteen that never advertises pays nothing.
        </p>
        <p>
          Advertising is always labelled as such. A paid banner is marked{" "}
          <strong>Promoted</strong> or <strong>Ad</strong>, and buying one
          never changes where a canteen appears in search or in the list of
          canteens.
        </p>
      </LegalSection>

      <LegalSection heading="Who built it">
        <p>
          FoodieHub was designed and built by{" "}
          <a
            href="https://vijayaapardhu.dev"
            target="_blank"
            rel="noopener noreferrer author"
          >
            Vijaya Pardhu
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="For canteens">
        <p>
          Any canteen on campus can join. You get a live order queue, your own
          menu with photos and per-day opening hours, sales analytics, and a
          token scanner — with no commission and nothing to install.{" "}
          <Link href="/register-canteen">Apply here</Link>, and an
          administrator will be in touch.
        </p>
      </LegalSection>

      <LegalSection heading="The small print">
        <p>
          <Link href="/terms">Terms of service</Link> ·{" "}
          <Link href="/privacy">Privacy policy</Link> ·{" "}
          <Link href="/credits">Photo credits</Link>
        </p>
      </LegalSection>
    </LegalPage>
  )
}
