import { useNavigate } from 'react-router-dom'

export default function TermsOfService() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'inherit', lineHeight: 1.7, color: 'var(--text)' }}>
      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 32 }}>
        ← Back
      </button>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 40 }}>Last updated: May 8, 2026</p>

      <Section title="Overview">
        <p>These Terms of Service ("Terms") govern your use of DKP Finance ("the App"), a personal finance tracking
        web application. By signing in or using the App, you agree to these Terms. If you do not agree, do not use
        the App.</p>
      </Section>

      <Section title="1. Who may use the App">
        <p>You may use the App if you are at least 13 years old (or the minimum digital consent age in your country)
        and have a valid Google account. The App is provided free of charge for personal, non-commercial use.</p>
      </Section>

      <Section title="2. No financial advice">
        <p>DKP Finance is a data organisation tool only. Nothing in the App — including budget limits, projections,
        savings rate calculations, goal estimates, or trend indicators — constitutes financial, investment, tax, or
        legal advice. All figures are derived mechanically from data you enter. You are solely responsible for any
        financial decisions you make.</p>
        <p>Always consult a qualified financial professional before making significant financial decisions.</p>
      </Section>

      <Section title="3. Accuracy of data">
        <p>The App displays exactly what you enter. The developer makes no warranty that calculations, projections,
        or recurring-transaction logic are error-free or suitable for your specific situation. You are responsible
        for verifying the accuracy of your own entries and the outputs the App derives from them.</p>
      </Section>

      <Section title="4. Your data and Google account">
        <p>Your financial data is stored in a Google Sheets spreadsheet in your own Google Drive. By using the App
        you authorise it to read and write that spreadsheet on your behalf. You retain full ownership of your data
        at all times. You can revoke this access or delete your data at any time (see the Privacy Policy for
        instructions).</p>
        <p>You are responsible for maintaining the security of your Google account. The developer is not liable for
        data loss or unauthorised access resulting from a compromised Google account.</p>
      </Section>

      <Section title="5. Service availability">
        <p>The App is provided on an "as is" and "as available" basis with no uptime guarantee. The App depends on
        Google's APIs (Google Identity Services, Google Sheets API); any outage or change by Google may affect
        availability. The developer reserves the right to modify, suspend, or discontinue the App at any time without
        notice.</p>
      </Section>

      <Section title="6. Limitation of liability">
        <p>To the maximum extent permitted by applicable law, the developer shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, including loss of data, arising from your use of
        or inability to use the App — even if advised of the possibility of such damages.</p>
        <p>The developer's total liability for any claim relating to the App shall not exceed the amount you paid to
        use it (which is zero, as the App is free).</p>
      </Section>

      <Section title="7. Prohibited uses">
        <p>You agree not to:</p>
        <ul>
          <li>Use the App for any unlawful purpose or in violation of these Terms</li>
          <li>Attempt to reverse-engineer, decompile, or extract the source code for commercial redistribution</li>
          <li>Impersonate another person or misrepresent your affiliation with any entity</li>
          <li>Use automated scripts or bots to interact with the App</li>
        </ul>
      </Section>

      <Section title="8. Intellectual property">
        <p>The App's source code is the property of the developer. Your financial data belongs to you. The DKP
        Finance name, logo, and visual design are not licensed for use in other products without written permission.</p>
      </Section>

      <Section title="9. Changes to these Terms">
        <p>These Terms may be updated from time to time. The "Last updated" date at the top reflects the most recent
        revision. Continued use of the App after a change constitutes acceptance of the new Terms.</p>
      </Section>

      <Section title="10. Governing law">
        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction
        of courts in India.</p>
      </Section>

      <Section title="11. Contact">
        <p>Questions about these Terms: <a href="mailto:deepak.prasad.ai@gmail.com" style={{ color: 'var(--accent)' }}>deepak.prasad.ai@gmail.com</a></p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</h2>
      <div style={{ color: 'var(--text2)', fontSize: 14.5 }}>{children}</div>
    </section>
  )
}
