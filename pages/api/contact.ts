import type { NextApiRequest, NextApiResponse } from 'next';

// Contact form API endpoint using Resend
// Resend offers 100 free emails/day - perfect for contact forms
// Sign up at https://resend.com and add RESEND_API_KEY to Vercel env vars

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'your-email@gmail.com'; // Your Gmail

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const { name, email, subject, message }: ContactFormData = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Subject mapping
    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      feedback: 'Feedback & Suggestions',
      partnership: 'Partnership Opportunity',
      press: 'Press & Media',
      technical: 'Technical Issue',
      other: 'Other'
    };

    const subjectLine = `[Blush & Breathe] ${subjectLabels[subject] || 'Contact Form'}: ${name}`;

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Resend's default sender domain
        to: [CONTACT_EMAIL],
        reply_to: email, // So you can reply directly to the sender
        subject: subjectLine,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2dd4bf 0%, #f472b6 100%); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 120px;"><strong>From:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">
                    <a href="mailto:${email}" style="color: #2dd4bf;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;"><strong>Category:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${subjectLabels[subject] || subject}</td>
                </tr>
              </table>
              
              <div style="margin-top: 20px;">
                <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; color: #374151; line-height: 1.6;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>This email was sent from the contact form at Blush & Breathe</p>
                <p>Reply directly to this email to respond to ${name}</p>
              </div>
            </div>
          </div>
        `,
        text: `
New Contact Form Submission

From: ${name}
Email: ${email}
Category: ${subjectLabels[subject] || subject}

Message:
${message}

---
This email was sent from the contact form at Blush & Breathe.
Reply directly to this email to respond to ${name}.
        `.trim()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', JSON.stringify(errorData));
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: errorData.message || errorData.error || JSON.stringify(errorData)
      });
    }

    const data = await response.json();
    console.log('Email sent successfully:', data.id);

    return res.status(200).json({ 
      success: true, 
      message: 'Your message has been sent successfully!' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
