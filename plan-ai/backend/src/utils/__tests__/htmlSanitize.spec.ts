import { describe, it, expect } from "vitest";
import {
  finalizePrototypeHtml,
  findHtmlSyntaxErrors,
  hasStructuralErrors,
  sanitizePrototypeHtml,
  wrapPrototypeDocument,
} from "../htmlSanitize";

const body = "<div><h1>Comandas</h1><p>Mesa 4 con dos entrantes pendientes de servir.</p></div>";

describe("sanitizePrototypeHtml — hostile input", () => {
  /**
   * The prospect's message reaches the model that writes this HTML, and the
   * result is served from our own domain. A surviving script runs on the same
   * origin as the logged-in app: stored XSS with a stranger as the author.
   */
  it("removes script tags", () => {
    const result = sanitizePrototypeHtml(`${body}<script>alert(document.cookie)</script>`);
    expect(result?.html).not.toContain("<script");
    expect(result?.html).not.toContain("alert(");
  });

  it("removes inline event handlers", () => {
    const result = sanitizePrototypeHtml(`<div onclick="steal()" onmouseover="x()">${body}</div>`);
    expect(result?.html).not.toContain("onclick");
    expect(result?.html).not.toContain("onmouseover");
  });

  it("removes javascript: URLs", () => {
    const result = sanitizePrototypeHtml(`${body}<a href="javascript:alert(1)">click</a>`);
    expect(result?.html?.toLowerCase()).not.toContain("javascript:");
  });

  it("removes iframes and objects", () => {
    const result = sanitizePrototypeHtml(
      `${body}<iframe src="//evil.com"></iframe><object></object>`,
    );
    expect(result?.html).not.toContain("<iframe");
    expect(result?.html).not.toContain("<object");
  });

  it("strips external references so the page cannot phone home", () => {
    const result = sanitizePrototypeHtml(`${body}<img src="https://tracker.example/pixel.gif">`);
    expect(result?.html).not.toContain("tracker.example");
    expect(result?.removed).toContain("external-refs");
  });

  /** DOMPurify does not parse <style> contents, so these need their own pass. */
  it("neutralises remote URLs inside a style block", () => {
    const result = sanitizePrototypeHtml(
      `<style>body{background:url('https://evil.com/x.png')}</style>${body}`,
    );
    expect(result?.html).not.toContain("evil.com");
  });

  it("blocks @import in CSS", () => {
    const result = sanitizePrototypeHtml(`<style>@import url('//evil.com/x.css');</style>${body}`);
    expect(result?.html).not.toContain("@import");
    expect(result?.html).not.toContain("evil.com");
  });

  it("removes base tags that would rewrite every relative URL", () => {
    const result = sanitizePrototypeHtml(`<base href="//evil.com">${body}`);
    expect(result?.html).not.toContain("<base");
  });
});

describe("sanitizePrototypeHtml — legitimate content", () => {
  it("keeps structure and inline styles", () => {
    const result = sanitizePrototypeHtml(
      `<style>.card{padding:16px}</style><div class="card"><h1>Comandas</h1><p>Mesa 4 pendiente</p></div>`,
    );
    expect(result?.html).toContain("Comandas");
    expect(result?.html).toContain("card");
    expect(result?.html).toContain("padding:16px");
  });

  it("keeps inline SVG, which prototypes use for icons", () => {
    const result = sanitizePrototypeHtml(
      `${body}<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`,
    );
    expect(result?.html).toContain("<svg");
    expect(result?.html).toContain("circle");
  });

  it("unwraps a markdown fence the model added anyway", () => {
    const result = sanitizePrototypeHtml("```html\n" + body + "\n```");
    expect(result?.html).toContain("Comandas");
    expect(result?.html).not.toContain("```");
  });
});

describe("sanitizePrototypeHtml — rejections", () => {
  it("rejects empty input", () => {
    expect(sanitizePrototypeHtml("")).toBeNull();
    expect(sanitizePrototypeHtml("   ")).toBeNull();
  });

  it("rejects markup with no readable text", () => {
    expect(sanitizePrototypeHtml("<div><span></span></div>")).toBeNull();
  });

  it("rejects a document that is only a script", () => {
    expect(sanitizePrototypeHtml("<script>alert(1)</script>")).toBeNull();
  });

  it("rejects oversized output", () => {
    expect(sanitizePrototypeHtml(`<div>${"x".repeat(500_000)}</div>`)).toBeNull();
  });
});

