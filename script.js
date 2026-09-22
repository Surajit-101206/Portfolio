(function () {
      function startSpaceEngine() {
        const canvas = document.getElementById('space-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let stars = [];
        let cursorStars = [];
        let nebulae = [];
        let meteors = [];
        let time = 0;

        const mouse = {
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          rawX: -1000,
          rawY: -1000,
          active: false
        };

        // --- Event Listeners ---
        window.addEventListener('mousemove', (e) => {
          mouse.rawX = e.clientX;
          mouse.rawY = e.clientY;
          mouse.targetX = (e.clientX - width / 2) * 0.12;
          mouse.targetY = (e.clientY - height / 2) * 0.12;
          mouse.active = true;

          // Spawn particle trail on cursor movement
          for (let i = 0; i < 2; i++) {
            cursorStars.push(new CursorStar(e.clientX, e.clientY));
          }
        });

        window.addEventListener('mouseleave', () => {
          mouse.active = false;
          mouse.rawX = -1000;
          mouse.rawY = -1000;
        });

        function resize() {
          dpr = Math.max(1, window.devicePixelRatio || 1);
          width = window.innerWidth;
          height = window.innerHeight;

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          initScene();
        }

        // --- Particle Classes ---
        class CursorStar {
          constructor(x, y) {
            this.x = x + (Math.random() - 0.5) * 8;
            this.y = y + (Math.random() - 0.5) * 8;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = Math.random() * 2.5 + 1;
            this.life = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;
            this.color = ['#ffffff', '#8ab4f8', '#c2e7ff', '#ffd1a5'][Math.floor(Math.random() * 4)];
          }

          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.95;
            this.vy *= 0.95;
            this.life -= this.decay;
          }

          draw() {
            if (this.life <= 0) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        class Star {
          constructor() {
            this.reset(true);
          }

          reset(randomZ = false) {
            this.x = (Math.random() - 0.5) * width * 2;
            this.y = (Math.random() - 0.5) * height * 2;
            this.z = randomZ ? Math.random() * width : width;
            this.pz = this.z;
            this.size = Math.random() * 1.5 + 0.5;
            this.baseColor = ['#ffffff', '#a5c0ff', '#ffd1a5', '#e1bee7'][Math.floor(Math.random() * 4)];
            this.twinklePhase = Math.random() * Math.PI * 2;
            this.offsetX = 0;
            this.offsetY = 0;
          }

          update(speed) {
            this.pz = this.z;
            this.z -= speed;
            if (this.z <= 1) this.reset(false);
          }

          draw() {
            const k = 400 / this.z;
            let px = this.x * k + width / 2 + mouse.x * (100 / this.z);
            let py = this.y * k + height / 2 + mouse.y * (100 / this.z);

            // Magnetic Cursor Interaction
            if (mouse.active) {
              const dx = mouse.rawX - px;
              const dy = mouse.rawY - py;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const maxRadius = 160;

              if (dist < maxRadius) {
                const pull = (1 - dist / maxRadius) * 30;
                this.offsetX += (dx / dist * pull - this.offsetX) * 0.1;
                this.offsetY += (dy / dist * pull - this.offsetY) * 0.1;
              } else {
                this.offsetX *= 0.9;
                this.offsetY *= 0.9;
              }
            } else {
              this.offsetX *= 0.9;
              this.offsetY *= 0.9;
            }

            px += this.offsetX;
            py += this.offsetY;

            if (px < 0 || px > width || py < 0 || py > height) return;

            const pk = 400 / this.pz;
            const prevX = this.x * pk + width / 2 + mouse.x * (100 / this.pz) + this.offsetX;
            const prevY = this.y * pk + height / 2 + mouse.y * (100 / this.pz) + this.offsetY;

            const radius = Math.max(0.3, (1 - this.z / width) * this.size * 2);
            const alpha = Math.min(1, Math.max(0, (1 - this.z / width) * 1.5)) * (0.6 + 0.4 * Math.sin(time * 0.05 + this.twinklePhase));

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.baseColor;
            ctx.fillStyle = this.baseColor;
            ctx.lineWidth = radius;

            // Velocity streak
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(px, py);
            ctx.stroke();

            // Star dot
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }

        class Nebula {
          constructor(hue, xFactor, yFactor) {
            this.hue = hue;
            this.xFactor = xFactor;
            this.yFactor = yFactor;
            this.baseRadius = Math.random() * 250 + 200;
            this.phase = Math.random() * Math.PI * 2;
          }

          draw() {
            const x = width * this.xFactor + Math.sin(time * 0.01 + this.phase) * 40 + mouse.x * 0.3;
            const y = height * this.yFactor + Math.cos(time * 0.012 + this.phase) * 40 + mouse.y * 0.3;
            const currentRadius = this.baseRadius + Math.sin(time * 0.02 + this.phase) * 30;

            const grad = ctx.createRadialGradient(x, y, 0, x, y, currentRadius);
            grad.addColorStop(0, `hsla(${this.hue}, 80%, 35%, 0.18)`);
            grad.addColorStop(0.5, `hsla(${this.hue + 20}, 70%, 20%, 0.08)`);
            grad.addColorStop(1, 'transparent');

            ctx.save();
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        class Meteor {
          constructor() {
            this.reset();
          }

          reset() {
            this.x = Math.random() * width * 1.2;
            this.y = -50;
            this.length = Math.random() * 150 + 100;
            this.speedX = -(Math.random() * 10 + 8);
            this.speedY = Math.random() * 10 + 8;
            this.size = Math.random() * 2 + 1;
            this.alpha = 1;
            this.active = false;
          }

          spawn() {
            this.reset();
            this.active = true;
          }

          update() {
            if (!this.active) return;
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= 0.015;

            if (this.alpha <= 0 || this.x < -200 || this.y > height + 200) {
              this.active = false;
            }
          }

        draw() {
            if (!this.active) return;
            const tailX = this.x - this.speedX * (this.length / 10);
            const tailY = this.y - this.speedY * (this.length / 10);

            const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#70a1ff');
            grad.addColorStop(1, 'transparent');

            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.strokeStyle = grad;
            ctx.lineWidth = this.size;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
            ctx.restore();
        }
        }

        function initScene() {
          stars = [];
          const count = Math.floor((width * height) / 2200);
          for (let i = 0; i < count; i++) {
            stars.push(new Star());
          }

          nebulae = [
            new Nebula(260, 0.25, 0.3),
            new Nebula(310, 0.75, 0.4),
            new Nebula(200, 0.50, 0.75)
          ];

          meteors = [new Meteor(), new Meteor(), new Meteor()];
        }

        setInterval(() => {
          const inactive = meteors.find(m => !m.active);
          if (inactive) inactive.spawn();
        }, 1000);

        // --- Render Loop ---
        function animate() {
          time++;

          mouse.x += (mouse.targetX - mouse.x) * 0.05;
          mouse.y += (mouse.targetY - mouse.y) * 0.05;

          ctx.fillStyle = '#020208';
          ctx.fillRect(0, 0, width, height);

          // Render layers
          nebulae.forEach(n => n.draw());

          const flightSpeed = 5.0; // Rapid visible forward flight speed
          stars.forEach(s => {
            s.update(flightSpeed);
            s.draw();
          });

          meteors.forEach(m => {
            m.update();
            m.draw();
          });

          for (let i = cursorStars.length - 1; i >= 0; i--) {
            cursorStars[i].update();
            cursorStars[i].draw();
            if (cursorStars[i].life <= 0) {
              cursorStars.splice(i, 1);
            }
          }

          requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        animate();
      }

      // Safe boot on DOM Ready or Window Load
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startSpaceEngine();
      } else {
        document.addEventListener('DOMContentLoaded', startSpaceEngine);
        window.addEventListener('load', startSpaceEngine);
      }
    })();