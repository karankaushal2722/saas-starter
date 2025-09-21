export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-2">Your account area.</p>
      <ul className="mt-4 list-disc pl-5">
        <li>
          POST <code>/api/billing/checkout</code> to start a subscription.
        </li>
        <li>
          POST <code>/api/billing/portal</code> to manage billing.
        </li>
      </ul>
    </div>
  );
}
