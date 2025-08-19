export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-[#003135] via-[#024950] to-[#0FA4AF] text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">stockView</h1>
          <p className="mt-6 text-xl md:text-2xl opacity-95 max-w-3xl mx-auto leading-relaxed">
            All your investment accounts and analytics in one privacy‑first dashboard.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <a 
              href="/add-account" 
              className="px-6 py-3 bg-white text-[#003135] rounded-lg font-semibold hover:bg-zinc-50 transition-colors shadow-lg"
            >
              Add Account
            </a>
            <a 
              href="/stock-view" 
              className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              Open Analytics
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#003135] dark:text-white mb-4">Key Features</h2>
          <p className="text-lg text-[#64748B] dark:text-[#AFDDE5] max-w-2xl mx-auto">
            Everything you need to manage your investment portfolio effectively
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Feature title="Unified Portfolio" desc="Aggregate multiple broker accounts, views, and holdings with live scraping and accurate P&L." />
          <Feature title="Deep Analytics" desc="Sector, subsector, and market‑cap allocations; warnings and recommendations to rebalance risk." />
          <Feature title="Local & Private" desc="Data stays on your machine in JSON files; no external server required." />
        </div>
      </section>

      <section className="bg-[#F1F5F9] dark:bg-[#024950] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#003135] dark:text-white mb-4">What problem does stockView solve?</h2>
            <p className="text-lg text-[#64748B] dark:text-[#AFDDE5] max-w-3xl mx-auto">
              Managing multiple investment accounts is messy: scattered statements, inconsistent summaries, and manual tracking. stockView centralizes accounts, computes accurate metrics, and surfaces insights to help you make better allocation decisions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#003135] dark:text-white">Key Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">Combine holdings from multiple brokers into unified views</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">See real‑time allocations by sector, subsector, and market cap</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">Get warnings when concentration risk exceeds thresholds</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">Scan latest news for your holdings</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#003135] border border-[#E2E8F0] dark:border-[#024950] rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#003135] dark:text-white mb-4">Capabilities</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">Add Account wizard with live scraping (Groww)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">Create Views across accounts; correct weighted averages</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">Analytics dashboard with distribution charts</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#0FA4AF] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-[#003135] dark:text-white">Logging, backups, and JSON DB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#003135] dark:text-white">About Us</h2>
          <p className="text-[#003135] dark:text-white leading-relaxed">
            We are builders focused on pragmatic, privacy‑first finance tools. stockView is crafted to be robust, simple, and transparent—so you can trust your numbers and focus on decisions.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#003135] dark:text-white">Contact</h2>
          <p className="text-[#003135] dark:text-white">Have feedback, feature ideas, or want to collaborate?</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] dark:text-[#AFDDE5]">Email:</span>
              <a className="text-[#0FA4AF] hover:text-[#024950] underline font-medium" href="mailto:hello@example.com">hello@example.com</a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] dark:text-[#AFDDE5]">GitHub:</span>
              <a className="text-[#0FA4AF] hover:text-[#024950] underline font-medium" href="https://github.com/singhamit20596/stockView" target="_blank" rel="noreferrer">/stockView</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white dark:bg-[#003135] border border-[#E2E8F0] dark:border-[#024950] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-[#003135] dark:text-white mb-3">{title}</h3>
      <p className="text-[#003135] dark:text-white leading-relaxed">{desc}</p>
    </div>
  );
}