describe("wrapPrototypeDocument", () => {
  it("produces a responsive document", () => {
    const doc = wrapPrototypeDocument("<h1>Hola</h1>", "Comandas");
    expect(doc).toContain("<!DOCTYPE html>");
    expect(doc).toContain("width=device-width");
    expect(doc).toContain("<title>Comandas</title>");
  });

  it("cannot have its title broken out of", () => {
    const doc = wrapPrototypeDocument("<h1>x</h1>", "</title><script>alert(1)</script>");
    expect(doc).not.toContain("<script");
  });
});

describe("findHtmlSyntaxErrors — el 'compilador' de HTML", () => {
  it("no reporta nada en HTML bien formado", () => {
    const errors = findHtmlSyntaxErrors(
      "<!DOCTYPE html><html><head><title>x</title></head><body><div><p>Hola</p></div></body></html>",
    );
    expect(errors).toEqual([]);
  });

  /**
   * Un <div> sin cerrar NO es un error: el estándar define etiquetas de cierre
   * implícitas, el navegador lo repara y no se pierde nada. Marcarlo como fallo
   * rechazaría prototipos perfectamente válidos.
   */
  it("no marca como error un div sin cerrar, porque no se pierde contenido", () => {
    const errors = findHtmlSyntaxErrors("<div><p>Hola</div>");
    expect(hasStructuralErrors(errors)).toBe(false);
  });

  /**
   * El caso que sí importa: un <style> sin cerrar se traga TODA la página. El
   * navegador no protesta y el cliente ve una pantalla en blanco.
   */
  it("detecta un <style> sin cerrar, que deja la página vacía", () => {
    const errors = findHtmlSyntaxErrors("<style>body{color:red}<div><h1>Comandas</h1></div>");
    expect(hasStructuralErrors(errors)).toBe(true);
    expect(errors.some((e) => e.includes("eof-in-element"))).toBe(true);
  });

  it("detecta una comilla de atributo sin cerrar, que también vacía la página", () => {
    const errors = findHtmlSyntaxErrors('<div class="card><h1>Comandas</h1></div>');
    expect(hasStructuralErrors(errors)).toBe(true);
  });

  it("no considera estructural un doctype ausente ni un atributo duplicado", () => {
    expect(hasStructuralErrors(findHtmlSyntaxErrors("<div>x</div>"))).toBe(false);
    expect(hasStructuralErrors(findHtmlSyntaxErrors('<div class="a" class="b">x</div>'))).toBe(
      false,
    );
  });

  it("detecta atributos duplicados", () => {
    const errors = findHtmlSyntaxErrors('<div class="a" class="b">x</div>');
    expect(errors.some((e) => e.includes("duplicate-attribute"))).toBe(true);
  });

  it("informa del número de línea", () => {
    const errors = findHtmlSyntaxErrors("<html>\n<body>\n<div>\n</body></html>");
    expect(errors.some((e) => /línea \d+/.test(e))).toBe(true);
  });

  it("acota el número de errores para no inundar los logs", () => {
    expect(findHtmlSyntaxErrors("<div>".repeat(500), 10).length).toBeLessThanOrEqual(10);
  });

  it("expone los errores en el resultado del saneado", () => {
    const result = sanitizePrototypeHtml("<div><p>Mesa 4 pendiente de servir dos entrantes</div>");
    expect(result?.syntaxErrors.length).toBeGreaterThan(0);
  });
});

describe("regresiones de seguridad (revisión adversarial)", () => {
  /**
   * ReDoS: `url(` + una tira larga de espacios sin esquema provocaba retroceso
   * cuadrático en el hilo principal (64k → ~4.8s). Corre inline en el proceso de
   * la API, así que un stall ahí congela TODAS las rutas y los WebSockets.
   */
  it("sanea una tira patológica de url() en tiempo lineal, no cuadrático", () => {
    const evil = `<style>a{background:url(${" ".repeat(200_000)}x)}</style><div><p>Mesa 4 pendiente de servir</p></div>`;
    const start = Date.now();
    sanitizePrototypeHtml(evil);
    // El caso cuadrático tardaría decenas de segundos con 200k; lineal termina holgado.
    expect(Date.now() - start).toBeLessThan(1000);
  });

  it("sigue neutralizando un url() remoto tras el arreglo del ReDoS", () => {
    const result = sanitizePrototypeHtml(
      `<style>a{background:url('https://evil.example/x.png')}</style><div><p>Mesa 4 pendiente</p></div>`,
    );
    expect(result?.html).not.toContain("evil.example");
  });

  /**
   * CSP: es el backstop real contra las peticiones salientes, porque los regex
   * de CSS no ven a través de las secuencias de escape de CSS. `default-src
   * 'none'` bloquea cualquier subrecurso aunque un url() escapado sobreviva.
   */
  it("el documento envuelto lleva una CSP que bloquea todo subrecurso", () => {
    const doc = wrapPrototypeDocument("<h1>Hola</h1>", "Comandas");
    expect(doc).toContain("Content-Security-Policy");
    expect(doc).toContain("default-src 'none'");
    // La CSS inline del propio prototipo debe seguir permitida.
    expect(doc).toContain("style-src 'unsafe-inline'");
  });
});

