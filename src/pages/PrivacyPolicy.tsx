import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'inherit', lineHeight: 1.7, color: 'var(--text)' }}>
      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 32 }}>
        ← Back
      </button>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 40 }}>Last updated: May 8, 2026</p>

      <Section title="Overview">
        <p>DKP Finance ("the App") is a personal finance tracker built for individual use. This policy explains what
        information the App accesses, where it is stored, and how it is used. The short version: <strong>your financial
        data never leaves your own Google account.</strong> The App has no backend server and collects no analytics.</p>
      </Section>

      <Section title="1. Who operates the App">
        <p>DKP Finance is operated by Deepak Prasad ("I", "me", "the developer") as a personal project. Contact:
        &nbsp;<a href="mailto:deepak.prasad@o9solutions.com" style={{ color: 'var(--accent)' }}>deepak.prasad@o9solutions.com</a></p>
      </Section>

      <Section title="2. Information the App accesses">
        <p>When you sign in with Google, the App requests the following OAuth scopes:</p>
        <ul>
          <li><strong>openid, email, profile</strong> — your Google account email address, display name, and profile picture. Used only to identify your account locally and label your data file.</li>
          <li><strong>https://www.googleapis.com/auth/spreadsheets</strong> — read/write access to Google Sheets. Used to save and load your financial data (transactions, budgets, goals, net worth) in a spreadsheet created in your own Google Drive.</li>
          <li><strong>https://www.googleapis.com/auth/drive.file</strong> — access limited to files the App itself creates. The App cannot see any other files in your Drive.</li>
        </ul>
        <p>The App does not access Google Drive files beyond the single spreadsheet it creates. It does not access Gmail, Contacts, Calendar, or any other Google service.</p>
      </Section>

      <Section title="3. Where your data is stored">
        <p>All financial data (transactions, budgets, goals, net worth entries, recurring rules, categories) is written
        directly to a Google Sheets spreadsheet in <strong>your own Google Drive account</strong>. The developer has no
        access to this spreadsheet.</p>
        <p>The following items are stored in your browser's <strong>localStorage</strong> on your device only:</p>
        <ul>
          <li>Google OAuth access token and expiry timestamp</li>
          <li>Your Google account email, display name, and profile picture URL</li>
          <li>The ID of your finance spreadsheet</li>
          <li>UI preferences (dark mode, colour theme)</li>
        </ul>
        <p>This data never leaves your device. It is cleared when you sign out.</p>
        <p>No data is transmitted to any server controlled by the developer.</p>
      </Section>

      <Section title="4. Third-party services">
        <p>The App uses the following third-party services:</p>
        <ul>
          <li><strong>Google Identity Services</strong> — handles sign-in. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google's Privacy Policy</a>.</li>
          <li><strong>Google Sheets API</strong> — stores your financial data. Subject to Google's Privacy Policy.</li>
          <li><strong>Google Fonts</strong> — loads the DM Sans typeface. Google may log the font request. No personal data is sent with this request.</li>
        </ul>
        <p>The App does not use any advertising networks, analytics platforms (e.g. Google Analytics), crash reporting services, or social media tracking pixels.</p>
      </Section>

      <Section title="5. Data retention and deletion">
        <p>Your financial data lives in your Google Drive. You can delete it at any time by deleting the spreadsheet
        named "DKP Finance – [your email]" from Google Drive. Signing out of the App removes all locally cached tokens
        and preferences from your device immediately.</p>
        <p>To revoke the App's access to your Google account entirely, visit
        &nbsp;<a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>myaccount.google.com/permissions</a> and remove DKP Finance.</p>
      </Section>

      <Section title="6. Children's privacy">
        <p>The App is not directed at children under 13 (or the applicable minimum age in your country). If you believe
        a child has used the App, contact me and I will assist with data removal.</p>
      </Section>

      <Section title="7. Changes to this policy">
        <p>If this policy changes materially, the "Last updated" date at the top will be revised. Continued use of the
        App after a policy change constitutes acceptance of the revised policy.</p>
      </Section>

      <Section title="8. Contact">
        <p>Questions or concerns about privacy: <a href="mailto:deepak.prasad@o9solutions.com" style={{ color: 'var(--accent)' }}>deepak.prasad@o9solutions.com</a></p>
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
