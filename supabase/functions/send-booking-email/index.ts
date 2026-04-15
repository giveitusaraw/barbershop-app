import { createClient } from 'npm:@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BookingEmailRequest {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  barberName: string;
  appointmentDate: string;
  appointmentTime: string;
}

interface SMTPSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: smtpSettings, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .single();

    if (smtpError || !smtpSettings) {
      throw new Error('Configurações SMTP não encontradas');
    }

    const settings = smtpSettings as SMTPSettings;

    if (!settings.is_active) {
      return new Response(
        JSON.stringify({ success: false, message: 'SMTP não está ativo' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const bookingData: BookingEmailRequest = await req.json();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Reserva</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Reserva Confirmada!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.5;">
                Olá <strong>${bookingData.customerName}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.5;">
                A sua reserva foi confirmada com sucesso! Aqui estão os detalhes:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #f9f9f9;">
                    <strong style="color: #333333;">Serviço:</strong>
                  </td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666666;">${bookingData.serviceName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #f9f9f9;">
                    <strong style="color: #333333;">Funcionário:</strong>
                  </td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666666;">${bookingData.barberName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0; background-color: #f9f9f9;">
                    <strong style="color: #333333;">Data:</strong>
                  </td>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e0e0e0;">
                    <span style="color: #666666;">${bookingData.appointmentDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px; background-color: #f9f9f9;">
                    <strong style="color: #333333;">Horário:</strong>
                  </td>
                  <td style="padding: 15px 20px;">
                    <span style="color: #666666;">${bookingData.appointmentTime}</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">
                Por favor, chegue com 5-10 minutos de antecedência.
              </p>
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                Se precisar de cancelar ou reagendar, entre em contacto connosco.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const emailText = `
Olá ${bookingData.customerName},

A sua reserva foi confirmada com sucesso!

Detalhes da Reserva:
- Serviço: ${bookingData.serviceName}
- Funcionário: ${bookingData.barberName}
- Data: ${bookingData.appointmentDate}
- Horário: ${bookingData.appointmentTime}

Por favor, chegue com 5-10 minutos de antecedência.
Se precisar de cancelar ou reagendar, entre em contacto connosco.

Obrigado!
`;

    const emailPayload = {
      personalizations: [{
        to: [{ email: bookingData.customerEmail, name: bookingData.customerName }],
        subject: 'Confirmação de Reserva - ' + bookingData.serviceName,
      }],
      from: { email: settings.from_email, name: settings.from_name },
      content: [
        { type: 'text/plain', value: emailText },
        { type: 'text/html', value: emailHtml },
      ],
    };

    const smtpUrl = `smtp://${settings.smtp_username}:${settings.smtp_password}@${settings.smtp_host}:${settings.smtp_port}`;
    
    const nodemailer = await import('npm:nodemailer@6.9.8');
    
    const transporter = nodemailer.default.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password,
      },
    });

    const info = await transporter.sendMail({
      from: `"${settings.from_name}" <${settings.from_email}>`,
      to: bookingData.customerEmail,
      subject: 'Confirmação de Reserva - ' + bookingData.serviceName,
      text: emailText,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});