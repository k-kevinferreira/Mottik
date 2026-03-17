import test from "node:test";
import assert from "node:assert/strict";

import { createSendformHandler } from "../api/sendform.js";

function createMockResponse() {
    return {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
}

function createValidEnv(overrides = {}) {
    return {
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "465",
        SMTP_USER: "mailer@example.com",
        SMTP_PASS: "secret",
        MY_EMAIL: "owner@example.com",
        ...overrides,
    };
}

function createValidBody(overrides = {}) {
    return {
        nome: "Cliente Teste",
        email: "cliente@example.com",
        telefone: "(61) 99999-9999",
        servico: "Armarios Planejados",
        mensagem: "Quero um armario sob medida.",
        ...overrides,
    };
}

test("retorna 405 quando o metodo nao e POST", async () => {
    const handler = createSendformHandler();
    const res = createMockResponse();

    await handler({ method: "GET" }, res);

    assert.equal(res.statusCode, 405);
    assert.deepEqual(res.body, { error: "Metodo nao permitido" });
});

test("retorna 400 quando faltam campos obrigatorios", async () => {
    const handler = createSendformHandler({ env: createValidEnv() });
    const res = createMockResponse();

    await handler({ method: "POST", body: createValidBody({ telefone: "" }) }, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: "Preencha todos os campos obrigatorios." });
});

test("retorna 500 quando faltam variaveis SMTP", async () => {
    const handler = createSendformHandler({ env: createValidEnv({ SMTP_PASS: "" }) });
    const res = createMockResponse();

    await handler({ method: "POST", body: createValidBody() }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, "Configuracao de e-mail incompleta no servidor.");
    assert.deepEqual(res.body.details, { stage: "env", missing: ["SMTP_PASS"] });
});

test("retorna 500 quando SMTP_PORT nao e numerica", async () => {
    const handler = createSendformHandler({ env: createValidEnv({ SMTP_PORT: "abc" }) });
    const res = createMockResponse();

    await handler({ method: "POST", body: createValidBody() }, res);

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, "SMTP_PORT invalida no servidor.");
    assert.deepEqual(res.body.details, { stage: "env", smtpPort: "abc" });
});

test("envia o email com secure true na porta 465", async () => {
    let transportConfig;
    let sentMessage;
    const handler = createSendformHandler({
        env: createValidEnv({ SMTP_PORT: "465" }),
        createTransport(config) {
            transportConfig = config;
            return {
                async sendMail(message) {
                    sentMessage = message;
                },
            };
        },
    });
    const res = createMockResponse();
    const body = createValidBody();

    await handler({ method: "POST", body }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { success: true });
    assert.equal(transportConfig.port, 465);
    assert.equal(transportConfig.secure, true);
    assert.equal(sentMessage.to, "owner@example.com");
    assert.equal(sentMessage.replyTo, body.email);
    assert.match(sentMessage.subject, /Cliente Teste/);
    assert.match(sentMessage.html, /Quero um armario sob medida\./);
});

test("envia o email com secure false fora da porta 465", async () => {
    let transportConfig;
    const handler = createSendformHandler({
        env: createValidEnv({ SMTP_PORT: "587" }),
        createTransport(config) {
            transportConfig = config;
            return {
                async sendMail() {
                },
            };
        },
    });
    const res = createMockResponse();

    await handler({ method: "POST", body: createValidBody() }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(transportConfig.port, 587);
    assert.equal(transportConfig.secure, false);
});

test("retorna 500 quando o transporte falha", async () => {
    const handler = createSendformHandler({
        env: createValidEnv(),
        createTransport() {
            return {
                async sendMail() {
                    throw new Error("SMTP rejected");
                },
            };
        },
    });
    const res = createMockResponse();
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
        await handler({ method: "POST", body: createValidBody() }, res);
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, "Erro ao enviar o e-mail.");
    assert.deepEqual(res.body.details, {
        stage: "smtp",
        code: null,
        responseCode: null,
        command: null,
        message: "SMTP rejected",
    });
});
