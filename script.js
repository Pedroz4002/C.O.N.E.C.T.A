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
  const floatingCta = document.querySelector("[data-floating-cta]");
  const footer = document.querySelector(".site-footer");
  let toastTimer;

  // Exibe uma mensagem temporária para botões simulados e links sociais.
  function showToast(message) {
    if (!toastBox) return;

    clearTimeout(toastTimer);
    toastBox.textContent = message;
    toastBox.classList.add("is-visible");

    toastTimer = setTimeout(() => {
      toastBox.classList.remove("is-visible");
    }, 3200);
  }

  // Mantém o cabeçalho com contraste maior depois da primeira rolagem.
  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  // Mantém a chamada fixa no rodapé da tela sem cobrir o footer.
  function updateFloatingCtaPosition() {
    if (!floatingCta || !footer) return;

    const gap = window.innerWidth <= 620 ? 12 : 18;
    const footerTop = footer.getBoundingClientRect().top;
    const ctaHeight = floatingCta.getBoundingClientRect().height;
    const bottom = Math.max(gap, window.innerHeight - footerTop + ctaHeight + gap);

    floatingCta.classList.toggle("is-visible", window.scrollY > 260);
    document.documentElement.style.setProperty("--floating-bottom", `${Math.round(bottom)}px`);
  }

  updateFloatingCtaPosition();
  window.addEventListener("scroll", updateFloatingCtaPosition, { passive: true });
  window.addEventListener("resize", updateFloatingCtaPosition);

  // Alterna o menu mobile e mantém atributos de acessibilidade atualizados.
  if (menuToggle && navPanel) {
    menuToggle.addEventListener("click", () => {
      const isOpen = body.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    });
  }

  // Rolagem suave manual para fechar o menu mobile após clicar em links internos.
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

  // Marca no menu a seção que está em destaque na tela.
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
    const section = document.querySelector(link.getAttribute("href"));
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

  // Botões com ação simulada para reforçar que a interação foi recebida.
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const messages = {
        propostas: "Rolando até as propostas da Conecta ADM.",
        apoie: "Rolando até a área de apoio.",
        contato: "Vamos abrir o contato para receber sua mensagem.",
      };

      showToast(messages[action] || "Ação simulada com sucesso.");
    });
  });

  document.querySelectorAll("[data-toast]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      showToast(element.dataset.toast);
    });
  });

  // Validação simples do formulário e confirmação visual de envio.
  if (contactForm && formFeedback) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const name = String(formData.get("nome") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const message = String(formData.get("mensagem") || "").trim();
      const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !email || !message) {
        formFeedback.textContent = "Preencha nome, e-mail e mensagem para continuar.";
        showToast("Ainda faltam alguns campos no formulário.");
        return;
      }

      if (!emailIsValid) {
        formFeedback.textContent = "Informe um e-mail válido para simular o envio.";
        showToast("Confira o e-mail informado.");
        return;
      }

      formFeedback.textContent = `Obrigado, ${name}. Sua mensagem foi registrada na simulação.`;
      showToast("Mensagem enviada na simulação.");
      contactForm.reset();
    });
  }
});