describe("navegación multipantalla (:target)", () => {
  const flow = `<style>.screen{display:none}.screen:target{display:block}</style>
    <section id="p1"><a href="#p2">Siguiente</a></section>
    <section id="p2"><a href="#p1">Volver</a></section>`;

  it("permite enlaces de fragmento interno para el flujo :target", () => {
    const result = sanitizePrototypeHtml(flow);
    expect(result?.html).toContain('href="#p2"');
    expect(result?.html).toContain('href="#p1"');
  });

  it("preserva el pseudo-selector :target en el CSS", () => {
    expect(sanitizePrototypeHtml(flow)?.html).toContain(":target");
  });

  it("sigue bloqueando un href externo aunque ahora se permitan fragmentos", () => {
    const result = sanitizePrototypeHtml(
      `<section id="p1"><a href="https://evil.example/x">fuera</a><p>Mesa 4 pendiente</p></section>`,
    );
    expect(result?.html).not.toContain("evil.example");
  });

  it("sigue bloqueando href='javascript:' pese a permitir fragmentos", () => {
    const result = sanitizePrototypeHtml(
      `<section id="p1"><a href="javascript:alert(1)">x</a><p>Mesa 4 pendiente de servir</p></section>`,
    );
    expect(result?.html?.toLowerCase()).not.toContain("javascript:");
  });

  it("bloquea un href de protocolo relativo //", () => {
    const result = sanitizePrototypeHtml(
      `<section id="p1"><a href="//evil.example/x">x</a><p>Mesa 4 pendiente de servir</p></section>`,
    );
    expect(result?.html).not.toContain("evil.example");
  });
});

describe("finalizePrototypeHtml — pestañas deterministas", () => {
  const raw = `<style>.card{padding:12px}</style>
    <section class="berry-screen" data-title="Catálogo"><h1>Cactus</h1><a href="#nope">Ver</a></section>
    <section class="berry-screen" data-title="Ficha"><h1>Echeveria</h1></section>
    <section class="berry-screen" data-title="Cesta"><h1>Tu cesta</h1></section>`;
  const build = () => finalizePrototypeHtml(sanitizePrototypeHtml(raw)!.html, "Prototipo");

  it("genera una radio por pantalla, con la primera activa", () => {
    const html = build();
    expect((html.match(/type="radio"/g) || []).length).toBe(3);
    expect((html.match(/ checked/g) || []).length).toBe(1);
  });

  it("construye una pestaña por pantalla con su data-title", () => {
    const html = build();
    expect(html).toContain(">Catálogo<");
    expect(html).toContain(">Ficha<");
    expect(html).toContain(">Cesta<");
  });

  it("elimina cualquier href que dejara el modelo (navegación la ponemos nosotros)", () => {
    expect(build()).not.toContain("#nope");
  });

  it("cae a una sola pantalla cuando el modelo ignora la convención", () => {
    const noScreens = finalizePrototypeHtml(
      sanitizePrototypeHtml(
        "<div><h1>Hola</h1><p>Contenido de una sola vista sin secciones</p></div>",
      )!.html,
      "Prototipo",
      { emptyLabel: "Pantalla" },
    );
    expect((noScreens.match(/type="radio"/g) || []).length).toBe(1);
    expect(noScreens).toContain(">Pantalla<");
  });

  it("produce UN solo documento, no dos anidados", () => {
    expect((build().match(/<html/g) || []).length).toBe(1);
  });

  it("conserva la CSP y el CSS del modelo", () => {
    const html = build();
    expect(html).toContain("default-src 'none'");
    expect(html).toContain(".card{padding:12px}");
  });
});
