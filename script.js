// Aguarda o DOM carregar antes de conectar os comportamentos.
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const navPanel = document.querySelector("[data-nav-panel]");
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const toastBox = document.querySelector("[data-toast-box]");
  const contactForm = document.querySelector("[data-contact-form]");
  const formFeedback = document.querySelector("[data-form-feedback]");
  const protocolSearchInput = document.querySelector("[data-protocol-search]");
  const protocolSearchButton = document.querySelector("[data-protocol-search-button]");
  const protocolResult = document.querySelector("[data-protocol-result]");
  const floatingCta = document.querySelector("[data-floating-cta]");
  const footer = document.querySelector(".site-footer");
  const siteConfig = window.CONECTA_CONFIG || {};
  const protocolEndpoint = String(siteConfig.protocolEndpoint || "");
  const supabaseAnonKey = String(siteConfig.supabaseAnonKey || "");
  const whatsappNumber = "5583998465279";
  let toastTimer;

  // Exibe uma mensagem temporaria para botoes simulados e links sociais.
  function showToast(message) {
    if (!toastBox) return;

    clearTimeout(toastTimer);
    toastBox.textContent = message;
    toastBox.classList.add("is-visible");

    toastTimer = setTimeout(() => {
      toastBox.classList.remove("is-visible");
    }, 3200);
  }

  // Mantem o cabecalho com contraste maior depois da primeira rolagem.
  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  // Mantem a chamada fixa no rodape da tela sem cobrir o footer.
  function updateFloatingCtaPosition() {
    if (!floatingCta || !footer) return;

    const gap = window.innerWidth <= 620 ? 12 : 18;
    const floatingInner = floatingCta.querySelector(".floating-cta-inner");
    const ctaHeight = floatingInner?.getBoundingClientRect().height || 0;
    const dockingTop = floatingCta.getBoundingClientRect().top;
    const shouldDock = dockingTop <= window.innerHeight - ctaHeight - gap;
    const shouldFloat = window.scrollY > 260 && !shouldDock;

    floatingCta.classList.toggle("is-docked", shouldDock);
    floatingCta.classList.toggle("is-visible", shouldFloat);
  }

  updateFloatingCtaPosition();
  window.addEventListener("scroll", updateFloatingCtaPosition, { passive: true });
  window.addEventListener("resize", updateFloatingCtaPosition);

  // Alterna o menu mobile e mantem atributos de acessibilidade atualizados.
  if (menuToggle && navPanel) {
    menuToggle.addEventListener("click", () => {
      const isOpen = body.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    });
  }

  // Rolagem suave manual para fechar o menu mobile apos clicar em links internos.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = targetId && document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      body.classList.remove("menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Abrir menu");
    });
  });

  // Marca no menu a secao que esta em destaque na tela.
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    {
      rootMargin: "-35% 0px -50% 0px",
      threshold: 0,
    }
  );

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    const section = document.querySelector(href);
    if (section) sectionObserver.observe(section);
  });

  // Anima os blocos conforme eles entram na viewport.
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
    }
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
  });

  // Botoes com acao simulada para reforcar que a interacao foi recebida.
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const messages = {
        propostas: "Abrindo as propostas da Conecta ADM.",
        apoie: "Abrindo a area de apoio.",
        contato: "Vamos abrir o contato para receber sua mensagem.",
      };

      showToast(messages[action] || "Acao simulada com sucesso.");
    });
  });

  document.querySelectorAll("[data-toast]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      showToast(element.dataset.toast);
    });
  });

  function isProtocolApiConfigured() {
    return protocolEndpoint.startsWith("https://") && !protocolEndpoint.includes("SEU-PROJETO");
  }

  async function callProtocolApi(payload) {
    if (!isProtocolApiConfigured()) {
      throw new Error("Configure a URL da Edge Function em site-config.js.");
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (supabaseAnonKey && !supabaseAnonKey.includes("COLE_AQUI")) {
      headers.apikey = supabaseAnonKey;
      headers.Authorization = `Bearer ${supabaseAnonKey}`;
    }

    const response = await fetch(protocolEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Nao foi possivel concluir a solicitacao.");
    }

    return data;
  }

  function clearProtocolResult() {
    if (!protocolResult) return;
    protocolResult.innerHTML = "";
  }

  function renderProtocol(protocol) {
    if (!protocolResult) return;

    const article = document.createElement("article");
    article.className = "protocol-card";

    const title = document.createElement("h4");
    title.textContent = `Processo ${protocol.numero}`;

    const meta = document.createElement("p");
    meta.textContent = `${protocol.nome} | Matrícula: ${protocol.matricula} | ${formatDate(protocol.created_at)}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${protocol.status || "Recebido"}`;

    const message = document.createElement("p");
    message.textContent = protocol.mensagem || "";

    article.append(title, meta, status, message);

    if (protocol.pdf_url) {
      const pdfLink = document.createElement("a");
      pdfLink.className = "btn btn-ghost";
      pdfLink.href = protocol.pdf_url;
      pdfLink.target = "_blank";
      pdfLink.rel = "noopener";
      pdfLink.textContent = "Abrir PDF";
      article.appendChild(pdfLink);
    }

    protocolResult.appendChild(article);
  }

  function renderProtocolList(protocols) {
    clearProtocolResult();

    if (!protocols?.length) {
      protocolResult.textContent = "Nenhum protocolo encontrado.";
      return;
    }

    protocols.forEach(renderProtocol);
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  async function searchProtocol() {
    if (!protocolSearchInput || !protocolResult) return;

    const query = protocolSearchInput.value.trim();
    if (!query) {
      protocolResult.textContent = "Digite a matrícula ou o número do processo.";
      return;
    }

    protocolSearchButton?.setAttribute("disabled", "true");
    protocolResult.textContent = "Pesquisando...";

    try {
      const data = await callProtocolApi({ action: "search", query });
      renderProtocolList(data.protocolos || []);
    } catch (error) {
      protocolResult.textContent = error instanceof Error ? error.message : "Erro ao pesquisar protocolo.";
    } finally {
      protocolSearchButton?.removeAttribute("disabled");
    }
  }

  // Valida o formulario, envia duvidas ao WhatsApp e gera protocolo no Supabase.
  if (contactForm && formFeedback) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const type = String(formData.get("tipo") || "duvida");
      const name = String(formData.get("nome") || "").trim();
      const registration = String(formData.get("matricula") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const message = String(formData.get("mensagem") || "").trim();
      const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !email || !message) {
        formFeedback.textContent = "Preencha nome, e-mail e mensagem para continuar.";
        showToast("Ainda faltam alguns campos no formulário.");
        return;
      }

      if (!emailIsValid) {
        formFeedback.textContent = "Informe um e-mail válido para continuar.";
        showToast("Confira o e-mail informado.");
        return;
      }

      if (type === "duvida") {
        const whatsappText = [
          "Olá, Conecta ADM!",
          "",
          "Tipo: Dúvida",
          `Nome: ${name}`,
          registration ? `Matrícula: ${registration}` : "",
          `E-mail: ${email}`,
          "",
          `Mensagem: ${message}`,
        ].filter(Boolean).join("\n");

        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener");
        formFeedback.textContent = "Abrimos o WhatsApp com a sua mensagem pronta para envio.";
        showToast("Mensagem pronta no WhatsApp.");
        contactForm.reset();
        return;
      }

      if (!registration) {
        formFeedback.textContent = "Informe a matrícula para gerar um protocolo.";
        showToast("A matrícula é necessária para protocolo.");
        return;
      }

      const submitButton = contactForm.querySelector('button[type="submit"]');
      submitButton?.setAttribute("disabled", "true");
      formFeedback.textContent = "Gerando protocolo, PDF e envio automático por e-mail...";

      try {
        const data = await callProtocolApi({
          action: "create",
          nome: name,
          email,
          matricula: registration,
          mensagem: message,
        });

        clearProtocolResult();
        renderProtocol(data.protocolo);
        formFeedback.textContent = `Protocolo ${data.protocolo.numero} gerado e enviado automaticamente por e-mail.`;
        showToast("Protocolo enviado com sucesso.");
        contactForm.reset();
      } catch (error) {
        formFeedback.textContent = error instanceof Error ? error.message : "Erro ao gerar protocolo.";
        showToast("Nao foi possivel gerar o protocolo.");
      } finally {
        submitButton?.removeAttribute("disabled");
      }
    });
  }

  protocolSearchButton?.addEventListener("click", searchProtocol);
  protocolSearchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    searchProtocol();
  });
});
