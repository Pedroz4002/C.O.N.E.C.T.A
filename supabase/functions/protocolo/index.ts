import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ProtocolPayload = {
  action?: "create" | "search";
  nome?: string;
  email?: string;
  matricula?: string;
  mensagem?: string;
  query?: string;
};

type ProtocolRecord = {
  id: string;
  numero: string;
  nome: string;
  email: string;
  matricula: string;
  mensagem: string;
  status: string;
  pdf_path: string | null;
  created_at: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
const caEmail = Deno.env.get("CA_EMAIL") ?? "";
const fromEmail = Deno.env.get("FROM_EMAIL") ?? "Conecta ADM <protocolos@resend.dev>";
const storageBucket = Deno.env.get("PROTOCOL_STORAGE_BUCKET") ?? "protocolos";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function assertEnvironment() {
  const missing = [
    ["SUPABASE_URL", supabaseUrl],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
    ["RESEND_API_KEY", resendApiKey],
    ["CA_EMAIL", caEmail],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(`Variaveis ausentes: ${missing.map(([name]) => name).join(", ")}`);
  }
}

function generateProtocolNumber() {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `CA-${year}-${randomPart}`;
}

function wrapText(text: string, maxLength: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}

async function generatePdf(protocol: ProtocolRecord) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.02, 0.07, 0.18);
  const blue = rgb(0.04, 0.35, 0.91);
  let y = 780;

  page.drawText("Protocolo Geral - Conecta ADM", {
    x: 48,
    y,
    size: 22,
    font: boldFont,
    color: navy,
  });

  y -= 34;
  page.drawText(`Processo: ${protocol.numero}`, { x: 48, y, size: 13, font: boldFont, color: blue });
  y -= 24;
  page.drawText(`Nome: ${protocol.nome}`, { x: 48, y, size: 12, font: regularFont, color: navy });
  y -= 20;
  page.drawText(`Matricula: ${protocol.matricula}`, { x: 48, y, size: 12, font: regularFont, color: navy });
  y -= 20;
  page.drawText(`E-mail: ${protocol.email}`, { x: 48, y, size: 12, font: regularFont, color: navy });
  y -= 20;
  page.drawText(`Data: ${new Date(protocol.created_at).toLocaleString("pt-BR")}`, {
    x: 48,
    y,
    size: 12,
    font: regularFont,
    color: navy,
  });

  y -= 42;
  page.drawText("Mensagem enviada", { x: 48, y, size: 15, font: boldFont, color: navy });
  y -= 26;

  const lines = wrapText(protocol.mensagem, 84);
  lines.forEach((line) => {
    if (y < 70) return;
    page.drawText(line, { x: 48, y, size: 11, font: regularFont, color: navy });
    y -= 17;
  });

  page.drawText("Documento gerado automaticamente pelo site da Conecta ADM.", {
    x: 48,
    y: 38,
    size: 9,
    font: regularFont,
    color: rgb(0.38, 0.45, 0.54),
  });

  return await pdf.save();
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function sendProtocolEmails(protocol: ProtocolRecord, pdfBytes: Uint8Array) {
  const subject = `Protocolo ${protocol.numero} - Conecta ADM`;
  const html = `
    <p>O protocolo <strong>${escapeHtml(protocol.numero)}</strong> foi gerado automaticamente.</p>
    <p><strong>Nome:</strong> ${escapeHtml(protocol.nome)}</p>
    <p><strong>Matricula:</strong> ${escapeHtml(protocol.matricula)}</p>
    <p><strong>Status:</strong> ${escapeHtml(protocol.status)}</p>
    <p>O PDF do protocolo esta anexado a este e-mail.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [caEmail, protocol.email],
      subject,
      html,
      attachments: [
        {
          filename: `${protocol.numero}.pdf`,
          content: toBase64(pdfBytes),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha no envio de e-mail: ${errorText}`);
  }
}

async function createProtocol(payload: ProtocolPayload) {
  assertEnvironment();

  const nome = cleanText(payload.nome);
  const email = cleanText(payload.email).toLowerCase();
  const matricula = cleanText(payload.matricula);
  const mensagem = cleanText(payload.mensagem);

  if (!nome || !email || !matricula || !mensagem) {
    return jsonResponse({ error: "Preencha nome, e-mail, matricula e mensagem." }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Informe um e-mail valido." }, 400);
  }

  const numero = generateProtocolNumber();
  const { data: inserted, error: insertError } = await supabase
    .from("protocolos")
    .insert({
      numero,
      nome,
      email,
      matricula,
      mensagem,
      status: "Recebido",
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    return jsonResponse({ error: insertError?.message ?? "Nao foi possivel criar o protocolo." }, 500);
  }

  const protocol = inserted as ProtocolRecord;
  const pdfBytes = await generatePdf(protocol);
  const pdfPath = `${protocol.numero}.pdf`;
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

  const { error: uploadError } = await supabase.storage.from(storageBucket).upload(pdfPath, pdfBlob, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (uploadError) {
    await supabase.from("protocolos").update({ status: "Erro ao salvar PDF" }).eq("id", protocol.id);
    return jsonResponse({ error: uploadError.message }, 500);
  }

  const updatedProtocol = {
    ...protocol,
    pdf_path: pdfPath,
    status: "Recebido e enviado",
  };

  try {
    await sendProtocolEmails(updatedProtocol, pdfBytes);
  } catch (error) {
    await supabase.from("protocolos").update({
      pdf_path: pdfPath,
      status: "Erro no envio de e-mail",
    }).eq("id", protocol.id);

    return jsonResponse({ error: error instanceof Error ? error.message : "Falha no envio de e-mail." }, 502);
  }

  await supabase.from("protocolos").update({
    pdf_path: pdfPath,
    status: updatedProtocol.status,
  }).eq("id", protocol.id);

  return jsonResponse({
    protocolo: {
      numero: updatedProtocol.numero,
      nome: updatedProtocol.nome,
      matricula: updatedProtocol.matricula,
      email: updatedProtocol.email,
      mensagem: updatedProtocol.mensagem,
      status: updatedProtocol.status,
      created_at: updatedProtocol.created_at,
    },
  });
}

async function searchProtocols(payload: ProtocolPayload) {
  assertEnvironment();

  const query = cleanText(payload.query);
  if (!query) return jsonResponse({ error: "Informe matricula ou numero do processo." }, 400);

  const byNumber = await supabase
    .from("protocolos")
    .select("numero,nome,email,matricula,mensagem,status,pdf_path,created_at")
    .eq("numero", query)
    .limit(1);

  const records = byNumber.data?.length
    ? byNumber.data
    : (await supabase
      .from("protocolos")
      .select("numero,nome,email,matricula,mensagem,status,pdf_path,created_at")
      .eq("matricula", query)
      .order("created_at", { ascending: false })
      .limit(5)).data ?? [];

  const protocolos = await Promise.all(records.map(async (record) => {
    let pdf_url = null;
    if (record.pdf_path) {
      const { data } = await supabase.storage.from(storageBucket).createSignedUrl(record.pdf_path, 60 * 60);
      pdf_url = data?.signedUrl ?? null;
    }

    return { ...record, pdf_url };
  }));

  return jsonResponse({ protocolos });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido." }, 405);
  }

  try {
    const payload = await request.json() as ProtocolPayload;
    if (payload.action === "search") return await searchProtocols(payload);
    return await createProtocol(payload);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Erro inesperado.",
    }, 500);
  }
});
