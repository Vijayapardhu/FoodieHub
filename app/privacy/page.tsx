import type { Metadata } from "next"
import { LegalPage, LegalSection } from "@/components/marketing/legal-page"

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What FoodieHub stores about you, who can see it, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="16 August 2026"
      intro="FoodieHub is a campus ordering system for the canteens at Aditya University, Surampalem. This page describes exactly what it stores about you and who can see it. It is written to be read, not to be survived."
    >
      <LegalSection heading="What we store">
        <ul className="space-y-1.5">
          <li>
            <strong>Your account:</strong> name, email address and phone
            number.
          </li>
          <li>
            <strong>Your orders:</strong> what you ordered, from which canteen,
            when, and what it cost.
          </li>
          <li>
            <strong>What you choose to add:</strong> allergies and dietary
            preferences, favourite dishes, saved orders, and any reviews or
            photos you post.
          </li>
          <li>
            <strong>Notification registrations:</strong> if you turn on order
            alerts, an anonymous address issued by your browser so we can send
            them.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="What we never store">
        <p>
          Card numbers, UPI IDs and bank details. There is nothing to store,
          because FoodieHub does not process payments — you pay the canteen at
          the counter, exactly as you would without the app.
        </p>
      </LegalSection>

      <LegalSection heading="Who can see what">
        <ul className="space-y-1.5">
          <li>
            <strong>A canteen</strong> sees the orders placed with it: your
            name, your phone number, what you ordered, and whether you have
            collected past orders from that canteen. It cannot see your
            activity at any other canteen.
          </li>
          <li>
            <strong>Other students</strong> see only your name and rating on
            reviews you choose to publish. If you join someone&apos;s group
            order, they see what you added to it.
          </li>
          <li>
            <strong>Administrators</strong> can see accounts and orders across
            the platform in order to run it.
          </li>
        </ul>
        <p>
          These rules are enforced in the database itself, not only in the app,
          so they hold regardless of how a request reaches us.
        </p>
      </LegalSection>

      <LegalSection heading="Your phone number">
        <p>
          A canteen needs to be able to reach you about an order that is
          waiting. Your number is visible to a canteen you have ordered from,
          and is not shown to other students or used for marketing.
        </p>
      </LegalSection>

      <LegalSection heading="Where your data lives">
        <p>
          FoodieHub runs on Supabase and Vercel. Your data is stored on
          Supabase infrastructure in Tokyo, Japan, and pages are served by
          Vercel. Both are processors acting on our instructions.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Orders are kept so that you and the canteen have a record of them.
          Your account and everything attached to it is kept until you ask for
          it to be deleted.
        </p>
      </LegalSection>

      <LegalSection heading="Deleting your data">
        <p>
          Ask, and your account and personal data will be deleted. Orders may
          be retained in an anonymised form — with no name, email or phone
          number attached — because a canteen&apos;s own sales records are its
          business records, not yours.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          FoodieHub sets a cookie to keep you signed in, and stores your cart,
          theme and a few preferences in your browser. There is no advertising
          or third-party tracking on this site. Promotional banners shown in
          the app are counted anonymously — the count records that a banner was
          shown, not who saw it.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If this policy changes in a way that affects you, the date at the top
          of this page changes with it.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
