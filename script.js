(function () {
  var started = false;

  function startSpaceEngine() {
    if (started) return;
    started = true;

    var canvas = document.getElementById("space-canvas");
    var ctx = canvas && canvas.getContext("2d");
    if (!ctx) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var BASE_SPEED = reduced ? 0.5 : 5;
    var COLORS = ["#ffffff", "#a5c0ff", "#ffd1a5", "#e1bee7"];

    var width = 0,
      height = 0,
      time = 0,
      sy = 0;
    var cons = [];
    var stars = [],
      nebulae = [],
      meteors = [];

    function rand(a, b) {
      return a + Math.random() * (b - a);
    }
    function pick(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    // ---------- Scene objects ----------
    function Star() {
      this.reset(true);
    }
    Star.prototype.reset = function (randomZ) {
      this.x = (Math.random() - 0.5) * width * 2;
      this.y = (Math.random() - 0.5) * height * 2;
      this.z = randomZ ? Math.random() * width : width;
      this.pz = this.z;
      this.size = rand(0.5, 2);
      this.color = pick(COLORS);
      this.phase = Math.random() * Math.PI * 2;
    };
    Star.prototype.update = function (speed) {
      this.pz = this.z;
      this.z -= speed;
      if (this.z <= 1) this.reset(false);
    };
    Star.prototype.draw = function () {
      var k = 400 / this.z;
      var px = this.x * k + width / 2;
      var py = this.y * k + height / 2;
      if (px < 0 || px > width || py < 0 || py > height) return;
      var pk = 400 / this.pz;
      var radius = Math.max(0.3, (1 - this.z / width) * this.size * 2);
      ctx.globalAlpha =
        Math.min(1, Math.max(0, (1 - this.z / width) * 1.5)) *
        (0.6 + 0.4 * Math.sin(time * 0.05 + this.phase));
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      ctx.lineWidth = radius;
      ctx.beginPath();
      ctx.moveTo(this.x * pk + width / 2, this.y * pk + height / 2);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    function Nebula(hue, xf, yf) {
      this.hue = hue;
      this.xf = xf;
      this.yf = yf;
      this.base = rand(200, 450);
      this.phase = Math.random() * Math.PI * 2;
    }
    Nebula.prototype.draw = function () {
      var x = width * this.xf + Math.sin(time * 0.01 + this.phase) * 40;
      var y =
        height * this.yf + Math.cos(time * 0.012 + this.phase) * 40 - sy * 0.1;
      var r = this.base + Math.sin(time * 0.02 + this.phase) * 30;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "hsla(" + this.hue + ", 85%, 40%, 0.26)");
      g.addColorStop(0.5, "hsla(" + (this.hue + 20) + ", 75%, 24%, 0.12)");
      g.addColorStop(1, "hsla(" + this.hue + ", 70%, 20%, 0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    function Meteor() {
      this.active = false;
    }
    Meteor.prototype.spawn = function () {
      this.x = Math.random() * width * 1.2;
      this.y = -50;
      this.len = rand(100, 250);
      this.vx = -rand(8, 18);
      this.vy = rand(8, 18);
      this.size = rand(1, 3);
      this.alpha = 1;
      this.active = true;
    };
    Meteor.prototype.update = function () {
      if (!this.active) return;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.015;
      if (this.alpha <= 0 || this.x < -200 || this.y > height + 200)
        this.active = false;
    };
    Meteor.prototype.draw = function () {
      if (!this.active) return;
      var tx = this.x - this.vx * (this.len / 10);
      var ty = this.y - this.vy * (this.len / 10);
      var g = ctx.createLinearGradient(this.x, this.y, tx, ty);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, "#70a1ff");
      g.addColorStop(1, "rgba(112, 161, 255, 0)");
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.strokeStyle = g;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 1.5, 0, Math.PI * 2);
      ctx.fill();
    };

    // ---------- Background extras: aurora, ringed planet, constellations (they drift with scroll) ----------
    window.addEventListener(
      "scroll",
      function () {
        sy = window.scrollY || 0;
      },
      { passive: true },
    );

    function drawAurora() {
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      var hues = [160, 200, 285];
      for (var k = 0; k < 3; k++) {
        for (var l = 0; l < 3; l++) {
          ctx.beginPath();
          for (var x = 0; x <= width + 20; x += 20) {
            var y =
              height * (0.2 + k * 0.1) +
              Math.sin(x * 0.004 + time * 0.008 + k * 2) * 60 +
              Math.sin(x * 0.011 - time * 0.011 + k) * 25 -
              sy * (0.05 + 0.03 * k);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = "hsla(" + hues[k] + ", 90%, 60%, 0.035)";
          ctx.lineWidth = 24 + l * 34;
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function planetRing(cx, cy, r, back) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35);
      ctx.scale(1, 0.28);
      var radii = [1.45, 1.62, 1.85],
        hues = [265, 215, 300];
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          r * radii[i],
          back ? Math.PI : 0,
          back ? Math.PI * 2 : Math.PI,
        );
        ctx.strokeStyle =
          "hsla(" + hues[i] + ", 80%, 70%, " + (0.5 - i * 0.12) + ")";
        ctx.lineWidth = r * (0.14 - i * 0.03);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawPlanet() {
      var r = Math.min(width, height) * 0.3;
      var cx = width * 0.86,
        cy = height * 0.86 - sy * 0.2;
      ctx.globalAlpha = 1;
      var glow = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.8);
      glow.addColorStop(0, "rgba(138, 120, 255, 0.3)");
      glow.addColorStop(1, "rgba(138, 120, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
      ctx.fill();
      planetRing(cx, cy, r, true);
      var body = ctx.createRadialGradient(
        cx - r * 0.4,
        cy - r * 0.4,
        r * 0.1,
        cx,
        cy,
        r,
      );
      body.addColorStop(0, "#d3c2ff");
      body.addColorStop(0.45, "#6a4fd6");
      body.addColorStop(1, "#0b0a2a");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      for (var i = 0; i < 8; i++) {
        var by = cy - r + (i * r) / 3.8 + Math.sin(time * 0.01 + i) * 4;
        ctx.fillStyle =
          i % 2 ? "rgba(255, 220, 255, 0.07)" : "rgba(20, 10, 80, 0.16)";
        ctx.fillRect(cx - r, by, r * 2, r / 9);
      }
      // Surface storms circle the globe, so the planet visibly spins (left to right)
      for (var sp = 0; sp < 14; sp++) {
        var lat = (((sp * 0.37) % 1) - 0.5) * 1.9;
        var lon = sp * 2.399 + time * 0.003;
        var vis = Math.cos(lon);
        if (vis <= 0) continue;
        var fx = cx + r * Math.cos(lat) * Math.sin(lon);
        var fy = cy + r * Math.sin(lat);
        var fr = r * (0.06 + (sp % 4) * 0.025);
        ctx.fillStyle =
          sp % 3
            ? "rgba(255, 225, 255, " + 0.16 * vis + ")"
            : "rgba(25, 10, 90, " + 0.28 * vis + ")";
        ctx.beginPath();
        ctx.ellipse(fx, fy, fr * 1.4 * vis, fr * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      planetRing(cx, cy, r, false);
    }

    function initConstellation() {
      cons = [];
      var n = Math.min(70, Math.floor(width / 18));
      for (var i = 0; i < n; i++)
        cons.push({
          x: Math.random() * width,
          y: Math.random() * height * 1.5,
          p: Math.random() * Math.PI * 2,
        });
    }

    function drawConstellation() {
      var pts = [];
      for (var i = 0; i < cons.length; i++) {
        var c = cons[i];
        var x = c.x + Math.sin(time * 0.005 + c.p) * 12;
        var y = c.y - sy * 0.35 + Math.cos(time * 0.004 + c.p) * 12;
        if (y > -60 && y < height + 60) pts.push({ x: x, y: y, p: c.p });
      }
      ctx.lineWidth = 1;
      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var d = Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
          if (d < 150) {
            ctx.globalAlpha = 0.16 * (1 - d / 150);
            ctx.strokeStyle = "#8ab4f8";
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "#c2e7ff";
      for (var j = 0; j < pts.length; j++) {
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(time * 0.05 + pts[j].p);
        ctx.beginPath();
        ctx.arc(pts[j].x, pts[j].y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ---------- Setup ----------
    function resize() {
      var oldWidth = width;
      var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Rebuild only when the width changes, so mobile address-bar resizes don't reshuffle the sky.
      if (width !== oldWidth) initScene();
    }

    function initScene() {
      var count = Math.min(1400, Math.floor((width * height) / 2400));
      stars = [];
      for (var i = 0; i < count; i++) stars.push(new Star());
      nebulae = [
        new Nebula(260, 0.25, 0.3),
        new Nebula(310, 0.75, 0.4),
        new Nebula(200, 0.5, 0.75),
        new Nebula(335, 0.12, 0.8),
        new Nebula(180, 0.9, 0.12),
      ];
      meteors = [new Meteor(), new Meteor(), new Meteor(), new Meteor()];
      initConstellation();
    }

    if (!reduced) {
      setInterval(function () {
        if (document.hidden) return;
        for (var i = 0; i < meteors.length; i++) {
          if (!meteors[i].active) {
            meteors[i].spawn();
            break;
          }
        }
      }, 1000);
    }

    // ---------- Render loop ----------
    function animate() {
      time += reduced ? 0.15 : 1;
      var speed = BASE_SPEED;

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#020208";
      ctx.fillRect(0, 0, width, height);

      for (var n = 0; n < nebulae.length; n++) nebulae[n].draw();
      drawAurora();
      drawPlanet();
      drawConstellation();
      for (var s = 0; s < stars.length; s++) {
        stars[s].update(speed);
        stars[s].draw();
      }
      for (var m = 0; m < meteors.length; m++) {
        meteors[m].update();
        meteors[m].draw();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    resize();
    animate();
  }

  // Page effects: reveal on scroll, scroll progress bar, typed intro line
  function startPage() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var bar = document.getElementById("progress");
    var typed = document.getElementById("typed");
    var els = document.querySelectorAll(
      "section h2, section > p, section .actions, .chips li, .card",
    );

    for (var i = 0; i < els.length; i++) els[i].classList.add("reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      for (var j = 0; j < els.length; j++) els[j].classList.add("in");
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
              (function (t) {
                setTimeout(function () {
                  t.style.transitionDelay = "";
                }, 1400);
              })(e.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      for (var k = 0; k < els.length; k++) {
        els[k].style.transitionDelay =
          Array.prototype.indexOf.call(els[k].parentNode.children, els[k]) *
            90 +
          "ms";
        io.observe(els[k]);
      }
    }

    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar)
        bar.style.transform =
          "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    // Hover and click effects for buttons and project cards (ripple on click, spotlight on hover)
    function ripple(el, x, y) {
      var rect = el.getBoundingClientRect();
      var host = el.querySelector(".fx") || el;
      var dot = document.createElement("span");
      dot.className = "ripple";
      dot.style.left = x - rect.left + "px";
      dot.style.top = y - rect.top + "px";
      dot.style.setProperty("--s", Math.max(rect.width, rect.height) / 6);
      host.appendChild(dot);
      setTimeout(function () {
        dot.remove();
      }, 750);
    }
    var cards = document.querySelectorAll(".card");
    for (var c = 0; c < cards.length; c++) {
      var fx = document.createElement("span");
      fx.className = "fx";
      fx.setAttribute("aria-hidden", "true");
      cards[c].appendChild(fx);
      cards[c].addEventListener("pointermove", function (e) {
        var r = this.getBoundingClientRect();
        this.style.setProperty("--mx", e.clientX - r.left + "px");
        this.style.setProperty("--my", e.clientY - r.top + "px");
      });
    }
    var pressables = document.querySelectorAll(".btn, .card");
    for (var p = 0; p < pressables.length; p++) {
      pressables[p].addEventListener("pointerdown", function (e) {
        if (!reduced) ripple(this, e.clientX, e.clientY);
      });
    }

    if (typed && !reduced) {
      var words = [
          "JavaScript.",
          "HTML and CSS.",
          "React.",
          "Canvas animation.",
        ],
        w = 0,
        ch = 0,
        del = false;
      (function tick() {
        var word = words[w];
        ch += del ? -1 : 1;
        typed.textContent = word.slice(0, ch);
        var wait = del ? 40 : 90;
        if (!del && ch === word.length) {
          del = true;
          wait = 1400;
        } else if (del && ch === 0) {
          del = false;
          w = (w + 1) % words.length;
          wait = 300;
        }
        setTimeout(tick, wait);
      })();
    }
  }

  function boot() {
    startSpaceEngine();
    startPage();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
