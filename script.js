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
  const protocolStorageKey = "conecta-protocolos";
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

  function getStoredProtocols() {
    try {
      return JSON.parse(localStorage.getItem(protocolStorageKey)) || [];
    } catch {
      return [];
    }
  }

  function saveProtocol(protocol) {
    const protocols = getStoredProtocols();
    protocols.unshift(protocol);
    localStorage.setItem(protocolStorageKey, JSON.stringify(protocols.slice(0, 80)));
  }

  function generateProtocolNumber() {
    const year = new Date().getFullYear();
    const suffix = String(Date.now()).slice(-6);
    return `CA-${year}-${suffix}`;
  }

  function normalizeMessageText(text) {
    const compact = text.replace(/\s+/g, " ").trim();
    if (!compact) return "";

    const withFirstLetter = compact.charAt(0).toUpperCase() + compact.slice(1);
    return /[.!?]$/.test(withFirstLetter) ? withFirstLetter : `${withFirstLetter}.`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return entities[char];
    });
  }

  function renderProtocol(protocol) {
    if (!protocolResult) return;

    protocolResult.innerHTML = "";

    const article = document.createElement("article");
    article.className = "protocol-card";

    const title = document.createElement("h4");
    title.textContent = `Processo ${protocol.numero}`;

    const meta = document.createElement("p");
    meta.textContent = `${protocol.nome} | Matrícula: ${protocol.matricula} | ${protocol.data}`;

    const message = document.createElement("p");
    message.textContent = protocol.mensagemCorrigida;

    const printButton = document.createElement("button");
    printButton.className = "btn btn-ghost";
    printButton.type = "button";
    printButton.textContent = "Gerar PDF";
    printButton.addEventListener("click", () => {
      const printWindow = window.open("", "_blank", "noopener");
      if (!printWindow) {
        showToast("Permita pop-ups para gerar o PDF.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <title>Protocolo ${protocol.numero}</title>
            <style>
              body { font-family: Arial, sans-serif; color: #071630; margin: 40px; line-height: 1.5; }
              h1 { color: #061843; margin-bottom: 8px; }
              .box { border: 1px solid #dbe6f6; border-radius: 8px; padding: 24px; }
              strong { color: #0858e8; }
            </style>
          </head>
          <body>
            <h1>Protocolo Geral - Conecta ADM</h1>
            <div class="box">
              <p><strong>Processo:</strong> ${escapeHtml(protocol.numero)}</p>
              <p><strong>Nome:</strong> ${escapeHtml(protocol.nome)}</p>
              <p><strong>Matrícula:</strong> ${escapeHtml(protocol.matricula)}</p>
              <p><strong>E-mail:</strong> ${escapeHtml(protocol.email)}</p>
              <p><strong>Data:</strong> ${escapeHtml(protocol.data)}</p>
              <h2>Mensagem corrigida</h2>
              <p>${escapeHtml(protocol.mensagemCorrigida)}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    });

    article.append(title, meta, message, printButton);
    protocolResult.appendChild(article);
  }

  function searchProtocol() {
    if (!protocolSearchInput || !protocolResult) return;

    const query = protocolSearchInput.value.trim().toLowerCase();
    if (!query) {
      protocolResult.textContent = "Digite a matrícula ou o número do processo.";
      return;
    }

    const protocol = getStoredProtocols().find((item) => {
      return item.numero.toLowerCase() === query || item.matricula.toLowerCase() === query;
    });

    if (!protocol) {
      protocolResult.textContent = "Nenhum protocolo encontrado neste navegador.";
      return;
    }

    renderProtocol(protocol);
  }

  // Valida o formulario, envia duvidas ao WhatsApp e gera protocolo local.
  if (contactForm && formFeedback) {
    contactForm.addEventListener("submit", (event) => {
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

      const protocol = {
        numero: generateProtocolNumber(),
        tipo: "Protocolo geral",
        nome: name,
        matricula: registration,
        email,
        mensagemOriginal: message,
        mensagemCorrigida: normalizeMessageText(message),
        data: new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date()),
      };

      saveProtocol(protocol);
      renderProtocol(protocol);
      formFeedback.textContent = `Protocolo ${protocol.numero} gerado. Você pode pesquisar depois pela matrícula ou pelo número do processo.`;
      showToast("Protocolo gerado no site.");
      contactForm.reset();
    });
  }

  protocolSearchButton?.addEventListener("click", searchProtocol);
  protocolSearchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    searchProtocol();
  });
});
