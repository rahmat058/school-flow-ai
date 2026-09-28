import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'react-email';

export interface ResetPasswordProps {
  name: string;
  link: string;
}

export function ResetPassword({ name, link }: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Preview>Choose a new School Flow AI password</Preview>
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
            Reset your password
          </Heading>
          <Text style={{ color: '#374151' }}>Hi {name},</Text>
          <Text style={{ color: '#374151' }}>
            Choose a new password for your School Flow AI account by opening
            the link below. It expires in 30 minutes and can be used once.
          </Text>
          <Section style={{ margin: '24px 0' }}>
            <Link href={link} style={{ color: '#6366f1' }}>
              {link}
            </Link>
          </Section>
          <Text style={{ color: '#6b7280', fontSize: '13px' }}>
            If you did not request a password reset, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
