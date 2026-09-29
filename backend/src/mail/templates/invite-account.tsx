import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'react-email';

export interface InviteAccountProps {
  name: string;
  email: string;
  password: string;
  code: string;
}

export function InviteAccount({
  name,
  email,
  password,
  code,
}: InviteAccountProps) {
  return (
    <Html>
      <Head />
      <Preview>Your School Flow AI account and invite code</Preview>
      <Body
        style={{
          backgroundColor: '#f3f4f6',
          fontFamily: 'Inter, Arial, sans-serif',
          padding: '24px',
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
          }}
        >
          <Heading style={{ color: '#6366f1', fontSize: '22px' }}>
            You have been invited
          </Heading>
          <Text style={{ color: '#374151' }}>Hi {name},</Text>
          <Text style={{ color: '#374151' }}>
            A School Flow AI account has been created for you. Sign in with the
            address and temporary password below, then confirm your invite with
            the code.
          </Text>
          <Text style={{ color: '#374151' }}>
            Email: <strong>{email}</strong>
            <br />
            Temporary password: <strong>{password}</strong>
          </Text>
          <Section style={{ margin: '24px 0' }}>
            <Text style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
              Invite code
            </Text>
            <Text
              style={{
                color: '#6366f1',
                fontSize: '28px',
                fontWeight: 'bold',
                letterSpacing: '6px',
                margin: 0,
              }}
            >
              {code}
            </Text>
          </Section>
          <Text style={{ color: '#6b7280', fontSize: '13px' }}>
            The code expires in 24 hours. If you did not expect this invitation,
            you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
