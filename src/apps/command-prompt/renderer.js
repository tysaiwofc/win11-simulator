document.querySelector('.window-control.minimize').addEventListener('click', () => {
  window.electronAPI.minimizeWindow();  // Minimize a janela
});

document.querySelector('.window-control.close').addEventListener('click', () => {
  window.electronAPI.closeWindow();  // Fechar a janela
});

const input = document.getElementById("cmdInput");
const output = document.getElementById("output");

const commands = {
  help: () => `
Comandos disponíveis:
- help
- clear
- echo [mensagem]
- open notepad
- open explorer
- shutdown
- version
  `,
  clear: () => {
    output.innerHTML = "";
    return "";
  },
  echo: (args) => args.join(" "),
  version: () => "Windows 11 CMD Simulator - v1.0",
  shutdown: () => "Simulador encerrado (simulado)",
  "open notepad": () => "Abrindo Bloco de Notas (simulado)...",
  "open explorer": () => "Abrindo Explorador de Arquivos (simulado)..."
};

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const commandLine = input.value;
    const [cmd, ...args] = commandLine.trim().split(" ");
    const full = commandLine.trim().toLowerCase();

    // Exibe o comando na saída
    appendOutput(`C:\\Windows\\System32> ${commandLine}`);

    // Executa o comando
    if (commands[full]) {
      appendOutput(commands[full](args));
    } else if (commands[cmd]) {
      appendOutput(commands[cmd](args));
    } else {
      appendOutput(`'${cmd}' não é reconhecido como um comando interno ou externo.`);
    }

    input.value = "";
    scrollToBottom();
  }
});

function appendOutput(text) {
  if (text === "") return;
  const lines = text.split("\n");
  lines.forEach(line => {
    const div = document.createElement("div");
    div.textContent = line;
    output.appendChild(div);
  });
}

function scrollToBottom() {
  output.scrollTop = output.scrollHeight;
}
