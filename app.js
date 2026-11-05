(() => {
  const films = [
    {
      title: "爱乐之城",
      original: "LA LA LAND",
      year: "2016",
      poster: "./assets/la-la-land.jpg",
      video: "./assets/la-la-land.mp4",
      description: "La La Land tells the story of Mia and Sebastian, who meet and fall in love in Los Angeles. They chase their dreams and struggle between ambition and love, ending with tender regret."
    },
    {
      title: "星际穿越",
      original: "INTERSTELLAR",
      year: "2014",
      poster: "./assets/interstellar.jpg",
      video: "./assets/video-44f6.mp4",
      description: "Cooper travels across stars to find a habitable planet. He realizes love transcends time and space in the fifth dimension and saves humanity with data."
    },
    {
      title: "黑客帝国",
      original: "THE MATRIX",
      year: "1999",
      poster: "./assets/matrix.jpg",
      video: "./assets/video-dbe6.mp4",
      description: "Neo discovers the world is a virtual Matrix built by machines. Awakened as the One, he fights to free humanity from enslavement.",
      variant: "matrix",
      mark: "M"
    },
    {
      title: "海上钢琴师",
      original: "THE LEGEND OF 1900",
      year: "1998",
      poster: "./assets/legend-1900.jpg",
      video: "./assets/video-418f.mp4",
      description: "1900, a talented pianist, is born and grows up on an ocean liner. He plays wonderful music inspired by passengers and the sea. Though offered chances for fame on land, he refuses to leave the ship, choosing to stay with his pure musical world forever.",
      variant: "legend",
      mark: "1900"
    },
    {
      title: "死亡诗社",
      original: "DEAD POETS SOCIETY",
      year: "1989",
      poster: "./assets/dead-poets.jpg",
      video: "./assets/video-1b21.mp4",
      description: "Set in a strict boarding school, the film follows Mr. Keating, an unusual teacher. He inspires his students to read poetry, value individuality and seize the day. His special teaching awakens the teenagers’ passion to pursue their own dreams.",
      variant: "poets",
      mark: "O"
    },
    {
      title: "泰坦尼克号",
      original: "TITANIC",
      year: "1997",
      poster: "./assets/titanic.jpg",
      video: "./assets/video-1c48.mp4",
      description: "Titanic is a classic romantic film. Rose and Jack meet on the luxury ship Titanic. Despite huge class gaps, they fall deeply in love. When the ship hits an iceberg and sinks, Jack sacrifices himself to save Rose, leaving her to cherish their memory for a lifetime."
    }
  ];

  const site = document.querySelector("#site");
  const intro = document.querySelector("#intro");
  const library = document.querySelector("#library");
  const backButton = document.querySelector("#back-to-intro");
  const shelf = document.querySelector("#shelf");
  const track = document.querySelector("#track");
  const currentNumber = document.querySelector("#current-number");
  const currentTitle = document.querySelector("#current-title");
  const progressFill = document.querySelector("#scroll-meter-fill");

  const OPEN_ANGLE = 75;
  const CLOSED_SCALE = 0.38;
  const MIN_GAP = 40;
  const CLOSE_DELAY = 130;
  const HOVER_OPEN_DELAY = 3000;

  let movies = [];
  let activeMovie = null;
  let closeTimer = 0;
  let openTimer = 0;
  let pan = 0;
  let panRange = { min: 0, max: 0 };
  let metrics = [];
  let pointerDown = false;
  let dragStartX = 0;
  let dragStartPan = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function posterMarkup(film) {
    if (film.poster) {
      return `
        <div class="poster-art">
          <img src="${film.poster}" alt="${film.title}电影海报">
        </div>
      `;
    }

    return `
      <div class="poster-fallback" data-variant="${film.variant}">
        <span class="fallback-chip">POSTER · READY TO REPLACE</span>
        <div class="fallback-mark"><span>${film.mark}</span></div>
      </div>
    `;
  }

  function mediaMarkup(film) {
    if (film.video) {
      return `
        <video
          src="${film.video}"
          poster="${film.poster}"
          muted
          autoplay
          loop
          playsinline
          preload="metadata"
          controls
          aria-label="${film.title}视频"
        ></video>
      `;
    }

    return `
      <div class="video-placeholder">
        <span class="video-placeholder__ring" aria-hidden="true"></span>
        <strong>VIDEO PLACEHOLDER</strong>
        <small>视频待添加</small>
      </div>
    `;
  }

  function descriptionMarkup(film) {
    if (film.description) {
      return `<p class="detail-copy__description">${film.description}</p>`;
    }

    return `
      <p class="detail-copy__description detail-copy__placeholder">
        影片介绍待添加。你可以直接在 app.js 的 films 数据中补充文字、图片和视频路径。
      </p>
    `;
  }

  function renderMovies() {
    track.innerHTML = films.map((film, index) => `
      <article
        class="movie"
        data-index="${index}"
        data-title="${film.title}"
        tabindex="0"
        aria-label="${film.title}，${film.year}"
      >
        <div class="book">
          <div class="book__spine" aria-hidden="true"></div>
          <div class="book__cover">
            ${posterMarkup(film)}
            <div class="cover-copy">
              <span class="cover-copy__index">${String(index + 1).padStart(2, "0")} / 06</span>
              <h2>${film.title}</h2>
              <p>${film.original} · ${film.year}</p>
            </div>
          </div>
          <div class="book__detail">
            <div class="detail-media">${mediaMarkup(film)}</div>
            <div class="detail-copy">
              <span class="detail-copy__number">${String(index + 1).padStart(2, "0")} / 06</span>
              <h2>${film.title}</h2>
              <p class="detail-copy__original">${film.original} · ${film.year}</p>
              ${descriptionMarkup(film)}
              <div class="detail-copy__meta"><span></span>ROMANCE ARCHIVE</div>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    movies = [...track.querySelectorAll(".movie")];
    bindMovieEvents();
  }

  function viewportMetrics() {
    const width = window.innerWidth;
    const openWidth = movies[0]?.offsetWidth || 820;
    const closedWidth = openWidth * Math.cos(OPEN_ANGLE * Math.PI / 180) * CLOSED_SCALE;
    const step = Math.max(closedWidth + 25, Math.min(135, width / 7.6));
    return { width, openWidth, closedWidth, step };
  }

  function calculateLayout() {
    if (!movies.length) return;

    const { width, openWidth, closedWidth, step } = viewportMetrics();
    const openIndex = activeMovie ? Number(activeMovie.dataset.index) : -1;
    const outerMargin = clamp(width * 0.035, 18, 58);
    const centerX = width / 2;

    metrics = movies.map((movie, index) => {
      let center;
      let visualWidth = closedWidth;

      if (openIndex === -1) {
        center = centerX + (index - (movies.length - 1) / 2) * step;
      } else if (index === openIndex) {
        center = centerX;
        visualWidth = openWidth;
      } else if (index < openIndex) {
        center = centerX - openWidth / 2 - MIN_GAP - closedWidth / 2 - (openIndex - index - 1) * step;
      } else {
        center = centerX + openWidth / 2 + MIN_GAP + closedWidth / 2 + (index - openIndex - 1) * step;
      }

      return {
        x: center - openWidth / 2,
        visualLeft: center - visualWidth / 2,
        visualRight: center + visualWidth / 2,
        movie
      };
    });

    const minLeft = Math.min(...metrics.map((item) => item.visualLeft));
    const maxRight = Math.max(...metrics.map((item) => item.visualRight));
    const contentWidth = maxRight - minLeft;

    if (contentWidth <= width - outerMargin * 2) {
      panRange = { min: 0, max: 0 };
      pan = 0;
    } else {
      panRange = {
        min: width - outerMargin - maxRight,
        max: outerMargin - minLeft
      };
      pan = clamp(pan, panRange.min, panRange.max);
    }

    applyLayout();
  }

  function applyLayout() {
    metrics.forEach(({ x, movie }) => {
      movie.style.setProperty("--x", `${x + pan}px`);
    });

    if (panRange.max <= panRange.min) {
      progressFill.style.width = "100%";
      progressFill.style.setProperty("--progress-x", "0");
      return;
    }

    const progress = clamp((pan - panRange.min) / (panRange.max - panRange.min), 0, 1);
    progressFill.style.width = "22%";
    progressFill.style.setProperty("--progress-x", `${progress * (window.innerWidth / 0.22 - window.innerWidth)}px`);
  }

  function pauseMovie(movie) {
    const video = movie.querySelector("video");
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  function setActive(movie) {
    window.clearTimeout(closeTimer);
    window.clearTimeout(openTimer);
    openTimer = 0;
    if (movie === activeMovie) return;

    if (activeMovie) {
      activeMovie.classList.remove("is-open");
      pauseMovie(activeMovie);
    }

    activeMovie = movie;

    if (movie) {
      movie.classList.add("is-open");
      currentNumber.textContent = String(Number(movie.dataset.index) + 1).padStart(2, "0");
      currentTitle.textContent = movie.dataset.title;
      const video = movie.querySelector("video");
      if (video) {
        video.play().catch(() => {});
      }
    } else {
      currentNumber.textContent = "01";
      currentTitle.textContent = "爱乐之城";
    }

    calculateLayout();
  }

  function scheduleOpen(movie) {
    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(() => {
      openTimer = 0;
      if (movie.matches(":hover")) setActive(movie);
    }, HOVER_OPEN_DELAY);
  }

  function scheduleClose(movie) {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (activeMovie === movie && !movie.matches(":hover")) {
        setActive(null);
      }
    }, CLOSE_DELAY);
  }

  function bindMovieEvents() {
    movies.forEach((movie) => {
      movie.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") scheduleOpen(movie);
      });

      movie.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse") {
          window.clearTimeout(openTimer);
          openTimer = 0;
          scheduleClose(movie);
        }
      });

      movie.addEventListener("focus", () => setActive(movie));
      movie.addEventListener("click", () => {
        if (activeMovie !== movie) {
          setActive(movie);
        }
      });
      movie.addEventListener("blur", () => {
        if (!movies.some((item) => item.matches(":focus"))) setActive(null);
      });
    });
  }

  function enterLibrary() {
    if (site.dataset.view === "library") return;
    site.dataset.view = "library";
    library.setAttribute("aria-hidden", "false");
    document.body.classList.remove("is-intro");
    document.body.classList.add("is-library");
    requestAnimationFrame(() => {
      calculateLayout();
    });
  }

  function returnToIntro() {
    setActive(null);
    site.dataset.view = "intro";
    library.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-library");
    document.body.classList.add("is-intro");
    intro.focus({ preventScroll: true });
  }

  intro.addEventListener("click", enterLibrary);
  intro.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      enterLibrary();
    }
  });
  backButton.addEventListener("click", (event) => {
    event.stopPropagation();
    returnToIntro();
  });

  shelf.addEventListener("pointerleave", () => {
    if (!movies.some((movie) => movie.matches(":focus"))) {
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
      openTimer = 0;
      setActive(null);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (site.dataset.view !== "library") return;
    if (event.key === "Escape") {
      if (activeMovie) {
        setActive(null);
        activeMovie = null;
      } else {
        returnToIntro();
      }
    }
  });

  document.addEventListener("wheel", (event) => {
    if (site.dataset.view !== "library") return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    pan = clamp(pan - delta * 0.9, panRange.min, panRange.max);
    applyLayout();
  }, { passive: false });

  shelf.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") return;
    pointerDown = true;
    dragStartX = event.clientX;
    dragStartPan = pan;
  });

  window.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    pan = clamp(dragStartPan + event.clientX - dragStartX, panRange.min, panRange.max);
    applyLayout();
  });

  window.addEventListener("pointerup", () => {
    pointerDown = false;
  });
  window.addEventListener("resize", calculateLayout);

  renderMovies();
  requestAnimationFrame(calculateLayout);

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get("view") === "library") {
    enterLibrary();
  }

  const requestedFilm = searchParams.get("film");
  if (requestedFilm !== null) {
    const index = clamp(Number.parseInt(requestedFilm, 10), 0, films.length - 1);
    if (Number.isInteger(index)) {
      enterLibrary();
      requestAnimationFrame(() => requestAnimationFrame(() => setActive(movies[index])));
    }
  }
})();
