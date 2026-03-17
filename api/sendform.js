import nodemailer from "nodemailer";

function buildDiagnostic(error, extra = {}) {
    return {
        ...extra,
        code: error?.code || null,
        responseCode: error?.responseCode || null,
        command: error?.command || null,
        message: error?.message || null,
    };
}

export function createSendformHandler({
    createTransport = (config) => nodemailer.createTransport(config),
    env = process.env,
} = {}) {
    return async function handler(req, res) {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Metodo nao permitido" });
        }

        const { nome, email, telefone, servico, mensagem } = req.body || {};
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MY_EMAIL } = env;

        if (!nome || !email || !telefone || !servico) {
            return res.status(400).json({ error: "Preencha todos os campos obrigatorios." });
        }

        const missingEnv = [
            ["SMTP_HOST", SMTP_HOST],
            ["SMTP_PORT", SMTP_PORT],
            ["SMTP_USER", SMTP_USER],
            ["SMTP_PASS", SMTP_PASS],
            ["MY_EMAIL", MY_EMAIL],
        ].filter(([, value]) => !value).map(([key]) => key);

        if (missingEnv.length > 0) {
            return res.status(500).json({
                error: "Configuracao de e-mail incompleta no servidor.",
                details: {
                    stage: "env",
                    missing: missingEnv,
                },
            });
        }

        const smtpPort = Number(SMTP_PORT);

        if (!Number.isInteger(smtpPort)) {
            return res.status(500).json({
                error: "SMTP_PORT invalida no servidor.",
                details: {
                    stage: "env",
                    smtpPort: SMTP_PORT,
                },
            });
        }

        try {
            const transporter = createTransport({
                host: SMTP_HOST,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });

            await transporter.sendMail({
                from: `"Site Mottik" <${SMTP_USER}>`,
                to: MY_EMAIL,
                replyTo: email,
                subject: `Novo pedido de orcamento - ${nome}`,
                html: `
                <h2>Novo Orcamento Recebido</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>E-mail:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${telefone}</p>
                <p><strong>Servico:</strong> ${servico}</p>
                <p><strong>Descricao do Projeto:</strong><br>${mensagem || "Nao informado"}</p>
            `,
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Erro ao enviar e-mail:", error);
            return res.status(500).json({
                error: "Erro ao enviar o e-mail.",
                details: buildDiagnostic(error, { stage: "smtp" }),
            });
        }
    };
}

const handler = createSendformHandler();

export default handler;
