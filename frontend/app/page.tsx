'use client';

import { useEffect, useMemo, useState } from 'react';

type Tx = {
  id: number;
  type: string;
  provider: string;
  account: string;
  amount: string;
  status: string;
  reference: string;
  created_at: string;
};

type Stats = {
  total_spent: number;
  successful: number;
  failed: number;
  total_transactions: number;
  success_rate: number;
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [tab, setTab] = useState<'recharge' | 'bill'>('recharge');
  const [provider, setProvider] = useState('Jio');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('299');

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_spent: 0,
    successful: 0,
    failed: 0,
    total_transactions: 0,
    success_rate: 0,
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  async function refresh() {
    try {
      const [t, s] = await Promise.all([
        fetch(`${API}/api/transactions`),
        fetch(`${API}/api/analytics`),
      ]);

      if (t.ok) setTransactions(await t.json());
      if (s.ok) setStats(await s.json());
    } catch {
      setMessage('Unable to connect to PayFlow API');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function pay(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${API}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: tab,
          provider,
          account,
          amount: Number(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          data.detail?.[0]?.msg ||
            data.detail ||
            'Payment failed'
        );
      } else {
        setMessage(
          `Payment ${data.status}. Reference: ${data.reference}`
        );
        setAccount('');
        await refresh();
      }
    } catch {
      setMessage('Unable to connect to PayFlow API');
    }

    setLoading(false);
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.provider.toLowerCase().includes(search.toLowerCase()) ||
        tx.reference.toLowerCase().includes(search.toLowerCase()) ||
        tx.account.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === 'all' || tx.type === typeFilter;

      const matchesStatus =
        statusFilter === 'all' || tx.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const rechargeTotal = transactions
    .filter((tx) => tx.type === 'recharge' && tx.status === 'success')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const billTotal = transactions
    .filter((tx) => tx.type === 'bill' && tx.status === 'success')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const maxCategoryTotal = Math.max(rechargeTotal, billTotal, 1);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              PAYFLOW
            </p>

            <h1 className="text-3xl font-bold">
              Recharge & Bill Payments
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Full-stack payment management dashboard
            </p>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm">
            Demo Mode
          </span>
        </header>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-4">
          <Stat
            title="Total Spent"
            value={`₹${stats.total_spent.toLocaleString('en-IN')}`}
          />

          <Stat
            title="Successful"
            value={String(stats.successful)}
          />

          <Stat
            title="Failed"
            value={String(stats.failed)}
          />

          <Stat
            title="Success Rate"
            value={`${stats.success_rate}%`}
          />
        </section>

        {/* Analytics */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              Spending Analytics
            </h2>

            <p className="text-sm text-gray-500">
              Successful payment distribution
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">

            {/* Recharge */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">
                  Mobile Recharge
                </span>

                <span className="font-semibold">
                  ₹{rechargeTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{
                    width: `${(rechargeTotal / maxCategoryTotal) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Bills */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">
                  Bill Payments
                </span>

                <span className="font-semibold">
                  ₹{billTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all"
                  style={{
                    width: `${(billTotal / maxCategoryTotal) * 100}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </section>

        {/* Main */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* Payment Form */}
          <form
            onSubmit={pay}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex gap-2">
              <button
                type="button"
                onClick={() => setTab('recharge')}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                  tab === 'recharge'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                Recharge
              </button>

              <button
                type="button"
                onClick={() => setTab('bill')}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                  tab === 'bill'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                Bill Pay
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium">
              Provider
            </label>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mb-4 w-full rounded-xl border p-3"
            >
              <option>Jio</option>
              <option>Airtel</option>
              <option>Vi</option>
              <option>BSNL</option>
              <option>TANGEDCO</option>
              <option>ACT Fibernet</option>
            </select>

            <label className="mb-2 block text-sm font-medium">
              {tab === 'recharge'
                ? 'Mobile Number'
                : 'Consumer / Account Number'}
            </label>

            <input
              required
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={
                tab === 'recharge'
                  ? '10-digit number'
                  : 'Account number'
              }
              className="mb-4 w-full rounded-xl border p-3"
            />

            <label className="mb-2 block text-sm font-medium">
              Amount
            </label>

            <input
              required
              min="1"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mb-5 w-full rounded-xl border p-3"
            />

            <button
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : `Pay ₹${amount || 0}`}
            </button>

            {message && (
              <p className="mt-4 rounded-xl bg-gray-50 p-3 text-sm">
                {message}
              </p>
            )}
          </form>

          {/* Transactions */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-xl font-bold">
                Transaction History
              </h2>

              <p className="text-sm text-gray-500">
                Search and filter payment activity
              </p>
            </div>

            {/* Filters */}
            <div className="mb-5 grid gap-3 md:grid-cols-3">

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search provider, account or reference..."
                className="rounded-xl border p-3 text-sm"
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border p-3 text-sm"
              >
                <option value="all">All Types</option>
                <option value="recharge">Recharge</option>
                <option value="bill">Bill Pay</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border p-3 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">

                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="p-3">Provider</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Reference</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b last:border-0"
                    >
                      <td className="p-3 font-medium">
                        {tx.provider}
                      </td>

                      <td className="p-3 capitalize">
                        {tx.type}
                      </td>

                      <td className="p-3">
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            tx.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="p-3 text-gray-500">
                        {tx.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

              {filteredTransactions.length === 0 && (
                <p className="py-10 text-center text-gray-500">
                  No matching transactions found.
                </p>
              )}
            </div>

          </section>
        </section>
      </div>
    </main>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}