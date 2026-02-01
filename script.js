(function() {
  'use strict';

  const CONFIG = {
    breakpoints: {
      mobile: 1023,
      tablet: 767
    },
    selectors: {
      burgerToggle: '.c-nav__toggle',
      navbarCollapse: '.navbar-collapse',
      navLinks: '.c-nav__item',
      forms: '.c-form',
      scrollToTop: '.c-scroll-to-top',
      header: '.l-header',
      sections: 'section[id]',
      modal: '[data-modal]',
      modalTrigger: '[data-modal-trigger]',
      backdrop: '.c-modal-backdrop'
    },
    classes: {
      open: 'is-open',
      active: 'active',
      noScroll: 'u-no-scroll',
      validated: 'was-validated',
      error: 'has-error',
      disabled: 'is-disabled'
    },
    timing: {
      debounce: 150,
      throttle: 100,
      notification: 5000
    }
  };

  const Utils = {
    debounce(fn, delay) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    throttle(fn, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          fn.apply(this, args);
        }
      };
    },

    trapFocus(element) {
      const focusable = element.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      element.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
    },

    scrollTo(element, offset = 0) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    },

    getHeaderHeight() {
      const header = document.querySelector(CONFIG.selectors.header);
      return header ? header.offsetHeight : 80;
    },

    isHomePage() {
      const path = window.location.pathname;
      return path === '/' || path === '/index.html' || path.endsWith('/');
    }
  };

  const BurgerMenu = {
    init() {
      this.toggle = document.querySelector(CONFIG.selectors.burgerToggle);
      this.menu = document.querySelector(CONFIG.selectors.navbarCollapse);
      this.links = document.querySelectorAll(CONFIG.selectors.navLinks);
      this.isOpen = false;

      if (!this.toggle || !this.menu) return;

      this.bindEvents();
    },

    bindEvents() {
      this.toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMenu();
      });

      this.links.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= CONFIG.breakpoints.mobile) {
            this.close();
          }
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.menu.contains(e.target) && !this.toggle.contains(e.target)) {
          this.close();
        }
      });

      window.addEventListener('resize', Utils.debounce(() => {
        if (window.innerWidth > CONFIG.breakpoints.mobile && this.isOpen) {
          this.close();
        }
      }, CONFIG.timing.debounce));
    },

    toggleMenu() {
      this.isOpen ? this.close() : this.open();
    },

    open() {
      this.isOpen = true;
      this.menu.classList.add(CONFIG.classes.open);
      this.toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add(CONFIG.classes.noScroll);
      Utils.trapFocus(this.menu);
    },

    close() {
      this.isOpen = false;
      this.menu.classList.remove(CONFIG.classes.open);
      this.toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove(CONFIG.classes.noScroll);
    }
  };

  const SmoothScroll = {
    init() {
      this.bindEvents();
    },

    bindEvents() {
      document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"], a[href^="/#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;

        let targetId;

        if (href.startsWith('/#')) {
          targetId = href.substring(2);
        } else if (href.startsWith('#')) {
          targetId = href.substring(1);
        }

        if (!targetId) return;

        const target = document.getElementById(targetId);
        if (!target) return;

        e.preventDefault();
        const offset = Utils.getHeaderHeight();
        Utils.scrollTo(target, offset);
      });
    }
  };

  const ScrollSpy = {
    init() {
      this.sections = document.querySelectorAll(CONFIG.selectors.sections);
      this.navLinks = document.querySelectorAll(CONFIG.selectors.navLinks);

      if (!this.sections.length || !this.navLinks.length) return;

      this.update = Utils.throttle(() => this.handleScroll(), CONFIG.timing.throttle);
      window.addEventListener('scroll', this.update, { passive: true });
      this.handleScroll();
    },

    handleScroll() {
      const scrollPos = window.pageYOffset + Utils.getHeaderHeight() + 100;
      let currentSection = '';

      this.sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          currentSection = section.getAttribute('id');
        }
      });

      this.navLinks.forEach(link => {
        link.classList.remove(CONFIG.classes.active);
        link.removeAttribute('aria-current');

        const href = link.getAttribute('href');
        if (href === `#${currentSection}` || href === `/#${currentSection}`) {
          link.classList.add(CONFIG.classes.active);
          link.setAttribute('aria-current', 'page');
        }
      });
    }
  };

  const ActiveMenu = {
    init() {
      const path = window.location.pathname;
      const links = document.querySelectorAll(CONFIG.selectors.navLinks);

      links.forEach(link => {
        link.classList.remove(CONFIG.classes.active);
        link.removeAttribute('aria-current');

        const href = link.getAttribute('href') || '';

        if ((path === '/' || path === '/index.html') && (href === '/' || href === '/index.html' || href === 'index.html')) {
          link.classList.add(CONFIG.classes.active);
          link.setAttribute('aria-current', 'page');
        } else if (href && href !== '/' && href.startsWith('/')) {
          if (path.startsWith(href)) {
            link.classList.add(CONFIG.classes.active);
            link.setAttribute('aria-current', 'page');
          }
        }
      });
    }
  };

  const FormValidator = {
    patterns: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\d\s\+\-\(\)]{10,20}$/,
      name: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/
    },

    init() {
      this.forms = document.querySelectorAll(CONFIG.selectors.forms);
      this.forms.forEach(form => this.bindForm(form));
    },

    bindForm(form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.clearErrors(form);

        const isValid = this.validateForm(form);

        if (!isValid) {
          form.classList.add(CONFIG.classes.validated);
          return;
        }

        this.submitForm(form);
      });

      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          if (form.classList.contains(CONFIG.classes.validated)) {
            this.validateField(input);
          }
        });
      });
    },

    validateForm(form) {
      const fields = form.querySelectorAll('[required]');
      let isValid = true;

      fields.forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    },

    validateField(field) {
      const value = field.value.trim();
      const fieldName = field.getAttribute('name') || field.getAttribute('id');
      const fieldGroup = field.closest('.c-form__group') || field.closest('.form-group') || field.parentElement;
      let errorMessage = '';

      if (field.hasAttribute('required') && !value) {
        errorMessage = 'Dieses Feld ist erforderlich.';
      } else if (field.type === 'email' && value) {
        if (!this.patterns.email.test(value)) {
          errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        }
      } else if (field.type === 'tel' && value) {
        if (!this.patterns.phone.test(value)) {
          errorMessage = 'Bitte geben Sie eine gültige Telefonnummer ein.';
        }
      } else if ((fieldName === 'firstName' || fieldName === 'lastName' || fieldName === 'name') && value) {
        if (!this.patterns.name.test(value)) {
          errorMessage = 'Bitte geben Sie einen gültigen Namen ein.';
        }
      } else if (field.tagName === 'TEXTAREA' && value && value.length < 10) {
        errorMessage = 'Die Nachricht muss mindestens 10 Zeichen lang sein.';
      } else if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
        errorMessage = 'Bitte akzeptieren Sie die Bedingungen.';
      }

      if (errorMessage) {
        this.showError(fieldGroup, field, errorMessage);
        return false;
      } else {
        this.clearError(fieldGroup, field);
        return true;
      }
    },

    showError(group, field, message) {
      group.classList.add(CONFIG.classes.error);
      field.setAttribute('aria-invalid', 'true');

      let errorEl = group.querySelector('.c-form__error, .invalid-feedback');
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'c-form__error invalid-feedback';
        field.parentNode.appendChild(errorEl);
      }
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    },

    clearError(group, field) {
      group.classList.remove(CONFIG.classes.error);
      field.removeAttribute('aria-invalid');

      const errorEl = group.querySelector('.c-form__error, .invalid-feedback');
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    },

    clearErrors(form) {
      const groups = form.querySelectorAll(`.${CONFIG.classes.error}`);
      groups.forEach(group => {
        group.classList.remove(CONFIG.classes.error);
        const errorEl = group.querySelector('.c-form__error, .invalid-feedback');
        if (errorEl) {
          errorEl.style.display = 'none';
        }
      });

      const fields = form.querySelectorAll('[aria-invalid]');
      fields.forEach(field => field.removeAttribute('aria-invalid'));
    },

    submitForm(form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;

      submitBtn.disabled = true;
      submitBtn.classList.add(CONFIG.classes.disabled);
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';

      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove(CONFIG.classes.disabled);
        submitBtn.innerHTML = originalText;

        Notification.show('Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.', 'success');
        form.reset();
        form.classList.remove(CONFIG.classes.validated);
        this.clearErrors(form);

        setTimeout(() => {
          window.location.href = 'thank_you.html';
        }, 1000);
      }, 1500);
    }
  };

  const Notification = {
    container: null,

    init() {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;';
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'info') {
      if (!this.container) this.init();

      const toast = document.createElement('div');
      toast.className = `alert alert-${type} alert-dismissible fade show`;
      toast.setAttribute('role', 'alert');
      toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" aria-label="Schließen"></button>
      `;

      const closeBtn = toast.querySelector('.btn-close');
      closeBtn.addEventListener('click', () => {
        this.hide(toast);
      });

      this.container.appendChild(toast);

      setTimeout(() => {
        this.hide(toast);
      }, CONFIG.timing.notification);
    },

    hide(toast) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 150);
    }
  };

  const LazyImages = {
    init() {
      const images = document.querySelectorAll('img:not([loading])');
      images.forEach(img => {
        const isLogo = img.classList.contains('c-logo__img');
        const isCritical = img.hasAttribute('data-critical');

        if (!isLogo && !isCritical) {
          img.setAttribute('loading', 'lazy');
        }

        if (!img.classList.contains('img-fluid')) {
          img.classList.add('img-fluid');
        }

        img.addEventListener('error', () => {
          if (img.dataset.fallbackApplied) return;
          img.dataset.fallbackApplied = 'true';

          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#e9ecef" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d" font-size="18" font-family="sans-serif">Bild nicht verfügbar</text></svg>`;
          img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
        });
      });
    }
  };

  const Modal = {
    init() {
      this.bindTriggers();
    },

    bindTriggers() {
      const triggers = document.querySelectorAll(CONFIG.selectors.modalTrigger);
      triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          const modalId = trigger.getAttribute('data-modal-trigger');
          const modal = document.querySelector(`[data-modal="${modalId}"]`);
          if (modal) {
            this.open(modal);
          }
        });
      });
    },

    open(modal) {
      modal.classList.add(CONFIG.classes.open);
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add(CONFIG.classes.noScroll);

      this.createBackdrop();

      const closeBtn = modal.querySelector('[data-modal-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close(modal));
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.close(modal);
        }
      });

      Utils.trapFocus(modal);
    },

    close(modal) {
      modal.classList.remove(CONFIG.classes.open);
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove(CONFIG.classes.noScroll);

      this.removeBackdrop();
    },

    createBackdrop() {
      const backdrop = document.createElement('div');
      backdrop.className = 'c-modal-backdrop';
      backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1099;';
      document.body.appendChild(backdrop);

      backdrop.addEventListener('click', () => {
        const openModal = document.querySelector(`[data-modal].${CONFIG.classes.open}`);
        if (openModal) {
          this.close(openModal);
        }
      });
    },

    removeBackdrop() {
      const backdrop = document.querySelector('.c-modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  };

  const App = {
    init() {
      BurgerMenu.init();
      SmoothScroll.init();
      ScrollSpy.init();
      ActiveMenu.init();
      FormValidator.init();
      Notification.init();
      LazyImages.init();
      Modal.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.__app = {
    notify: (msg, type) => Notification.show(msg, type)
  };

})();
