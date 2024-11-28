window.onload = function () {
    // Obtém o canvas e o contexto 2D
    let ctx = document.getElementById("C"),
        c = ctx.getContext("2d"),
        w,
        h;
    
    fitCanvas(); // Ajusta o tamanho do canvas

    // Classe Attractor (Atraidor)
    class Attractor {
        constructor(id) {
            this.ind = id; // Identificador do atraidor
            this.controlledByMouse = id === 0; // Verifica se é controlado pelo mouse
            this.x = Math.random() * w; // Posição X aleatória
            this.y = Math.random() * h; // Posição Y aleatória
            this.vx = 0; // Velocidade X inicial
            this.vy = 0; // Velocidade Y inicial
            this.ax = 0; // Aceleração X inicial
            this.ay = 0; // Aceleração Y inicial
            this.polarity = id % 2 === 0 ? -1 : 1; // Define a polaridade
            this.color = this.polarity === 1 ? "216,100%,50%" : "0,100%,50%"; // Define a cor com base na polaridade

            // Cria linhas para atraidores de polaridade negativa
            if (this.polarity === -1) {
                for (let i = 0; i < LPAtt; i++) {
                    let ang = (i * 2 * Math.PI) / LPAtt; // Calcula o ângulo
                    let x = Math.cos(ang); // Coordenada X
                    let y = Math.sin(ang); // Coordenada Y
                    lines.push(new Line(this, x, y)); // Adiciona nova linha
                }
            }
        }

        // Calcula as forças entre os atraidores
        calcForces(others) {
            for (let other of others) {
                if (other === this) continue; // Ignora o próprio atraidor

                let dx = other.x - this.x; // Diferença em X
                let dy = other.y - this.y; // Diferença em Y
                let d = Math.sqrt(dx * dx + dy * dy); // Distância entre os atraidores

                if (d < max_d) { // Se a distância for menor que a máxima
                    let attractForce = this.polarity * other.polarity > 0 ? -1 : 1; // Define a força de atração
                    let inv_d = max_d - d; // Inverte a distância
                    let ang = Math.atan2(dy, dx); // Calcula o ângulo
                    let mag = d > att_size * 2 ? 
                        attractForce * att_spd / ((max_d * max_d) / (inv_d * inv_d)) :
                        -1 * att_spd / ((max_d * max_d) / (inv_d * inv_d)); // Magnitude da força

                    this.ax += mag * Math.cos(ang); // Atualiza a aceleração X
                    this.ay += mag * Math.sin(ang); // Atualiza a aceleração Y
                }
            }
        }

        // Atualiza a posição do atraidor
        update(mouse) {
            if (this.controlledByMouse) { // Se controlado pelo mouse
                this.x = mouse.x; // Atualiza a posição X
                this.y = mouse.y; // Atualiza a posição Y
                if (mouseDown && mouseCounter === 0) {
                    this.polarity *= -1; // Inverte a polaridade
                    this.color = this.polarity > 0 ? "216,100%,50%" : "0,100%,50%"; // Atualiza a cor
                    mouseCounter++; // Incrementa o contador do mouse
                }
                if (!mouseDown && mouseCounter !== 0) {
                    mouseCounter = 0; // Reseta o contador se o mouse não estiver pressionado
                }
            } else {
                // Atualiza a posição com base na velocidade e aceleração
                this.vx += this.ax; // Atualiza a velocidade X
                this.vy += this.ay; // Atualiza a velocidade Y
                this.vx *= 0.6; // Fator de amortecimento
                this.vy *= 0.6; // Fator de amortecimento
                this.x += this.vx; // Atualiza a posição X
                this.y += this.vy; // Atualiza a posição Y
                this.ax = 0; // Reseta a aceleração X
                this.ay = 0; // Reseta a aceleração Y

                // Faz o atraidor quicar nas bordas
                if (this.x < att_size || this.x > w - att_size) {
                    this.x = Math.max(att_size, Math.min(w - att_size, this.x)); // Restringe a posição X
                    this.vx *= -1; // Inverte a velocidade X
                }
                if (this.y < att_size || this.y > h - att_size) {
                    this.y = Math.max(att_size, Math.min(h - att_size, this.y)); // Restringe a posição Y
                    this.vy *= -1; // Inverte a velocidade Y
                }
            }
        }

        // Desenha o atraidor no canvas
        show() {
            // Desenha efeito de brilho
            for (let i = 0; i < 11; i++) {
                c.beginPath();
                c.arc(this.x, this.y, att_size * (i / 4) * (i / 4), 0, 2 * Math.PI); // Desenha um arco
                c.fillStyle = `hsla(${this.color},${Math.pow(1 - i / 10, 2)})`; // Define a cor com base na opacidade
                c.fill(); // Preenche o arco
            }

            // Desenha o núcleo
            c.beginPath();
            c.arc(this.x, this.y, att_size, 0, 2 * Math.PI); // Desenha o núcleo
            c.fillStyle = `hsl(${this.color})`; // Define a cor do núcleo
            c.fill(); // Preenche o núcleo
        }
    }

    // Classe Line (Linha)
    class Line {
        constructor(parent, x, y) {
            this.p = parent; // Atraidor pai
            this.ox = x; // Coordenada X original
            this.oy = y; // Coordenada Y original
            this.tail = []; // Cauda da linha
            this.reset(); // Reseta a linha
            this.tail.push({ x: this.p.x, y: this.p.y }); // Adiciona a posição inicial
            this.tail.push({ x: this.x, y: this.y }); // Adiciona a posição original
        }

        reset() {
            this.x = this.p.x + this.ox; // Reseta a posição X
            this.y = this.p.y + this.oy; // Reseta a posição Y
        }

        // Atualiza a linha
        update() {
            this.tail = []; // Limpa a cauda
            for (let i = 0; i < segment_num; i++) {
                let earlyExit = false; // Flag para saída antecipada
                let dpos = 1e6, dneg = 1e6; // Distâncias positivas e negativas
                let vx = 0, vy = 0; // Velocidades X e Y

                for (let t of att) {
                    let v2x = (t.x - this.x) * t.polarity; // Cálculo da velocidade X
                    let v2y = (t.y - this.y) * t.polarity; // Cálculo da velocidade Y
                    let d = Math.sqrt(v2x * v2x + v2y * v2y); // Distância

                    if (d < dneg && t.polarity === -1) dneg = d; // Atualiza a distância negativa
                    if (d < dpos && t.polarity === 1) dpos = d; // Atualiza a distância positiva
                    if (d < segment_length * 1.2 && t.polarity === 1) {
                        earlyExit = true; // Saída antecipada se a distância for curta
                    }

                    vx += v2x / (d * d); // Atualiza a velocidade X
                    vy += v2y / (d * d); // Atualiza a velocidade Y
                }

                let vd = Math.sqrt(vx * vx + vy * vy); // Calcula a magnitude da velocidade
                vx /= vd; // Normaliza a velocidade X
                vy /= vd; // Normaliza a velocidade Y
                this.x += vx * segment_length; // Atualiza a posição X
                this.y += vy * segment_length; // Atualiza a posição Y

                if (earlyExit) break; // Sai do loop se necessário
                this.tail.push({ x: this.x, y: this.y }); // Adiciona nova posição à cauda
            }
        }

        // Desenha a linha no canvas
        show() {
            c.beginPath(); // Inicia um novo caminho
            for (let point of this.tail) {
                c.lineTo(point.x, point.y); // Desenha a linha até o ponto
            }
            c.strokeStyle = "white"; // Define a cor da linha
            c.lineWidth = line_width; // Define a largura da linha
            c.stroke(); // Desenha a linha
        }
    }

    // Configuração
    let LPAtt = 50, // Número de linhas por atraidor
        att_num = 2, // Número inicial de atraidores
        att_spd = 3, // Velocidade de atração
        segment_length = 10, // Comprimento do segmento da linha
        segment_num = 1000, // Número de segmentos
        att_max_d = 150, // Distância máxima
        max_d = Math.sqrt(w * w + h * h); // Distância máxima calculada

    let att_size = segment_length + 1, // Tamanho do atraidor
        line_width = 0.5; // Largura da linha

    let mouse = { x: false, y: false }, // Objeto para armazenar a posição do mouse
        mouseDown = false, // Flag para verificar se o mouse está pressionado
        mouseCounter = 0; // Contador de cliques do mouse

    let att = [], // Array para armazenar os atraidores
        lines = []; // Array para armazenar as linhas

    // Cria os atraidores
    for (let i = 0; i < att_num; i++) {
        att.push(new Attractor(i)); // Adiciona um novo atraidor
    }

    function draw() {
        // Limpa o canvas
        c.clearRect(0, 0, w, h);

        // Atualiza e desenha os atraidores
        for (let a of att) {
            a.calcForces(att); // Calcula as forças
            a.update(mouse); // Atualiza a posição
        }

        // Atualiza e desenha as linhas
        for (let l of lines) {
            l.reset(); // Reseta a linha
            l.update(); // Atualiza a linha
            l.show(); // Desenha a linha
        }

        // Desenha os atraidores por cima
        for (let a of att) {
            a.show(); // Desenha o atraidor
        }
    }

    // Adiciona um novo atraidor ao clicar no botão "add"
    document.getElementById('add').addEventListener('click', function() {
        att_num += 1; // Incrementa o número de atraidores
        att.push(new Attractor(att.length - 1)); // Adiciona um novo atraidor
    });
    
    // Remove um atraidor ao clicar no botão "remove"
    document.getElementById('remove').addEventListener('click', function() {
        if (att.length > 0 && att_num >= 3) {
            att_num -= 1; // Decrementa o número de atraidores
            att.pop(); // Remove a última instância de Attractor
            lines = []; // Reseta o array de linhas
            // Recria as linhas para todos os atraidores restantes
            for (let attractor of att) {
                for (let i = 0; i < LPAtt; i++) {
                    let ang = (i * 2 * Math.PI) / LPAtt; // Calcula o ângulo
                    let x = Math.cos(ang); // Coordenada X
                    let y = Math.sin(ang); // Coordenada Y
                    lines.push(new Line(attractor, x, y)); // Adiciona nova linha
                }
            }
        }
    });

    // Eventos de toque para dispositivos móveis
    ctx.addEventListener("touchmove", function (e) {
        e.preventDefault(); // Previne o scroll
        const touch = e.touches[0]; // Obtém a posição do toque
        mouse.x = touch.pageX - this.offsetLeft; // Atualiza a posição X do mouse
        mouse.y = touch.pageY - this.offsetTop; // Atualiza a posição Y do mouse
    }, false);
    
    ctx.addEventListener("touchstart", function (e) {
        mouseDown = true; // Define que o mouse está pressionado
    }, false);
    
    ctx.addEventListener("touchend", function (e) {
        mouseDown = false; // Define que o mouse não está pressionado
    }, false);

    ctx.addEventListener("mousemove", function (e) {
        mouse.x = e.pageX - this.offsetLeft; // Atualiza a posição X do mouse
        mouse.y = e.pageY - this.offsetTop; // Atualiza a posição Y do mouse
    }, false);

    ctx.addEventListener("mousedown", function (e) {
        mouseDown = true; // Define que o mouse está pressionado
    }, false);

    ctx.addEventListener("mouseup", function (e) {
        mouseDown = false; // Define que o mouse não está pressionado
    }, false);

    let lastTouchTime = 0; // Variável para armazenar o último tempo de toque

    // Evento de toque para detectar toques rápidos
    document.addEventListener('touchstart', function(event) {
        const currentTime = new Date().getTime(); // Obtém o tempo atual
        const timeDifference = currentTime - lastTouchTime; // Calcula a diferença de tempo

        if (timeDifference < 300 && timeDifference > 0) {
            mouseDown = true; // Define que o mouse está pressionado
        } else {
            mouseDown = false; // Define que o mouse não está pressionado
        }

        lastTouchTime = currentTime; // Atualiza o último tempo de toque
    });

    // Ajusta o tamanho do canvas
    function fitCanvas() {
        w = ctx.width = window.innerWidth; // Define a largura do canvas
        h = ctx.height = window.innerHeight; // Define a altura do canvas
    }

    // Função de loop para animação
    function loop() {
        fitCanvas(); // Ajusta o tamanho do canvas
        draw(); // Desenha os elementos
        window.requestAnimationFrame(loop); // Solicita o próximo frame
    }

    window.requestAnimationFrame(loop); // Inicia o loop de animação
};