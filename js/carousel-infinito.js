const carruseles = document.querySelectorAll("[data-carousel]");
const estadosCarrusel = new WeakMap();

const marcarClon = (elemento) => {
  elemento.setAttribute("aria-hidden", "true");
  elemento.dataset.clon = "true";
  return elemento;
};

const medirPaso = (estado) => {
  const primerItem = estado.pista.querySelector(".proyecto-reel");

  if (!primerItem) {
    estado.paso = 0;
    return;
  }

  const estilos = getComputedStyle(estado.pista);
  const separacion = parseFloat(estilos.columnGap || estilos.gap) || 0;
  estado.paso = primerItem.getBoundingClientRect().width + separacion;
};

const moverA = (estado, nuevaPosicion, animar = true) => {
  estado.posicion = nuevaPosicion;
  estado.pista.classList.toggle("sin-transicion", !animar);
  estado.pista.style.transform = `translateX(${-estado.posicion * estado.paso}px)`;

  if (!animar) {
    estado.pista.offsetHeight;
    estado.pista.classList.remove("sin-transicion");
  }
};

const normalizarPosicion = (estado) => {
  if (estadosCarrusel.get(estado.carrusel) !== estado) {
    return;
  }

  const cantidad = estado.originales.length;

  if (estado.posicion >= cantidad * 2) {
    moverA(estado, estado.posicion - cantidad, false);
  }

  if (estado.posicion < cantidad) {
    moverA(estado, estado.posicion + cantidad, false);
  }

  estado.bloqueado = false;
};

const moverCarrusel = (carrusel, direccion) => {
  const estado = estadosCarrusel.get(carrusel);

  if (!estado || estado.bloqueado || !estado.paso) {
    return;
  }

  estado.bloqueado = true;
  moverA(estado, estado.posicion + direccion);
  clearTimeout(estado.temporizador);
  estado.temporizador = setTimeout(() => normalizarPosicion(estado), 700);
};

const conectarEventos = (carrusel) => {
  if (carrusel.dataset.carouselListo === "true") {
    return;
  }

  const pista = carrusel.querySelector("[data-carousel-track]");
  const botonAnterior = carrusel.querySelector("[data-carousel-prev]");
  const botonSiguiente = carrusel.querySelector("[data-carousel-next]");

  botonAnterior?.addEventListener("click", () => moverCarrusel(carrusel, -1));
  botonSiguiente?.addEventListener("click", () => moverCarrusel(carrusel, 1));

  pista?.addEventListener("transitionend", (evento) => {
    if (evento.propertyName !== "transform") {
      return;
    }

    const estado = estadosCarrusel.get(carrusel);

    if (!estado) {
      return;
    }

    clearTimeout(estado.temporizador);
    normalizarPosicion(estado);
  });

  carrusel.dataset.carouselListo = "true";
};

const prepararCarrusel = (carrusel) => {
  const pista = carrusel.querySelector("[data-carousel-track]");
  const botonAnterior = carrusel.querySelector("[data-carousel-prev]");
  const botonSiguiente = carrusel.querySelector("[data-carousel-next]");

  if (!pista || !botonAnterior || !botonSiguiente) {
    return;
  }

  const estadoAnterior = estadosCarrusel.get(carrusel);

  if (estadoAnterior) {
    clearTimeout(estadoAnterior.temporizador);
  }

  pista.querySelectorAll("[data-clon='true']").forEach((clon) => clon.remove());
  pista.classList.add("sin-transicion");
  pista.style.transform = "translateX(0)";

  const originales = Array.from(pista.children);

  if (!originales.length) {
    return;
  }

  originales
    .map((elemento) => marcarClon(elemento.cloneNode(true)))
    .forEach((clon) => pista.appendChild(clon));

  originales
    .slice()
    .reverse()
    .map((elemento) => marcarClon(elemento.cloneNode(true)))
    .forEach((clon) => pista.insertBefore(clon, pista.firstChild));

  const estado = {
    bloqueado: false,
    carrusel,
    originales,
    paso: 0,
    pista,
    posicion: originales.length,
    temporizador: null,
  };

  estadosCarrusel.set(carrusel, estado);
  conectarEventos(carrusel);
  medirPaso(estado);
  moverA(estado, estado.posicion, false);
};

const activarCategoria = (categoria) => {
  const galeria = document.querySelector("[data-project-gallery]");
  const pista = galeria?.querySelector("[data-carousel-track]");
  const plantilla = document.querySelector(`[data-project-template="${categoria}"]`);

  if (!galeria || !pista || !plantilla) {
    return;
  }

  pista.innerHTML = plantilla.innerHTML;
  galeria.setAttribute(
    "aria-label",
    `Proyectos destacados: ${plantilla.dataset.projectLabel}`
  );

  document.querySelectorAll("[data-project-tab]").forEach((tab) => {
    const activo = tab.dataset.projectTab === categoria;
    tab.classList.toggle("activo", activo);
    tab.setAttribute("aria-selected", activo ? "true" : "false");
  });

  prepararCarrusel(galeria);
};

document.querySelectorAll("[data-project-tab]").forEach((tab) => {
  tab.addEventListener("click", () => activarCategoria(tab.dataset.projectTab));
});

const tabInicial =
  document.querySelector("[data-project-tab].activo") ||
  document.querySelector("[data-project-tab]");

if (tabInicial) {
  activarCategoria(tabInicial.dataset.projectTab);
} else {
  carruseles.forEach((carrusel) => prepararCarrusel(carrusel));
}

window.addEventListener("resize", () => {
  carruseles.forEach((carrusel) => {
    const estado = estadosCarrusel.get(carrusel);

    if (!estado) {
      return;
    }

    medirPaso(estado);
    moverA(estado, estado.posicion, false);
  });
});
