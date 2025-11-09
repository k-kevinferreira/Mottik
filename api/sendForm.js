import nodemailer from "nodemailer";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { nome, email, telefone, servico, mensagem } = req.body;

    if (!nome || !email || !telefone || !servico) {
        return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    // ...
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // ESSA É A LINHA QUE DEVE SER ADICIONADA:
            tls: {
                rejectUnauthorized: false
            }
        });
   
        await transporter.sendMail({
            from: `"Site Mottik" <${process.env.SMTP_USER}>`,
            to: process.env.MY_EMAIL,
            subject: `Novo pedido de orçamento — ${nome}`,
            html: `
                <h2>Novo Orçamento Recebido</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>E-mail:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${telefone}</p>
                <p><strong>Serviço:</strong> ${servico}</p>
                <p><strong>Descrição do Projeto:</strong><br>${mensagem || "Não informado"}</p>
            `
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        return res.status(500).json({ error: "Erro ao enviar o e-mail." });
    }
}
