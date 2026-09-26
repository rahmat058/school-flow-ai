import 'dotenv/config';
import { render } from 'react-email';
import { Resend } from 'resend';
import { VerifyEmail } from '../src/mail/templates/verify-email.js';

const LINK = 'https://app.schoolflow.ai/verify-email?token=test-token-abc123';

/**
 * The verification mail: the React Email template is always rendered and
 * asserted, while the real Resend submission runs only when a recipient is
 * provided. `onboarding@resend.dev` is Resend's test sender and it only delivers
 * to the address that owns the API key, so set `RESEND_TEST_TO` to that address:
 *
 *   RESEND_TEST_TO=you@example.com npm run test:e2e
 */
describe('Verification email (e2e)', () => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TEST_TO;
  const from = process.env.RESEND_FROM ?? 'SchoolFlowAI <onboarding@resend.dev>';

  it('renders the template to HTML carrying the link', async () => {
    const html = await render(VerifyEmail({ name: 'Flow Admin', link: LINK }));

    expect(html).toContain('verify-email?token=test-token-abc123');
    expect(html).toContain('Verify your email');
    expect(html).toContain('Flow Admin');
  });

  it.runIf(Boolean(apiKey) && Boolean(to))(
    'submits a real email through Resend',
    async () => {
      const resend = new Resend(apiKey);
      const html = await render(VerifyEmail({ name: 'Flow Admin', link: LINK }));

      const { data, error } = await resend.emails.send({
        from,
        to: to as string,
        subject: 'School Flow AI auth flow test',
        html,
      });

      expect(error).toBeNull();
      expect(data?.id).toBeTruthy();
    },
  );
});
